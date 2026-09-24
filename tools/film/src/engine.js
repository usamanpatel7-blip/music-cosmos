/* Движок сцен фильма «Моя музыкальная эволюция».
   Каждая сцена — функция времени фильма t (секунды): рисует кадр заново
   в виде строки SVG (viewBox 1600×900). Ризограф: синие линии, заливки со
   сдвигом, «умножение» цветов. Компоненты Remotion (Film.tsx) раскладывают
   сцены по главам и добавляют бумагу, «кипение» линий, шторку и субтитры. */
import TIMING from './timing.json';

/* ---------------------------------------------------------------- цвета
   Ризограф: синие линии, флуоресцентный розовый и жёлтый, бирюза.
   Заливки печатаются со сдвигом относительно линий — как при плохой
   приводке, — а цветные ложатся «умножением». */
var PAPER='#f4ecd9', INK='#23308a', PINK='#ff5d8f', YEL='#ffd23c', TEAL='#19a7a0', GREY='#c9bfae', DARK='#2a2440';
var S=TIMING.sent.map(function(s){ return s.t0; });
var SE=TIMING.sent.map(function(s){ return s.t1; });
var END=170;
var O=[];                                   /* разметка текущего кадра */
var MIS=[5,4];                              /* сдвиг заливок, как при плохой приводке */
var OPQ=false;                              /* герой: заливки плотные, без «умножения» */
function cl(v,a,b){ a=a==null?0:a; b=b==null?1:b; return v<a?a:v>b?b:v; }
function ph(t,a,b){ return cl((t-a)/(b-a)); }
function eo(u){ return 1-Math.pow(1-u,3); }
function eio(u){ return u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2; }
function back(u){ var c=1.9; return 1+(c+1)*Math.pow(u-1,3)+c*Math.pow(u-1,2); }
function pop(t,a,d){ return t<a?0:back(cl((t-a)/(d||.4))); }
function wig(t,f,a){ return Math.sin(t*f*6.2832)*a; }
function lerp(a,b,u){ return a+(b-a)*u; }
function r2(v){ return Math.round(v*10)/10; }
function hsh(i){ var x=Math.sin(i*127.1+311.7)*43758.5453; return x-Math.floor(x); }

/* ----------------------------------------------------------- примитивы
   fill → заливка со сдвигом (5,4); sw → синяя линия поверх */
function sh(d,fill,sw,extra){
  if(fill){
    var paperish=OPQ||fill===PAPER||fill==='#fff';
    O.push('<path d="'+d+'" transform="translate('+MIS[0]+' '+MIS[1]+')" fill="'+fill+'"'+(paperish?'':' class="m"')+'/>');
  }
  if(sw!==0) O.push('<path d="'+d+'" fill="none" stroke="'+INK+'" stroke-width="'+(sw||4)+'" stroke-linecap="round" stroke-linejoin="round"'+(extra||'')+'/>');
}
function solid(d,col){ O.push('<path d="'+d+'" fill="'+(col||INK)+'"/>'); }
function circ(cx,cy,r){ return 'M'+r2(cx-r)+','+r2(cy)+'a'+r2(r)+','+r2(r)+' 0 1,0 '+r2(2*r)+',0a'+r2(r)+','+r2(r)+' 0 1,0 '+r2(-2*r)+',0Z'; }
function ell(cx,cy,rx,ry){ return 'M'+r2(cx-rx)+','+r2(cy)+'a'+r2(rx)+','+r2(ry)+' 0 1,0 '+r2(2*rx)+',0a'+r2(rx)+','+r2(ry)+' 0 1,0 '+r2(-2*rx)+',0Z'; }
function rect(x,y,w,h,r){ r=r||0; if(!r) return 'M'+x+','+y+'h'+w+'v'+h+'h'+(-w)+'Z';
  return 'M'+(x+r)+','+y+'h'+(w-2*r)+'q'+r+',0 '+r+','+r+'v'+(h-2*r)+'q0,'+r+' '+(-r)+','+r+'h'+(-(w-2*r))+'q'+(-r)+',0 '+(-r)+','+(-r)+'v'+(-(h-2*r))+'q0,'+(-r)+' '+r+','+(-r)+'Z'; }
function line(x1,y1,x2,y2,sw){ sh('M'+r2(x1)+','+r2(y1)+'L'+r2(x2)+','+r2(y2),null,sw||4); }
function poly(pts,close){ var d='M'+pts.map(function(p){ return r2(p[0])+','+r2(p[1]); }).join('L'); return close?d+'Z':d; }
function g(tr,fn,op){ O.push('<g transform="'+tr+'"'+(op!=null?' opacity="'+cl(op).toFixed(3)+'"':'')+'>'); fn(); O.push('</g>'); }
function tx(x,y,s,size,o){
  o=o||{};
  var f=o.font||'Caveat', col=o.col||INK, an=o.anchor||'middle', w=o.weight||(f==='Caveat'?700:400);
  O.push('<text x="'+r2(x)+'" y="'+r2(y)+'" font-family="'+f+'" font-weight="'+w+'" font-size="'+size+'" fill="'+col+'" text-anchor="'+an+'"'+
    (o.rot?' transform="rotate('+o.rot+' '+r2(x)+' '+r2(y)+')"':'')+(o.ls?' letter-spacing="'+o.ls+'"':'')+'>'+esc(s)+'</text>');
}
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }
function shade(d,pat,op){ O.push('<path d="'+d+'" fill="url(#'+(pat||'ht')+')" opacity="'+(op||.55)+'"/>'); }

/* ------------------------------------------------------------- реквизит */
function record(x,y,r,lab,rot,holes){
  g('translate('+r2(x)+','+r2(y)+') rotate('+r2(rot||0)+')',function(){
    sh(circ(0,0,r),DARK,4);
    for(var k=1;k<4;k++) sh(circ(0,0,r*(.45+k*.14)),null,1.5,' stroke-opacity=".5"');
    sh(circ(0,0,r*.34),lab||PINK,3);
    solid(circ(0,0,r*.05),PAPER);
    sh('M'+r2(-r*.2)+','+r2(-r*.1)+'l'+r2(r*.12)+','+r2(-r*.1),null,2);
    if(holes) holes.forEach(function(h){ sh(circ(h[0]*r,h[1]*r,h[2]*r),PAPER,3); });
  });
}
function bubble(x,y,w,h,tailX,tailY,fill){
  sh(rect(x,y,w,h,28),fill||'#fff',4);
  sh('M'+r2(x+w*.33)+','+r2(y+h-3)+' L'+r2(tailX)+','+r2(tailY)+' L'+r2(x+w*.47)+','+r2(y+h-3),'#fff',4);
  solid(rect(x+w*.3,y+h-8,w*.2,10),'#fff');
}
function star(x,y,r,col,rot){
  var p=[]; for(var k=0;k<10;k++){ var a=(k/10)*6.2832+(rot||0), rr=k%2?r*.45:r; p.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr]); }
  sh(poly(p,true),col||YEL,3);
}
function waves(x,y,n,sp,t,dir){
  for(var k=0;k<n;k++){
    var u=((t*1.6+k/n)%1), rr=30+u*sp;
    sh('M'+r2(x+dir*rr*.3)+','+r2(y-rr)+' Q'+r2(x+dir*rr)+','+r2(y)+' '+r2(x+dir*rr*.3)+','+r2(y+rr),null,5*(1-u)+1,' stroke-opacity="'+(1-u).toFixed(2)+'"');
  }
}
function turntable(x,y,s,t,spin,armDown){
  g('translate('+x+','+y+') scale('+s+')',function(){
    sh(rect(-190,-40,380,110,18),TEAL,4);
    shade(rect(-190,20,380,50,18),'ht',.4);
    record(-30,-40,120,PINK,spin?t*200:0);
    sh(ell(-30,-40,125,34),null,0);
    var a=armDown?0:-.5;
    g('translate(130,-110) rotate('+r2(a*57.3+20)+')',function(){
      sh(circ(0,0,16),GREY,4); line(0,0,-6,120,7); sh(rect(-20,112,26,20,4),YEL,3);
    });
    sh(circ(150,40,14),YEL,3); sh(circ(110,40,14),PINK,3);
  });
}
function knob(x,y,r,val){
  var a=-135+val*27;
  g('translate('+x+','+y+')',function(){
    for(var k=0;k<=11;k++){ var aa=(-135+k*27-90)/57.3; line(Math.cos(aa)*(r+14),Math.sin(aa)*(r+14),Math.cos(aa)*(r+30),Math.sin(aa)*(r+30),k===11?6:3);
      if(k%1===0) tx(Math.cos(aa)*(r+56),Math.sin(aa)*(r+56)+10,String(k),k===11?40:26,{col:k===11?PINK:INK}); }
    sh(circ(0,0,r),YEL,5); shade(circ(r*.2,r*.2,r*.8),'ht',.35);
    g('rotate('+r2(a)+')',function(){ line(0,0,0,-r*.85,9); });
  });
}
function speaker(x,y,s,thump){
  var opq=OPQ; OPQ=true;
  g('translate('+x+','+y+') scale('+s+')',function(){
    sh(rect(-80,-200,160,200,10),DARK,4);
    var k=1+thump*.08;
    sh(circ(0,-140,34*k),GREY,4); sh(circ(0,-140,10),INK,2);
    sh(circ(0,-60,50*k),GREY,4); sh(circ(0,-60,16),INK,2);
  });
  OPQ=opq;
}

