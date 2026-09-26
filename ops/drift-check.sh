#!/usr/bin/env bash
# Шаг 3 спецификации: перед любой выкладкой сверить дерево с тем, что реально отдаёт
# genvidpro.com. Дерево с ноутбука может оказаться СТАРШЕ живого сайта, и тогда выкладка
# тихо откатит сайт назад. Расхождение — стоп, а не предупреждение.
#
# Что НЕ считается расхождением и почему:
#   308 на /page.html      Pages отдаёт чистые адреса, /page.html → /page. Идём по редиректу.
#   functions/**           серверный код, файлом не отдаётся вовсе.
#   rocket-loader, beacon  Cloudflare дописывает свои скрипты на лету.
#   mailto:                Cloudflare прячет почту за /cdn-cgi/l/email-protection, поэтому
#                          в живом ответе на месте адреса стоит заглушка. Приводим обе
#                          стороны к пустому href и сравниваем остальное.
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
BASE="${BASE:-https://genvidpro.com}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

norm() {
  sed -E \
    -e 's#<script[^>]*(cdn-cgi/scripts|rocket-loader|beacon\.min\.js|cloudflareinsights)[^<]*</script>##g' \
    -e 's#<script[^>]*/cdn-cgi/[^>]*>[^<]*</script>##g' \
    -e 's#<(a|span)[^>]*__cf_email__[^>]*>[^<]*</(a|span)>#EMAIL#g' \
    -e 's#data-cfemail="[^"]*"##g' \
    -e 's#href="(mailto:[^"]*|/cdn-cgi/l/email-protection[^"]*)"#href=""#g' \
    -e 's#[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}#EMAIL#g' \
    -e 's#<a([^>]*)>EMAIL</a>#EMAIL#g' \
    -e 's#[[:space:]]+$##'
}

same=0; diff_n=0; miss=0
: > "$TMP/report.txt"
while IFS= read -r f; do
  case "$f" in
    ops/*|functions/*|README.md|.gitignore|wrangler.toml|deploy.cmd|deploy-log.txt|scripts/*|watermark_all.py|__pycache__/*|_headers|_redirects) continue ;;
  esac
  case "$f" in *.html|*.js|*.json|*.xml|*.txt) ;; *) continue ;; esac
  url="$BASE/$f"
  [ "$f" = "index.html" ] && url="$BASE/"
  code="$(curl -sL -o "$TMP/live" -w '%{http_code}' --max-time 45 "$url?nc=$(date +%s%N)" || echo 000)"
  if [ "$code" != "200" ]; then
    # файл, закрытый функцией-охранником, — это не расхождение, а задумка
    if [ "$code" = "404" ] || [ "$code" = "403" ]; then continue; fi
    miss=$((miss+1)); printf '%-44s HTTP %s\n' "$f" "$code" >> "$TMP/report.txt"; continue
  fi
  # Сравниваем ПОСЛЕДНЮЮ ВЫЛОЖЕННУЮ точку (HEAD), а не рабочие правки: смысл сторожа в том,
  # чтобы поймать «на сайте есть то, чего в дереве нет» — то есть чужую выкладку поверх нас.
  # Свои несохранённые правки это не дрейф, они как раз и едут следующей выкладкой.
  git show "HEAD:$f" > "$TMP/head" 2>/dev/null || cp "$f" "$TMP/head"
  norm < "$TMP/head" > "$TMP/a" 2>/dev/null
  norm < "$TMP/live" > "$TMP/b" 2>/dev/null
  if cmp -s "$TMP/a" "$TMP/b"; then same=$((same+1)); else
    diff_n=$((diff_n+1))
    { printf '\n=== %s ===\n' "$f"; diff -u "$TMP/a" "$TMP/b" | head -30; } >> "$TMP/report.txt"
  fi
done < <(git ls-files)

dirty="$(git status --porcelain -- . | grep -vE '^\?\? ops/' | wc -l)"
[ "$dirty" -gt 0 ] && echo "несохранённых правок в дереве: $dirty (они поедут этой выкладкой, это не дрейф)"
echo "совпало: $same | расходится: $diff_n | недоступно: $miss"
if [ "$diff_n" -gt 0 ] || [ "$miss" -gt 0 ]; then
  echo "----- расхождения -----"
  cat "$TMP/report.txt"
  echo "СТОП: дерево и живой сайт расходятся. Выкладку не делать, пока это не разобрано."
  exit 1
fi
echo "дерево совпадает с живым сайтом"
