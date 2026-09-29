#!/usr/bin/env bash
# Publish gvp-render, the browser behind the site checker. Separate from ops/deploy.sh
# on purpose: this one needs node_modules bundled, the site's deploy must never have any.
#   ops/render-deploy.sh
# The Worker has no public address (workers_dev = false, no route). genvidpro.com reaches
# it only through the service binding declared in the site's wrangler.toml, so this has to
# be live BEFORE a site deploy that binds it, or the binding fails to resolve.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT/render"
SECRETS="$HOME/.secrets/cloudflare.env"
die(){ echo "RENDER DEPLOY STOPPED: $*" >&2; exit 1; }

[ -f wrangler.toml ] && [ -f src/index.js ] || die "not the render worker directory"
[ -f "$SECRETS" ] || die "$SECRETS missing"
[ "$(stat -c %a "$SECRETS")" = "600" ] || die "$SECRETS must be chmod 600"

# Node 22: wrangler 4 refuses to bundle on 18, which is what the server's default is.
. "$HOME/.nvm/nvm.sh"; nvm use 22 >/dev/null || die "Node 22 missing from nvm"

[ -d node_modules/@cloudflare/puppeteer ] || npm install --no-audit --no-fund >/dev/null

set -a; . "$SECRETS"; set +a      # never on a command line
: "${CLOUDFLARE_API_TOKEN:?}"; : "${CLOUDFLARE_ACCOUNT_ID:?}"

npx --yes wrangler@4 deploy || die "wrangler failed (the token needs Workers Scripts:Edit and Browser Rendering:Edit)"
echo "gvp-render deployed. It answers nobody but genvidpro.com's /preview."
