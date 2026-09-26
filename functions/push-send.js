/* Sends one notification to everyone who allowed them. Guarded by the same
   key that already guards the stats endpoint, so nobody can push from outside.
     POST /push-send?key=<the stats key>   {"title":"...","body":"...","url":"/"}
   Dead subscriptions answer 404 or 410 and are dropped on the spot.

   The signing code is repeated here on purpose instead of being imported from
   push-test.js: every file in functions/ is a route of its own, and one route
   importing another is a good way to find out on deploy day that it is not. */

const VAPID_PUB = 'BHspUallzbuJ1vcdFmgVwKE5mL3oUwPJy8Nw2fpf3pj_ua0Vw2L5egow1_Yf340HYAgra5UzDkV5pgKx03TJ1Q0';
// The private half should live in the Pages secret VAPID_PK8; until that secret exists the
// key below is used. Once the secret is set, delete this constant (15.09.2026).
const VAPID_PK8 = 'MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg_KfMgLbS3GX6UBopv4IQ0YIgREzMH0ftBavN6EKcY4yhRANCAAR7KVGpZc27idb3HRZoFcChOZi96FMDycvDcNn6X96Y_7mtFcNi-XoKMNf2H9-NB2AIK2uVMw5FeaYCsdN0ydUN';
const VAPID_SUB = 'mailto:genvidpro@gmail.com';

function b64u(bytes) {
  let s = ''; const a = new Uint8Array(bytes);
  for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function unb64u(str) {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const bin = atob(s); const a = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return a;
}
async function authFor(endpoint, pk8) {
  const head = b64u(new TextEncoder().encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64u(new TextEncoder().encode(JSON.stringify({
    aud: new URL(endpoint).origin,
    exp: Math.floor(Date.now() / 1000) + 43200,
    sub: VAPID_SUB
  })));
  const key = await crypto.subtle.importKey('pkcs8', unb64u(pk8),
    { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key,
    new TextEncoder().encode(head + '.' + body));
  return 'vapid t=' + head + '.' + body + '.' + b64u(sig) + ', k=' + VAPID_PUB;
}
async function poke(endpoint, pk8) {
  return fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: await authFor(endpoint, pk8), TTL: '86400', Urgency: 'normal' }
  });
}

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  const given = url.searchParams.get('key') || request.headers.get('x-key');
  if (!env.STATS_KEY || given !== env.STATS_KEY) return new Response('nope', { status: 401 });
  if (!env.EVENTS) return new Response('no store', { status: 503 });
  const pk8 = String(env.VAPID_PK8 || VAPID_PK8).trim();
  if (!pk8) return new Response('no signing key', { status: 503 });

  let msg;
  try { msg = await request.json(); } catch (_) { return new Response('bad json', { status: 400 }); }
  if (!msg || !msg.title) return new Response('title required', { status: 400 });

  await env.EVENTS.put('pushmsg:latest', JSON.stringify({
    title: String(msg.title).slice(0, 80),
    body: String(msg.body || '').slice(0, 200),
    url: msg.url || '/',
    lang: msg.lang || 'he'
  }), { expirationTtl: 86400 });

  const list = await env.EVENTS.list({ prefix: 'push:' });
  let sent = 0, gone = 0, failed = 0;
  for (const k of list.keys) {
    let rec;
    try { rec = JSON.parse(await env.EVENTS.get(k.name)); } catch (_) { continue; }
    if (!rec || !rec.endpoint) continue;
    try {
      const r = await poke(rec.endpoint, pk8);
      if (r.status === 404 || r.status === 410) { await env.EVENTS.delete(k.name); gone++; }
      else if (r.status >= 200 && r.status < 300) sent++;
      else failed++;
    } catch (_) { failed++; }
  }
  return Response.json({ sent, gone, failed, total: list.keys.length });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (!env.STATS_KEY || url.searchParams.get('key') !== env.STATS_KEY) return new Response('nope', { status: 401 });
  const list = await env.EVENTS.list({ prefix: 'push:' });
  return Response.json({ subscribers: list.keys.length });
}