/* ----------------------------------------------------------------- герой
   Русый, светлая кожа, прямой нос, волосы коротко по бокам и с объёмом
   сверху. Нос, брови и цвет волос общие для всех версий — это и есть «я».
   Руки и ноги — «трубки» с контуром, у лица свои тени и румянец. */
var SKIN='#f8d2b6', SKIN_D='#e9a98b', HAIR='#e4bc6a', HAIR_D='#a8742e', EYE='#5d87b3', SHIRT='#fbf6ea', BEIGE='#d9c29c', DENIM='#3e5195', CORD='#c98a4b';
var V=[
  {tag:'11–15',shirt:DARK,hair:'metal',phones:1,tee:'bolt',pants:DENIM,leg:8},
  {tag:'16–18',shirt:TEAL,hair:'fringe',tee:'stripes',pants:DARK,leg:26},
  {tag:'19',shirt:YEL,hair:'hat',tee:'note',pants:DENIM},
  {tag:'20–21',shirt:PINK,hair:'hippie',tee:'flower',band:1,pants:CORD},
  {tag:'22–24',shirt:GREY,hair:'neat',turtle:1,pants:DARK},
  {tag:'сейчас',shirt:SHIRT,hair:'quiff',tee:'camp',short:1,pants:BEIGE,shoe:'#fff'}
];
function tube(d,col,w){
  O.push('<path d="'+d+'" fill="none" stroke="'+INK+'" stroke-width="'+(w+7)+'" stroke-linecap="round" stroke-linejoin="round"/>');
  O.push('<path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round" transform="translate(1.5 1)"/>');
}
function tint(d,col,op){ O.push('<path d="'+d+'" fill="'+col+'" opacity="'+(op||.5)+'" class="m"/>'); }
function stroke(d,col,w,op){ O.push('<path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round"'+(op?' opacity="'+op+'"':'')+'/>'); }
function guy(x,y,s,o){
  o=o||{};
  var d={armL:.25,armR:.25,bendL:.35,bendR:.35,tilt:0,bob:0,eyes:'dot',mouth:'smile',flip:0,walk:0,squash:1};
  for(var k in d) if(o[k]==null) o[k]=d[k];
  var hands={}, mis=MIS, opq=OPQ; MIS=[3,2.5]; OPQ=true;
  g('translate('+r2(x)+','+r2(y+o.bob)+') scale('+r2(s*(o.flip?-1:1))+','+r2(s*o.squash)+')',function(){
    var w=o.walk?Math.sin(o.walk)*16:0, pants=o.pants||DARK, L=o.sit?-30:o.leg!=null?o.leg:38;
    if(!o.sit) tint(ell(0,3,56,9),INK,.13);
    /* ноги: брюки и кеды; чем старше версия, тем длиннее ноги */
    if(o.sit){ /* сидя: бёдра к зрителю, видны колени и голени */
      tube('M-15,-36 L-24,-30 L-20,-12',pants,22); tube('M15,-36 L24,-30 L20,-12',pants,22);
    } else {
      tube('M-15,'+(-66-L)+' Q-19,'+r2(-38-L/2)+' '+r2(-18-w)+',-12',pants,20);
      tube('M15,'+(-66-L)+' Q19,'+r2(-38-L/2)+' '+r2(18+w)+',-12',pants,20);
    }
    [[-1,-w],[1,w]].forEach(function(f){ var fx=f[0]*24+f[1];
      sh('M'+r2(fx-f[0]*22)+',-2 C'+r2(fx-f[0]*22)+',-18 '+r2(fx+f[0]*4)+',-20 '+r2(fx+f[0]*16)+',-12 C'+r2(fx+f[0]*26)+',-8 '+r2(fx+f[0]*26)+',2 '+r2(fx+f[0]*18)+',4 L'+r2(fx-f[0]*20)+',4Z',o.shoe||DARK,3);
      stroke('M'+r2(fx-f[0]*21)+',0 L'+r2(fx+f[0]*22)+',0',o.shoe?GREY:'#fff',2.5); });
    O.push('<g transform="translate(0,'+(-L)+')">');
    /* шея */
    sh(rect(-10,-184,20,32,6),SKIN,3); tint(rect(-8,-176,16,12,4),SKIN_D,.6);
    /* тело: покатые плечи, рубашка чуть сужается к поясу */
    var body='M-18,-162 C-34,-160 -46,-152 -46,-136 C-47,-110 -44,-84 -38,-60 L38,-60 C44,-84 47,-110 46,-136 C46,-152 34,-160 18,-162 C8,-157 -8,-157 -18,-162Z';
    sh(body,o.shirt||PINK,4);
    shade('M22,-158 C38,-152 47,-130 45,-100 C44,-80 41,-68 38,-62 L22,-62Z','ht',.28);
    if(o.tee==='camp'){
      O.push('<path d="'+body+'" fill="url(#eye)" opacity=".7"/>');
      sh('M-11,-158 L0,-132 L11,-158Z',SKIN,3);
      sh('M-12,-160 L-2,-134 L-30,-148 L-26,-160Z','#fff',3); sh('M12,-160 L2,-134 L30,-148 L26,-160Z','#fff',3);
      line(0,-132,0,-62,2.5); for(var bt=0;bt<3;bt++) sh(circ(5,-118+bt*22,2.6),'#fff',2);
    }
    if(o.tee==='bolt') sh('M-4,-144 L-16,-110 L-2,-110 L-10,-80 L14,-120 L0,-120 L8,-144Z',YEL,3);
    if(o.tee==='stripes'){ for(var q=0;q<3;q++) line(-46,-136+q*22,46,-136+q*22,3); }
    if(o.tee==='note'){ sh(circ(-6,-96,9),INK,2); line(3,-96,3,-130,4); line(3,-130,16,-122,4); }
    if(o.tee==='flower'){ for(var p=0;p<5;p++){ var a=p*1.2566; sh(circ(Math.cos(a)*12,-106+Math.sin(a)*12,8),YEL,2);} sh(circ(0,-106,6),PINK,2); }
    if(o.turtle) sh('M-20,-166 Q0,-156 20,-166 L20,-150 Q0,-140 -20,-150Z',GREY,3);
    /* руки: угол от вертикали, наружу — плюс; короткий рукав или длинный */
    function arm(side,a,b){
      var sx=side*38, sy=-146, ex=sx+side*Math.sin(a)*44, ey=sy+Math.cos(a)*44, a2=a+b,
          hx=ex+side*Math.sin(a2)*40, hy=ey+Math.cos(a2)*40;
      var path='M'+r2(sx)+','+r2(sy)+'L'+r2(ex)+','+r2(ey)+'L'+r2(hx)+','+r2(hy);
      if(o.short){
        tube(path,SKIN,14);
        tube('M'+r2(sx)+','+r2(sy)+'L'+r2(sx+(ex-sx)*.5)+','+r2(sy+(ey-sy)*.5),o.shirt||PINK,22);
      } else tube(path,o.shirt||PINK,16);
      return [hx,hy];
    }
    hands.l=arm(-1,o.armL,o.bendL); hands.r=arm(1,o.armR,o.bendR);
    if(o.holdBack) o.holdBack(hands);
    sh(circ(hands.l[0],hands.l[1],11),SKIN,3.5); sh(circ(hands.r[0],hands.r[1],11),SKIN,3.5);
    if(o.horns){ var hh=o.horns==='l'?hands.l:hands.r; tube('M'+r2(hh[0]-5)+','+r2(hh[1]-8)+'L'+r2(hh[0]-8)+','+r2(hh[1]-30),SKIN,6); tube('M'+r2(hh[0]+5)+','+r2(hh[1]-8)+'L'+r2(hh[0]+8)+','+r2(hh[1]-30),SKIN,6); }
    /* голова */
    g('rotate('+r2(o.tilt)+' 0 -158) translate(0,-174) scale(.86,.92) translate(0,156)',function(){
      var hr=o.hair;
      if(o.scarf){ sh('M-30,-164 Q0,-144 30,-164 L28,-150 Q0,-134 -28,-150Z',PINK,3); sh('M16,-154 l14,40 l-18,4 l-8,-38Z',PINK,3); }
      /* длинные волосы — за головой */
      if(hr==='metal') sh('M-58,-244 C-84,-176 -80,-112 -64,-96 L-34,-154 L34,-154 L64,-96 C80,-112 84,-176 58,-244Z',HAIR,4);
      if(hr==='hippie'){ sh('M-56,-234 C-86,-172 -74,-126 -54,-112 L-42,-170Z',HAIR,4); sh('M56,-234 C86,-172 74,-126 54,-112 L42,-170Z',HAIR,4); }
      /* уши */
      if(!o.ear) sh(ell(-54,-210,9,15),SKIN,3.5);
      sh(ell(55,-210,9,15),SKIN,3.5); stroke('M58,-218 Q52,-210 57,-202',SKIN_D,2.5);
      /* лицо: вытянутый овал, острый подбородок */
      var face='M0,-274 C36,-274 55,-250 55,-216 C55,-188 42,-166 24,-157 C12,-151 -10,-151 -22,-157 C-40,-166 -54,-188 -54,-216 C-54,-250 -34,-274 0,-274Z';
      sh(face,SKIN,4);
      tint('M38,-258 C52,-244 56,-222 53,-198 C50,-178 40,-165 26,-158 C38,-176 44,-200 44,-224 C44,-238 42,-250 38,-258Z',SKIN_D,.4);
      tint(ell(-30,-190,11,6),PINK,.35); tint(ell(34,-190,9,6),PINK,.35);
      /* глаза */
      var hideEyes=hr==='metal', ex=[-18,22], ey=-216, look=o.eyes==='side'?4:0;
      if(!hideEyes){
        ex.forEach(function(cx){
          if(o.eyes==='dot'||o.eyes==='side'||o.eyes==='wide'){
            var big=o.eyes==='wide';
            var ew=big?12:10.5, eh=big?11:6.5;
            sh('M'+(cx-ew)+','+ey+' Q'+cx+','+(ey-eh*1.6)+' '+(cx+ew)+','+ey+' Q'+cx+','+(ey+eh*1.3)+' '+(cx-ew)+','+ey+'Z','#fff',0);
            solid(circ(cx+look+1,ey,big?5.5:5.6),EYE); solid(circ(cx+look+1,ey,2.7),INK); solid(circ(cx+look+2.8,ey-1.8,1.5),'#fff');
            stroke('M'+(cx-ew-1)+','+(ey+1)+' Q'+cx+','+(ey-eh*1.7)+' '+(cx+ew+1)+','+(ey-1),INK,big?3.5:4);
            stroke('M'+(cx-ew+3)+','+(ey+eh*.7)+' Q'+cx+','+(ey+eh*1.25)+' '+(cx+ew-3)+','+(ey+eh*.6),SKIN_D,2);
          } else if(o.eyes==='closed') stroke('M'+(cx-10)+','+ey+' Q'+cx+','+(ey+7)+' '+(cx+10)+','+ey,INK,3.5);
          else if(o.eyes==='happy') stroke('M'+(cx-10)+','+(ey+3)+' Q'+cx+','+(ey-8)+' '+(cx+10)+','+(ey+3),INK,3.5);
        });
      }
      /* брови — русые, выражают больше, чем рот */
      var bu=(o.eyes==='wide'||o.mouth==='o'||o.mouth==='scream')?-8:0, worry=o.mouth==='frown'||o.sweat;
      if(!hideEyes){
        stroke('M'+(-29)+','+(ey-15+bu+(worry?-4:0))+' Q-18,'+(ey-21+bu)+' -7,'+(ey-17+bu+(worry?-6:0)),HAIR_D,5);
        stroke('M11,'+(ey-17+bu+(worry?-6:0))+' Q22,'+(ey-21+bu)+' 33,'+(ey-15+bu+(worry?-4:0)),HAIR_D,5);
      }
      if(o.glasses){ sh(circ(-18,-216,15),null,3.5); sh(circ(22,-216,15),null,3.5); line(-3,-217,7,-217,3); }
      /* нос — прямой, с чёткой спинкой */
      stroke('M6,-224 C8,-212 12,-201 15,-194 C14,-188 8,-187 3,-190',INK,3);
      tint('M14,-192 C17,-196 18,-190 15,-186Z',SKIN_D,.8);
      /* рот */
      var m=o.mouth;
      if(m==='smile'){ stroke('M-12,-175 Q3,-165 17,-176',INK,3.5); stroke('M-2,-167 Q4,-164 9,-167',SKIN_D,3); }
      else if(m==='grin'){ sh('M-16,-178 Q3,-152 21,-179 Q3,-172 -16,-178Z','#fff',3.5); tint('M-8,-164 Q3,-158 13,-165 Q3,-162 -8,-164Z',PINK,.7); }
      else if(m==='o') sh(ell(3,-171,7,9),DARK,3);
      else if(m==='flat') stroke('M-10,-173 L15,-174',INK,3.5);
      else if(m==='scream'){ sh(ell(3,-170,13,17),DARK,3.5); tint(ell(3,-160,8,5),PINK,.9); }
      else if(m==='talk') sh(ell(3,-173,10,3+Math.abs(Math.sin((o.t||0)*18))*7),DARK,3);
      else if(m==='frown') stroke('M-10,-167 Q3,-177 16,-167',INK,3.5);
      /* причёски — все русые */
      if(hr==='quiff'){
        /* виски коротко — светлая тень, сверху объём, чуб зачёсан вверх */
        tint('M-54,-206 C-56,-228 -52,-244 -42,-254 L-36,-236 C-44,-230 -50,-220 -54,-206Z',HAIR,.8);
        tint('M55,-206 C57,-228 53,-244 43,-254 L37,-236 C45,-230 51,-220 55,-206Z',HAIR,.8);
        sh('M-50,-234 C-52,-254 -44,-268 -32,-274 C-34,-284 -22,-292 -8,-288 C-2,-300 18,-302 28,-292 C42,-294 54,-284 52,-272 C58,-262 56,-246 52,-234 C48,-244 42,-250 34,-252 C36,-244 32,-240 28,-240 C24,-252 12,-258 0,-258 C2,-250 -2,-246 -8,-246 C-12,-254 -24,-256 -34,-250 C-42,-246 -48,-240 -50,-234Z',HAIR,3.5);
        stroke('M-34,-252 C-30,-266 -18,-278 -4,-282 M-8,-248 C-4,-266 10,-282 22,-288 M18,-252 C24,-264 36,-276 46,-278 M36,-246 C42,-256 48,-264 50,-270',HAIR_D,2.2);
        stroke('M-22,-260 C-16,-272 -6,-280 6,-283 M10,-262 C18,-274 28,-281 38,-283','#fbe7b4',3,.9);
      }
      if(hr==='neat'){
        sh('M-54,-212 C-58,-256 -30,-282 4,-282 C36,-282 58,-260 55,-212 C50,-236 36,-250 14,-252 L4,-262 C-10,-250 -34,-242 -54,-212Z',HAIR,4);
        stroke('M4,-262 C-8,-272 -26,-270 -40,-258 M16,-254 C30,-268 44,-262 50,-246',HAIR_D,2.5);
      }
      if(hr==='metal'){
        sh('M-58,-212 C-60,-262 -30,-286 2,-284 C36,-284 62,-260 58,-212 C44,-236 26,-244 0,-244 C-24,-244 -44,-236 -58,-212Z',HAIR,4);
        stroke('M-40,-244 C-44,-214 -42,-198 -38,-186 M-14,-246 C-16,-214 -14,-200 -12,-190 M14,-246 C16,-216 14,-200 12,-192 M38,-240 C40,-214 40,-200 38,-188',HAIR_D,3);
        sh('M-58,-214 C-48,-228 -36,-234 -20,-238 L-24,-196 C-38,-200 -50,-206 -58,-214Z',HAIR,3.5); sh('M58,-214 C48,-228 36,-234 20,-238 L24,-196 C38,-200 50,-206 58,-214Z',HAIR,3.5);
        sh('M-22,-240 C-10,-244 10,-244 22,-240 L20,-200 C8,-196 -8,-196 -20,-200Z',HAIR,3.5);
      }
      if(hr==='fringe'){
        sh('M-56,-206 C-62,-262 -24,-288 10,-284 C42,-280 60,-258 56,-222 C44,-234 30,-236 16,-232 C0,-226 -18,-214 -30,-194 C-40,-194 -50,-198 -56,-206Z',HAIR,4);
        stroke('M-40,-250 C-20,-262 10,-262 36,-248 M-30,-238 C-16,-232 -4,-228 12,-232',HAIR_D,2.5);
      }
      if(hr==='hippie'){ sh('M-58,-218 C-60,-262 -26,-286 4,-284 C36,-282 60,-260 58,-218 C40,-244 -40,-244 -58,-218Z',HAIR,4);
        stroke('M0,-282 L0,-244',HAIR_D,2.5);
        if(o.band){ sh('M-58,-238 Q0,-262 58,-238 L58,-226 Q0,-250 -58,-226Z',PINK,3); } }
      if(hr==='hat'){ sh('M-58,-222 C-58,-236 -52,-244 -44,-248 L-40,-220Z',HAIR,3); sh('M58,-222 C58,-236 52,-244 44,-248 L40,-220Z',HAIR,3);
        sh('M-86,-240 Q0,-224 86,-240 Q0,-254 -86,-240Z',DARK,4); sh('M-44,-242 C-44,-292 44,-292 44,-242Z',DARK,4); sh('M-44,-254 L44,-254 L44,-244 L-44,-244Z',PINK,2); }
      if(o.phones){ stroke('M-66,-214 C-72,-300 72,-300 66,-214',INK,9); sh(rect(-82,-236,26,50,10),YEL,4); sh(rect(56,-236,26,50,10),YEL,4); }
      if(o.sweat) sh('M50,-254 q10,16 0,22 q-10,-6 0,-22Z','#9fe0ff',3);
      if(o.halo){ g('translate(0,-316) scale(1,.32)',function(){ record(0,0,70,YEL,o.t*60); }); }
      if(o.ear){ var es=o.ear; g('translate(-54,-210) scale('+r2(es)+')',function(){ sh('M0,-20 C-40,-40 -46,20 -10,28 C-20,10 -18,-6 0,-4Z',SKIN,4); sh('M-8,-10 C-24,-12 -24,8 -10,12',null,3); tint('M-4,-14 C-30,-26 -34,14 -12,20Z',PINK,.3); }); }
    });
    if(o.hold) o.hold(hands);
    O.push('</g>');
    if(o.tag){ g('translate(0,26) rotate('+r2(o.tagRot||-4)+')',function(){ sh(rect(-46,0,92,34,6),'#fff',3); tx(0,26,o.tag,28,{}); }); }
  });
  MIS=mis; OPQ=opq;
  return hands;
}
function ver(k,x,y,s,extra){
  var o={}, v=V[k];
  for(var a in v) o[a]=v[a];
  if(extra) for(var b in extra) o[b]=extra[b];
  o.tag=extra&&extra.tag===false?null:v.tag;
  return guy(x,y,s,o);
}

