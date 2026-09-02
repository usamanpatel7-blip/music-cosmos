#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Собирает cosmos.json из рабочей таблицы одним запуском.

    python3 tools/extract/build.py [выходной-файл]

Ни Python-библиотек для xlsx, ни Node не нужно: книга — обычный zip с XML.
Прежний конвейер был рецептом из шести команд в README и читал листы по номеру
файла внутри архива; здесь листы находятся по имени через workbook.xml.
"""
import io, json, os, re, sys, zipfile, hashlib, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(os.path.dirname(__file__))))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) \
       if os.path.basename(ROOT) == 'tools' else ROOT
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
XLSX = os.path.join(ROOT, 'data', 'musical-cosmos-sheet.xlsx')
OUT  = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'data', 'cosmos.json')

SCHEMA   = 2
MAXLEVEL = 60          # больше детей на уровне — узел делится дальше
UNKNOWN  = '—'

# ------------------------------------------------------------------ чтение книги
def load_book(path):
    z = zipfile.ZipFile(path)
    shared = z.read('xl/sharedStrings.xml').decode('utf-8')
    def unesc(s):
        return (s.replace('&lt;', '<').replace('&gt;', '>')
                 .replace('&quot;', '"').replace('&apos;', "'").replace('&amp;', '&'))
    strings = [unesc(''.join(re.findall(r'<t[^>]*>(.*?)</t>', si, re.S)))
               for si in re.findall(r'<si>(.*?)</si>', shared, re.S)]
    wb = z.read('xl/workbook.xml').decode('utf-8')
    rels = z.read('xl/_rels/workbook.xml.rels').decode('utf-8')
    target = dict(re.findall(r'Id="(rId\d+)"[^>]*Target="([^"]+)"', rels))
    sheets = {}
    for name, rid in re.findall(r'<sheet[^>]*name="([^"]+)"[^>]*r:id="(rId\d+)"', wb):
        sheets[unesc(name)] = 'xl/' + target[rid].lstrip('/').replace('xl/', '')
    return z, strings, sheets

def rows_of(z, strings, path, first):
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

# ------------------------------------------------------------------- словари
def load_tsv(name):
    path = os.path.join(HERE, name)
    m = {}
    if not os.path.exists(path):
        return m
    for line in io.open(path, encoding='utf-8'):
        line = line.rstrip('\n')
        if not line or line.startswith('#'):
            continue
        parts = line.split('\t')
        if len(parts) >= 2 and parts[0] and parts[1]:
            m[parts[0].strip()] = parts[1].strip()
    return m

NAMES_RU = load_tsv('names-ru.tsv')
SUBCANON = load_tsv('subgenres.tsv')

def ru_name(name):
    """Русское написание там, где оно заведено. «=» значит «оставить как есть»."""
    v = NAMES_RU.get(name)
    if v and v != '=':
        return v
    # составные имена вида «A & B», «A, B» — переводим известные части
    if re.search(r'[,&]', name):
        parts = re.split(r'(\s*[,&]\s*)', name)
        hit = False
        out = []
        for p in parts:
            k = p.strip()
            r = NAMES_RU.get(k)
            if r and r != '=':
                out.append(p.replace(k, r)); hit = True
            else:
                out.append(p)
        if hit:
            return ''.join(out)
    return name

def canon_sub(s):
    s = (s or '').strip() or UNKNOWN
    return SUBCANON.get(s, s)

# ------------------------------------------------------------- разбор эпохи
def parse_epoch(raw):
    """«Авангард XX века / микрополифония (1910–1975)» → эпоха, направление, год."""
    s = (raw or '').strip()
    year = 0
    m = re.search(r'\((\d{3,4})', s)
    if m:
        year = int(m.group(1))
    s = re.sub(r'\s*\([^)]*\)\s*$', '', s).strip()
    if ' / ' in s:
        epoch, direction = s.split(' / ', 1)
    else:
        epoch, direction = s, UNKNOWN
    return epoch.strip() or UNKNOWN, direction.strip() or UNKNOWN, year

AGES = ['11-15', '16-18 y.o.', '19', '20-21', '22-24', 'Концерты', 'Концерты 2',
        'Актуальный плейлист']
def ages_mask(raw):
    mask = 0
    for part in str(raw or '').split('|'):
        part = part.strip()
        if part in AGES:
            mask |= 1 << AGES.index(part)
    return mask

def sid(kind, *parts):
    """Устойчивый идентификатор: тип плюс нормализованные части имени."""
    key = kind + '\x1f' + '\x1f'.join(
        re.sub(r'\s+', ' ', str(p or '').strip().lower()) for p in parts)
    return hashlib.blake2s(key.encode('utf-8'), digest_size=6).hexdigest()

# ==================================================================== сборка
def main():
    z, strings, sheets = load_book(XLSX)
    reg = rows_of(z, strings, sheets['Уникальные треки'], 5)
    cls = rows_of(z, strings, sheets['Classical'], 5)
    rep = rows_of(z, strings, sheets['Статистика прослушиваний'], 17)

    reg = [r for r in reg if r.get('B')]
    report = {'треков в реестре': len(reg)}

    # нормализованная академическая ветка — по Apple ID
    classical = {}
    for r in cls:
        aid = r.get('J')
        if not aid:
            continue
        epoch, direction, year = parse_epoch(r.get('A'))
        classical[aid] = {'epoch': epoch, 'dir': direction, 'year': year,
                          'composer': (r.get('B') or '').strip(),
                          'work': (r.get('C') or '').strip(),
                          'performer': (r.get('D') or '').strip()}
    report['строк нормализованной классики'] = len(classical)

    # ранги Replay: лучший ранг и в скольких периодах
    ranks = {}
    for r in rep:
        aid, rank = r.get('G'), r.get('B')
        if not aid or not rank:
            continue
        try:
            rank = int(float(rank))
        except ValueError:
            continue
        cur = ranks.get(aid)
        if cur is None:
            ranks[aid] = [rank, 1]
        else:
            cur[0] = min(cur[0], rank)
            cur[1] += 1
    report['треков в чартах Replay'] = len(ranks)

    storefronts = []
    def sf_index(url):
        m = re.match(r'https://music\.apple\.com/([a-z]{2})/', url or '')
        cc = m.group(1) if m else 'us'
        if cc not in storefronts:
            storefronts.append(cc)
        return storefronts.index(cc)

    # --------------------------------------------------------------- дерево
    root = {'name': 'Музыка', 'kind': 'root', 'children': [], 'index': {}}
    def child(parent, name, kind, **extra):
        key = kind + '\x00' + name
        node = parent['index'].get(key)
        if node is None:
            node = {'name': name, 'kind': kind, 'children': [], 'index': {},
                    'n': 0, 'parent': parent}
            node.update(extra)
            parent['index'][key] = node
            parent['children'].append(node)
        return node

    uncharted = 0
    for r in reg:
        aid   = r.get('O')
        url   = r.get('P') or ''
        title = (r.get('B') or '').strip()
        year  = int(float(r.get('E'))) if (r.get('E') or '').strip().replace('.','',1).isdigit() else 0
        cl    = classical.get(aid)
        if cl and cl['composer'] and 'не определ' not in cl['composer'].lower():
            realm_name, genre, sub = 'Классическая', cl['epoch'], cl['dir']
            gyear  = cl['year']
            artist = cl['composer']
            group  = cl['work'] or (r.get('D') or '').strip() or title
            gkind  = 'work'
        elif cl:
            realm_name, genre, sub = 'Классическая', 'Неопознанное', UNKNOWN
            gyear, artist = 0, 'Композитор не определён'
            group, gkind = (cl['work'] or title), 'work'
            uncharted += 1
        else:
            realm_name = 'Популярная'
            genre = (r.get('H') or UNKNOWN).strip()
            sub   = canon_sub(r.get('I'))
            gyear = 0
            artist = ru_name((r.get('C') or UNKNOWN).strip())
            group  = (r.get('D') or UNKNOWN).strip()
            gkind  = 'album'
            if 'не определ' in genre.lower() or 'не найден' in genre.lower():
                genre, uncharted = 'Неопознанное', uncharted + 1

        realm = child(root,  realm_name, 'realm')
        gal   = child(realm, genre, 'genre', year=gyear)
        if gal.get('year', 0) == 0 and gyear:
            gal['year'] = gyear
        s_    = child(gal,   sub, 'sub')
        art   = child(s_,    artist, 'artist')
        alb   = child(art,   group, gkind)
        alb.setdefault('albumId', '')
        m = re.search(r'/album/[^/]*/(\d+)', url)
        if m and not alb['albumId']:
            alb['albumId'] = m.group(1)
            alb['sf'] = sf_index(url)
        rk = ranks.get(aid, [0, 0])
        trk = {'name': title, 'kind': 'track', 'children': [], 'index': {},
               'n': 1, 'parent': alb, 'trackId': aid or '', 'year': year,
               'rank': rk[0], 'reps': rk[1], 'ages': ages_mask(r.get('L')),
               'sf': alb.get('sf', 0)}
        alb['children'].append(trk)

    # ------------------------------------------------- деление крупных уровней
    split_stats = {'десятилетие': 0, 'пятилетие': 0, 'алфавит': 0}

    def node_year(n):
        ys = []
        stack = [n]
        while stack:
            x = stack.pop()
            if x['kind'] == 'track':
                if x['year']:
                    ys.append(x['year'])
            else:
                stack.extend(x['children'])
        return min(ys) if ys else 0

    def by_decade(items):
        g = {}
        for it in items:
            y = node_year(it)
            g.setdefault((y // 10 * 10) if y else 0, []).append(it)
        return [('%d-е' % k if k else 'Год не известен', v) for k, v in sorted(g.items())]

    def by_halfdecade(items):
        g = {}
        for it in items:
            y = node_year(it)
            g.setdefault((y // 5 * 5) if y else 0, []).append(it)
        return [('%d–%d' % (k, k + 4) if k else 'Год не известен', v)
                for k, v in sorted(g.items())]

    def by_alpha(items):
        items = sorted(items, key=lambda x: x['name'].lower())
        parts = max(2, (len(items) + MAXLEVEL - 1) // MAXLEVEL)
        size = (len(items) + parts - 1) // parts
        out = []
        for i in range(0, len(items), size):
            chunk = items[i:i + size]
            out.append(('%s–%s' % (chunk[0]['name'][:1].upper(),
                                   chunk[-1]['name'][:1].upper()), chunk))
        return out

    def split(node, depth=0):
        ch = node['children']
        if len(ch) > MAXLEVEL and depth < 8 and ch[0]['kind'] != 'track':
            # у произведений композитора год — это год записи, а не сочинения,
            # поэтому делить их по десятилетиям было бы враньём: только алфавит
            order = (('алфавит', by_alpha),) if ch[0]['kind'] == 'work' else \
                    (('десятилетие', by_decade), ('пятилетие', by_halfdecade),
                     ('алфавит', by_alpha))
            for name, fn in order:
                groups = [(t, lst) for t, lst in fn(ch) if lst]
                if len(groups) >= 2 and max(len(l) for l in groups) < len(ch):
                    split_stats[name] += 1
                    node['children'] = []
                    node['index'] = {}
                    for title, lst in groups:
                        g = {'name': title, 'kind': 'split', 'children': lst,
                             'index': {}, 'n': 0, 'parent': node}
                        for it in lst:
                            it['parent'] = g
                        node['children'].append(g)
                    break
        for c in node['children']:
            split(c, depth + 1)

    # Уровень из единственной группы ничего не сообщает и стоит лишнего клика:
    # у Барокко все композиторы без направления, и получался один узел «—».
    collapsed = [0]
    def collapse(node):
        for c in list(node['children']):
            collapse(c)
        ch = node['children']
        if len(ch) == 1 and ch[0]['kind'] in ('sub', 'split') and ch[0]['children']:
            for g in ch[0]['children']:
                g['parent'] = node
            node['children'] = ch[0]['children']
            collapsed[0] += 1
    collapse(root)

    split(root)

    # --------------------------------------------------------------- подсчёты
    def count(n):
        if n['kind'] == 'track':
            n['n'] = 1
        else:
            n['n'] = sum(count(c) for c in n['children'])
        return n['n']
    count(root)

    # --------------------------------------------------------------- заметки
    NOTEDIR = os.path.join(ROOT, 'notes')
    notes = {}
    if os.path.isdir(NOTEDIR):
        for base, _, files in os.walk(NOTEDIR):
            for f in files:
                if not f.endswith('.md'):
                    continue
                rel = os.path.relpath(os.path.join(base, f), NOTEDIR)
                key = os.path.splitext(rel)[0].replace(os.sep, '/')
                text = io.open(os.path.join(base, f), encoding='utf-8').read().strip()
                if text:
                    notes[key.lower()] = text

    KINDDIR = {'realm': 'реалм', 'genre': 'эпоха', 'sub': 'направление',
               'artist': 'композитор', 'album': 'альбом', 'work': 'произведение',
               'track': 'трек', 'split': 'группа'}
    used_notes = []

    # ------------------------------------------------------------- выгрузка
    KIND = ['realm', 'genre', 'sub', 'split', 'artist', 'album', 'work', 'track']
    nodes = []
    def emit(n, parent_idx):
        rec = [n['name'], KIND.index(n['kind']), parent_idx, n['n']]
        if n['kind'] == 'genre':
            rec.append(n.get('year', 0))
        elif n['kind'] in ('album', 'work'):
            rec += [n.get('albumId', ''), n.get('sf', 0)]
        elif n['kind'] == 'track':
            rec += [n.get('trackId', ''), n.get('year', 0), n.get('rank', 0),
                    n.get('reps', 0), n.get('ages', 0), n.get('sf', 0)]
        idx = len(nodes)
        nodes.append(rec)
        key = (KINDDIR.get(n['kind'], n['kind']) + '/' + n['name']).lower()
        if key in notes:
            rec.append({'note': notes[key]}) if False else None
            n['noteIdx'] = idx
            used_notes.append([idx, notes[key]])
        for c in n['children']:
            emit(c, idx)
    for c in root['children']:
        emit(c, -1)

    data = {
        'schema': SCHEMA,
        'built': datetime.datetime.utcnow().strftime('%Y-%m-%d'),
        'kinds': KIND,
        'ages': AGES,
        'storefronts': storefronts,
        'maxLevel': MAXLEVEL,
        'nodes': nodes,
        'notes': used_notes,
    }
    raw = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    json.loads(raw)                      # экспорт обязан разбираться обратно
    io.open(OUT, 'w', encoding='utf-8').write(raw)

    # ----------------------------------------------------------------- отчёт
    from collections import Counter
    kinds = Counter(KIND[r[1]] for r in nodes)
    widest = 0
    kids = Counter()
    for r in nodes:
        if r[2] >= 0:
            kids[r[2]] += 1
    widest = max(kids.values()) if kids else 0
    top = [i for i, v in kids.items() if v == widest][:1]
    print('cosmos.json — схема %d, %.0f КБ' % (SCHEMA, len(raw.encode('utf-8')) / 1024))
    for k in KIND:
        if kinds.get(k):
            print('  %-12s %5d' % (k, kinds[k]))
    print('  всего узлов %d' % len(nodes))
    print('схлопнуто пустых уровней: %d' % collapsed[0])
    print('деление крупных уровней: ' +
          ', '.join('%s %d' % (k, v) for k, v in split_stats.items()))
    print('максимум детей у узла: %d (порог %d)%s' %
          (widest, MAXLEVEL,
           '  ← «' + nodes[top[0]][0] + '»' if top else ''))
    ru_used = set(r[0] for r in nodes if KIND[r[1]] == 'artist')
    hit = sum(1 for k, v in NAMES_RU.items() if v != '=' and v in ru_used)
    keep = sum(1 for v in NAMES_RU.values() if v == '=')
    print('русские имена: словарь %d, подставлено %d, оставлено латиницей %d '
          '(остальные — исполнители академической ветки, там на карте стоит '
          'композитор)' % (len(NAMES_RU), hit, keep))
    print('заметок подключено: %d' % len(used_notes))
    print('в Неопознанное отправлено: %d треков' % uncharted)
    for k, v in report.items():
        print('  %s: %s' % (k, v))
    return 0 if widest <= MAXLEVEL else 1

if __name__ == '__main__':
    sys.exit(main())
