/* Context hand-off for the WhatsApp agent.
   POST /api/ref  {source, service, services?, lang, answers{}, note?}  ->  {code}
   A visitor who already chose something (a template, a painting, an estimate) gets a
   6-character code. gvp-wa.js puts "ref CODE" into the WhatsApp text, and the agent on
   roma-server reads the context back with GET /api/ref/CODE and a key, so the client is
   never asked twice. Stored in the EVENTS KV under "ref:" for 30 days. */

const ALLOWED = [
  /^https:\/\/(www\.)?genvidpro\.com$/, /^https:\/\/app\.genvidpro\.com$/,
  /^https:\/\/[a-z0-9-]+\.genvidpro\.pages\.dev$/, /^https:\/\/[a-z0-9-]+\.gvpro\.pages\.dev$/,
  /^https:\/\/genvidpro\.pages\.dev$/, /^https:\/\/gvpro\.pages\.dev$/,
  /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/
];
const SOURCES = ['site', 'app', 'work', 'automation', 'living-paintings', 'builder', 'ask-chat', 'other'];
const ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const TTL = 30 * 24 * 3600;

function cors(origin) {
  const ok = origin && ALLOWED.some((re) => re.test(origin));
  return ok ? { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } : {};
}
function json(body, status, extra) {
  return new Response(JSON.stringify(body), { status: status || 200, headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, extra || {}) });
}
const str = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, n);

function clean(b) {
  const out = { v: 1 };
  out.source = SOURCES.includes(b.source) ? b.source : 'other';
  if (/^[a-z][a-z0-9_-]{1,30}$/.test(b.service || '')) out.service = b.service;
  if (Array.isArray(b.services)) out.services = b.services.filter((x) => /^[a-z][a-z0-9_-]{1,30}$/.test(x)).slice(0, 8);
  if (['he', 'en', 'ru', 'ar'].includes(b.lang)) out.lang = b.lang;
  const a = {};
  let n = 0;
  for (const [k, v] of Object.entries(b.answers || {})) {
    if (n >= 12 || !/^[a-z][a-z0-9_]{1,30}$/.test(k)) continue;
    const s = str(v, 200);
    if (s) { a[k] = s; n++; }
  }
  out.answers = a;
  if (b.note) out.note = str(b.note, 300);
  return out;
}

export async function onRequestOptions({ request }) {
  return new Response(null, { status: 204, headers: cors(request.headers.get('Origin')) });
}

export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('Origin');
  const h = cors(origin);
  if (origin && !h['Access-Control-Allow-Origin']) return json({ error: 'origin' }, 403);
  if (!env.EVENTS) return json({ error: 'store' }, 503, h);
  const raw = await request.text();
  if (raw.length > 4000) return json({ error: 'too large' }, 413, h);
  let b;
  try { b = JSON.parse(raw); } catch (e) { return json({ error: 'json' }, 400, h); }
  if (!b || typeof b !== 'object') return json({ error: 'json' }, 400, h);

  // 30 codes an hour per address is plenty for a person and useless for a flood.
  const ip = request.headers.get('CF-Connecting-IP') || 'x';
  const rk = 'rl:ref:' + ip + ':' + new Date().toISOString().slice(0, 13);
  const used = parseInt((await env.EVENTS.get(rk)) || '0', 10);
  if (used >= 30) return json({ error: 'rate' }, 429, h);
  await env.EVENTS.put(rk, String(used + 1), { expirationTtl: 3700 });

  const ctx = clean(b);
  ctx.created = new Date().toISOString();
  let code = '';
  for (let tries = 0; tries < 5; tries++) {
    const r = new Uint8Array(6);
    crypto.getRandomValues(r);
    code = Array.from(r, (x) => ABC[x % ABC.length]).join('');
    if (!(await env.EVENTS.get('ref:' + code))) break;
  }
  await env.EVENTS.put('ref:' + code, JSON.stringify(ctx), { expirationTtl: TTL });
  return json({ code, expires_days: 30 }, 200, h);
}

export async function onRequestGet() {
  return json({ error: 'use /api/ref/CODE with the key' }, 404);
}
