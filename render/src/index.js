/* gvp-render — the real browser behind the "see your site on three screens" checker.
 *
 *   GET /?u=<address>            -> { ok, cached, blocked, title, checks, shots, budget }
 *   GET /?u=<address>&pic=phone  -> image/jpeg straight from the 24 h cache
 *   GET /budget                  -> { usedMs, capMs, pct } (for the 70 % warning)
 *
 * Why it is a Worker of its own and not part of genvidpro.com's /preview.
 * Browser Rendering is driven by @cloudflare/puppeteer, an npm package that has to be
 * bundled. genvidpro.com is published by ops/deploy.sh, which copies the tracked files
 * into a clean directory and uploads that — no node_modules, by design, because that
 * directory IS the publish set. Dragging a bundler into the site's only deploy path to
 * add a widget is the wrong trade. So the browser lives here, and /preview calls it.
 *
 * Reading a stranger's site with a real browser is the whole point: Wix, Base44, Lovable,
 * WordPress, Duda and every React app that paints itself with JavaScript look like an
 * empty shell in the HTML and like a site in a browser. Everything here is measured on
 * the painted page, at a real phone's size.
 *
 * The budget. Workers Free gives 10 browser minutes a day for the whole account, three
 * browsers at once, and one new browser every 20 seconds. That is little, and this is a
 * public button on a sales page. So: every answer is cached for 24 hours per address,
 * sessions are reused instead of launched, the spend is counted in milliseconds per UTC
 * day, and when it runs out this says so plainly and /preview falls back to reading the
 * HTML. It never fails the check — a visitor sees their site either way.
 */

import puppeteer from '@cloudflare/puppeteer';

