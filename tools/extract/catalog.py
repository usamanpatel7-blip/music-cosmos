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
SCHEMA = 4
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
# Концертные полки слиты с сегодняшней: живьём слушается то же, что и
# сейчас, а отдельными строками они только дробили список.
SHELVES = [
    ('11–15 лет',        11, 15, 'age', ['11-15']),
    ('16–18 лет',        16, 18, 'age', ['16-18 y.o.']),
    ('19 лет',           19, 19, 'age', ['19', 'Дайте Танк(!)']),
    ('20–21 год',        20, 21, 'age', ['20-21']),
    ('22–24 года',       22, 24, 'age', ['22-24']),
    ('Сейчас 25–26 лет', 25, 26, 'age',
     ['Актуальный плейлист', 'Концерты', 'Концерты 2']),
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
def collapse(m):
    """Свести цепочки замен: «Британский рок / поп-рок» → «Британский рок»
    → «Классический рок». Иначе укрупнение пришлось бы вписывать в каждую
    строку-предшественницу, и таблица разъехалась бы при первой же правке.
    """
    out = {}
    for k in m:
        v, seen = m[k], {k}
        while v in m and v not in seen:
            seen.add(v)
            v = m[v]
        if v in m and m[v] != v:
            # Круг в таблице означает, что старая и новая строки тянут ярлык
            # в разные стороны. Молча выбрать одну — значит потом полдня
            # искать, почему переименование не сработало.
            raise SystemExit('круг в таблице замен: %s -> %s -> ...' % (k, v))
        out[k] = v
    return out

NAMES_RU = tsv('names-ru.tsv')
SUBCANON = collapse(tsv('subgenres.tsv'))
GENRE_FIX = collapse(tsv('genres.tsv'))
# Направления живут в своём словаре: у академической музыки это школы и
# течения, и мешать их со списком субжанров нельзя.
DIRCANON = collapse(tsv('dirs.tsv'))

# «Современный» в ярлыке стареет: Майкл Джексон современной поп-музыкой
# быть перестал. Возраст задаётся годом издания, и тогда ярлык не может
# разойтись с записью.
SUBERA = {
    'Современный поп': [(0, 1979, 'Классический поп'),
                        (1980, 1999, 'Поп 1980–1990-х'),
                        (2000, 9999, 'Поп XXI века')],
    'Современный джаз': [(0, 1999, 'Модальный джаз и постбоп'),
                         (2000, 9999, 'Джаз XXI века')],
}
LIFE_RE = re.compile(r'\((?:ок\.\s*)?(\d{3,4})\s*[–—-]\s*(?:(\d{3,4})|н\.\s*в\.)')

# Половина библиотеки определяется жанром, а не строкой в правках: иначе
# «Джаз» оказывался и там и там, и переключатель «Академическая» показывал
# Гершвина, а список жанров — «Джаз» в академическом столбце. Список
# закрытый и короткий; новый жанр по умолчанию считается академическим.
# Границы для эпох, которых в таблице не было: список эпох показывается по
# времени, и без них строки съезжали бы в конец без причины.
SPAN_EXTRA = {
    'Ранняя музыка': (1400, 1600),
    'Модернизм': (1900, 1975),
    'Авангард XX века': (1910, 1975),
    'XXI век': (2000, 2026),
}

POP_GENRES = {'Рок', 'Поп', 'Джаз', 'Блюз', 'Электронная музыка',
              'Рэп / хип-хоп', 'R&B / соул / фанк', 'Саундтреки', 'Кантри',
              # Неоклассика — Эйнауди, Сакамото, Рихтер — не академическая
              # музыка, как и переложения поп-песен для рояля. Жанр остаётся,
              # половина меняется.
              'Классический кроссовер'}

# ============================================================ чем играется
# Направлений было сто, и они мешали в кучу эпохи, школы, техники, страны и
# инструменты. Вместо ещё одного набора субъективных ярлыков — два вопроса,
# на которые есть ответ в самих данных: чем это играется и как это звучит.
#
# Инструмент читается по названию произведения, а где названия не хватает —
# по исполнителю: у листа Classical есть колонка с ним, и она заполнена
# целиком. Рихтер, Соколов, Гульд — пианисты, «Emerson String Quartet» —
# струнные. Если у исполнителя хоть где-то распознан инструмент, он
# переносится на остальные его записи; последним говорит композитор.
INSTRUMENTS = [
    ('голос и хор', r'\bmass\b|missa|requiem|cantata|kantate|passion|orator|\blied|'
                    r'lieder|\baria\b|arie\b|chorus|choir|\bchor\b|opera\b|vocal|voice|'
                    r'soprano|tenor|bariton|\bmotet|psalm|magnificat|stabat|ave maria|'
                    r'vespers|madrigal|anthem|песн|хор\b|singers|vocalise'),
    ('орган',       r'\borgan\b|organ,|for organ|органн|orgue|orgel'),
    ('ударные',     r'percussion|marimba|timpani|vibraphon|xylophon|ударн|\bdrums\b'),
    ('гитара',      r'guitar|\blute\b|гитар|vihuela|mandolin'),
    ('фортепиано',  r'\bpiano\b|pianoforte|klavier|clavier|harpsichord|cembalo|'
                    r'fortepiano|keyboard|фортепиан|клавес|two pianos|\bpianist'),
    ('струнные',    r'violin|cello|violoncell|\bviola\b|\bstring|quartet|quintet\b|'
                    r'скрип|виолонч|contrabass|double bass|\bharp\b'),
    ('духовые',     r'flute|oboe|clarinet|bassoon|\bhorn\b|trumpet|trombone|\btuba\b|'
                    r'saxophon|recorder|shakuhachi|fl[öo]te|brass'),
    ('электроника', r'electronic|\btape\b|synthes|live electronics'),
    ('оркестр',     r'orchestr|symphon|sinfoni|philharmon|overture|ouvert|concerto|'
                    r'konzert|ballet|балет|симфон|capella|\bband\b'),
]
INSTRUMENTS = [(nm, re.compile(p)) for nm, p in INSTRUMENTS]

def instrument_of(text):
    t = text.lower()
    for nm, rx in INSTRUMENTS:
        if rx.search(t):
            return nm
    return ''

def split_names(p):
    out = []
    for x in re.split(r'\s*[&,;/]\s*|\s+и\s+', p or ''):
        x = x.strip()
        if len(x) > 2:
            out.append(x)
    return out

# ============================================================== как звучит
# Восемь меток, каждая — отдельная галочка: запись бывает разом камерной и
# виртуозной. Имена рабочие, их ещё предстоит отшлифовать.
TAG_NAMES = ['красивое', 'радикальное', 'мощное', 'камерное',
             'виртуозное', 'танцевальное', 'драматическое', 'экспериментальное']
TAG_RE = {
    'красивое': r'adagio|andante|larghetto|\blargo\b|cantabile|nocturne|ноктюрн|'
                r'berceuse|romance|романс|serenade|barcarolle|r[êe]verie|pastorale|'
                r'siciliana|arioso|dolce|tranquillo|lullaby|колыбельн|\bair\b|'
                r'intermezzo|song without words|\bmajor\b|мажор|ave maria|meditation',
    'мощное':   r'symphon|симфон|requiem|\bmass\b|missa|orator|cantata|passion|'
                r'\bte deum|dies irae|tuba mirum|for orchestra|philharmon|chorus|'
                r'choir|opera\b|ballet|балет|apocalyp|\bmarch\b|марш',
    'камерное': r'\bsolo\b|соло\b|\bduo\b|\bduet|\btrio\b|quartet|quintet|sextet|'
                r'septet|octet|for two|for 2 |chamber|камерн|\bsonata\b|соната|'
                r'prelude|прелюд|\betude|étude|\bpiece|пьеса|bagatelle|invention',
    'виртуозное': r'\betude|étude|caprice|capriccio|toccata|variation|вариац|rhapsod|'
                r'рапсод|fantas|фантаз|perpetuum|paganini|transcendental|paraphrase|'
                r'brillante|\bstudy\b|virtuos|moto perpetuo',
    'танцевальное': r'waltz|valse|вальс|mazurka|мазурк|polonaise|полонез|gavotte|'
                r'sarabande|сарабанд|menuet|minuet|менуэт|\bgigue|\bjig\b|tango|танго|'
                r'bourr[ée]e|allemande|courante|polka|полька|galop|habanera|csardas|'
                r'l[äa]ndler|danse|dance|танец|танц|foxtrot|фокстрот|ragtime|rumba|'
                r'samba|bolero|болеро|tarantella',
    'драматическое': r'overture|ouvert|увертюр|symphonic poem|tone poem|po[èe]me|поэма|'
                r'scherzo|скерцо|funeral|похорон|elegy|элеги|lament|tragic|dramatic|'
                r'entr.acte|finale',
    'экспериментальное': r'prepared piano|for tape|\btape\b|live electronics|'
                r'percussion ensemble|extended techniqu|aleator|алеатор|musique concr|'
                r'toy piano|microtonal|микротон|for radios|4.33',
}
TAG_RE = dict((k, re.compile(v)) for k, v in TAG_RE.items())
# Школа тоже говорит о звуке: атональность и сериализм слышны без названия.
DIR_RADICAL = re.compile(
    r'авангард|сериализм|додекафон|нововенск|сонорист|сонорик|микрополифон|спектрал|'
    r'новая сложность|алеатор|стохастич|атональн|постсериал|микротональ|'
    r'расширенные техник|конструктивизм|организованный звук|инструментальный театр|'
    r'неопримитивизм|электронная|японский модернизм|польский модернизм')
DIR_EXPERIMENT = re.compile(
    r'экспериментал|расширенные техник|организованный звук|инструментальный театр|'
    r'сонорист|сонорик|стохастич|микротональ|спектрал|алеатор|конкретн|электронная|'
    r'американский экспериментализм|механическая музыка')
DIR_BEAUTY = re.compile(
    r'романтизм|импрессион|новая простота|новая искренность|сакральный минимализм|'
    r'неоклассик|фольклоризм|неоромантизм|органический минимализм')
# У повседневной музыки названия молчат, зато субжанр говорит прямо.
SUB_TAGS = {
    'Диско': ['танцевальное'], 'Танцевальная электроника': ['танцевальное'],
    'Электроника': ['танцевальное'], 'Регги и ска': ['танцевальное'],
    'Рэгтайм и ранний джаз': ['танцевальное', 'виртуозное'],
    'Свинг': ['танцевальное'], 'Босса-нова и латино-джаз': ['танцевальное', 'красивое'],
    'Фанк': ['танцевальное'], 'Рок-н-ролл': ['танцевальное'],
    'Синти-поп': ['танцевальное'], 'Поп XXI века': ['танцевальное'],
    'Хип-хоп': ['танцевальное'],
    'Метал': ['мощное', 'радикальное'], 'Хард-рок': ['мощное'],
    'Гранж': ['мощное'], 'Прогрессивный рок': ['мощное', 'виртуозное'],
    'Панк': ['радикальное'], 'Пост-панк': ['радикальное'],
    'Джаз-фьюжн': ['виртуозное'], 'Бибоп и хард-боп': ['виртуозное'],
    'Кул-джаз': ['красивое'], 'Модальный джаз и постбоп': ['виртуозное'],
    'Блюз-рок': ['виртуозное'],
    'Соул': ['красивое'], 'Классический поп': ['красивое'],
    'Автор-исполнитель': ['камерное', 'красивое'], 'Фолк': ['камерное'],
    'Инди-поп': ['красивое'], 'Саундтрек': ['драматическое'],
    'Психоделический рок': ['экспериментальное'],
}

def sound_tags(text, direction, sub, realm):
    mask = 0
    t = text.lower()
    for i, nm in enumerate(TAG_NAMES):
        rx = TAG_RE.get(nm)
        if rx and rx.search(t):
            mask |= 1 << i
    d = (direction or '').lower()
    if DIR_RADICAL.search(d):
        mask |= 1 << TAG_NAMES.index('радикальное')
    if DIR_EXPERIMENT.search(d):
        mask |= 1 << TAG_NAMES.index('экспериментальное')
    if DIR_BEAUTY.search(d):
        mask |= 1 << TAG_NAMES.index('красивое')
    if not realm:
        for nm in SUB_TAGS.get(sub, ()):
            mask |= 1 << TAG_NAMES.index(nm)
    return mask

def settle(epoch, artist):
    """Окончательное имя эпохи.

    Ярлык приходит из трёх мест — листа, assign.tsv и attrib.tsv, — и
    каждое пишет его своими словами, поэтому канон применяется в конце.
    Заодно «XXI век» проверяется на здравый смысл: композитор, умерший до
    двухтысячного, стоять в нём не может, как бы поздно ни вышла запись.
    Год издания у академической музыки — дата записи, а не сочинения,
    поэтому решают годы жизни автора.
    """
    epoch = GENRE_FIX.get(epoch, epoch)
    if epoch == 'XXI век':
        m = LIFE_RE.search(artist)
        if m and m.group(2) and int(m.group(2)) < 2000:
            return 'Модернизм'
    return epoch

def load_assign():
    """Поправки, которые решает автор или запись, а не ярлык — assign.tsv.

    Ключ: имя автора либо «id:<номер трека>». Значение: жанр, направление
    или субжанр, раздел. Пустое поле означает «оставить как есть».

    Знак «=» перед значением означает исключение: имя нарочно расходится
    с таблицей сведения и проверкой не ловится. Так живёт единственный
    поп-рок в библиотеке при том, что весь остальной поп-рок сведён к
    классическому року.
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
        g, sb = a[1].strip(), a[2].strip()
        keep = sb.startswith('=') or g.startswith('=')
        m[key] = (g.lstrip('='), sb.lstrip('='), realm, keep)
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

def audit_tables():
    """Имя, поставленное поимённой правкой, — последнее слово, поэтому оно
    обязано быть уже каноническим. Стоит переименовать субжанр в
    subgenres.tsv и забыть про строку в assign.tsv — и правка тихо вернёт
    старое имя. Такую пару лучше поймать на сборке, чем в готовом каталоге.
    """
    bad = []
    for k, v in ASSIGN.items():
        if v[3]:
            continue
        if v[0] and GENRE_FIX.get(v[0], v[0]) != v[0]:
            bad.append('%s: жанр «%s» переименован в «%s»' % (k, v[0], GENRE_FIX[v[0]]))
        if v[1] and v[1] != UNK and SUBCANON.get(v[1], v[1]) != v[1]:
            bad.append('%s: субжанр «%s» сведён к «%s»' % (k, v[1], SUBCANON[v[1]]))
    for k, v in ATTRIB.items():
        if v[1] and GENRE_FIX.get(v[1], v[1]) != v[1]:
            bad.append('%s: эпоха «%s» переименована в «%s»' % (k, v[1], GENRE_FIX[v[1]]))
    if bad:
        raise SystemExit('устаревшие имена в правках:\n  ' + '\n  '.join(bad))

audit_tables()

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
         'inst': [], 'country': [], 'sf': []}
    IX = {k: {} for k in D}
    SPAN = {}
    def idx(kind, val):
        m = IX[kind]
        if val not in m:
            m[val] = len(D[kind]); D[kind].append(val)
        return m[val]

    T = {k: [] for k in ('n','a','g','e','s','d','y','r','p','m','c','i','b','f','R',
                         'E','L','Q','C','F')}
    idx('sub', UNK); idx('dir', UNK); idx('inst', UNK)
    # нулевой номер во всех трёх — «нет значения»
    SND = []   # (текст для разбора, исполнитель, композитор, раздел)
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
            # Границы кладём под каноническим именем: под сырым они
            # терялись при первом же переименовании жанра.
            SPAN.setdefault(GENRE_FIX.get(epoch, epoch), cl['span'])
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

        # Ярлык, поставленный поимённой правкой, проходит через ту же
        # таблицу имён: иначе «Современная академическая музыка» из
        # assign.tsv переживала бы переименование в «XXI век».
        epoch = GENRE_FIX.get(epoch, epoch)

        era = SUBERA.get(sub)
        if era:
            yy = year_of(r.get('E')) or 0
            for lo, hi, nm in era:
                if lo <= yy <= hi:
                    sub = nm
                    break

        # Запись под чужим композитором: находится по каталожному номеру
        # в названии, правится поимённо — attrib.tsv.
        at = ATTRIB.get('id:' + (r.get('O') or '').strip())
        if at:
            artist = at[0]
            if at[1]:
                epoch = at[1]
        # Ярлык приходит из трёх мест и каждое пишет его по-своему, поэтому
        # канон применяется последним — иначе написание из attrib.tsv
        # пережило бы переименование в genres.tsv.
        epoch = settle(epoch, artist)
        realm = 0 if epoch in POP_GENRES else 1

        # Направление и субжанр — разные словари: у академической музыки
        # это школы и течения, у повседневной — жанровые ветки, и в одном
        # списке они мешают друг другу.
        if realm:
            direction = sub if sub != UNK else ('только эпоха' if known else UNK)
            direction = DIRCANON.get(direction, direction)
            sub = UNK
        else:
            direction = UNK

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
        # Чем играется и как звучит. Инструмент досчитывается вторым
        # проходом: сперва все распознанные, потом по ним — остальные.
        itext = (r.get('B') or '') + ' | ' + (group or '')
        SND.append((itext, (cl['perf'] if cl else artist), artist, realm))
        T['F'].append(sound_tags(itext, direction, sub, realm))

    # Эпоха и жанр — разные вещи, и мешать их в одном списке неверно:
    # у академической музыки это отрезок времени, у повседневной — ветка
    # родства. Половина у ярлыка одна, поэтому считается прямо здесь и
    # разводит фасеты на странице.
    # ---------------------------------------------------------- инструмент
    # Три круга: название, потом исполнитель, потом композитор. Каждый
    # следующий говорит только там, где предыдущий промолчал.
    inst = [instrument_of(t) if rl else '' for t, _p, _c, rl in SND]
    for i in range(len(SND)):
        if not inst[i] and SND[i][3]:
            inst[i] = instrument_of(SND[i][1])
    box = {}
    for i in range(len(SND)):
        if inst[i]:
            for x in split_names(SND[i][1]):
                box.setdefault(x, collections.Counter())[inst[i]] += 1
    pmap = {}
    for k, c in box.items():
        nm, v = c.most_common(1)[0]
        tot = sum(c.values())
        if v / float(tot) >= 0.7:
            pmap[k] = (nm, tot)
    for i in range(len(SND)):
        if inst[i] or not SND[i][3]:
            continue
        votes = collections.Counter()
        for x in split_names(SND[i][1]):
            if x in pmap:
                votes[pmap[x][0]] += pmap[x][1]
        if votes:
            inst[i] = votes.most_common(1)[0][0]
    cbox = {}
    for i in range(len(SND)):
        if inst[i]:
            cbox.setdefault(SND[i][2], collections.Counter())[inst[i]] += 1
    cmap = {}
    for k, c in cbox.items():
        nm, v = c.most_common(1)[0]
        tot = sum(c.values())
        if tot >= 3 and v / float(tot) >= 0.6:
            cmap[k] = nm
    for i in range(len(SND)):
        if not inst[i] and SND[i][3] and SND[i][2] in cmap:
            inst[i] = cmap[SND[i][2]]
    T['C'] = [idx('inst', x or UNK) for x in inst]

    epochs = []
    for nm in D['epoch']:
        sp = SPAN.get(nm) or (0, 0)
        if not sp[0]:
            sp = SPAN_EXTRA.get(nm, sp)   # (0,0) — тоже кортеж, «or» тут не работает
        lo, hi = sp
        epochs.append({'n': nm, 'lo': lo, 'hi': hi,
                       'r': 0 if nm in POP_GENRES else 1})

    data = {'schema': SCHEMA,
            'built': datetime.datetime.utcnow().strftime('%Y-%m-%d'),
            'ages': AGE_RU,
            'shelves': [{'n': x[0], 'lo': x[1], 'hi': x[2], 'k': x[3]}
                        for x in SHELVES],
            'mood': {'e': E_NAMES, 'l': L_NAMES, 'presets': PRESETS},
            'tags': TAG_NAMES,
            'dict': {'artist': D['artist'], 'group': D['group'], 'epoch': epochs,
                     'sub': D['sub'], 'dir': D['dir'], 'inst': D['inst'],
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
    ins = _c.Counter(D['inst'][T['C'][j]] for j in range(n) if T['R'][j])
    ac = sum(T['R'])
    got = ac - ins[UNK]
    print('  чем играется: %d из %d академических (%.0f%%)'
          % (got, ac, 100.0 * got / max(1, ac)))
    print('    ' + ' · '.join('%s %d' % (k, v) for k, v in ins.most_common() if k != UNK))
    print('  как звучит:')
    for i, nm in enumerate(TAG_NAMES):
        a = sum(1 for j in range(n) if T['F'][j] >> i & 1 and T['R'][j])
        p = sum(1 for j in range(n) if T['F'][j] >> i & 1 and not T['R'][j])
        print('    %-18s академ %4d · повседн %4d' % (nm, a, p))
    print('    без единой метки: %d из %d'
          % (sum(1 for x in T['F'] if not x), n))
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
