#!/usr/bin/env python3
"""Музыка и обложки для фильма из библиотеки: превью Apple (30 с) и обложки.

    python3 gen/music.py        → public/music/<id>.m4a, public/covers/<id>.jpg,
                                   src/v5/tracks.json (исполнитель, название, альбом)

Как и сайт, файлы в репозитории не хранятся (public/music и public/covers в
.gitignore): скрипт забирает их с витрины Apple при сборке фильма.
Идентификаторы — Apple Music из data/catalog.json (поле i)."""
import json, os, time, urllib.request
os.chdir(os.path.dirname(os.path.abspath(__file__)) + "/..")
CUES = {
    # версии героя и их «своя» пластинка
    "r1": "574050602",    # AC/DC — Back In Black (11–15)
    "r2": "251127052",    # Arctic Monkeys — 505 (16–18)
    "su": "580708941",    # Led Zeppelin — Babe I'm Gonna Leave You (19–21)
    "sp": "594522647",    # Бах — Гольдберг-вариации, Гульд 1981 (22–24)
    "now": "1452515042",  # Бетховен — «Патетическая», Гилельс (сейчас)
    # остальные реплики фильма
    "room": "1717831052",     # Сакамото — Energy flow: музыка в комнате, пока её не выключили
    "richter": "1118265397",  # Бах — прелюдия до минор BWV 847: Рихтер
    "schiff": "1452153134",   # …Андраш Шифф
    "nikolaeva": "1116797606",# …Татьяна Николаева
    "adagio": "1452515048",   # «Патетическая», II — тихий финал главы про слух
    "skillet": "325821864",   # Skillet — Awake and Alive: старая песня в паузе
    "skip": "460737399",      # Hurts — Illuminated: трек, который сегодня не дослушал бы
    "nickel": "719617243",    # Nickelback — Burn It to the Ground
    "bach": "211291241",      # Бах — концерт ре минор BWV 1052
    "avant": "1572109443",    # Лигети — Hungarian Rock
    "asap": "1862935173",     # A$AP Rocky — ROBBERY
    "tiktok": "1850117925",   # Aarne, Toxi$ & Big Baby Tape — NOBODY
    "abba": "1444206083",     # ABBA — Dancing Queen
    "nsync": "255985600",     # *NSYNC — Bye Bye Bye
    "limahl": "691264357",    # Limahl — The NeverEnding Story
    "salmon": "1474660531",   # The Chemical Brothers — The Salmon Dance
    "alina": "1036946712",    # Пярт — Für Alina
    "hell": "574044008",      # AC/DC — Highway to Hell: «старый альбом» в финале
}
os.makedirs("public/music", exist_ok=True)
os.makedirs("public/covers", exist_ok=True)
ids = sorted(set(CUES.values()))
meta = {}
for country in ("ru", "us"):
    need = [i for i in ids if i not in meta]
    if not need:
        break
    url = "https://itunes.apple.com/lookup?id=" + ",".join(need) + f"&country={country}&entity=song"
    res = json.loads(urllib.request.urlopen(url, timeout=60).read())
    for x in res.get("results", []):
        if x.get("wrapperType") == "track" and x.get("previewUrl"):
            meta[str(x["trackId"])] = x
    time.sleep(1)
out = {}
for k, i in CUES.items():
    x = meta.get(i)
    if not x:
        print("нет превью:", k, i)
        continue
    mp, cp = f"public/music/{i}.m4a", f"public/covers/{i}.jpg"
    if not os.path.exists(mp):
        open(mp, "wb").write(urllib.request.urlopen(x["previewUrl"], timeout=60).read())
    if not os.path.exists(cp):
        art = x["artworkUrl100"].replace("100x100bb", "600x600bb")
        open(cp, "wb").write(urllib.request.urlopen(art, timeout=60).read())
    out[k] = {"id": i, "artist": x["artistName"], "track": x["trackName"], "album": x.get("collectionName", ""), "year": x.get("releaseDate", "")[:4], "collectionId": x.get("collectionId")}
    print(k, "·", x["artistName"], "—", x["trackName"])
json.dump(out, open("src/v5/tracks.json", "w"), ensure_ascii=False, indent=1)
