#!/usr/bin/env python3
"""Вырезает фигуры из листа персонажей на однотонном фоне.

    python3 gen/cutout.py gen/src/sheet1.png public/cast v_r1 v_r2 v_su v_sp v_now

Фон определяется по углам листа; всё, что заметно отличается от него, —
фигура. Фигуры — связные области слева направо, каждая сохраняется в
отдельный PNG с прозрачным фоном и мягким краем."""
import sys, os
import numpy as np
from PIL import Image
from scipy import ndimage

src, outdir, names = sys.argv[1], sys.argv[2], sys.argv[3:]
os.makedirs(outdir, exist_ok=True)
im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
H, W, _ = im.shape
corners = np.concatenate([im[:20, :20].reshape(-1, 3), im[:20, -20:].reshape(-1, 3), im[-20:, :20].reshape(-1, 3), im[-20:, -20:].reshape(-1, 3)])
bg = np.median(corners, axis=0)
dist = np.sqrt(((im - bg) ** 2).sum(-1))
fg = dist > 18
fg = ndimage.binary_closing(fg, iterations=3)
fg = ndimage.binary_fill_holes(fg)
lab, n = ndimage.label(fg)
sizes = ndimage.sum(fg, lab, range(1, n + 1))
keep = [i + 1 for i in np.argsort(sizes)[::-1][: len(names)]]
objs = ndimage.find_objects(lab)
keep.sort(key=lambda k: objs[k - 1][1].start)
for name, k in zip(names, keep):
    sl = objs[k - 1]
    pad = 6
    y0, y1 = max(0, sl[0].start - pad), min(H, sl[0].stop + pad)
    x0, x1 = max(0, sl[1].start - pad), min(W, sl[1].stop + pad)
    m = (lab[y0:y1, x0:x1] == k).astype(np.float32)
    # мягкий край: альфа по расстоянию до фона у самой границы
    soft = np.clip((dist[y0:y1, x0:x1] - 6) / 14, 0, 1)
    edge = ndimage.binary_dilation(m > 0, iterations=2) & ~ndimage.binary_erosion(m > 0, iterations=2)
    a = np.where(edge, np.maximum(m * soft, 0), m)
    a = ndimage.gaussian_filter(a, 0.6)
    rgba = np.dstack([im[y0:y1, x0:x1], a * 255]).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(os.path.join(outdir, name + ".png"), optimize=True)
    print(name, x1 - x0, "x", y1 - y0)
