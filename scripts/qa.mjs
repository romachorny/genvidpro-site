// scripts/qa.mjs — the self-check for genvidpro.com. Dev only: /scripts/* is closed
// on the live site by functions/scripts/[[path]].js.
//
//   BASE=http://127.0.0.1:8790 node scripts/qa.mjs      (wrangler pages dev)
//   BASE=https://genvidpro.com  node scripts/qa.mjs      (after a deploy)
//
// Playwright is not a dependency of the site. Point PW at an installed
// playwright-core (PW=C:/path/node_modules/playwright-core) or have it resolvable.
// Chrome is used through channel "chrome"; set PW_CHANNEL= to use bundled Chromium.
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const BASE = (process.env.BASE || 'http://127.0.0.1:8790').replace(/\/$/, '');
const LIVE = !/localhost|127\.0\.0\.1/.test(BASE);
const OUT = process.env.OUT || '.';
const ONLY = process.env.ONLY || '';           // run one group: headers,pages,widget,history,chat,video
const pwPath = process.env.PW ? pathToFileURL(path.join(process.env.PW, 'index.mjs')).href : 'playwright-core';
const { chromium } = await import(pwPath);

const results = [];
function line(ok, name, detail) {
  const tag = ok === null ? 'INFO' : ok ? 'PASS' : 'FAIL';
  results.push({ tag, name, detail });
  console.log(`${tag}  ${name}${detail ? '  ::  ' + detail : ''}`);
}
const want = (g) => !ONLY || ONLY.split(',').includes(g);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const VIEWPORTS_ALL = [
  { id: '1440', viewport: { width: 1440, height: 900 } },
  { id: '390-iphone', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' },
  { id: '412-pixel', viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2.625,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36' }
];
// VP=390 runs one viewport (the site allows 40 address lookups an hour from one address)
const VIEWPORTS = process.env.VP ? VIEWPORTS_ALL.filter(v => v.id.startsWith(process.env.VP)) : VIEWPORTS_ALL;
const LANGS = ['en', 'he'];
const PAGES = ['/', '/builder', '/terms', '/privacy', '/thanks', '/no-such-page-qa'];

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'chrome', headless: true });

async function ctxFor(vp, lang, extra) {
  const o = Object.assign({ viewport: vp.viewport, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch, deviceScaleFactor: vp.deviceScaleFactor || 1, locale: 'en-US' }, extra || {});
  if (vp.userAgent) o.userAgent = vp.userAgent;
  const ctx = await browser.newContext(o);
  await ctx.addInitScript((l) => { try { localStorage.setItem('gvlang', l); } catch (e) {} }, lang);
  return ctx;
}

async function watch(page) {
  const w = { errors: [], bad: [] };
  page.on('console', m => { if (m.type() === 'error') w.errors.push(m.text().slice(0, 160)); });
  page.on('pageerror', e => w.errors.push('pageerror: ' + String(e).slice(0, 160)));
  page.on('response', r => {
    const st = r.status();
    // /ev accepts beacons from genvidpro.com only, so on localhost it answers 403 by design
    if (!LIVE && st === 403 && /\/ev$/.test(r.url())) { w.ev403 = (w.ev403 || 0) + 1; w.errors = w.errors.filter(e => !/status of 403/.test(e)); w.localEv = true; return; }
    if (st >= 400 && r.frame() === page.mainFrame()) w.bad.push(st + ' ' + r.url().slice(0, 120));
  });
  return w;
}

async function settle(page, ms = 1200) { await page.waitForLoadState('load').catch(() => {}); await sleep(ms); }

async function scrollThrough(page) {
  await page.evaluate(async () => {
    const h = () => document.documentElement.scrollHeight;
    for (let y = 0; y < h(); y += Math.max(300, innerHeight * 0.8)) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
    scrollTo(0, 0);
  });
  await sleep(400);
}

