#!/usr/bin/env python3
"""Собирает tools/film/out/film.html: вшивает шрифты и тайминги.

    python3 tools/film/build.py

Шрифты — из fontsource (OFL), лежат в tools/film/fonts. Тайминги —
tools/film/timing.json (см. cues.py)."""
import base64, io, json, os
HERE = os.path.dirname(os.path.abspath(__file__))
src = io.open(os.path.join(HERE, 'film.html'), encoding='utf-8').read()
FONTS = [('Caveat', 700, 'caveat', '700'), ('Golos Text', 600, 'golos-text', '600'), ('Rubik Mono One', 400, 'rubik-mono-one', '400')]
RANGES = {'cyrillic': 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116',
          'latin': 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2190-2199,U+2212,U+2215,U+266A'}
css = []
for fam, w, stem, ws in FONTS:
    for sub in ('cyrillic', 'latin'):
        b = base64.b64encode(open(os.path.join(HERE, 'fonts', '%s-%s-%s-normal.woff2' % (stem, sub, ws)), 'rb').read()).decode()
        css.append("@font-face{font-family:'%s';font-weight:%d;font-style:normal;font-display:block;src:url(data:font/woff2;base64,%s) format('woff2');unicode-range:%s}" % (fam, w, b, RANGES[sub]))
timing = json.load(io.open(os.path.join(HERE, 'timing.json'), encoding='utf-8'))
out = src.replace('/*@@FONTS@@*/', '\n'.join(css)).replace('/*@@TIMING@@*/{cues:[],sent:[]}', json.dumps(timing, ensure_ascii=False))
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
io.open(os.path.join(HERE, 'out', 'film.html'), 'w', encoding='utf-8').write(out)
print('out/film.html', len(out) // 1024, 'КБ')
