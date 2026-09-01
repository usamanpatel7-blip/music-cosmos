#!/usr/bin/env python3
"""Собирает docs/ в один самодостаточный файл для публикации артефактом.

Каждая страница кладётся в свой iframe через srcdoc: у страниц собственные
:root, body и #hud, и без изоляции они бы передрались стилями. Ссылки внутри
страниц перехватываются и переключают оболочку, а не ведут в никуда.
"""
import base64, io, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT  = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'site.html')

PAGES = [
    ('08-cosmos',   '08', 'Живая карта',  'данные'),
    ('07-scale',    '07', 'Масштабы',     'заглушки'),
    ('06-forms',    '06', 'Формы',        ''),
    ('05-dive',     '05', 'Нырок',        ''),
    ('04-concepts', '04', 'Концепции',    ''),
    ('03-frame',    '03', 'Кадр',         ''),
    ('02-visual',   '02', 'Направление',  ''),
    ('01-order',    '01', 'Приоритеты',   ''),
    ('00-plan',     '00', 'План работ',   ''),
    ('index',       '',   'Обзор',        ''),
]

# Дописывается в конец каждой страницы перед показом. Внутри srcdoc
# относительная ссылка ведёт в никуда, поэтому она переключает оболочку.
HOOK = (
    '\n<script>document.addEventListener("click",function(e){'
    'var a=e.target.closest&&e.target.closest("a[href]");if(!a)return;'
    'var m=(a.getAttribute("href")||"").match(/^([\\w-]+)\\.html$/);'
    'if(!m)return;e.preventDefault();'
    'try{parent.postMessage({mc:m[1]},"*");}catch(x){}'
    '},true);</script>\n')

data, total = {}, 0
for slug, _, _, _ in PAGES:
    raw = io.open(os.path.join(ROOT, 'docs', slug + '.html'), 'rb').read()
    total += len(raw)
    data[slug] = base64.b64encode(raw).decode('ascii')

def tab(slug, num, name, tag):
    chip = '<i>' + tag + '</i>' if tag else ''
    return ('    <button type="button" role="tab" data-p="' + slug +
            '" aria-selected="false">' + (('<b>' + num + '</b>') if num else '') + name + chip + '</button>')
tabs = '\n'.join(tab(*p) for p in PAGES)

