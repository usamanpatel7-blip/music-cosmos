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
SCHEMA = 3
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
# Полки: имя, годы жизни, вид и какие плейлисты таблицы сюда сводятся.
# «Дайте Танк(!)» — не возраст, а одна группа, слушанная в девятнадцать:
# отдельной полки она не заслуживает и стоит внутри девятнадцати.
# Концертные списки — параллельная лента: они идут поверх возрастов,
# а не после них, потому и помечены отдельно.
SHELVES = [
    ('11–15 лет',        11, 15, 'age',     ['11-15']),
    ('16–18 лет',        16, 18, 'age',     ['16-18 y.o.']),
    ('19 лет',           19, 19, 'age',     ['19', 'Дайте Танк(!)']),
    ('20–21 год',        20, 21, 'age',     ['20-21']),
    ('22–24 года',       22, 24, 'age',     ['22-24']),
    ('Концерты 21–25',   21, 25, 'concert', ['Концерты']),
    ('Сейчас 25–26',     25, 26, 'age',     ['Актуальный плейлист']),
    ('Концерты 25–26',   25, 26, 'concert', ['Концерты 2']),
]
AGE_RU = [x[0] for x in SHELVES]
BIT = {}
for _i, _sh in enumerate(SHELVES):
    for _raw in _sh[4]:
        BIT[_raw] = _i
AGES = list(BIT)

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
GENRE_FIX = tsv('genres.tsv')

def load_assign():
    """Поправки, которые решает автор или запись, а не ярлык — assign.tsv.

    Ключ: имя автора либо «id:<номер трека>». Значение: жанр, направление
    или субжанр, раздел. Пустое поле означает «оставить как есть».
    """
    path = os.path.join(HERE, 'assign.tsv')
    m = {}
    if not os.path.exists(path):
        return m
    for line in io.open(path, encoding='utf-8'):
        line = line.rstrip('\n')
        if not line.strip() or line.startswith('#'):
            continue
        a = (line.split('\t') + ['', '', ''])[:4]
        key = a[0].strip()
        if not key:
            continue
        realm = int(a[3]) if a[3].strip() in ('0', '1') else None
        m[key] = (a[1].strip(), a[2].strip(), realm)
    return m
ASSIGN = load_assign()

def load_attrib():
    """Поправки авторства по номеру трека — attrib.tsv.

    Значение: (композитор, эпоха или пустая строка).
    """
    path = os.path.join(HERE, 'attrib.tsv')
    m = {}
    if not os.path.exists(path):
        return m
    for line in io.open(path, encoding='utf-8'):
        line = line.rstrip('\n')
        if not line.strip() or line.startswith('#'):
            continue
        a = (line.split('\t') + ['', ''])[:3]
        if a[0].strip() and a[1].strip():
            m[a[0].strip()] = (a[1].strip(), a[2].strip())
    return m
ATTRIB = load_attrib()

# ------------------------------------------------------------- настроение
# Две шкалы по пять делений: сколько в записи движения и какого она цвета.
# Двух чисел хватает, чтобы место записи в поле было однозначным, а разметка
# не превращалась в работу — на запись два решения, а не выбор из списка.
E_NAMES = ['замерло', 'дышит', 'идёт', 'гонит', 'рвёт']
L_NAMES = ['мрак', 'тень', 'ровно', 'тепло', 'свет']
PRESETS = [
    {'n': 'фон',              'e': [1, 2], 'l': [1, 5]},
    {'n': 'сосредоточиться',  'e': [1, 3], 'l': [3, 4]},
    {'n': 'тоска',            'e': [1, 2], 'l': [1, 2]},
    {'n': 'свет',             'e': [2, 4], 'l': [4, 5]},
    {'n': 'разогнаться',      'e': [4, 5], 'l': [3, 5]},
    {'n': 'пробить',          'e': [4, 5], 'l': [1, 2]},
]
# Медленное стоит раньше быстрого: в «Adagio — Allegro» ведёт первая ремарка.
TEMPO = [
    (r'Grave|Largo|Larghissimo|Lento|Adagissimo|Molto adagio', 1),
    (r'Adagio|Larghetto|Lentamente|Andante|Andantino|Sostenuto|Cantabile', 2),
    (r'Moderato|Allegretto|Comodo|Marcia|Menuet|Minuet|Sarabande', 3),
    (r'Allegro|Vivo|Animato|Con moto|Con brio|Scherzo', 4),
    (r'Vivace|Presto|Prestissimo|Furioso|Agitato', 5),
]
LAD = re.compile(r'\b(Minor|Major|Moll|Dur)\b', re.I)

