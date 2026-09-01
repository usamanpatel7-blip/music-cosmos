# Извлечение данных из таблицы

Собирает из `data/musical-cosmos-sheet.xlsx` компактный JSON, который
вшивается в `docs/08-cosmos.html`. Ни Python, ни Node не нужны — awk и unzip.

```sh
unzip -o -q ../../data/musical-cosmos-sheet.xlsx -d wb
awk -f ../ss.awk wb/xl/sharedStrings.xml > ss.tsv

# лист 4 — Classical (нормализованный), лист 3 — Popular&alternative,
# лист 5 — «Уникальные треки» (главный реестр)
awk -v SS=ss.tsv -v MINR=5 -v MAXR=0 -v COLS="J,A,B,C,D,E,I" -f dump.awk \
    wb/xl/worksheets/sheet4.xml | cut -f2- > cl4.tsv
awk -v SS=ss.tsv -v MINR=5 -v MAXR=0 -v COLS="I,A,B,C,D,E,F,G,H" -f dump.awk \
    wb/xl/worksheets/sheet3.xml | cut -f2- > pp3.tsv
awk -v SS=ss.tsv -v MINR=5 -v MAXR=0 \
    -v COLS="O,B,C,D,E,F,G,H,I,J,K,L,M,R,S,T,U,V,W,X" -f dump.awk \
    wb/xl/worksheets/sheet5.xml | cut -f2- > u5.tsv

awk -f rows.awk cl4.tsv pp3.tsv u5.tsv > rows.tsv   # склейка по Apple ID
awk -f gen.awk  cl4.tsv rows.tsv        > cosmos.json

# обязательная проверка: сломанный экспорт должен падать здесь,
# а не белым экраном у зрителя
python3 -c "import json;d=json.load(open('cosmos.json'));\
print('ok',len(d['gal']),'жанров',len(d['sys']),'авторов',len(d['trk']),'треков')"
```

`rows.awk` берёт эпоху и композитора из нормализованного листа `Classical`,
а не из реестра: в реестре они остались в исходном виде. Сверка сходится —
после склейки во всей библиотеке ровно одна запись «Эпоха не определена»,
та самая строка 1890.

`gen.awk` экранирует по JSON и дополнительно угловые скобки: результат вшивается
в `<script>`, и последовательность `</script>` внутри названия трека закрыла бы
тег и положила страницу целиком.
