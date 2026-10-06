#!/usr/bin/env python3
"""Наклейки для коллажа: вырезанные фигуры с белой каймой.
public/cast/*.png, public/poses/*.png → public/stickers/*.png"""
import glob, os
import numpy as np
from PIL import Image, ImageFilter
os.chdir(os.path.dirname(os.path.abspath(__file__)) + "/..")
os.makedirs("public/stickers", exist_ok=True)
for f in sorted(glob.glob("public/cast/*.png") + glob.glob("public/poses/*.png")):
    im = Image.open(f).convert("RGBA")
    if im.height > 1200:
        im = im.resize((round(im.width * 1200 / im.height), 1200), Image.LANCZOS)
    b = 14
    pad = Image.new("RGBA", (im.width + 2 * b, im.height + 2 * b), (0, 0, 0, 0))
    pad.paste(im, (b, b))
    a = pad.split()[3].filter(ImageFilter.MaxFilter(2 * b - 1 if (2 * b - 1) % 2 else 2 * b + 1)).filter(ImageFilter.GaussianBlur(1.2))
    a = a.point(lambda v: 255 if v > 90 else int(v * 255 / 90))
    white = Image.new("RGBA", pad.size, (255, 253, 247, 255)); white.putalpha(a)
    out = Image.alpha_composite(white, pad)
    name = os.path.basename(f)
    out.save(f"public/stickers/{name}", optimize=True)
    print(name, out.size)
