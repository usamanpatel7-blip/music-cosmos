#!/usr/bin/env python3
"""Сопоставляет текст эссе (essay.txt) со словами из asr.json: у каждой фразы
появляется начало и конец в склеенной дорожке. → words.json"""
import json, re, difflib, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
A=json.load(open('asr.json')); S=[l.strip() for l in open('essay.txt',encoding='utf-8') if l.strip()]
GAP=0.8  # пауза между частями в склейке (та же в audio.py)
d1=A.get('p1_dur',76.39)
asr=[dict(w,t0=w['start'],t1=w['end']) for w in A['p1']]+[dict(w,t0=w['start']+d1+GAP,t1=w['end']+d1+GAP) for w in A['p2']]
def norm(w): return re.sub(r'[^а-яa-z0-9]','',w.lower().replace('ё','е'))
ew=[]  # essay words with sentence index
for si,s in enumerate(S):
    for w in s.split():
        n=norm(w)
        if n: ew.append((n,si,w))
aw=[norm(w['word']) for w in asr]
# DP alignment
n,m=len(ew),len(aw)
import numpy as np
def sim(a,b):
    if a==b: return 2
    r=difflib.SequenceMatcher(None,a,b).ratio()
    return 1 if r>=.6 else -1
D=np.zeros((n+1,m+1)); B=np.zeros((n+1,m+1),int)
for i in range(1,n+1): D[i][0]=-i*.6; B[i][0]=1
for j in range(1,m+1): D[0][j]=-j*.6; B[0][j]=2
for i in range(1,n+1):
    for j in range(1,m+1):
        c=[D[i-1][j-1]+sim(ew[i-1][0],aw[j-1]), D[i-1][j]-.6, D[i][j-1]-.6]
        k=int(np.argmax(c)); D[i][j]=c[k]; B[i][j]=k
i,j=n,m; match={}
while i>0 and j>0:
    k=B[i][j]
    if k==0:
        if sim(ew[i-1][0],aw[j-1])>0: match[i-1]=j-1
        i-=1;j-=1
    elif k==1: i-=1
    else: j-=1
# per sentence: first/last matched word times
res=[]
for si,s in enumerate(S):
    idx=[k for k in range(n) if ew[k][1]==si and k in match]
    tot=sum(1 for k in range(n) if ew[k][1]==si)
    if idx:
        res.append({'s':s,'t0':asr[match[idx[0]]]['t0'],'t1':asr[match[idx[-1]]]['t1'],'cov':len(idx)/tot})
    else: res.append({'s':s,'t0':None,'t1':None,'cov':0})
missing=[ew[k][2] for k in range(n) if k not in match]
for r in res: print('%7s %7s %3.0f%%  %s'%(r['t0'] and round(r['t0'],2), r['t1'] and round(r['t1'],2), r['cov']*100, r['s'][:70]))
print('unmatched essay words:', ' '.join(missing))
json.dump({'res':res,'asr':asr,'match':{str(k):v for k,v in match.items()},'ew':ew},open('words.json','w'),ensure_ascii=False)