/* ------------------------------------------------------------ подписи */
function caption(x,y,s,size,t0,t,o){
  var u=pop(t,t0,.35); if(u<=0) return;
  g('translate('+x+','+y+') scale('+r2(u)+')',function(){ tx(0,0,s,size,o||{}); });
}
function sign(x,y,w,h,s,size,col,t0,t,rot){
  var u=pop(t,t0,.4); if(u<=0) return;
  g('translate('+x+','+y+') rotate('+(rot||0)+') scale('+r2(u)+')',function(){
    sh(rect(-w/2,-h/2,w,h,10),col||YEL,5);
    var lines=s.split('\n');
    lines.forEach(function(l,i){ tx(0,-((lines.length-1)*size*.55)+i*size*1.1+size*.36,l,size,{font:'Rubik Mono One',weight:400}); });
  });
}
function floor(y){ sh('M-40,'+y+' L1640,'+(y+6),null,4); shade(rect(-40,y+4,1700,300),'ht',.18); }

/* ================================================================ сцены
   Каждая сцена рисуется по своему отрезку времени; t — время фильма. */
var SC=[];
function scene(a,b,fn){ SC.push({a:a,b:b,fn:fn}); }

/* 1. Тесно в окончательной версии */
scene(0,S[1],function(t){
  var zoom=1+t*.012;
  g('translate(800,420) scale('+r2(zoom)+') translate(-800,-420)',function(){
    sh('M0,700 L1600,706',null,3);
    /* рама слишком мала */
    var sq=1+wig(t,1.3,.015);
    g('translate(800,420)',function(){
      sh(rect(-190,-260,380,470,6),YEL,10); sh(rect(-160,-230,320,410,4),'#fff',5); shade(rect(-160,-230,320,410,4),'htp',.25);
      ver(5,0,176,1.24*sq,{tag:false,armL:1.5,armR:1.5,bendL:-.2,bendR:-.2,mouth:'flat',eyes:'side',squash:.94,tilt:wig(t,.7,4)});
      /* локти и колени торчат за раму */
      sh('M-160,176 l-30,24 M160,176 l30,24',null,5);
      /* табличка */
      g('translate(0,262)',function(){ sh(rect(-170,0,340,70,4),'#fff',3); tx(0,30,'«ОКОНЧАТЕЛЬНАЯ ВЕРСИЯ»',21,{font:'Rubik Mono One',weight:400}); tx(0,58,'масло, 2026. руками не трогать',24,{}); });
    });
    if(t>1.6) for(var k=0;k<3;k++) caption(520+k*280,150+(k%2)*50,'скрип',60,1.6+k*.3,t,{rot:-12+k*10,col:PINK});
  });
});

