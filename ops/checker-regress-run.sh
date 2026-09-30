#!/usr/bin/env bash
# One regression run, saved where a later session can read it without rerunning anything.
#   ops/checker-regress-run.sh [label]
#
# Why this exists: the checker's browser is on the Workers Free plan, which allows ten
# minutes of browser time per UTC day. Spend it and every check answers from the HTML
# instead, which looks like a pass and proves nothing. So the honest run has to happen on a
# fresh day's allowance, and it has to happen whether or not anyone is sitting here.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
OUT="$HOME/work/state/checker-regress-$(date -u +%Y%m%dT%H%M%SZ)${1:+-$1}.txt"
{
  echo "run at $(date -u +'%Y-%m-%d %H:%M:%S UTC')"
  echo "browser budget before: $(curl -s --max-time 20 'https://genvidpro.com/preview?budget=1' \
      -H 'Referer: https://genvidpro.com/' -H 'User-Agent: Mozilla/5.0 (X11) Chrome/128' || echo unavailable)"
  echo
  timeout 1700 ops/checker-regress.sh https://genvidpro.com
  echo
  echo "exit: $?"
  echo "browser budget after: $(curl -s --max-time 20 'https://genvidpro.com/preview?budget=1' \
      -H 'Referer: https://genvidpro.com/' -H 'User-Agent: Mozilla/5.0 (X11) Chrome/128' || echo unavailable)"
} >"$OUT" 2>&1
ln -sfn "$OUT" "$HOME/work/state/checker-regress-latest.txt"
echo "$OUT"
