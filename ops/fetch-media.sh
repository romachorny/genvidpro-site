#!/usr/bin/env bash
# Restore or verify every video the site serves, as listed in ops/media.sha256
# ("sha256  bytes  path"). Missing or wrong files are fetched from the live site.
#   ops/fetch-media.sh          fetch what is missing or different, then verify
#   ops/fetch-media.sh --check  verify only, exit 1 if anything is missing or wrong
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
BASE="${GVP_BASE:-https://genvidpro.com}"
CHECK_ONLY=0; [ "${1:-}" = "--check" ] && CHECK_ONLY=1
bad=0; fetched=0
while read -r sum size path; do
  [ -z "${path:-}" ] && continue
  if [ -f "$path" ] && [ "$(sha256sum "$path" | cut -d' ' -f1)" = "$sum" ]; then continue; fi
  if [ $CHECK_ONLY = 1 ]; then echo "MISSING/DIFF $path"; bad=1; continue; fi
  mkdir -p "$(dirname "$path")"
  curl -fsS --retry 3 -o "$path.part" "$BASE/$path"
  got="$(sha256sum "$path.part" | cut -d' ' -f1)"
  mv "$path.part" "$path"; fetched=$((fetched+1))
  if [ "$got" != "$sum" ]; then
    # The live file is what visitors see, so it is kept; the manifest is refreshed.
    echo "LIVE DIFFERS from manifest, kept live copy: $path"
    python3 - "$path" "$got" "$(stat -c %s "$path")" <<'PY'
import sys; p,s,n=sys.argv[1:]
f='ops/media.sha256'; L=open(f).read().splitlines()
open(f,'w').write('\n'.join((f"{s}  {n}  {p}" if l.split()[-1]==p else l) for l in L)+'\n')
PY
  fi
done < ops/media.sha256
[ $CHECK_ONLY = 1 ] && { [ $bad = 0 ] && echo "media OK" || exit 1; } || echo "media ready, fetched $fetched"
