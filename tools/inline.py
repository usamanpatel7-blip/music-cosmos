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
    var ONE={…};                      ← tools/one_data.py (главная)
"""
import io, os, re, sys, json
from map_data import map_data
from one_data import one_data

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = ['src/index.html', 'src/11-library.html', 'src/12-portrait.html', 'src/13-epochs.html']
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

    if re.search(r'var ONE=.*?;\n', page, re.S):
        one = json.dumps(one_data(json.loads(data)), ensure_ascii=False, separators=(',', ':'))
        if '</script' in one.lower():
            sys.exit('в данных главной есть </script')
        page = re.sub(r'var ONE=.*?;\n', lambda m: 'var ONE=' + one + ';\n', page, count=1, flags=re.S)
        hits.append('данные главной')
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

# Page 08 uses a compact tree, but its source is the same corrected catalog.
path = os.path.join(ROOT, 'src', '08-cosmos.html')
page = io.open(path, encoding='utf-8').read()
tree = map_data(json.loads(data))
raw = json.dumps(tree, ensure_ascii=False, separators=(',', ':'))
if '</script' in raw.lower():
    sys.exit('во вшиваемых данных карты есть </script')
page, hits = re.subn(r'var DATA=.*?;\n', lambda m: 'var DATA=' + raw + ';\n',
                     page, count=1, flags=re.S)
if hits != 1:
    sys.exit('в src/08-cosmos.html не найдено место для данных')
io.open(path, 'w', encoding='utf-8', newline='\n').write(page)
print('  08-cosmos.html           данные из catalog.json')
