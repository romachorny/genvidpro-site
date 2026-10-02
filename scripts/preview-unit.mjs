// scripts/preview-unit.mjs — the site checker's pure logic, one test per bug it has had.
//
//   node scripts/preview-unit.mjs
//
// No network, no browser, under a second. This is the layer that can be checked without
// deploying; the other two are ops/checker-regress.sh (eight real sites, against the live
// function) and scripts/regress.mjs (the pages in a real Chrome). All three run after a
// deploy, and this one runs before it.
//
// Why the file copy below: Cloudflare runs functions/ as ES modules, but there is no
// package.json in this tree saying "type": "module", so Node reads a .js as CommonJS and
// the import fails. Copying to a .mjs is the whole trick — the source is not touched.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'gvp-unit-')), 'preview.mjs');
fs.copyFileSync(path.join(ROOT, 'functions/preview.js'), tmp);
const P = await import(pathToFileURL(tmp).href);

let pass = 0, fail = 0;
function is(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) { pass++; console.log('PASS  ' + name); }
  else { fail++; console.log('FAIL  ' + name + '\n        got  ' + JSON.stringify(got) + '\n        want ' + JSON.stringify(want)); }
}
function truthy(name, got) { is(name, !!got, true); }
function falsy(name, got) { is(name, !!got, false); }

/* ---- 1. the title was escaped twice -------------------------------------------------
   "GenVidPro &amp; Video Studio" reached the screen as "GenVidPro &amp;amp; Video Studio":
   a title arrives as HTML, so it is decoded once here and escaped once where it is drawn. */
is('title: &amp; decodes to one ampersand',
  P.titleOf('<title>GenVidPro &amp; Video Studio</title>'), 'GenVidPro & Video Studio');
is('title: &mdash; and &#8212; both decode',
  P.titleOf('<title>A &mdash; B &#8212; C</title>'), 'A — B — C');
is('title: a double-escaped source decodes only one step, never to a tag',
  P.titleOf('<title>&amp;lt;script&amp;gt;</title>'), '&lt;script&gt;');
is('title: an unknown entity is left exactly as it stands',
  P.unentity('a &notanentity; b'), 'a &notanentity; b');
is('title: a bare ampersand is left alone', P.unentity('Rock & Roll'), 'Rock & Roll');
is('title: hex and decimal numeric entities',
  P.unentity('&#x5d0;&#1488;'), 'אא');
is('title: a surrogate half is refused rather than turned into a broken character',
  P.unentity('&#xD800;'), '&#xD800;');
is('title: Hebrew around an entity survives, the entity is atomic',
  P.titleOf('<title>עיצוב &amp; וידאו</title>'),
  'עיצוב & וידאו');
is('title: whitespace collapses, no title is an empty string', P.titleOf('<p>no title</p>'), '');

/* ---- 6. a firewall's refusal is not a verdict ---------------------------------------
   musach-victor.co.il answers the check with F5's "The requested URL was rejected", and
   reading that page as the site told a working business it had no Hebrew and no phone. */
truthy('blocked: F5 "The requested URL was rejected"',
  P.blockedHtml('<html><title>Request Rejected</title><body>The requested URL was rejected. Please consult with your administrator.</body></html>', 200));
truthy('blocked: Cloudflare "Just a moment..."',
  P.blockedHtml('<html><title>Just a moment...</title><body>Checking your browser before accessing.</body></html>', 503));
truthy('blocked: "Attention Required" / Imperva / Sucuri',
  P.blockedHtml('<html><title>Attention Required!</title><body>incapsula incident</body></html>', 403));
truthy('blocked: a bare 403 with almost no text and no links',
  P.blockedHtml('<html><body><h1>Forbidden</h1></body></html>', 403));
falsy('blocked: a real site is never called blocked',
  P.blockedHtml('<html><title>מוסך ויקטור</title><body>' +
    '<a href="tel:0501234567">התקשר</a><a href="/about">אודות</a>' +
    '<a href="/x">x</a><p>' + 'ברוכים הבאים '.repeat(60) + '</p></body></html>', 200));