// ---------------------------------------------------------------- headers
if (want('headers')) {
  const r = await fetch(BASE + '/', { cache: 'no-store' });
  const xfo = r.headers.get('x-frame-options') || '';
  const csp = r.headers.get('content-security-policy') || '';
  line(!/deny/i.test(xfo), 'headers: no X-Frame-Options DENY', xfo ? 'x-frame-options: ' + xfo : 'absent');
  const fa = (/frame-ancestors([^;]*)/.exec(csp) || [])[1] || '';
  line(!/'none'/.test(fa) && /'self'/.test(fa), "headers: CSP frame-ancestors 'self' kept", fa.trim());
  line(/frame-src[^;]*https:/.test(csp), 'headers: CSP frame-src allows https: frames', ((/frame-src([^;]*)/.exec(csp) || [])[1] || '').trim());
  const q = await fetch(BASE + '/scripts/qa.mjs');
  line(q.status === 404, 'headers: /scripts/qa.mjs is not served', 'status ' + q.status);
}

// ---------------------------------------------------------------- every page
if (want('pages')) {
  for (const vp of VIEWPORTS) {
    for (const lang of LANGS) {
      const ctx = await ctxFor(vp, lang);
      for (const p of PAGES) {
        const page = await ctx.newPage();
        const w = await watch(page);
        const tag = `[${vp.id} ${lang}] ${p}`;
        const resp = await page.goto(BASE + p, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(e => null);
        await settle(page, 1500);
        if (p === '/no-such-page-qa') {
          line(resp && resp.status() === 404, `${tag} 404 page answers 404`, 'status ' + (resp && resp.status()));
          w.bad = w.bad.filter(b => !b.includes('/no-such-page-qa'));
          // Chrome reports the page's own intended 404 status as a console line; that one is the point of the page
          w.errors = w.errors.filter((e, i) => !(i === 0 && /status of 404/.test(e)));
        }
        await scrollThrough(page);
        const m = await page.evaluate(() => ({
          dir: document.documentElement.dir, lang: document.documentElement.lang,
          sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth
        }));
        if (lang === 'he') line(m.dir === 'rtl', `${tag} dir is rtl in Hebrew`, `dir=${m.dir} lang=${m.lang}`);
        else line(m.dir !== 'rtl', `${tag} dir is ltr in English`, `dir=${m.dir}`);
        line(m.sw === m.cw, `${tag} no horizontal overflow`, `scrollWidth ${m.sw} clientWidth ${m.cw}`);

        // elements outside the viewport (carousels and the scaled frames excepted, and
        // anything clipped by an ancestor)
        const outside = await page.evaluate(() => {
          const vw = document.documentElement.clientWidth, out = [];
          const skip = '.gv-stage,.gv-ring,.rail,.work,#gv3s,.lb,[hidden],#lang-menu,#shr-menu,.gvpa-box,#help-box,.grain,#gvp-install,.tiles,.shot,#big,.frame';
          for (const el of document.querySelectorAll('body *')) {
            if (el.closest(skip)) continue;
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed' && cs.opacity === '0') continue;
            const r = el.getBoundingClientRect();
            if (!r.width || !r.height) continue;
            if (r.right <= vw + 1 && r.left >= -1) continue;
            let clipped = false;
            for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
              const ac = getComputedStyle(a);
              if (/(hidden|clip|auto|scroll)/.test(ac.overflowX + ac.overflow)) { const ar = a.getBoundingClientRect(); if (ar.right <= vw + 1 && ar.left >= -1) { clipped = true; break; } }
            }
            if (clipped) continue;
            if (el.parentElement && out.some(o => o.el.contains(el))) continue;
            out.push({ el, d: (el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0]) + ` [${Math.round(r.left)}..${Math.round(r.right)}]` });
          }
          return out.map(o => o.d).slice(0, 8);
        });
        line(outside.length === 0, `${tag} nothing sticks out of the viewport`, outside.join(', ') || 'none');

        // links and buttons
        const links = await page.evaluate((origin) => {
          const probs = [];
          for (const a of document.querySelectorAll('a')) {
            const raw = a.getAttribute('href');
            const where = (a.id ? '#' + a.id : '') + ' "' + (a.textContent || a.getAttribute('aria-label') || '').trim().slice(0, 30) + '"';
            if (raw === null || raw.trim() === '' || raw.trim() === '#') { probs.push('empty href' + where); continue; }
            if (raw.startsWith('#')) { if (!document.getElementById(decodeURIComponent(raw.slice(1)))) probs.push('dangling ' + raw + where); continue; }
            let u; try { u = new URL(raw, location.href); } catch (e) { probs.push('bad href ' + raw); continue; }
            if (u.origin === location.origin && u.hash && u.pathname === location.pathname && !document.getElementById(u.hash.slice(1))) probs.push('dangling ' + raw + where);
            if (/^https?:$/.test(u.protocol) && u.origin !== location.origin) {
              const rel = (a.getAttribute('rel') || '').split(/\s+/);
              if (a.getAttribute('target') !== '_blank' || !rel.includes('noopener')) probs.push('external without _blank/noopener ' + raw.slice(0, 50) + where);
            }
          }
          for (const b of document.querySelectorAll('button')) {
            if (!(b.textContent || '').trim() && !b.getAttribute('aria-label') && !b.getAttribute('title') && !b.querySelector('svg,img')) probs.push('button with no name ' + (b.id || b.className));
          }
          return probs;
        }, BASE);
        line(links.length === 0, `${tag} links and buttons`, links.slice(0, 6).join(' | ') || 'all good');

        line(w.errors.length === 0, `${tag} zero console errors`, w.errors.slice(0, 3).join(' | ') || 'none');
        line(w.bad.length === 0, `${tag} zero 4xx/5xx resources`, w.bad.slice(0, 3).join(' | ') || 'none');

        if (vp.isMobile && lang === 'en') {
          // A control counts by the area a finger can actually hit, not by its painted box:
          // the site widens small controls with an invisible ::after. Measured by hit testing
          // outwards from the centre, pixel by pixel and only inside the screen, after scrolling
          // the control to the middle of the screen. An input inside a label is judged by the label.
          const small = await page.evaluate(async () => {
            const out = [];
            const own = (el, x, y) => { const h = document.elementFromPoint(x, y); return !!h && (h === el || el.contains(h)); };
            for (const el of document.querySelectorAll('a,button,input:not([type=hidden]),select')) {
              const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
              if (el.closest('details:not([open])') && !el.closest('summary')) continue; // folded away, nothing to tap
              let r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
              if (r.width >= 40 && r.height >= 40) continue;
              const lab = el.closest('label'); if (lab) { const lr = lab.getBoundingClientRect(); if (lr.width >= 40 && lr.height >= 40) continue; }
              const fixed = (() => { for (let e = el; e; e = e.parentElement) { const p = getComputedStyle(e).position; if (p === 'fixed' || p === 'sticky') return true; } return false; })();
              if (!fixed) { el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' }); await new Promise(res => requestAnimationFrame(res)); r = el.getBoundingClientRect(); }
              const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
              if (!own(el, cx, cy)) continue; // covered at its centre by something on top: not a size question
              const reach = (el, cx, cy, dx, dy) => { let n = 0; for (let s = 1; s <= 30; s++) { const x = cx + dx * s, y = cy + dy * s; if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight || !own(el, x, y)) break; n = s; } return n; };
              const okW = reach(el, cx, cy, -1, 0) + reach(el, cx, cy, 1, 0) + 1 >= 40;
              const okH = reach(el, cx, cy, 0, -1) + reach(el, cx, cy, 0, 1) + 1 >= 40;
              if (!okW || !okH) out.push(((el.id && '#' + el.id) || (el.textContent || el.getAttribute('aria-label') || el.className || '').toString().trim().slice(0, 24)) + ` ${Math.round(r.width)}x${Math.round(r.height)}`);
            }
            window.scrollTo(0, 0);
            return out;
          });
          line(null, `${tag} tap targets under 40px (report only): ${small.length}`, small.slice(0, 40).join('; '));
        }
        await page.close();
      }
      await ctx.close();
    }
  }
}

