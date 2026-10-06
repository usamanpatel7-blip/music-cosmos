#!/usr/bin/env python3
"""Огибающая и спектр фонограммы для анимации под звук (без браузера).

    python3 gen/audio_env.py public/film-audio.m4a src/comic

Пишет env.json (громкость rms и удар в низах bass на каждый кадр) и
spec.json (12 полос спектра на кадр, 0…99) — сцены читают их по времени.
"""
import json, subprocess, sys
import numpy as np

FPS, SR, BANDS = 24, 22050, 12
src, out = sys.argv[1], sys.argv[2]
pcm = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", src, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                     capture_output=True, check=True).stdout
x = np.frombuffer(pcm, np.float32)
hop, win = SR // FPS, 2048
n = len(x) // hop
pad = np.concatenate([np.zeros(win // 2, np.float32), x, np.zeros(win, np.float32)])
w = np.hanning(win)
freqs = np.fft.rfftfreq(win, 1 / SR)
edges = np.geomspace(40, 9000, BANDS + 1)
rms, bass, spec = [], [], []
for i in range(n):
    seg = pad[i * hop:i * hop + win] * w
    mag = np.abs(np.fft.rfft(seg))
    rms.append(float(np.sqrt(np.mean(seg ** 2))))
    bass.append(float(mag[(freqs > 35) & (freqs < 160)].sum()))
    spec.append([float(mag[(freqs >= a) & (freqs < b)].mean()) for a, b in zip(edges[:-1], edges[1:])])
rms, bass, spec = np.array(rms), np.array(bass), np.log1p(np.array(spec))
rms /= np.percentile(rms, 98)
# удар — рост энергии в низах относительно недавнего среднего
flux = np.maximum(0, bass - np.convolve(bass, np.ones(6) / 6, "same"))
flux /= np.percentile(flux, 98) or 1
spec -= np.percentile(spec, 5, axis=0)
spec /= np.percentile(spec, 99, axis=0)
r = lambda a: [round(float(v), 3) for v in np.clip(a, 0, 1.5)]
json.dump({"fps": FPS, "rms": r(rms), "bass": r(flux)}, open(f"{out}/env.json", "w"))
json.dump([[int(v) for v in np.clip(row * 99, 0, 99)] for row in spec], open(f"{out}/spec.json", "w"), separators=(",", ":"))
print(n, "кадров")
