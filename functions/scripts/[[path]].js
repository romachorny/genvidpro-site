// scripts/ holds the QA harness that is run from the laptop before and after a
// deploy. `wrangler pages deploy .` uploads the whole folder, so without this the
// harness would be served as a public file. Closed the same way as deploy.cmd.
export async function onRequest() {
  return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
}
