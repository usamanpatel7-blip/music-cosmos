#!/usr/bin/env python3
"""Звук фильма: голос двумя частями, треск винила и синтезированный рифф
в финале → out/film-audio.wav и public/film-audio.m4a (звук для Remotion)."""
import numpy as np, subprocess, wave, os
HERE=os.path.dirname(os.path.abspath(__file__))
SR=48000
def load(f):
    raw=subprocess.run(['ffmpeg','-v','error','-i',f,'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True).stdout
    return np.frombuffer(raw,dtype=np.float32).copy()
p1=load(os.path.join(HERE,'voice','part1.m4a')); p2=load(os.path.join(HERE,'voice','part2.m4a'))
off2=len(p1)/SR+0.8
print('part2 offset',off2)
TOTAL=170.0
n=int(TOTAL*SR); out=np.zeros(n,np.float32)
voice=np.zeros(n,np.float32)
voice[:len(p1)]+=p1; s2=int(off2*SR); voice[s2:s2+len(p2)]+=p2
# голос: мягкая нормализация
pk=np.percentile(np.abs(voice[np.abs(voice)>0.01]),99.5); voice*=0.5/pk
rng=np.random.default_rng(7)
t=np.arange(n)/SR
# треск винила: редкие щелчки и тихое шипение
hiss=rng.normal(0,1,n).astype(np.float32)
b=np.zeros(n,np.float32); a=0.0
for i in range(0,n,1):
    pass
hiss=np.convolve(hiss,np.ones(6)/6,mode='same')*0.004
pops=np.zeros(n,np.float32)
for _ in range(int(TOTAL*3)):
    i=rng.integers(0,n-200); amp=rng.uniform(.02,.09)*(1 if rng.random()<.85 else 2.2)
    L=rng.integers(20,120); pops[i:i+L]+=amp*np.exp(-np.arange(L)/ (L/4))*rng.choice([-1,1])
crackle=(hiss+pops)*0.55
# рифф: 132 уд/мин, квинтаккорды, перегруз
bpm=132; beat=60/bpm; e8=beat/2
notes={'E':82.41,'G':98.0,'A':110.0,'D':73.42,'C':65.41,'B':61.74}
pattern=['E','E','x','E','G','x','A','x', 'E','E','x','E','D','x','C','B']
def guitar(f,dur,mute=False):
    m=int(dur*SR); tt=np.arange(m)/SR; s=np.zeros(m)
    for mul,g in [(1,1),(1.5,.8),(2,.55)]:
        for det in (-0.12,0.12):
            ph=(tt*f*mul*(1+det/100))%1; s+=g*(2*ph-1)
    s=np.tanh(s*3.2)
    env=np.minimum(1,tt/0.004)*np.exp(-tt/(0.09 if mute else 0.9))
    return s*env
def lp(x,a):
    y=np.zeros_like(x); v=0.0
    # однополюсный фильтр — векторно через lfilter-подобную рекурсию
    from itertools import accumulate
    return np.array(list(accumulate(x,lambda v,s: v+a*(s-v))),dtype=np.float32)
riff=np.zeros(n,np.float32); drums=np.zeros(n,np.float32)
t0=150.9; tend=166.5; k=0; tt=t0
while tt<tend:
    sym=pattern[k%len(pattern)]
    if sym!='x':
        i=int(tt*SR); g=guitar(notes[sym],e8*1.9,mute=(k%4==1)); riff[i:i+len(g)]+=g[:max(0,min(len(g),n-i))]
    # барабаны: бочка на 1 и 3, малый на 2 и 4, тарелочка на восьмые
    i=int(tt*SR)
    hh=rng.normal(0,1,int(.04*SR))*np.exp(-np.arange(int(.04*SR))/(.008*SR))*.18
    hh=hh-np.convolve(hh,np.ones(4)/4,'same'); drums[i:i+len(hh)]+=hh
    if k%4==0:
        L=int(.25*SR); x=np.arange(L)/SR; kick=np.sin(2*np.pi*(55+90*np.exp(-x*30))*x)*np.exp(-x*9); drums[i:i+L]+=kick*.9
    if k%4==2:
        L=int(.2*SR); x=np.arange(L)/SR; sn=(rng.normal(0,1,L)*.7+np.sin(2*np.pi*190*x)*.5)*np.exp(-x*18); drums[i:i+L]+=sn*.6
    k+=1; tt+=e8
# финальный аккорд
i=int(tend*SR); g=guitar(notes['E'],3.2); riff[i:i+len(g)]+=g[:n-i]
L=int(2.5*SR); x=np.arange(L)/SR; cr=rng.normal(0,1,L)*np.exp(-x*1.6)*.35; drums[i:i+L]+=cr
band=riff*0.33+drums*0.55
# громкость по сюжету: из соседней комнаты → припев → погромче
g=np.zeros(n,np.float32)
def ramp(a,b,va,vb):
    ia,ib=int(a*SR),int(b*SR); g[ia:ib]=np.linspace(va,vb,ib-ia)
ramp(150.9,151.4,0,.1); ramp(151.4,155.25,.1,.1); ramp(155.25,155.6,.1,.2); ramp(155.6,158.3,.2,.2); ramp(158.3,159.4,.2,1.0); ramp(159.4,166.5,1.0,1.0); ramp(166.5,170,1.0,1.0)
# пока тихо — глухо, как за стеной
quiet=lp(band,0.06); loud=band
mix_band=np.where(g<0.5,quiet*(1-g*1.4)+loud*g*1.4,loud)*g
out=voice+crackle*(1-np.clip((t-158.5)/1.5,0,1)*.7)+mix_band*0.9
fade=np.clip((TOTAL-t)/2.2,0,1); out*=fade
out=np.tanh(out*1.1)/1.1*0.95
wav=(np.clip(out,-1,1)*32767).astype(np.int16)
os.makedirs(os.path.join(HERE,'out'),exist_ok=True)
with wave.open(os.path.join(HERE,'out','film-audio.wav'),'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(wav.tobytes())
subprocess.run(['ffmpeg','-v','error','-y','-i',os.path.join(HERE,'out','film-audio.wav'),'-c:a','aac','-b:a','96k',os.path.join(HERE,'public','film-audio.m4a')])
print('ok',len(wav)/SR)
