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

## Add a page, or add words to the dictionary

`i18n.js` is served `no-cache`, but every page still asks for it as `i18n.js?v=N`. **Adding keys
to the dictionary means bumping that N on every page in the same commit** (`sed -i
's|i18n.js?v=17|i18n.js?v=18|' *.html`). Otherwise a browser or an edge holding the previous copy
keeps translating the old pages correctly and leaves the new one in English, which reads as "the
new page was never translated" and is the one failure that looks exactly like a missing
translation. 30.09.2026: reported against `/apps` on the day it shipped.

A new page also needs: `_headers` (`/name` and `/name.html`, `Cache-Control: no-cache`),
`sitemap.xml`, and the path in the `source` map of `gvp-wa.js` so the WhatsApp tag says where
the click came from.

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

## Личные уведомления (28.09.2026)

Гость открывает `https://genvidpro.com/?c=имя`, ставит сайт на домашний экран и жмёт
одну кнопку — дальше Рома пишет ему прямо на телефон из Телеграма.

| Что | Где |
|---|---|
| Карточка, подписка, панель «Messages» | `push.js` (грузится на каждой странице через `gv-chrome.js`) |
| Приём подписки + приветственный пуш | `functions/api/push/subscribe.js` |
| Дверь для сервера (список, подписки, чистка, журнал) | `functions/api/push/admin.js`, ключ `PUSH_KEY` |
| Что показывать в панели | `functions/api/push/messages.js`, по токену, не по имени |
| Показ уведомления и нажатие | `sw.js` |
| Хранилище | D1 `gvp-push`, схема `ops/push-schema.sql` |
| Отправка с сервера | `~/work/gvp-push/send.js` (Node + web-push), обёртка `~/bin/gvp-push.sh` |
| Команды в Телеграме | `~/work/tg-hook/app.py`: `/push list`, `/push <имя> <текст>`, `/push all <текст>` |
| Ключи | `~/.secrets/vapid.env` (600) и секреты Pages `VAPID_PRIVATE`, `PUSH_KEY` |

Чего не видно из кода:
- **D1, а не KV.** Сначала было KV, и список подписчиков отставал на 8–30 секунд
  (замерено 28.09.2026). Гость нажимает кнопку, Рома тут же шлёт ему сообщение —
  и бот полминуим отвечал «никого с таким именем нет». D1 читает то, что только что записал.
- **Тело пуша шифруется по-настоящему** (RFC 8291, aes128gcm) — и в воркере, и на сервере.
  Пустой пуш с чтением «последнего сообщения» из общего места, как было раньше, при двух
  гостях отдал бы Давиду письмо Анны.
- **Приветствие шлёт сам воркер**, не сервер: палец ещё на экране, а уведомление уже пришло.
- **Публичный ключ VAPID написан в двух местах** — `push.js` и `subscribe.js`. Меняются вместе.
  Переменная Pages типа `plain_text`, заведённая через API, до деплоя не доехала.
- **Проверка без телефона:** ни headless Chrome, ни headless Firefox на сервере не умеют
  подписаться на пуш («Registration failed - permission denied»). Настоящая проверка —
  канал в autopush Mozilla, поднятый из Node по вебсокету: это честный push service,
  который проверяет подпись VAPID и отдаёт тело обратно. Стенды: `~/work/tmp/pushtest`.
- **Локальный запуск — только по https** (`ops/push-dev.sh`): у сайта в CSP стоит
  `upgrade-insecure-requests`, и по http сервис-воркер не устанавливается вовсе.
