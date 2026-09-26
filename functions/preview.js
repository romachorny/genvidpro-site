// Cloudflare Pages Function: /preview
//
// Behind the "see your site on three screens" tool in the APP block.
//
//   GET /preview?u=<address>             -> {ok, url, title, frameable, why, checks}
//   GET /preview?u=<address>&render=1    -> text/html, a reconstructed copy of the page
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

function clean(raw) {
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
function framePolicy(h, target) {
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

async function fetchPage(u) {
  return fetch(u.toString(), {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36 GenVidPro-preview',
      'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'he-IL,he;q=0.9,en;q=0.8'
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

async function checksOf(html, finalUrl, headers) {
  const head = html.slice(0, 200000);
  const vpTag = /<meta[^>]+name\s*=\s*["']?viewport["']?[^>]*>/i.exec(head);
  let vp = 'missing';
  if (vpTag) {
    // width=device-width is the usual spelling, but initial-scale=1 on its own does
    // the same job and plenty of sites write only that.
    const t = vpTag[0];
    if (/device-width|initial-scale\s*=\s*1/i.test(t)) {
      vp = /user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/i.test(t) ? 'locked' : 'ok';
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
  const fixedW = Math.max(rule.w, inlineWidest(html));

  const imgTags = html.match(/<img\b[^>]*>/gi) || [];
  const lazyMissing = imgTags.filter(t => !/loading\s*=\s*["']?lazy/i.test(t) && !/data-(lazy-)?src|lazyload/i.test(t)).length;
  const scripts = (html.match(/<script\b/gi) || []).length;
  const linkTags = (html.match(/<link\b/gi) || []).length;

  return {
    vp,
    rtl: rtlScript && !rtlDir ? rtlScript : '',
    rtlText: rtlScript,
    fixedW,
    fixedSel: rule.w === fixedW ? rule.sel : '',
    install: /<link[^>]+rel\s*=\s*["']?[^"'>]*manifest/i.test(head) || /serviceWorker\s*\.\s*register/i.test(html),
    call: /href\s*=\s*["']?\s*tel:/i.test(html) || /wa\.me\/|api\.whatsapp\.com|whatsapp:\/\/|web\.whatsapp\.com|chat\.whatsapp\.com/i.test(html),
    imgs: imgTags.length,
    lazyMissing,
    reqs: scripts + linkTags,
    kb: Math.round(html.length / 1024),
    https: finalUrl.indexOf('https://') === 0
  };
}

function titleOf(html) {
  const m = /<title[^>]*>([\s\S]{0,200}?)<\/title>/i.exec(html || '');
  if (!m) return '';
  return m[1].replace(/\s+/g, ' ').trim().slice(0, 90);
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
  const u = clean(url.searchParams.get('u'));
  if (!u) {
    return new Response(JSON.stringify({ ok: false, why: 'bad_address' }), { status: 400, headers: JSON_H });
  }
  const render = url.searchParams.get('render') === '1';
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

  let r;
  try {
    r = await fetchPage(u);
  } catch (e) {
    // retry: a cold first fetch sometimes fails where the second one works
    if (render) return new Response('Unreachable', { status: 502, headers: { 'Content-Type': 'text/plain' } });
    return new Response(JSON.stringify({ ok: false, why: 'unreachable', retry: true }), { headers: JSON_H });
  }
  if (!r.ok && r.status !== 401 && r.status !== 403) {
    if (render) return new Response('Upstream ' + r.status, { status: 502, headers: { 'Content-Type': 'text/plain' } });
    return new Response(JSON.stringify({ ok: false, why: 'status_' + r.status, retry: r.status >= 500 }), { headers: JSON_H });
  }
  const finalUrl = r.url || u.toString();
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
  let title = '', checks = null;
  // 15.09.2026: sigal-yoga.co.il sends a full 190 KB page to a visitor and an empty body to
  // our Cloudflare worker (its bot protection). Checking an empty page reported "no phone
  // layout" about a site that has one. An empty or stub page is not judged at all: the
  // visitor still gets the live screens, just no findings we cannot stand behind.
  const thin = !html || (html.length < 2500 && !/<body[\s>]/i.test(html)) || !/<(p|div|section|main|a|img|h1|h2)\b/i.test(html);
  if (thin) html = html && html.length ? html : '';
  if (html && !thin) {
    try {
      title = titleOf(html.slice(0, 20000));
      checks = await checksOf(html, finalUrl, r.headers);
    } catch (e) {}
  }
  return new Response(JSON.stringify({
    ok: true, url: finalUrl, title, frameable: pol.frameable, why: pol.why, checks, html: !!html
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
