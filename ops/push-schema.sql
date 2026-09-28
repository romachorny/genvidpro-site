-- The store behind the personal notifications. 28.09.2026.
--
-- D1 and not KV, and the reason is worth writing down: KV was tried first and the
-- list of subscribers took 8 seconds to catch up in one place and 30 in another
-- (measured on this project, 28.09.2026). The guest taps "Turn on messages" and
-- Roma sends them one straight away — with KV the bot answers "nobody called david
-- is subscribed" for the first half minute, which on a demo reads as broken.
-- D1 reads what was just written.
--
--   wrangler d1 execute gvp-push --remote --file ops/push-schema.sql
--   wrangler d1 execute gvp-push --local  --file ops/push-schema.sql   (for pages dev)

CREATE TABLE IF NOT EXISTS subs (
  h        TEXT PRIMARY KEY,              -- first 12 bytes of sha256(endpoint)
  name     TEXT NOT NULL,                 -- the c of the personal link, lower case
  endpoint TEXT NOT NULL,
  p256dh   TEXT NOT NULL,
  auth     TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT '',
  lang     TEXT NOT NULL DEFAULT '',
  ua       TEXT NOT NULL DEFAULT '',
  ts       INTEGER NOT NULL,              -- when this device signed up
  seen     INTEGER NOT NULL               -- when the push service last took a message for it
);
CREATE INDEX IF NOT EXISTS subs_name ON subs(name);

-- One token per browser, handed back on subscribe and kept in its own localStorage.
-- The Messages panel reads by token, never by name: guest names are meant to be easy
-- to guess, so a name must not be enough to read somebody's messages.
CREATE TABLE IF NOT EXISTS tokens (
  token TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  h     TEXT NOT NULL,
  ts    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS msgs (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  title TEXT NOT NULL,
  body  TEXT NOT NULL,
  url   TEXT NOT NULL DEFAULT '/',
  ts    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS msgs_name_ts ON msgs(name, ts);