def load_moods(name, width):
    path = os.path.join(HERE, name)
    m = {}
    if not os.path.exists(path):
        return m
    for line in io.open(path, encoding='utf-8'):
        line = line.rstrip('\n')
        if not line.strip() or line.startswith('#'):
            continue
        a = (line.split('\t') + [''] * width)[:width]
        key = a[0].strip()
        if not key:
            continue
        def num(v):
            v = v.strip()
            return int(v) if v.isdigit() and 1 <= int(v) <= 5 else 0
        e, l = num(a[1]), num(a[2])
        if e or l:
            m[key] = (e, l)
    return m
MOODS = load_moods('moods.tsv', 3)     # по субжанру и эпохе
MOOD = load_moods('mood.tsv', 4)       # по автору, альбому и записи

def mood_of(realm, title, sub, direction, epoch, artist, group, tid):
    """Энергия, свет и откуда они взялись (1 — из названия, 2 — руками).

    Порядок силы: точечная правка по номеру трека > то, что прочитано из
    названия > правка по автору или альбому > умолчание по субжанру и эпохе.
    Название стоит выше автора намеренно: сказать «Шопен тёмный» разумно,
    но пьеса, у которой в заголовке стоит D Major, тёмной от этого не станет.
    """
    e, l = MOODS.get(sub) or MOODS.get(direction) or MOODS.get(epoch) or (3, 3)
    q = 0

    def put(h):
        nonlocal e, l
        if h[0]:
            e = h[0]
        if h[1]:
            l = h[1]

    h = MOOD.get('альбом:' + group) or MOOD.get(artist)
    if h:
        put(h); q |= 2
    if realm:
        for pat, v in TEMPO:
            if re.search(r'\b(' + pat + r')\b', title, re.I):
                e, q = v, q | 1
                break
        m = LAD.search(title)
        if m:
            l = 2 if m.group(1).lower() in ('minor', 'moll') else 4
            q |= 1
    t = MOOD.get('id:' + tid)
    if t:
        put(t); q |= 2
    return e, l, q

def load_epoch_fixes():
    """Ручные поправки к ярлыкам эпох: имя и границы.

    Ни по первой, ни по второй половине составного ярлыка правильное имя
    автоматически не получается — см. epochs.tsv.
    """
    path = os.path.join(HERE, 'epochs.tsv')
    m = {}
    if not os.path.exists(path):
        return m
    for line in io.open(path, encoding='utf-8'):
        line = line.rstrip('\n')
        if not line.strip() or line.startswith('#'):
            continue
        a = line.split('\t')
        if len(a) >= 2 and a[0].strip() and a[1].strip():
            lo = int(a[2]) if len(a) > 2 and a[2].strip().isdigit() else 0
            hi = int(a[3]) if len(a) > 3 and a[3].strip().isdigit() else 0
            m[a[0].strip()] = (a[1].strip(), (lo, hi))
    return m
