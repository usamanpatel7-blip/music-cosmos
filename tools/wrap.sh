#!/bin/sh
# src/*.html — страницы без обёртки, как они публикуются артефактами.
# docs/*.html — те же страницы как самостоятельные файлы и корень GitHub Pages.
# Единственный источник — src/. Правки в docs/ руками не вносятся.
set -e
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
for f in "$root"/src/*.html; do
  case "$(basename "$f")" in
    lab-*) continue ;;   # стенды — рабочий инструмент, в docs/ им делать нечего
  esac
  out="$root/docs/$(basename "$f")"
  { printf '<!doctype html>\n<html lang="ru">\n<head>\n'
    printf '<meta charset="utf-8">\n'
    printf '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
    printf '<link rel="icon" href="data:image/svg+xml,%%3Csvg xmlns=%%22http://www.w3.org/2000/svg%%22 viewBox=%%220 0 32 32%%22%%3E%%3Ccircle cx=%%2216%%22 cy=%%2216%%22 r=%%2216%%22 fill=%%22%%23070b16%%22/%%3E%%3Ccircle cx=%%2211%%22 cy=%%2215%%22 r=%%225%%22 fill=%%22%%23f0b45c%%22/%%3E%%3Ccircle cx=%%2222%%22 cy=%%2219%%22 r=%%223.4%%22 fill=%%22%%23ff7a6b%%22/%%3E%%3Ccircle cx=%%2224%%22 cy=%%229%%22 r=%%221.7%%22 fill=%%22%%238fd0ff%%22/%%3E%%3C/svg%%3E">\n'
    cat "$f"
    printf '\n</html>\n'
  } > "$out"
  echo "$(basename "$out")"
done
