/* GET /api/push/messages?token=… — what the bell in the app shows.
   28.09.2026.

   The token is handed to the browser once, when it subscribed, and kept in its
   own localStorage. Asking by name instead would let anyone who guesses "david"
   read David's messages, and guest names are on purpose easy to guess. */
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const token = (url.searchParams.get('token') || '').slice(0, 64);
  const empty = Response.json({ ok: true, messages: [] }, { headers: { 'cache-control': 'no-store' } });
  if (!env.EVENTS || !token) return empty;
  let who = null;
  try { who = JSON.parse(await env.EVENTS.get('ptok:' + token)); } catch (_) {}
  if (!who || !who.name) return empty;
  let log = [];
  try { log = JSON.parse(await env.EVENTS.get('pmsg:' + who.name) || '[]'); } catch (_) {}
  return Response.json({ ok: true, name: who.name, messages: log },
    { headers: { 'cache-control': 'no-store' } });
}
