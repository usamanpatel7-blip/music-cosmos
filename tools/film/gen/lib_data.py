#!/usr/bin/env python3
"""Данные фильма из библиотеки: 4334 трека и портреты-«мишени» для точек.
data/catalog.json + public/cast/*.png → src/lib/data.json

Для каждого трека: возрастные плейлисты (битовая маска), академический ли он,
год и метка для нескольких артистов из эссе. Для каждой версии героя — 4334
точки по силуэту (по пояс, голове больше веса) с цветом пикселя."""
import json, os
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, sobel
os.chdir(os.path.dirname(os.path.abspath(__file__)) + "/..")
cat = json.load(open("../../data/catalog.json"))
t, d = cat["t"], cat["dict"]
N = len(t["n"])
KEYS = {"AC/DC": 1, "Nickelback": 2, "Иоганн Себастьян Бах (1685–1750)": 3, "A$AP Rocky": 4}
key = [KEYS.get(d["artist"][a], 0) for a in t["a"]]
rng = np.random.default_rng(11)

def portrait(name, top=0.40, N=N, src=None):
    """Взвешенное стипплирование (Lloyd): точек больше там, где темно и есть
    линии — так читаются глаза, брови, рот. Цвет точки — цвет пикселя."""
    from scipy.spatial import cKDTree
    im = Image.open(src or f"public/cast/{name}.png").convert("RGBA")
    W, H = im.size
    h = int(H * top)
    G = 420
    sm = im.crop((0, 0, W, h)).resize((max(1, int(W * G / h)), G), Image.LANCZOS)
    a = np.asarray(sm).astype(float)
    alpha = a[..., 3] / 255
    lum = a[..., :3].mean(-1) / 255
    edge = np.hypot(sobel(lum), sobel(lum, 1)); edge = gaussian_filter(edge, 0.7); edge /= edge.max() + 1e-6
    w = alpha * (0.12 + (1 - lum) ** 1.6 + 1.4 * edge)
    yy = np.arange(G)[:, None] / G
    w *= np.where(yy < 0.5, 1.6, 1.0)
    ys, xs = np.nonzero(alpha > 0.3)
    wp = w[ys, xs]
    pts = np.c_[xs, ys][rng.choice(len(xs), N, replace=False, p=wp / wp.sum())].astype(float)
    pix = np.c_[xs, ys].astype(float)
    for _ in range(14):
        _, lab = cKDTree(pts).query(pix)
        sw = np.bincount(lab, wp, N)
        cx = np.bincount(lab, wp * pix[:, 0], N); cy = np.bincount(lab, wp * pix[:, 1], N)
        ok = sw > 0
        pts[ok] = np.c_[cx[ok] / sw[ok], cy[ok] / sw[ok]]
    cols = a[pts[:, 1].astype(int).clip(0, G - 1), pts[:, 0].astype(int).clip(0, a.shape[1] - 1), :3]
    X = (pts[:, 0] - a.shape[1] / 2) / G * 1000
    Y = pts[:, 1] / G * 1000
    order = np.lexsort((X, Y))
    out = []
    for k in order:
        out += [int(X[k]), int(Y[k]), *[int(c) for c in cols[k]]]
    return out

# версия героя = треки, впервые появившиеся в плейлистах её возраста
first = [next((b for b in range(6) if m >> b & 1), 6) for m in t["m"]]
VER = [0, 1, 2, 2, 3, 4, 4]  # группа возраста → версия (r1, r2, su, sp, now)
ver = [VER[g] for g in first]
counts = [ver.count(k) for k in range(5)]
data = {
    "ver": ver,
    "first": first,
    "av": [1 if d["epoch"][e]["n"] == "Авангард XX века" else 0 for e in t["e"]],
    "duo": portrait("duo", top=1.0, src="public/poses/duo-sit.png"),
    "mini": {n: portrait(n, N=counts[k]) for k, n in enumerate(["r1", "r2", "su", "sp", "now"])},
    "mask": t["m"], "R": t["R"], "y": t["y"], "key": key,
    "por": {n: portrait(n) for n in ["r1", "r2", "su", "sp", "now"]},
}
json.dump(data, open("src/lib/data.json", "w"), separators=(",", ":"))
print(N, os.path.getsize("src/lib/data.json") // 1024, "KB")
