// scripts/eyes.mjs — look at the live pages in a real headed Chrome, at a laptop and at a
// phone, in all three languages, and save what it saw.
//
//   DISPLAY=:99 node scripts/eyes.mjs                       (live)
//   DISPLAY=:99 BASE=http://127.0.0.1:8898 node scripts/eyes.mjs
//
// Headed, not headless, because that is the browser a customer has: headless Chrome skips
// work a real window does, and the whole point here is to see the page rather than to
// query it. Shots land in /tmp/gvp-eyes/ for a human to open.
//
// It reports three things per page, the ones that cannot be argued with: a sideways scroll
// on a phone (nothing on the web should have one), text left in the wrong language, and any
// script error. Chrome here goes out through Roma's phone; if the phone is off, every
// navigation dies and that is said out loud rather than blamed on the page.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const BASE = (process.env.BASE || 'https://genvidpro.com').replace(/\/$/, '');
const PUP = process.env.PUP || '/home/roma/gvpro/node_modules/puppeteer-core';
const OUT = process.env.OUT || '/tmp/gvp-eyes';
const puppeteer = (await import(pathToFileURL(path.join(PUP, 'lib/puppeteer/puppeteer-core.js')).href)).default;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(OUT, { recursive: true });

const SIZES = [['laptop', 1440, 900], ['phone', 390, 844]];
const LANGS = ['he', 'en', 'ru'];
const PAGES = ['', 'app', 'automation', 'os', 'work', 'learn'];

let pass = 0, fail = 0;
function line(ok, name, detail) {
  if (ok) pass++; else fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ::  ' + detail : ''}`);
}

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: false,
  defaultViewport: null,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1500,1000', '--no-first-run']
});

// clean URLs on the live site, .html on a static server
async function url(name) {
  if (!name) return BASE + '/';
  try { const r = await fetch(`${BASE}/${name}`, { method: 'HEAD' }); if (r.ok) return `${BASE}/${name}`; } catch (_) {}
  return `${BASE}/${name}.html`;
}

for (const [sizeName, w, h] of SIZES) {
  for (const lang of LANGS) {
    for (const name of PAGES) {
      const u = (await url(name)) + (name ? '?' : '?') + 'lang=' + lang;
      const p = await browser.newPage();
      await p.setViewport({ width: w, height: h, isMobile: w < 800, hasTouch: w < 800,
        deviceScaleFactor: w < 800 ? 2 : 1 });
      const errs = [];
      p.on('pageerror', e => errs.push(String(e).slice(0, 140)));
      p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 140)); });
      const label = `${name || 'home'} ${sizeName} ${lang}`;
      try {
        await p.goto(u, { waitUntil: 'load', timeout: 120000 });
      } catch (e) {
        if (/SOCKS/.test(String(e))) {
          console.error('\nSTOP: Chrome cannot reach the network — the phone exit node is off. Nothing here is a verdict on the site.');
          await browser.close(); process.exit(2);
        }
        line(false, label, 'navigation: ' + String(e).slice(0, 90));
        await p.close(); continue;
      }
      await sleep(3500);
      const st = await p.evaluate(() => {
        const t = document.body.innerText || '';
        return {
          lang: document.documentElement.lang,
          dir: document.documentElement.dir || getComputedStyle(document.documentElement).direction,
          he: (t.match(/[֐-׿]/g) || []).length,
          ru: (t.match(/[Ѐ-ӿ]/g) || []).length,
          latin: (t.match(/[A-Za-z]/g) || []).length,
          hs: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          switcher: [...document.querySelectorAll('#lang-menu button')].map(b => b.dataset.l),
          title: document.title
        };
      });
      const file = path.join(OUT, `${name || 'home'}-${sizeName}-${lang}.jpg`);
      await p.screenshot({ path: file, quality: 72, type: 'jpeg' });

      // the page speaks the language that was asked for
      const spoke = lang === 'he' ? st.he > 40 : lang === 'ru' ? st.ru > 40 : st.latin > 40;
      line(spoke, `${label}: speaks ${lang}`, `he ${st.he} ru ${st.ru} latin ${st.latin} dir ${st.dir}`);
      // nothing on the web should scroll sideways, least of all on a phone
      line(st.hs === 0, `${label}: no sideways scroll`, `overflow ${st.hs}px`);
      // three languages offered, and no option that leads nowhere
      line(st.switcher.length === 3 && !st.switcher.includes('ar'),
        `${label}: switcher offers he/en/ru and no Arabic`, st.switcher.join(','));
      // a title escaped twice is the bug this all started with
      line(!/&(amp|lt|gt|quot|#\d+);/i.test(st.title), `${label}: title is not double escaped`, st.title);
      if (errs.length) line(false, `${label}: script errors`, errs.slice(0, 3).join(' | '));
      await p.close();
    }
  }
}

await browser.close();
console.log(`\n${pass} PASS, ${fail} FAIL`);
console.log('shots: ' + OUT);
process.exit(fail ? 1 : 0);