falsy('blocked: a 200 page that merely says "access denied" inside an article is not judged on status',
  P.blockedHtml('<html><title>Blog</title><body>' + '<a href="/a">a</a>'.repeat(9) +
    '<p>' + 'ordinary words here '.repeat(90) + '</p></body></html>', 200));

/* ---- the request count -------------------------------------------------------------
   The chip reads "N requests on first open", so it has to be requests. It used to be
   `<script` plus `<link` counted as tags: genvidpro.com's 23 inline scripts and its
   preconnect and canonical links came to 41, and our own clean site got a red chip in
   its own checker. */
is('requests: inline script asks the network for nothing',
  P.requestCount('<script>var a=1</script><script>var b=2</script>', 0), 0);
is('requests: a script with a src is one', P.requestCount('<script src="/a.js"></script>', 0), 1);
is('requests: preconnect, dns-prefetch and canonical fetch nothing',
  P.requestCount('<link rel=preconnect href=x><link rel=dns-prefetch href=y><link rel=canonical href=z>', 0), 0);
is('requests: stylesheet, manifest, icon and preload do fetch',
  P.requestCount('<link rel=stylesheet href=a><link rel=manifest href=b><link rel=icon href=c><link rel=preload href=d>', 0), 4);
is('requests: a link with no rel at all', P.requestCount('<link href=a>', 0), 0);
is('requests: images are requests', P.requestCount('', 7), 7);
is('requests: quoted, unquoted and multi-value rel all read',
  P.requestCount("<link rel='stylesheet' href=a><link rel=stylesheet href=b><link rel=\"icon stylesheet\" href=c>", 0), 3);
{
  // The real page, which is what the false chip was about.
  const h = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const imgs = (h.match(/<img\b[^>]*>/gi) || []).length;
  const n = P.requestCount(h, imgs);
  const tags = (h.match(/<script\b/gi) || []).length + (h.match(/<link\b/gi) || []).length;
  is('requests: our own home page is under the 40 that turns the chip red (was ' + tags + ' by tag count)',
    n <= 40, true);
}

/* ---- the page weight is what the visitor downloads ----------------------------------
   creativity32.com was shown a red "837 KB of html". The visitor downloads 154 KB: the
   site is served compressed, as almost every site is, and this measured the decompressed
   source and charged the visitor for it. It also ranked backwards — busi.co.il, the poor
   site in the set, decompresses to 625 KB and stayed under the old 700 line. */
{
  const filler = '<p>' + 'the quick brown fox jumps over the lazy dog '.repeat(20000) + '</p>';
  const kb = await P.transferKb(filler);
  const raw = Math.round(new TextEncoder().encode(filler).length / 1024);
  is('weight: repetitive HTML is measured compressed, far under its source length', kb < raw / 5, true);
  is('weight: and it is not zero', kb > 0, true);

  // the real page, and the real number the chip now shows for it
  const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const homeKb = await P.transferKb(home);
  is('weight: our own home page is under the 250 that turns the chip red', homeKb <= 250, true);
  // measured with curl on 29.09.2026: creativity32 154 KB on the wire, busi 115, genvidpro 93
  is('weight: our own page lands near the 93 KB curl measured, not the 306 KB of source',
    homeKb > 60 && homeKb < 140, true);
}

