#!/bin/sh
# src/*.html — страницы без обёртки, как они публикуются артефактами.
# docs/*.html — те же страницы как самостоятельные файлы и корень GitHub Pages.
# Единственный источник — src/. Правки в docs/ руками не вносятся.
set -e
root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
for f in "$root"/src/*.html; do
  out="$root/docs/$(basename "$f")"
  { printf '<!doctype html>\n<html lang="ru">\n<head>\n'
    printf '<meta charset="utf-8">\n'
    printf '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
    cat "$f"
    printf '\n</html>\n'
  } > "$out"
  echo "$(basename "$out")"
done