// ---------------------------------------------------------------- videos
if (want('video')) {
  const ctx = await ctxFor(VIEWPORTS[0], 'en');
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 45000 });
  await sleep(2500);
  const urls = await page.evaluate(() => {
    const s = new Set();
    document.querySelectorAll('video').forEach(v => { [v.currentSrc, v.getAttribute('src'), v.getAttribute('data-src')].forEach(x => { if (x && /preview\.mp4/.test(x)) s.add(new URL(x, location.href).href); }); });
    (document.documentElement.innerHTML.match(/media\/m\/[a-z0-9-]+-preview\.mp4/g) || []).forEach(x => s.add(new URL(x, location.href).href.replace(/\?.*$/, '')));
    return [...s].map(u => u.replace(/\?.*$/, '')).filter((u, i, a) => a.indexOf(u) === i);
  });
  // the portfolio page builds the cards (and the films the front page does not carry) in script
  const wp = await ctx.newPage();
  await wp.goto(BASE + '/work', { waitUntil: 'load', timeout: 45000 }); await sleep(1500);
  const more = await wp.evaluate(() => [...document.querySelectorAll('video')].map(v => v.getAttribute('data-src') || v.getAttribute('src') || '').filter(x => /preview\.mp4/.test(x)).map(x => new URL(x, location.href).href.replace(/\?.*$/, '')));
  more.forEach(u => { if (!urls.includes(u)) urls.push(u); });
  await wp.close();
  let ok = 0; const bad = [];
  for (const u of urls) {
    const r = await fetch(u, { headers: { Range: 'bytes=0-1023' } });
    if (r.status === 200 || r.status === 206) ok++; else bad.push(r.status + ' ' + u);
    try { await r.arrayBuffer(); } catch (e) {}
  }
  line(urls.length >= 13 && bad.length === 0, `video: preview films answer 200/206 (${ok}/${urls.length})`, bad.join(' | ') || urls.map(u => u.split('/').pop()).join(', '));
  await page.bringToFront();
  let rs = 0;
  for (let i = 0; i < 20 && rs < 2; i++) {
    rs = await page.evaluate(() => Math.max(0, ...[...document.querySelectorAll('#gvtop video')].filter(v => { const r = v.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width > 0; }).map(v => v.readyState)));
    if (rs < 2) await sleep(500);
  }
  line(rs >= 2, 'video: the carousel film on screen reaches readyState >= 2', 'readyState ' + rs);
  await ctx.close();
}

