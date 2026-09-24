#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Данные для главной страницы «Одна вещь» (src/index.html).

Страница рисует все 4334 записи точками и каждую может сыграть, поэтому ей
нужна почти вся таблица — но не в том виде, в каком её держит каталог.
Здесь она ужимается до того, что нужно фигурам и играм:

    s  полка возраста (первая, на которой запись стоит; 6 — только в топах)
    E L  энергия и свет, 1…5;  Q — откуда они (0 умолчание, 1 название, 2 рука)
    R  1 — академическая;  e — эпоха или жанр
    y  год издания;  c — год сочинения (оценка, см. ниже)
    b  альбом (номер по порядку);  r — лучшее место в годовом топе
    i  идентификатор Apple (base36);  f — витрина

Год сочинения у академической записи берётся из годов жизни автора: рабочие
годы — от двадцати лет до смерти, но не дольше семидесяти восьми, и записи
автора раскладываются по ним ровно. Так же считает лента лет в каталоге:
иначе все записи Баха встали бы одним столбиком.

Колонки склеены в строки: однозначные — по знаку на запись, остальные —
по два знака из B64 (годы со сдвигом на тысячу). 4334 знака сжимаются
лучше, чем 4334 числа через запятую, а разбор — один цикл.
"""
import io, os, re, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 64 знака без кавычек и обратной черты: пара знаков — число до 4095
B64 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-'

LIFE = re.compile(r'\((?:ок\.\s*)?(\d{3,4})\s*[–-]\s*(?:ок\.\s*)?(\d{3,4}|н\.в\.)\)')


def b36(n):
    n = int(n)
    s = ''
    while True:
        n, r = divmod(n, 36)
        s = '0123456789abcdefghijklmnopqrstuvwxyz'[r] + s
        if not n:
            return s


def one_data(cat):
    T, D = cat['t'], cat['dict']
    n = len(T['n'])
    ep = D['epoch']

    shelf = []
    for m in T['m']:
        k = 6
        for i in range(6):
            if m >> i & 1:
                k = i
                break
        shelf.append(k)

    # год сочинения
    comp = [0] * n
    by_art = {}
    for j in range(n):
        if T['R'][j]:
            by_art.setdefault(T['a'][j], []).append(j)
        else:
            comp[j] = T['y'][j] or 2000
    for a, js in by_art.items():
        name = D['artist'][a]
        m = LIFE.search(name)
        js.sort(key=lambda j: T['n'][j])
        if m:
            b = int(m.group(1))
            d = 2026 if m.group(2) == 'н.в.' else int(m.group(2))
            lo, hi = b + 20, min(d, b + 78, 2026)
            if hi < lo:
                lo = hi = max(b, min(d, 2026))
        else:
            e = ep[T['e'][js[0]]]
            lo, hi = (e['lo'], e['hi']) if e['lo'] else (1950, 2020)
        for k, j in enumerate(js):
            comp[j] = round(lo + (hi - lo) * (k + .5) / len(js)) if len(js) > 1 else round((lo + hi) / 2)

    albums = {}
    alb = [albums.setdefault(x, len(albums)) for x in T['b']]

    def digits(col):
        return ''.join(B64[v] for v in col)

    def pair(col, base=0):
        out = []
        for v in col:
            v -= base
            assert 0 <= v < 4096, v
            out.append(B64[v >> 6] + B64[v & 63])
        return ''.join(out)

    artists = [re.sub(r'\s*\((?:ок\.\s*)?\d[^)]*\)\s*$', '', a).strip() for a in D['artist']]
    return {
        'n': T['n'],
        'a': pair(T['a']),
        'A': artists,
        'ep': [[e['n'], e['lo'], e['hi'], e['r']] for e in ep],
        'sf': D['sf'],
        's': digits(shelf),
        'E': digits(T['E']),
        'L': digits(T['L']),
        'Q': digits([min(q, 2) if q != 3 else 2 for q in T['Q']]),
        'R': digits(T['R']),
        'f': digits(T['f']),
        'e': digits(T['e']),
        'y': pair([v or 1000 for v in T['y']], 1000),
        'c': pair(comp, 1000),
        'b': pair(alb),
        'r': pair(T['r']),
        'i': ','.join(b36(x) for x in T['i']),
    }


def build():
    cat = json.load(io.open(os.path.join(ROOT, 'data', 'catalog.json'), encoding='utf-8'))
    return json.dumps(one_data(cat), ensure_ascii=False, separators=(',', ':'))


if __name__ == '__main__':
    s = build()
    print('%.0f КБ' % (len(s.encode()) / 1024))
