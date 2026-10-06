#!/usr/bin/env python3
"""Текстуры для коллажа (бесшовные тайлы): газета из текста эссе, крафт,
шум ксерокса. → public/tex/*.png"""
import os, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import gaussian_filter
os.chdir(os.path.dirname(os.path.abspath(__file__)) + "/..")
rng = np.random.default_rng(3); random.seed(3)
words = open("essay.txt", encoding="utf-8").read().split()
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
SERIFB = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
if not os.path.exists(SERIF):
    import subprocess
    SERIF = subprocess.run(["fc-match", "-f", "%{file}", "DejaVu Serif"], capture_output=True, text=True).stdout
    SERIFB = subprocess.run(["fc-match", "-f", "%{file}", "DejaVu Serif:bold"], capture_output=True, text=True).stdout

def newsprint(N=1024):
    im = Image.new("L", (N, N), 236)
    d = ImageDraw.Draw(im)
    f = ImageFont.truetype(SERIF, 13); fb = ImageFont.truetype(SERIFB, 26)
    cols, gap = 4, 16
    cw = (N - gap * cols) // cols
    wi = 0
    for c in range(cols):
        x0 = c * (cw + gap) + gap // 2
        y = 6 - c * 37
        while y < N:
            if random.random() < 0.06:
                line = " ".join(words[wi % len(words): wi % len(words) + 2]).upper().strip(".,:;—«»")
                wi += 2
                while line and d.textlength(line, font=fb) > cw: line = line[:-1]
                d.text((x0, y), line.strip(), font=fb, fill=40)
                y += 36
                continue
            line = ""
            while d.textlength(line + words[wi % len(words)] + " ", font=f) < cw:
                line += words[wi % len(words)] + " "; wi += 1
            d.text((x0, y), line, font=f, fill=70)
            y += 16
        d.line([(x0 + cw + gap // 2, 0), (x0 + cw + gap // 2, N)], fill=150, width=1)
    a = np.asarray(im).astype(float)
    a += gaussian_filter(rng.normal(0, 1, (N, N)), 2, mode="wrap") * 10
    rgb = np.dstack([a * 1.0, a * 0.97, a * 0.88]).clip(0, 255).astype(np.uint8)
    Image.fromarray(rgb).save("public/tex/newsprint.png", optimize=True)

def kraft(N=768):
    base = np.array([196, 160, 112], float)
    n = gaussian_filter(rng.normal(0, 1, (N, N)), 1.2, mode="wrap") * 10 + gaussian_filter(rng.normal(0, 1, (N, N)), 20, mode="wrap") * 40
    fib = np.zeros((N, N))
    for _ in range(900):
        x, y = rng.integers(0, N, 2); a = rng.uniform(0, np.pi); L = rng.integers(10, 50)
        for k in range(L):
            fib[int(y + np.sin(a) * k) % N, int(x + np.cos(a) * k) % N] += rng.choice([-1, 1]) * 18
    n += gaussian_filter(fib, 0.5, mode="wrap")
    rgb = (base[None, None, :] + n[..., None] * np.array([1, 0.85, 0.6])).clip(0, 255).astype(np.uint8)
    Image.fromarray(rgb).save("public/tex/kraft.png", optimize=True)

def xerox(N=768):
    """чёрные крапины и полосы фотокопии, прозрачный фон"""
    a = np.zeros((N, N))
    sp = gaussian_filter(rng.normal(0, 1, (N, N)), 0.7, mode="wrap")
    a += (sp > 2.6) * 255
    streak = gaussian_filter(rng.normal(0, 1, (1, N)), (0, 3), mode="wrap")
    a += np.clip(np.repeat(streak, N, 0) * 40, 0, 60)
    a += gaussian_filter(rng.normal(0, 1, (N, N)), 30, mode="wrap").clip(0, None) * 50
    rgba = np.dstack([np.full((N, N), 20), np.full((N, N), 18), np.full((N, N), 16), a.clip(0, 255)]).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save("public/tex/xerox.png", optimize=True)

newsprint(); kraft(); xerox()
print("ok")
