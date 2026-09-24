#!/usr/bin/env python3
"""Субтитры и времена фраз для фильма из words.json → timing.json"""
import json, re, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
W=json.load(open('words.json')); res=W['res']; asr=W['asr']; ew=W['ew']; match={int(k):v for k,v in W['match'].items()}
# текст так, как он прозвучал
FIX={'Один AC/DC, одна пластинка, никаких сомнений и перескоков.':'Один AC/DC, одна пластинка, никаких сомнений.',
     'Например, можно рассказать, как человек, слушавший Nickelback, постепенно пришёл к Баху и послевоенному авангарду.':'Например, можно рассказать, как человек, слушавший Nickelback, постепенно перешёл к Баху и послевоенному авангарду.'}
# время каждого слова эссе (по совпадению или интерполяцией)
wt=[None]*len(ew)
for k in range(len(ew)):
    if k in match: wt[k]=(asr[match[k]]['t0'],asr[match[k]]['t1'])
cues=[]; sent=[]
for si,r in enumerate(res):
    text=FIX.get(r['s'],r['s'])
    words=text.split()
    ks=[k for k in range(len(ew)) if ew[k][1]==si]
    # приписываем время словам текста по порядку исходных слов
    times=[]
    for j,w in enumerate(words):
        k=ks[min(j,len(ks)-1)] if ks else None
        times.append(wt[k] if k is not None else None)
    # заполнить пропуски
    t0,t1=r['t0'],r['t1']
    for j in range(len(times)):
        if times[j] is None:
            prev=next((times[i][1] for i in range(j-1,-1,-1) if times[i]),t0)
            nxt=next((times[i][0] for i in range(j+1,len(times)) if times[i]),t1)
            times[j]=(prev,max(prev,nxt))
    sent.append({'i':si,'t0':round(t0,2),'t1':round(t1,2),'s':text})
    # фраза — один субтитр (две строки); длиннее 100 знаков — две половины,
    # разрезанные у знака препинания ближе к середине
    parts=[list(range(len(words)))]
    if len(text)>100:
        mid=len(text)/2; best=None; pos=0
        for j,w in enumerate(words[:-1]):
            pos+=len(w)+1
            sc=abs(pos-mid)-(18 if re.search(r'[,:;]$',w) else 0)
            if best is None or sc<best[0]: best=(sc,j)
        parts=[list(range(best[1]+1)),list(range(best[1]+1,len(words)))]
    for c in parts:
        a=times[c[0]][0]; b=times[c[-1]][1]
        cues.append({'t0':round(a,2),'t1':round(b,2),'s':' '.join(words[i] for i in c)})
# субтитр держится до начала следующего, но не дольше +0.8 с после конца речи
for i,c in enumerate(cues):
    nxt=cues[i+1]['t0'] if i+1<len(cues) else c['t1']+1.5
    c['t1']=round(min(nxt-0.05,c['t1']+0.8),2)
kw={}
for key,pat in [('acdc','AC/DC'),('mono','монотеизм'),('three','трёх'),('nickel','Nickelback'),('bach','Баху'),('avant','авангарду'),('asap','альбом'),('tiktok','TikTok'),('stat','Статистика'),('half','половины'),('chorus','припев'),('louder','погромче'),('puts','ставит'),('off','выключить'),('ear','слышать'),('mirror','замечаешь'),('delete','Удалить'),('remember','помнит'),('old','припеву')]:
    for k,(n,si,w) in enumerate(ew):
        if pat.lower().replace('ё','е') in w.lower().replace('ё','е'):
            if wt[k]: kw[key]=round(wt[k][0],2)
            break
json.dump({'cues':cues,'sent':sent,'kw':kw},open('timing.json','w'),ensure_ascii=False,indent=0)
for c in cues: print('%7.2f %7.2f %s'%(c['t0'],c['t1'],c['s']))
print(kw)
