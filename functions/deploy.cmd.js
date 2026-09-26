// deploy.cmd must sit next to the site (it uses %~dp0), and Pages served it as a
// plain text file. Nothing secret inside, but the deploy command is not public
// business either. Closed the same way as wrangler.toml and watermark_all.py.
export async function onRequest() {
  return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
}