EPOCH_FIX = load_epoch_fixes()

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
    fixed = []
    for r in cls:
        raw = r.get('A')
        h, tail, span = split_label(raw)
        if raw in EPOCH_FIX:
            epoch_name[raw] = EPOCH_FIX[raw]        # ручная поправка сильнее всего
            if raw not in fixed:
                fixed.append(raw)
        elif len(heads[h]) > 1 and tail:
            # Ярлыки с одной головой, но разными диапазонами — разные эпохи.
            # Имя берётся из второй половины: голова у них общая и потому
            # ничего не различает. Где так выходит неверно — epochs.tsv.
            epoch_name[raw] = (cap(tail), span)
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
    D = {'artist': [], 'group': [], 'epoch': [], 'sub': [], 'dir': [],
         'country': [], 'sf': []}
    IX = {k: {} for k in D}
    SPAN = {}
    def idx(kind, val):
        m = IX[kind]
        if val not in m:
            m[val] = len(D[kind]); D[kind].append(val)
        return m[val]

    T = {k: [] for k in ('n','a','g','e','s','d','y','r','p','m','c','i','b','f','R',
                         'E','L','Q')}
    idx('sub', UNK); idx('dir', UNK)   # нулевой номер в обоих — «нет значения»
    def year_of(v):
        v = (v or '').strip()
        return int(float(v)) if v.replace('.', '', 1).isdigit() else 0

    for r in reg:
        aid = r.get('O') or ''
        url = r.get('P') or ''
        cl  = classical.get(aid)
        known = bool(cl and cl['composer'] and 'не определ' not in cl['composer'].lower())
        if known:
            realm, epoch, sub = 1, cl['epoch'], SUBCANON.get(cl['dir'], cl['dir'])
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

        # Слияние ярлыков: девять джазовых эпох в один жанр, «Модернизм XX
        # века» в «Модернизм» и так далее — genres.tsv.
        epoch = GENRE_FIX.get(epoch, epoch)
        # Точечная поправка сильнее авторской, авторская — сильнее ярлыка.
        tid = (r.get('O') or '').strip()
        fix = ASSIGN.get('id:' + tid) or ASSIGN.get(artist)
        if fix:
            if fix[0]:
                epoch = fix[0]
                SPAN.setdefault(epoch, (0, 0))
            if fix[1]:
                sub = UNK if fix[1] == UNK else fix[1]
            if fix[2] is not None:
                realm = fix[2]

        # Направление и субжанр — разные словари: у академической музыки
        # это школы и течения, у повседневной — жанровые ветки, и в одном
        # списке они мешают друг другу.
        if realm:
            direction = sub if sub != UNK else ('только эпоха' if known else UNK)
            sub = UNK
        else:
            direction = UNK

        # Запись под чужим композитором: находится по каталожному номеру
        # в названии, правится поимённо — attrib.tsv.
        at = ATTRIB.get('id:' + (r.get('O') or '').strip())
        if at:
            artist = at[0]
            if at[1]:
                epoch = at[1]

        isrc = (r.get('N') or '').strip()
        cc = COUNTRY.get(isrc[:2].upper(), 'Без страны') if len(isrc) >= 2 else 'Без страны'

        mask = 0
        for part in str(r.get('L') or '').split('|'):
            part = part.strip()
            if part in BIT:
                mask |= 1 << BIT[part]

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
        T['d'].append(idx('dir', direction or UNK))
        me, ml, mq = mood_of(realm, (r.get('B') or '') + ' ' + group,
                             sub, direction, epoch, artist, group, tid)
        T['E'].append(me); T['L'].append(ml); T['Q'].append(mq)
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
            'ages': AGE_RU,
            'shelves': [{'n': x[0], 'lo': x[1], 'hi': x[2], 'k': x[3]}
                        for x in SHELVES],
            'mood': {'e': E_NAMES, 'l': L_NAMES, 'presets': PRESETS},
            'dict': {'artist': D['artist'], 'group': D['group'], 'epoch': epochs,
                     'sub': D['sub'], 'dir': D['dir'],
                     'country': D['country'], 'sf': D['sf']},
            't': T}
    raw = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    json.loads(raw)
    io.open(OUT, 'w', encoding='utf-8').write(raw)

    n = len(T['n'])
    print('catalog.json — схема %d, %.0f КБ, треков %d' % (SCHEMA, len(raw.encode()) / 1024, n))
    print('  авторов %d · жанров и эпох %d · субжанров %d · направлений %d · стран %d'
          % (len(D['artist']), len(D['epoch']), len(D['sub']) - 1,
             len(D['dir']) - 1, len(D['country'])))
    import collections as _c
    for kind, col in (('субжанр', 's'), ('направление', 'd')):
        cnt = _c.Counter(x for x in T[col] if x)
        one = sum(1 for v in cnt.values() if v == 1)
        print('    %-12s одиночек %d из %d, безымянных %d'
              % (kind, one, len(cnt), sum(1 for x in T[col] if not x)))
    q = _c.Counter(T['Q'])
    hand = sum(v for k, v in q.items() if k & 2)
    read = sum(v for k, v in q.items() if k & 1)
    print('  настроение: руками %d · прочитано из названия %d · по умолчанию %d'
          % (hand, read, q[0]))
    grid = _c.Counter(zip(T['E'], T['L']))
    print('    поле (энергия × свет), сколько записей в клетке:')
    for e in range(1, 6):
        print('      %-8s ' % E_NAMES[e - 1]
              + ' '.join('%5d' % grid[(e, l)] for l in range(1, 6)))
    print('      %-8s ' % '' + ' '.join('%5s' % n[:5] for n in L_NAMES))
    print('  полки: ' + ' · '.join(
        '%s %d' % (SHELVES[i][0], sum(1 for m in T['m'] if m >> i & 1))
        for i in range(len(SHELVES))))
    print('  академических %d · повседневных %d · в чартах Replay %d'
          % (sum(T['R']), n - sum(T['R']), sum(1 for x in T['r'] if x)))
    print('  ярлыков эпох, расклеенных по диапазону: %d' % split_fixed)
    for raw in fixed:
        print('    поправка: «%s» → «%s» %d–%d'
              % (raw, EPOCH_FIX[raw][0], EPOCH_FIX[raw][1][0], EPOCH_FIX[raw][1][1]))
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
