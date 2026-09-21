/* Notifications on genvidpro.com, 15.09.2026.
   Two buttons under the install block: one asks the browser for permission and
   files the subscription, the other sends a real notification back to this very
   phone. Nothing here runs on a browser that cannot do push, and nothing here
   asks for permission on its own — a prompt nobody expects is a prompt people
   block for good. */
(function () {
  'use strict';
  /* 15.09.2026: loaded by gv-chrome.js on every page and still tagged on the front page,
     so it must never build its buttons twice */
  if (window.__gvPush) return;
  window.__gvPush = 1;

  /* Every sentence below is an English key in i18n.js (Hebrew and Russian blocks).
     The text is written in English and handed to the translator right away, and again
     whenever the visitor switches the language. */
  function tr() { if (window.gvT) { try { window.gvT(); } catch (e) {} } }

  var PUB = 'BHspUallzbuJ1vcdFmgVwKE5mL3oUwPJy8Nw2fpf3pj_ua0Vw2L5egow1_Yf340HYAgra5UzDkV5pgKx03TJ1Q0';

  function keyBytes(s) {
    s = (s + '='.repeat((4 - s.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/');
    var raw = atob(s), out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  function start() {
    /* the install button on the front page, or a marked place on another page (the builder);
       a page with neither simply gets no button, quietly */
    var anchor = document.getElementById('gvAppBtn') || document.querySelector('[data-gv-push]');
    if (!anchor) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;

    var wrap = document.createElement('div');
    wrap.style.cssText = 'margin-top:10px;display:flex;flex-wrap:wrap;gap:8px;align-items:center';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = anchor.getAttribute('data-gv-push-class') || anchor.className;
    btn.id = 'gvPushBtn';
    btn.textContent = 'Turn on notifications';

    var msg = document.createElement('span');
    msg.id = 'gvPushMsg';
    msg.style.cssText = 'font-family:Inter,system-ui,sans-serif;font-size:12.5px;line-height:1.5;opacity:.75';

    wrap.appendChild(btn);
    wrap.appendChild(msg);
    if (anchor.hasAttribute('data-gv-push')) anchor.appendChild(wrap);
    else anchor.parentNode.insertBefore(wrap, anchor.nextSibling);
    document.addEventListener('gvlang', function () { if (!busy) paint(); });
    /* translated at once: paint() waits for the service worker, which may take a while
       or never come (a browser that blocks it), and the button stayed in English */
    tr();

    var reg = null, sub = null, busy = false;

    function paint() {
      if (Notification.permission === 'denied') {
        btn.disabled = true;
        btn.textContent = 'Notifications blocked';
        msg.textContent = 'Turn them back on in the browser settings for this site.';
        return;
      }
      if (sub) {
        btn.disabled = false;
        btn.textContent = 'Send me a test notification';
        msg.textContent = 'This phone is subscribed.';
      } else {
        btn.disabled = false;
        btn.textContent = 'Turn on notifications';
        msg.textContent = '';
      }
      tr();
    }
    function say(text) { msg.textContent = text; tr(); }

    navigator.serviceWorker.ready.then(function (r) {
      reg = r;
      return r.pushManager.getSubscription();
    }).then(function (s) {
      sub = s;
      paint();
    }).catch(function () { paint(); });

    btn.addEventListener('click', function () {
      if (busy) return;
      busy = true;
      btn.disabled = true;
      btn.textContent = 'One moment...';
      tr();

      var note = '';
      var job = sub ? test() : subscribe();
      job.then(function (t) { note = t || ''; }, function (e) {
        note = (e && e.message) || 'Did not work. Try again.';
      }).then(function () {
        busy = false;
        btn.disabled = false;
        paint();
        if (note) say(note);
      });
    });

    function subscribe() {
      return Notification.requestPermission().then(function (p) {
        if (p !== 'granted') throw new Error('Not allowed, so nothing will arrive.');
        return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(PUB) });
      }).then(function (s) {
        sub = s;
        var j = s.toJSON();
        return fetch('/push-sub', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ endpoint: j.endpoint, keys: j.keys, lang: document.documentElement.lang || '', tag: 'site' })
        });
      }).then(function () {
        return 'Done. Now send yourself a test.';
      });
    }

    /* The message used to be written straight away and then overwritten by paint(), so
       "Sent. It lands in a second or two." never stayed on the screen: the text is now
       handed back and written after paint(). */
    function test() {
      return fetch('/push-test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint })
      }).then(function (r) { return r.json(); }).then(function (d) {
        return d && d.ok ? 'Sent. It lands in a second or two.' : 'The push service answered ' + ((d && d.status) || '?') + '.';
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
