/* Sends one notification back to the browser that asked for it. Used by the
   button on the site, so the thing can be proved to work without any key and
   without touching anybody else's phone. Only an endpoint already saved in the
   store is accepted, otherwise this would be a free relay for strangers. */

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
export async function poke(endpoint, pk8) {
  return fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: await authFor(endpoint, pk8), TTL: '3600', Urgency: 'high' }
  });
}
async function hash(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost({ request, env }) {
  if (!env.EVENTS) return new Response('no store', { status: 503 });
  const pk8 = String(env.VAPID_PK8 || VAPID_PK8).trim();
  if (!pk8) return new Response('no signing key', { status: 503 });
  let q;
  try { q = await request.json(); } catch (_) { return new Response('bad json', { status: 400 }); }
  const ep = q && q.endpoint;
  if (!ep) return new Response('no endpoint', { status: 400 });
  const known = await env.EVENTS.get('push:' + (await hash(ep)));
  if (!known) return new Response('unknown endpoint', { status: 403 });

  await env.EVENTS.put('pushmsg:latest', JSON.stringify({
    title: q.title || 'מספרת רגע',
    body: q.body || 'מחר יש מקום ב-16:30. רוצה?',
    url: q.url || '/',
    lang: q.lang || 'he'
  }), { expirationTtl: 86400 });

  const r = await poke(ep, pk8);
  return Response.json({ ok: r.status >= 200 && r.status < 300, status: r.status, detail: (await r.text()).slice(0, 200) });
}
