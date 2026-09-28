/* push.js — personal messages from Roma, straight onto the phone. 28.09.2026.

   The flow this serves, end to end:
     1. Roma sends a personal link, genvidpro.com/?c=david. The name is written to
        localStorage on the first visit, because after "Add to Home Screen" the app
        opens at "/" with no query string at all and the name would be lost — which
        is exactly the moment we need it.
     2. The guest installs (the banner in index.html does that part).
     3. First launch as an app: one card, three lines, one button.
     4. The button is the only thing that asks for permission. A permission prompt
        nobody expects is a prompt people block for good, and a blocked site cannot
        ask again.
     5. The welcome notification is sent by /api/push/subscribe, so it lands while
        the finger is still on the screen.
     6. Denied or unsupported is never an error on the screen — just a short line
        saying what to do instead.
     7. In an ordinary Android browser the same card comes up after five seconds,
        so the thing can be shown to somebody who is not going to install anything.

   Every English sentence here is a key in i18n.js (Hebrew and Russian). Unknown
   text is left in English by the translator, so a new line is never a broken line. */
(function () {
  'use strict';
  if (window.__gvPush) return;
  window.__gvPush = 1;

  /* the public half of the VAPID pair; the private half is a Cloudflare secret */
  var PUB = 'BJ5IzzJPTq4l8pgQHaVIMjlCg11ANg7S6u3UbWcMxZQAKZOkad5WFD69HCLDrITAQvPnDJE-SxgzO3_m34xQAFk';
  var CARD_DELAY = 5000;           // in a browser: five seconds, as asked
  var K = { c: 'gvp.c', token: 'gvp.token', name: 'gvp.name', off: 'gvp.cardDone', read: 'gvp.read' };

  function get(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function tr() { if (window.gvT) { try { window.gvT(); } catch (e) {} } }

  function keyBytes(s) {
    s = (s + '='.repeat((4 - s.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/');
    var raw = atob(s), out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  /* ---- who is this and where are they standing ---------------------------- */
  var ua = navigator.userAgent || '';
  var isIOS = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isAndroid = /android/i.test(ua);
  function standalone() {
    return !!(navigator.standalone ||
      (window.matchMedia && matchMedia('(display-mode: standalone)').matches) ||
      (window.matchMedia && matchMedia('(display-mode: fullscreen)').matches));
  }
  function platform() {
    return (isIOS ? 'ios' : isAndroid ? 'android' : 'desktop') + (standalone() ? '-app' : '-web');
  }
  function able() {
    return ('serviceWorker' in navigator) && ('PushManager' in window) && ('Notification' in window);
  }

  /* The name off the personal link. Kept for good once seen: the link is opened in
     the browser, the app is launched later from an icon, and these are two different
     page loads with nothing in common but this. */
  var code = '';
  try {
    var q = new URLSearchParams(location.search);
    code = (q.get('c') || q.get('guest') || '').trim().slice(0, 24);
  } catch (e) {}
  if (code) set(K.c, code);
  function guestName() { return (code || get(K.c) || '').trim(); }

  /* ---- the one stylesheet ------------------------------------------------- */
  var CSS = [
    '#gvp-say{position:fixed;z-index:9998;left:10px;right:10px;bottom:calc(60px + env(safe-area-inset-bottom,0px));',
    '  box-sizing:border-box;max-width:460px;margin:0 auto;background:#111110;color:#F2F2F0;',
    '  border:1px solid rgba(242,242,240,.16);border-radius:18px;padding:16px;',
    '  font-family:Inter,system-ui,sans-serif;box-shadow:0 16px 48px rgba(0,0,0,.65);',
    '  transform:translateY(14px);opacity:0;transition:transform .28s ease,opacity .28s ease}',
    '#gvp-say.on{transform:translateY(0);opacity:1}',
    '#gvp-say .row{display:flex;align-items:flex-start;gap:12px}',
    '#gvp-say img{width:46px;height:46px;border-radius:12px;flex:0 0 46px}',
    '#gvp-say h4{margin:0 0 4px;font-size:16.5px;font-weight:700;line-height:1.25;color:#F2F2F0}',
    '#gvp-say p{margin:0;font-size:13.5px;line-height:1.5;color:#A8A8A2}',
    '#gvp-say .go{display:block;width:100%;box-sizing:border-box;margin-top:13px;background:#FF4A1C;color:#0A0A0A;',
    '  border:0;border-radius:14px;padding:14px 16px;font:700 15px/1.1 Inter,system-ui,sans-serif;cursor:pointer}',
    '#gvp-say .go:disabled{opacity:.6;cursor:default}',
    '#gvp-say .nm{display:block;width:100%;box-sizing:border-box;margin-top:11px;background:#0A0A0A;color:#F2F2F0;',
    '  border:1px solid rgba(242,242,240,.2);border-radius:12px;padding:11px 13px;font:400 14px/1.2 Inter,system-ui,sans-serif}',
    '#gvp-say .hint{margin-top:10px;font-size:12.5px;line-height:1.5;color:#8C8C88}',
    '#gvp-say .x{position:absolute;top:8px;inset-inline-end:10px;background:none;border:0;color:#8C8C88;',
    '  font-size:22px;line-height:1;cursor:pointer;padding:2px 6px}',
    /* the bell, inside the chrome bar when there is one */
    '#gvp-bell{position:relative;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;',
    '  border-radius:999px;border:1px solid #FF4A1C;background:transparent;color:#fff;cursor:pointer;flex:0 0 34px}',
    '#gvp-bell svg{width:16px;height:16px;stroke:currentColor;stroke-width:1.8;fill:none;stroke-linecap:round;stroke-linejoin:round}',
    '#gvp-bell b{position:absolute;top:-2px;inset-inline-end:-2px;width:10px;height:10px;border-radius:999px;',
    '  background:#FF4A1C;border:2px solid #0A0A0A;display:none}',
    '#gvp-bell.new b{display:block}',
    '#gvp-bell.loose{position:fixed;top:calc(9px + env(safe-area-inset-top,0px));inset-inline-end:10px;z-index:62;background:#0A0A0A}',
    /* one more 34px button in a bar that never wraps: the studio line goes first,
       exactly as it does when the back pill needs the room */
    '#gvc-bar:has(#gvp-bell) #gvc-tag{display:none}',
    /* the messages panel */
    '#gvp-box{position:fixed;inset:0;z-index:9997;display:none;background:rgba(5,5,5,.72);',
    '  -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);font-family:Inter,system-ui,sans-serif}',
    '#gvp-box.on{display:block}',
    '#gvp-box .sheet{position:absolute;left:0;right:0;bottom:0;box-sizing:border-box;max-height:80vh;overflow:auto;',
    '  -webkit-overflow-scrolling:touch;background:#111110;border-top:1px solid rgba(242,242,240,.16);',
    '  border-radius:18px 18px 0 0;padding:14px 16px calc(18px + env(safe-area-inset-bottom,0px))}',
    '@media(min-width:560px){#gvp-box .sheet{left:50%;right:auto;transform:translateX(-50%);width:460px;',
    '  border-radius:18px;bottom:24px;border:1px solid rgba(242,242,240,.16)}}',
    '#gvp-box .hd{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}',
    '#gvp-box .hd h4{margin:0;font-size:15px;font-weight:700;color:#F2F2F0}',
    '#gvp-box .hd button{background:none;border:0;color:#8C8C88;font-size:24px;line-height:1;cursor:pointer;padding:0 4px}',
    '#gvp-box ul{list-style:none;margin:0;padding:0}',
    '#gvp-box li{border-top:1px solid rgba(242,242,240,.1);padding:11px 0}',
    '#gvp-box li b{display:block;font-size:14px;color:#F2F2F0;font-weight:600}',
    '#gvp-box li span{display:block;font-size:13.5px;line-height:1.5;color:#C8C8C2;margin-top:2px;overflow-wrap:anywhere}',
    '#gvp-box li i{display:block;font-style:normal;font-family:"JetBrains Mono",monospace;font-size:10px;',
    '  letter-spacing:.1em;text-transform:uppercase;color:#8C8C88;margin-top:5px}',
    '#gvp-box li a{color:#FF4A1C;font-size:13px;text-decoration:none;border-bottom:1px solid rgba(255,74,28,.5)}',
    '#gvp-box .none{color:#8C8C88;font-size:13.5px;line-height:1.5;padding:8px 0}'
  ].join('');

  function style() {
    if (document.getElementById('gvp-push-css')) return;
    var s = document.createElement('style');
    s.id = 'gvp-push-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ---- the card ----------------------------------------------------------- */
  var card = null, reg = null, sub = null;

  function shutCard() {
    if (!card) return;
    card.classList.remove('on');
    var c = card; card = null;
    setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 300);
  }

  function showCard() {
    if (card || get(K.off) === '1') return;
    /* The iPhone install sheet stands in the same place at the foot of the screen.
       Two cards on top of each other is not a demo, so this one waits its turn. */
    var ios = document.getElementById('gvp-ios');
    if (ios && getComputedStyle(ios).display !== 'none') { setTimeout(showCard, 6000); return; }
    style();
    card = document.createElement('div');
    card.id = 'gvp-say';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', 'Stay in touch with Roma');
    card.innerHTML =
      '<button type="button" class="x" aria-label="Close">&times;</button>' +
      '<div class="row"><img src="/icon-192.png" alt="" width="46" height="46">' +
      '<div><h4>Stay in touch with Roma</h4>' +
      '<p>Tap to get messages from me right here, like any app.</p></div></div>' +
      '<input class="nm" type="text" maxlength="24" autocomplete="given-name" placeholder="Your name" hidden>' +
      '<button type="button" class="go">Turn on messages</button>' +
      '<p class="hint" hidden></p>';
    document.body.appendChild(card);

    var go = card.querySelector('.go'), hint = card.querySelector('.hint'),
        nm = card.querySelector('.nm'), x = card.querySelector('.x');

    function say(text) { hint.textContent = text; hint.hidden = !text; tr(); }

    /* Nothing to ask on an iPhone that has not installed yet: Safari only knows how
       to do this from the home screen, so the card says that instead of failing. */
    if (!able()) {
      if (isIOS && !standalone()) say('On iPhone: tap Share, then Add to Home Screen. Then open it and turn messages on.');
      else say('This browser cannot do messages yet. Open the site in Chrome or Safari on your phone.');
      go.disabled = true;
    } else if (!guestName()) {
      nm.hidden = false;           // no name in the link — ask for one, but never demand it
    }

    x.addEventListener('click', function () { set(K.off, '1'); shutCard(); });

    go.addEventListener('click', function () {
      go.disabled = true;
      go.textContent = 'One moment...';
      tr();
      turnOn(nm.hidden ? '' : nm.value).then(function () {
        set(K.off, '1');
        go.textContent = 'Messages are on';
        say('Done. You will get my messages right here.');
        bellUp();
        setTimeout(shutCard, 2600);
      }, function (e) {
        go.disabled = false;
        go.textContent = 'Turn on messages';
        say((e && e.friendly) || 'That did not go through. Try once more.');
        tr();
      });
    });

    tr();
    requestAnimationFrame(function () { if (card) card.classList.add('on'); });
  }

  function friendly(text) { var e = new Error(text); e.friendly = text; return e; }

  function turnOn(typed) {
    if (!able()) return Promise.reject(friendly('This browser cannot do messages yet.'));
    return Promise.resolve()
      .then(function () { return Notification.requestPermission(); })
      .then(function (p) {
        if (p === 'denied') throw friendly('Messages are switched off for this site. You can turn them back on in the browser settings.');
        if (p !== 'granted') throw friendly('Nothing was allowed, so nothing will arrive. Tap the button again when you are ready.');
        return navigator.serviceWorker.ready;
      })
      .then(function (r) {
        reg = r;
        return r.pushManager.getSubscription().then(function (s) {
          if (s) return s;
          return r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUB) });
        });
      })
      .then(function (s) {
        sub = s;
        var j = s.toJSON();
        return fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            endpoint: j.endpoint,
            keys: j.keys,
            name: guestName() || (typed || '').trim(),
            platform: platform(),
            lang: (document.documentElement.lang || 'en').slice(0, 2),
            ts: Date.now()
          })
        });
      })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (d) {
        if (!d || !d.ok) throw friendly('That did not go through. Try once more.');
        set(K.token, d.token || '');
        set(K.name, d.name || '');
        return d;
      });
  }

  /* ---- the bell and the messages ----------------------------------------- */
  var bell = null, box = null, layer = null, msgs = [], loading = false;

  function unread() {
    var since = parseInt(get(K.read) || '0', 10) || 0;
    var n = 0;
    for (var i = 0; i < msgs.length; i++) if ((msgs[i].ts || 0) > since) n++;
    return n;
  }

  function paintBell() { if (bell) bell.className = (bell.className.replace(/\s*new\b/, '')) + (unread() ? ' new' : ''); }

  function bellUp() {
    if (bell || !get(K.token)) return;
    style();
    bell = document.createElement('button');
    bell.id = 'gvp-bell';
    bell.type = 'button';
    bell.setAttribute('aria-label', 'Messages');
    bell.innerHTML = '<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/>' +
      '<path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg><b></b>';
    /* The front page has no gv-chrome bar of its own — its fixed header is the bar,
       and the globe and the share button already live in it. The bell joins them
       there rather than floating on top of them. */
    var bar = document.getElementById('gvc-bar') || document.querySelector('#nav .nav-in');
    if (bar) bar.appendChild(bell);
    else { bell.className = 'loose'; document.body.appendChild(bell); }
    bell.addEventListener('click', openBox);
    pull();
  }

  function pull() {
    var t = get(K.token);
    if (!t || loading) return Promise.resolve();
    loading = true;
    return fetch('/api/push/messages?token=' + encodeURIComponent(t), { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        msgs = (d && d.messages) || [];
        paintBell();
        if (box && box.classList.contains('on')) paintBox();
      })
      .catch(function () {})
      .then(function () { loading = false; });
  }

  function when(ts) {
    var d = new Date(ts || Date.now()), now = new Date();
    var same = d.toDateString() === now.toDateString();
    var hh = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    return same ? hh : d.toLocaleDateString() + ' ' + hh;
  }

  function paintBox() {
    var ul = box.querySelector('ul'), none = box.querySelector('.none');
    ul.innerHTML = '';
    none.hidden = msgs.length > 0;
    for (var i = 0; i < msgs.length; i++) {
      var m = msgs[i], li = document.createElement('li');
      var b = document.createElement('b'); b.textContent = m.title || 'GenVidPro';
      var s = document.createElement('span'); s.textContent = m.body || '';
      li.appendChild(b); li.appendChild(s);
      if (m.url && m.url !== '/' && /^https?:\/\//.test(m.url)) {
        var a = document.createElement('a');
        a.href = m.url; a.target = '_blank'; a.rel = 'noopener';
        a.textContent = 'Open link';
        li.appendChild(a);
      }
      var t = document.createElement('i'); t.textContent = when(m.ts);
      li.appendChild(t);
      ul.appendChild(li);
    }
    tr();
  }

  function openBox() {
    style();
    if (!box) {
      box = document.createElement('div');
      box.id = 'gvp-box';
      box.innerHTML = '<div class="sheet"><div class="hd"><h4>Messages</h4>' +
        '<button type="button" aria-label="Close">&times;</button></div>' +
        '<p class="none">No messages yet. Roma will write here.</p><ul></ul></div>';
      document.body.appendChild(box);
      box.querySelector('.hd button').addEventListener('click', shutBox);
      box.addEventListener('click', function (e) { if (e.target === box) shutBox(); });
      if (window.gvLayer) { layer = window.gvLayer(); layer.onBack = function () { box.classList.remove('on'); }; }
    }
    paintBox();
    box.classList.add('on');
    if (layer) layer.open();
    set(K.read, String(Date.now()));
    paintBell();
    pull();
  }

  function shutBox() {
    if (!box) return;
    box.classList.remove('on');
    if (layer && layer.on) layer.shut();
  }

  /* ---- start ------------------------------------------------------------- */
  function start() {
    if (!document.body) return;

    if (get(K.token)) {
      bellUp();
      /* a message that arrived while the app was open should show up without a reload */
      if ('serviceWorker' in navigator && navigator.serviceWorker.addEventListener) {
        navigator.serviceWorker.addEventListener('message', function (e) {
          if (e.data && e.data.gvp === 'push') pull();
        });
      }
      document.addEventListener('visibilitychange', function () { if (!document.hidden) pull(); });
    }

    /* Already subscribed and filed? Then there is nothing to ask. */
    if (able() && get(K.token) && Notification.permission === 'granted') return;
    if (get(K.off) === '1') return;

    if (standalone()) setTimeout(showCard, 700);
    else if (guestName()) setTimeout(showCard, CARD_DELAY);
  }

  /* opened from a notification: show what came */
  if (/[?&]gvp=msg/.test(location.search)) setTimeout(function () { if (get(K.token)) openBox(); }, 900);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.gvpMessages = openBox;      // so any page can open the panel
})();
