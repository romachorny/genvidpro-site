/* POST /api/push/subscribe — one browser signs up for messages from Roma.
   28.09.2026.

   The body is {endpoint, keys:{p256dh, auth}, name, platform}. The name is the
   `c` of the personal link (genvidpro.com/?c=david) or what the guest typed;
   several devices per name are normal, so the key carries both the name and a
   hash of the endpoint and a second phone never overwrites the first.

   The welcome notification is sent from right here, before the answer goes back:
   the guest has just taken their finger off the button and a notification that
   arrives a second later is the whole proof that this works. Sending it from the
   server instead would mean a round trip through a queue, and on the demo night
   a queue is a thing that can be down.

   A real encrypted payload (RFC 8188 aes128gcm + RFC 8291) is built here rather
   than waking the worker up empty: an empty push has to read the text from a
   shared "latest message" slot, and with more than one guest that slot is a race
   — David would get Anna's message. The whole dance is ~40 lines of WebCrypto and
   it is the only way each person gets their own words.

   The signing key comes from the Pages secret VAPID_PRIVATE and exists nowhere in
   this repository. */

const SUBJECT = 'mailto:genvidpro@gmail.com';
/* The public half of the VAPID pair — the same string push.js hands to the browser,
   public by definition. It is written here as well because a Pages plain_text
   variable set through the API did not survive into the deployment (28.09.2026:
   the welcome push quietly did not go out, and nothing said why). The private half
   is the secret VAPID_PRIVATE and is never in this repository. Rotating the pair
   means changing this line and push.js together. */
const PUB = 'BJ5IzzJPTq4l8pgQHaVIMjlCg11ANg7S6u3UbWcMxZQAKZOkad5WFD69HCLDrITAQvPnDJE-SxgzO3_m34xQAFk';
const MAX_DEVICES = 10;          // one name, ten phones — past that it is somebody scripting
const RATE_PER_MIN = 20;         // per IP
const WELCOME = { title: 'GenVidPro', body: "You're connected. Roma can now message you here." };

/* ---- bytes ---- */
const enc = new TextEncoder();
function unb64u(s) {
  s = String(s || '').replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s), a = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return a;
}
function b64u(bytes) {
  const a = new Uint8Array(bytes);
  let s = '';
  for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function cat() {
  let n = 0;
  for (const a of arguments) n += a.length;
  const out = new Uint8Array(n);
  let o = 0;
  for (const a of arguments) { out.set(a, o); o += a.length; }
  return out;
}
async function hmac(key, data) {
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', k, data));
}
async function hash12(s) {
  const d = await crypto.subtle.digest('SHA-256', enc.encode(s));
  return [...new Uint8Array(d)].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ---- VAPID: the JWT that tells the push service who is sending ---- */
async function vapidAuth(endpoint, pub, priv) {
  const p = unb64u(pub);
  const key = await crypto.subtle.importKey('jwk', {
    kty: 'EC', crv: 'P-256', ext: true,
    x: b64u(p.slice(1, 33)), y: b64u(p.slice(33, 65)), d: priv
  }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const head = b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64u(enc.encode(JSON.stringify({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 43200,
    sub: SUBJECT
  })));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(head + '.' + body));
  return 'vapid t=' + head + '.' + body + '.' + b64u(sig) + ', k=' + pub;
}

/* ---- the encrypted body itself ---- */
async function sealed(text, p256dh, auth) {
  const ua = unb64u(p256dh), secret = unb64u(auth);
  const pair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const mine = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  const theirs = await crypto.subtle.importKey('raw', ua, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: theirs }, pair.privateKey, 256));

  const ikm = await hmac(await hmac(secret, shared),
    cat(enc.encode('WebPush: info'), new Uint8Array([0]), ua, mine, new Uint8Array([1])));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(salt, ikm);
  const cek = (await hmac(prk, cat(enc.encode('Content-Encoding: aes128gcm'), new Uint8Array([0, 1])))).slice(0, 16);
  const nonce = (await hmac(prk, cat(enc.encode('Content-Encoding: nonce'), new Uint8Array([0, 1])))).slice(0, 12);

  const aes = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aes,
    cat(enc.encode(text), new Uint8Array([2]))));          // 0x02 = last record, RFC 8188
  return cat(salt, new Uint8Array([0, 0, 0x10, 0]), new Uint8Array([65]), mine, ct);
}

async function push(sub, payload, pub, priv) {
  const body = await sealed(JSON.stringify(payload), sub.p256dh, sub.auth);
  return fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      Authorization: await vapidAuth(sub.endpoint, pub, priv),
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      TTL: '86400',
      Urgency: 'high'
    },
    body
  });
}

/* ---- names ---- */
export function cleanName(raw) {
  const s = String(raw || '').trim().toLowerCase()
    .replace(/[^a-z0-9Ѐ-ӿ֐-ת_-]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 24);
  return s || 'guest';
}

