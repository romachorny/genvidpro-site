#!/usr/bin/env bash
# Publish genvidpro.com from roma-server. The only deploy path for the site.
#   ops/deploy.sh "what changed"
# Order: guards -> commit -> build dir -> wrangler from the build dir's ROOT -> live checks -> push.
# Why a build dir: wrangler uploads everything in the folder it runs from, and a run from any
# folder other than the one holding functions/ and wrangler.toml silently ships without the
# functions bundle (/chat and /ev answer 405). The build dir IS that root, minus .git, ops/ and docs.
set -euo pipefail
MSG="${1:?usage: ops/deploy.sh \"what changed\"}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
SITE="https://genvidpro.com"; PROJECT="genvidpro"
SECRETS="$HOME/.secrets/cloudflare.env"
die(){ echo "DEPLOY STOPPED: $*" >&2; exit 1; }

# 1. Guards
for f in wrangler.toml functions/chat.js functions/ev.js index.html services.json _headers; do
  [ -f "$f" ] || die "$f missing, this is not the site root"; done
python3 -c "import json;d=json.load(open('services.json'));assert d['version'] and d['services']" \
  || die "services.json is not valid"
if python3 -c "import jsonschema" 2>/dev/null; then
  python3 -c "import json,jsonschema;jsonschema.validate(json.load(open('services.json')),json.load(open('services.schema.json')))" \
    || die "services.json fails services.schema.json"
fi
ops/fetch-media.sh --check >/dev/null || die "videos incomplete, run ops/fetch-media.sh"
[ -f "$SECRETS" ] || die "$SECRETS missing"
[ "$(stat -c %a "$SECRETS")" = "600" ] || die "$SECRETS must be chmod 600"
set -a; . "$SECRETS"; set +a      # CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID; never on a command line
: "${CLOUDFLARE_API_TOKEN:?}"; : "${CLOUDFLARE_ACCOUNT_ID:?}"
cf(){ curl -fsS -H @<(printf 'Authorization: Bearer %s\n' "$CLOUDFLARE_API_TOKEN") "$@"; }
PROD_BRANCH="$(cf "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/$PROJECT" \
  | python3 -c 'import json,sys;print(json.load(sys.stdin)["result"]["production_branch"])')" \
  || die "Cloudflare API did not answer, check the token"

# 2. Commit what is about to go live
git add -A
git diff --cached --quiet || git commit -q -m "deploy: $MSG"
REV="$(git rev-parse --short HEAD)"
VERSION="$(python3 -c "import json;print(json.load(open('services.json'))['version'])")"

# 3. Build dir = exact publish set: tracked files + manifest videos, nothing else
BUILD="$(mktemp -d "${TMPDIR:-/tmp}/gvp-deploy.XXXXXX")"; trap 'rm -rf "$BUILD"' EXIT
{ git ls-files; awk '{print $3}' ops/media.sha256; } \
  | grep -vE '^(ops/|README\.md$|\.gitignore$|\.github/)' | sort -u \
  | while read -r f; do mkdir -p "$BUILD/$(dirname "$f")"; cp -p "$f" "$BUILD/$f"; done
[ -f "$BUILD/functions/chat.js" ] && [ -f "$BUILD/wrangler.toml" ] || die "build dir lost functions/"

# 4. Deploy from the build dir's root
( cd "$BUILD" && npx --yes wrangler@4 pages deploy . --project-name "$PROJECT" \
    --branch "$PROD_BRANCH" --commit-hash "$(git -C "$ROOT" rev-parse HEAD)" \
    --commit-message "$MSG" --commit-dirty=true ) || die "wrangler failed"

# 5. Live checks, up to 3 minutes for the edge
ok=0
for i in $(seq 1 18); do
  live="$(curl -fsS "$SITE/services.json?v=$REV$i" | python3 -c 'import json,sys;print(json.load(sys.stdin)["version"])' || true)"
  [ "$live" = "$VERSION" ] && { ok=1; break; }; sleep 10
done
[ $ok = 1 ] || die "live services.json is '$live', expected '$VERSION'"
for ep in chat ev; do
  code="$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' -d '{}' "$SITE/$ep")"
  [ "$code" != "405" ] || die "/$ep answers 405: functions bundle missing"
  echo "/$ep -> $code"
done
home="$(curl -s -o /dev/null -w '%{http_code}' "$SITE/")"; [ "$home" = "200" ] || die "home page answers $home"

# 6. History
git push -q origin HEAD || echo "WARNING: deployed, but git push failed; push by hand"
echo "LIVE: $SITE  services.json $VERSION  commit $REV  branch $PROD_BRANCH"
