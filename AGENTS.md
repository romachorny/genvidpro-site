# AGENTS.md — genvidpro.com

## What this is

Production source of genvidpro.com — a static website (plain HTML/CSS/JS, no framework, no build step, no bundler). Every page is a single self-contained HTML file. Served in production by Cloudflare Pages.

## How it runs here

Served as static files by **nginx:alpine** on host port 3000 via `docker-compose.base44.yml`. No build step needed — files are bind-mounted read-only into the container.

- Config: `ops/nginx-base44-main.conf` (runs workers as `root` because the repo dir has 700 perms),
  `ops/nginx-base44.conf` (the server block), `ops/nginx-base44-headers.conf` (the headers every
  location repeats — an `add_header` inside a location silently drops the ones above it).
- Healthcheck: `wget` to `127.0.0.1:80` (must use IP, not `localhost` — nginx doesn't listen on IPv6).

## Two things nginx has to do that Cloudflare does for free

**The closed doors.** Cloudflare Pages never serves `wrangler.toml` or `functions/`, and `ops/`
is cut out of the publish set by `ops/deploy.sh`. Here the whole repository is the web root, so
`ops/nginx-base44.conf` closes those paths by hand. Before it did, `/ops/deploy.sh`,
`/functions/chat.js` and `/wrangler.toml` — which carries the KV and D1 identifiers — all
answered 200 on the preview address.

**The headers.** `_headers` is a Cloudflare Pages file; nginx does not read it. Every rule in it
is restated in `ops/nginx-base44-headers.conf` and `ops/nginx-base44.conf`: the CSP, HSTS,
`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, the `no-cache` list, the week
on `media/` and `videos/`, the year on `fonts/`, and `Access-Control-Allow-Origin: *` on
`services.json`, which `gvp-wa.js` and the WhatsApp agent read cross-origin. The CSP here differs
from the live one in two places, both because this is a copy: `frame-ancestors` and `connect-src`
allow Base44, since the preview runs in an iframe on `app.base44.com`, and `connect-src` allows
`genvidpro.com`, because `gvp-wa.js` reads `/services.json` and `/api/ref` from the real site
whenever it runs anywhere else. **If you add a rule to `_headers`, add it here too** — a header
that lives in only one of the two files is a header this copy does not send.

## What does NOT run here

The `functions/` directory contains **Cloudflare Pages Functions** (serverless) that require Cloudflare's runtime — KV namespaces (`EVENTS`), D1 database (`PUSHDB`), a Worker service binding (`RENDER`), and an Anthropic API key (`ANTHROPIC_API_KEY`). These power the chat assistant, push notifications, TTS, art search, and the preview renderer. They cannot run in the local nginx setup. The static site renders fully without them; only those interactive features are inactive in the preview.

If you need the chat assistant to work, set `ANTHROPIC_API_KEY` via the Base44 secrets dashboard. Full function emulation would require `wrangler pages dev` with Cloudflare account bindings.

## Media

Video files (`*.mp4`) are not committed (see `.gitignore`); `ops/media.sha256` lists them and
`ops/fetch-media.sh` pulls them from the live site — 82 files, about 385 MB.

The start command runs that fetch in the background after nginx is already up, so the preview
appears at once and the films fill in behind it (nginx serves the repo directory straight from
disk, so a file that lands a minute later is served a minute later). Until it finishes, video
blocks show their poster frames. Progress is in `/tmp/fetch-media.log`; `ops/fetch-media.sh --check`
says whether anything is still missing.

## Key files

| File | Purpose |
|---|---|
| `index.html` | Home page (315 KB, self-contained) |
| `builder.html` + `tpl-engine.js` | Site builder tool |
| `i18n.js` | 12-language translation including RTL |
| `sw.js` | Service worker (PWA offline) |
| `assistant.js` | On-site chat assistant UI |
| `_headers` | Cloudflare Pages cache/security headers |
| `wrangler.toml` | Cloudflare Pages deploy config with KV/D1/Worker bindings |
| `ops/` | Deploy scripts, media checksums, push schema |
| `render/` | gvp-render Cloudflare Worker (Chromium page renderer) |
