// Python leaves __pycache__ next to watermark_all.py and Pages uploaded the .pyc
// with the site: the compiled source was downloadable. The folder comes back every
// time the script runs, so it is closed here rather than deleted by hand.
export async function onRequest() {
  return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain' } });
}
