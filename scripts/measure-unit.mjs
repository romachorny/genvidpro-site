// scripts/measure-unit.mjs — what the browser MEASURES, pinned on fixtures it cannot argue
// with. The sibling file scripts/preview-unit.mjs pins how the numbers are scored into
// chips; this one pins where the numbers come from.
//
//   node scripts/measure-unit.mjs
//
// No network: every case is a few lines of HTML set straight into the page. measure() is
// lifted out of render/src/index.js as text, exactly as the Worker ships it to the browser,
// so there is no second copy of the rule to drift.
//
// Why it exists. 02.10.2026: our own home page was told it had "type as small as 5.9 px"
// and 49 % of its words too small to read. Every one of those words was artwork — a
// blueprint's fine print, a fake terminal, a marquee inside a miniature logo card. Two
// generic rules answer it, and both are the page's own word rather than our guess:
// text drawn much smaller than it was laid out is a preview of a design, and text the page
// marks aria-hidden is not content. Neither mentions a class name or a domain, so these
// cases are written about a stranger's page, not ours.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PUP = process.env.PUP || '/home/roma/gvpro/node_modules/puppeteer-core';
const puppeteer = (await import(pathToFileURL(path.join(PUP, 'lib/puppeteer/puppeteer-core.js')).href)).default;

/* measure() as the Worker ships it: found by name, cut at its matching brace. */
function measureSource() {
  const src = fs.readFileSync(path.join(ROOT, 'render/src/index.js'), 'utf8');
  const i = src.indexOf('function measure()');
  if (i < 0) throw new Error('measure() not found in render/src/index.js');
  let depth = 0;
  for (let k = src.indexOf('{', i); k < src.length; k++) {
    if (src[k] === '{') depth++;
    else if (src[k] === '}' && --depth === 0) return src.slice(i, k + 1);
  }
  throw new Error('measure() never closes');
}
const MEASURE = measureSource();

let pass = 0, fail = 0;
function is(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) { pass++; console.log('PASS  ' + name); }
  else { fail++; console.log('FAIL  ' + name + '\n        got  ' + JSON.stringify(got) + '\n        want ' + JSON.stringify(want)); }
}

const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome',
  headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const page = await browser.newPage();
// a real phone's frame, the same one the Worker measures at
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });

const COPY = '<p style="font-size:16px">' + 'a readable sentence of ordinary copy. '.repeat(12) + '</p>';
async function on(body) {
  await page.setContent('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<body style="margin:0">' + body + '</body>', { waitUntil: 'load' });
  return page.evaluate('(' + MEASURE + ')()');
}

/* 1. Real small copy is counted, and counted against the page's words. */
{
  const m = await on('<p style="font-size:8px">' + 'fine print nobody can read on a phone. '.repeat(12) + '</p>');
  is('small type: real copy at 8 px is counted', [m.smallPct, m.minFont, m.textChars > 400], [100, 8, true]);
  const half = await on(COPY + '<p style="font-size:8px">' + 'fine print nobody can read. '.repeat(16) + '</p>');
  is('small type: and it is a share of the page, not the whole verdict',
    [half.smallPct > 40, half.smallPct < 100], [true, true]);
}

/* 2. aria-hidden: the page's own word that this is not content. A watermark over a video,
      the fake address bar of a device mockup, the fine print inside an illustration. */
{
  const m = await on(COPY +
    '<div aria-hidden="true"><span style="font-size:6px">SCALE 1:1 REV. A SHEET 01</span>' +
    '<span style="font-size:7px">yourbrand.com</span></div>');
  is('aria-hidden: a label the page hides from a screen reader is not copy',
    [m.smallPct, m.minFont >= 12 || m.minFont === 16, m.decorChars], [0, true, 38]);

  // nested, because that is how a page marks a whole illustration at its root
  const deep = await on(COPY + '<div aria-hidden="true"><div><p><span style="font-size:5px">' +
    'EST. 2026 — 9 LETTERS</span></p></div></div>');
  is('aria-hidden: it covers everything inside, however deep', [deep.smallPct, deep.decorChars], [0, 21]);

  // and the rule is not a licence to ignore small type: hidden from no one, still counted
  const shown = await on('<div aria-hidden="false"><span style="font-size:6px">' +
    'the same label, not hidden from anyone at all, so it is copy</span></div>');
  is('aria-hidden: only "true" means it, and anything else is still copy',
    [shown.smallPct, shown.decorChars], [100, 0]);
}

/* 3. Drawn much smaller than it was laid out: a thumbnail of a design, not copy. The
      281 px card the page shows at 55 px takes every word in it along. */
{
  const card = '<div style="width:280px;font-size:14px">' +
    'a whole page of copy, laid out at a readable size and then shown as a thumbnail</div>';
  const m = await on(COPY + '<div style="transform:scale(.2);transform-origin:0 0">' + card + '</div>');
  is('preview: text in a design shrunk to a fifth is set aside, and said so',
    [m.smallPct, m.shrunkChars > 60], [0, true]);

  // a preview big enough to read is read: 0.9 is a page, not a thumbnail
  const mild = await on('<div style="transform:scale(.9);transform-origin:0 0">' +
    '<div style="width:300px;font-size:9px">' + 'small copy inside a barely scaled box. '.repeat(10) + '</div></div>');
  is('preview: barely scaled is not a preview, and its small type still counts',
    [mild.smallPct, mild.shrunkChars], [100, 0]);
}

/* 4. Our own home page, the case that started this: artwork and previews aside, what is
      left must be nearly all readable. A page-level number, read off the real file. */
{
  const home = 'file://' + path.join(ROOT, 'index.html');
  await page.goto(home, { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1200));
  const m = await page.evaluate('(' + MEASURE + ')()');
  is('our own page: the share of unreadable type is far under the 40 that turns it red',
    [m.smallPct <= 10, m.textChars > 400], [true, true]);
  is('our own page: and it does not run off the side of a phone', m.overflow <= 8, true);
  if (m.smallPct > 10) console.log('        (smallPct ' + m.smallPct + ', minFont ' + m.minFont + ' on "' + m.minFontText + '")');
}

await browser.close();
console.log('\n' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
