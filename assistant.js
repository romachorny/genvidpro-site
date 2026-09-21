/* The GenVidPro assistant, in one file, for every page.

   It used to live inside index.html only. A visitor who went to the site builder
   or opened a template had nobody to ask exactly where they were deciding to buy,
   which is the wrong place to be silent. Now every page loads this and gets the
   same button, the same voice and the same seller.

   Everything is self-sufficient: the styles do not lean on the page's custom
   properties, because the builder and the small legal pages do not define them.
   If a page already has the widget in its markup, this file steps aside.

   15.09.2026: greets in the language the site is set to (not the browser's), and
   greets again after a switch; Back on a phone closes the panel instead of leaving
   the site; answers are read by the neural voice from /tts when it is configured,
   and by the browser voice otherwise; the panel side follows the page direction. */
(function () {
  if (window.__gvpAssistant) return;
  window.__gvpAssistant = 1;
  if (document.getElementById('help-pill')) return;

  var ACC = '#FF4A1C';
  var W3_KEY = '33ac8d6d-a278-461b-99cb-86e73b69ca88';

  var CSS = [
    '.gvpa{position:fixed;inset-inline-end:16px;bottom:16px;z-index:2147483000;font-family:Inter,system-ui,sans-serif}',
    '.gvpa *{box-sizing:border-box}',
    '.gvpa-pill{display:flex;flex-direction:column;align-items:center;text-align:center;gap:1px;',
    ' background:rgba(10,9,8,.24);border:1px solid rgba(255,74,28,.8);color:#fff;border-radius:999px;padding:10px 20px;',
    ' box-shadow:0 0 10px rgba(255,74,28,.55),0 0 26px rgba(255,74,28,.28),inset 0 0 14px rgba(255,74,28,.12);',
    ' font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;transition:background .3s,box-shadow .3s;',
    ' text-shadow:0 0 8px rgba(255,74,28,.9),0 1px 3px rgba(0,0,0,.9);animation:gvpafloat 3.8s ease-in-out infinite;-webkit-tap-highlight-color:transparent}',
    '@keyframes gvpafloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}',
    '@media(prefers-reduced-motion:reduce){.gvpa-pill{animation:none}}',
    '.gvpa-pill:hover{background:' + ACC + ';border-color:' + ACC + ';color:#0a0a0a;text-shadow:none;box-shadow:0 0 16px rgba(255,74,28,.85),0 0 44px rgba(255,74,28,.5)}',
    '.gvpa-box{position:absolute;inset-inline-end:0;bottom:0;width:min(94vw,380px);max-width:calc(100vw - 24px);background:#111110;',
    ' border:1px solid rgba(242,242,240,.14);border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,.6);display:flex;flex-direction:column;overflow:hidden;color:#F2F2F0}',
    '.gvpa-box[hidden],.gvpa-pill[hidden]{display:none!important}',
    '.gvpa-head{display:grid;grid-template-columns:1fr auto;gap:0 10px;padding:14px 16px 12px;border-bottom:1px solid rgba(242,242,240,.14)}',
    '.gvpa-head b{font-size:14px}.gvpa-head span{grid-column:1;font-size:12px;color:#9a938a}',
    '.gvpa-x{grid-column:2;grid-row:1/span 2;background:none;border:0;color:#9a938a;font-size:16px;cursor:pointer;min-width:40px;min-height:40px}',
    '.gvpa-log{padding:14px 16px;display:flex;flex-direction:column;gap:10px;max-height:46vh;overflow-y:auto;font-size:14px;line-height:1.5}',
    '.gvpa-m{padding:10px 12px;border-radius:10px;max-width:92%;white-space:pre-wrap;unicode-bidi:plaintext;text-align:start}',
    '.gvpa-m.bot{background:rgba(242,242,240,.06);align-self:flex-start}',
    '.gvpa-m.me{background:rgba(255,74,28,.16);align-self:flex-end}',
    '.gvpa-m.wait{color:#9a938a}',
    '.gvpa-form{display:flex;gap:8px;padding:10px 12px;border-top:1px solid rgba(242,242,240,.14);align-items:center}',
    '.gvpa-form input{flex:1 1 0;min-width:0;background:#0d0d0c;border:1px solid rgba(242,242,240,.14);border-radius:100px;padding:10px 14px;color:#F2F2F0;font-family:inherit;font-size:14px}',
    '.gvpa-send{flex:0 0 auto;padding:10px 16px;white-space:nowrap;border:0;border-radius:100px;background:' + ACC + ';color:#0a0a0a;font-family:inherit;font-weight:700;font-size:13px;cursor:pointer}',
    '.gvpa-ic{flex:0 0 auto;width:36px;height:36px;border-radius:50%;border:1px solid rgba(255,74,28,.55);background:none;color:#F2F2F0;display:grid;place-items:center;cursor:pointer;padding:0;transition:.2s}',
    '.gvpa-ic svg{width:17px;height:17px;fill:currentColor;display:block}',
    '.gvpa-ic:hover{border-color:' + ACC + '}',
    '.gvpa-ic.on{color:' + ACC + ';border-color:' + ACC + ';box-shadow:0 0 8px rgba(255,74,28,.5)}',
    '.gvpa-ic.rec{background:' + ACC + ';color:#0a0a0a}',
    '.gvpa-lang{flex:0 0 auto;appearance:none;-webkit-appearance:none;background:none;border:1px solid rgba(242,242,240,.14);color:#9a938a;border-radius:100px;padding:5px 7px;font-family:ui-monospace,monospace;font-size:10px;letter-spacing:.08em;cursor:pointer;text-align:center}',
    '.gvpa-lang option{background:#111110;color:#F2F2F0}'
  ].join('');

  var MIC = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3z"/><path d="M18 11a1 1 0 1 0-2 0 4 4 0 0 1-8 0 1 1 0 1 0-2 0 6 6 0 0 0 5 5.91V20H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-3.09A6 6 0 0 0 18 11z"/></svg>';
  var SPK_ON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7 1 1 0 0 0 1.4 1.4 7 7 0 0 0 0-9.8 1 1 0 1 0-1.4 1.4z"/><path d="M19.2 5.8a9 9 0 0 1 0 12.4 1 1 0 0 0 1.4 1.4 11 11 0 0 0 0-15.2 1 1 0 1 0-1.4 1.4z"/></svg>';
  var SPK_OFF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M22 9.4 20.6 8l-2.3 2.3L16 8l-1.4 1.4 2.3 2.3-2.3 2.3L16 15.4l2.3-2.3 2.3 2.3L22 14l-2.3-2.3z"/></svg>';

  /* The lines the page writes before the assistant has said a word. */
  var T = {
    en: { hi: 'Hi, GenVidPro here. Video, a brand, or a whole website, those are the three things made in this studio. Tell me what you sell and who buys it, and I will tell you what it costs and how fast it lands.', ph: 'Type your question', off: 'The assistant is quiet right now. Roman answers on WhatsApp within the hour.', no: 'No connection right now. Use the WhatsApp button at the bottom of the page and Roman will answer.', sub: 'Ask anything, it puts the order together with you. Roman reads it too.', send: 'Send' },
    ru: { hi: 'Здравствуйте, это GenVidPro. Расскажите, что вы продаёте и кто это покупает, и я скажу цену и сроки, или соберу заказ вместе с вами.', ph: 'Напишите вопрос', off: 'Помощник сейчас молчит. Роман отвечает в WhatsApp в течение часа.', no: 'Нет связи. Нажмите кнопку WhatsApp внизу страницы, Роман ответит.', sub: 'Спросите что угодно, он соберёт заказ вместе с вами. Роман это читает.', send: 'Отправить' },
    he: { hi: 'שלום, כאן GenVidPro. ספרו לי מה אתם מוכרים ומי קונה, ואגיד לכם כמה זה עולה וכמה זמן זה לוקח.', ph: 'כתבו שאלה', off: 'העוזר שותק כרגע. רומן עונה בוואטסאפ תוך שעה.', no: 'אין חיבור כרגע. לחצו על כפתור וואטסאפ למטה ורומן יענה.', sub: 'שאלו כל דבר, הוא ירכיב אתכם הזמנה. רומן קורא את זה.', send: 'שליחה' }
  };
  /* The site language first, the browser second, English last. A visitor who has
     switched the page to Hebrew is greeted in Hebrew whatever the browser says. */
  function two() {
    var l = String(document.documentElement.lang || '').slice(0, 2).toLowerCase();
    if (!l) l = String((navigator.languages && navigator.languages[0]) || navigator.language || 'en').slice(0, 2).toLowerCase();
    return T[l] ? l : 'en';
  }
  function t() { return T[two()]; }
  function rtl(l) { return l === 'he' || l === 'ar'; }

  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  var root = document.createElement('div');
  root.className = 'gvpa';
  root.innerHTML =
    '<button type="button" class="gvpa-pill" id="gvpa-pill" aria-expanded="false">Ask GenVidPro</button>' +
    '<div class="gvpa-box" id="gvpa-box" hidden>' +
      '<div class="gvpa-head"><b>GenVidPro Assistant</b><span id="gvpa-sub"></span>' +
      '<button type="button" class="gvpa-x" id="gvpa-x" aria-label="Close">✕</button></div>' +
      '<div class="gvpa-log" id="gvpa-log"><div class="gvpa-m bot" id="gvpa-hi"></div></div>' +
      '<form class="gvpa-form" id="gvpa-form">' +
        '<button type="button" class="gvpa-ic" id="gvpa-mic" aria-label="Speak your question" title="Speak">' + MIC + '</button>' +
        '<select class="gvpa-lang" id="gvpa-lang" aria-label="Dictation language" title="Dictation language"></select>' +
        '<button type="button" class="gvpa-ic" id="gvpa-spk" aria-label="Read the answers out loud" title="Read the answers out loud" aria-pressed="false">' + SPK_OFF + '</button>' +
        '<input id="gvpa-in" autocomplete="off" maxlength="600">' +
        '<button type="submit" class="gvpa-send" id="gvpa-send">Send</button>' +
      '</form>' +
    '</div>';
  (document.body || document.documentElement).appendChild(root);

  var pill = root.querySelector('#gvpa-pill'), box = root.querySelector('#gvpa-box'),
      log = root.querySelector('#gvpa-log'), form = root.querySelector('#gvpa-form'),
      inp = root.querySelector('#gvpa-in'), hist = [];

  /* the words of the panel, in the current language; the greeting is rewritten only
     while nobody has said anything yet */
  function words() {
    var l = two(), x = t();
    root.querySelector('#gvpa-sub').textContent = x.sub;
    inp.placeholder = x.ph;
    root.querySelector('#gvpa-send').textContent = x.send;
    if (!hist.length) root.querySelector('#gvpa-hi').textContent = x.hi;
    log.dir = rtl(l) ? 'rtl' : 'ltr';
    inp.dir = rtl(l) ? 'rtl' : 'auto';
  }
  words();
  document.addEventListener('gvlang', function () { if (box.hidden) words(); });

  /* gv-chrome.js, which keeps the history layers, loads after this file */
  var layer = null;
  function lay() {
    if (!layer && window.gvLayer) { layer = window.gvLayer(); layer.onBack = function () { open(false, true); }; }
    return layer;
  }
  function open(o, fromBack) {
    box.hidden = !o; pill.hidden = o; pill.setAttribute('aria-expanded', String(o));
    var L = lay();
    if (o) { if (L) L.open(); setTimeout(function () { inp.focus(); }, 50); }
    else if (L && !fromBack) L.shut();
    if (!o && window.gvTTS) window.gvTTS.stop();
  }
  pill.addEventListener('click', function () { words(); open(true); });
  root.querySelector('#gvpa-x').addEventListener('click', function () { open(false); });
  function add(text, cls) { var d = document.createElement('div'); d.className = 'gvpa-m ' + cls; d.textContent = text; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; }

  var SID = window.GVP_SID || (function () { try { var k = 'gvp_sid', v = sessionStorage.getItem(k); if (!v) { v = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); sessionStorage.setItem(k, v); } return v; } catch (e) { return 'na' + Date.now().toString(36); } })();

  /* The letter is posted from the browser, not from the worker: Web3Forms rate
     limits by source address and a Cloudflare worker shares its addresses with a
     great many other sites, so every attempt from there came back 429. The key is
     checked before the flag is raised, so a lost letter never looks delivered. */
  function notifyLead(withContact) {
    var stage = withContact ? 2 : 1;
    if ((window.gvpLeadStage || 0) >= stage) return;
    if (!W3_KEY) return;
    var prev = window.gvpLeadStage || 0;
    window.gvpLeadStage = stage; window.gvpLeadSent = true;
    var text = hist.map(function (m) { return (m.role === 'user' ? 'Client: ' : 'GenVidPro: ') + m.content; }).join('\n');
    fetch('https://api.web3forms.com/submit', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: W3_KEY,
        subject: (withContact ? 'GenVidPro: lead WITH CONTACT on genvidpro.com [' : 'GenVidPro: someone is asking about an order [') + SID + ']',
        from_name: 'GenVidPro', name: 'GenVidPro chat', email: 'genvidpro@gmail.com',
        message: text + '\n\nPage: ' + location.pathname + '\nSession ' + SID, botcheck: ''
      })
    }).then(function (r) { if (!r.ok) { window.gvpLeadStage = prev; window.gvpLeadSent = prev > 0; } })
      .catch(function () { window.gvpLeadStage = prev; window.gvpLeadSent = prev > 0; });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = inp.value.trim(); if (!q) return;
    inp.value = ''; add(q, 'me'); hist.push({ role: 'user', content: q });
    var w = add('…', 'bot wait');
    var place = window.gvpPlace ? window.gvpPlace() : { path: location.pathname };
    place.lang = String(document.documentElement.lang || 'en').slice(0, 2);
    fetch('/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: hist, s: SID, notified: !!window.gvpLeadSent, p: place }) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (o) {
        if (o.ok && o.j.reply) {
          /* the text first, always: the voice joins when it is ready */
          w.textContent = o.j.reply; w.className = 'gvpa-m bot';
          hist.push({ role: 'assistant', content: o.j.reply });
          if (window.gvSay) window.gvSay(o.j.reply);
          if (o.j.lead) notifyLead(!!o.j.contact);
        } else { w.textContent = t().off; w.className = 'gvpa-m bot'; }
      })
      .catch(function () { w.textContent = t().no; w.className = 'gvpa-m bot'; });
  });

  /* Reading the answers out loud: the neural voice from /tts when the studio has one
     configured, the browser's own voice when it has not or the request fails. */
  (function () {
    var btn = root.querySelector('#gvpa-spk');
    var hasBrowser = ('speechSynthesis' in window) && ('SpeechSynthesisUtterance' in window);
    if (!hasBrowser && !window.gvTTS) { btn.remove(); return; }
    var on = false, keep = null, voices = [], said = 0;
    function loadVoices() { try { voices = speechSynthesis.getVoices() || []; } catch (e) { voices = []; } }
    if (hasBrowser) { loadVoices(); try { speechSynthesis.addEventListener('voiceschanged', loadVoices); } catch (e) {} }
    function guessLang(x) {
      if (/[֐-׿]/.test(x)) return 'he-IL';
      if (/[؀-ۿ]/.test(x)) return 'ar-SA';
      if (/[Ѐ-ӿ]/.test(x)) return /[іїєґ]/i.test(x) ? 'uk-UA' : 'ru-RU';
      if (/[぀-ヿ]/.test(x)) return 'ja-JP';
      if (/[一-鿿]/.test(x)) return 'zh-CN';
      return /[A-Za-z]/.test(x) ? 'en-US' : (document.documentElement.lang || navigator.language || 'en-US');
    }
    function pick(code) {
      var short = code.slice(0, 2).toLowerCase(), near = null;
      for (var i = 0; i < voices.length; i++) {
        var v = voices[i], l = String(v.lang || '').replace('_', '-');
        if (l.toLowerCase() === code.toLowerCase()) return v;
        if (!near && l.slice(0, 2).toLowerCase() === short) near = v;
      }
      return near;
    }
    function stopAll() {
      if (hasBrowser) { try { speechSynthesis.cancel(); } catch (e) {} }
      if (keep) { clearInterval(keep); keep = null; }
      if (window.gvTTS) window.gvTTS.stop();
    }
    /* 16.09.2026, Roma: "it said the first sentence and stopped." Every browser cuts a long
       utterance short, and on Android the pause/resume trick that patches that on a desktop is
       what kills it outright. The answer is cut into sentences no longer than a breath and
       spoken one after another, each started by the end of the one before. */
    function pieces(text) {
      var out = [], rest = String(text).replace(/\s+/g, ' ').trim();
      while (rest.length > 180) {
        var cut = -1;
        var stopAt = rest.slice(0, 180).search(/[.!?…][^.!?…]*$/);
        if (stopAt > 40) cut = stopAt + 1;
        if (cut < 0) { var c = rest.lastIndexOf(',', 180); if (c > 40) cut = c + 1; }
        if (cut < 0) { var sp = rest.lastIndexOf(' ', 180); cut = sp > 40 ? sp : 180; }
        out.push(rest.slice(0, cut).trim());
        rest = rest.slice(cut).trim();
      }
      if (rest) out.push(rest);
      return out;
    }
    function chain(list, code, mine) {
      if (mine !== said || !list.length || !hasBrowser) return;
      var u = new SpeechSynthesisUtterance(list[0]);
      u.lang = code; var v = pick(code); if (v) u.voice = v;
      u.rate = 1.02; u.pitch = 1.05;
      u.onend = function () { if (mine === said) chain(list.slice(1), code, mine); };
      u.onerror = function () { if (mine === said) chain(list.slice(1), code, mine); };
      try { speechSynthesis.speak(u); } catch (e) {}
    }
    function browserSay(text, code) {
      if (!hasBrowser) return;
      loadVoices();
      var mine = said;
      setTimeout(function () { chain(pieces(text), code, mine); }, 60);
    }
    window.gvSay = function (text) {
      if (!on) return; text = String(text || '').trim(); if (!text) return;
      stopAll();
      var mine = ++said, code = guessLang(text);
      if (!window.gvTTS) { browserSay(text, code); return; }
      window.gvTTS.speak(text, code.slice(0, 2)).then(function (ok) {
        if (!ok && on && mine === said) browserSay(text, code);
      });
    };
    btn.addEventListener('click', function () {
      on = !on;
      btn.setAttribute('aria-pressed', String(on));
      btn.className = 'gvpa-ic' + (on ? ' on' : '');
      btn.innerHTML = on ? SPK_ON : SPK_OFF;
      if (!on) { said++; stopAll(); return; }
      if (window.gvTTS) window.gvTTS.unlock();
      var bots = log.querySelectorAll('.gvpa-m.bot');
      for (var i = bots.length - 1; i >= 0; i--) {
        if (bots[i].className.indexOf('wait') >= 0) continue;
        window.gvSay(bots[i].textContent); break;
      }
    });
  })();

  /* Dictation. The Web Speech API does not detect the language, so the two-letter
     chip is the smallest honest control there is. */
  (function () {
    var b = root.querySelector('#gvpa-mic'), sel = root.querySelector('#gvpa-lang');
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { b.remove(); sel.remove(); return; }
    var LANGS = [['en-US', 'EN'], ['ru-RU', 'RU'], ['he-IL', 'HE'], ['ar-SA', 'AR'], ['es-ES', 'ES'], ['fr-FR', 'FR'], ['de-DE', 'DE'], ['uk-UA', 'UA']];
    function pref() { var l = two(); return l === 'ru' ? 'ru-RU' : l === 'he' ? 'he-IL' : 'en-US'; }
    LANGS.forEach(function (l) { var o = document.createElement('option'); o.value = l[0]; o.textContent = l[1]; sel.appendChild(o); });
    sel.value = pref();
    var touched = false;
    sel.addEventListener('change', function () { touched = true; });
    document.addEventListener('gvlang', function () { if (!touched) sel.value = pref(); });
    var rec = null, running = false;
    /* 16.09.2026, Roma: every refusal was swallowed, so the button looked dead. The permission
       is asked for plainly and whatever happens is said in the field itself. */
    var MICMSG = { denied: 'The microphone is blocked. Allow it for this site in the browser settings.',
      none: 'I heard nothing. Press the microphone and speak straight away.',
      no: 'This browser cannot listen. Type the question instead.' };
    function micNote(m) {
      var old = inp.getAttribute('placeholder') || '';
      inp.setAttribute('placeholder', m);
      setTimeout(function () { inp.setAttribute('placeholder', old); }, 4500);
    }
    b.addEventListener('click', function () {
      if (running && rec) { try { rec.stop(); } catch (e) {} return; }
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function (st) {
          try { st.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
          begin();
        }, function () { micNote(MICMSG.denied); });
        return;
      }
      begin();
    });
    function begin() {
      try { rec = new SR(); } catch (e) { micNote(MICMSG.no); return; }
      rec.lang = sel.value; rec.interimResults = true; rec.continuous = false;
      rec.onstart = function () { running = true; b.className = 'gvpa-ic rec'; };
      rec.onend = function () { running = false; b.className = 'gvpa-ic'; };
      rec.onerror = function (e) { running = false; b.className = 'gvpa-ic';
        var w = e && e.error;
        micNote(w === 'not-allowed' || w === 'service-not-allowed' ? MICMSG.denied : w === 'no-speech' ? MICMSG.none : MICMSG.no); };
      rec.onresult = function (e) {
        var s = '';
        for (var i = e.resultIndex; i < e.results.length; i++) s += e.results[i][0].transcript;
        inp.value = s.trim();
        if (e.results[e.results.length - 1].isFinal) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      };
      try { rec.start(); } catch (e) { micNote(MICMSG.no); }
    }
  })();
})();