// ---------------------------------------------------------------- the three screens
async function widgetPage(vp, lang = 'en') {
  // the site's service worker would answer fetches before Playwright's router sees them
  const ctx = await ctxFor(vp, lang, { serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const reqs = [];
  page.on('request', r => { if (r.url().includes('/preview?')) reqs.push(r.url()); });
  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 45000 });
  await sleep(1200);
  return { ctx, page, reqs };
}
async function lookup(page, addr) {
  await page.evaluate(() => document.getElementById('gv3').scrollIntoView({ block: 'start' }));
  await page.fill('#gv3u', addr);
  await page.click('#gv3go');
  await page.waitForFunction(() => window.gvThree && gvThree.state() !== 'loading', null, { timeout: 60000 });
  return page.evaluate(() => gvThree.state());
}
async function framesInfo(page) {
  return page.evaluate(() => [...document.querySelectorAll('#gv3s .gv3-vp')].map(f => ({ src: f.getAttribute('src'), sandbox: f.getAttribute('sandbox') })));
}
async function waitFramesLoaded(page, n, ms = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const left = await page.evaluate(() => document.querySelectorAll('#gv3s .gv3-load').length);
    const have = await page.evaluate(() => document.querySelectorAll('#gv3s .gv3-vp').length);
    if (have >= n && left === 0) return true;
    await sleep(500);
  }
  return false;
}
async function shotSize(page, sel, file) {
  const el = await page.$(sel); if (!el) return 0;
  const buf = await el.screenshot({ path: path.join(OUT, file) }).catch(() => null);
  return buf ? buf.length : 0;
}
// How much the picture varies: a white or black empty screen is close to 0. PNG size
// alone passed a blank white phone screen (27 KB of bezel and caption) on 15.09.2026.
async function shotVariety(page, sel, file) {
  // An element screenshot of a cross-origin frame that is off screen comes back white:
  // Chrome has not painted it yet (15.09.2026, the rebuilt Android screen at 390 looked
  // blank to the test and was fine to the eye). So the screen is scrolled into the
  // viewport first, given a moment to paint, and the viewport itself is photographed.
  const rect = await page.evaluate(async (s) => {
    const el = document.querySelector(s); if (!el) return null;
    scrollTo(0, scrollY + el.getBoundingClientRect().top - 70);
    await new Promise(r => setTimeout(r, 1500));
    const r = el.getBoundingClientRect();
    const top = Math.max(0, r.top), bottom = Math.min(innerHeight, r.bottom);
    return bottom - top > 40 ? { x: Math.max(0, r.left), y: top, width: Math.min(innerWidth, r.right) - Math.max(0, r.left), height: bottom - top } : null;
  }, sel);
  if (!rect) return 0;
  const buf = await page.screenshot({ path: path.join(OUT, file), clip: rect }).catch(() => null);
  if (!buf) return 0;
  return page.evaluate(async (b64) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = 120; c.height = Math.max(1, Math.round(120 * img.height / img.width));
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height);
    // the inner part only: the dark bezel edge alone scored 32 on a blank white screen
    const d = x.getImageData(Math.round(c.width * 0.12), Math.round(c.height * 0.1), Math.round(c.width * 0.76), Math.round(c.height * 0.76)).data;
    let n = 0, s = 0, s2 = 0;
    for (let i = 0; i < d.length; i += 4) { const v = (d[i] + d[i + 1] + d[i + 2]) / 3; s += v; s2 += v * v; n++; }
    const m = s / n; return Math.round(Math.sqrt(Math.max(0, s2 / n - m * m)));
  }, buf.toString('base64'));
}