/* 2. Все версии в одной комнате — и спор за проигрыватель */
scene(S[1],S[3],function(t){
  var lt=t-S[1];
  floor(700);
  /* дверь */
  sh(rect(90,280,200,420,6),PINK,5); sh(circ(260,500,10),YEL,3); tx(190,330,'КОМНАТА',26,{font:'Rubik Mono One',weight:400});
  turntable(800,640,1,t,lt<4.3,lt<4.3);
  var xs=[380,560,1040,1220,1400,700];
  for(var k=0;k<6;k++){
    var enter=S[1]+.25+k*.45, u=eo(ph(t,enter,enter+.7));
    if(u<=0) continue;
    var x=lerp(190,xs[k],u), argue=t>S[2];
    var jump=argue?Math.abs(Math.sin((t+k)*5))*-26:0;
    var s=k===5?.82:.78;
    ver(k,x,700+jump,s,{walk:u<1?t*14:0,t:t,armR:argue?2.4+wig(t,2,.3):.3,bendR:argue?.4:.35,mouth:argue?'talk':(k===0?'grin':'smile'),
      horns:k===0&&argue?'r':null,
      hold:function(h){ if(argue||u>=1) record(h.r[0]+10,h.r[1]-40,34,[PINK,YEL,TEAL,YEL,PINK,GREY][k],t*80*(k%2?1:-1)); }});
  }
  /* «выключить» — игла поднимается, волны схлопываются */
  if(t<S[1]+4.3) waves(700,560,4,160,t,-1);
  if(t>S[1]+4.3&&t<S[2]) caption(800,300,'ТССС…',90,S[1]+4.3,t,{font:'Rubik Mono One',weight:400,col:INK});
  if(t>S[2]){
    var bl=['ПОСТАВЬ МОЁ!','НЕТ, МОЁ!','БЛЮЗ!','ЦЕППЕЛИН!','БАХ!','ТРИ ПИАНИСТА!'];
    for(var q=0;q<6;q++){
      var ta=S[2]+.2+q*.35; if(t<ta) continue;
      var bx=[300,560,1000,1260,1440,760][q], by=[250,170,250,170,300,330][q];
      g('translate('+bx+','+by+') scale('+r2(pop(t,ta,.3))+')',function(){ bubble(-125,-44,250,80,0,78); tx(0,8,bl[q],20,{font:'Rubik Mono One',weight:400}); });
    }
  }
});

/* 3. Подросток: хэви-метал, альбом целиком, религия, монотеизм */
scene(S[3],S[8],function(t){
  if(t<S[5]){
    /* прожектор и хэдбэнгинг */
    sh('M620,0 L980,0 L1180,720 L420,720Z',YEL,0); shade('M620,0 L980,0 L1180,720 L420,720Z','hty',.6);
    floor(700);
    speaker(300,700,1.2,Math.abs(Math.sin(t*8.8))); speaker(1300,700,1.2,Math.abs(Math.sin(t*8.8+1)));
    var bang=Math.sin(t*8.8)*18;
    ver(0,800,720,1.55,{tilt:bang,horns:'r',armR:2.7,bendR:.2,armL:.6,mouth:'scream',t:t,tag:false});
    caption(800,170,'ХЭВИ-МЕТАЛ',86,S[3]+.2,t,{font:'Rubik Mono One',weight:400,col:PINK,rot:-3});
    if(t>S[4]){
      /* альбом целиком: от 00:00 до последней секунды */
      var p=ph(t,S[4],S[5]);
      g('translate(1240,300)',function(){
        record(0,0,120,YEL,t*120);
        var a=-1.2+p*9.4; sh('M0,0 L'+r2(Math.cos(a)*100)+','+r2(Math.sin(a)*100),null,3);
        var m=Math.floor(p*42), sec=Math.floor(p*42*60)%60;
        tx(0,170,('0'+m).slice(-2)+':'+('0'+sec).slice(-2)+' / 42:11',38,{});
      });
      g('translate(360,300) rotate(-8)',function(){ sh(rect(-90,-60,180,120,10),'#fff',4); tx(0,-8,'одна песня',30,{}); line(-80,-30,80,30,6); line(-80,30,80,-30,6); });
    }
  } else if(t<S[6]){
    /* почти религиозен: витраж, свечи, нимб из пластинки */
    for(var w=0;w<3;w++){
      var wx=520+w*280;
      sh('M'+(wx-90)+',560 L'+(wx-90)+',260 Q'+wx+',130 '+(wx+90)+',260 L'+(wx+90)+',560Z',[PINK,YEL,TEAL][w],6);
      line(wx-90,360,wx+90,360,4); line(wx,195,wx,560,4);
      if(w===1) sh('M'+(wx-10)+',230 L'+(wx-40)+',350 L'+(wx-6)+',350 L'+(wx-24)+',470 L'+(wx+40)+',310 L'+(wx+4)+',310 L'+(wx+20)+',230Z','#fff',4);
    }
    floor(700);
    for(var c=0;c<4;c++){ var cx=380+c*280+(c>1?160:0); sh(rect(cx-14,600,28,100,4),'#fff',4); sh('M'+cx+',600 q-14,-26 0,-46 q14,20 0,46Z',YEL,3); }
    ver(0,800,730,1.05,{halo:1,t:t,armL:2.9,armR:2.9,bendL:-.1,bendR:-.1,mouth:'o',tag:false});
    caption(1270,150,'почти религиозен',60,S[5]+.2,t,{rot:4});
  } else if(t<S[7]){
    /* алтарь: одна пластинка, сомнений ноль */
    floor(700);
    sh(rect(560,520,480,180,8),PINK,5); shade(rect(560,600,480,100,8),'ht',.4);
    g('translate(800,400) rotate('+wig(t,.5,3)+')',function(){ record(0,0,120,YEL,0); tx(0,8,'AC/DC',26,{font:'Rubik Mono One',weight:400}); });
    for(var r=0;r<12;r++){ var aa=r/12*6.2832+t*.4; line(800+Math.cos(aa)*140,400+Math.sin(aa)*140,800+Math.cos(aa)*190,400+Math.sin(aa)*190,5); }
    ver(0,330,700,.9,{armL:2.2,armR:2.2,mouth:'grin',tilt:6,t:t});
    sign(1260,300,300,150,'СОМНЕНИЙ:\n0',32,'#fff',S[6]+2.2,t,6);
    sign(1260,520,300,120,'ПЕРЕСКОКОВ:\n0',28,'#fff',S[6]+2.9,t,-4);
  } else {
    /* монотеизм — вывеска как у церкви */
    floor(740);
    g('translate(800,390)',function(){
      var u=pop(t,S[7],.45);
      g('scale('+r2(u)+')',function(){
        sh(rect(-420,-170,840,300,20),'#fff',7); sh(rect(-400,-150,800,260,14),null,3);
        tx(0,-40,'МУЗЫКАЛЬНЫЙ',58,{font:'Rubik Mono One',weight:400,col:PINK});
        tx(0,50,'МОНОТЕИЗМ',72,{font:'Rubik Mono One',weight:400});
        line(-340,130,-340,330,8); line(340,130,340,330,8);
      });
      if(t>S[7]+.8) tx(0,190,'служба: весь альбом, без перерыва',36,{});
    });
  }
});

