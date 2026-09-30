# AGENTS.md — genvidpro.com

## What this is

Production source of genvidpro.com — a static website (plain HTML/CSS/JS, no framework, no build step, no bundler). Every page is a single self-contained HTML file. Served in production by Cloudflare Pages.

## How it runs here

Served as static files by **nginx:alpine** on host port 3000 via `docker-compose.base44.yml`. No build step needed — files are bind-mounted read-only into the container.

- Config: `ops/nginx-base44-main.conf` (runs workers as `root` because the repo dir has 700 perms), `ops/nginx-base44.conf` (server block with cache headers matching `_headers` and the site's own 404 page).
- Healthcheck: `wget` to `127.0.0.1:80` (must use IP, not `localhost` — nginx doesn't listen on IPv6).

## What does NOT run here

The `functions/` directory contains **Cloudflare Pages Functions** (serverless) that require Cloudflare's runtime — KV namespaces (`EVENTS`), D1 database (`PUSHDB`), a Worker service binding (`RENDER`), and an Anthropic API key (`ANTHROPIC_API_KEY`). These power the chat assistant, push notifications, TTS, art search, and the preview renderer. They cannot run in the local nginx setup. The static site renders fully without them; only those interactive features are inactive in the preview.

If you need the chat assistant to work, set `ANTHROPIC_API_KEY` via the Base44 secrets dashboard. Full function emulation would require `wrangler pages dev` with Cloudflare account bindings.

## Media

Video files (`*.mp4`) are not committed (see `.gitignore`); `ops/media.sha256` lists them and `ops/fetch-media.sh` restores them. Poster images (JPEGs in `media/`) ARE committed and will display. Video previews will show poster frames but won't play the actual videos in the preview.

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