/* ---- the chips are scored in one place ----------------------------------------------
   02.10.2026: app.genvidpro.com kept its own copy of this scoring. The copy still asked
   for `reqs` and `kb`, which the browser road does not produce, so the day the builder
   started getting real answers it printed "undefined requests on first open" at customers.
   Both pages render what score() decides now. These cases pin the thresholds that the two
   roads disagree about most, and ops/checker-regress.sh mirrors the same numbers. */
{
  // the row is padded with plain facts up to four, so what matters is which chips are RED
  const keys = (c) => P.score(c).filter((f) => f.bad).map((f) => f.k);
  const anyKey = (c) => P.score(c).map((f) => f.k);
  const rendered = (o) => Object.assign({ rendered: true, vp: 'ok', overflow: 0, rtl: '', https: true,
    call: true, install: true, smallPct: 0, textChars: 3000, minFont: 14, taps: 20, tapsSmall: 0,
    lazyMissing: 0 }, o);

  is('score: a clean rendered page has no red chip',
    P.score(rendered({})).filter((f) => f.bad).length, 0);
  is('score: no viewport tag is "no phone layout" even when nothing overflows',
    keys(rendered({ vp: 'missing' })).indexOf('vp') === 0, true);
  is('score: small type needs both a real share and a real sample',
    [keys(rendered({ smallPct: 49, textChars: 300 })).includes('tiny'),
     keys(rendered({ smallPct: 49, textChars: 3000 })).includes('tiny'),
     keys(rendered({ smallPct: 8, textChars: 3000 })).includes('tiny')], [false, true, false]);
  is('score: three small targets out of twenty-six is not a fault, out of eight it is',
    [keys(rendered({ taps: 26, tapsSmall: 3 })).includes('tap'),
     keys(rendered({ taps: 8, tapsSmall: 3 })).includes('tap')], [false, true]);
  is('score: the browser road never asks for reqs or kb, which it does not measure',
    anyKey(rendered({ reqs: 99, kb: 999 })).some((k) => k === 'reqs' || k === 'kb'), false);
  is('score: the HTML road still uses them, with the downloaded-size line at 250',
    [keys({ rendered: false, vp: 'ok', call: true, install: true, reqs: 99 }).includes('reqs'),
     keys({ rendered: false, vp: 'ok', call: true, install: true, kb: 300 }).includes('kb'),
     keys({ rendered: false, vp: 'ok', call: true, install: true, kb: 200 }).includes('kb')],
    [true, true, false]);
  is('score: never more than four chips', P.score(rendered({
    vp: 'missing', overflow: 99, rtl: 'he', https: false, call: false, install: false,
    smallPct: 99, tapsSmall: 9, taps: 10, lazyMissing: 9 })).length, 4);
  is('score: nothing to say about nothing', P.score(null), []);
}

/* ---- the address comes from a stranger's keyboard ----------------------------------- */
falsy('address: loopback refused', P.clean('127.0.0.1'));
falsy('address: a private range refused', P.clean('http://192.168.1.1/'));
falsy('address: cloud metadata refused', P.clean('http://metadata.google.internal/'));
falsy('address: a bare word is not an address', P.clean('mysite'));
falsy('address: a non-web scheme refused', P.clean('file:///etc/passwd'));
truthy('address: a bare domain becomes https', P.clean('busi.co.il'));
is('address: http is kept, because that is what the visitor gets',
  P.clean('http://bar-nikuy.co.il/').protocol, 'http:');

/* ---- a frame of ours, allowed or not ----------------------------------------------- */
const hdr = (o) => ({ get: (k) => o[k.toLowerCase()] || '' });
falsy('frame: x-frame-options deny',
  P.framePolicy(hdr({ 'x-frame-options': 'DENY' }), 'busi.co.il').frameable);
falsy('frame: sameorigin on someone else’s site',
  P.framePolicy(hdr({ 'x-frame-options': 'SAMEORIGIN' }), 'busi.co.il').frameable);
falsy("frame: frame-ancestors 'none'",
  P.framePolicy(hdr({ 'content-security-policy': "frame-ancestors 'none'" }), 'busi.co.il').frameable);
truthy('frame: frame-ancestors listing us',
  P.framePolicy(hdr({ 'content-security-policy': 'frame-ancestors https://genvidpro.com' }), 'busi.co.il').frameable);
truthy('frame: no opinion means yes', P.framePolicy(hdr({}), 'busi.co.il').frameable);
truthy("frame: our own site's 'self' is us",
  P.framePolicy(hdr({ 'content-security-policy': "frame-ancestors 'self'" }), 'genvidpro.com').frameable);

fs.rmSync(path.dirname(tmp), { recursive: true, force: true });
console.log('\n' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