/* 4. Нынешний я и три пианиста; подросток в ужасе */
scene(S[8],S[11],function(t){
  floor(700);
  /* доска */
  sh(rect(420,120,760,420,10),'#2f4a3f',6);
  tx(800,200,'СОНАТА № 8 × 3',46,{font:'Rubik Mono One',weight:400,col:'#f4ecd9'});
  var names=['I','II','III'];
  for(var k=0;k<3;k++){
    var ta=S[8]+2+k*1.2, u=pop(t,ta,.4); if(u<=0) continue;
    var px=560+k*240;
    g('translate('+px+',430) scale('+r2(u*.9)+')',function(){
      /* маленький рояль и пианист во фраке */
      sh('M-70,0 L70,0 L70,-30 C60,-80 -10,-90 -40,-60 L-70,-30Z','#1d1a24',4); sh(rect(-70,0,140,14,2),'#fff',3);
      line(-60,14,-60,60,5); line(60,14,60,60,5);
      var bob=Math.sin(t*(6+k*2))*6;
      /* три разных пианиста: седой маэстро, брюнет, рыжая */
      var opq=OPQ; OPQ=true;
      sh(rect(-124,30,48,10,3),'#8a5a2b',2.5);
      g('translate(-100,'+r2(bob)+')',function(){
        sh('M-16,-20 C-19,0 -19,20 -15,30 L17,30 C20,14 20,0 15,-20 C6,-27 -6,-27 -16,-20Z',DARK,3);
        sh('M-5,-23 L5,-23 L0,-6Z','#fff',2);
        line(8,-12,38,0,6); sh(circ(42,0,5),SKIN,2);
        if(k===2) sh('M-18,-36 C-24,-10 -14,-4 -8,-14 L-6,-40Z','#d9793a',3);
        sh(circ(0,-40,16),SKIN,3);
        stroke('M13,-46 L20,-38 L14,-36',INK,2.5); solid(circ(7,-44,2.2));
        if(k===0){ sh('M-16,-38 C-30,-48 -22,-66 -8,-60 C-6,-72 14,-68 12,-56 C22,-58 24,-48 16,-46 C8,-54 -6,-52 -16,-38Z','#fff',3); }
        else sh('M-16,-38 C-20,-58 8,-64 16,-46 C6,-52 -6,-50 -16,-38Z',k===1?DARK:'#d9793a',3);
      });
      OPQ=opq;
      tx(0,110,'пианист '+names[k],30,{col:'#f4ecd9'});
    });
  }
  if(t>S[8]+5) tx(800,600,'темп · вес · где вдохнуть',44,{col:PINK});
  var talking=t<S[9];
  ver(5,1340,710,1.2,{armL:2.3,bendL:.3,armR:.4,mouth:talking?'talk':'smile',t:t,
    hold:function(h){ line(h.l[0],h.l[1],h.l[0]-140,h.l[1]-110,5); }});
  /* подросток выглядывает из-за колонки */
  if(t>S[9]-.3){
    var peek=eo(ph(t,S[9]-.3,S[9]+.4));
    speaker(250,700,1.3,0);
    g('translate('+r2(lerp(160,290,peek))+',0)',function(){ ver(0,0,700,.95,{eyes:'wide',sweat:1,mouth:'o',tag:false}); });
    speaker(170,700,1.3,0);
    if(t>S[9]+1.2){
      g('translate(390,250) scale('+r2(pop(t,S[9]+1.2,.3))+')',function(){
        bubble(-150,-120,300,210,-90,120);
        g('translate(0,70) scale(.42)',function(){ ver(5,0,0,1,{hair:'metal',mouth:'scream',tag:false}); });
        tx(100,-70,'?!',50,{col:PINK,font:'Rubik Mono One',weight:400});
      });
    }
  }
  /* «иногда я и сам задаю себе этот вопрос» — зеркало */
  if(t>S[10]){
    var um=pop(t,S[10],.4);
    g('translate(1060,300) scale('+r2(um)+')',function(){ sh(ell(0,0,90,130),'#dff3f1',6); tx(0,40,'?',150,{font:'Rubik Mono One',weight:400,col:PINK}); });
  }
});

/* 5. Слышать больше: ухо, схема, тщеславие, внутренний комментатор */
scene(S[11],S[15],function(t){
  floor(720);
  if(t<S[12]){
    var es=lerp(1,3.4,eo(ph(t,S[11]+.4,S[11]+2)));
    ver(5,860,730,1.55,{ear:es,mouth:'smile',eyes:'happy',t:t,tag:false});
    waves(300,380,5,200,t,1);
  } else if(t<S[13]){
    /* устройство вещи — разобранная схема */
    var p=eo(ph(t,S[12],S[12]+1.4));
    g('translate(800,380)',function(){
      var parts=[['бас',-300,120,TEAL],['тема',-40,-170,PINK],['гармония',260,-60,YEL],['вдох',300,150,'#fff'],['исполнитель',-280,-120,YEL]];
      parts.forEach(function(q){
        var x=q[1]*p, y=q[2]*p;
        sh(rect(x-90,y-40,180,80,14),q[3],4); tx(x,y+12,q[0],38,{});
        line(0,0,x*.7,y*.7,2);
      });
      sh(circ(0,0,70),PAPER,5); tx(0,14,'вещь',40,{font:'Rubik Mono One',weight:400});
    });
    g('translate(1280,560) rotate(-20)',function(){ sh(circ(0,0,70),'#dff3f1',8); line(50,50,130,130,16); });
  } else if(t<S[14]){
    /* приятно замечать, что замечаешь */
    ver(5,760,730,1.5,{armR:2.5,bendR:.8,mouth:'grin',eyes:'happy',t:t,tag:false,
      hold:function(h){ g('translate('+r2(h.r[0]-10)+','+r2(h.r[1]-70)+')',function(){ line(0,40,0,90,8); sh(ell(0,0,46,56),'#dff3f1',6); }); }});
    star(1030,300,40+wig(t,2,6),YEL,t);
    star(560,250,26,PINK,-t);
    if(t>S[13]+1.8) sign(1180,520,300,110,'Я ЗАМЕТИЛ',26,PINK,S[13]+1.8,t,-6);
  } else {
    /* внутренний комментатор на плече — пока не замолкает */
    var quiet=t>SE[14]-2.4;
    ver(5,640,730,1.5,{eyes:quiet?'closed':'dot',mouth:quiet?'smile':'flat',t:t,tag:false});
    g('translate(880,430) scale(1.35)',function(){
      sh(rect(-80,-40,160,110,10),YEL,4); tx(0,50,'ЭФИР',26,{font:'Rubik Mono One',weight:400});
      g('translate(0,-40)',function(){ sh(circ(0,-60,40),PAPER,4); sh('M0,-60 C4,-52 12,-48 10,-44',null,3); sh(rect(-50,-104,100,18,6),DARK,3);
        if(!quiet){ line(20,-40,60,-70,5); sh(circ(66,-76,12),DARK,3); sh(ell(-6,-38,10,6+Math.abs(Math.sin(t*20))*6),DARK,3); }
        else { sh('M-16,-40 Q0,-30 16,-40',null,3); sh(rect(40,-50,28,34,4),'#fff',3); sh('M52,-60 q6,-10 0,-18',null,2); } });
    });
    if(!quiet){ g('translate(1150,220) scale('+r2(pop(t,S[14]+.3,.3))+')',function(){ bubble(-220,-90,440,150,-200,100);
      tx(0,-20,'…а вот здесь пианист',30,{}); tx(0,24,'чуть придержал тему, и…',30,{}); }); }
    else { for(var n=0;n<5;n++){ var nx=700+wig(t+n,.3,120)+n*40-80, ny=300-((t*40+n*60)%240); tx(nx,ny,'♪',60,{col:[PINK,TEAL,YEL][n%3]}); }
      caption(1180,260,'тишина',60,SE[14]-2.2,t,{col:INK}); }
  }
});

