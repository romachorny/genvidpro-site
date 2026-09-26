/* The text of the last notification. The service worker is woken up with an
   empty push and reads it from here. No cache: a stale answer would show the
   previous message. */
export async function onRequestGet({ env }) {
  let msg = null;
  if (env.EVENTS) { try { msg = JSON.parse(await env.EVENTS.get('pushmsg:latest')); } catch (_) {} }
  return new Response(JSON.stringify(msg || { title: 'GenVidPro', body: '', url: '/' }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
  });
}
