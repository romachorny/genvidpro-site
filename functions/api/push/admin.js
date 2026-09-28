/* /api/push/admin — the only door roma-server uses. Guarded by the Pages secret
   PUSH_KEY, which lives in ~/.secrets/vapid.env on the server and nowhere else.
   28.09.2026.

   Sending itself happens on the server with Node web-push, not here: the bot has
   to report "delivered" or "failed" per device, and one place holding the signing
   key and the retry logic is easier to trust than two. This endpoint is the store:
     GET  ?key=&op=list[&name=]       -> names, device count, last seen
     GET  ?key=&op=subs[&name=]       -> the subscriptions themselves, to send to
     GET  ?key=&op=messages&name=     -> what was sent to that name
     POST ?key=&op=prune  {gone:[endpoint,…]}       -> drop what answered 404/410
     POST ?key=&op=seen   {alive:[endpoint,…]}      -> mark a device as still there
     POST ?key=&op=log    {name,title,body,url}     -> keep the sent message so the
                                                       app can show it in Messages

   Everything answers no-store: a cached list of subscribers would have the bot
   pushing to a phone that unsubscribed this morning. */

const KEEP_MSGS = 30;             // per name; the panel shows a short history, not an archive
const NO = { headers: { 'cache-control': 'no-store' } };

async function hash12(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('');
}

function guarded(request, env) {
  const url = new URL(request.url);
  const given = url.searchParams.get('key') || request.headers.get('x-push-key') || '';
  /* Length first, then a compare that does not stop at the first wrong letter. */
  if (!env.PUSH_KEY || given.length !== env.PUSH_KEY.length) return null;
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ env.PUSH_KEY.charCodeAt(i);
  return diff === 0 ? url : null;
}

/* SQLite has no array parameter: the placeholders are built from the count, and the
   values still go in bound, never pasted into the text. */
function holes(n) { return new Array(n).fill('?').join(','); }

export async function onRequestGet({ request, env }) {
  const url = guarded(request, env);
  if (!url) return new Response('nope', { status: 401 });
  if (!env.PUSHDB) return Response.json({ ok: false, error: 'no store' }, { status: 503 });
  const op = url.searchParams.get('op') || 'list';
  const name = (url.searchParams.get('name') || '').toLowerCase() || null;

  if (op === 'list') {
    const q = name
      ? env.PUSHDB.prepare('SELECT name, COUNT(*) AS devices, MAX(seen) AS last, ' +
          'GROUP_CONCAT(DISTINCT platform) AS platforms FROM subs WHERE name = ? GROUP BY name').bind(name)
      : env.PUSHDB.prepare('SELECT name, COUNT(*) AS devices, MAX(seen) AS last, ' +
          'GROUP_CONCAT(DISTINCT platform) AS platforms FROM subs GROUP BY name ORDER BY last DESC');
    const rows = (await q.all()).results || [];
    const names = rows.map(r => ({
      name: r.name, devices: r.devices, last: r.last || 0,
      platforms: String(r.platforms || '').split(',').filter(Boolean)
    }));
    return Response.json({ ok: true, names, total: names.reduce((n, x) => n + x.devices, 0) }, NO);
  }

  if (op === 'subs') {
    const q = name
      ? env.PUSHDB.prepare('SELECT * FROM subs WHERE name = ? ORDER BY ts').bind(name)
      : env.PUSHDB.prepare('SELECT * FROM subs ORDER BY name, ts');
    const rows = (await q.all()).results || [];
    return Response.json({
      ok: true,
      subs: rows.map(r => ({
        name: r.name, endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth },
        platform: r.platform || '', ts: r.ts
      }))
    }, NO);
  }

  if (op === 'messages') {
    if (!name) return Response.json({ ok: false, error: 'no name' }, { status: 400 });
    const rows = (await env.PUSHDB.prepare(
      'SELECT id, title, body, url, ts FROM msgs WHERE name = ? ORDER BY ts DESC LIMIT ?')
      .bind(name, KEEP_MSGS).all()).results || [];
    return Response.json({ ok: true, name, messages: rows }, NO);
  }

  return Response.json({ ok: false, error: 'unknown op' }, { status: 400 });
}

export async function onRequestPost({ request, env }) {
  const url = guarded(request, env);
  if (!url) return new Response('nope', { status: 401 });
  if (!env.PUSHDB) return Response.json({ ok: false, error: 'no store' }, { status: 503 });
  const op = url.searchParams.get('op') || '';
  let q = {};
  try { q = await request.json(); } catch (_) {}

  if (op === 'prune' || op === 'seen') {
    const list = Array.isArray(op === 'prune' ? q.gone : q.alive) ? (op === 'prune' ? q.gone : q.alive).slice(0, 200) : [];
    if (!list.length) return Response.json({ ok: true, dropped: 0, marked: 0 }, NO);
    const hs = await Promise.all(list.map(ep => hash12(String(ep))));
    const r = op === 'prune'
      ? await env.PUSHDB.prepare('DELETE FROM subs WHERE h IN (' + holes(hs.length) + ')').bind(...hs).run()
      : await env.PUSHDB.prepare('UPDATE subs SET seen = ? WHERE h IN (' + holes(hs.length) + ')')
          .bind(Date.now(), ...hs).run();
    const n = (r.meta && r.meta.changes) || 0;
    return Response.json(op === 'prune' ? { ok: true, dropped: n } : { ok: true, marked: n }, NO);
  }

  if (op === 'log') {
    const name = String(q.name || '').toLowerCase().slice(0, 24);
    if (!name) return Response.json({ ok: false, error: 'no name' }, { status: 400 });
    const msg = {
      id: 'm' + Date.now() + Math.random().toString(36).slice(2, 6),
      title: String(q.title || 'GenVidPro').slice(0, 80),
      body: String(q.body || '').slice(0, 400),
      url: String(q.url || '/').slice(0, 300),
      ts: Date.now()
    };
    await env.PUSHDB.batch([
      env.PUSHDB.prepare('INSERT INTO msgs (id, name, title, body, url, ts) VALUES (?,?,?,?,?,?)')
        .bind(msg.id, name, msg.title, msg.body, msg.url, msg.ts),
      env.PUSHDB.prepare('DELETE FROM msgs WHERE name = ?1 AND id NOT IN ' +
        '(SELECT id FROM msgs WHERE name = ?1 ORDER BY ts DESC LIMIT ?2)').bind(name, KEEP_MSGS)
    ]);
    return Response.json({ ok: true, id: msg.id }, NO);
  }

  return Response.json({ ok: false, error: 'unknown op' }, { status: 400 });
}
