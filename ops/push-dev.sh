#!/usr/bin/env bash
# Local run of the site WITH its functions, for working on the notifications.
#   ops/push-dev.sh            -> https://127.0.0.1:8789
#
# Wrangler reads its secrets from .dev.vars, and secrets belong in ~/.secrets and
# nowhere else — so the file is written at the start and shredded on the way out,
# whichever way this script ends. It is in .gitignore as a second line of defence.
#
# https and not http on purpose: the site's own Content-Security-Policy carries
# upgrade-insecure-requests, which on 127.0.0.1 sends the service worker's own
# fetches to https://127.0.0.1 — the worker then never finishes installing and
# nothing about push can be tried at all. The certificate is self-signed, so the
# browser is started with --ignore-certificate-errors.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
VAPID="$HOME/.secrets/vapid.env"
[ -f "$VAPID" ] || { echo "$VAPID missing" >&2; exit 1; }
trap 'rm -f "$ROOT/.dev.vars"' EXIT INT TERM
( umask 077; grep -E '^(VAPID_PUBLIC|VAPID_PRIVATE|PUSH_KEY)=' "$VAPID" > "$ROOT/.dev.vars" )
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh" >/dev/null; nvm use 22 >/dev/null
# the local D1 needs the schema once; harmless to repeat
yes | npx --yes wrangler@4 d1 execute gvp-push --local --file ops/push-schema.sql >/dev/null 2>&1 || true
exec npx --yes wrangler@4 pages dev . --port "${PORT:-8789}" --ip 127.0.0.1 \
  --local-protocol https --compatibility-date 2026-09-05
