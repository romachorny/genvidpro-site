/* GET /api/push/messages?token=… — what the bell in the app shows.
   28.09.2026.

   The token is handed to the browser once, when it subscribed, and kept in its
   own localStorage. Asking by name instead would let anyone who guesses "david"
   read David's messages, and guest names are on purpose easy to guess. */
const KEEP = 30;

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const token = (url.searchParams.get('token') || '').slice(0, 64);
  const NO = { headers: { 'cache-control': 'no-store' } };
  const empty = () => Response.json({ ok: true, messages: [] }, NO);
  if (!env.PUSHDB || !token) return empty();
  const who = await env.PUSHDB.prepare('SELECT name FROM tokens WHERE token = ?').bind(token).first();
  if (!who || !who.name) return empty();
  const rows = (await env.PUSHDB.prepare(
    'SELECT id, title, body, url, ts FROM msgs WHERE name = ? ORDER BY ts DESC LIMIT ?')
    .bind(who.name, KEEP).all()).results || [];
  return Response.json({ ok: true, name: who.name, messages: rows }, NO);
}
