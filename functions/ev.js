// Cloudflare Pages Function: /ev
// POST  {e:"event_name", m:{...}}  → stores one funnel event in KV (binding EVENTS), no cookies, no personal data.
// GET   /ev?key=STATS_KEY           → JSON summary for the last 30 days + recent Claudia chats. Read by Claude to tune the site.
// Setup in the Pages project: KV namespace bound as EVENTS; secret STATS_KEY (any long password).

const ALLOWED = new Set(['view','work_play','order_view','module_pick','brief_open','brief_done','send_mail','send_wa','ask_discount','paypal','claudia_open','claudia_msg','claudia_contact','three_screens']);

const EV_HOSTS = ['genvidpro.com', 'www.genvidpro.com'];
function evHostOf(u) { try { return new URL(u).hostname.toLowerCase(); } catch (e) { return ''; } }
function evOurs(request) {
  const h = evHostOf(request.headers.get('Origin') || '') || evHostOf(request.headers.get('Referer') || '');
  return !!h && (EV_HOSTS.indexOf(h) !== -1 || h === 'genvidpro.pages.dev' || h.endsWith('.genvidpro.pages.dev'));
}

export async function onRequestPost({ request, env }) {
  const h = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (!evOurs(request)) return new Response('{"ok":false}', { status: 403, headers: h });
  if (!env.EVENTS) return new Response(JSON.stringify({ ok: false, reason: 'no_kv' }), { status: 503, headers: h });
  let b; try { b = await request.json(); } catch (e) { return new Response('{"ok":false}', { status: 400, headers: h }); }
  const e = String(b.e || ''); if (!ALLOWED.has(e)) return new Response('{"ok":false}', { status: 400, headers: h });
  const t = Date.now();
  const rec = { e, t, s: String(b.s || '').slice(0, 24), m: typeof b.m === 'object' && b.m ? JSON.stringify(b.m).slice(0, 600) : '', ua: (request.headers.get('user-agent') || '').slice(0, 80), c: request.cf ? request.cf.country : '' };
  await env.EVENTS.put('ev:' + t + ':' + Math.random().toString(36).slice(2, 7), JSON.stringify(rec), { expirationTtl: 60 * 60 * 24 * 90 });
  return new Response('{"ok":true}', { headers: h });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  // Trimmed on both sides: a secret uploaded through a shell pipe can arrive with a
  // trailing newline, and an invisible character is a miserable thing to debug.
  const want = String(env.STATS_KEY || '').trim();
  const got = String(url.searchParams.get('key') || '').trim();
  if (!want || got !== want) return new Response('forbidden', { status: 403 });
  if (!env.EVENTS) return new Response('{"error":"no_kv"}', { status: 503 });
  const since = Date.now() - 30 * 24 * 3600 * 1000;
  const counts = {}, sessions = {}, chats = [];
  let cursor;
  do {
    const page = await env.EVENTS.list({ prefix: 'ev:', cursor, limit: 1000 });
    for (const k of page.keys) {
      const t = parseInt(k.name.split(':')[1], 10); if (t < since) continue;
      const v = await env.EVENTS.get(k.name); if (!v) continue;
      const r = JSON.parse(v);
      counts[r.e] = (counts[r.e] || 0) + 1;
      if (r.s) { sessions[r.s] = sessions[r.s] || new Set(); sessions[r.s].add(r.e); }
    }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  let cc;
  do {
    const page = await env.EVENTS.list({ prefix: 'chat:', cursor: cc, limit: 1000 });
    for (const k of page.keys) { const v = await env.EVENTS.get(k.name); if (v) chats.push(JSON.parse(v)); }
    cc = page.list_complete ? null : page.cursor;
  } while (cc);
  chats.sort((a, b) => b.t - a.t);
  // funnel: how many sessions reached each step
  const steps = ['view','order_view','module_pick','brief_open','brief_done','send_mail','send_wa','paypal'];
  const funnel = {}; steps.forEach(st => { funnel[st] = Object.values(sessions).filter(set => set.has(st)).length; });
  return new Response(JSON.stringify({ days: 30, events: counts, sessions: Object.keys(sessions).length, funnel, chats: chats.slice(0, 50) }, null, 1), { headers: { 'Content-Type': 'application/json' } });
}

export async function onRequestOptions() {
  return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}
