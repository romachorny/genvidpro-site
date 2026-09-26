# How genvidpro.com is published

Owner of this document: roma-server. It is the spec the server works from; the claude.ai
pages about the system are showcases, never the source.

## Where the truth lives

| What | Source of truth | Mirrors |
|---|---|---|
| Site code, pages, images, fonts, `functions/`, `_headers`, `wrangler.toml` | the working tree on roma-server (`~/genvidpro-site`) | GitHub `romachorny/genvidpro-site` (history), laptop `Downloads\genvidpro-site`, Drive backup |
| Videos (`*.mp4`) | the same working tree on roma-server | listed with checksums in `ops/media.sha256`; not in git |
| Services, delivery times, prices | `services.json` in this tree, one file | the WhatsApp agent and the order builder read it from `https://genvidpro.com/services.json`; the server's `registry/services.json` is a symlink to this file, never a copy |
| Cloudflare deploy key | `~/.secrets/cloudflare.env` on roma-server, chmod 600 | nowhere else |

The laptop does not deploy. `deploy.cmd` there now only prints where deploys moved.

## Change a price, a delivery time or a page

```
cd ~/genvidpro-site
# edit services.json (bump "version" and "updated") or any page
ops/deploy.sh "what changed, in one line"
```

`ops/deploy.sh` does all of it and stops loudly on the first problem:

1. Guards: this is the site root, `services.json` parses (and matches `services.schema.json`
   when `jsonschema` is installed), every video in `ops/media.sha256` is present and intact,
   the key file exists with mode 600.
2. Commits the tree.
3. Copies the exact publish set (tracked files plus the listed videos, minus `ops/`,
   `README.md`, `.gitignore`) into a temporary build dir. That dir holds `functions/` and
   `wrangler.toml` at its root, so the functions bundle always ships.
4. `wrangler pages deploy` from that root to the project's production branch (read from the
   Cloudflare API, never assumed). The token reaches wrangler through the environment only.
5. Live checks: `services.json` on genvidpro.com shows the new version; `POST /chat` and
   `POST /ev` answer anything but 405; the home page answers 200.
6. Pushes the commit to GitHub.

## Restore the videos

`ops/fetch-media.sh` pulls every missing or damaged video from the live site and verifies it
against `ops/media.sha256`. `--check` only verifies.

## Key file

`~/.secrets/cloudflare.env`, mode 600, two lines:

```
CLOUDFLARE_ACCOUNT_ID=b6b6c48819b1a30aa52c162e260a39c9
CLOUDFLARE_API_TOKEN=<token>
```

Token scope: Account → Cloudflare Pages → Edit, on this one account. Nothing else.

## Guard functions

Everything in the publish set is served. Files that must not be readable (`/wrangler.toml`,
`/deploy.cmd`, `/deploy-log.txt`, `/watermark_all.py`, `/scripts/*`, `/__pycache__/*`) are
closed by one-line functions in `functions/` that answer 404. A new private file in the root
needs either such a function or an exclusion in step 3 of `ops/deploy.sh`.