export async function onRequestPost({ request, env }) {
  if (!env.PUSHDB) return Response.json({ ok: false, error: 'no store' }, { status: 503 });

  /* The speed bump stays in KV: a counter that is a little out of date only makes
     the limit looser, and it costs no row in the database a guest will never read. */
  if (env.EVENTS) {
    const ip = request.headers.get('cf-connecting-ip') || '0';
    const rk = 'prate:' + (await hash12(ip));
    const used = parseInt(await env.EVENTS.get(rk) || '0', 10) || 0;
    if (used >= RATE_PER_MIN) return Response.json({ ok: false, error: 'slow down' }, { status: 429 });
    await env.EVENTS.put(rk, String(used + 1), { expirationTtl: 60 });
  }

  let q;
  try { q = await request.json(); } catch (_) { return Response.json({ ok: false, error: 'bad json' }, { status: 400 }); }
  const endpoint = q && (q.endpoint || (q.subscription && q.subscription.endpoint));
  const keys = (q && (q.keys || (q.subscription && q.subscription.keys))) || {};
  if (!endpoint || !/^https:\/\/[^\s]+$/.test(endpoint) || endpoint.length > 1000)
    return Response.json({ ok: false, error: 'no endpoint' }, { status: 400 });
  if (!keys.p256dh || !keys.auth || unb64u(keys.p256dh).length !== 65 || unb64u(keys.auth).length !== 16)
    return Response.json({ ok: false, error: 'no keys' }, { status: 400 });

  const name = cleanName(q.name);
  const h = await hash12(endpoint);
  const rec = {
    endpoint, p256dh: keys.p256dh, auth: keys.auth, name,
    platform: String(q.platform || '').slice(0, 40),
    lang: String(q.lang || '').slice(0, 12),
    ua: (request.headers.get('user-agent') || '').slice(0, 160),
    ts: Date.now(), seen: Date.now()
  };

  const mine = await env.PUSHDB.prepare('SELECT COUNT(*) AS n FROM subs WHERE name = ? AND h <> ?')
    .bind(name, h).first();
  if (mine && mine.n >= MAX_DEVICES)
    return Response.json({ ok: false, error: 'too many devices' }, { status: 429 });

  const token = b64u(crypto.getRandomValues(new Uint8Array(18)));
  await env.PUSHDB.batch([
    env.PUSHDB.prepare(
      'INSERT INTO subs (h, name, endpoint, p256dh, auth, platform, lang, ua, ts, seen) ' +
      'VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?9) ' +
      'ON CONFLICT(h) DO UPDATE SET name=?2, p256dh=?4, auth=?5, platform=?6, lang=?7, ua=?8, seen=?9')
      .bind(h, name, endpoint, rec.p256dh, rec.auth, rec.platform, rec.lang, rec.ua, rec.ts),
    env.PUSHDB.prepare('INSERT OR REPLACE INTO tokens (token, name, h, ts) VALUES (?,?,?,?)')
      .bind(token, name, h, rec.ts)
  ]);

  /* The welcome message, then the same words into the in-app panel. */
  const msg = { id: 'w' + Date.now(), title: WELCOME.title, body: WELCOME.body, url: '/', ts: Date.now() };
  let delivered = false, status = 0, why = '';
  const pub = env.VAPID_PUBLIC || PUB, priv = env.VAPID_PRIVATE;
  if (!priv) why = 'no VAPID_PRIVATE bound to this deployment';
  else {
    try {
      const r = await push(rec, { title: msg.title, body: msg.body, url: '/', tag: 'gvp-welcome', id: msg.id }, pub, priv);
      status = r.status;
      delivered = r.status >= 200 && r.status < 300;
      if (!delivered) why = 'the push service answered ' + r.status + ' ' + (await r.text()).slice(0, 120);
      if (r.status === 404 || r.status === 410) await env.PUSHDB.prepare('DELETE FROM subs WHERE h = ?').bind(h).run();
    } catch (e) { status = 0; why = String((e && e.message) || e).slice(0, 160); }
  }
  try {
    await env.PUSHDB.prepare('INSERT INTO msgs (id, name, title, body, url, ts) VALUES (?,?,?,?,?,?)')
      .bind(msg.id, name, msg.title, msg.body, msg.url, msg.ts).run();
  } catch (_) {}

  /* Why a welcome did not go out is said out loud only to whoever holds PUSH_KEY —
     the server and nobody else. A guest gets ok/true and a notification, or ok/true
     and no notification, and either way never an error on their screen. */
  const answer = { ok: true, name, token, welcome: delivered, status };
  if (why && env.PUSH_KEY && request.headers.get('x-push-key') === env.PUSH_KEY) answer.why = why;
  return Response.json(answer, { headers: { 'cache-control': 'no-store' } });
}

export const onRequestGet = () => new Response('POST only', { status: 405 });
