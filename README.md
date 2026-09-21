# genvidpro.com


Production source of [genvidpro.com](https://genvidpro.com) — the site of GenVidPro, an AI video studio run by one person.


No framework, no build step, no bundler. Plain HTML, CSS and JavaScript, served from the edge by Cloudflare Pages. Every page is a single file that works with JavaScript switched off.


## What is inside


| File | What it does |
|---|---|
| `index.html` | Home: hero, service panels, work carousels, order form |
| `work.html` | Portfolio grid, lazy video previews, vertical and cinematic |
| `app.html` | Service page: app without the store (PWA) |
| `automation.html` | Service page: orders in WhatsApp |
| `living-paintings.html` | House series: classical paintings brought into motion |
| `builder.html` + `tpl-engine.js` | Site builder: a brief becomes a working one page site |
| `assistant.js` | On site assistant that answers and collects the brief |
| `i18n.js` | 12 languages including Hebrew and Arabic, full RTL |
| `sw.js`, `manifest.json`, `push.js` | PWA layer: offline cache, install prompt, push |
| `_headers`, `wrangler.toml` | Cloudflare Pages config, caching and security headers |
| `watermark_all.py` | ffmpeg pipeline: masters, watermarked previews, poster frames |


## Engineering notes


- **Performance.** Video previews are muted short loops, decoded only when the card enters the viewport. Posters are static JPEG, so nothing downloads before it is seen.
- **RTL.** Hebrew and Arabic are not a translation layer bolted on top: layout, carousels and form validation all mirror.
- **PWA.** Service worker caches the shell and the current poster set, so the site opens offline and installs to the home screen without a store.
- **No tracking.** No analytics scripts, no third party fonts at runtime, fonts are self hosted woff2 subsets.


## Deploy


```
wrangler pages deploy . --project-name genvidpro
```


Media (`videos/`, `media/`) is intentionally not committed: masters live outside the repository and are published separately.


## How this is built

Every idea, product decision and creative direction here is mine. The code is written in pair with Claude: I design, decide and review, the agent types and tests.

## Contact


[genvidpro.com](https://genvidpro.com) · [LinkedIn](https://www.linkedin.com/in/genvidpro) · genvidpro@gmail.com

# genvidpro.com

Production source of [genvidpro.com](https://genvidpro.com) — the site of GenVidPro, an AI video studio run by one person.

No framework, no build step, no bundler. Plain HTML, CSS and JavaScript, served from the edge by Cloudflare Pages. Every page is a single file that works with JavaScript switched off.

## What is inside

| File | What it does |
|---|---|
| `index.html` | Home: hero, service panels, work carousels, order form |
| `work.html` | Portfolio grid, lazy video previews, vertical and cinematic |
| `app.html` | Service page: app without the store (PWA) |
| `automation.html` | Service page: orders in WhatsApp |
| `living-paintings.html` | House series: classical paintings brought into motion |
| `builder.html` + `tpl-engine.js` | Site builder: a brief becomes a working one page site |
| `assistant.js` | On site assistant that answers and collects the brief |
| `i18n.js` | 12 languages including Hebrew and Arabic, full RTL |
| `sw.js`, `manifest.json`, `push.js` | PWA layer: offline cache, install prompt, push |
| `_headers`, `wrangler.toml` | Cloudflare Pages config, caching and security headers |
| `watermark_all.py` | ffmpeg pipeline: masters, watermarked previews, poster frames |

## Engineering notes

- **Performance.** Video previews are muted short loops, decoded only when the card enters the viewport. Posters are static JPEG, so nothing downloads before it is seen.
- **RTL.** Hebrew and Arabic are not a translation layer bolted on top: layout, carousels and form validation all mirror.
- **PWA.** Service worker caches the shell and the current poster set, so the site opens offline and installs to the home screen without a store.
- **No tracking.** No analytics scripts, no third party fonts at runtime, fonts are self hosted woff2 subsets.

## Deploy

```
wrangler pages deploy . --project-name genvidpro
```

Media (`videos/`, `media/`) is intentionally not committed: masters live outside the repository and are published separately.

## Contact

[genvidpro.com](https://genvidpro.com) · [LinkedIn](https://www.linkedin.com/in/genvidpro) · genvidpro@gmail.com
