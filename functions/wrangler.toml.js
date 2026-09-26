// The deploy config has to sit in the project root (Pages refuses --config anywhere
// else, and a deploy from another folder ships without this functions bundle), and
// everything in that folder is uploaded and served: /wrangler.toml was readable.
// _redirects loses to a real file, a function does not.
export async function onRequest() {
  return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
}
