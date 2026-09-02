#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Вшивает data/cosmos.json в src/app.html.

    python3 tools/extract/build.py && python3 tools/embed.py

Приложение открывается двойным щелчком, поэтому данные лежат внутри файла,
а не подгружаются запросом: с file:// запрос браузер не отдаст.
"""
import io, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC  = os.path.join(ROOT, 'src', 'app.html')
JSON = os.path.join(ROOT, 'data', 'cosmos.json')

data = io.open(JSON, encoding='utf-8').read().strip()
page = io.open(SRC, encoding='utf-8').read()
m = re.search(r'var DATA=.*?;\n', page, re.S)
if not m:
    sys.exit('в src/app.html не найдено место для данных (var DATA=…;)')
page = page[:m.start()] + 'var DATA=' + data + ';\n' + page[m.end():]
io.open(SRC, 'w', encoding='utf-8').write(page)
print('данные вшиты: %.0f КБ json → %.0f КБ страница'
      % (len(data.encode()) / 1024, len(page.encode()) / 1024))
