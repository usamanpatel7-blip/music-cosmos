/* ============================================================ превью Apple
   Каталог звучит: тридцать секунд на запись, прямо из витрины Apple.

   Ключ — идентификатор трека в Apple Music. Он уже лежит в данных (T.i,
   4334 из 4334), поэтому поиска по названию нет вовсе: «Времена года» не
   могут вернуть чужую запись, а «Prelude in C» — любую из сорока.

   Ответ забирается тегом <script> (JSONP), а не запросом. Причина простая:
   itunes.apple.com не отдаёт заголовки CORS, тег ими и не связан, и это
   единственный способ, который работает ещё и с file:// — страница обязана
   открываться двойным щелчком.

   Само аудио не скачивается и не хранится: <audio> играет ссылку витрины,
   рядом всегда есть переход в Apple Music. Кешируются только адреса —
   иначе каждый второй клик стоил бы запроса, а у витрины есть предел
   (порядка двадцати обращений в минуту).

   Наружу: MCPlayer.resolve(ids, sf, cb) · .info(id) · .play(id, sf, meta)
   · .toggle() · .stop() · .on(name, fn) · .current().
   События: 'track' (id, meta), 'state' (playing|paused|loading|error|idle),
   'time' (прошло, всего), 'resolved' (список id).                          */
