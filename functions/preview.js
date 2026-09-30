// Cloudflare Pages Function: /preview
//
// Behind the "see your site on three screens" tool in the APP block.
//
//   GET /preview?u=<address>             -> {ok, url, title, frameable, why, checks, blocked, busy}
//   GET /preview?u=<address>&pic=phone|desktop -> image/jpeg, the server-rendered screen
//   GET /preview?budget=1               -> {usedMs, capMs, pct} of today's free browser time
//   GET /preview?u=<address>&render=1    -> text/html, a reconstructed copy of the page
//   ...&al=<Accept-Language>             -> read the page in the visitor's own language
//   GET /preview?u=<address>&shot=mobile|desktop -> image/jpeg (PageSpeed screenshot, kept
//                                            for the record, the page no longer asks for it)
//
// Why it exists at all. The three screens are the visitor's own site shown inside
// three frames of real device sizes, live, in their own browser: free, instant, and
// the truest picture there is. But a great many sites forbid being framed
// (X-Frame-Options, or a CSP frame-ancestors rule), and a forbidden frame goes
// silently blank. So the page asks here first, and this reads the site's own headers
// and says plainly whether a frame will work.
//
// When it will not (15.09.2026, barbarashop.co.il gave the visitor three empty
// screens, the very moment we are meant to sell), the page is rebuilt from the HTML
// downloaded here: their scripts are taken out, a <base> pointing at their own
// address is put first in the head so their CSS, fonts and pictures load from their
// own server, and it is served from this function with its own locked-down policy
// (no script of any kind, sandboxed). It is always captioned on the page as a
// reconstructed preview with scripts off, so it is never passed off as the live site.
// It is served from here rather than written into srcdoc because a srcdoc frame
// inherits the CSP of genvidpro.com, which would block every stylesheet and picture
// of a stranger's site; opening that policy up for the whole site was the worse deal.
//
// 29.09.2026: the findings no longer come from the HTML. A real Chromium renders the
// page at a phone's size (390 x 844, DPR 3, phone user agent) and at 1440 x 900, and the
// faults are measured on what it painted — because Wix, Base44, Lovable, Duda and every
// React app ship an empty shell in the HTML and build the site in the browser. That
// browser is the gvp-render Worker (render/ in this repo), reached over a service
// binding; it has no public address of its own. Reading the HTML is kept underneath, for
// the minutes when the day's free browser budget is gone: then the check still answers,
// it just says less, and it says which it did.
//
// The address comes from a stranger's keyboard, so it is checked before anything is
// fetched: http and https only, no loopback, no private range, no cloud metadata
// address. Nothing from the answer is executed or stored.

const OURS = ['genvidpro.com', 'www.genvidpro.com'];
const PER_IP_HOUR = 40;
// one lookup (capped above at 40 an hour) opens up to three rebuilt screens, plus the
// tab switches on a phone and a redraw after a language switch
const RENDER_PER_IP_HOUR = 400;

function hostOf(u) { try { return new URL(u).hostname.toLowerCase(); } catch (e) { return ''; } }
function ours(h) { return !!h && (OURS.indexOf(h) !== -1 || h === 'genvidpro.pages.dev' || h.endsWith('.genvidpro.pages.dev')); }
// `wrangler pages dev` serves the same file from localhost, and a tool that cannot be
// tried before it is deployed gets deployed broken. In production this is never true.
function dev(request) { const h = hostOf(request.url); return h === 'localhost' || h === '127.0.0.1'; }
function caller(request) {
  return hostOf(request.headers.get('Origin') || '') || hostOf(request.headers.get('Referer') || '');
}

