/* GET /api/ref/CODE with header X-GVP-Key -> {ok, code, ctx}
   Read side of the context hand-off, used only by the WhatsApp agent on roma-server.
   The key itself lives in ~/.secrets on the server and in an n8n credential; here we keep
   only its SHA-256, so nothing secret is in this file or in the Pages settings.
   env.REF_KEY_SHA256 overrides the built-in hash if it is ever rotated from the dashboard. */

const KEY_SHA256 = '9465d5e0a9394ae41863998591bb1ebe1b24a6fb084193067803a69e622146f4';

function json(body, status) {
  return new Response(JSON.stringify(body), { status: status || 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
}
async function sha256hex(s) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, '0')).join('');
}
function same(a, b) {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

export async function onRequestGet({ request, params, env }) {
  const given = String(request.headers.get('X-GVP-Key') || '').trim();
  const want = String((env && env.REF_KEY_SHA256) || KEY_SHA256).trim().toLowerCase();
  if (!given || !same(await sha256hex(given), want)) return json({ ok: false, error: 'key' }, 401);
  const code = String((params && params.code) || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  if (code.length !== 6 || !env.EVENTS) return json({ ok: false, error: 'not found' }, 404);
  const raw = await env.EVENTS.get('ref:' + code);
  if (!raw) return json({ ok: false, code, error: 'not found or expired' }, 404);
  let ctx = null;
  try { ctx = JSON.parse(raw); } catch (e) { return json({ ok: false, code, error: 'broken' }, 500); }
  return json({ ok: true, code, ctx });
}

export async function onRequestPost() { return json({ ok: false, error: 'method' }, 405); }
