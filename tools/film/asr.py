#!/usr/bin/env python3
"""Распознаёт голос (voice/part1.m4a, part2.m4a) и сохраняет слова со временем.

Модель — русская Vosk small (vosk-model-small-ru-0.4), путь в VOSK_MODEL.
    VOSK_MODEL=/path/to/model python3 asr.py      → asr.json
"""
import json, os, subprocess, vosk
HERE=os.path.dirname(os.path.abspath(__file__))
vosk.SetLogLevel(-1)
m=vosk.Model(os.environ.get('VOSK_MODEL','/tmp/vosk/vosk-model-small-ru-0.4'))
out={}
for k,f in (('p1','part1'),('p2','part2')):
    raw=subprocess.run(['ffmpeg','-v','error','-i',os.path.join(HERE,'voice',f+'.m4a'),'-ac','1','-ar','16000','-f','s16le','-'],capture_output=True).stdout
    r=vosk.KaldiRecognizer(m,16000); r.SetWords(True); words=[]
    for i in range(0,len(raw),8000):
        if r.AcceptWaveform(raw[i:i+8000]): words+=json.loads(r.Result()).get('result',[])
    words+=json.loads(r.FinalResult()).get('result',[])
    out[k]=words; out[k+'_dur']=len(raw)/32000
json.dump(out,open(os.path.join(HERE,'asr.json'),'w'),ensure_ascii=False)