/* 6. Старые песни и кассеты с возрастом в названии (и пауза между частями) */
scene(S[15],S[17],function(t){
  floor(720);
  sh(rect(260,420,1080,26,4),'#b8875a',4);
  var labs=['11–15','16–18','20–21'];
  for(var k=0;k<3;k++){
    var ta=S[16]+.4+k*.6, u=t<S[16]?0:pop(t,ta,.4), x=560+k*240;
    g('translate('+x+',360)',function(){
      sh(rect(-100,-64,200,128,10),[PINK,YEL,TEAL][k],5); sh(rect(-76,-46,152,50,6),'#fff',3);
      sh(circ(-40,32,16),'#fff',3); sh(circ(40,32,16),'#fff',3);
      if(u>0) g('scale('+r2(u)+')',function(){ tx(0,-10,labs[k],40,{}); });
    });
  }
  if(t<S[16]){ for(var d=0;d<14;d++){ var dx=300+hsh(d)*1000, dy=100+((t*20+hsh(d+9)*400)%320); solid(circ(dx,dy,3+hsh(d+3)*3),GREY); } caption(800,180,'старые песни',64,S[15]+.2,t,{rot:-3}); }
  /* пауза: берёт кассету «16–18» и ставит в магнитофон */
  if(t>SE[16]+.3){
    var p=eio(ph(t,SE[16]+.5,SE[16]+3.2));
    ver(5,lerp(1500,1180,eo(ph(t,SE[16]+.3,SE[16]+1.6))),720,1,{walk:t<SE[16]+1.6?t*12:0,armL:lerp(.3,2.2,p),bendL:.3,t:t,tag:false,mouth:'smile'});
    g('translate(1230,620)',function(){ sh(rect(-130,-60,260,120,14),GREY,5); sh(rect(-90,-40,120,56,6),DARK,3); sh(circ(90,-10,20),YEL,3); });
    if(t>SE[16]+3.4) caption(1120,470,'клац',46,SE[16]+3.4,t,{col:PINK,rot:8});
  }
});

/* 7. Трек, который не дослушал бы, — и который не удалить */
scene(S[17],S[22],function(t){
  floor(720);
  function blob(x,y,s,mood){
    g('translate('+r2(x)+','+r2(y)+') scale('+r2(s)+')',function(){
      var wb=wig(t,1.4,6);
      sh('M-60,0 C-70,-60 -40,-110 0,-110 C44,-110 70,-60 60,0 C40,10 -40,10 -60,0Z',PINK,5);
      solid(circ(-18,-62+wb*.2,6)); solid(circ(18,-62,6));
      if(mood==='guilty') sh('M-20,-34 Q0,-24 20,-38',null,4);
      if(mood==='cling') sh(ell(0,-34,10,8),DARK,3);
      if(mood==='proud') sh('M-22,-36 Q0,-14 22,-36Z','#fff',3);
      tx(0,30,'трек №7',28,{});
    });
  }
  if(t<S[18]){
    g('translate(800,300)',function(){ sh(rect(-260,-150,520,300,18),PINK,6); sh(rect(-200,-110,400,110,8),'#fff',4); tx(0,-40,'16–18',60,{});
      sh(circ(-110,70,40),'#fff',4); sh(circ(110,70,40),'#fff',4); });
    blob(800,640,1.5,'guilty');
    ver(5,1300,730,1.25,{eyes:'side',mouth:'flat',armR:2.3,t:t,tag:false,hold:function(h){ g('translate('+r2(h.r[0])+','+r2(h.r[1]-40)+')',function(){ sh(rect(-40,-26,80,52,8),YEL,4); tx(0,12,'▶▶',30,{font:'Rubik Mono One',weight:400}); }); }});
    caption(1300,200,'зевок',48,S[17]+2,t,{rot:6});
  } else if(t<S[19]){
    /* в корзину — не лезет */
    var p=ph(t,S[18],S[18]+1.4), bx=lerp(700,1080,eio(Math.min(p,1)))+(p>=1?wig(t,6,10):0);
    sh('M1100,560 L1260,560 L1240,720 L1120,720Z',GREY,5); sh(rect(1080,540,200,24,6),GREY,4); tx(1180,650,'УДАЛИТЬ',22,{font:'Rubik Mono One',weight:400});
    blob(bx,540,1.35,'cling');
    line(bx+70,480,1100,550,6); line(bx+56,510,1110,560,6);
    ver(5,480,730,1.25,{armL:1.2,armR:1.3,bendR:.1,mouth:'frown',t:t,tag:false});
    if(t>S[18]+1.2) caption(1180,380,'НЕ-А',60,S[18]+1.2,t,{font:'Rubik Mono One',weight:400,col:PINK,rot:-8});
  } else if(t<S[20]){
    /* он помнит — полароид */
    blob(640,660,1.6,'proud');
    g('translate(1000,360) rotate('+r2(8+wig(t,.8,4))+')',function(){
      sh(rect(-150,-170,300,340,6),'#fff',5); sh(rect(-124,-144,248,230,2),YEL,3);
      g('translate(0,78) scale(.55)',function(){ ver(1,0,0,1,{mouth:'grin',eyes:'happy',tag:false}); });
      tx(0,140,'2014, лето',32,{});
    });
    line(760,560,880,470,6);
    caption(420,260,'помнишь?',56,S[19]+.6,t,{rot:-6,col:PINK});
  } else if(t<S[21]){
    /* пересказать легко; восстановить силу — трудно */
    g('translate(80,90)',function(){
      for(var k=0;k<3;k++){ sh(rect(k*330,0,300,300,4),'#fff',5); shade(rect(k*330,0,300,300,4),'ht',.18); }
      tx(150,170,'…и тогда',44,{}); tx(480,170,'…мы',44,{}); tx(810,170,'…короче',44,{});
    });
    var pw=t<S[20]+2.6?.9:lerp(.9,.15,eo(ph(t,S[20]+2.6,S[20]+4.4)));
    g('translate(1300,520)',function(){
      sh('M-160,0 A160,160 0 0,1 160,0',null,6);
      for(var q=0;q<=8;q++){ var a=Math.PI+q/8*Math.PI; line(Math.cos(a)*140,Math.sin(a)*140,Math.cos(a)*120,Math.sin(a)*120,3); }
      var aa=Math.PI+pw*Math.PI; line(0,0,Math.cos(aa)*130,Math.sin(aa)*130,8); sh(circ(0,0,16),PINK,3);
      tx(0,60,'СИЛА',30,{font:'Rubik Mono One',weight:400});
    });
    ver(5,300,730,1.15,{mouth:'talk',t:t,tag:false,armR:1.4});
  } else {
    /* несколько секунд припева — и сдувает */
    var blast=eo(ph(t,S[21]+.5,S[21]+1.3));
    g('translate(1300,560)',function(){ sh(rect(-130,-60,260,120,14),GREY,5); sh(circ(-60,0,40),DARK,4); sh(circ(60,0,40),DARK,4); });
    for(var w=0;w<6;w++){ var u=((t*1.8+w/6)%1)*blast; if(blast>0) sh('M'+r2(1160-u*700)+','+r2(560-160-u*120)+' Q'+r2(1160-u*900)+',560 '+r2(1160-u*700)+','+r2(560+160+u*120),null,8*(1-u)+2); }
    var lean=blast*-18;
    ver(5,520,730,1.4,{tilt:lean,mouth:blast>.3?'grin':'smile',eyes:blast>.3?'closed':'dot',armL:1.2*blast+.2,armR:1.2*blast+.2,t:t,tag:false,hair:blast>.5?'metal':'quiff',phones:0});
    if(blast>.5) caption(560,200,'2009!',80,S[21]+1.1,t,{font:'Rubik Mono One',weight:400,col:PINK,rot:-10});
    g('translate(1300,300)',function(){
      sh('M-100,0 A100,100 0 0,1 100,0',null,5); var a2=Math.PI+(.15+blast*.85)*Math.PI; line(0,0,Math.cos(a2)*84,Math.sin(a2)*84,7);
    });
  }
});