if (want('widget')) {
  for (const vp of VIEWPORTS) {
    const narrow = vp.viewport.width < 900;
    const { ctx, page, reqs } = await widgetPage(vp);
    const tag = `[${vp.id}] widget`;
    // one crashed step (a hidden tab, a timeout) is a FAIL line, not the end of the whole run
    try {

    // empty field sends nothing
    await page.evaluate(() => document.getElementById('gv3').scrollIntoView({ block: 'start' }));
    const dis = await page.evaluate(() => document.getElementById('gv3go').disabled);
    await page.click('#gv3go', { force: true }).catch(() => {});
    await page.focus('#gv3u'); await page.keyboard.press('Enter');
    await page.fill('#gv3u', 'nodot'); await page.keyboard.press('Enter');
    await sleep(1500);
    line(dis && reqs.length === 0, `${tag}: empty or dotless field sends nothing`, `disabled=${dis}, requests=${reqs.length}`);

    // tap reaches the field and the button at phone widths
    if (narrow) {
      for (const how of ['App button', 'hash link']) {
        if (how === 'App button') {
          await page.evaluate(() => scrollTo(0, 0)); await sleep(300);
          await page.click('#gvPanelApp'); await sleep(1800);
          await page.evaluate(() => { const r = document.getElementById('gv3u').getBoundingClientRect(); if (r.bottom > innerHeight || r.top < 0) document.getElementById('gv3').scrollIntoView({ block: 'start' }); });
        } else {
          await page.goto(BASE + '/#gv3', { waitUntil: 'load' }); await sleep(1500);
        }
        await sleep(700);
        const hit = await page.evaluate(() => ['gv3u', 'gv3go'].map(id => {
          const el = document.getElementById(id), r = el.getBoundingClientRect();
          const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return { id, ok: !!at && (at === el || el.contains(at)), got: at ? (at.id || at.className || at.tagName) : 'null', top: Math.round(r.top) };
        }));
        line(hit.every(h => h.ok), `${tag}: elementFromPoint hits #gv3u and #gv3go after ${how}`, hit.map(h => `${h.id}->${h.got}@${h.top}`).join(', '));
      }
    }

    // a good site: three live frames (on a phone, one per tab)
    const good = 'perfectoclinic.co.il';
    let st = await lookup(page, good);
    let liveOk = st === 'shown', det = [];
    for (const d of (narrow ? ['desktop', 'iphone', 'android'] : [null])) {
      if (d) { await page.click(`#gv3tabs [data-d="${d}"]`); await sleep(300); }
      const loaded = await waitFramesLoaded(page, narrow ? 1 : 3, 40000);
      const fr = await framesInfo(page);
      const want = narrow ? 1 : 3;
      const good1 = fr.length === want && fr.every(f => /^https?:/.test(f.src) && !/render=1/.test(f.src));
      det.push(`${d || 'all'}: ${fr.length} live frame(s), loaded=${loaded}`);
      liveOk = liveOk && good1 && loaded;
      if (d === 'iphone' || !d) await shotSize(page, '#gv3s', `qa-${vp.id}-good.png`);
    }
    line(liveOk, `${tag}: a good site (${good}) shows three live frames`, det.join('; '));
    const factsTxt = await page.evaluate(() => document.getElementById('gv3facts').innerText.replace(/\s+/g, ' '));
    line(null, `${tag}: facts for ${good}`, factsTxt);

    // a site that forbids framing: three reconstructed previews with the caption
    const blocked = 'barbarashop.co.il';
    st = await lookup(page, blocked);
    let recOk = st === 'shown'; det = [];
    for (const d of (narrow ? ['desktop', 'iphone', 'android'] : [null])) {
      if (d) { await page.click(`#gv3tabs [data-d="${d}"]`); await sleep(300); }
      const loaded = await waitFramesLoaded(page, narrow ? 1 : 3, 40000);
      const fr = await framesInfo(page);
      const caps = await page.evaluate(() => [...document.querySelectorAll('#gv3s .gv3-rc')].filter(c => c.getBoundingClientRect().height > 0).length);
      // every screen is measured on its own; pictures arrive after the load event, so up to 15 s
      let vary = [];
      for (let t = 0; t < 6; t++) {
        await sleep(2500);
        vary = [];
        const n = await page.evaluate(() => document.querySelectorAll('#gv3s .gv3-scr').length);
        for (let k = 0; k < n; k++) vary.push(await shotVariety(page, `#gv3s .gv3-sc:nth-child(${k + 1}) .gv3-scr`, `qa-${vp.id}-blocked-${d || 'all'}-${k}.png`));
        if (vary.length && vary.every(v => v >= 12)) break;
      }
      const want = narrow ? 1 : 3;
      const ok = fr.length === want && fr.every(f => /render=1/.test(f.src) && f.sandbox === '') && caps === want && loaded && vary.length === want && vary.every(v => v >= 12);
      det.push(`${d || 'all'}: ${fr.length} rebuilt, captions ${caps}, loaded=${loaded}, picture variety ${vary.join('/')}`);
      recOk = recOk && ok;
    }
    line(recOk, `${tag}: a framing-blocked site (${blocked}) shows reconstructed previews with the caption`, det.join('; '));
    const f2 = await page.evaluate(() => document.getElementById('gv3facts').innerText.replace(/\s+/g, ' '));
    line(null, `${tag}: facts for ${blocked}`, f2);

    // a bad address after a good one: one error, nothing stale
    st = await lookup(page, 'nosuchsite-qa-7731.co.il');
    const bad = await page.evaluate(() => ({
      frames: document.querySelectorAll('#gv3s .gv3-vp').length,
      screensShown: !document.getElementById('gv3s').hidden && document.getElementById('gv3s').getBoundingClientRect().height > 0,
      facts: !document.getElementById('gv3facts').hidden, verdict: !document.getElementById('gv3verdict').hidden,
      err: document.getElementById('gv3msg').classList.contains('bad'), msg: document.getElementById('gv3msg').innerText,
      digits: /\b[45]\d\d\b/.test(document.getElementById('gv3msg').innerText)
    }));
    // the site's own hourly ceiling gives an error too, and that is not the error under test
    line(st === 'error' && bad.frames === 0 && !bad.screensShown && !bad.facts && !bad.verdict && bad.err && !bad.digits && !/lot of checks/.test(bad.msg),
      `${tag}: a bad address shows one error and no stale frames`, JSON.stringify(bad));

    // our own site inside the three screens (only meaningful against the live site)
    if (LIVE) {
      st = await lookup(page, 'genvidpro.com');
      const loaded = await waitFramesLoaded(page, narrow ? 1 : 3, 45000);
      const fr = await framesInfo(page);
      line(st === 'shown' && loaded && fr.length > 0 && fr.every(f => /^https:\/\/genvidpro\.com/.test(f.src)), `${tag}: genvidpro.com renders live inside #gv3`, JSON.stringify(fr));
      await shotSize(page, '#gv3s', `qa-${vp.id}-self.png`);
    }

    // a forced first-call failure is invisible when the retry succeeds
    let calls = 0;
    await page.route('**/preview?u=*', (route) => {
      if (route.request().url().includes('render=1')) return route.continue();
      calls++;
      if (calls === 1) return route.fulfill({ status: 502, contentType: 'application/json', body: '{"ok":false,"why":"unreachable","retry":true}' });
      return route.continue();
    });
    const msgs = [];
    // sampled only once this lookup has started, so the previous test's error is not counted
    let started = false;
    const poll = setInterval(async () => {
      try {
        const s = await page.evaluate(() => [gvThree.state(), document.getElementById('gv3msg').className]);
        if (s[0] === 'loading') started = true;
        if (started) msgs.push(s[1]);
      } catch (e) {}
    }, 150);
    st = await lookup(page, good);
    clearInterval(poll);
    line(st === 'shown' && calls === 2 && !msgs.some(c => /bad/.test(c)), `${tag}: a failed first call is retried silently`, `calls=${calls}, state=${st}, error shown=${msgs.some(c => /bad/.test(c))}`);
    await page.unroute('**/preview?u=*');
    } catch (e) {
      line(false, `${tag}: run stopped`, String(e && e.message || e).split('\n')[0].slice(0, 160));
    }
    await ctx.close();
  }
}

