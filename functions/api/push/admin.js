/* /api/push/admin — the only door roma-server uses. Guarded by the Pages secret
   PUSH_KEY, which lives in ~/.secrets/vapid.env on the server and nowhere else.
   28.09.2026.

   Sending itself happens on the server with Node web-push, not here: the bot has
   to report "delivered" or "failed" per device, and one place holding the signing
   key and the retry logic is easier to trust than two. This endpoint is the store:
     GET  ?key=&op=list              -> names, device count, last seen
     GET  ?key=&op=subs[&name=]      -> the subscriptions themselves, to send to
     POST ?key=&op=prune  {gone:[endpoint,...]}     -> drop what answered 404/410
     POST ?key=&op=log    {name, title, body, url}  -> keep the sent message so the
                                                       app can show it in Messages

   Everything answers no-store: a cached list of subscribers would have the bot
   pushing to a phone that unsubscribed this morning. */

async function hash12(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('');
}
const NO = { headers: { 'cache-control': 'no-store' } };
function guarded(request, env) {
  const url = new URL(request.url);
  const given = url.searchParams.get('key') || request.headers.get('x-push-key') || '';
  /* Length first, then a constant-ish compare: a wrong key must not be told
     how wrong it is. */
  if (!env.PUSH_KEY || given.length !== env.PUSH_KEY.length) return null;
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ env.PUSH_KEY.charCodeAt(i);
  return diff === 0 ? url : null;
}

async function allKeys(env) {
  const out = [];
  let cursor;
  do {
    const page = await env.EVENTS.list({ prefix: 'psub:', cursor });
    for (const k of page.keys) out.push(k.name);
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  return out;
}

async function everySub(env, name) {
  const prefix = 'psub:' + (name ? name + ':' : '');
  const out = [];
  let cursor;
  do {
    const page = await env.EVENTS.list({ prefix, cursor });
    for (const k of page.keys) {
      let rec = null;
      try { rec = JSON.parse(await env.EVENTS.get(k.name)); } catch (_) {}
      if (rec && rec.endpoint) out.push(Object.assign({ key: k.name }, rec));
    }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  return out;
}

export async function onRequestGet({ request, env }) {
  const url = guarded(request, env);
  if (!url) return new Response('nope', { status: 401 });
  if (!env.EVENTS) return Response.json({ ok: false, error: 'no store' }, { status: 503 });
  const op = url.searchParams.get('op') || 'list';
  const name = (url.searchParams.get('name') || '').toLowerCase() || null;

  if (op === 'list') {
    const by = {};
    for (const s of await everySub(env, name)) {
      const b = by[s.name] || (by[s.name] = { name: s.name, devices: 0, last: 0, platforms: [] });
      b.devices++;
      b.last = Math.max(b.last, s.seen || s.ts || 0);
      if (s.platform && b.platforms.indexOf(s.platform) < 0) b.platforms.push(s.platform);
    }
    const names = Object.values(by).sort((a, b) => b.last - a.last);
    return Response.json({ ok: true, names, total: names.reduce((n, x) => n + x.devices, 0) }, NO);
  }

  if (op === 'subs') {
    const subs = (await everySub(env, name)).map(s => ({
      name: s.name, endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth },
      platform: s.platform || '', ts: s.ts || 0
    }));
    return Response.json({ ok: true, subs }, NO);
  }

  if (op === 'messages') {
    let log = [];
    try { log = JSON.parse(await env.EVENTS.get('pmsg:' + name) || '[]'); } catch (_) {}
    return Response.json({ ok: true, name, messages: log }, NO);
  }

  return Response.json({ ok: false, error: 'unknown op' }, { status: 400 });
}

export async function onRequestPost({ request, env }) {
  const url = guarded(request, env);
  if (!url) return new Response('nope', { status: 401 });
  if (!env.EVENTS) return Response.json({ ok: false, error: 'no store' }, { status: 503 });
  const op = url.searchParams.get('op') || '';
  let q = {};
  try { q = await request.json(); } catch (_) {}

  if (op === 'prune') {
    const gone = Array.isArray(q.gone) ? q.gone.slice(0, 200) : [];
    const want = new Set(await Promise.all(gone.map(ep => hash12(String(ep)))));
    let dropped = 0;
    for (const k of await allKeys(env)) {
      if (want.has(k.split(':').pop())) { await env.EVENTS.delete(k); dropped++; }
    }
    return Response.json({ ok: true, dropped }, NO);
  }

  if (op === 'seen') {
    /* One device answered the push service happily — remember when, so /push list
       can say how fresh a phone is. */
    const eps = Array.isArray(q.alive) ? q.alive.slice(0, 200) : [];
    const want = new Set(await Promise.all(eps.map(ep => hash12(String(ep)))));
    let marked = 0;
    for (const k of await allKeys(env)) {
      if (!want.has(k.split(':').pop())) continue;
      try {
        const rec = JSON.parse(await env.EVENTS.get(k));
        rec.seen = Date.now();
        await env.EVENTS.put(k, JSON.stringify(rec));
        marked++;
      } catch (_) {}
    }
    return Response.json({ ok: true, marked }, NO);
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
    let log = [];
    try { log = JSON.parse(await env.EVENTS.get('pmsg:' + name) || '[]'); } catch (_) {}
    log.unshift(msg);
    await env.EVENTS.put('pmsg:' + name, JSON.stringify(log.slice(0, 30)));
    return Response.json({ ok: true, id: msg.id }, NO);
  }

  return Response.json({ ok: false, error: 'unknown op' }, { status: 400 });
}
