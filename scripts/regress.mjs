// scripts/regress.mjs — one test per bug this site has actually had, so none of them can
// come back quietly. Dev only: /scripts/* is closed on the live site.
//
//   BASE=http://127.0.0.1:8898 node scripts/regress.mjs     (a static server over this tree)
//   BASE=https://genvidpro.com node scripts/regress.mjs     (after a deploy)
//
// Playwright is not installed on roma-server; puppeteer-core is, in the GVPro app's tree.
// Point PUP somewhere else if that ever moves.
//
// Note for whoever runs this here: Chrome on this machine is forced through a SOCKS proxy
// to Roma's phone (/etc/opt/chrome/policies/managed/proxy-phone.json). Phone off, every
// navigation dies with ERR_SOCKS_CONNECTION_FAILED and that is not the site's fault — the
// runner says so rather than reporting a page as broken.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const BASE = (process.env.BASE || 'https://genvidpro.com').replace(/\/$/, '');
const PUP = process.env.PUP || '/home/roma/gvpro/node_modules/puppeteer-core';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const puppeteer = (await import(pathToFileURL(path.join(PUP, 'lib/puppeteer/puppeteer-core.js')).href)).default;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const out = [];
function line(ok, name, detail) {
  out.push({ ok, name, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ::  ' + detail : ''}`);
}

const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'] });
async function open(url, w = 390, h = 844) {
  const p = await browser.newPage();
  await p.setViewport({ width: w, height: h, isMobile: w < 800, hasTouch: w < 800 });
  p.setDefaultNavigationTimeout(120000);
  const errs = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 120)));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 120)); });
  p.__errs = errs;
  try { await p.goto(url, { waitUntil: 'domcontentloaded' }); }
  catch (e) {
    if (/SOCKS/.test(String(e))) { console.error('\nSTOP: Chrome cannot reach the network — the phone exit node is off. Nothing here is a verdict on the site.'); process.exit(2); }
    throw e;
  }
  await sleep(3000);
  return p;
}

/* 1. 28.09.2026: "orders in whatsapp", "your own automation" and "selected films" had no
      entry in any language and stood in English on a Hebrew page. The key for the OS button
      had drifted from the text when the NEW badge moved into its own span. */
for (const lang of ['he', 'ru']) {
  const p = await open(`${BASE}/?lang=${lang}`);
  const caps = await p.evaluate(() => [...document.querySelectorAll('.gv-hp .gv-c')].map(e => e.textContent.trim()));
  const english = caps.filter(t => /^[\x00-\x7F\s·]+$/.test(t));
  line(caps.length >= 9 && english.length === 0, `home buttons: every caption translated (${lang})`,
    english.length ? 'still English: ' + english.join(' | ') : `${caps.length} captions`);
  await p.close();
}

/* 2. 28.09.2026: the gate was "is there a dictionary", and three Arabic lines kept ready for
      later were enough — ?lang=ar turned the page right-to-left with English inside it and
      remembered that on every page after. Only a language the switch offers may win. */
for (const bad of ['ar', 'fr']) {
  const p = await open(`${BASE}/?lang=${bad}`);
  const st = await p.evaluate(() => ({ lang: document.documentElement.lang, dir: document.documentElement.dir }));
  line(st.lang !== bad && st.dir !== 'rtl', `?lang=${bad} does not take a language the switch does not offer`, JSON.stringify(st));
  await p.close();
}

/* 3. 29.09.2026: the deposit button. The script built its PayPal link, gated it and logged
      the click for months; the anchor itself was never in the markup. */
{
  const p = await open(`${BASE}/`);
  await p.evaluate(() => { const a = document.querySelector('a[href="#order"]'); if (a) a.click(); });
  await sleep(1500);
  await p.evaluate(() => { const t = [...document.querySelectorAll('#order .opt')].find(e => /06 - Website/.test(e.innerText)); if (t) t.click(); });
  await sleep(1500);
  const st = await p.evaluate(() => {
    const pp = document.getElementById('send-pp');
    const money = (document.getElementById('total') || {}).textContent || '';
    if (!pp) return { there: false };
    const amt = (pp.getAttribute('href').match(/[?&]amount=(\d+)/) || [])[1];
    return { there: true, dis: pp.classList.contains('dis'), amt: +amt, total: +money.replace(/[^\d]/g, ''), label: pp.textContent.trim() };
  });
  line(st.there, 'order: the "Pay 50% deposit" button is on the page', st.label || '');
  line(st.there && st.amt * 2 === st.total, 'order: the deposit is half the total', `${st.amt} of ${st.total}`);
  line(st.there && st.dis === true, 'order: the deposit button is shut until the brief is answered');
  await p.close();
}

/* 4. 28.09.2026: the builder's electronics demo listed real products by name. */
{
  const src = fs.readFileSync(path.join(ROOT, 'tpl-engine.js'), 'utf8');
  const brands = ['iPhone', 'MacBook', 'Sony', 'iPad', 'Apple Watch', 'Samsung', 'Logitech', 'Anker'].filter(b => src.includes(b));
  line(brands.length === 0, 'builder: no real brand names in the demo', brands.join(', '));
}

/* 5. 29.09.2026: /app, /automation, /os, /work and /learn carried no dictionary at all and
      stood in one language whatever the switch said; /learn was Hebrew only. */
/* a plain static server over this tree has no clean URLs; the live site does */
async function pageUrl(name) {
  try { const r = await fetch(`${BASE}/${name}`, { method: 'HEAD' }); if (r.ok) return `${BASE}/${name}`; } catch (_) {}
  return `${BASE}/${name}.html`;
}
for (const page of ['app', 'automation', 'os', 'work', 'learn']) {
  const url = await pageUrl(page);
  for (const lang of ['he', 'ru']) {
    const p = await open(`${url}?lang=${lang}`);
    const st = await p.evaluate(() => {
      const menu = document.getElementById('lang-menu');
      const body = (document.body.innerText || '');
      return { opts: menu ? [...menu.querySelectorAll('button')].map(b => b.dataset.l) : [],
        he: /[֐-׿]/.test(body), ru: /[Ѐ-ӿ]/.test(body),
        hs: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    const spoke = lang === 'he' ? st.he : st.ru;
    line(spoke && st.hs === 0, `/${page}: speaks ${lang}, no sideways scroll`, JSON.stringify(st.opts));
    line(st.opts.length === 3 && !st.opts.includes('ar'), `/${page}: the switch offers three languages and no dead option`, st.opts.join(','));
    await p.close();
  }
}

/* 6. 28.09.2026: the SITE button opened the app in English whatever the page was reading. */
for (const lang of ['he', 'ru', 'en']) {
  const p = await open(`${BASE}/?lang=${lang}`);
  const href = await p.evaluate(() => { const a = document.querySelector('a[href*="app.genvidpro.com"]'); return a ? a.getAttribute('href') : ''; });
  line(href.includes('lang=' + lang), `the app link carries the page's language (${lang})`, href);
  await p.close();
}

await browser.close();
const bad = out.filter(r => !r.ok);
console.log(`\n${out.length - bad.length} PASS, ${bad.length} FAIL`);
process.exit(bad.length ? 1 : 0);