const CAP_MS = 10 * 60 * 1000;        // Workers Free: 10 browser minutes per UTC day
const STOP_AT = 0.97;                 // leave a sliver, the day's count is eventually consistent
const CACHE_TTL = 24 * 3600;        // one render per address per day, as asked
const NAV_MS = 20000;
const PHONE = { w: 390, h: 844, dpr: 3, mobile: true,
  ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36' };
const DESKTOP = { w: 1440, h: 900, dpr: 1, mobile: false,
  ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36' };

const JSON_H = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const PRIVATE = [
  /^localhost$/i, /\.local$/i, /\.internal$/i, /^127\./, /^0\./, /^10\./,
  /^192\.168\./, /^169\.254\./, /^172\.(1[6-9]|2\d|3[01])\./,
  /^\[?::1\]?$/, /^\[?fe80:/i, /^\[?fc00:/i, /^\[?fd/i, /^metadata\./i
];

function clean(raw) {
  let s = String(raw || '').trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  let u;
  try { u = new URL(s); } catch (e) { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  const h = u.hostname.toLowerCase();
  if (!/^[a-z0-9.\-[\]:]+$/i.test(h)) return null;
  if (h.indexOf('.') === -1 && h.indexOf(':') === -1) return null;
  for (const re of PRIVATE) if (re.test(h)) return null;
  u.hash = '';
  return u;
}

const AL_OK = /^[A-Za-z0-9,;=.\- ]{2,80}$/;
const day = () => new Date().toISOString().slice(0, 10);
const keyOf = (u, al) => 'rr:' + (al ? al.slice(0, 5).replace(/[^a-z-]/gi, '') + ':' : '') +
  u.toString().replace(/\/$/, '').toLowerCase();

async function budget(env) {
  let used = 0;
  try { used = parseInt((await env.EVENTS.get('brms:' + day())) || '0', 10) || 0; } catch (e) {}
  return { usedMs: used, capMs: CAP_MS, pct: Math.round((used / CAP_MS) * 100) };
}
async function spend(env, ms) {
  try {
    const k = 'brms:' + day();
    const n = (parseInt((await env.EVENTS.get(k)) || '0', 10) || 0) + Math.max(0, Math.round(ms));
    await env.EVENTS.put(k, String(n), { expirationTtl: 3 * 24 * 3600 });
  } catch (e) {}
}

/* ---- what is measured, and it is measured on the painted page ------------------- */

/* Everything below runs inside the visitor's site, in the browser, after it has drawn
   itself. Written as one string so it survives bundling unchanged. */
function measure() {
  const vw = window.innerWidth, vh = window.innerHeight;
  const seen = (el) => {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) return null;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return null;
    return { r, s };
  };
  const all = Array.prototype.slice.call(document.querySelectorAll('body *'), 0, 4000);

  /* 1. Does the page run off the side of the phone. The page's own scrollWidth is the
     honest answer; a fixed width in a stylesheet is not, because a media query may well
     have overridden it — that is what "fixed width 1280 px" on a perfectly good phone
     site came from. Only elements that really stick out are named, and only if nothing
     above them scrolls sideways on purpose (a carousel is not a fault). */
  const scrollW = Math.max(document.documentElement.scrollWidth, document.body ? document.body.scrollWidth : 0);
  const overflow = Math.max(0, Math.round(scrollW - vw));
  let widest = 0, widestSel = '';
  if (overflow > 2) {
    for (const el of all) {
      const v = seen(el); if (!v) continue;
      if (v.s.position === 'fixed' || v.s.position === 'sticky') continue;
      if (v.r.right <= vw + 2 && v.r.left >= -2) continue;
      let skip = false;
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === 'auto' || ox === 'scroll' || ox === 'hidden') { skip = true; break; }
      }
      if (skip) continue;
      const w = Math.round(v.r.width);
      if (w > widest) {
        widest = w;
        widestSel = (el.tagName.toLowerCase() +
          (el.id ? '#' + el.id : '') +
          (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : '')).slice(0, 40);
      }
    }
  }

  /* 2. The smallest type a visitor is actually asked to read. Only elements holding
     their own words count, so a wrapper does not inherit the blame. */
  let minFont = 0, minFontText = '';
  for (const el of all) {
    let own = '';
    for (const n of el.childNodes) if (n.nodeType === 3) own += n.nodeValue;
    own = own.replace(/\s+/g, ' ').trim();
    if (own.length < 8) continue;
    const v = seen(el); if (!v) continue;
    const f = parseFloat(v.s.fontSize) || 0;
    if (f > 0 && (minFont === 0 || f < minFont)) { minFont = f; minFontText = own.slice(0, 40); }
  }

  /* 3. Things meant to be tapped. Apple and Google both say 44 px; below that a thumb
     hits the wrong one. */
  let taps = 0, tapsSmall = 0;
  for (const el of document.querySelectorAll('a[href], button, [role="button"], input[type="submit"], input[type="button"], select, summary')) {
    const v = seen(el); if (!v) continue;
    taps++;
    if (v.r.width < 44 || v.r.height < 44) tapsSmall++;
  }

  /* 4. Counters that never started. A studio's "0 projects, 0 clients, 0 years" is a
     script that failed, and it is the first thing a visitor reads as "dead site". */
  let zeros = 0;
  for (const el of document.querySelectorAll('[class*="count" i],[class*="counter" i],[class*="stat" i],[class*="number" i],[class*="odometer" i],[data-count],[data-to],[data-end],[data-counter]')) {
    const v = seen(el); if (!v) continue;
    if (el.querySelector('*')) continue;
    if (/^0\s*[+%]?$/.test((el.textContent || '').trim())) zeros++;
  }

  /* 5. Words sitting on top of other words. Only leaves with their own text are compared,
     and only against near neighbours, so this stays cheap and does not flag a caption
     that merely sits inside its picture's box. */
  const leaves = [];
  for (const el of all) {
    if (el.querySelector('*')) continue;
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (t.length < 4) continue;
    const v = seen(el); if (!v) continue;
    if (v.s.position === 'fixed' || v.s.position === 'sticky') continue;
    leaves.push(v.r);
    if (leaves.length > 400) break;
  }
  leaves.sort((a, b) => a.top - b.top);
  let overlaps = 0;
  for (let i = 0; i < leaves.length; i++) {
    for (let j = i + 1; j < Math.min(leaves.length, i + 12); j++) {
      const a = leaves[i], b = leaves[j];
      if (b.top > a.bottom) break;
      const ow = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const oh = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (ow <= 1 || oh <= 1) continue;
      const small = Math.min(a.width * a.height, b.width * b.height);
      if (small > 0 && (ow * oh) / small > 0.45) overlaps++;
    }
  }

  /* 6. A screenful of nothing. A block as wide as the screen and a third of it tall with
     no words, no picture and no colour in it is a section that did not load. */
  let emptyBig = 0, emptyMax = 0;
  for (const el of all) {
    const v = seen(el); if (!v) continue;
    if (v.r.width < vw * 0.8 || v.r.height < vh * 0.35) continue;
    if ((el.textContent || '').trim().length) continue;
    if (el.querySelector('img,svg,video,canvas,iframe,picture')) continue;
    const bg = v.s.backgroundImage, bc = v.s.backgroundColor;
    if (bg && bg !== 'none') continue;
    if (bc && bc !== 'transparent' && !/rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0\s*\)/.test(bc)) continue;
    emptyBig++;
    if (v.r.height > emptyMax) emptyMax = Math.round(v.r.height);
  }

  const text = (document.body ? document.body.innerText || '' : '').replace(/\s+/g, ' ').trim();
  const he = (text.match(/[א-ת]/g) || []).length;
  const ar = (text.match(/[ؠ-ي]/g) || []).length;
  const latin = (text.match(/[A-Za-zЀ-ӿ]/g) || []).length;

  return {
    vw, overflow, widest, widestSel,
    minFont: Math.round(minFont * 10) / 10, minFontText,
    taps, tapsSmall, zeros, overlaps, emptyBig, emptyMax,
    dir: getComputedStyle(document.body || document.documentElement).direction,
    he, ar, latin,
    tel: !!document.querySelector('a[href^="tel:"]'),
    chat: !!document.querySelector('a[href*="wa.me"],a[href*="whatsapp"],a[href*="t.me"],a[href*="m.me"]'),
    manifest: !!document.querySelector('link[rel~="manifest"]'),
    imgs: document.images.length,
    lazyMissing: Array.prototype.filter.call(document.images, (i) => i.loading !== 'lazy').length,
    title: (document.title || '').trim().slice(0, 90),
    textLen: text.length,
    links: document.querySelectorAll('a[href]').length,
    sample: text.slice(0, 400)
  };
}

/* A firewall's refusal is not a verdict on the site. F5, Imperva, Cloudflare, Sucuri and
   Akamai all answer a machine with a page that parses perfectly and says nothing, and
   reading one as a site told a customer their working site was empty and uninstallable.
   When this is what came back, the check says so and shows no findings at all. */
const BLOCK_RE = /the requested url was rejected|request rejected|access denied|you have been blocked|attention required|just a moment|checking your browser|incapsula|imperva|sucuri website firewall|cloudflare to restrict access|error 102[0-9]|ddos protection by|bot detection|captcha|are you a robot|verify you are human/i;
function blockedBy(m, status) {
  const hay = ((m && m.title) || '') + ' ' + ((m && m.sample) || '');
  if (BLOCK_RE.test(hay)) return true;
  // a page with almost no words and almost no links, answered with a refusal code
  if ((status === 403 || status === 401 || status === 406 || status === 429) &&
      (!m || (m.textLen < 400 && m.links < 3))) return true;
  return false;
}

/* ---- the session ------------------------------------------------------------------ */

/* One browser for both screens, and an existing one wherever possible: a new browser is
   the expensive part of the budget and Free allows one every 20 seconds. */
async function open(env) {
  try {
    const list = await puppeteer.sessions(env.BROWSER);
    const free = list.filter((s) => !s.connectionId);
    for (const s of free.sort(() => Math.random() - 0.5).slice(0, 3)) {
      try { return { browser: await puppeteer.connect(env.BROWSER, s.sessionId), fresh: false }; } catch (e) {}
    }
  } catch (e) {}
  return { browser: await puppeteer.launch(env.BROWSER, { keep_alive: 600000 }), fresh: true };
}

async function screen(browser, u, dev, al) {
  const ctx = await browser.createBrowserContext();
  try {
    const page = await ctx.newPage();
    await page.setUserAgent(dev.ua);
    // the visitor's own language, so the drawn page matches the live one beside it
    if (al) { try { await page.setExtraHTTPHeaders({ 'Accept-Language': al }); } catch (e) {} }
    await page.setViewport({ width: dev.w, height: dev.h, deviceScaleFactor: dev.dpr, isMobile: dev.mobile, hasTouch: dev.mobile });
    let status = 0, finalUrl = u.toString();
    try {
      const r = await page.goto(u.toString(), { waitUntil: 'networkidle2', timeout: NAV_MS });
      if (r) { status = r.status(); finalUrl = r.url(); }
    } catch (e) {
      // a page that never goes quiet is still a page; whatever is painted is judged
      try { finalUrl = page.url(); } catch (e2) {}
    }
    let m = null;
    try { m = await page.evaluate(measure); } catch (e) {}
    /* The phone screens are scrolled by the visitor, so the phone picture is the whole
       page, not the first screenful: the frame becomes a window that slides down it. The
       laptop frame stays a live page and needs only one screen. */
    let shot = '', shotH = 0;
    try {
      const full = !!dev.mobile;
      const b = await page.screenshot({ type: 'jpeg', quality: 55, fullPage: full, captureBeyondViewport: full });
      shot = btoa(String.fromCharCode.apply(null, new Uint8Array(b)));
      if (full) { try { shotH = await page.evaluate(() => document.documentElement.scrollHeight); } catch (e) {} }
    } catch (e) {}
    return { m, shot, shotH, status, finalUrl };
  } finally {
    try { await ctx.close(); } catch (e) {}
  }
}

/* The findings, from the two painted pages. Everything a visitor can feel. */
function checksOf(phone, desk, finalUrl, httpOpen) {
  const p = phone.m || {}, d = (desk && desk.m) || {};
  const rtlText = (p.he + p.ar) >= 30 && (p.he + p.ar) > p.latin * 0.6 ? (p.he >= p.ar ? 'he' : 'ar') : '';
  return {
    // "no phone layout" is now what it says: the page runs off the side of a real phone
    overflow: p.overflow || 0,
    widest: p.widest || 0,
    widestSel: p.widestSel || '',
    minFont: p.minFont || 0,
    taps: p.taps || 0,
    tapsSmall: p.tapsSmall || 0,
    zeros: p.zeros || 0,
    overlaps: p.overlaps || 0,
    emptyBig: p.emptyBig || 0,
    emptyMax: p.emptyMax || 0,
    rtl: rtlText && p.dir !== 'rtl' ? rtlText : '',
    rtlText,
    call: !!(p.tel || p.chat),
    install: !!p.manifest,
    imgs: p.imgs || 0,
    lazyMissing: p.lazyMissing || 0,
    deskOverflow: d.overflow || 0,
    https: finalUrl.indexOf('https://') === 0 && !httpOpen,
    httpOpen: !!httpOpen,
    rendered: true
  };
}

/* Is the site also reachable, unencrypted, at http — which is what a visitor typing the
   bare name gets. bar-nikuy.co.il answers both and redirects neither, so every browser
   marks it not secure while a check that only ever asked for https called it fine. */
async function httpIsOpen(u) {
  if (u.protocol !== 'https:') return true;
  try {
    const r = await fetch('http://' + u.host + u.pathname, {
      redirect: 'manual', signal: AbortSignal.timeout(6000),
      headers: { 'User-Agent': PHONE.ua }
    });
    if (r.status >= 300 && r.status < 400) {
      const loc = String(r.headers.get('location') || '');
      return !/^https:/i.test(loc) && !/^\/\//.test(loc);
    }
    return r.status === 200;
  } catch (e) { return false; }
}

async function render(env, u, al) {
  const b = await budget(env);
  if (b.usedMs >= CAP_MS * STOP_AT) return { ok: false, why: 'busy', budget: b };

  const t0 = Date.now();
  let browser = null, out = null;
  try {
    const s = await open(env);
    browser = s.browser;
    const httpOpen = await httpIsOpen(u);
    const phone = await screen(browser, u, PHONE, al);
    const desk = await screen(browser, u, DESKTOP, al);
    const finalUrl = phone.finalUrl || u.toString();
    const blocked = blockedBy(phone.m, phone.status);
    out = {
      ok: true,
      url: finalUrl,
      title: (phone.m && phone.m.title) || '',
      status: phone.status,
      blocked,
      checks: blocked ? null : checksOf(phone, desk, finalUrl, httpOpen),
      shots: blocked ? {} : { phone: phone.shot, desktop: desk.shot },
      // how tall the phone picture is in the page's own pixels, so the frame knows how far it scrolls
      shotH: phone.shotH || 0
    };
  } catch (e) {
    const why = /429|time limit|limit exceeded/i.test(String(e && e.message)) ? 'busy' : 'render_failed';
    out = { ok: false, why, detail: String(e && e.message).slice(0, 200) };
  } finally {
    // the session stays alive on purpose: the next check connects instead of launching
    try { if (browser) await browser.disconnect(); } catch (e) {}
  }
  const ms = Date.now() - t0;
  await spend(env, ms);
  out.ms = ms;
  out.budget = await budget(env);
  return out;
}

/* There is no door on this from the internet. wrangler.toml sets workers_dev = false and
   no route, so the only caller is genvidpro.com's /preview through its service binding.
   That is why there is no shared secret here: a secret that lives in the config of a
   Worker nobody can reach buys nothing and has to be kept somewhere. */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/budget') {
      return new Response(JSON.stringify(await budget(env)), { headers: JSON_H });
    }
    const u = clean(url.searchParams.get('u'));
    if (!u) return new Response(JSON.stringify({ ok: false, why: 'bad_address' }), { status: 400, headers: JSON_H });

    const al = AL_OK.test(String(url.searchParams.get('al') || '')) ? url.searchParams.get('al') : '';
    const key = keyOf(u, al);
    const pic = url.searchParams.get('pic');
    let hit = null;
    try { hit = await env.EVENTS.get(key, 'json'); } catch (e) {}

    if (pic === 'phone' || pic === 'desktop') {
      const b64 = hit && hit.shots && hit.shots[pic];
      if (!b64) return new Response(JSON.stringify({ ok: false, why: 'no_shot' }), { status: 404, headers: JSON_H });
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new Response(bytes, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=3600' } });
    }

    if (hit) {
      return new Response(JSON.stringify(Object.assign({}, hit, { cached: true, shots: undefined, budget: await budget(env) })), { headers: JSON_H });
    }

    const out = await render(env, u, al);
    if (out.ok) {
      try { await env.EVENTS.put(key, JSON.stringify(out), { expirationTtl: CACHE_TTL }); } catch (e) {}
    }
    return new Response(JSON.stringify(Object.assign({}, out, { cached: false, shots: undefined })), {
      status: out.ok ? 200 : (out.why === 'busy' ? 503 : 502), headers: JSON_H
    });
  }
};
