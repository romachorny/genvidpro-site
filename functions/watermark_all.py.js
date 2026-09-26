// The stamping script has to live in the site folder: it finds videos/ and media/
// from its own location (SITE = dirname(__file__)). Everything in that folder is
// uploaded and served, so /watermark_all.py was readable by anyone — the whole
// production recipe, plus the local paths inside it. Same trick as wrangler.toml:
// a redirect loses to a real file, a function does not.
export async function onRequest() {
  return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
}
