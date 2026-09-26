/* A picture the client sends with the order.
   The form service on our plan refuses attachments (checked 10.09.2026: "Pro
   feature"), so the file is kept on our own side and the letter carries a link
   to it on genvidpro.com. The store is the KV namespace already bound to the
   project; sixty days is long enough for a job to start and short enough that
   nothing piles up for ever. */

const MAX = 25 * 1024 * 1024;
const TTL = 60 * 60 * 24 * 60;
const DAY_CAP = 12;                 /* uploads per address per day */

const json = (d, s) => new Response(JSON.stringify(d), {
  status: s || 200, headers: { 'Content-Type': 'application/json; charset=utf-8' }
});

export async function onRequestPost({ request, env }) {
  if (!env || !env.EVENTS) return json({ error: 'store' }, 500);
  let form;
  try { form = await request.formData(); } catch (e) { return json({ error: 'form' }, 400); }
  const f = form.get('file');
  if (!f || typeof f === 'string') return json({ error: 'nofile' }, 400);
  if (!/^image\/(jpeg|jpg|png)$/i.test(f.type || '')) return json({ error: 'type' }, 415);
  if (f.size > MAX) return json({ error: 'size' }, 413);

  const ip = request.headers.get('cf-connecting-ip') || 'anon';
  const ck = 'upc:' + new Date().toISOString().slice(0, 10) + ':' + ip;
  const used = parseInt((await env.EVENTS.get(ck)) || '0', 10);
  if (used >= DAY_CAP) return json({ error: 'cap' }, 429);

  const id = (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, '').slice(0, 40);
  const name = String(f.name || 'upload').replace(/[^\w.\- ]+/g, '_').slice(0, 90);
  const buf = await f.arrayBuffer();
  await env.EVENTS.put('up:' + id, buf, {
    expirationTtl: TTL,
    metadata: { name: name, type: f.type, size: f.size, at: new Date().toISOString() }
  });
  await env.EVENTS.put(ck, String(used + 1), { expirationTtl: 60 * 60 * 48 });

  return json({ ok: true, url: '/u/' + id, name: name, size: f.size });
}

export async function onRequestGet() {
  return new Response('Method not allowed', { status: 405 });
}
