#!/usr/bin/env python3
"""Звук фильма: голос тремя частями и немного музыки из библиотеки
(превью Apple, см. gen/music.py) → out/film-audio.wav и public/film-audio.m4a.

Голос не трогается лишний раз: фильтр от гула, мягкая компрессия, громкость
речи около −16 LUFS. Музыка звучит только там, где она часть рассказа, и
приглушается под речью. Времена — из src/timing.json (words.py, cues.py)."""
import json, os, subprocess, wave
import numpy as np
from scipy.signal import butter, sosfilt, sosfiltfilt

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
T = json.load(open(os.path.join(HERE, "src", "timing.json")))
S = [x["t0"] for x in T["sent"]]
E = [x["t1"] for x in T["sent"]]
KW = T["kw"]
TR = json.load(open(os.path.join(HERE, "src", "v5", "tracks.json")))
GAPS = [1.2, 1.0]  # те же, что в words.py
TOTAL = T["end"]
n = int(TOTAL * SR)
t = np.arange(n) / SR


def load(path, ch=1):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", str(ch), "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    x = np.frombuffer(raw, np.float32).astype(np.float64)
    return x.reshape(-1, ch) if ch > 1 else x


# ---------------------------------------------------------------- голос
voice = np.zeros(n)
o = 0.0
for k in (1, 2, 3):
    p = load(os.path.join(HERE, "voice", f"part{k}.m4a"))
    i = int(o * SR)
    voice[i:i + len(p)] += p[: max(0, n - i)]
    o += len(p) / SR + (GAPS[k - 1] if k <= len(GAPS) else 0)
voice = sosfiltfilt(butter(2, 70, "highpass", fs=SR, output="sos"), voice)
# огибающая речи (RMS 30 мс) и мягкая компрессия 2:1 выше порога
env = np.sqrt(np.convolve(voice**2, np.ones(1440) / 1440, "same")) + 1e-9
speech = env > np.percentile(env, 60)
lvl = 20 * np.log10(env)
thr = np.percentile(lvl[speech], 70)
gain_db = np.where(lvl > thr, (thr - lvl) * 0.5, 0.0)
gain_db = np.convolve(gain_db, np.ones(2400) / 2400, "same")  # плавно, 50 мс
voice *= 10 ** (gain_db / 20)
# громкость речи: RMS разборчивых участков → −20 dBFS (≈ −16 LUFS для голоса)
rms = np.sqrt(np.mean(voice[speech] ** 2))
voice *= 10 ** (-20 / 20) / rms
# «говорит ли сейчас» — для приглушения музыки: атака 80 мс, отпускание 450 мс
venv = np.sqrt(np.convolve(voice**2, np.ones(2400) / 2400, "same"))
talk = (venv > 10 ** (-38 / 20)).astype(np.float64)
a_up, a_dn = 1 - np.exp(-1 / (0.08 * SR)), 1 - np.exp(-1 / (0.45 * SR))
duck = np.zeros(n)
v = 0.0
step = 48  # огибающая считается каждые 1 мс
for j in range(0, n, step):
    target = talk[j]
    v += (target - v) * (1 - (1 - (a_up if target > v else a_dn)) ** step)
    duck[j:j + step] = v

# ---------------------------------------------------------------- музыка
music = np.zeros((n, 2))


def cue(key, at, dur, offset=0.0, level=0.5, under=0.12, fade_in=0.6, fade_out=1.2, lowpass=None):
    """Отрывок превью key: с секунды offset, в момент at, длиной dur.
    level — громкость в паузах, under — под речью (доля от level)."""
    x = load(os.path.join(HERE, "public", "music", f"{TR[key]['id']}.m4a"), 2)
    a = int(offset * SR)
    seg = x[a:a + int(dur * SR)].copy()
    if lowpass:
        seg = sosfilt(butter(2, lowpass, "lowpass", fs=SR, output="sos"), seg, axis=0)
    m = len(seg)
    env = np.ones(m)
    fi, fo = int(fade_in * SR), int(fade_out * SR)
    if fi:
        env[:fi] = np.linspace(0, 1, min(fi, m))[: min(fi, m)]
    if fo:
        env[-fo:] *= np.linspace(1, 0, min(fo, m))[-min(fo, m):]
    # громкость отрывка приводится к одной мерке, потом — сценарный уровень
    seg /= np.sqrt(np.mean(seg**2)) + 1e-9
    seg *= 10 ** (-24 / 20)
    i = int(at * SR)
    m = min(m, n - i)
    g = level * (1 - duck[i:i + m] * (1 - under))
    music[i:i + m] += seg[:m] * (env[:m] * g)[:, None]