var MCPlayer=(function(){
"use strict";

var P={API:'https://itunes.apple.com/lookup'};   /* подменяется в стенде */
var KEY='mc.preview.1', TTL=30*864e5, CAP=6000, BATCH=100, WAIT=9000;

/* запись кеша: id → [адрес превью или 0, обложка, когда узнали, ссылка] */
var C={}, dirty=false, now=Date.now();
try{
  C=JSON.parse(localStorage.getItem(KEY)||'{}')||{};
  for(var x in C) if(!C[x]||now-C[x][2]>TTL) delete C[x];
}catch(e){ C={}; }
function save(){
  if(!dirty) return; dirty=false;
  var k,a;
  try{
    k=Object.keys(C);
    if(k.length>CAP){                       /* тесно — выбрасываем старьё */
      k.sort(function(p,q){ return C[q][2]-C[p][2]; });
      for(a=CAP;a<k.length;a++) delete C[k[a]];
    }
    localStorage.setItem(KEY,JSON.stringify(C));
  }catch(e){}                               /* приватное окно, квота — не беда */
}
addEventListener('pagehide',save);
document.addEventListener('visibilitychange',function(){ if(document.hidden) save(); });

/* ------------------------------------------------------------- два пути
   Основной — тег <script> с обёрткой (JSONP): заголовков CORS витрина не
   отдаёт, а тег ими не связан, и только так страница работает с file://.
   Запасной — обычный запрос: если витрина однажды перестанет заворачивать
   ответ в обёртку, на сайте по http(s) звук останется, а с file:// его в
   любом случае не спасти — там запрос запрещён самим браузером. */
var seq=0;
function jsonp(url,ok,bad){
  var name='__mcp'+(++seq), s=document.createElement('script'), t=0,
      fired=false, over=false;
  function clean(){
    if(over) return; over=true;
    clearTimeout(t);
    try{ delete window[name]; }catch(e){ window[name]=void 0; }
    if(s.parentNode) s.parentNode.removeChild(s);
  }
  window[name]=function(d){ fired=true; clean(); ok(d); };
  s.onerror=function(){ clean(); bad('net'); };
  /* Скрипт выполнился, а обёртка не позвала — обёртки в ответе не было. */
  s.onload=function(){ if(!fired){ clean(); bad('nocb'); } };
  t=setTimeout(function(){ clean(); bad('timeout'); },WAIT);
  s.src=url+'&callback='+name;
  document.head.appendChild(s);
}
function plain(url,ok,bad){
  if(!window.fetch){ bad(); return; }
  fetch(url,{mode:'cors',credentials:'omit'}).then(function(r){
    if(!r.ok) throw 0;
    return r.json();
  }).then(ok).catch(function(){ bad(); });
}
/* Какой путь сработал, браузер запоминает. Ответ без обёртки исполняется как
   скрипт и один раз роняет в консоль ошибку разбора — пусть это случится
   единожды за браузер, а не при каждом запросе. */
var TR=null;
try{ TR=localStorage.getItem(KEY+'.tr'); }catch(e){}
function setTR(v){
  if(TR===v) return;
  TR=v;
  try{ localStorage.setItem(KEY+'.tr',v); }catch(e){}
}
function web(){ return /^https?:$/.test(location.protocol); }
function request(url,ok,bad){
  if(TR==='plain'&&web()){ plain(url,ok,bad); return; }
  jsonp(url,function(d){ setTR('jsonp'); ok(d); },function(why){
    if(why==='nocb'&&web()){ setTR('plain'); plain(url,ok,bad); }
    else bad();
  });
}

/* --------------------------------------------------------------- справки */
function info(id){
  var c=C[String(id)];
  if(!c) return null;
  return {url:c[0]||'',art:c[1]||'',link:c[3]||'',known:true,has:!!c[0]};
}
/* Один и тот же адрес не спрашивается дважды: пока запрос в пути, id помечен
   занятым, а тот, кому он тоже понадобился, ждёт чужого ответа. Без этого
   предзагрузка соседей отбирала бы ответ у нажатой кнопки. */
var busy={}, waiting=[];
function settle(ok){
  var l=waiting; waiting=[];
  for(var i=0;i<l.length;i++) l[i](ok);
}
function resolve(ids,sf,cb){
  var need=[],seen={},held=0,i,id;
  for(i=0;i<ids.length;i++){
    id=String(ids[i]||'');
    if(!id||C[id]||seen[id]) continue;
    seen[id]=1;
    if(busy[id]){ held++; continue; }
    if(need.length<BATCH) need.push(id);
  }
  if(!need.length){
    if(!cb) return;
    if(held) waiting.push(cb); else cb([]);
    return;
  }
  for(i=0;i<need.length;i++) busy[need[i]]=1;
  request(P.API+'?country='+(sf||'us')+'&entity=song&id='+need.join(','),function(d){
    var r=(d&&d.results)||[],j,v,k2,ts=Date.now();
    for(j=0;j<r.length;j++){
      v=r[j]; k2=String(v.trackId||'');
      if(!k2) continue;
      C[k2]=[v.previewUrl||0,
             (v.artworkUrl100||'').replace('100x100bb','256x256bb'),
             ts, v.trackViewUrl||''];
    }
    /* Ответ пришёл, а трека в нём нет — значит его в витрине нет. Это тоже
       знание, и его стоит запомнить: иначе кнопка будет спрашивать вечно. */
    for(j=0;j<need.length;j++){ if(!C[need[j]]) C[need[j]]=[0,'',ts,'']; delete busy[need[j]]; }
    dirty=true; save(); fire('resolved',need);
    if(cb) cb(need);
    settle(need);
  },function(){
    /* Сети не было — это не «трека нет». Ничего не помечаем, спросим позже. */
    for(var j=0;j<need.length;j++) delete busy[need[j]];
    if(cb) cb(null);
    settle(null);
  });
}

/* ---------------------------------------------------------------- события */
var subs={};
function on(n,f){ (subs[n]||(subs[n]=[])).push(f); }
function fire(n,a,b){
  var l=subs[n]; if(!l) return;
  for(var i=0;i<l.length;i++) l[i](a,b);
}

/* ------------------------------------------------------------------ звук */
var SILENT='data:audio/wav;base64,UklGRnQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';
var au=null, cur='', meta=null, want='', state='idle';
function el(){
  if(au) return au;
  au=new Audio(); au.preload='auto';
  /* Все обработчики молчат, пока не играет запись: разблокирующая тишина
     тоже кончается и тоже шлёт события — и без охраны выдавала бы себя
     за доигравший трек, а список уходил бы на следующий. */
  au.addEventListener('playing',function(){ if(cur) set('playing'); });
  au.addEventListener('pause',function(){ if(cur) set('paused'); });
  au.addEventListener('waiting',function(){ if(cur) set('loading'); });
  au.addEventListener('error',function(){ if(cur) set('error'); });
  au.addEventListener('timeupdate',function(){
    if(cur) fire('time',au.currentTime,au.duration||30);
  });
  au.addEventListener('ended',function(){
    if(!cur) return;
    var was=cur; set('ended'); fire('ended',was);
  });
  return au;
}
function set(s){ if(s!==state){ state=s; fire('state',s,cur); } }

/* Первое касание страницы разблокирует звук: к моменту, когда витрина
   ответит адресом, жеста уже нет, и Safari откажет. Тишина в 0,01 с
   этого не стоит. */
var free=false;
function unlock(){
  if(free||cur) return; free=true;
  var a=el(); a.src=SILENT;
  var p=a.play(); if(p&&p.catch) p.catch(function(){ free=false; });
}
addEventListener('pointerdown',unlock,{capture:true,once:false});
addEventListener('keydown',unlock,{capture:true,once:false});

function start(id){
  var c=info(id);
  if(!c||!c.has){ cur=''; set('error'); return; }
  cur=String(id);
  var a=el();
  a.src=c.url; set('loading');
  var p=a.play();
  if(p&&p.catch) p.catch(function(){ set('paused'); });
}
/* Событие 'track' уходит один раз и сразу: панель успевает показать, что
   именно грузится, ещё до ответа витрины. */
function play(id,sf,m){
  id=String(id||'');
  if(!id) return;
  if(id===cur&&au){ if(au.paused) au.play(); else au.pause(); return; }
  want=id; meta=m||null; cur='';
  fire('track',id,meta);
  if(info(id)){ start(id); return; }
  set('loading');
  resolve([id],sf,function(ok){
    if(want!==id) return;
    if(info(id)){ start(id); return; }
    set(ok===null?'offline':'error');
  });
}
function toggle(){
  if(!cur||!au) return;
  if(au.paused) au.play(); else au.pause();
}
function stop(){
  want=''; cur=''; meta=null;
  if(au){ au.pause(); au.removeAttribute('src'); au.load(); }
  set('idle');
}

P.resolve=resolve; P.info=info; P.play=play; P.toggle=toggle; P.stop=stop;
P.on=on; P.current=function(){ return cur; }; P.state=function(){ return state; };
P.meta=function(){ return meta; };
return P;
})();
