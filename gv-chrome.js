/* gv-chrome.js — one header, one footer, one set of contacts for every page of
   genvidpro.com. Written 11.09.2026: the sub pages had no share button, no globe
   and no footer, and the only way back was a grey line of 12px type that people
   missed, so they closed the tab instead of going back. Everything here is built
   at runtime, so a new page gets the whole chrome by adding one script tag.

   v3, 11.09.2026 — the white back button now lives on EVERY page, the front page
   included, and it steps back one screen at a time rather than always jumping to
   the front: an open order screen closes first, a template opened inside the
   builder steps back to the previous template, and only when there is nothing of
   ours behind does it lead to "/". The old grey back lines are taken out, the
   language globe is moved into the bar so it stops sitting on top of the share
   button, and the assistant pill is lifted clear of the fixed footer. */
(function () {
  'use strict';
  if (window.__gvChrome) return;
  window.__gvChrome = 1;

  var WA   = 'https://wa.me/972539760820';   // the WhatsApp sales agent; gvp-wa.js adds the text
  var MAIL = 'mailto:genvidpro@gmail.com';
  var TG   = 'https://t.me/GenVidPro';
  var LI   = 'https://www.linkedin.com/in/genvidpro';

  /* what each address of ours is called, so the back button can say where it goes
     instead of the bare word "back" */
  var NAMES = {
    '/': 'genvidpro.com',
    '/index.html': 'genvidpro.com',
    '/work': 'Selected Work',
    '/work.html': 'Selected Work',
    '/living-paintings': 'Living Paintings',
    '/living-paintings.html': 'Living Paintings',
    '/builder': 'Site Builder',
    '/builder.html': 'Site Builder',
    '/terms': 'Terms',
    '/terms.html': 'Terms',
    '/privacy': 'Privacy',
    '/privacy.html': 'Privacy',
    '/thanks': 'Thank you',
    '/thanks.html': 'Thank you',
    '/gift': 'genvidpro.com',
    '/gift.html': 'genvidpro.com'
  };

  var here = location.pathname.replace(/\/+$/, '') || '/';
  var isHome = here === '/' || here === '/index.html';
  var hereName = NAMES[here] || 'genvidpro.com';

  /* Where the visitor is standing, in one small object, for the assistant to send
     with every question. Until 15.09.2026 the helper answered blind: it knew what
     the studio sells and not which of the five showcases the person had in front of
     them, so "how much is this one" could only be answered with a question back.
     The front page is one long page, so the place there is the showcase in the
     middle of the screen, not the address. Lives here because gv-chrome.js is the
     one file every page loads, and both chat widgets can reach it. */
  var SHOW = [['art','art'],['gvs1','video'],['gvs3','site'],['gvs4','app'],['gvs2','brand'],['path','path'],['order','order'],['faq','faq']];
  window.gvpPlace = function () {
    var at = '';
    if (isHome) {
      var mid = innerHeight / 2, best = 1e9;
      for (var i = 0; i < SHOW.length; i++) {
        var el = document.getElementById(SHOW[i][0]);
        if (!el) continue;
        var r = el.getBoundingClientRect();
        if (!r.height) continue;
        var far = (r.top > mid) ? r.top - mid : (r.bottom < mid ? mid - r.bottom : 0);
        if (far < best) { best = far; at = SHOW[i][1]; }
      }
    }
    return { path: here, at: at, title: String(document.title || '').slice(0, 80),
      lang: String(document.documentElement.lang || 'en').slice(0, 2).toLowerCase() };
  };

  /* ---- Back closes what is open (15.09.2026) --------------------------------
     On Android the system Back button left the site when the assistant or the share
     menu was open, because opening them wrote nothing into the history. A layer puts
     one entry in when it opens; Back takes it out and closes the layer; closing it
     with its own X takes the entry out again, so the count always matches. The entry
     copies the current state, so the page's own screens (the order screen, the
     builder's looks) see no change when it comes and goes. */
  var layers = [], ownBacks = 0;
  window.gvLayer = function (close) {
    var L = { on: false };
    L.open = function () {
      if (L.on) return;
      L.on = true; layers.push(L);
      var st = {};
      try { if (history.state && typeof history.state === 'object') for (var k in history.state) st[k] = history.state[k]; } catch (e) {}
      st.gvLayer = layers.length;
      try { history.pushState(st, ''); } catch (e) {}
    };
    L.shut = function () {
      if (!L.on) return;
      L.on = false;
      var i = layers.indexOf(L); if (i >= 0) layers.splice(i, 1);
      ownBacks++;
      try { history.back(); } catch (e) { ownBacks--; }
    };
    return L;
  };
  /* the page's own Back handlers ask this, so a Back that only closes a layer does
     not also close the order screen or scroll the page */
  window.gvLayerBusy = function () { return layers.length > 0 || ownBacks > 0; };
  addEventListener('popstate', function () {
    if (ownBacks > 0) { ownBacks--; return; }
    var L = layers.pop();
    if (L) { L.on = false; try { close(L); } catch (e) {} }
    function close(x) { if (x.onBack) x.onBack(); }
  });

  /* ---- the neural voice (15.09.2026) ----------------------------------------
     The browser's own Hebrew voice on Windows is Microsoft Asaf, an old SAPI voice.
     /tts asks Azure for a neural one. With no key there it answers 503, and from
     then on this visit never asks again: the chat falls back to the browser voice.
     speak() resolves true when the neural voice is playing (or was superseded),
     false when the caller should read it with the browser voice instead. */
  (function () {
    var audio = null, off = false, ctl = null, turn = 0;
    var SILENT = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRBqpAAAAAAD/+xDEAAPAAAGkAAAAIAAANIAAAARMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV';
    function el() { if (!audio) { audio = new Audio(); audio.preload = 'auto'; } return audio; }
    window.gvTTS = {
      /* called inside the click that turns the speaker on: iOS lets an element play
         later only if it has played once inside a gesture */
      unlock: function () {
        try { var a = el(); a.muted = true; a.src = SILENT; var p = a.play(); if (p && p.then) p.then(function () { a.pause(); a.muted = false; }, function () { a.muted = false; }); } catch (e) {}
      },
      stop: function () {
        turn++;
        if (ctl) { try { ctl.abort(); } catch (e) {} ctl = null; }
        if (audio) { try { audio.pause(); } catch (e) {} }
      },
      speak: function (text, lang) {
        if (off || !window.fetch) return Promise.resolve(false);
        this.stop();
        var mine = turn, c = window.AbortController ? new AbortController() : null;
        ctl = c;
        return fetch('/tts', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: String(text || '').slice(0, 600), lang: lang || '' }),
          signal: c ? c.signal : undefined
        }).then(function (r) {
          if (r.status === 503 || r.status === 403 || r.status === 404) off = true;
          if (!r.ok) return false;
          return r.blob().then(function (b) {
            if (mine !== turn) return true;
            var a = el();
            if (a.__url) { try { URL.revokeObjectURL(a.__url); } catch (e) {} }
            a.__url = URL.createObjectURL(b);
            a.muted = false; a.src = a.__url;
            var p = a.play();
            return p && p.then ? p.then(function () { return true; }, function () { return false; }) : true;
          });
        }).catch(function () { return mine !== turn; });
      }
    };
  })();

  var ref = '';
  try { ref = document.referrer || ''; } catch (e) {}
  var sameSite = !!ref && ref.indexOf(location.origin) === 0;
  var refPath = '';
  if (sameSite) { try { refPath = new URL(ref).pathname.replace(/\/+$/, '') || '/'; } catch (e) {} }
  var cameFromUs = sameSite && refPath !== here;
  var refName = (cameFromUs && NAMES[refPath]) ? NAMES[refPath] : 'genvidpro.com';

  /* How many steps this page has taken inside itself since it loaded. The builder
     pushes one for every template, the front page pushes one for the order screen.
     Knowing the count is what lets the button walk back one screen at a time and
     still know when there is nothing of ours left behind it. */
  var steps = 0;
  try {
    var push = history.pushState;
    history.pushState = function () {
      steps++;
      var r = push.apply(history, arguments);
      refresh();
      return r;
    };
  } catch (e) {}
  addEventListener('popstate', function () { if (steps > 0) steps--; setTimeout(refresh, 0); });
  addEventListener('hashchange', function () { setTimeout(refresh, 0); });

  var css = document.createElement('style');
  css.textContent = [
    ':root{--gvc-red:#FF4A1C;--gvc-ink:#F2EFE9;--gvc-dim:#8C8C88;--gvc-bg:#0A0A0A}',
    'body{padding-bottom:52px}',
    /* top bar */
    /* 16.09.2026, Roma: the bar stands still. One line that never wraps, laid out left to right in
       every language, on a solid ground rather than a see-through one — the page used to read
       through it on a phone, which is what made it look like it was moving. */
    '#gvc-bar{position:fixed;top:0;left:0;right:0;z-index:60;display:flex;align-items:center;gap:10px;',
    '  direction:ltr;flex-wrap:nowrap;white-space:nowrap;overflow:hidden;',
    '  padding:8px 12px;background:#0A0A0A;background:rgba(10,10,10,.97);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);',
    '  border-bottom:1px solid rgba(242,239,233,.12)}',
    '#gvc-bar .gvc-sp{flex:1 1 auto;min-width:0}',
    '#gvc-bar .gvc-pill{margin-inline-end:0;flex:0 1 auto;min-width:0}',
    '#gvc-tag{font-family:"JetBrains Mono",monospace;font-size:8.5px;letter-spacing:.16em;color:var(--gvc-dim);',
    '  text-transform:uppercase;flex:0 0 auto}',
    /* the studio line is the first thing to go: on a sub page the way back needs that room,
       and on the narrowest phones nothing but the name and the buttons fits */
    '#gvc-bar:has(.gvc-pill:not([hidden])) #gvc-tag{display:none}',
    '@media(max-width:380px){#gvc-tag{display:none}}',
    /* the white pill, the same one on the front page and on every sub page */
    '.gvc-pill{display:inline-flex;align-items:center;gap:8px;text-decoration:none;color:#fff;background:transparent;',
    '  border:1px solid rgba(255,255,255,.55);border-radius:999px;padding:7px 14px 7px 11px;font-family:Inter,system-ui,sans-serif;',
    '  font-size:13px;font-weight:600;line-height:1;cursor:pointer;white-space:nowrap;max-width:62vw;overflow:hidden;',
    '  text-overflow:ellipsis;margin-inline-end:auto;flex:0 0 auto}',
    '.gvc-pill[hidden]{display:none}',
    '.gvc-pill:hover{background:#fff;color:#0A0A0A;border-color:#fff}',
    /* the bar is laid out left to right in every language, so its arrow always points left */
    '[dir=rtl] .gvc-pill svg{transform:scaleX(-1)}#gvc-bar .gvc-pill svg{transform:none}.gvc-pill svg{width:16px;height:16px;flex:0 0 16px;stroke:currentColor;stroke-width:2.2;fill:none;stroke-linecap:round;stroke-linejoin:round}',
    '#gvc-brand{font-family:Anton,Impact,sans-serif;font-size:15px;letter-spacing:.04em;color:#fff;text-decoration:none;text-transform:uppercase}',
    '#gvc-brand i{font-style:normal;color:var(--gvc-red)}',
    '#gvc-bar .gvc-ico{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:999px;',
    '  border:1px solid var(--gvc-red);background:transparent;color:#fff;cursor:pointer;flex:0 0 34px}',
    '#gvc-bar .gvc-ico svg{width:16px;height:16px;stroke:currentColor;stroke-width:1.8;fill:none}',
    /* the globe is moved into the bar, so it can no longer sit on top of the share button.
       relative, not static: its invisible tap area measures itself against it (15.09.2026) */
    '#gvc-bar .lang{position:relative!important;top:auto!important;right:auto!important;left:auto!important;margin:0;flex:0 0 auto}',
    'body.gvc-has-bar{padding-top:54px}',
    /* the pill inside the front page header */
    '#nav .gvc-pill{margin-inline-end:auto}',
    /* share menu */
    '#gvc-shrmenu{position:fixed;top:52px;inset-inline-end:10px;z-index:61;background:#141312;border:1px solid rgba(242,239,233,.16);',
    '  border-radius:12px;padding:6px;min-width:190px;box-shadow:0 18px 48px rgba(0,0,0,.6)}',
    '#gvc-shrmenu a,#gvc-shrmenu button{display:block;width:100%;text-align:start;background:none;border:0;color:var(--gvc-ink);',
    '  font-family:Inter,system-ui,sans-serif;font-size:13.5px;padding:9px 12px;border-radius:8px;text-decoration:none;cursor:pointer}',
    '#gvc-shrmenu a:hover,#gvc-shrmenu button:hover{background:rgba(255,74,28,.16)}',
    /* "ask for a discount", standing against the price itself on every form that
       shows one: the front page package and the living paintings estimate */
    '.gvc-disc{display:inline-flex;align-items:center;gap:7px;margin:10px 0 4px;padding:8px 14px;border-radius:999px;',
    '  border:1px solid rgba(255,74,28,.75);background:rgba(255,74,28,.08);color:var(--gvc-red);text-decoration:none;',
    '  font-family:Inter,system-ui,sans-serif;font-size:12.5px;font-weight:600;line-height:1;white-space:nowrap;transition:.18s}',
    '.gvc-disc::before{content:"%";font-weight:800;font-size:13px}',
    '.gvc-disc:hover{background:var(--gvc-red);color:#0A0A0A;border-color:var(--gvc-red)}',
    /* on the sticky bar there is room for the sign alone */
    '.gvc-disc-sm{margin:0;padding:0;width:32px;height:32px;justify-content:center;flex:0 0 32px}',
    '.stick #stick-total{margin-inline-end:10px!important}',
    '.stick #stick-disc{margin-inline-end:auto}',
    /* on living paintings it follows a sentence on the same line and was touching it */
    '.quote .gvc-disc{margin-inline-start:10px}',
    /* contacts row */
    '.gvc-row{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin:14px auto 0;max-width:760px;padding:0 16px}',
    '.gvc-row a{flex:1 1 150px;display:inline-flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;',
    '  color:#fff;border:1px solid rgba(255,74,28,.75);border-radius:999px;padding:11px 14px;font-family:Inter,system-ui,sans-serif;',
    '  font-size:13px;font-weight:600;background:rgba(255,74,28,.06);transition:.18s}',
    '.gvc-row a:hover{background:var(--gvc-red);color:#0A0A0A;border-color:var(--gvc-red)}',
    '.gvc-cap{text-align:center;font-family:"JetBrains Mono",monospace;font-size:10px;letter-spacing:.16em;',
    '  text-transform:uppercase;color:var(--gvc-dim);margin:22px 0 2px}',
    /* fixed footer */
    /* 16.09.2026, Roma: one line, never two. It used to wrap to three on a phone and climb over
       the Ask pill; now it never wraps and the parts marked wide are dropped instead. */
    '#gvc-foot{position:fixed;left:0;right:0;bottom:0;z-index:55;display:flex;align-items:center;justify-content:center;gap:10px;',
    '  flex-wrap:nowrap;white-space:nowrap;overflow:hidden;padding:9px 14px;background:#0A0A0A;background:rgba(10,10,10,.97);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);',
    '  border-top:1px solid rgba(242,239,233,.12);font-family:"JetBrains Mono",monospace;font-size:10.5px;letter-spacing:.1em;',
    '  text-transform:uppercase;color:var(--gvc-dim)}',
    '#gvc-foot a{color:var(--gvc-dim);text-decoration:none;border-bottom:1px solid rgba(140,140,136,.5)}',
    '#gvc-foot a:hover{color:#fff;border-color:#fff}',
    '@media(max-width:520px){#gvc-foot{font-size:9px;gap:6px;padding:8px 10px;letter-spacing:.04em}',
    '  #gvc-foot .gvc-wide{display:none}}',
    /* any sticky bar of the page stands right on top of the footer, whatever its height */
    '#stick,.stick{bottom:var(--gvc-foot-h,52px)!important}',
    /* 15.09.2026: the floating "Ask GenVidPro" pill covered card captions, headings, the
       Desktop/Phone switch and the Email button (measured: up to 11 elements on a phone).
       It now lives inside the fixed footer band, which no content ever scrolls into view
       under, and it no longer bobs up and down out of that band. */
    '#help,.gvhelp,.gvpa{bottom:calc(7px + env(safe-area-inset-bottom,0px))!important;z-index:56!important}',
    '#help-pill,.gvpa-pill{padding:8px 16px!important;font-size:13px!important;line-height:1.1!important;min-height:38px;animation:gvcFloat 3.2s ease-in-out infinite,gvcGlow 2.2s ease-in-out infinite!important}',
    /* 15.09.2026, Roma: Ask GenVidPro floats actively so it catches the eye: a higher rise, a slight sway, a breathing glow */
    '@keyframes gvcFloat{0%,100%{transform:translateY(2px) rotate(-1.5deg)}25%{transform:translateY(-6px) rotate(0deg)}50%{transform:translateY(-12px) rotate(1.5deg)}75%{transform:translateY(-5px) rotate(0deg)}}',
    '@keyframes gvcGlow{0%,100%{box-shadow:0 0 10px rgba(255,74,28,.55),0 0 26px rgba(255,74,28,.28),inset 0 0 14px rgba(255,74,28,.12)}50%{box-shadow:0 0 22px rgba(255,74,28,.95),0 0 56px rgba(255,74,28,.55),inset 0 0 20px rgba(255,74,28,.3)}}',
    '@media(prefers-reduced-motion:reduce){#help-pill,.gvpa-pill{animation:none!important}}',
    '#help-pill span{display:none!important}',
    '#gvc-foot{min-height:52px;padding-inline-end:176px!important;justify-content:flex-start!important;text-align:start}',
    '@media(max-width:520px){#gvc-foot{padding-inline-end:140px!important}#help-pill,.gvpa-pill{padding:8px 12px!important;font-size:12.5px!important}}',
    /* the narrowest phones: the line still has to hold, so the type and the room kept for the
       Ask pill both come down a step rather than the line breaking in two */
    '@media(max-width:380px){#gvc-foot{font-size:8.5px;padding-inline-end:124px!important}',
    '  html[dir=rtl] #gvc-foot{padding-left:124px!important;padding-right:8px!important}}',
    /* in Hebrew the pill stands at the left, and the footer line is always read left to
       right, so the room kept for the pill has to move to the left too: on /gift and on
       any page switched to Hebrew the pill sat on top of Work, Terms and Privacy */
    'html[dir=rtl] #gvc-foot{padding-right:14px!important;padding-left:176px!important}',
    '@media(max-width:520px){html[dir=rtl] #gvc-foot{padding-right:10px!important;padding-left:140px!important}}',
    'body.gvc-gv3-in #gvp-install{display:none!important}',
    /* the builder pins its own share button with position:fixed at top right; inside the
       bar it has to flow, or in Hebrew it lands on top of the back pill */
    '#gvc-bar #shr{position:relative!important;top:auto!important;right:auto!important;left:auto!important}',
    /* the legal line is a stamp in English in every language, read left to right */
    '#gvc-foot{direction:ltr}',
    /* the old grey "back" lines are replaced by the white pill */
    'body.gvc-has-bar .top .back,body.gvc-has-bar a.m.back{display:none}',
    'body.gvc-has-bar main>p.m:first-child{display:none}',
    'body.gvc-pill-on #deepBack{display:none!important}',
    /* 15.09.2026: on a touch screen every control is at least 40 to 44 px to a finger,
       without changing how it looks. An invisible ::after, centred on the control,
       takes the taps around it (a tap on a pseudo element belongs to its element).
       Swatches stop at 40 px, their gap is 7 px, so neighbours never overlap. The
       back pill clips its overflow for the ellipsis, so it grows for real instead. */
    '@media (pointer:coarse){',
    '#lang,#shr,.gvc-ico,#help-pill,.gvpa-pill,.gv3-tab,.cat,.seg button,#gvp-close-btn,.gvc-disc,.sw button,',
    '#gvc-foot a,.gv-hint a,.who a,.n a{position:relative}',
    '#lang::after,#shr::after,.gvc-ico::after,#help-pill::after,.gvpa-pill::after,.gv3-tab::after,.cat::after,',
    '.seg button::after,#gvp-close-btn::after,.gvc-disc::after,#gvc-foot a::after,.gv-hint a::after,.who a::after,.n a::after{',
    '  content:"";position:absolute;left:50%;top:50%;width:max(100%,44px);height:max(100%,44px);transform:translate(-50%,-50%)}',
    '.sw button::after{content:"";position:absolute;left:50%;top:50%;width:max(100%,40px);height:max(100%,40px);transform:translate(-50%,-50%)}',
    /* the footer links sit a few px above the bottom edge of the screen: their tap area
       grows upwards, a finger cannot reach below the glass */
    '#gvc-foot a::after{top:auto;bottom:-6px;transform:translateX(-50%)}',
    '#gvc-back{min-height:40px}',
    '}'
  ].join('');
  document.head.appendChild(css);

  function svg(d) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>';
  }

  /* ---- contacts, the same four everywhere -------------------------------- */
  function contactsRow(withCap) {
    var w = document.createElement('div');
    var cap = withCap ? '<div class="gvc-cap">Talk to a human</div>' : '';
    w.innerHTML = cap +
      '<div class="gvc-row">' +
      '<a href="' + WA + '" data-gvp-service="general" target="_blank" rel="noopener">WhatsApp</a>' +
      '<a href="' + MAIL + '">Email</a>' +
      '<a href="' + TG + '" target="_blank" rel="noopener">Telegram</a>' +
      '<a href="' + LI + '" target="_blank" rel="noopener">LinkedIn</a>' +
      '</div>';
    return w;
  }

  /* ---- the back button --------------------------------------------------- */
  var pill = null, pillLabel = null;

  /* a screen opened inside the page itself, which has to close before the page
     behind it is left: the order form on the front page is the one we have */
  function deepOpen() {
    var d = document.getElementById('deep');
    return !!(d && !d.hidden);
  }

  function refresh() {
    if (!pill) return;
    var label = null;
    if (deepOpen()) label = 'the work';
    else if (steps > 0) label = hereName;
    else if (cameFromUs) label = refName;
    else if (!isHome) label = 'genvidpro.com';
    /* on the very first screen of the front page, arrived at straight from
       outside, there is genuinely nothing behind: no button rather than a dead one */
    pill.hidden = !label;
    if (label) pillLabel.textContent = label;
  }

  /* one step back, and never off our own site: if the step turns out to lead
     nowhere, the front page catches the visitor */
  function stepBack() {
    var was = location.href;
    history.back();
    setTimeout(function () { if (location.href === was) location.href = '/'; }, 600);
  }

  function makePill() {
    var a = document.createElement('a');
    a.id = 'gvc-back';
    a.className = 'gvc-pill';
    a.href = '/';
    a.innerHTML = svg('<path d="M15 5 8 12l7 7"/><path d="M8 12h11"/>') + '<span>genvidpro.com</span>';
    pill = a;
    pillLabel = a.querySelector('span');
    a.addEventListener('click', function (e) {
      e.preventDefault();
      if (deepOpen()) {
        var db = document.getElementById('deepBack');
        if (db) db.click(); else stepBack();
        setTimeout(refresh, 60);
        return;
      }
      if (steps > 0 || cameFromUs) { stepBack(); return; }
      location.href = '/';
    });
    return a;
  }

  /* the front page hides and shows its order screen without changing document,
     so the label has to follow it */
  function watchDeep() {
    var d = document.getElementById('deep');
    if (!d || !window.MutationObserver) return;
    new MutationObserver(refresh).observe(d, { attributes: true, attributeFilter: ['hidden'] });
  }

  /* ---- the bar ----------------------------------------------------------- */
  var barShare = null;
  function buildBar() {
    var bar = document.createElement('nav');
    bar.id = 'gvc-bar';

    var brand = document.createElement('a');
    brand.id = 'gvc-brand';
    brand.href = '/';
    brand.innerHTML = 'GENVID<i>PRO</i>';

    /* A page that already carries its own share button keeps it — the builder pins
       one at top right, exactly where this bar puts its own, and the two sat one
       on top of the other. The page's button is moved into the bar instead of a
       second one being built, so there is one button and one menu. */
    var own = document.getElementById('shr');
    var btn;
    if (own) {
      btn = own;
      btn.style.position = ''; btn.style.top = ''; btn.style.right = ''; btn.style.zIndex = '';
      btn.classList.add('gvc-ico');
    } else {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gvc-ico';
      btn.id = 'gvc-shr';
      btn.setAttribute('aria-label', 'Share this page');
      btn.innerHTML = svg('<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.3 10.8 15.7 6.4"/><path d="M8.3 13.2 15.7 17.6"/>');
    }

    /* 16.09.2026, Roma: the bar is one line that never moves and never changes language — the
       name, what the studio is, the way back, then the buttons at the far end. On a phone it
       stood as two lonely icons over empty space, because the name was hidden below 520 px. */
    var tag = document.createElement('span');
    tag.id = 'gvc-tag';
    tag.textContent = 'CREATIVE STUDIO';
    var sp = document.createElement('span');
    sp.className = 'gvc-sp';
    bar.appendChild(brand);
    bar.appendChild(tag);
    bar.appendChild(makePill());
    bar.appendChild(sp);
    bar.appendChild(btn);
    document.body.insertBefore(bar, document.body.firstChild);
    document.body.classList.add('gvc-has-bar');

    barShare = btn;
    if (!own) shareMenu(btn);
    adoptLang(bar, btn);
  }

  /* The globe is put into the bar next to the share button. Left where i18n.js
     pins it, top:14px right:14px, it landed exactly on top of the share button
     and swallowed the click, so on three pages nothing opened at all. */
  function adoptLang(bar, before) {
    var l = document.getElementById('lang');
    if (!l) return false;
    if (l.parentNode === bar) return true;
    l.style.position = ''; l.style.top = ''; l.style.right = ''; l.style.zIndex = '';
    bar.insertBefore(l, before);
    return true;
  }

  function shareMenu(btn) {
    var layer = window.gvLayer(function () {});
    layer.onBack = function () { var mm = document.getElementById('gvc-shrmenu'); if (mm) mm.remove(); };
    function shut() { var mm = document.getElementById('gvc-shrmenu'); if (mm) mm.remove(); layer.shut(); }
    btn.addEventListener('click', function () {
      var open = document.getElementById('gvc-shrmenu');
      if (open) { shut(); return; }
      layer.open();
      var u = encodeURIComponent(location.href);
      var t = encodeURIComponent(document.title);
      var m = document.createElement('div');
      m.id = 'gvc-shrmenu';
      m.innerHTML =
        '<a href="https://wa.me/?text=' + t + '%20' + u + '" target="_blank" rel="noopener">WhatsApp</a>' +
        '<a href="https://t.me/share/url?url=' + u + '&text=' + t + '" target="_blank" rel="noopener">Telegram</a>' +
        '<a href="https://www.linkedin.com/sharing/share-offsite/?url=' + u + '" target="_blank" rel="noopener">LinkedIn</a>' +
        '<button type="button" id="gvc-copy">Copy link</button>';
      document.body.appendChild(m);
      document.getElementById('gvc-copy').addEventListener('click', function () {
        var done = function () { this.textContent = 'Copied'; }.bind(this);
        if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(done, done);
        else done();
      });
      setTimeout(function () {
        document.addEventListener('click', function once(ev) {
          var mm = document.getElementById('gvc-shrmenu');
          if (mm && !mm.contains(ev.target) && ev.target !== btn && !btn.contains(ev.target)) { shut(); }
          document.removeEventListener('click', once);
        });
      }, 0);
    });
  }

  /* ---- the footer -------------------------------------------------------- */
  function buildFoot() {
    var f = document.createElement('div');
    f.id = 'gvc-foot';
    f.innerHTML =
      /* 16.09.2026, Roma: one line, always, in every language. On a phone this stamp ran to three
         lines and climbed over the Ask pill. The parts marked wide are the ones a narrow screen
         drops — what is left is still the whole legal line: who, and the three pages. */
      '<span>&copy; 2026 GenVidPro<span class="gvc-wide"> &mdash; Roman Chorny</span></span>' +
      '<span><a href="/work">Work</a> &middot; <a href="/terms.html">Terms</a> &middot; <a href="/privacy.html">Privacy</a><span class="gvc-wide"> &middot; Tel Aviv, Israel</span></span>';
    document.body.appendChild(f);
    /* the footer wraps to more lines on a narrow phone; the page keeps exactly that much
       room free at the bottom and the sticky order bar stands exactly on top of it */
    var fit = function () {
      var h = Math.ceil(f.getBoundingClientRect().height) || 52;
      document.documentElement.style.setProperty('--gvc-foot-h', h + 'px');
      document.body.style.paddingBottom = (h + 8) + 'px';
    };
    fit();
    addEventListener('resize', fit);
    if (window.ResizeObserver) new ResizeObserver(fit).observe(f);
  }

  /* The logo loop in the "who" block was left with no src at all on the desktop
     build: the observer that was supposed to give it one never ran, so the block
     stood as a black square. The poster is in the markup now, and this puts the
     film in as soon as the block is near the screen, whatever else does or does
     not run on the page. */
  function emblem() {
    var v = document.querySelector('.gv-emb video');
    if (!v) return;
    var src = v.getAttribute('data-src');
    if (!src) return;
    var claimed = function () { return !!(v.currentSrc || v.getAttribute('src')); };
    var play = function () {
      /* play() straight after load() is sometimes rejected, so it is worth one
         more try a moment later: a still first frame reads as a broken block */
      var p = v.play();
      if (p && p.catch) p.catch(function () {
        setTimeout(function () { var q = v.play(); if (q && q.catch) q.catch(function () {}); }, 700);
      });
    };
    /* The front page fetches this film itself, whole, as a blob, because Chrome
       stops loading a paused element after two seconds. Two loaders on one
       element is worse than none: this one set a plain src and pressed play, the
       page's one then swapped in its blob and called load() again, and the
       element sat at readyState 0 showing the poster with nothing moving. So this
       is a fallback and nothing more - it waits, and only loads the film where
       the page has left the element untouched. */
    var seen = function () {
      setTimeout(function () { if (claimed()) { play(); return; } v.src = src; v.load(); play(); }, 1500);
    };
    if (!('IntersectionObserver' in window)) { seen(); return; }
    new IntersectionObserver(function (es, ob) {
      if (es[0].isIntersecting) { seen(); ob.disconnect(); }
    }, { rootMargin: '300px' }).observe(v);
  }

  /* the assistant pill steps aside on a phone while the three screens are on the
     screen, and stands higher while the order bar is showing */
  function pillAway() {
    var g = document.getElementById('gv3');
    if (g && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        var inView = es[0].isIntersecting;
        document.body.classList.toggle('gvc-pill-away', inView && innerWidth < 900);
        /* the floating "add to home screen" card stands at top:90px on a phone, exactly
           where the address field of the three screens lands: it steps aside too */
        document.body.classList.toggle('gvc-gv3-in', inView);
      }, { threshold: 0.05 }).observe(g);
    }
    var st = document.getElementById('stick');
    if (st) setInterval(function () {
      document.body.classList.toggle('gvc-stick-on', getComputedStyle(st).display !== 'none');
    }, 800);
  }

  /* 15.09.2026: push.js used to be tagged on the front page only, and people install
     from the builder. It is loaded here for every page; push.js guards against a second
     copy and does nothing on a page without a place for its button. */
  function loadPush() {
    if (document.querySelector('script[src^="/push.js"],script[src^="push.js"]')) return;
    var s = document.createElement('script');
    s.src = '/push.js?v=2';
    s.defer = true;
    document.head.appendChild(s);
  }

  /* the builder carried its own grey "back to genvidpro.com" in the kicker line,
     which now reads as a second, worse copy of the white pill */
  function dropOldBack() {
    var a = document.querySelector('.kicker a');
    if (!a || !/genvidpro\.com/i.test(a.textContent)) return;
    var k = a.parentNode;
    a.remove();
    k.innerHTML = k.innerHTML.replace(/^\s*(&middot;|·)\s*/, '');
  }

  function start() {
    /* the front page already has a fixed header with the globe and the share
       button in it; it gets the same white pill rather than a second bar */
    var navIn = isHome ? document.querySelector('#nav .nav-in') : null;
    if (navIn) navIn.insertBefore(makePill(), navIn.firstChild);
    else buildBar();
    document.body.classList.add('gvc-pill-on');

    buildFoot();
    pillAway();
    loadPush();
    emblem();
    watchDeep();
    dropOldBack();
    refresh();

    /* i18n.js normally runs first, but load order is not something to depend on */
    if (!isHome) {
      var bar = document.getElementById('gvc-bar');
      if (bar) [100, 400, 1200, 3000].forEach(function (t) {
        setTimeout(function () { adoptLang(bar, barShare); }, t);
      });
    }

    if (isHome) {
      /* The front page writes its own contacts twice over and needs none from
         here: the folded button at the foot of the work screen, and the big
         buttons at the foot of the order screen. A row added on top of those put
         the same four names on the screen twice within one scroll, which is what
         a visitor reads as a site that repeats itself. */
      var own = document.querySelector('body > footer');
      if (own) own.style.display = 'none';
    } else {
      var f = document.querySelector('footer');
      var row = contactsRow(true);
      if (f) f.parentNode.insertBefore(row, f);
      else document.body.appendChild(row);
      if (f) f.style.display = 'none';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