// ---------------------------------------------------------------- history
if (want('history')) {
  for (const vp of [VIEWPORTS[1], VIEWPORTS[2]]) {
    for (const [p, pill, box] of [['/', '#help-pill', '#help-box'], ['/builder', '#gvpa-pill', '#gvpa-box']]) {
      const ctx = await ctxFor(vp, 'en');
      const page = await ctx.newPage();
      const w = await watch(page);
      await page.goto(BASE + '/terms', { waitUntil: 'load' });
      await page.goto(BASE + p, { waitUntil: 'load' }); await sleep(1500);
      const tag = `[${vp.id}] history ${p}`;
      const h0 = await page.evaluate(() => history.length);
      await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), pill);
      await page.click(pill, { force: true }); await sleep(500);
      const h1 = await page.evaluate(() => history.length);
      const openNow = await page.evaluate((s) => !document.querySelector(s).hidden, box);
      line(openNow && h1 === h0 + 1, `${tag}: opening the assistant adds one history entry`, `history ${h0} -> ${h1}, open=${openNow}`);
      await page.goBack(); await sleep(700);
      const after = await page.evaluate((s) => ({ hidden: document.querySelector(s).hidden, path: location.pathname }), box);
      line(after.hidden && new URL(BASE + p).pathname.replace(/\/$/, '') === after.path.replace(/\/$/, ''), `${tag}: Back closes the panel and stays on the page`, JSON.stringify(after));
      await page.click(pill, { force: true }); await sleep(400);
      await page.click(box.replace('box', 'x').replace('#help-x', '#help-x'), { force: true }).catch(() => {});
      await sleep(700);
      const h2 = await page.evaluate(() => history.length);
      await page.goBack(); await sleep(1200);
      const left = await page.evaluate(() => location.pathname);
      line(/terms/.test(left), `${tag}: after closing with X, Back leaves the page as normal`, `now at ${left}, history length was ${h2}`);
      line(w.errors.length === 0, `${tag}: zero console errors`, w.errors.slice(0, 3).join(' | ') || 'none');
      await ctx.close();
    }
    // builder: trying looks does not pile up Back presses
    const ctx = await ctxFor(vp, 'en');
    const page = await ctx.newPage();
    await page.goto(BASE + '/terms', { waitUntil: 'load' });
    await page.goto(BASE + '/builder', { waitUntil: 'load' }); await sleep(2000);
    const h0 = await page.evaluate(() => history.length);
    // the builder redraws its tiles after a pick, so each one is looked up again
    for (let i = 1; i < 5; i++) { const t = page.locator('.tile').nth(i); await t.scrollIntoViewIfNeeded(); await t.click(); await sleep(600); }
    const cat = page.locator('.cat').nth(1);
    if (await cat.count()) { await cat.click(); await sleep(600); }
    const h1 = await page.evaluate(() => history.length);
    line(h1 - h0 <= 1, `[${vp.id}] builder: five picks add at most one history entry`, `history ${h0} -> ${h1}`);
    await page.goBack(); await sleep(800);
    await page.goBack(); await sleep(1200);
    const at = await page.evaluate(() => location.pathname);
    line(/terms/.test(at), `[${vp.id}] builder: two Backs leave the builder`, 'now at ' + at);
    await ctx.close();
  }
  // the share menu on a phone without the Web Share API (the desktop-like menu)
}