def scratch(at):
    """игла соскальзывает: короткий шорох с падающим тоном"""
    m = int(0.42 * SR)
    rng = np.random.default_rng(3)
    x = rng.normal(0, 1, m) * np.exp(-np.linspace(0, 6, m))
    sweep = np.sin(2 * np.pi * np.cumsum(np.linspace(2600, 300, m)) / SR) * np.exp(-np.linspace(0, 5, m))
    y = (x * 0.25 + sweep * 0.5) * 0.18
    i = int(at * SR)
    music[i:i + m] += np.c_[y, y][: n - i]


# музыка в комнате, пока её не выключили
cue("room", 0.0, KW["off"] + 0.25, offset=1.0, level=0.55, under=0.35, fade_in=1.5, fade_out=0.25)
scratch(KW["off"] + 0.05)
# подросток: альбом AC/DC
cue("r1", S[3] - 0.6, E[7] - S[3] + 1.4, offset=0.0, level=0.42, under=0.22, fade_in=0.8, fade_out=1.4)
# три прочтения одной прелюдии — по очереди на «трёх разных … пианистов»
three = KW["three"]
for j, k in enumerate(["schiff", "richter", "nikolaeva"]):
    cue(k, three - 0.6 + j * 1.25, 1.5, offset=2.0, level=0.5, under=0.45, fade_in=0.12, fade_out=0.35)
# «лучшие минуты»: адажио из «Патетической» поднимается, когда комментатор умолкает
cue("adagio", S[14] + 2.0, S[16] - S[14] - 0.6, offset=0.0, level=0.5, under=0.3, fade_in=3.0, fade_out=2.2)
# под перечисление плейлистов — тихо старая песня из «11–15»
cue("skillet", 77.35, S[17] - 77.35 + 1.0, offset=4.0, level=0.5, under=0.2, fade_in=0.4, fade_out=1.4)
# трек, который сегодня не дослушал бы
cue("skip", S[17] + 0.3, E[19] - S[17] + 0.6, offset=6.0, level=0.38, under=0.25, fade_in=0.8, fade_out=1.4)
# тот самый трек из TikTok: «возьми…» в превью на 6,3 с — сразу после фразы
cue("tiktok", E[25] - 1.0, 2.6, offset=6.3 - 1.0 - 0.15, level=0.6, under=0.25, fade_in=0.2, fade_out=0.6)
# финал: старый альбом — сначала из-за стены, на припеве громче, «погромче» — в полную силу
puts, chor, loud = S[33], S[35], KW["louder"]
dur = TOTAL - puts
x0 = int(puts * SR)
hell = np.zeros((n, 2))
music_saved = music.copy()
music[:] = 0
cue("hell", puts, dur, offset=0.0, level=1.0, under=1.0, fade_in=0.4, fade_out=2.6)
hell[:] = music
music[:] = music_saved
lp = sosfilt(butter(2, 900, "lowpass", fs=SR, output="sos"), hell, axis=0)
g = np.interp(t, [puts, chor, chor + 0.4, loud - 0.2, loud + 0.9, TOTAL], [0.14, 0.14, 0.24, 0.24, 0.95, 0.95])
wet = np.clip((g - 0.3) / 0.6, 0, 1)
fin = (lp * (1 - wet)[:, None] + hell * wet[:, None]) * g[:, None]
fin *= (1 - duck * 0.55 * (t < loud + 0.5))[:, None]
music += fin

# ---------------------------------------------------------------- сведение
out = music + voice[:, None]
fade = np.clip((TOTAL - t) / 2.2, 0, 1)
out *= fade[:, None]
out *= 10 ** (3.5 / 20)  # общая громкость ≈ −16 LUFS
# пиковый лимитер: снижает только сами пики (окно 5 мс), а не весь трек
from scipy.ndimage import minimum_filter1d, uniform_filter1d
peak = np.max(np.abs(out), axis=1)
ga = np.minimum(1.0, 0.88 / (peak + 1e-9))
ga = uniform_filter1d(minimum_filter1d(ga, 480), 240)
out *= ga[:, None]
pk = float(np.max(np.abs(out)))
wav = (np.clip(out, -1, 1) * 32767).astype(np.int16)
os.makedirs(os.path.join(HERE, "out"), exist_ok=True)
with wave.open(os.path.join(HERE, "out", "film-audio.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(wav.tobytes())
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(HERE, "out", "film-audio.wav"), "-c:a", "aac", "-b:a", "192k", os.path.join(HERE, "public", "film-audio.m4a")])
print("ok", len(wav) / SR, "peak", round(float(pk), 3))
