#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Собирает плоский каталог треков из рабочей таблицы.

    python3 tools/extract/catalog.py            # → data/catalog.json

В отличие от cosmos.json это не дерево, а таблица: одна строка — один трек,
все признаки рядом. Каталогу дерево не нужно — фасеты пересекаются свободно
(эпоха × страна × возраст), а лишние уровни вроде «альбома из одного трека»
не появляются в принципе.

Строки словарные: тексты лежат в справочниках, в колонках — номера.
"""
import io, json, os, re, sys, zipfile, datetime, collections

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
XLSX = os.path.join(ROOT, 'data', 'musical-cosmos-sheet.xlsx')
OUT  = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'data', 'catalog.json')
SCHEMA = 1
UNK = '—'

COUNTRY = {
 'US':'США','GB':'Великобритания','UK':'Великобритания','DE':'Германия','FR':'Франция',
 'RU':'Россия','NL':'Нидерланды','IT':'Италия','HK':'Гонконг','SE':'Швеция',
 'AU':'Австралия','CA':'Канада','JP':'Япония','PL':'Польша','BE':'Бельгия',
 'FI':'Финляндия','CH':'Швейцария','ES':'Испания','CZ':'Чехия','NO':'Норвегия',
 'AT':'Австрия','DK':'Дания','IE':'Ирландия','HU':'Венгрия','EE':'Эстония',
 'AE':'ОАЭ','UA':'Украина','MC':'Монако','BR':'Бразилия','VG':'Британские Виргинские о-ва',
 'BG':'Болгария','ZA':'ЮАР','AR':'Аргентина','NZ':'Новая Зеландия','PT':'Португалия',
 'IL':'Израиль','CN':'Китай','LC':'Сент-Люсия','DG':'Германия',
 # QM/QZ/QT/TC/CB/ZZ — наднациональные префиксы ISRC, страна по ним не читается
 'QM':'Без страны','QZ':'Без страны','QT':'Без страны','TC':'Без страны',
 'CB':'Без страны','ZZ':'Без страны',
}
AGES = ['11-15','16-18 y.o.','19','20-21','22-24','Актуальный плейлист',
        'Концерты','Концерты 2','Дайте Танк(!)']
AGE_RU = ['11–15 лет','16–18 лет','19 лет','20–21 год','22–24 года',
          'Актуальный','Концерты','Концерты 2','Дайте Танк(!)']

# ------------------------------------------------------------------ книга
def load(path):
    z = zipfile.ZipFile(path)
    sh = z.read('xl/sharedStrings.xml').decode('utf-8')
    def un(s):
        return (s.replace('&lt;','<').replace('&gt;','>').replace('&quot;','"')
                 .replace('&apos;',"'").replace('&amp;','&'))
    strings = [un(''.join(re.findall(r'<t[^>]*>(.*?)</t>', si, re.S)))
               for si in re.findall(r'<si>(.*?)</si>', sh, re.S)]
    wb = z.read('xl/workbook.xml').decode('utf-8')
    rels = z.read('xl/_rels/workbook.xml.rels').decode('utf-8')
    tgt = dict(re.findall(r'Id="(rId\d+)"[^>]*Target="([^"]+)"', rels))
    sheets = {}
    for name, rid in re.findall(r'<sheet[^>]*name="([^"]+)"[^>]*r:id="(rId\d+)"', wb):
        sheets[un(name)] = 'xl/' + tgt[rid].lstrip('/').replace('xl/', '')
    return z, strings, sheets

def rows(z, strings, path, first):
    xml = z.read(path).decode('utf-8')
    out = []
    for rn, body in re.findall(r'<row[^>]*r="(\d+)"[^>]*>(.*?)</row>', xml, re.S):
        if int(rn) < first:
            continue
        cell = {}
        for col, attrs, v in re.findall(
                r'<c r="([A-Z]+)\d+"([^>]*)>(?:<v>(.*?)</v>)?', body):
            if v:
                cell[col] = strings[int(v)] if 't="s"' in attrs else v
        if cell:
            out.append(cell)
    return out

def tsv(name):
    p = os.path.join(HERE, name)
    m = {}
    if not os.path.exists(p):
        return m
    for line in io.open(p, encoding='utf-8'):
        line = line.rstrip('\n')
        if not line or line.startswith('#'):
            continue
        a = line.split('\t')
        if len(a) >= 2 and a[0] and a[1]:
            m[a[0].strip()] = a[1].strip()
    return m
NAMES_RU, SUBCANON = tsv('names-ru.tsv'), tsv('subgenres.tsv')

def ru(name):
    v = NAMES_RU.get(name)
    if v and v != '=':
        return v
    if re.search(r'[,&]', name):
        parts, hit, out = re.split(r'(\s*[,&]\s*)', name), False, []
        for p in parts:
            k = p.strip(); r = NAMES_RU.get(k)
            if r and r != '=':
                out.append(p.replace(k, r)); hit = True
            else:
                out.append(p)
        if hit:
            return ''.join(out)
    return name

# ------------------------------------------------- разбор ярлыка эпохи
def split_label(raw):
    """«Классицизм / ранний романтизм (1815–1910)» → голова, хвост, (lo,hi)."""
    s = (raw or '').strip()
    lo = hi = 0
    m = re.search(r'\((\d{3,4})\s*[–\-—]\s*(\d{4}|н\.\s*в\.)', s)
    if m:
        lo = int(m.group(1))
        hi = 2026 if not m.group(2)[:1].isdigit() else int(m.group(2))
    else:
        m2 = re.search(r'\((\d{3,4})', s)
        if m2:
            lo = hi = int(m2.group(1))
    s = re.sub(r'\s*\([^)]*\)\s*$', '', s).strip()
    if ' / ' in s:
        head, tail = s.split(' / ', 1)
    else:
        head, tail = s, ''
    return head.strip() or UNK, tail.strip(), (lo, hi)

def cap(s):
    return s[:1].upper() + s[1:] if s else s

# ==================================================================== сборка
def main():
    z, strings, sheets = load(XLSX)
    reg = [r for r in rows(z, strings, sheets['Уникальные треки'], 5) if r.get('B')]
    cls = rows(z, strings, sheets['Classical'], 5)
    rep = rows(z, strings, sheets['Статистика прослушиваний'], 17)

    # --- эпохи: ключ — пара «голова + диапазон», а не одна голова.
    # Иначе «Классицизм (1750–1820)» и «Классицизм / ранний романтизм (1815–1910)»
    # сливаются в один узел, и Бетховен оказывается современником Гайдна.
    heads = collections.defaultdict(set)
    for r in cls:
        h, _, span = split_label(r.get('A'))
        heads[h].add(span)
    epoch_name = {}
    for r in cls:
        raw = r.get('A')
        h, tail, span = split_label(raw)
        if len(heads[h]) > 1 and tail:
            epoch_name[raw] = (cap(tail), span)     # ярлык расходится по времени
        else:
            epoch_name[raw] = (h, span)
    split_fixed = sum(1 for h, v in heads.items() if len(v) > 1)

    classical = {}
    for r in cls:
        aid = r.get('J')
        if not aid:
            continue
        raw = r.get('A')
        nm, span = epoch_name.get(raw, (UNK, (0, 0)))
        _, tail, _ = split_label(raw)
        classical[aid] = {
            'epoch': nm, 'span': span,
            'dir': ('' if nm == cap(tail) else tail) or UNK,
            'composer': (r.get('B') or '').strip(),
            'work': (r.get('C') or '').strip(),
            'perf': (r.get('D') or '').strip(),
        }

    ranks = {}
    for r in rep:
        aid, rk = r.get('G'), r.get('B')
        if not aid or not rk:
            continue
        try:
            rk = int(float(rk))
        except ValueError:
            continue
        cur = ranks.get(aid)
        if cur is None:
            ranks[aid] = [rk, 1]
        else:
            cur[0] = min(cur[0], rk); cur[1] += 1

    # --- справочники
    D = {'artist': [], 'group': [], 'epoch': [], 'sub': [], 'country': [], 'sf': []}
    IX = {k: {} for k in D}
    SPAN = {}
    def idx(kind, val):
        m = IX[kind]
        if val not in m:
            m[val] = len(D[kind]); D[kind].append(val)
        return m[val]

    T = {k: [] for k in ('n','a','g','e','s','y','r','p','m','c','i','b','f','R')}
    def year_of(v):
        v = (v or '').strip()
        return int(float(v)) if v.replace('.', '', 1).isdigit() else 0

    for r in reg:
        aid = r.get('O') or ''
        url = r.get('P') or ''
        cl  = classical.get(aid)
        known = bool(cl and cl['composer'] and 'не определ' not in cl['composer'].lower())
        if known:
            realm, epoch, sub = 1, cl['epoch'], cl['dir']
            artist, group = cl['composer'], (cl['work'] or (r.get('D') or '').strip())
            SPAN.setdefault(epoch, cl['span'])
        elif cl:
            realm, epoch, sub = 1, 'Композитор не определён', UNK
            artist, group = 'Композитор не определён', (cl['work'] or (r.get('D') or '').strip())
        else:
            realm = 0
            epoch = (r.get('H') or UNK).strip()
            sub = SUBCANON.get((r.get('I') or '').strip(), (r.get('I') or '').strip()) or UNK
            artist = ru((r.get('C') or UNK).strip())
            group = (r.get('D') or UNK).strip()
            if 'не определ' in epoch.lower() or 'не найден' in epoch.lower():
                epoch = 'Жанр не определён'

        isrc = (r.get('N') or '').strip()
        cc = COUNTRY.get(isrc[:2].upper(), 'Без страны') if len(isrc) >= 2 else 'Без страны'

        mask = 0
        for part in str(r.get('L') or '').split('|'):
            part = part.strip()
            if part in AGES:
                mask |= 1 << AGES.index(part)

        m = re.search(r'/album/[^/]*/(\d+)', url)
        alb = m.group(1) if m else ''
        m2 = re.match(r'https://music\.apple\.com/([a-z]{2})/', url)
        sf = idx('sf', m2.group(1) if m2 else 'us')

        rk = ranks.get(aid, [0, 0])
        T['n'].append((r.get('B') or '').strip())
        T['a'].append(idx('artist', artist or UNK))
        T['g'].append(idx('group', group or UNK))
        T['e'].append(idx('epoch', epoch or UNK))
        T['s'].append(idx('sub', sub or UNK))
        T['y'].append(year_of(r.get('E')))
        T['r'].append(rk[0]); T['p'].append(rk[1])
        T['m'].append(mask)
        T['c'].append(idx('country', cc))
        T['i'].append(aid); T['b'].append(alb); T['f'].append(sf)
        T['R'].append(realm)

    epochs = [{'n': nm, 'lo': SPAN.get(nm, (0, 0))[0], 'hi': SPAN.get(nm, (0, 0))[1]}
              for nm in D['epoch']]

    data = {'schema': SCHEMA,
            'built': datetime.datetime.utcnow().strftime('%Y-%m-%d'),
            'ages': AGE_RU, 'agesRaw': AGES,
            'dict': {'artist': D['artist'], 'group': D['group'], 'epoch': epochs,
                     'sub': D['sub'], 'country': D['country'], 'sf': D['sf']},
            't': T}
    raw = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    json.loads(raw)
    io.open(OUT, 'w', encoding='utf-8').write(raw)

    n = len(T['n'])
    print('catalog.json — схема %d, %.0f КБ, треков %d' % (SCHEMA, len(raw.encode()) / 1024, n))
    print('  авторов %d · эпох и жанров %d · направлений %d · стран %d'
          % (len(D['artist']), len(D['epoch']), len(D['sub']), len(D['country'])))
    print('  академических %d · повседневных %d · в чартах Replay %d'
          % (sum(T['R']), n - sum(T['R']), sum(1 for x in T['r'] if x)))
    print('  ярлыков эпох, расклеенных по диапазону: %d' % split_fixed)
    for h, v in sorted(heads.items()):
        if len(v) > 1:
            print('    «%s» → %s' % (h, ', '.join(
                sorted(set(epoch_name[r.get('A')][0] for r in cls
                           if split_label(r.get('A'))[0] == h)))))
    miss = sum(1 for x in T['y'] if not x)
    print('  без года издания: %d' % miss)
    return 0

if __name__ == '__main__':
    sys.exit(main())
