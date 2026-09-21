/* Service worker genvidpro.com.
   Network-first: страница всегда свежая, кеш — только запасной парашют,
   чтобы приложение открывалось в метро без сети.

   Фильмы и постеры в кеш НЕ кладём: /videos весит 237 МБ, /media 13 МБ, один
   визит забил бы квоту CacheStorage телефона, а офлайн они всё равно не нужны.
   Отдаём их из сети напрямую, как раньше. Шрифты (688 КБ) кешируем — без них
   офлайн-страница разъезжается. */

const CACHE = 'gvp-v7';
const CORE = ['/', '/index.html', '/builder.html', '/tpl-engine.js', '/icon-192.png', '/icon-512.png'];
const NO_STORE = /^\/(videos|media)\//;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  /* Films, stills and the two endpoints never pass through this worker at all.
     They used to be fetched here and handed back, and any hiccup on the way -
     an update of the worker itself, an aborted request - turned into an image
     answered with HTML, which the browser shows as a broken picture. Now the
     browser talks to the network for them directly, as if there were no worker. */
  if (NO_STORE.test(url.pathname) || url.pathname === '/ev' || url.pathname === '/chat' || url.pathname.indexOf('/push') === 0) return;
  const skip = false;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        if (!skip && r.ok && r.type === 'basic') {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return r;
      })
      /* Only a page may fall back to the cached home page. An image or a script
         that failed used to be answered with the HTML of "/", which the browser
         then reported as a broken image - and the template blocks hid themselves. */
      .catch(() => caches.match(e.request).then(r => {
        if (r) return r;
        if (e.request.mode === 'navigate') return caches.match('/');
        return Response.error();
      }))
  );
});


/* ---- Notifications, 15.09.2026 -------------------------------------------
   A push is sent with no body on purpose: an encrypted payload needs the whole
   aes128gcm dance on the sending side, and the only thing it buys is one round
   trip. The worker is woken up empty and reads the text it should show from
   /push-latest. If that call fails the notification still has to appear, or
   Chrome puts up its own "This site has been updated in the background". */
self.addEventListener('push', e => {
  e.waitUntil((async () => {
    let d = null;
    if (e.data) { try { d = e.data.json(); } catch (_) { try { d = { body: e.data.text() }; } catch (_) {} } }
    if (!d) { try { d = await fetch('/push-latest', { cache: 'no-store' }).then(r => r.json()); } catch (_) {} }
    d = d || {};
    await self.registration.showNotification(d.title || 'GenVidPro', {
      body: d.body || '',
      icon: '/icon-192.png',
      badge: '/favicon-32.png',
      dir: 'auto',
      lang: d.lang || 'en',
      tag: d.tag || 'gvp',
      renotify: true,
      data: { url: d.url || '/' }
    });
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) {
      if (c.url.indexOf(self.location.origin) === 0 && 'focus' in c) {
        if ('navigate' in c) c.navigate(url);
        return c.focus();
      }
    }
    return self.clients.openWindow(url);
  }));
});
