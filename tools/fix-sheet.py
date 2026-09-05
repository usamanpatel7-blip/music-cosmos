#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Вписывает поправки авторства в саму таблицу.

    python3 tools/fix-sheet.py [--dry]

Пока правки лежали рядом с данными, разбор всегда начинался с исходной
выгрузки — и уже исправленное находилось заново. Источник правды должен
быть один, и это сама таблица.

Вход — `tools/extract/attrib.tsv`: строка «id:<номер трека> композитор
[эпоха]». Что делает: в листе Classical ставит композитора в колонку B и
ярлык эпохи в колонку A.

Ярлык берётся полный — тот, под которым этот композитор уже стоит в
таблице. Короткое «Романтизм» из attrib.tsv потеряло бы направление:
у Рахманинова в таблице «Поздний романтизм (1860–1910)», у Лигети
«Авангард XX века / микрополифония (1910–1975)». Композиторы, которых в
таблице ещё не было, перечислены в NEW — им ярлык задаётся руками.

Файл xlsx правится по месту: строки лежат в общем словаре
(sharedStrings), поэтому меняются не тексты ячеек, а номера, на которые
ячейки смотрят; недостающие строки дописываются в словарь. Всё
остальное содержимое книги копируется байт в байт.
"""
import io, os, re, sys, shutil, zipfile, collections

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, os.path.join(HERE, 'extract'))
import catalog as C                       # noqa: E402  (load/rows и путь к книге)

DRY = '--dry' in sys.argv

# Полный ярлык для тех, кого в таблице ещё не было. Без направления: школу
# за композитора придумывать не нужно, а «только эпоха» — честный ответ.
NEW = {
    'Иоганн Кристиан Бах (1735–1782)':     'Классицизм (1750–1820)',
    'Кристоф Виллибальд Глюк (1714–1787)': 'Классицизм (1750–1820)',
    'Кристоф Граупнер (1683–1760)':        'Барокко (1600–1750)',
    'Томазо Антонио Витали (1663–1745)':   'Барокко (1600–1750)',
    'Жан-Фери Ребель (1666–1747)':         'Барокко (1600–1750)',
    'Йоханнес Окегем (ок. 1420–1497)':     'Ренессанс (1400–1600)',
    'Ферруччо Бузони (1866–1924)':         'Романтизм (1815–1910)',
    'Леопольд Годовский (1870–1938)':      'Романтизм (1815–1910)',
    'Джордже Энеску (1881–1955)':          'Романтизм (1815–1910)',
    'Фридрих Калькбреннер (1785–1849)':    'Романтизм (1815–1910)',
    'Отторино Респиги (1879–1936)':        'Импрессионизм (1890–1920)',
    'Георгий Свиридов (1915–1998)':        'Модернизм XX века (1900–1975)',
    'Дмитрий Кабалевский (1904–1987)':     'Модернизм XX века (1900–1975)',
    'Артюр Онеггер (1892–1955)':           'Модернизм XX века (1900–1975)',
    'Колин Макфи (1900–1964)':             'Модернизм XX века (1900–1975)',
    'Кнут Нюстедт (1915–2014)':            'Современная академическая музыка (1975–н.в.)',
    'Габриэль Прокофьев (1975–н.в.)':      'Современная академическая музыка (1975–н.в.)',
    'Владимир Мартынов (1946–н.в.)':       'Современная академическая музыка (1975–н.в.)',
    'Кшиштоф Мейер (1943–н.в.)':           'Современная академическая музыка (1975–н.в.)',
    'Виктор Кисине (1953–н.в.)':           'Современная академическая музыка (1975–н.в.)',
    'Патрик Гауэрс (1936–2014)':           'Современная академическая музыка (1975–н.в.)',
    'Освальдо Голихов (1960–н.в.)':        'Современная академическая музыка (1975–н.в.)',
    'Уильям Гиллок (1917–1993)':           'Современная академическая музыка (1975–н.в.)',
}

def esc(s):
    return (s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))

def main():
    src = C.XLSX
    z, strings, sheets = C.load(src)
    path = sheets['Classical']

    # --- кто под каким полным ярлыком уже стоит
    lab = collections.defaultdict(collections.Counter)
    for r in C.rows(z, strings, path, 5):
        if r.get('B'):
            lab[r['B']][r.get('A') or ''] += 1

    # --- очередь правок
    fix = collections.OrderedDict()
    tsv = os.path.join(HERE, 'extract', 'attrib.tsv')
    for line in io.open(tsv, encoding='utf-8'):
        if not line.startswith('id:'):
            continue
        a = (line.rstrip('\n').split('\t') + ['', ''])[:3]
        fix[a[0][3:].strip()] = a[1].strip()
    if not fix:
        print('очередь пуста — в таблице всё уже стоит')
        return

    unknown = sorted(set(w for w in fix.values() if w not in lab and w not in NEW))
    if unknown:
        sys.exit('нет полного ярлыка для: ' + '; '.join(unknown) +
                 '\nдопишите их в NEW внутри tools/fix-sheet.py')

    def label(who):
        return lab[who].most_common(1)[0][0] if who in lab else NEW[who]

    # --- где в листе лежит каждый номер трека (колонка J)
    xml = z.read(path).decode('utf-8')
    rownum, want = {}, set(fix)
    for rn, body in re.findall(r'<row[^>]*r="(\d+)"[^>]*>(.*?)</row>', xml, re.S):
        m = re.search(r'<c r="J\d+"([^>]*)>(?:<v>(\d+)</v>)?', body)
        if not m or not m.group(2) or 't="s"' not in m.group(1):
            continue
        tid = strings[int(m.group(2))]
        if tid in want:
            rownum[tid] = rn

    # --- запись, которой на листе Classical нет вовсе: строку заводим.
    # Так правка перестаёт быть исключением: разбор снова читает только лист.
    reg = {}
    for r in C.rows(z, strings, sheets['Уникальные треки'], 5):
        if r.get('B') and r.get('O'):
            reg[r['O']] = r
    lost, born = [], []
    for tid in sorted(want - set(rownum)):
        (born if tid in reg else lost).append(tid)

    # --- словарь строк: чего не хватает, дописываем
    ix = {}
    for i, s in enumerate(strings):
        ix.setdefault(s, i)
    add = []
    def sid(s):
        if s in ix:
            return ix[s]
        ix[s] = len(strings) + len(add)
        add.append(s)
        return ix[s]

    # --- сами правки
    plan, same = [], 0
    for tid, who in fix.items():
        rn = rownum.get(tid)
        if not rn:
            continue
        plan.append((rn, 'B', sid(who), who))
        plan.append((rn, 'A', sid(label(who)), label(who)))

    def repoint(body_xml):
        n = [0]
        for rn, col, new, _ in plan:
            pat = re.compile(r'(<c r="%s%s"[^>]*t="s"[^>]*><v>)(\d+)(</v>)' % (col, rn))
            def sub(m):
                if int(m.group(2)) != new:
                    n[0] += 1
                return m.group(1) + str(new) + m.group(3)
            body_xml, k = pat.subn(sub, body_xml, count=1)
            if not k:
                print('  ! не нашлась ячейка %s%s' % (col, rn))
        return body_xml, n[0]

    new_sheet, changed = repoint(xml)

    # --- дописанные строки листа
    last = max(int(x) for x in re.findall(r'<row[^>]*r="(\d+)"', new_sheet))
    grown = last
    for tid in born:
        r, who = reg[tid], fix[tid]
        grown += 1
        vals = [label(who), who, r.get('K') or r.get('B') or '',
                r.get('C') or '', r.get('D') or '', r.get('F') or '',
                'Ручная правка', 'Ручная правка', r.get('L') or '',
                tid, r.get('P') or '']
        cells = ''.join(
            '<c r="%s%d" s="%d" t="s"><v>%d</v></c>' % (
                chr(65 + i), grown, 26 if i == 9 else 17, sid(v))
            for i, v in enumerate(vals))
        new_sheet = new_sheet.replace(
            '</sheetData>',
            '<row r="%d" spans="1:11">%s</row></sheetData>' % (grown, cells), 1)
    if grown != last:
        new_sheet = re.sub(r'(<dimension ref="A1:K)\d+"',
                           lambda m: m.group(1) + str(grown) + '"', new_sheet, count=1)
        new_sheet = re.sub(r'(sqref="G5:G)\d+"',
                           lambda m: m.group(1) + str(grown) + '"', new_sheet, count=1)

    print('в очереди правок: %d · нашлось строк листа: %d' % (len(fix), len(rownum)))
    print('ячеек изменено: %d · строк дописано: %d · новых строк в словаре: %d'
          % (changed, grown - last, len(add)))
    if born:
        print('заведены строки листа для: %s' % ', '.join(born))
    if lost:
        print('нет ни на листе, ни в реестре — правка отброшена: %s' % ', '.join(lost))
    if DRY:
        print('(--dry: файл не тронут)')
        return

    sst = z.read('xl/sharedStrings.xml').decode('utf-8')
    if grown != last:
        # count — это число ссылок на словарь, а не размер словаря: каждая
        # дописанная строка листа добавляет одиннадцать ячеек.
        sst = re.sub(r'count="(\d+)"',
                     lambda m: 'count="%d"' % (int(m.group(1)) + 11 * (grown - last)),
                     sst, count=1)
    if add:
        tail = ''.join('<si><t>%s</t></si>' % esc(s) for s in add)
        sst = sst.replace('</sst>', tail + '</sst>')
        sst = re.sub(r'uniqueCount="(\d+)"',
                     lambda m: 'uniqueCount="%d"' % (len(strings) + len(add)), sst, count=1)

    tmp = src + '.new'
    zin = zipfile.ZipFile(src)
    tbl = 'xl/tables/table4.xml'          # диапазон таблицы тянется за строками
    with zipfile.ZipFile(tmp, 'w', zipfile.ZIP_DEFLATED) as out:
        for it in zin.infolist():
            data = zin.read(it.filename)
            if it.filename == path:
                data = new_sheet.encode('utf-8')
            elif it.filename == 'xl/sharedStrings.xml':
                data = sst.encode('utf-8')
            elif it.filename == tbl and grown != last:
                t = data.decode('utf-8')
                t = re.sub(r'(ref="A4:K)\d+"',
                           lambda m: m.group(1) + str(grown) + '"', t)
                data = t.encode('utf-8')
            out.writestr(it, data)
    zin.close()
    z.close()
    shutil.move(tmp, src)
    print('таблица переписана: %s' % os.path.relpath(src, ROOT))

main()
