#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Вшивает данные и общий код в страницы каталога.

    python3 tools/extract/catalog.py && python3 tools/inline.py && sh tools/wrap.sh

Страница обязана открываться двойным щелчком, поэтому и данные, и общий
модуль лежат внутри файла, а не подгружаются запросом: с file:// запрос
браузер не отдаст. Правится один источник — data/catalog.json и
tools/player.js, — а копии в страницах расставляет этот скрипт.

Места вшивания размечены:
    var CAT={…};                      ← data/catalog.json
    /* < player */ … /* player > */   ← tools/player.js
"""
import io, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = ['src/11-library.html', 'src/12-portrait.html']
JSON = os.path.join(ROOT, 'data', 'catalog.json')
PLAY = os.path.join(ROOT, 'tools', 'player.js')

data = io.open(JSON, encoding='utf-8').read().strip()
player = io.open(PLAY, encoding='utf-8').read().strip()
# </script> внутри строки закрыл бы тег и обрушил страницу
if '</script' in data or '</script' in player:
    sys.exit('во вшиваемом содержимом есть </script — страница развалится')

for rel in PAGES:
    path = os.path.join(ROOT, rel)
    if not os.path.exists(path):
        print('  нет %s — пропущено' % rel)
        continue
    page = io.open(path, encoding='utf-8').read()
    before, hits = page, []

    if re.search(r'var CAT=.*?;\n', page, re.S):
        page = re.sub(r'var CAT=.*?;\n', lambda m: 'var CAT=' + data + ';\n', page, count=1)
        hits.append('данные')
    if re.search(r'/\* < player \*/.*?/\* player > \*/', page, re.S):
        page = re.sub(r'/\* < player \*/.*?/\* player > \*/',
                      lambda m: '/* < player */\n' + player + '\n/* player > */',
                      page, count=1, flags=re.S)
        hits.append('проигрыватель')
    if not hits:
        sys.exit('в %s нет ни одного места вшивания' % rel)
    if page != before:
        io.open(path, 'w', encoding='utf-8').write(page)
    print('  %-24s %s · %.0f КБ' % (os.path.basename(rel), ', '.join(hits),
                                    len(page.encode()) / 1024))
