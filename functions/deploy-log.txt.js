// deploy.cmd writes deploy-log.txt next to the site, and Pages served it as a plain file
// (found by the 23.09.2026 review). Closed the same way as deploy.cmd and wrangler.toml.
export async function onRequest() {
  return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
}