/* 8. Образцовая история культурного роста */
scene(S[22],S[26],function(t){
  floor(720);
  if(t<S[23]){
    var o=eo(ph(t,S[22]+.2,S[22]+1.2));
    g('translate(800,420)',function(){
      sh('M0,-180 L-'+r2(320*o)+',-150 L-'+r2(320*o)+',180 L0,200Z','#fff',6);
      sh('M0,-180 L'+r2(320*o)+',-150 L'+r2(320*o)+',180 L0,200Z','#fff',6);
      line(0,-180,0,200,5);
      if(o>.8){ tx(-160,-60,'БИОГРАФИЯ',30,{font:'Rubik Mono One',weight:400}); tx(160,-60,'глава 1',40,{}); for(var q=0;q<5;q++){ line(-280,0+q*30,-40,6+q*30,3); line(40,6+q*30,280,q*30,3); } }
    });
  } else if(t<S[25]){
    /* лестница: от диска до бюста и дальше */
    var steps=7;
    for(var k=0;k<steps;k++){ sh(rect(220+k*170,660-k*70,170,720-(660-k*70)+60,0),k%2?YEL:'#fff',5); }
    g('translate(300,600)',function(){ record(0,0,50,'#9fe0ff',0); tx(0,90,'Nickelback',30,{}); });
    g('translate(1110,330)',function(){ /* бюст Баха */ sh(rect(-60,40,120,60,4),GREY,4); sh('M-50,40 C-60,-10 -40,-40 0,-40 C40,-40 60,-10 50,40Z','#fff',4);
      sh('M-56,-10 C-80,-60 -50,-110 0,-112 C50,-110 80,-60 56,-10 C60,-40 40,-70 0,-70 C-40,-70 -60,-40 -56,-10Z','#fff',4);
      for(var c=0;c<4;c++){ sh(circ(-60,-40+c*18,12),'#fff',3); sh(circ(60,-40+c*18,12),'#fff',3); }
      tx(0,140,'Бах',40,{}); });
    g('translate(1400,170)',function(){ /* послевоенный авангард: подготовленный рояль */ sh('M-80,40 L80,40 L80,0 C70,-60 -20,-70 -50,-40 L-80,0Z',DARK,4);
      for(var n=0;n<5;n++) line(-60+n*28,-30,-54+n*28,-70,4); tx(0,100,'авангард',36,{}); tx(0,-90,'4′33″',30,{font:'Rubik Mono One',weight:400,col:PINK}); });
    var p=ph(t,S[23]+.5,SE[23]);
    var si=Math.min(steps-1,Math.floor(p*steps)), fr=p*steps-si;
    var gx=305+si*170+fr*170, gy=660-si*70-Math.sin(fr*Math.PI)*30;
    if(t<S[24]) ver(5,gx,gy,.6,{walk:t*10,mouth:'smile',t:t,tag:false});
    else{
      ver(5,1150,590-6*70+60,.62,{mouth:'grin',t:t,tag:false,armR:2.6});
      /* статистика: пирог, где академическая доля перевалила за половину */
      var u=eo(ph(t,S[24]+.6,S[24]+3.5));
      g('translate(520,280)',function(){
        sh(circ(0,0,150),'#fff',5);
        var a=-Math.PI/2+u*1.14*Math.PI;
        sh('M0,0 L0,-150 A150,150 0 '+(u*1.14>1?1:0)+',1 '+r2(Math.cos(a)*150)+','+r2(Math.sin(a)*150)+'Z',PINK,5);
        tx(0,200,'академическая: больше половины',32,{});
      });
    }
  } else {
    /* венок, кубок, печать «образцово» */
    for(var k2=0;k2<7;k2++){ sh(rect(220+k2*170,660-k2*70,170,720-(660-k2*70)+60,0),k2%2?YEL:'#fff',5); }
    ver(5,1150,590-6*70+60,.64,{mouth:'grin',eyes:'happy',t:t,tag:false,armL:2.8,armR:2.8,bendL:-.1,bendR:-.1,
      hold:function(h){ sh('M'+r2(h.r[0]-20)+','+r2(h.r[1]-60)+' l40,0 l-6,50 l-28,0Z',YEL,4); }});
    g('translate(1150,108) scale(.66)',function(){ for(var q=0;q<7;q++){ var a=Math.PI+q/6*Math.PI; sh(ell(Math.cos(a)*70,Math.sin(a)*30,16,8),TEAL,3); } });
    g('translate(480,300) rotate(-14) scale('+r2(pop(t,S[25]+1,.35))+')',function(){ sh(circ(0,0,130),null,10); sh(circ(0,0,108),null,4); tx(0,14,'ОБРАЗЦОВО',30,{font:'Rubik Mono One',weight:400,col:PINK}); });
    caption(800,120,'история культурного роста',56,S[25]+.3,t,{});
  }
});

/* 9. Её портят: A$AP Rocky до дыр, трек из TikTok, вещи вне схемы */
scene(S[26],S[30],function(t){
  floor(720);
  /* та же лестница, но уже не парадная */
  for(var k=0;k<7;k++){ sh(rect(220+k*170,660-k*70,170,720-(660-k*70)+60,0),k%2?YEL:'#fff',5); }
  var roll=eo(ph(t,S[26]+.3,S[26]+2.2));
  var rx=lerp(-120,560,roll);
  g('translate('+r2(rx)+',560)',function(){
    record(0,0,110,PINK,roll*720,[[.55,.2,.12],[-.4,.5,.1],[.1,-.62,.13],[-.66,-.2,.09],[.62,-.4,.08],[.2,.7,.1]]);
    tx(0,8,'A$AP',24,{font:'Rubik Mono One',weight:400});
  });
  if(t>S[26]+2.4){ var mu=pop(t,S[26]+2.4,.3); g('translate('+r2(rx+60)+',520) scale('+r2(mu)+')',function(){ sh(ell(0,0,22,16),GREY,3); sh(circ(-12,-14,8),GREY,3); sh(circ(10,-14,8),GREY,3); solid(circ(-4,-2,3)); line(20,4,48,-8,3); }); }
  if(t>S[26]+2.6) caption(560,380,'до дыр',54,S[26]+2.6,t,{rot:-6,col:PINK});
  ver(5,1150,590-6*70+60,.64,{mouth:t>S[26]+1.5?'o':'grin',eyes:t>S[26]+1.5?'wide':'happy',t:t,tag:false,tilt:t>S[26]+1.5?-8:0});
  if(t>S[27]){
    /* телефон на пружине */
    var j=pop(t,S[27],.35), bob=Math.abs(Math.sin((t-S[27])*6))*30;
    g('translate(880,'+r2(700-j*180-bob)+')',function(){
      for(var q=0;q<6;q++) sh('M-20,'+(40+q*14)+' q20,-10 40,0',null,4);
      sh(rect(-50,-90,100,170,16),DARK,5); sh(rect(-38,-72,76,120,6),TEAL,3);
      tx(0,-6,'♪',50,{col:PINK}); solid(circ(0,64,6),PAPER);
    });
    /* телефон поёт: строчка тянется, как в том самом треке */
    var ly=t<S[28]+1?pop(t,S[27]+.35,.35):0;
    if(ly>0) g('translate(560,230) rotate('+r2(-5+wig(t,1.6,2.5))+') scale('+r2(ly)+')',function(){
      bubble(-250,-70,500,110,230,120,YEL);
      tx(0,6,'возьми телефоон деткаа',44,{col:INK});
      tx(-215,-40,'♪',40,{col:PINK}); tx(220,20,'♫',40,{col:PINK});
    });
  }
  if(t>S[28]){
    /* гремлины вне схемы */
    for(var q2=0;q2<6;q2++){
      var ta=S[28]+.3+q2*.5; if(t<ta) continue;
      var gx=300+q2*170, gy=640-q2*70-8+wig(t+q2,1.5,6);
      g('translate('+gx+','+gy+') scale('+r2(pop(t,ta,.3)*.7)+')',function(){
        record(0,-30,34,[YEL,TEAL,PINK][q2%3],t*100); solid(circ(-10,-40,4)); solid(circ(10,-40,4)); sh('M-10,-24 Q0,-16 10,-24',null,3);
        line(-20,0,-26,20,4); line(20,0,26,20,4);
      });
    }
    if(t>S[28]+2) caption(560,200,'НЕ ПО СХЕМЕ',50,S[28]+2,t,{font:'Rubik Mono One',weight:400,col:PINK,rot:-4});
  }
  if(t>S[29]){ caption(760,300,'и хорошо',80,S[29],t,{rot:-4}); }
});

/* 10. Обмен вкуса не работает; ошибкой не объявлять; навещать прежнего себя */
scene(S[30],S[33],function(t){
  floor(720);
  if(t<S[31]){
    /* автомат обмена */
    g('translate(800,420)',function(){
      sh(rect(-220,-280,440,560,20),TEAL,6); sh(rect(-180,-240,360,160,10),'#fff',4);
      tx(0,-190,'ОБМЕН ВКУСА',30,{font:'Rubik Mono One',weight:400}); tx(0,-130,'плохой → хороший',40,{});
      sh(rect(-120,-40,240,70,8),DARK,4); sh(rect(-60,80,120,120,8),'#fff',4);
      var shake=t>S[30]+2?wig(t,9,6):0;
      g('translate('+r2(shake)+',0)',function(){ sh(circ(150,20,20),YEL,3); sh(circ(150,90,20),PINK,3); });
      if(t>S[30]+2.2){ sign(0,120,320,90,'НЕ РАБОТАЕТ',24,YEL,S[30]+2.2,t,-8); }
      if(t>S[30]+2.4) for(var q=0;q<5;q++){ var u=((t*.8+q/5)%1); solid(circ(-40+q*20,-300-u*160,10+u*14),'rgba(120,120,120,'+(1-u)*.6+')'); }
    });
    ver(0,300,730,1.05,{mouth:'grin',t:t,horns:'r',armR:2.6,bendR:.2});
  } else if(t<S[32]){
    /* версии в ряд; штамп «ОШИБКА» не опускается */
    for(var k=0;k<6;k++) ver(k,220+k*232,730,.8,{mouth:k===5?'smile':'grin',eyes:k===5?'dot':'happy',t:t,tilt:wig(t+k,.6,3)});
    var sd=eo(ph(t,S[31]+.3,S[31]+1.4)), catchIt=t>S[31]+1.6;
    g('translate(640,'+r2(lerp(-120,200,sd))+') rotate(-10)',function(){
      sh(rect(-40,-110,80,110,10),'#b8875a',4); sh(rect(-110,0,220,60,8),PINK,5); tx(0,44,'ОШИБКА',26,{font:'Rubik Mono One',weight:400});
    });
    if(catchIt){ line(1370,470,1300,300,7); caption(1060,190,'БЫЛО',70,S[31]+2.2,t,{font:'Rubik Mono One',weight:400,col:TEAL,rot:-8}); caption(1060,260,'не ошибка',46,S[31]+2.6,t,{rot:-6}); }
  } else {
    /* визит к двери «11–15» */
    sh(rect(900,250,260,470,8),PINK,6); tx(1030,320,'11–15',60,{}); sh(circ(1130,500,12),YEL,3);
    tx(1030,380,'не входить!!!',34,{col:DARK});
    var open=eo(ph(t,S[32]+2,S[32]+3));
    if(open>0){ sh('M900,250 L'+r2(900-open*90)+',270 L'+r2(900-open*90)+',700 L900,720Z',YEL,5);
      ver(0,1030,720,.9,{mouth:'o',eyes:'wide',t:t,tag:false}); }
    ver(5,lerp(300,700,eo(ph(t,S[32],S[32]+1.6))),730,1.15,{walk:t<S[32]+1.6?t*12:0,armR:1.7,bendR:.4,mouth:'smile',t:t,tag:false,
      hold:function(h){ g('translate('+r2(h.r[0]+40)+','+r2(h.r[1]-20)+')',function(){ sh(rect(-50,-30,100,50,6),YEL,4); sh(rect(-50,-40,100,14,4),PINK,3); line(0,-40,0,-64,3); sh('M0,-64 q-6,-10 0,-18 q6,8 0,18Z',PINK,2); }); }});
    g('translate(700,585) rotate(8)',function(){ sh(rect(-50,-20,100,40,6),'#fff',3); tx(0,12,'ГОСТЬ',22,{font:'Rubik Mono One',weight:400}); });
    caption(560,160,'без обязательства остаться',48,S[32]+3.2,t,{rot:-3});
  }
});

