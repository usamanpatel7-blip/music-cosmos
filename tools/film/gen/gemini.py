#!/usr/bin/env python3
"""Генерация кадров для фильма через Google Gemini API (без SDK).

Ключ — в переменной окружения GEMINI_API_KEY (Google AI Studio → Get API key).
Нужен сетевой доступ к generativelanguage.googleapis.com.

    python3 gen/gemini.py models                       # какие модели доступны ключу
    python3 gen/gemini.py image "промпт" out.png [ref1.jpg ref2.png ...] [--model M] [--aspect 16:9]
    python3 gen/gemini.py video "промпт" out.mp4 [--image first.png] [--model M] [--aspect 16:9]

Картинки — Nano Banana (gemini-*-image*): референсы (фото, лист персонажа)
передаются вместе с промптом, так держится похожесть. Видео — Veo: долгая
операция, скрипт ждёт её и скачивает ролик.
"""
import base64, json, mimetypes, os, sys, time, urllib.error, urllib.request

API = "https://generativelanguage.googleapis.com/v1beta"
IMAGE_MODEL = "gemini-2.5-flash-image"  # Nano Banana; Pro — gemini-3-pro-image-preview
VIDEO_MODEL = "veo-3.0-generate-001"


def key():
    k = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not k:
        sys.exit("нет GEMINI_API_KEY в окружении")
    return k


def call(method, path, body=None, raw=False):
    req = urllib.request.Request(API + path if path.startswith("/") else path, method=method,
                                 headers={"x-goog-api-key": key(), "Content-Type": "application/json"},
                                 data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            data = r.read()
    except urllib.error.HTTPError as e:
        sys.exit(f"{e.code}: {e.read().decode(errors='replace')[:2000]}")
    return data if raw else json.loads(data)


def opt(args, name, default=None):
    if name in args:
        i = args.index(name)
        v = args[i + 1]
        del args[i:i + 2]
        return v
    return default


def models():
    res = call("GET", "/models?pageSize=200")
    for m in res.get("models", []):
        n = m["name"].split("/")[-1]
        if any(s in n for s in ("image", "veo", "imagen")):
            print(n, "—", ", ".join(m.get("supportedGenerationMethods", [])))


def image(args):
    model = opt(args, "--model", IMAGE_MODEL)
    aspect = opt(args, "--aspect", "16:9")
    prompt, out, refs = args[0], args[1], args[2:]
    parts = []
    for f in refs:
        mt = mimetypes.guess_type(f)[0] or "image/png"
        parts.append({"inlineData": {"mimeType": mt, "data": base64.b64encode(open(f, "rb").read()).decode()}})
    parts.append({"text": prompt})
    body = {"contents": [{"parts": parts}],
            "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": aspect}}}
    res = call("POST", f"/models/{model}:generateContent", body)
    for c in res.get("candidates", []):
        for p in c.get("content", {}).get("parts", []):
            if "inlineData" in p:
                open(out, "wb").write(base64.b64decode(p["inlineData"]["data"]))
                print("сохранено:", out)
                return
            if "text" in p:
                print("модель:", p["text"])
    sys.exit("картинки в ответе нет: " + json.dumps(res, ensure_ascii=False)[:1500])


def video(args):
    model = opt(args, "--model", VIDEO_MODEL)
    aspect = opt(args, "--aspect", "16:9")
    first = opt(args, "--image")
    prompt, out = args[0], args[1]
    inst = {"prompt": prompt}
    if first:
        inst["image"] = {"bytesBase64Encoded": base64.b64encode(open(first, "rb").read()).decode(),
                         "mimeType": mimetypes.guess_type(first)[0] or "image/png"}
    op = call("POST", f"/models/{model}:predictLongRunning",
              {"instances": [inst], "parameters": {"aspectRatio": aspect}})
    name = op["name"]
    print("операция:", name)
    while not op.get("done"):
        time.sleep(10)
        op = call("GET", "/" + name)
        print("…жду")
    if "error" in op:
        sys.exit(json.dumps(op["error"], ensure_ascii=False))
    samples = op["response"]["generateVideoResponse"]["generatedSamples"]
    uri = samples[0]["video"]["uri"]
    open(out, "wb").write(call("GET", uri, raw=True))
    print("сохранено:", out)


if __name__ == "__main__":
    a = sys.argv[1:]
    if not a or a[0] not in ("models", "image", "video"):
        sys.exit(__doc__)
    {"models": lambda: models(), "image": lambda: image(a[1:]), "video": lambda: video(a[1:])}[a[0]]()
