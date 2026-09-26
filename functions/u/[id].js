/* Hands back a picture a client attached to a Living Paintings request.
   The link in the order letter points here, so the file opens on genvidpro.com
   and nowhere else. Sixty days after the upload KV drops it and this returns 404. */

export async function onRequestGet({ params, env }) {
  const id = String((params && params.id) || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 60);
  if (!id || !env || !env.EVENTS) return new Response('Not found', { status: 404 });

  const got = await env.EVENTS.getWithMetadata('up:' + id, { type: 'arrayBuffer' });
  if (!got || !got.value) {
    return new Response('This file has expired. Ask the client to send it again.', {
      status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
  const m = got.metadata || {};
  return new Response(got.value, {
    headers: {
      'Content-Type': m.type || 'application/octet-stream',
      'Content-Disposition': 'inline; filename="' + (m.name || 'upload') + '"',
      'Cache-Control': 'private, max-age=600',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