// ---------------------------------------------------------------- language of the assistant
if (want('chat')) {
  for (const [lang, re, name] of [['he', /[\u05D0-\u05EA]/, 'Hebrew'], ['ru', /[\u0400-\u04FF]/, 'Russian'], ['en', /^[^\u0400-\u04FF\u05D0-\u05EA]*$/, 'English']]) {
    const ctx = await browser.newContext({ locale: lang === 'en' ? 'ru-RU' : 'en-US', viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript((l) => { try { localStorage.setItem('gvlang', l); } catch (e) {} }, lang);
    await ctx.route('**/*', (route) => {
      const h = route.request().headers();
      return route.continue({ headers: { ...h, 'accept-language': lang === 'en' ? 'ru-RU,ru' : 'en-US,en' } });
    });
    for (const p of ['/', '/builder']) {
      const page = await ctx.newPage();
      await page.goto(BASE + p, { waitUntil: 'load' }); await sleep(1500);
      const g = await page.evaluate(() => { const el = document.querySelector('#help-log .hm.bot, #gvpa-log .gvpa-m.bot'); return el ? el.textContent : ''; });
      line(re.test(g), `chat: greeting on ${p} follows the site language (${name}, browser in another language)`, g.slice(0, 70));
      await page.close();
    }
    await ctx.close();
    const origin = LIVE ? BASE : 'https://genvidpro.com';
    const r = await fetch(BASE + '/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }], s: 'qa-' + lang, p: { path: '/', lang } }) });
    const j = await r.json().catch(() => ({}));
    if (!LIVE && r.status !== 200) line(null, `chat: /chat in ${name} not testable locally`, 'status ' + r.status + ' ' + JSON.stringify(j).slice(0, 80));
    else line(r.status === 200 && re.test(j.reply || ''), `chat: /chat answers "hi" in the site language (${name})`, (j.reply || JSON.stringify(j)).slice(0, 120));
  }
  // the neural voice: no key means no throw and the browser voice path
  const r = await fetch(BASE + '/tts', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: LIVE ? BASE : 'http://localhost' }, body: JSON.stringify({ text: 'שלום', lang: 'he' }) });
  line(null, 'tts: /tts status', r.status + ' ' + (r.headers.get('content-type') || '') + ' ' + (r.headers.get('x-tts-cache') || ''));
  const ctx = await ctxFor(VIEWPORTS[0], 'he');
  const page = await ctx.newPage();
  const w = await watch(page);
  await page.goto(BASE + '/', { waitUntil: 'load' }); await sleep(1500);
  // the pill floats up and down forever, so Playwright never sees it "stable"
  await page.click('#help-pill', { force: true }); await sleep(300);
  await page.click('#gv-speak', { force: true }).catch(() => {});
  await page.evaluate(() => window.gvSay && window.gvSay('שלום, זו בדיקה'));
  await sleep(2500);
  const pageErr = w.errors.filter(e => /pageerror|Uncaught/.test(e));
  line(pageErr.length === 0, 'tts: speaker on with no key throws nothing', pageErr.join(' | ') || 'none');
  await ctx.close();
}

await browser.close();
const fails = results.filter(r => r.tag === 'FAIL');
console.log(`\n${results.filter(r => r.tag === 'PASS').length} PASS, ${fails.length} FAIL, ${results.filter(r => r.tag === 'INFO').length} INFO  (${BASE})`);
fs.writeFileSync(path.join(OUT, 'qa-results.json'), JSON.stringify(results, null, 1));
process.exit(fails.length ? 1 : 0);