html = '''<title>Music Cosmos</title>
<style>
  /* Оболочка намеренно одноцветная и тёмная: это рама вокруг работы,
     а не ещё одна страница. Внутренние страницы держат свои темы сами. */
  :root{
    --bg:#05070e; --chrome:#080c17; --ink:#e9edf8; --dim:#8d95af;
    --line:rgba(140,160,220,.16); --acc:#9a8bff;
    --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
    --sans:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);}
  #shell{display:flex;flex-direction:column;height:100vh;height:100dvh;background:var(--bg);}
  #nav{flex:none;display:flex;align-items:stretch;gap:0;overflow-x:auto;
    background:var(--chrome);border-bottom:1px solid var(--line);
    scrollbar-width:thin;-webkit-overflow-scrolling:touch;}
  #nav::-webkit-scrollbar{height:0}
  #nav button{flex:none;display:flex;align-items:baseline;gap:7px;
    background:none;border:0;border-bottom:2px solid transparent;
    color:var(--dim);font-family:var(--sans);font-size:13px;line-height:1;
    padding:13px 15px 12px;cursor:pointer;white-space:nowrap;
    transition:color .15s,border-color .15s,background .15s;}
  #nav button b{font-family:var(--mono);font-size:10.5px;font-weight:500;
    letter-spacing:.08em;color:var(--acc);opacity:.75;}
  #nav button i{font-style:normal;font-family:var(--mono);font-size:9.5px;
    color:var(--dim);border:1px solid var(--line);border-radius:999px;
    padding:2px 7px;opacity:.8;}
  #nav button:hover{color:var(--ink);background:rgba(154,139,255,.07);}
  #nav button[aria-selected=true]{color:var(--ink);border-bottom-color:var(--acc);
    background:rgba(154,139,255,.10);}
  #nav button[aria-selected=true] b{opacity:1;}
  #nav button:focus-visible{outline:2px solid var(--acc);outline-offset:-3px;}
  #stage{flex:1;min-height:0;position:relative;background:var(--bg);}
  #page{position:absolute;inset:0;width:100%;height:100%;border:0;display:block;}
  #warn{position:absolute;inset:0;display:none;place-items:center;padding:32px;
    text-align:center;color:var(--dim);font-size:14px;line-height:1.6;}
  #warn.on{display:grid;}
  @media (max-width:620px){
    #nav button{font-size:12px;padding:11px 12px 10px;}
    #nav button i{display:none;}
  }
  @media (prefers-reduced-motion: reduce){ #nav button{transition:none} }
</style>

<div id="shell">
  <div id="nav" role="tablist" aria-label="Страницы Music Cosmos">
__TABS__
  </div>
  <div id="stage">
    <iframe id="page" title="Страница Music Cosmos"></iframe>
    <div id="warn">Страница не открылась в рамке. Тот же сайт лежит в репозитории:
      каждый файл из <code>docs/</code> открывается сам по себе.</div>
  </div>
</div>

<script>
var PAGES=__PAGES__;
var nav=document.getElementById('nav'), frame=document.getElementById('page'),
    warn=document.getElementById('warn'), cur=null;

function decode(b){
  var bin=atob(b), n=bin.length, u=new Uint8Array(n);
  for(var i=0;i<n;i++) u[i]=bin.charCodeAt(i);
  return new TextDecoder('utf-8').decode(u);
}
/* Перехват ссылок вшивается в саму страницу, а не вешается на событие load
   рамки: у srcdoc это событие приходит непредсказуемо, и обработчик мог
   не успеть встать. Внутри srcdoc относительная ссылка ведёт в никуда,
   поэтому она переключает оболочку. */
var HOOK=__HOOK__;
function show(slug,fallback){
  if(!PAGES[slug]){ if(!fallback) return false; slug='08-cosmos'; }
  if(slug===cur) return true;
  cur=slug;
  var b=nav.querySelectorAll('button');
  for(var i=0;i<b.length;i++)
    b[i].setAttribute('aria-selected', b[i].dataset.p===slug ? 'true':'false');
  /* Хук ставится в самое начало <head>: ниже по документу идут ссылки на
     веб-шрифты, а они задерживают выполнение всех следующих скриптов до
     ответа сети — при недоступной сети на секунды. */
  var src=decode(PAGES[slug]), at=src.indexOf('<head>');
  frame.srcdoc = at<0 ? HOOK+src : src.slice(0,at+6)+HOOK+src.slice(at+6);
  if(location.hash.slice(1)!==slug) history.replaceState(null,'','#'+slug);
  var sel=nav.querySelector('button[data-p="'+slug+'"]');
  if(sel&&sel.scrollIntoView) sel.scrollIntoView({block:'nearest',inline:'nearest'});
  return true;
}
nav.addEventListener('click',function(e){
  var b=e.target.closest('button[data-p]'); if(b) show(b.dataset.p);
});
window.addEventListener('hashchange',function(){ show(location.hash.slice(1),true); });
/* Страница внутри рамки просит переключиться сообщением, а не обращением к
   родителю напрямую: при file:// прямой доступ закрыт, а сообщение проходит. */
window.addEventListener('message',function(e){
  if(e.source!==frame.contentWindow) return;
  var d=e.data;
  if(d&&typeof d.mc==='string') show(d.mc,false);
});
setTimeout(function(){ if(!frame.srcdoc) warn.className='on'; },2500);
show(location.hash.slice(1),true);
</script>
'''.replace('__TABS__', tabs).replace('__PAGES__', json.dumps(data, ensure_ascii=False)).replace('__HOOK__', json.dumps(HOOK).replace('</', '<\\/'))

io.open(OUT, 'w', encoding='utf-8').write(html)
print('%s \u2014 %d страниц, исходно %.0f \u041a\u0411, файл %.0f \u041a\u0411'
      % (os.path.basename(OUT), len(PAGES), total/1024.0, len(html.encode('utf-8'))/1024.0))
