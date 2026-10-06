#!/usr/bin/env python3
"""Время каждого слова эссе на шкале фильма (для титров по словам).
words.json → src/eras/words.json: [[слово, t0, t1, номер фразы], …].
Слова, которых не нашёл распознаватель, растягиваются между соседями."""
import json, os
os.chdir(os.path.dirname(os.path.abspath(__file__)) + "/..")
d = json.load(open("words.json"))
asr, ew, match = d["asr"], d["ew"], {int(k): v for k, v in d["match"].items()}
n = len(ew)
t0 = [asr[match[i]]["t0"] if i in match else None for i in range(n)]
t1 = [asr[match[i]]["t1"] if i in match else None for i in range(n)]
i = 0
while i < n:
    if t0[i] is None:
        j = i
        while j < n and t0[j] is None: j += 1
        a = t1[i - 1] if i > 0 else 0.0
        b = t0[j] if j < n else a + 0.4 * (j - i)
        for k in range(i, j):
            t0[k] = a + (b - a) * (k - i) / (j - i)
            t1[k] = a + (b - a) * (k - i + 1) / (j - i)
        i = j
    else:
        i += 1
# названия плейлистов распознаватель не узнал — их время взято по соседним
# распознанным словам («одинадцать», «шестнадцать», «двадцати»)
FIX = {"«11–15»,": (78.39, 79.45), "«16–18»,": (79.53, 80.7), "«20–21».": (80.85, 82.08)}
for k in range(n):
    if ew[k][2] in FIX:
        t0[k], t1[k] = FIX[ew[k][2]]
out = [[ew[k][2], round(t0[k], 3), round(t1[k], 3), ew[k][1]] for k in range(n)]
json.dump(out, open("src/eras/words.json", "w"), ensure_ascii=False, separators=(",", ":"))
print(n, "слов")