/* 11. Финал: перестаём спорить, старый альбом, припев, погромче */
scene(S[33],END,function(t){
  var party=t>SE[37]+.2;
  floor(720);
  if(!party){
    /* диван */
    sh(rect(360,520,880,160,30),TEAL,6); sh(rect(330,480,90,200,30),TEAL,5); sh(rect(1180,480,90,200,30),TEAL,5); shade(rect(360,600,880,80,30),'ht',.35);
    turntable(1420,700,.6,t,t>S[34]+.6,t>S[34]+.6);
    var argue=t<S[33]+2;
    var blast=eo(ph(t,S[36]+.2,S[36]+.9));
    ver(0,640,664,.9,{sit:1,mouth:argue?'talk':'grin',t:t,armR:t>S[34]&&t<S[35]?2.2:.5,tilt:blast>0?Math.sin(t*8.8)*14:0,horns:blast>0?'r':null,tag:false});
    ver(5,940,664,.9,{sit:1,mouth:t>S[35]&&t<S[36]+.3?'talk':(blast>0?'grin':'smile'),t:t,armR:t>S[35]&&t<S[36]?2.5:.4,bendR:.2,tag:false,tilt:-blast*16,eyes:blast>.5?'closed':'dot'});
    if(argue){ g('translate(800,250)',function(){ bubble(-230,-70,200,90,40,90); tx(-130,-14,'МОЁ!',30,{font:'Rubik Mono One',weight:400}); bubble(30,-80,200,90,120,100); tx(130,-24,'НЕТ, МОЁ!',22,{font:'Rubik Mono One',weight:400}); }); }
    else if(t<S[34]) g('translate(790,330) scale('+r2(pop(t,S[33]+2,.3))+')',function(){ sh('M-40,0 C-40,-40 40,-40 40,0',null,5); solid(circ(-30,4,12),PAPER); caption(0,-60,'мир',80,S[33]+2.2,t,{}); });
    if(t>S[34]&&t<S[35]) caption(1420,420,'шшш… клац',40,S[34]+.4,t,{col:PINK});
    if(t>S[35]){
      /* лекция — пузырь наполняется Бахом, пианистами, графиками… */
      var bw=lerp(120,560,eo(ph(t,S[35],S[35]+2.4)));
      var fly=blast;
      g('translate('+r2(1100+fly*700)+','+r2(240-fly*200)+') rotate('+r2(fly*40)+')',function(){
        bubble(-bw/2,-120,bw,190,-bw*.2,120);
        var icons=['Бах','3 пианиста','авангард','график'];
        icons.forEach(function(ic,i){ if(t>S[35]+.4+i*.6) tx(-bw/2+100+i*125,-10+((i%2)*44),ic,40,{col:[PINK,INK,TEAL,INK][i]}); });
      });
    }
    if(blast>0){ for(var w=0;w<6;w++){ var u=((t*2+w/6)%1)*blast; sh('M'+r2(1320-u*900)+','+r2(420-u*200)+' Q'+r2(1320-u*1100)+',620 '+r2(1320-u*900)+','+r2(820+u*120),null,9*(1-u)+2); } caption(700,160,'ПРИПЕВ',100,S[36]+.2,t,{font:'Rubik Mono One',weight:400,col:PINK,rot:-6}); }
    if(t>S[37]){
      var v=lerp(3,11,eio(ph(t,S[37]+.8,SE[37]+.1)));
      g('translate(0,0)',function(){ sh(rect(1120,120,420,420,30),'#fff',6); knob(1330,330,90,v); });
    }
  } else {
    /* все версии трясут головой; пластинки летят как конфетти */
    var pt=t-SE[37];
    for(var q=0;q<18;q++){ var cx=(hsh(q)*1700-50), cy=((pt*220*(0.6+hsh(q+4)))+hsh(q+8)*900)%1000-100; record(cx,cy,18+hsh(q+2)*20,[PINK,YEL,TEAL][q%3],pt*200*(q%2?1:-1)); }
    speaker(160,720,1.2,Math.abs(Math.sin(t*8.8))); speaker(1440,720,1.2,Math.abs(Math.sin(t*8.8+1)));
    for(var k=0;k<6;k++){
      var bang=Math.sin(t*8.8+k*.3)*18;
      ver(k,330+k*190,720,.72,{tilt:bang,horns:'r',armR:2.7,bendR:.2,mouth:'scream',t:t,bob:-Math.abs(Math.sin(t*8.8+k))*14});
    }
    var tt=ph(t,SE[37]+4.5,SE[37]+5.3);
    if(tt>0) g('translate(800,300) scale('+r2(back(tt))+')',function(){
      sh(rect(-360,-110,720,220,24),'#fff',7);
      tx(0,-10,'ОДНА ВЕЩЬ',74,{font:'Rubik Mono One',weight:400,col:PINK});
      tx(0,60,'моя музыкальная эволюция',44,{});
    });
  }
});

/* рукописный номер главы в углу */
var CH=['I · тесно','II · комната','III · подросток','IV · нынешний я','V · слышать больше','VI · старые песни','VII · трек №7','VIII · биография','IX · не по схеме','X · без ошибки','XI · погромче'];
function chapter(t,idx,a){
  var u=pop(t,a+.2,.4); if(u<=0) return;
  g('translate(64,78) rotate(-3) scale('+r2(u)+')',function(){
    tx(0,0,CH[idx]||'',52,{anchor:'start',col:INK});
    sh('M0,14 Q'+r2(CH[idx].length*12)+',24 '+r2(CH[idx].length*23)+',12',null,3);
  });
}

/* ============================================================== экспорт */
export var SCENES=SC.map(function(s,i){ return {a:s.a,b:s.b,label:CH[i]}; });
export var FILM_END=END;
export var CUES=TIMING.cues;
/* кадр главы idx во время t: сцена, номер главы, рамка */
export function drawScene(idx,t){
  O=[];
  var cur=SC[idx];
  cur.fn(t);
  chapter(t,idx,cur.a);
  sh(rect(18,16,1564,868,26),null,5);
  return O.join('');
}
/* бумага: зерно считается один раз на вкладку */
var paperUrl=null;
/* global document */
export function paper(){
  if(paperUrl) return paperUrl;
  var c=document.createElement('canvas'); c.width=800; c.height=450;
  var x=c.getContext('2d'), im=x.createImageData(800,450), d=im.data;
  for(var i=0;i<d.length;i+=4){ var n=hsh(i*.37)*28+hsh(i*.011)*10; d[i]=244-n; d[i+1]=236-n; d[i+2]=217-n*.8; d[i+3]=255; }
  x.putImageData(im,0,0);
  for(var k=0;k<60;k++){ x.fillStyle='rgba(120,100,80,'+(hsh(k)*.06)+')'; x.beginPath(); x.arc(hsh(k+1)*800,hsh(k+2)*450,hsh(k+3)*3+.5,0,7); x.fill(); }
  paperUrl=c.toDataURL('image/jpeg',.85);
  return paperUrl;
}
export {INK,PAPER};
/* лист персонажа для Remotion Studio: все версии рядом */
export function drawCast(t){
  O=[];
  floor(760);
  for(var k=0;k<6;k++) ver(k,170+k*252,760,1.45,{t:t,mouth:['grin','smile','talk','smile','flat','smile'][k],eyes:k===4?'side':'dot',armR:k===5?2.3:.25});
  return O.join('');
}
