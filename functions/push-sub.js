/* Saves one browser's push subscription. Called by /push.js after the visitor
   allows notifications. The key is a hash of the endpoint, so re-subscribing
   from the same browser overwrites its own row instead of piling up. */

async function hash(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].slice(0, 12).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost({ request, env }) {
  if (!env.EVENTS) return new Response('no store', { status: 503 });
  let sub;
  try { sub = await request.json(); } catch (_) { return new Response('bad json', { status: 400 }); }
  const ep = sub && (sub.endpoint || (sub.subscription && sub.subscription.endpoint));
  if (!ep || !/^https:\/\//.test(ep)) return new Response('no endpoint', { status: 400 });
  const rec = {
    endpoint: ep,
    ts: Date.now(),
    lang: (sub.lang || '').slice(0, 12),
    tag: (sub.tag || '').slice(0, 40),
    ua: (request.headers.get('user-agent') || '').slice(0, 160)
  };
  await env.EVENTS.put('push:' + (await hash(ep)), JSON.stringify(rec));
  return Response.json({ ok: true });
}

export const onRequestGet = () => new Response('POST only', { status: 405 });