// Anything that is not a public web address on the open internet is refused.
const PRIVATE = [
  /^localhost$/i, /\.local$/i, /\.internal$/i, /^127\./, /^0\./, /^10\./,
  /^192\.168\./, /^169\.254\./, /^172\.(1[6-9]|2\d|3[01])\./,
  /^\[?::1\]?$/, /^\[?fe80:/i, /^\[?fc00:/i, /^\[?fd/i, /^metadata\./i
];

export function clean(raw) {
  let s = String(raw || '').trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  let u;
  try { u = new URL(s); } catch (e) { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  const h = u.hostname.toLowerCase();
  // A bare word is not an address: there has to be a dot and a top-level part.
  if (!/^[a-z0-9.\-[\]:]+$/i.test(h)) return null;
  if (h.indexOf('.') === -1 && h.indexOf(':') === -1) return null;
  for (const re of PRIVATE) if (re.test(h)) return null;
  u.hash = '';
  return u;
}

async function bump(env, key, cap) {
  if (!env.EVENTS) return false;
  try {
    const n = parseInt((await env.EVENTS.get(key)) || '0', 10);
    if (n >= cap) return true;
    await env.EVENTS.put(key, String(n + 1), { expirationTtl: 3600 });
  } catch (e) { return false; }
  return false;
}

// Will a frame of ours be allowed to show this site. Two headers decide it, and a
// site may send either or both. Our own site allows 'self', which is us.
export function framePolicy(h, target) {
  const mine = ours(target);
  const xfo = String(h.get('x-frame-options') || '').toLowerCase();
  if (xfo.indexOf('deny') !== -1) return { frameable: false, why: 'x-frame-options: deny' };
  if (xfo.indexOf('sameorigin') !== -1 && !mine) return { frameable: false, why: 'x-frame-options: sameorigin' };
  const csp = String(h.get('content-security-policy') || '').toLowerCase();
  const m = /frame-ancestors([^;]*)/.exec(csp);
  if (m) {
    const v = m[1];
    if (/'none'/.test(v)) return { frameable: false, why: "frame-ancestors 'none'" };
    const listed = /genvidpro\.com|\*|https:(\s|$)/.test(v) || (mine && /'self'/.test(v));
    if (!listed) return { frameable: false, why: 'frame-ancestors does not list us' };
  }
  return { frameable: true, why: '' };
}

// A page in windows-1255 (plenty of older Israeli sites) read as UTF-8 comes out as
// question marks, and then neither the Hebrew check nor the preview is any good.
function charsetOf(ct, head) {
  const a = /charset\s*=\s*["']?([\w-]+)/i.exec(ct || '');
  if (a) return a[1].toLowerCase();
  const b = /<meta[^>]+charset\s*=\s*["']?([\w-]+)/i.exec(head || '');
  return b ? b[1].toLowerCase() : 'utf-8';
}
function decode(buf, ct) {
  const head = new TextDecoder('latin1').decode(buf.slice(0, 4096));
  const cs = charsetOf(ct, head);
  try { return new TextDecoder(cs).decode(buf); } catch (e) {}
  return new TextDecoder('utf-8').decode(buf);
}

/* The visitor's own language goes with the request. 29.09.2026: the desktop frame is the
   live site and answers in whatever language the visitor is reading in, while the phone
   frames are built from a copy this fetched — and this always asked in Hebrew. So a
   visitor reading in English saw an English laptop next to two Hebrew phones, or the
   reverse, and read it as the checker being broken. One language, all three screens. */
const AL_OK = /^[A-Za-z0-9,;=.\- ]{2,80}$/;
function acceptLanguage(raw) {
  const s = String(raw || '').trim();
  return AL_OK.test(s) ? s : 'he-IL,he;q=0.9,en;q=0.8';
}

async function fetchPage(u, al) {
  return fetch(u.toString(), {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36 GenVidPro-preview',
      'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
      'Accept-Language': acceptLanguage(al)
    },
    signal: AbortSignal.timeout(9000)
  });
}

// ---- what is wrong with the page, read from the page itself ----------------------

function stripMinWidthMedia(css) {
  // A container that is 1170 px wide only from 1200 px up is responsive, not fixed.
  let out = '', i = 0;
  const re = /@media[^{]*min-width[^{]*\{/gi;
  let m;
  while ((m = re.exec(css))) {
    out += css.slice(i, m.index);
    let depth = 1, j = re.lastIndex;
    while (j < css.length && depth) { const c = css[j++]; if (c === '{') depth++; else if (c === '}') depth--; }
    i = j; re.lastIndex = j;
  }
  return out + css.slice(i);
}

const CONTAINER = /(^|[\s.#,>])(html|body|container|wrapper|wrap|main|page|site|content|layout|outer|inner|holder|shell)\b/i;
function widestRule(css) {
  let best = 0, sel = '';
  const flat = stripMinWidthMedia(css.replace(/\/\*[\s\S]*?\*\//g, ''));
  const re = /([^{}]{1,200})\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(flat))) {
    const s = m[1].trim();
    if (s.charAt(0) === '@' || !CONTAINER.test(s)) continue;
    const w = /(?:^|[;\s{])width\s*:\s*(\d{3,4})px/i.exec(m[2]);
    if (w) { const n = +w[1]; if (n > 500 && n > best) { best = n; sel = s.slice(0, 40); } }
  }
  return { w: best, sel };
}

function inlineWidest(html) {
  let best = 0;
  const re = /<(div|table|section|main|header|footer|body|form|ul|nav|center|td|article)\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[0];
    const st = /style\s*=\s*(["'])([^"']*)\1/i.exec(tag);
    if (st) {
      const w = /(?:^|[;\s])width\s*:\s*(\d{3,4})px/i.exec(st[2]);
      if (w && +w[1] > 500 && +w[1] > best) best = +w[1];
    }
    const a = /\swidth\s*=\s*["']?(\d{3,4})["'\s>]/i.exec(tag);
    if (a && +a[1] > 500 && +a[1] > best) best = +a[1];
  }
  return best;
}

function textOf(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
}

/* How many things the page actually asks the network for on first open. The chip says
   "N requests on first open", so it has to be requests.

   29.09.2026: it was `<script` plus `<link`, counted as tags. genvidpro.com has 27 script
   tags of which 23 are inline — inline script is zero requests — and 14 link tags of which
   preconnect, dns-prefetch and canonical fetch nothing at all. That came to 41 and earned
   our own clean site a red "41 requests on first open" chip in its own checker. Only tags
   that cause a fetch are counted now: a script with a src, a link whose rel actually
   downloads something, and the images. */
// rel is a space-separated list of whole words, so it is split rather than searched:
// "dns-prefetch" contains "prefetch", and a regex with \b happily matched it — a socket
// being opened early is not a request. Caught by scripts/preview-unit.mjs.
const FETCHING_REL = ['stylesheet', 'preload', 'modulepreload', 'prefetch', 'prerender',
  'icon', 'shortcut', 'apple-touch-icon', 'apple-touch-startup-image', 'manifest', 'mask-icon'];
/* How many kilobytes of HTML the visitor actually downloads.

   29.09.2026, creativity32.com: the chip said "837 KB of html" in red. The visitor
   downloads 154 KB — the site is served brotli-compressed, as almost every site is, and
   this was measuring the decompressed source and charging the visitor for it. Worse, it
   ranked backwards: busi.co.il, the genuinely poor site in this set, decompresses to 625 KB
   and stayed under the line while a healthy Wix studio went red. Measured against curl on
   29.09.2026: wire/gzip(6) KB were 154/162, 115/121, 28/24, 33/33, 93/94 for creativity32,
   busi, dalba, bar-nikuy and genvidpro — so compressing it here tracks the wire within a
   few per cent, and that is what the number means now.

   The fetch above hands us the decompressed text (a Worker's subrequest always decompresses
   and drops content-length), so the only way to know the transfer size is to compress it
   back. If CompressionStream is ever missing, a flat fifth is used rather than the raw
   length: wrong by a little is recoverable, wrong by five times is what put a red chip on a
   working business. */
export async function transferKb(html) {
  const bytes = new TextEncoder().encode(html);
  try {
    const cs = new CompressionStream('gzip');
    const packed = new Response(new Blob([bytes]).stream().pipeThrough(cs));
    return Math.round((await packed.arrayBuffer()).byteLength / 1024);
  } catch (e) {
    return Math.round(bytes.length / 5 / 1024);
  }
}

export function requestCount(html, imgs) {
  const src = (html.match(/<script\b[^>]*\ssrc\s*=/gi) || []).length;
  let links = 0;
  const re = /<link\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const rel = /\srel\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(m[0]);
    const v = rel ? (rel[2] || rel[3] || rel[4] || '') : '';
    // no rel at all fetches nothing; preconnect and dns-prefetch open a socket, not a request
    if (v && v.toLowerCase().split(/\s+/).some(t => FETCHING_REL.indexOf(t) !== -1)) links++;
  }
  return src + links + (imgs || 0);
}

async function checksOf(html, finalUrl, headers) {
  const head = html.slice(0, 200000);
  const vpTag = /<meta[^>]+name\s*=\s*["']?viewport["']?[^>]*>/i.exec(head);
  let vp = 'missing', vpW = 0;
  if (vpTag) {
    // width=device-width is the usual spelling, but initial-scale=1 on its own does
    // the same job and plenty of sites write only that.
    // 29.09.2026, creativity32.com: Wix (and other builders with a separate phone site)
    // answer a phone with its own page and a fixed viewport, width=320. That page IS the
    // phone layout, drawn 320 wide and stretched to the screen. Reading it as "no phone
    // layout" told a studio its good phone site was broken, and it opens fine on any phone.
    // A fixed width up to 600 is a phone layout; 700 and up is a desktop page and stays missing.
    const t = vpTag[0];
    const fw = /(?:^|[\s,;"'])width\s*=\s*(\d{3,4})\b/i.exec(t);
    const phoneW = fw && +fw[1] >= 240 && +fw[1] <= 600 ? +fw[1] : 0;
    if (/device-width|initial-scale\s*=\s*1/i.test(t) || phoneW) {
      vp = /user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/i.test(t) ? 'locked' : 'ok';
      if (phoneW && !/device-width/i.test(t)) vpW = phoneW;
    }
  }

  const text = textOf(html);
  const he = (text.match(/[א-ת]/g) || []).length;
  const ar = (text.match(/[ؠ-ي]/g) || []).length;
  // The page has to be mostly in Hebrew or Arabic: wikipedia.org lists "العربية" among
  // its languages and is rightly left to right.
  const latin = (text.match(/[A-Za-zЀ-ӿ]/g) || []).length;
  const rtlMain = (he + ar) >= 30 && (he + ar) > latin * 0.6;
  const rtlScript = !rtlMain ? '' : (he >= ar ? 'he' : 'ar');

  const styles = (html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || []).join('\n');
  let css = styles;
  // The main stylesheet decides the container width, so up to two of the page's own
  // stylesheets are read too, briefly and capped.
  const links = [];
  const lre = /<link\b[^>]*rel\s*=\s*["']?stylesheet[^>]*>/gi;
  let lm;
  while ((lm = lre.exec(head)) && links.length < 2) {
    const h = /href\s*=\s*["']([^"']+)["']/i.exec(lm[0]);
    if (!h) continue;
    try {
      const abs = new URL(h[1].replace(/&amp;/g, '&'), finalUrl);
      if (abs.hostname !== new URL(finalUrl).hostname) continue;
      links.push(abs.toString());
    } catch (e) {}
  }
  await Promise.all(links.map(async (l) => {
    try {
      const r = await fetch(l, { signal: AbortSignal.timeout(4000) });
      if (r.ok) css += '\n' + (await r.text()).slice(0, 400000);
    } catch (e) {}
  }));

  const htmlTag = /<html\b[^>]*>/i.exec(head);
  const bodyTag = /<body\b[^>]*>/i.exec(html);
  const dirRtl = (t) => !!t && (/\sdir\s*=\s*["']?rtl/i.test(t[0]) || /direction\s*:\s*rtl/i.test(t[0]));
  const rtlDir = dirRtl(htmlTag) || dirRtl(bodyTag) || /(^|[}\s,])(html|body)[^{}]*\{[^}]*direction\s*:\s*rtl/i.test(css);

  const rule = widestRule(css);
  /* 29.09.2026, dalba.co.il: ".boxed-layout #wrap { width: 1280px }" earned it "fixed
     width 1280 px" while the site is perfectly fine on a phone — a later rule narrows it.
     Reading widths out of a stylesheet cannot know that; only a rendered page can. So in
     this fallback the width is only held against a page that has no phone layout at all,
     where it is corroborated. When the browser ran, its measured overflow replaces it. */
  const fixedW = vp === 'missing' ? Math.max(rule.w, inlineWidest(html)) : 0;

  const imgTags = html.match(/<img\b[^>]*>/gi) || [];
  const lazyMissing = imgTags.filter(t => !/loading\s*=\s*["']?lazy/i.test(t) && !/data-(lazy-)?src|lazyload/i.test(t)).length;

  return {
    vp,
    // set only for a separate phone page served by user agent: the page draws those
    // phone frames from our phone-agent copy, a visitor's desktop browser would get the desktop site
    vpW,
    rtl: rtlScript && !rtlDir ? rtlScript : '',
    rtlText: rtlScript,
    fixedW,
    fixedSel: rule.w === fixedW ? rule.sel : '',
    install: /<link[^>]+rel\s*=\s*["']?[^"'>]*manifest/i.test(head) || /serviceWorker\s*\.\s*register/i.test(html),
    call: /href\s*=\s*["']?\s*tel:/i.test(html) || /wa\.me\/|api\.whatsapp\.com|whatsapp:\/\/|web\.whatsapp\.com|chat\.whatsapp\.com/i.test(html),
    imgs: imgTags.length,
    lazyMissing,
    reqs: requestCount(html, imgTags.length),
    kb: await transferKb(html),
    https: finalUrl.indexOf('https://') === 0,
    // filled in by the caller: whether the same site also answers, unencrypted, at http
    httpOpen: false,
    // these come from the HTML, not from a browser that drew the page
    rendered: false
  };
}

/* 29.09.2026: the page showed "GenVidPro &amp;amp; Video Studio". A title is HTML, so it
   arrives as "&amp;" and "&mdash;"; the page then escapes it again on the way to the
   screen, and one ampersand becomes three. Decoded once here, where the HTML is read, and
   escaped once there, where it is written. The render Worker needs none of this: it reads
   document.title, which the browser has already decoded. */
const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0', shy: '',
  mdash: '\u2014', ndash: '\u2013', hellip: '\u2026', middot: '\u00b7', bull: '\u2022',
  laquo: '\u00ab', raquo: '\u00bb', lsquo: '\u2018', rsquo: '\u2019',
  ldquo: '\u201c', rdquo: '\u201d', trade: '\u2122', reg: '\u00ae', copy: '\u00a9',
  deg: '\u00b0', euro: '\u20ac', pound: '\u00a3', times: '\u00d7', divide: '\u00f7'
};
export function unentity(s) {
  return String(s).replace(/&(#[0-9]{1,7}|#x[0-9a-f]{1,6}|[a-z][a-z0-9]{1,9});/gi, (m, g) => {
    if (g.charAt(0) === '#') {
      const n = g.charAt(1).toLowerCase() === 'x' ? parseInt(g.slice(2), 16) : parseInt(g.slice(1), 10);
      if (!(n > 0 && n <= 0x10ffff) || (n >= 0xd800 && n <= 0xdfff)) return m;
      try { return String.fromCodePoint(n); } catch (e) { return m; }
    }
    const k = g.toLowerCase();
    return Object.prototype.hasOwnProperty.call(ENTITIES, k) ? ENTITIES[k] : m;
  });
}

export function titleOf(html) {
  const m = /<title[^>]*>([\s\S]{0,400}?)<\/title>/i.exec(html || '');
  if (!m) return '';
  return unentity(m[1].replace(/\s+/g, ' ').trim()).replace(/\s+/g, ' ').trim().slice(0, 90);
}


// ---- the browser, the firewall, and http ------------------------------------------

/* A firewall's refusal parses like any other page and says nothing. musach-victor.co.il
   answers a check with F5's "The requested URL was rejected", and reading it as a site
   reported a healthy business as having no phone link, no manifest and no Hebrew. A
   refusal is not a verdict: it is reported as one, and no findings are shown. */
const BLOCK_RE = /the requested url was rejected|request rejected|access denied|you have been blocked|attention required|just a moment|checking your browser|incapsula|imperva|sucuri website firewall|error 102[0-9]|ddos protection by|are you a robot|verify you are human|enable javascript and cookies to continue/i;
export function blockedHtml(html, status) {
  const t = titleOf(html) + ' ' + textOf(html).replace(/\s+/g, ' ').slice(0, 600);
  if (BLOCK_RE.test(t)) return true;
  if (status === 403 || status === 401 || status === 406 || status === 429) {
    const words = textOf(html).replace(/\s+/g, ' ').trim().length;
    if (words < 400 && (html.match(/<a\b/gi) || []).length < 3) return true;
  }
  return false;
}

/* Is the same site also served, unencrypted, at http. bar-nikuy.co.il answers both and
   redirects neither, so the visitor who types the bare name lands on http and every
   browser marks it "not secure" — while a check that only ever asked for https called it
   fine. What the visitor gets is what counts. */
async function httpIsOpen(u) {
  if (u.protocol !== 'https:') return true;
  /* Not our own zone. A Worker's subrequest to the zone it runs on is served from inside
     Cloudflare and never meets the edge rule that redirects http to https, so genvidpro.com
     answered its own probe with a 200 and earned itself a "not secure" chip it does not
     deserve. Every other host is measured honestly; checked against curl on 29.09.2026,
     busi, dalba, creativity32 and wikipedia all 301, bar-nikuy and example.com do not. */
  if (ours(u.hostname.toLowerCase())) return false;
  try {
    const r = await fetch('http://' + u.host + u.pathname, {
      redirect: 'manual', signal: AbortSignal.timeout(6000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile Safari/537.36 GenVidPro-preview' }
    });
    if (r.status >= 300 && r.status < 400) {
      const loc = String(r.headers.get('location') || '');
      return !/^https:/i.test(loc) && !/^\/\//.test(loc);
    }
    return r.status === 200;
  } catch (e) { return false; }
}

/* The render Worker. No public address: it is only reachable through this binding.
   Anything it cannot do — no binding, out of daily browser budget, a page it could not
   open — comes back as a plain answer and the HTML reading takes over. */
async function askRender(env, u, pic, al) {
  if (!env.RENDER) return null;
  const q = 'https://gvp-render/?u=' + encodeURIComponent(u.toString()) +
    (pic ? '&pic=' + pic : '') + (al ? '&al=' + encodeURIComponent(al) : '');
  try {
    const r = await env.RENDER.fetch(q, { signal: AbortSignal.timeout(50000) });
    if (pic) return r;
    return await r.json();
  } catch (e) { return pic ? null : { ok: false, why: 'render_failed' }; }
}

// ---- the reconstructed page -------------------------------------------------------

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

function rebuild(html, finalUrl) {
  let h = html;
  h = h.replace(/<script\b[\s\S]*?<\/script\s*>/gi, '');
  h = h.replace(/<script\b[^>]*\/?>/gi, '');
  h = h.replace(/<iframe\b[\s\S]*?<\/iframe\s*>/gi, '');
  h = h.replace(/<base\b[^>]*>/gi, '');
  h = h.replace(/<meta[^>]+http-equiv\s*=\s*["']?(refresh|content-security-policy|content-type)[^>]*>/gi, '');
  h = h.replace(/<meta[^>]+charset[^>]*>/gi, '');
  // handlers never run here (no script is allowed), removed all the same
  h = h.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  // Pictures that a script would have swapped in: without scripts they stay empty.
  h = h.replace(/<img\b[^>]*>/gi, (tag) => {
    const ds = /\sdata-(?:lazy-)?src\s*=\s*["']([^"']+)["']/i.exec(tag);
    const dss = /\sdata-(?:lazy-)?srcset\s*=\s*["']([^"']+)["']/i.exec(tag);
    let t = tag;
    if (ds && (!/\ssrc\s*=/i.test(t) || /\ssrc\s*=\s*["']data:/i.test(t))) {
      t = t.replace(/\ssrc\s*=\s*("[^"]*"|'[^']*')/i, '').replace(/^<img/i, '<img src="' + esc(ds[1]) + '"');
    }
    if (dss && !/\ssrcset\s*=/i.test(t)) t = t.replace(/^<img/i, '<img srcset="' + esc(dss[1]) + '"');
    return t;
  });
  const first = '<meta charset="utf-8"><base href="' + esc(finalUrl) + '">';
  if (/<head\b[^>]*>/i.test(h)) h = h.replace(/<head\b[^>]*>/i, (m) => m + first);
  else if (/<html\b[^>]*>/i.test(h)) h = h.replace(/<html\b[^>]*>/i, (m) => m + '<head>' + first + '</head>');
  else h = '<!doctype html><head>' + first + '</head>' + h;
  return h;
}

const JSON_H = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const RENDER_CSP = "default-src 'none'; img-src https: http: data: blob:; style-src https: http: 'unsafe-inline'; " +
  "font-src https: http: data:; media-src https: http: data:; script-src 'none'; frame-src 'none'; form-action 'none'; " +
  "frame-ancestors 'self' https://genvidpro.com https://www.genvidpro.com https://*.genvidpro.pages.dev http://localhost:* http://127.0.0.1:*; sandbox";

export async function onRequestGet({ request, env }) {
  if (!ours(caller(request)) && !dev(request)) {
    return new Response(JSON.stringify({ ok: false, why: 'forbidden' }), { status: 403, headers: JSON_H });
  }
  const url = new URL(request.url);

  // How much of the day's free browser time is gone. Read by the server's watcher, which
  // tells Roma at 70 % so the move to the paid plan is a decision and not a surprise.
  // The platform's own account of why a browser is or is not available. Ours to read; the
  // page never shows it. No browser time is spent answering this.
  if (url.searchParams.get('limits') === '1') {
    if (!env.RENDER) return new Response(JSON.stringify({ ok: false, why: 'no_render' }), { headers: JSON_H });
    try {
      const r = await env.RENDER.fetch('https://gvp-render/limits');
      return new Response(await r.text(), { headers: JSON_H });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, why: 'render_unreachable' }), { headers: JSON_H });
    }
  }

  if (url.searchParams.get('budget') === '1') {
    if (!env.RENDER) return new Response(JSON.stringify({ ok: false, why: 'no_render' }), { headers: JSON_H });
    try {
      const r = await env.RENDER.fetch('https://gvp-render/budget');
      return new Response(await r.text(), { headers: JSON_H });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, why: 'render_unreachable' }), { headers: JSON_H });
    }
  }

  const u = clean(url.searchParams.get('u'));
  if (!u) {
    return new Response(JSON.stringify({ ok: false, why: 'bad_address' }), { status: 400, headers: JSON_H });
  }
  const render = url.searchParams.get('render') === '1';
  const al = url.searchParams.get('al');
  const hour = Math.floor(Date.now() / 3600000);
  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (ip && await bump(env, (render ? 'pvr:' : 'pv:') + ip + ':' + hour, render ? RENDER_PER_IP_HOUR : PER_IP_HOUR)) {
    // inside a screen a JSON line would read as a broken page, so the screen gets a sentence
    if (render) return new Response('<!doctype html><meta charset="utf-8"><body style="margin:0;display:grid;place-items:center;height:100vh;background:#0d0d0c;color:#9a938a;font:16px system-ui;text-align:center;padding:24px">That is a lot of previews in one hour. Try again a little later.</body>',
      { status: 429, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': RENDER_CSP } });
    return new Response(JSON.stringify({ ok: false, why: 'too_many' }), { status: 429, headers: JSON_H });
  }

  const shot = url.searchParams.get('shot');
  if (shot === 'mobile' || shot === 'desktop') return screenshot(u, shot, env);

  // The phone and desktop screens as the server's own browser drew them. Served from the
  // render Worker's 24 h cache; it never renders on this path, so a missing picture just
  // means the check has not run for this address today.
  const pic = url.searchParams.get('pic');
  if (pic === 'phone' || pic === 'desktop') {
    const r = await askRender(env, u, pic, al);
    if (!r || !r.ok) return new Response(JSON.stringify({ ok: false, why: 'no_shot' }), { status: 404, headers: JSON_H });
    return new Response(r.body, {
      headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options': 'nosniff' }
    });
  }

  /* Both at once. The browser takes seconds; the plain fetch is what tells us whether a
     frame of ours will be allowed and is the fallback if the browser cannot run. */
  const renderP = askRender(env, u, '', al);
  const httpOpenP = httpIsOpen(u);

  let r;
  try {
    r = await fetchPage(u, al);
  } catch (e) {
    // retry: a cold first fetch sometimes fails where the second one works
    if (render) return new Response('Unreachable', { status: 502, headers: { 'Content-Type': 'text/plain' } });
    return new Response(JSON.stringify({ ok: false, why: 'unreachable', retry: true }), { headers: JSON_H });
  }
  if (!r.ok && r.status !== 401 && r.status !== 403) {
    if (render) return new Response('Upstream ' + r.status, { status: 502, headers: { 'Content-Type': 'text/plain' } });
    return new Response(JSON.stringify({ ok: false, why: 'status_' + r.status, retry: r.status >= 500 }), { headers: JSON_H });
  }
  let finalUrl = r.url || u.toString();
  const ct = String(r.headers.get('content-type') || '');
  let html = '';
  if (ct.indexOf('html') !== -1 || !ct) {
    try { html = decode(await r.arrayBuffer(), ct).slice(0, 3000000); } catch (e) {}
  }

  if (render) {
    if (!html) return new Response('Not an HTML page', { status: 415, headers: { 'Content-Type': 'text/plain' } });
    return new Response(rebuild(html, finalUrl), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': RENDER_CSP,
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, max-age=300'
      }
    });
  }

  const pol = framePolicy(r.headers, hostOf(finalUrl));
  let title = '', checks = null, blocked = false, busy = false, shots = false, shotH = 0;
  let renderWhy = '';
  const rend = await renderP;

  if (rend && rend.ok) {
    // The browser drew the page. Everything below is measured on what it painted.
    title = rend.title || '';
    blocked = !!rend.blocked;
    checks = rend.checks || null;
    shots = !blocked;
    shotH = rend.shotH || 0;
    if (rend.url) finalUrl = rend.url;
  } else {
    // 'spent' is the day's free browser time gone until midnight UTC; 'busy' is a moment's
    // crowding. Both read the HTML instead, and the page says so either way.
    busy = !!(rend && (rend.why === 'busy' || rend.why === 'spent'));
    /* Why the browser did not draw it. 30.09.2026: every check quietly fell back to the
       HTML for an afternoon and the answer said only "busy", which covers a rate limit, a
       time limit and a browser that never started. Without this the only way to tell them
       apart is to redeploy the Worker with logging. Ours alone — the page never shows it. */
    renderWhy = (rend && (rend.why || '')) + (rend && rend.detail ? ': ' + rend.detail : '');
  }

  // A firewall's refusal, seen either by the browser or in the HTML, ends it here: the
  // site said nothing about itself, so neither do we.
  if (!blocked && html) blocked = blockedHtml(html, r.status);
  if (blocked) {
    return new Response(JSON.stringify({
      ok: true, url: finalUrl, title, frameable: pol.frameable, why: pol.why,
      checks: null, blocked: true, busy, html: !!html, shots: false
    }), { headers: JSON_H });
  }

  // 15.09.2026: sigal-yoga.co.il sends a full 190 KB page to a visitor and an empty body to
  // our Cloudflare worker (its bot protection). Checking an empty page reported "no phone
  // layout" about a site that has one. An empty or stub page is not judged at all: the
  // visitor still gets the live screens, just no findings we cannot stand behind.
  const thin = !html || (html.length < 2500 && !/<body[\s>]/i.test(html)) || !/<(p|div|section|main|a|img|h1|h2)\b/i.test(html);
  if (thin) html = html && html.length ? html : '';
  if (!checks && html && !thin) {
    try {
      // Wix puts <title> after 150 KB of inline styles
      if (!title) title = titleOf(html.slice(0, 300000));
      checks = await checksOf(html, finalUrl, r.headers);
    } catch (e) {}
  }
  if (!title && html && !thin) title = titleOf(html.slice(0, 300000));

  // http is asked about the same way whichever path got us here: it is about what the
  // visitor's browser does with the bare name, not about what we chose to request.
  if (checks) {
    const httpOpen = await httpOpenP;
    checks.httpOpen = httpOpen;
    if (httpOpen) checks.https = false;
  }

  return new Response(JSON.stringify({
    ok: true, url: finalUrl, title, frameable: pol.frameable, why: pol.why,
    checks, blocked: false, busy, html: !!html, shots, renderWhy
  }), { headers: JSON_H });
}

// A real Chrome renders the page at Google's end and we pass its screenshot
// through. Kept for the record; the page now shows a reconstructed preview instead.
async function screenshot(u, strategy, env) {
  const api = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  api.searchParams.set('url', u.toString());
  api.searchParams.set('strategy', strategy);
  api.searchParams.set('category', 'performance');
  if (env.PSI_KEY) api.searchParams.set('key', env.PSI_KEY);
  let data;
  try {
    const r = await fetch(api.toString(), { signal: AbortSignal.timeout(55000) });
    if (!r.ok) {
      return new Response(JSON.stringify({ ok: false, why: 'psi_' + r.status }), { status: 502, headers: JSON_H });
    }
    data = await r.json();
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, why: 'psi_timeout' }), { status: 504, headers: JSON_H });
  }
  const audits = (data.lighthouseResult || {}).audits || {};
  const shot = (audits['final-screenshot'] || {}).details || {};
  const raw = String(shot.data || '');
  const m = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(raw);
  if (!m) {
    return new Response(JSON.stringify({ ok: false, why: 'no_shot' }), { status: 502, headers: JSON_H });
  }
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Response(bytes, { headers: { 'Content-Type': m[1], 'Cache-Control': 'public, max-age=3600' } });
}
