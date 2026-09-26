/* gvp-wa.js: the one door from every GenVidPro page to the WhatsApp sales agent.
 *
 * A money button needs one attribute:
 *   <a data-gvp-service="site">Order a site</a>
 * Optional:
 *   data-gvp-source="builder"          where the click came from (default: taken from the page)
 *   data-gvp-text="Hi, ..."            first line instead of the standard greeting
 *   data-gvp-context='{"answers":{...},"note":"..."}'   what the visitor already chose; becomes "ref CODE"
 * From page code:
 *   GVPWA.link(service, {source, text, ref})  -> wa.me URL (sync)
 *   GVPWA.open(service, {source, text, context})
 *   GVPWA.setContext(el, ctx)  -> starts creating the ref early, so the click is instant
 *
 * The text is written in the page language (<html lang>) and ends with a tag line
 * "#<service> · <source>" (+ " · ref CODE"). The agent reads the tag and starts that service's brief;
 * the ref lets it skip what the visitor already answered on the site.
 * Services, names and tags come from https://genvidpro.com/services.json: a new service needs no change here.
 */
(function (w, d) {
  'use strict';
  if (w.GVPWA) return;
  var NUM = '972539760820';
  var BASE = /(^|\.)genvidpro\.com$/.test(location.hostname) && location.hostname !== 'app.genvidpro.com' ? '' : 'https://genvidpro.com';
  var REG_URL = BASE + '/services.json';
  var REF_URL = BASE + '/api/ref';
  var LANGS = ['he', 'en', 'ru', 'ar'];
  var HELLO = {
    en: "Hi! I'd like to know more about {service}.",
    he: 'היי, אשמח לפרטים על {service}.',
    ru: 'Здравствуйте! Интересует: {service}.',
    ar: 'مرحباً! أود معرفة المزيد عن {service}.'
  };
  var HELLO_ANY = { en: "Hi! I'd like to know more.", he: 'היי, אשמח לפרטים.', ru: 'Здравствуйте! Хочу узнать подробнее.', ar: 'مرحباً! أود معرفة المزيد.' };
  var GENERAL = { en: 'Hi! I have a question.', he: 'היי, יש לי שאלה.', ru: 'Здравствуйте! У меня вопрос.', ar: 'مرحباً! لدي سؤال.' };

  var reg = null, regP = null;
  function loadReg() {
    if (regP) return regP;
    try { var c = sessionStorage.getItem('gvp.reg'); if (c) { reg = JSON.parse(c); } } catch (e) {}
    regP = fetch(REG_URL, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (j && j.services) { reg = j; try { sessionStorage.setItem('gvp.reg', JSON.stringify(j)); } catch (e) {} refresh(); }
      return reg;
    }).catch(function () { return reg; });
    return regP;
  }

  function lang() {
    var l = String(d.documentElement.getAttribute('lang') || 'en').slice(0, 2).toLowerCase();
    return LANGS.indexOf(l) >= 0 ? l : 'en';
  }
  function source(el) {
    var s = el && el.getAttribute && el.getAttribute('data-gvp-source');
    if (s) return s;
    if (location.hostname === 'app.genvidpro.com' || /gvpro\.pages\.dev$/.test(location.hostname)) return 'app';
    var p = location.pathname.replace(/\.html$/, '').replace(/\/+$/, '') || '/';
    var map = { '/': 'site', '/index': 'site', '/work': 'work', '/automation': 'automation', '/learn': 'learn', '/os': 'os', '/living-paintings': 'living-paintings', '/builder': 'builder', '/app': 'site' };
    return map[p] || 'other';
  }
  function svc(id) {
    if (!reg || !reg.services) return null;
    for (var i = 0; i < reg.services.length; i++) { var s = reg.services[i]; if (s.id === id || s.tag === id) return s; }
    return null;
  }
  function text(service, o) {
    o = o || {};
    var l = lang(), s = svc(service), first;
    if (o.text) first = o.text;
    else if (!service || service === 'general') first = GENERAL[l];
    else if (s) first = HELLO[l].replace('{service}', (s.names && (s.names[l] || s.names.en)) || service);
    else first = HELLO_ANY[l];
    var tag = '#' + ((s && s.tag) || service || 'general') + ' · ' + (o.source || 'other');
    if (o.ref) tag += ' · ref ' + o.ref;
    return first + '\n' + tag;
  }
  function link(service, o) {
    o = o || {};
    if (!o.source) o.source = source(null);
    return 'https://wa.me/' + NUM + '?text=' + encodeURIComponent(text(service, o));
  }

  // ---- context hand-off: a 6-char code stored on genvidpro.com for 30 days ----
  function createRef(ctx) {
    var body = JSON.stringify(ctx);
    var ctl = w.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 4000);
    return fetch(REF_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { clearTimeout(timer); return j && j.code ? j.code : null; })
      .catch(function () { clearTimeout(timer); return null; });
  }
  function ctxOf(el) {
    if (el.__gvpCtx) return el.__gvpCtx;
    var raw = el.getAttribute('data-gvp-context');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }
  function fullCtx(el, service, ctx) {
    var c = {};
    for (var k in ctx) c[k] = ctx[k];
    if (!c.service && service && service !== 'general') c.service = service;
    if (!c.source) c.source = source(el);
    if (!c.lang) c.lang = lang();
    return c;
  }
  function setContext(el, ctx) {
    el.__gvpCtx = ctx || null;
    el.__gvpRef = null;
    el.__gvpRefP = null;
    if (!ctx) { paint(el); return; }
    clearTimeout(el.__gvpT);
    el.__gvpT = setTimeout(function () {
      var mine = el.__gvpRefP = createRef(fullCtx(el, el.getAttribute('data-gvp-service'), ctx)).then(function (code) {
        if (el.__gvpRefP === mine) { el.__gvpRef = code; paint(el); }
        return code;
      });
    }, 500);
  }

  function urlFor(el) {
    var service = el.getAttribute('data-gvp-service');
    return link(service, { source: source(el), text: el.getAttribute('data-gvp-text') || '', ref: el.__gvpRef || '' });
  }
  function paint(el) {
    if (el.tagName === 'A') {
      el.setAttribute('href', urlFor(el));
      if (!el.getAttribute('target')) el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener');
    }
  }
  function refresh() {
    var all = d.querySelectorAll('[data-gvp-service]');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (!el.__gvpCtx && el.getAttribute('data-gvp-context') && !el.__gvpRefP) setContext(el, ctxOf(el));
      paint(el);
    }
  }
  function go(url, win) {
    if (win && !win.closed) { try { win.location.href = url; return; } catch (e) {} }
    location.href = url;
  }
  function open(service, o) {
    o = o || {};
    var src = o.source || source(null);
    if (!o.context) { var u = link(service, { source: src, text: o.text, ref: o.ref }); var win0 = w.open(u, '_blank', 'noopener'); if (!win0) location.href = u; return; }
    var win = w.open('about:blank', '_blank');
    var done = false;
    var fallback = setTimeout(function () { if (!done) { done = true; go(link(service, { source: src, text: o.text }), win); } }, 2500);
    createRef(fullCtx({ getAttribute: function () { return src; } }, service, o.context)).then(function (code) {
      if (done) return; done = true; clearTimeout(fallback);
      go(link(service, { source: src, text: o.text, ref: code || '' }), win);
    });
  }

  // Ask GenVidPro hand-off: when /chat marks a lead, the chat shows one button that opens WhatsApp
  // with the conversation summary behind a ref code. info = {services:[], note, source}
  var CONTINUE = { en: 'Continue on WhatsApp', he: 'להמשיך בוואטסאפ', ru: 'Продолжить в WhatsApp', ar: 'المتابعة في واتساب' };
  function chatButton(container, info) {
    if (!container) return null;
    info = info || {};
    var old = container.querySelector && container.querySelector('.gvp-chat-wa');
    var a = old || d.createElement('a');
    var svcs = (info.services || []).filter(Boolean);
    a.className = 'gvp-chat-wa';
    a.setAttribute('data-gvp-service', svcs.length === 1 ? svcs[0] : 'general');
    a.setAttribute('data-gvp-source', info.source || 'ask-chat');
    a.textContent = CONTINUE[lang()];
    if (!old) {
      a.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;gap:8px;margin:8px 0 4px;padding:10px 16px;min-height:44px;border-radius:999px;background:#25D366;color:#06210f;font-weight:700;text-decoration:none;font-size:15px;line-height:1.2';
      container.appendChild(a);
    }
    setContext(a, { source: info.source || 'ask-chat', services: svcs, lang: lang(), answers: info.answers || {}, note: String(info.note || '').slice(0, 300) });
    return a;
  }

  d.addEventListener('click', function (ev) {
    var el = ev.target && ev.target.closest && ev.target.closest('[data-gvp-service]');
    if (!el) return;
    var ctx = ctxOf(el);
    if (ctx && !el.__gvpRef) {
      // the code is not ready yet: open the tab now (so no popup blocker), fill it when the code arrives
      ev.preventDefault();
      var win = w.open('about:blank', '_blank');
      var p = el.__gvpRefP || createRef(fullCtx(el, el.getAttribute('data-gvp-service'), ctx));
      var done = false;
      var t = setTimeout(function () { if (!done) { done = true; go(urlFor(el), win); } }, 2500);
      p.then(function (code) { if (done) return; done = true; clearTimeout(t); if (code) el.__gvpRef = code; go(urlFor(el), win); });
      return;
    }
    var url = urlFor(el);
    if (el.tagName === 'A') { el.setAttribute('href', url); return; }
    ev.preventDefault();
    var win2 = w.open(url, '_blank', 'noopener');
    if (!win2) location.href = url;
  }, true);

  function boot() {
    refresh();
    loadReg();
    try {
      new MutationObserver(function (ms) {
        for (var i = 0; i < ms.length; i++) {
          if (ms[i].type === 'attributes' && ms[i].target === d.documentElement) { refresh(); return; }
          var ns = ms[i].addedNodes;
          for (var j = 0; j < ns.length; j++) {
            var n = ns[j];
            if (n.nodeType !== 1) continue;
            if (n.hasAttribute && n.hasAttribute('data-gvp-service')) paint(n);
            if (n.querySelectorAll) { var q = n.querySelectorAll('[data-gvp-service]'); for (var k = 0; k < q.length; k++) paint(q[k]); }
          }
        }
      }).observe(d.documentElement, { attributes: true, attributeFilter: ['lang'], childList: true, subtree: true });
    } catch (e) {}
  }
  w.GVPWA = { number: NUM, link: link, text: text, open: open, setContext: setContext, createRef: createRef, refresh: refresh, source: source, ready: loadReg, chatButton: chatButton };
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot); else boot();
})(window, document);
