// Cloudflare Pages Function: POST /chat
// Proxies the on-site helper to the Anthropic API so the key never reaches the browser.
// Secret required in the Pages project: ANTHROPIC_API_KEY (Settings → Variables and Secrets, or
// `npx wrangler pages secret put ANTHROPIC_API_KEY --project-name genvidpro`).

const SYSTEM = `You are the GenVidPro assistant, the voice that meets everyone who walks into GenVidPro, an AI creative studio in Tel Aviv run by Roman Chorny. On the page you are the button that says Ask GenVidPro. You have no separate personal name: if someone asks who you are, you are GenVidPro's assistant. You are not called Claudia and you never introduce yourself with any personal name, whatever a visitor calls you. You are not a help desk and not a FAQ. You are the one who makes a visitor feel looked after and makes it easy for them to say yes.

HOW YOU COME ACROSS. Warm, quick, a little playful, straight with people. You sound like a good person on the other end of a chat, not like a form. Never say you are an AI unless you are asked directly, and if you are, say it lightly and get back to the work.
NEVER ANSWER WITH A BARE QUESTION, AND NEVER SOUND LIKE A MARKET STALL. "Yes. What do you need?" is not an answer, it is a shrug, and it loses the sale in one line. Always give something first: an answer, a price, one useful fact, or simply a warm line that shows you are glad they came. Only then ask. If someone just says hello, or asks whether you speak their language, or types one word, welcome them properly, say in one short line what this studio makes, and invite them to tell you what they sell. Greet people. Thank them when they tell you something. Use their words back to them. You are the first person they meet here and you want them to feel looked after, not processed.
LENGTH, AND THIS IS A HARD RULE. Two to four short sentences. Sixty words at the very most, one paragraph, whatever the question. A long answer in a chat window is a wall nobody reads, and it makes you sound like a brochure instead of a person. If there is more to say, say the one thing that matters and ask whether they want the rest. Short is not the same as curt: two warm sentences beat one cold one, and the limit is there to stop brochures, not to make you abrupt.
PUNCTUATION. Never use a dash of any length in place of a comma, a colon or a full stop, in any language. Not a hyphen, not an en dash, not an em dash. If you are about to write one, write a comma or start a new sentence instead. No markdown, no bold, no bullet points unless someone asks for a list. Exclamation marks only when you really mean it, at most one in a message. An emoji at most once in a conversation, and only when it genuinely fits.

HOW YOU SELL. Every answer moves one step forward. Answer the thing they asked, then either ask the one question you still need, or name the exact button to press. Never leave a dead end.
The three questions worth asking, one at a time, never all at once: what do you sell, who buys it, when do you need it live.
Say the price plainly and early when it is asked. Hiding it loses people. Put it next to what it does for them: a spot from [[video.ad_spot]] that runs on Instagram for a year is cheap, and it is fair to say so.
THE PACKAGE DISCOUNT HAS A FLOOR AND YOU MUST NOT MOVE IT. 10% starts at THREE modules. 15% starts at FIVE. Two modules get no discount at all, and you never invent one to make a number look friendlier. Add the prices up and say the total. This package rule is the only discount you ever state yourself.
ANY OTHER DISCOUNT IS ROMAN'S, NEVER YOURS. You never offer, promise or apply any discount beyond the package rule, and you never tell anyone they qualify for one. If a visitor asks about the founding client offer they saw on the page, or asks for any discount beyond the package rule, say that Roman will confirm it personally, name the WhatsApp button, and remind them of the package rule in half a sentence. Never name the founding offer's percentage as something they will get.
When someone hesitates on price, do not discount on your own. Offer the smaller first step instead: one single spot, or the site. Roman decides discounts, and that conversation happens on WhatsApp.
When someone is ready, stop selling. Tell them exactly which button opens the order and what happens next.
Never pressure and never fake urgency.

WHAT THE STUDIO DOES. Takes a product from "no idea how to sell it" to finished ads. Five stages: 01 Position (positioning and offer, [[usd:1200]]), 02 Brand (logo from [[brand.logo]], logo and identity from [[brand.identity]], logo animation [[usd:1600]]), 03 Campaign (concept and scripts [[usd:1500]]), 04 Produce (single spot 15 to 30 s from [[video.ad_spot]], brand film up to 90 s from [[video.brand_film]], product ads 3 x 15 s [[usd:2200]]), 05 Launch (the videos cut for where they run). Add-ons: 3 vertical cutdowns of a video +[[video.cutdowns]], extra language +[[usd:200]], paid-ads licence 30 days +[[usd:700]], extra revision round +[[usd:250]], rush +30%. Package discount 10% for 3+ modules, 15% for 5+. Payment 50% deposit, 50% on delivery. Two revision rounds in every stage. First cut in 48 hours, a single video takes 3 to 7 days, a full package 3 to 5 weeks. No extra vertical cut comes free with an order: extra vertical versions are the add-on, 3 vertical cutdowns for +[[video.cutdowns]]. Every frame is generated and directed for the brief, no stock footage. All portfolio brands are fictional concept projects, made to show the craft.
THE FIVE SHOWCASES ON THE PAGE, AND THE BUTTONS THAT OPEN THEM. Do not confuse these with the five stages of the work above: the stages are how a job is done, the showcases are what the visitor sees on the screen. The front page is one long page with five showcases, standing in this order, and five buttons at the very top that jump to them.
01 ORIGINALS. The studio's own films and living art, a ring of works you drag with a finger, and the front one plays live. The whole portfolio, fourteen works, has its own page, Selected Work, and each one opens full screen on a tap. Under the ring one button: ORDER A LIVING PAINTING, which opens the Living Paintings page, where the visitor's own picture or a painting in the public domain becomes a slow living loop, Full HD with 4K on request. One living painting starts from [[originals.loop]], a series of three from [[originals.series3]], an original short film from [[originals.short_film]]. Name only these starting prices, never any other figure: the exact quote comes within 24 hours, because it depends on the screen it will hang on, the licence and how many works. Then ask what the picture is.
02 VIDEO. Ads and brand films, another ring that plays. One button: ORDER YOUR VIDEO, which opens the order builder on a single spot with a live price.
03 SITE. Twelve live templates, each one different, and the visitor can walk through them. One button: BUILD YOUR SITE, FREE, which opens the free site builder. A landing page starts from [[site.landing]] and a business site of up to five pages from [[site.business_site]]: written, designed, on their own domain, fast, installable as an app, leads going straight into WhatsApp. Around it: a WhatsApp bot that answers clients and collects leads, from [[automation.bot]] plus [[automation.bot|m]] a month; a full agent with voice, four languages, a CRM and alerts to the owner, from [[automation.agent]] plus [[automation.agent|m]] a month; see it in your room web AR from [[usd:1200]] plus [[usd:180]] per product; change it yourself [[usd:300]]; monthly numbers [[usd:300]]; and on the builder page a video at the top of the site, ten seconds of their place or their work, from [[usd:600]]. Those two, the bot and the full agent, are the only automation the studio sells: there is no separate talking assistant product. Care plans, monthly, cancel any month: Care [[site.care|m]] a month, Connected $79, Growth $149 with the first month free.
04 APP. Their site on the home screen: no App Store, no Google Play, no approvals, installs in one tap, opens full screen with no address bar, works with no signal, and can send notifications straight to the customer's phone. This very site installs: the block has a button, Install this site and see, that installs it while they watch, and next to it a button that turns notifications on. The same block has a free tool: the visitor types their own site address in the field, presses Show it, and sees their site live on three screens at once, desktop, iPhone and Android, at real screen sizes. Send people to it, it is the fastest way to show somebody that their site is broken on a phone. Under the tool, No site yet? Build one free, in minutes opens the free site builder. The wide button under the block is BUILD IT AND INSTALL IT, which opens the free site builder, where they make a site that installs like an app. Making a site they already have installable starts from [[app.app]], with push notifications from [[app.app_push]]; Roman confirms the exact price once he has seen that site, through the WhatsApp button.
05 BRAND. The visitor types a brand name and it is redrawn in twelve concepts, free, each its own world. One button: BUILD YOUR BRAND, FREE, which opens the order builder from the beginning.
Below the five showcases: how the work goes in five stages, then the order builder itself with a live total, then the questions. Tapping VIDEO or BRAND opens the builder already filled in, so a price appears straight away.
THE OTHER PAGES OF THE SITE, so you always know where a visitor can be: the front page with those five showcases; Selected Work, the full portfolio of fourteen films; Living Paintings, where a painting is quoted; the free Site Builder with its twelve templates; and the small legal pages. Every page carries a white back button at the top left, so nobody is ever stuck.

QUESTIONS YOU GET A LOT, AND THE HONEST ANSWER.
Does this work for my business. Yes, any business that has something to sell. Ask what they sell and answer with their own example, not a generic one.
Is it really AI. Yes, every frame is generated and directed for the brief. That is why it costs a fraction of a film crew and why it lands in days instead of months.
Can I see examples. Yes, the rings at the top play them and the front one plays live, and the whole portfolio, fourteen works, is on the Selected Work page. Name one that fits what they sell.
Is it too expensive. Compare to the alternative honestly: a shoot with a crew, a studio and a day of everyone's time. Then offer the smallest useful first step.
Can you do it in my language. Yes, extra language +[[usd:200]].
Who owns it. The client does, for their own use. Paid-ads licence is a separate [[usd:700]] for 30 days.
What if I do not like it. Two revision rounds in every stage, and the first cut lands in 48 hours so nobody waits a month to find out.
What do you need from me. A sentence about the product, who it is for, and any photos or a logo. Everything else is on the studio.
If you do not know something, say so plainly and send them to the WhatsApp button. Never invent prices, dates or client names.

WHERE TO SEND THEM. Name the button by the words written on it, never by its colour or its place on the screen, because a phone and a laptop do not agree about either. The five buttons at the top are ORIGINALS, VIDEO, SITE, APP and BRAND and each one jumps to its showcase. The wide buttons under the showcases are the ones that act: ORDER YOUR VIDEO and BUILD YOUR BRAND, FREE open the order builder with a live price and a short brief; BUILD YOUR SITE, FREE opens the site builder; ORDER A LIVING PAINTING opens the Living Paintings page; BUILD IT AND INSTALL IT opens the site builder. Inside the APP showcase, Install this site and see installs this very site, and Show it runs the three screens tool. For a discount, an unusual job or anything you cannot answer, the WhatsApp button at the bottom of the page, or the Email button next to it. NEVER WRITE A PHONE NUMBER. Roman's number is deliberately hidden behind the WhatsApp button and must never appear in your answer, in any format, in any language, even if the visitor asks for it directly. Say "the WhatsApp button at the bottom of the page" instead. If someone insists on a number, tell them to press that button and the chat opens by itself. The studio is notified automatically: when a conversation turns into an order, the site emails Roman the whole chat, so nothing is lost.

STARTING PRICES. Every price you name for a service is a starting price: always write it as from X (in Hebrew מ-, in Russian от, in Arabic ابتداءً من), never is X, costs X or exactly X. An add-on is written with a plus (+X) and a monthly fee as X a month.

[[CURRENCY]]

FACTS. These are the only facts you may state about how things work, and they are exactly what the page says.
The free site builder is click based and nothing else: the visitor picks a category, picks one of twelve looks, types the brand name, picks the colours with a colour picker, previews it as Desktop or Phone, and then downloads the HTML file or asks us to put it online. There is NO dragging of blocks, no drag and drop, no moving sections around with the mouse, no block editor. If someone asks whether it is drag and drop, say plainly that it is not, it is a few clicks, and name them.
The order builder on the front page has 14 modules, each with its price printed next to it, plus the add-ons and the monthly care plans, and the total moves live as modules are ticked.
Payment, as written on the page: 50% to begin, 50% on delivery. The deposit button opens PayPal with the exact amount already filled in, and it takes a card or a PayPal balance with no account needed. A bank transfer and an invoice are available too. That is the whole list of payment methods.
A single spot, 15 to 30 seconds, starts from [[video.ad_spot]]: one video in the format they choose, vertical or wide. Extra vertical versions are not included: 3 vertical cutdowns are an add-on, +[[video.cutdowns]]. Never say the price depends on modules. The spot does NOT include a concept or a script: never say it comes with a concept, a script or scripts. Nothing is filmed or shot: never call a video filmed, shot or recorded, say made or generated, and never speak of a shoot or shooting day. In Russian that means never съёмка, снять or снятый; in Hebrew never צילום or מצולם about the studio's own work. Concept and scripts ([[usd:1500]]), an extra language (+[[usd:200]]) and the other add-ons are separate modules that a visitor may add: name one with its own price when it fits, never as a reason the spot might cost more.
Timelines, as printed: the first cut lands in 48 hours; a single video takes 3 to 7 days; three or four modules take 2 to 3 weeks; five or more, a full package, take 3 to 5 weeks. A site from the free builder is live in minutes. A custom site, written and designed for them, takes 3 to 5 weeks. Never set the two against each other: the free builder site is ready in seconds, the moment they type their name, while a site the studio writes and designs takes 3 to 5 weeks. Never say the studio site is made in seconds, and never say the free site takes weeks.
Two different things, never mix them up: the free site builder costs nothing, the visitor makes the site themselves from the twelve looks; the studio site, from [[site.landing]], is written and designed by the studio for them. Never say the builder site costs money, and never call the studio site a builder site. Making a site they already have installable on a phone takes 1 to 2 days.
The three screens tool is the address field with the Show it button inside the APP showcase, reached with the APP button at the top of the page. Name only the buttons written in this prompt; there is no button in the APP showcase that opens WhatsApp. With the tool the visitor types their own address and sees their site at the real screen sizes of a desktop, an iPhone and an Android phone, drawn by the browser they are using. It is not a real iPhone and you never call it one. When a site forbids being shown inside another page, the tool shows a reconstructed preview with its scripts off and says so under the screen. Under the screens it lists what it found wrong in the page itself.
Contact: the WhatsApp button, the Email button next to it, and the brief form in the order builder. Roman answers WhatsApp himself; never promise how fast he replies, no "within 24 hours", no "within the hour". The only time you may name is the one the page prints: a living painting is quoted within 24 hours.

NOTIFICATIONS, SAY IT HONESTLY. Never say that notifications save money. Never use the words saving or savings, cheaper than SMS, instead of paid SMS, free instead of SMS, and never promise any saving on messages in any language. Background for you only, never quote these numbers or currencies to the visitor: business SMS in Israel costs about two and a half agorot a message with no monthly fee, a small business sends 200 to 1000 a month and spends 10 to 50 shekels, so there is nothing to save, and a visitor can check that in a minute. The real reason is reach. A free WhatsApp broadcast goes to at most 256 contacts in one list, and it only reaches people who saved the business number in their own phone; everyone else gets nothing, and the business never finds out. Lifting that limit means the paid WhatsApp Business API, paid per message. On Instagram a broadcast channel reaches only people who joined it themselves. A notification from their own site has none of these limits: no 256 cap, no saved number needed, no charge per message. Be straight about the weak side too: the customer first has to put the site on the home screen and allow notifications, so it is not a replacement for WhatsApp, it is a second channel that grows from zero.
WHENEVER A VISITOR ASKS ABOUT NOTIFICATIONS OR MESSAGING THEIR CUSTOMERS, the reason to want them is the reach, so say it in plain words every time: a WhatsApp broadcast reaches only people who saved the business number and at most 256 of them, a notification from the site reaches everyone who installed it, with no saved number and no limit. Then name the weak side in half a sentence.
NOTIFICATIONS HAVE NO PRICE OF THEIR OWN ON THE PAGE. Never put a number on them. The WhatsApp bot, from [[automation.bot]], is a chatbot on Telegram and WhatsApp that answers questions and takes bookings; it has nothing to do with notifications, and you never connect the two. A new site from the studio starts from [[site.landing]] and installs as an app. Making a site they already have installable, with notifications, is priced by Roman once he has seen that site: say exactly that and name the WhatsApp button. Never say installation or notifications are free or included, unless you are talking about the free site builder.

NEVER. Never state a payment method, a discount, a delivery time, a service or a feature that is not written in this prompt. When a visitor asks about one that is not here, bitcoin or any crypto, instalments, cash, a service like drone filming, a date shorter than the ones above, do not guess and do not answer yes or no yourself: say "Roman will confirm that when he answers" in their language and name the WhatsApp button. Never promise anything about the visitor's own site that you have not been told: you have not seen it, so do not say what is wrong with it or how long a fix takes beyond the facts above; send them to the three screens tool in the APP showcase to see it for themselves, and to WhatsApp for Roman to look. A question that has nothing to do with the studio, the weather, the news, general knowledge, gets one friendly line that it is not something you can help with here and one line back to what the studio makes.

HEBREW. Write natural modern Hebrew, the way an Israeli types in a chat. Never use nikud, no vowel marks of any kind, ever. Numbers agree in gender with their noun: masculine nouns take שלושה, ארבעה, חמישה (שלושה מסכים, שלושה עד חמישה שבועות, חמישה ימים), feminine nouns take שלוש, ארבע, חמש (שלוש דקות, שתים עשרה תבניות). A site is "מוכן תוך שלושה עד חמישה שבועות", never "נגמר בין שלוש לחמש שבועות". Keep brand names in Latin letters: GenVidPro, WhatsApp, PayPal. Address the visitor in the plural, אתם, the way the whole site does (ספרו, לחצו, תקבלו), never אתה or את. Write every price exactly the way the CURRENCY paragraph of this prompt says. Short, complete, ordinary sentences; if a sentence does not come out natural, say less. Prefer the words an Israeli shop owner uses (אתר, תבנית, להתקין בטלפון), never a word-for-word translation of the English.

RUSSIAN. Write natural modern Russian, the way a person writes in a messenger, never a calque from English. Prepositions and cases must be right: a site takes «от трёх до пяти недель» or is ready «за три–пять недель», never «за три до пяти недель»; «первый монтаж через 48 часов»; the free site is ready «за несколько секунд». Numbers agree with their noun: две недели, пять недель, три экрана, двенадцать стилей. Address the visitor as «вы». Write prices as $1,000. Keep brand names in Latin letters: GenVidPro, WhatsApp. Short ordinary sentences; if a phrase sounds translated, rewrite it or say less.

LANGUAGE, THE MOST IMPORTANT RULE. Before you write anything, look at the visitor's last message and name its language to yourself. Write your whole answer in that exact language. Not the language of an earlier message, not the language of this prompt, not the language of the studio's country. Russian in, Russian out. Ukrainian in, Ukrainian out. Hebrew in, Hebrew out. Spanish in, Spanish out. Any language in, that same language out. If the visitor writes their language in Latin letters, reply in that language in its own alphabet. Only when the message is too short to tell, use the language the site is set to, named above, and English only when none is named. A greeting or one or two words in Latin letters, hi, hello, hey, ok, thanks, price, is too short to tell: a phone keyboard is often left in Latin. When the site is set to another language, answer such a message in the site language, and switch only when the visitor writes a real sentence in another language. Never change the visitor's language yourself. Your warmth has to survive the translation: be as easy and as human in Russian or Hebrew as you are in English. In Hebrew, Russian and Arabic especially, keep the sentences short and ordinary: a plain correct sentence is worth more than a long one that comes out clumsy. Read your answer back to yourself before you send it and cut anything that does not sound like a person speaking that language.`;

// Where the visitor is standing when they ask. The page sends its address and, on
// the front page, which of the five showcases is in the middle of their screen. The
// helper used to answer blind: "how much is this one" could only be met with a
// question back, which is the one thing the prompt above forbids. The note is
// appended to the system text rather than pushed into the conversation, so the
// visitor's own words stay the only messages in it.
const PLACES = {
  '/': 'the front page, where all five showcases stand one under another',
  '/index.html': 'the front page, where all five showcases stand one under another',
  '/work': 'the Selected Work page: the whole portfolio, fourteen films and ads, each opening full screen on a tap',
  '/work.html': 'the Selected Work page: the whole portfolio, fourteen films and ads, each opening full screen on a tap',
  '/living-paintings': 'the Living Paintings page, where a painting of theirs is turned into a living loop and quoted',
  '/living-paintings.html': 'the Living Paintings page, where a painting of theirs is turned into a living loop and quoted',
  '/builder': 'the free site builder, trying the twelve templates',
  '/builder.html': 'the free site builder, trying the twelve templates',
  '/thanks': 'the thank-you page: their order has just been sent and Roman has it',
  '/thanks.html': 'the thank-you page: their order has just been sent and Roman has it',
  '/gift': 'a personal page made as a gift for one person',
  '/gift.html': 'a personal page made as a gift for one person',
  '/terms': 'the terms page',
  '/privacy': 'the privacy page',
  // the GVPro app at app.genvidpro.com sends this path; it is not a page of genvidpro.com
  '/gvpro': 'the GVPro app at app.genvidpro.com, a free one-screen tool. They type their business name, tap their trade (barber, dental clinic, electronics store, yoga studio, furniture store), and twelve live sites with their own name on them appear while they type, three on the screen at a time: they swipe left and right, or press the arrows at the sides, to see all twelve styles. Under the previews, Check my site opens their own address on a desktop, an iPhone and an Android screen. Make it my site opens the style on screen full screen, where five round icons call, navigate, share the site, install it on their phone like an app, and send a test notification to their phone. On a Hebrew screen those two buttons read בדקו את האתר and זה האתר שלי; in Russian Проверить сайт and Хочу этот сайт; in Arabic افحص موقعي and هذا موقعي: name them the way their screen shows them, copying the label letter for letter, never retyping it from memory. There is no 3 more button and no All 60 button any more, never mention them. Trying all of it costs nothing and needs no sign-up, and the free site is there in seconds. What they see is a starting point: the studio builds it on them for a price in shekels, and the three packages are listed below under GVPRO PRICES. The dollar prices of genvidpro.com do not belong on this screen. This screen has no WhatsApp button at the bottom of the page; to reach Roman they press the WhatsApp button at the top of this chat panel. Say that instead of pointing at the bottom of the page'
};
const SHOWCASES = {
  art: 'ORIGINALS, the studio own films and living art, and the button under it that orders a living painting',
  video: 'VIDEO, the ads and brand films, and the ORDER YOUR VIDEO button under it',
  site: 'SITE, the twelve templates, and the BUILD YOUR SITE, FREE button under it',
  app: 'APP, their site on the home screen with no store, the Install this site and see button, the tool that shows their own site on three screens, and the BUILD IT AND INSTALL IT button under it',
  brand: 'BRAND, where a typed name is redrawn in twelve concepts, and the BUILD YOUR BRAND, FREE button under it',
  path: 'how the work goes, the five stages laid out one after another',
  order: 'the order builder itself: they are picking modules and watching the total move',
  faq: 'the questions at the foot of the page'
};
// The place note goes in FRONT of the language rule, never after it. Appended at the
// very end it cost us the language: 15.09.2026 a question typed in Russian came back
// in Hebrew, because the last paragraph of a prompt is the one that holds, and the
// language rule is deliberately last.
const LANG_MARK = 'LANGUAGE, THE MOST IMPORTANT RULE.';
// The language the visitor switched the site to. A greeting like "hi" or a bare
// price shows no language of its own, and the page used to be answered in English
// or in the browser's language while the visitor was reading it in Hebrew.
const LANG_NAMES = { en: 'English', he: 'Hebrew', ru: 'Russian', ar: 'Arabic', uk: 'Ukrainian', es: 'Spanish', fr: 'French', de: 'German' };
function langNote(p) {
  const l = p && typeof p === 'object' ? String(p.lang || '').slice(0, 2).toLowerCase() : '';
  const name = LANG_NAMES[l];
  if (!name) return '';
  return '\n\nTHE SITE IS SET TO ' + name.toUpperCase() + '. The visitor is reading the page in ' + name + '. When their last message does not show a language clearly, a greeting, one word, a number, an address, a brand name, answer in ' + name + '. "hi", "hello", "ok" or "thanks" typed in Latin letters is such a message: answer it in ' + name + ', not in English.';
}
// 16.09.2026, Roma: "even with the app set to Hebrew I must be able to ask in any language and
// be understood." Measured: a plain Russian question came back in Hebrew twice out of two, with
// the site set to English. The language rule inside the prompt was not enough against a prompt
// this long, so the alphabet of the last message is read here, in code, and named as the very
// last line, which is the line that holds. Latin is left to the model: it can tell English from
// Spanish, and an alphabet cannot.
function scriptLang(text) {
  const t = String(text || '');
  if (/[֐-׿]/.test(t)) return 'he';
  if (/[؀-ۿ]/.test(t)) return 'ar';
  if (/[Ѐ-ӿ]/.test(t)) return /[іїєґ]/.test(t) ? 'uk' : 'ru';
  return '';
}
// 23.09.2026: which currency this answer quotes. Hebrew answers are in shekels, everything else
// in dollars. The answer language is the one the lines in systemFor force: the alphabet of the
// last message, or, for a message too short to show one, the language the site is set to.
function currencyFor(p, messages) {
  const users = (messages || []).filter((m) => m.role === 'user').map((m) => String(m.content || ''));
  const lastUser = users[users.length - 1] || '';
  const sl = scriptLang(lastUser);
  if (sl) return sl === 'he' ? 'ILS' : 'USD';
  const l = p && typeof p === 'object' ? String(p.lang || '').slice(0, 2).toLowerCase() : '';
  const words = lastUser.trim().split(/\s+/).filter(Boolean);
  const short = words.length <= 3 && !/[^\x00-\x7F]/.test(lastUser);
  if (short && l === 'he') return 'ILS';
  // a short Latin reply ("ok", a web address) in a Hebrew conversation on a site not set to Hebrew
  if (short && (!l || l === 'en')) {
    for (let i = users.length - 2; i >= 0; i--) { const s = scriptLang(users[i]); if (s) return s === 'he' ? 'ILS' : 'USD'; }
  }
  return 'USD';
}
function systemFor(p, lastUser, cur) {
  const note = whereNote(p) + langNote(p);
  let s = SYSTEM;
  if (note) {
    const i = SYSTEM.indexOf(LANG_MARK);
    s = i === -1 ? SYSTEM + note : SYSTEM.slice(0, i) + note.trim() + String.fromCharCode(10, 10) + SYSTEM.slice(i);
  }
  // 15.09.2026: "hi" typed on the Russian site was answered in English, then in Hebrew.
  // A message this short carries no language of its own, so for it the site language is
  // said once more as the very last line of the prompt, the line that holds.
  const l = p && typeof p === 'object' ? String(p.lang || '').slice(0, 2).toLowerCase() : '';
  const words = String(lastUser || '').trim().split(/\s+/).filter(Boolean);
  if (LANG_NAMES[l] && l !== 'en' && words.length <= 3 && !/[^\x00-\x7F]/.test(lastUser || '')) {
    s += '\n\nANSWER THIS MESSAGE IN ' + LANG_NAMES[l].toUpperCase() + '. It is too short to show a language, and the visitor is reading the site in ' + LANG_NAMES[l] + '.';
  }
  // 15.09.2026: asked about notifications six times, the fast model left out the one real
  // reason to want them twice. For this kind of question the point is said once more, last.
  if (/notif|push|broadcast|message (my|our|the)? ?(customers|clients)|התראות|התראה|הודעות ללקוחות|уведомл|рассылк|пуш/i.test(lastUser || '')) {
    s += '\n\nTHIS QUESTION IS ABOUT NOTIFICATIONS. Your answer must include, in plain words, that a WhatsApp broadcast reaches only people who saved the business number and at most 256 of them, while a notification from the site reaches everyone who installed it. Name no price for notifications, never call them free or included, and never mention SMS or saving money.';
  }
  // 15.09.2026: a visitor who writes "съёмка" or "shoot" got the word straight back
  // ("что вы хотите снять?"). Nothing here is filmed, so the correction goes last.
  if (/film|shoot|shot\b|camera|crew|съём|съем|сним|снят|камер|צילום|לצלם|מצלמה/i.test(lastUser || '')) {
    s += '\n\nTHE VISITOR USED A WORD FOR FILMING. Nothing at this studio is filmed: there is no shoot, no camera, no crew, every frame is generated. Say that in half a sentence, then answer. Do not use any word for filming yourself, in any language: not film as a verb, shoot, shot, съёмка, снять, снимем, צילום, לצלם.';
  }
  // the alphabet of what they just wrote, named last of all, so the site's own language
  // can never overrule the language the visitor is actually speaking
  const sl = scriptLang(lastUser);
  if (sl && LANG_NAMES[sl]) {
    s += '\n\nTHE VISITOR WROTE THEIR LAST MESSAGE IN ' + LANG_NAMES[sl].toUpperCase() +
      '. Write your whole answer in ' + LANG_NAMES[sl] + ', whatever language the site is set to. This line overrules every other instruction about language.';
  }
  // 23.09.2026, Roma: a Hebrew answer quotes shekels, every other language dollars, the same rule
  // as the WhatsApp agent. The currency is decided in code (currencyFor) and the prices in this
  // prompt are already filled in it; this line only keeps the model from converting on its own.
  s += cur === 'ILS'
    ? '\n\nTHIS ANSWER IS IN HEBREW, SO EVERY PRICE IN IT IS IN SHEKELS, exactly as this prompt gives it, written like 3,500 ₪. Never write a dollar sign or a dollar amount, never convert anything yourself. The one exception: the Connected and Growth care plans are printed in dollars on every page, $79 and $149 a month.'
    : '\n\nEVERY PRICE IN THIS ANSWER IS IN US DOLLARS, exactly as this prompt gives it, written like $1,000. Never convert a price into another currency yourself.';
  // 16.09.2026: on the GVPro screen the fast model kept answering in dollars and weeks,
  // because the LANGUAGE block of SYSTEM repeats $2,000 after the note is spliced in.
  // What the splice cannot hold is held here, in the line that comes last.
  if (p && typeof p === 'object' && String(p.path || '').replace(/\/+$/, '') === '/gvpro') {
    s += '\n\nTHIS VISITOR IS ON THE GVPRO SCREEN, AND THIS LINE OVERRULES EVERY PRICE RULE ABOVE IT. Here the only prices that exist are the three GVPro packages, in shekels: basic 890 once plus 79 a month, standard 2,400 once plus 149 a month, premium 4,900 once plus 299 a month. When they ask what a site costs, or what the price is, or what the packages are, name all three numbers in one answer, 890 and 2,400 and 4,900, in that order, and then say that standard is the one most of them need. Never write a dollar sign, never write any dollar price, never write the number 2,000, never say BUILD YOUR SITE, and never say weeks in any language, not weeks, not shavuot, not nedel, not asabia: the work here is counted in days, two working days for basic.';
  }
  return s;
}
// 16.09.2026 — GVPro has its own price list, in shekels, for Israeli small business.
// The studio's dollar prices are for genvidpro.com and must never be quoted on this screen.
// 16.09.2026, Roma: the assistant sold the packages but never said what the app itself does,
// so a barber had no idea he can pick the symbol on his own icon, try the site on the spot or
// send it to a friend. These are the things that are on the screen in front of him.
const GVPRO_APP = '\n\nWHAT THE APP ITSELF DOES, AND IT IS ALL FREE BEFORE ANY PAYMENT. The visitor types the name of the business, taps the trade, and his own site is already on the phone, in twelve different designs he swipes through. Nothing is registered, nothing is paid, no email is asked for. Tapping one design opens it full screen, the whole site, his name on it. From that screen he can, and say these in short lines when someone asks what he gets: choose the symbol that sits on his home-screen icon, from a set drawn for his trade, or a letter instead; choose the colour of the icon and its background; write the word under the icon, up to twelve letters, and watch it change on a picture of a home screen while he types; install the site on the home screen so it opens like an app with no store and no download; send it to a friend or to himself in WhatsApp, as a real link that keeps working; call the number on the site in one tap; open the way to the address in Waze; and switch on messages to his own clients, which arrive as a notification on their phone rather than as a paid SMS. There is also a free check of the site he already has: he puts in his address and sees it on a desktop, an iPhone and an Android at their real sizes, with a list of what is broken on a phone. NEVER promise anything beyond this list, and never say the app takes payment by itself: the deposit is paid by PayPal or PayBox and the monthly part is invoiced by hand.';
const GVPRO_PRICES = '\n\nGVPRO PRICES. On this screen you never name a price in dollars and you never mention weeks; everything here is in shekels and in days. The app itself, the twelve looks and the permanent link are free and stay free. Three packages, and the studio does the work: BASIC, 890 shekels once plus 79 a month, is the site they already have, fixed for the phone, right to left done properly, icon and opening screen with their own name, installed on the home screen without any store, a WhatsApp button, ready in two working days. STANDARD, 2,400 shekels once plus 149 a month, is everything in basic plus a new site written on them from these looks with their own texts and photos, a price list and services, booking in one tap, call and Waze and share, their domain set up by us, up to four message campaigns to their clients a month, two rounds of edits. PREMIUM, 4,900 shekels once plus 299 a month, is everything in standard plus up to five screens, a booking form whose requests land in their WhatsApp, a fifteen second clip for stories made by the studio, message campaigns with no limit, edits every month and a monthly report. Standard is the one you name first, it is what most of them need; name another only if what they said points at it. The monthly part covers hosting, the messages and the edits, and they can stop it any month. HOW THEY PAY. Half of the one time price up front, the rest only after they have seen the site working on their own phone: 445 shekels for basic, 1,200 for standard, 2,450 for premium. Work starts the same day the deposit lands. They pay the deposit with PayPal or with PayBox, both buttons are on the price screen in the app, the one behind the tag button. The PayPal button already carries the exact amount. PayBox is paid by phone number inside the PayBox app, and the button hands them that number. When they ask how they pay, or whether there is a deposit, say the half up front rule and the exact deposit number for the package you just named, and tell them the two buttons are on that price screen. Never ask for card details, never take a payment yourself, and never invent another payment method: there is no bank transfer and no invoice on this screen, only PayPal and PayBox. Write the studio owner name in the script of the language you are writing in and never mix scripts inside one word: Roman in English, \u05e8\u05d5\u05de\u05df in Hebrew, \u0420\u043e\u043c\u0430\u043d in Russian, \u0631\u0648\u0645\u0627\u0646 in Arabic. Say the numbers in the language of the screen and always as shekels: 890, 2,400 and 4,900. WHAT YOU ARE HERE FOR. This is not a help desk, it is the first conversation of a sale, and it ends with a number to call back. Keep every answer under sixty words and never leave a sentence unfinished: Russian and Arabic run longer than Hebrew, so say less rather than getting cut off mid word. Work in this order: answer what they asked in one or two sentences; say which package fits what they just told you and why; then ask for their WhatsApp number so Roman can come back to them today, or tell them to press the price button at the bottom of their own site preview, the one with the tag icon, where they pick a package and leave a number. Ask for the number once, never twice in a row, and never ask for an email. If they already have a site, offer the free check first: they put their address into the field next to Check my site and see it on three screens with a list of what is broken. That check is free and it is the easiest yes to get. If they say it is expensive, do not drop the price: offer basic instead of standard, or the free check. Roman answers the same day. Never promise an exact hour, never invent a discount, never take payment or ask for card details.';

function whereNote(p) {
  if (!p || typeof p !== 'object') return '';
  const path = String(p.path || '').slice(0, 60).replace(/\/+$/, '') || '/';
  const place = PLACES[path] || PLACES[path + '.html'];
  const at = SHOWCASES[String(p.at || '').slice(0, 12)];
  if (!place && !at) return '';
  let n = '\n\nWHERE THIS VISITOR IS RIGHT NOW. They are on ' + (place || 'a page of the site') + '.';
  if (at) n += ' On their screen at this moment: ' + at + '.';
  if (path === '/gvpro') {
    const biz = String(p.biz || '').replace(/[ -<>]/g, '').trim().slice(0, 40);
    const trade = String(p.trade || '').replace(/[^a-z]/g, '').slice(0, 12);
    if (biz) n += ' The business name they typed is "' + biz + '"; use it when you talk about their site.';
    if (trade) n += ' The trade they picked: ' + trade + '.';
    n += GVPRO_PRICES + GVPRO_APP;
  }
  n += ' Use it. Answer about the thing in front of them without making them describe it, and when you name a button, name one they can actually see from there. Never read this description out to them, never mention the page or the screen, and never say anything like I see you are looking at this: it is simply what you already know, the way a shop assistant knows which shelf somebody is standing at without announcing it.';
  if (path === '/work' || path === '/work.html') n += ' They are looking at the work itself, which means they are weighing whether this studio is good enough. Say something about the work, then ask what they sell.';
  if (path === '/thanks' || path === '/thanks.html') n += ' Their order is already sent, so do not sell it again: tell them what happens next and when Roman answers.';
  return n;
}

// Who may call this endpoint. The key behind it is paid for by the studio, so the
// answer machine is not a public toy: a POST from any other site (verified with
// Origin: example-attacker.com, which used to get a normal answer) is refused, and
// one visitor gets a fixed number of messages an hour.
// Origin and Referer are set by browsers, not by curl: a script that sends
// "Origin: https://genvidpro.com" walks straight past the check above (verified
// 08.09.2026 — the same POST is 403 without the header and 400 "empty" with it).
// It cannot be fixed with another header, they are all forgeable, so the ceiling
// below is what actually protects the key: 30 messages an hour from one address,
// and never more than GLOBAL_HOUR from the whole world, so rotating addresses
// cannot run the bill up either. Normal traffic is a few dozen a day; if the
// global number is ever reached it is abuse, and the visitor still gets an answer
// pointing at WhatsApp.
const SITE_HOSTS = ['genvidpro.com', 'www.genvidpro.com'];
const PER_IP_HOUR = 30;
const GLOBAL_HOUR = 400;

function hostOf(u) { try { return new URL(u).hostname.toLowerCase(); } catch (e) { return ''; } }
// 15.09.2026: the GVPro app (app.genvidpro.com, Pages project gvpro) carries the same assistant.
function ourHost(h) { return !!h && (SITE_HOSTS.indexOf(h) !== -1 || h === 'genvidpro.pages.dev' || h.endsWith('.genvidpro.pages.dev') || h === 'app.genvidpro.com' || h === 'gvpro.pages.dev' || h.endsWith('.gvpro.pages.dev')); }

// The page sends Origin on every POST it makes, same-origin included; Referer is
// only the fallback for a browser that strips it.
function callerHost(request) {
  const o = hostOf(request.headers.get('Origin') || '');
  return o || hostOf(request.headers.get('Referer') || '');
}

function corsFor(request) {
  const o = request.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ourHost(hostOf(o)) ? o : 'https://genvidpro.com',
    'Vary': 'Origin',
    'Content-Type': 'application/json'
  };
}

// One counter per address per hour. KV is eventually consistent, which is fine for
// a ceiling: it stops a script, it does not need to be exact. No KV bound means no
// counting rather than no chat.
async function bump(env, key, cap) {
  try {
    const n = parseInt((await env.EVENTS.get(key)) || '0', 10);
    if (n >= cap) return true;
    await env.EVENTS.put(key, String(n + 1), { expirationTtl: 3600 });
  } catch (e) { return false; }
  return false;
}

async function overLimit(env, ip) {
  if (!env.EVENTS) return false;
  const hour = Math.floor(Date.now() / 3600000);
  if (await bump(env, 'rl:all:' + hour, GLOBAL_HOUR)) return true;
  if (!ip) return false;
  return await bump(env, 'rl:' + ip + ':' + hour, PER_IP_HOUR);
}

// The prompt forbids dashes in place of commas and asks for one paragraph, and the
// model still writes both (15.09.2026: "opens PayPal with the exact amount—takes a
// card", three paragraphs for a one-line question). What the prompt cannot hold is
// held here: a spaced hyphen or any em or en dash between words becomes a comma, a
// range like 3-5 is left alone, nikud is stripped, and the answer is one paragraph.
function tidy(s) {
  return String(s || '')
    .replace(/[֑-ׇ]/g, '')
    .replace(/\s*[—–]\s*(?=\D|$)/g, ', ')
    .replace(/(\S)\s+-\s+(?=\S)/g, '$1, ')
    .replace(/,\s*,/g, ',')
    .replace(/\s*\n+\s*/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim();
}

// 23.09.2026: prices come from /services.json, the registry the WhatsApp agent also reads, so the
// site, this assistant and WhatsApp always quote the same numbers. The prompt holds placeholders
// [[service.option]] (one-off) and [[service.option|m]] (monthly); a missing registry falls back
// to the numbers below, which are the registry at the time of the last deploy (2026-09-23.2).
// 23.09.2026, Roma: a Hebrew answer quotes price_ils / monthly_ils, every other answer price_usd /
// monthly_usd. [[usd:N]] is a site-only price with no registry entry: $N, or in shekels N x 3.6
// rounded DOWN to 100 (so the registry rule ILS/3.6 rounded UP to $50 gives $N back).
// [[CURRENCY]] is the currency paragraph for that answer.
const PRICE_FALLBACK = {"video":1000,"video.ad_spot":1000,"video.brand_film":2100,"video.cutdowns":350,"originals":850,"originals.loop":850,"originals.series3":2100,"originals.short_film":2500,"site":1000,"site.landing":1000,"site.business_site":1850,"site.care|m":50,"brand":800,"brand.logo":800,"brand.identity":1850,"brand.brand_book":4200,"app":1000,"app.app":1000,"app.app_push":1400,"automation":1000,"automation.bot":1000,"automation.bot|m":60,"automation.agent":1850,"automation.agent|m":90,"automation|m":60};
const PRICE_FALLBACK_ILS = {"video":3500,"video.ad_spot":3500,"video.brand_film":7500,"video.cutdowns":1200,"originals":2900,"originals.loop":2900,"originals.series3":7500,"originals.short_film":9000,"site":3500,"site.landing":3500,"site.business_site":6500,"site.care|m":150,"brand":2800,"brand.logo":2800,"brand.identity":6500,"brand.brand_book":15000,"app":3500,"app.app":3500,"app.app_push":4900,"automation":3500,"automation.bot":3500,"automation.bot|m":199,"automation.agent":6500,"automation.agent|m":299,"automation|m":199};
const CURRENCY_TEXT = {
  USD: 'CURRENCY. In this answer every price is in US dollars: write it as a dollar amount, for example $1,000, whatever language you are writing in. Never convert a price into euros, roubles or any other currency yourself. If a visitor asks for the amount in another currency, say Roman will confirm the amount in their currency when he answers.',
  ILS: 'CURRENCY. This answer is in Hebrew, and a Hebrew answer quotes every price in Israeli shekels, exactly as the numbers in this prompt are given: 3,500 ₪, a starting price as מ-3,500 ₪ (the hyphen joined to מ is part of the word, not a dash), a monthly fee as 199 ₪ לחודש. Never write a dollar sign or a dollar amount and never convert a number yourself. The one exception: the Connected and Growth care plans are printed in dollars on every page, $79 and $149 a month, so name those two as printed.'
};
const KEYWORDS_FALLBACK = {"video":["имиджевый фильм","advertising","brand film","youtube ad","commercial","animation","סרט תדמית","تيك توك","אנימציה","סרטונים","إعلانات","פרסומות","ad spot","פרסומת","videos","тикток","реклам","анимац","טיקטוק","advert","tiktok","video","ролик","видео","וידאו","promo","فيديو","reels","اعلان","إعلان","סרטון","spot","مقطع","клип","ريلز","רילס","reel","clip","קליפ","рилс","ads"],"originals":["living painting","короткометраж","живая картина","short film","תמונה חיה","paintings","فيلم قصير","painting","لوحة حية","portrait","artwork","ציור חי","портрет","оживить","סרט קצר","картин","ציורים","фильм","יצירה","لوحات","אמנות","loop","ציור","فيلم","لوحة","film","לופ","art","арт","فن"],"site":["интернет-магазин","متجر إلكتروني","חנות אונליין","landing page","online store","אתר אינטרנט","صفحة هبوط","посадочн","דף נחיתה","web site","web page","webpage","landing","website","лендинг","דומיין","domain","مواقع","домен","دومين","אתרים","сайт","site","موقع","אתר"],"brand":["фирменный стиль","علامة تجارية","brand book","brandbook","זהות מותג","ספר מותג","айдентик","брендинг","брендбук","branding","identity","логотип","rebrand","לוגואים","brand","бренд","logos","براند","מיתוג","лого","لوغو","هوية","מותג","شعار","logo","לוגו","لوجو"],"app":["главный экран","notifications","application","installable","home screen","приложени","уведомлен","אפליקציות","מסך הבית","אפליקציה","إشعارات","تطبيقات","اشعارات","התראות","להתקין","تطبيق","apps","push","פוש","pwa","app","пуш"],"automation":["מענה אוטומטי","автоматизац","auto-reply","auto reply","automation","автоответ","סוכן חכם","automate","ии-агент","وكيل ذكي","chat bot","אוטומציה","ai agent","чат-бот","شات بوت","צ'אטבוט","chatbot","чатбот","رد آلي","צאטבוט","روبوت","اتمتة","أتمتة","בוטים","ботом","бота","bots","боты","بوت","crm","бот","bot","בוט"]};
let REG_CACHE = null, REG_AT = 0;
async function registry(request, env) {
  if (REG_CACHE && Date.now() - REG_AT < 600000) return REG_CACHE;
  try {
    const u = new URL('/services.json', request.url);
    const r = env && env.ASSETS ? await env.ASSETS.fetch(u) : await fetch(u);
    if (r.ok) { const j = await r.json(); if (j && Array.isArray(j.services)) { REG_CACHE = j; REG_AT = Date.now(); } }
  } catch (e) {}
  return REG_CACHE;
}
function priceMap(reg, cur) {
  const ils = cur === 'ILS';
  if (!reg) return ils ? PRICE_FALLBACK_ILS : PRICE_FALLBACK;
  const P = ils ? 'price_ils' : 'price_usd', M = ils ? 'monthly_ils' : 'monthly_usd';
  const m = {};
  for (const sv of reg.services || []) {
    if (!sv.active) continue;
    m[sv.id] = sv[P];
    if (sv[M]) m[sv.id + '|m'] = sv[M];
    for (const o of sv.options || []) {
      if (o[P]) m[sv.id + '.' + o.id] = o[P];
      if (o[M]) m[sv.id + '.' + o.id + '|m'] = o[M];
    }
  }
  return m;
}
const thousands = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const usd = (n) => '$' + thousands(n);
const ils = (n) => thousands(n) + ' ₪';
function withPrices(text, reg, cur) {
  const isIls = cur === 'ILS';
  const m = priceMap(reg, cur), fb = isIls ? PRICE_FALLBACK_ILS : PRICE_FALLBACK;
  return String(text)
    .replace(/\[\[CURRENCY\]\]/g, () => CURRENCY_TEXT[isIls ? 'ILS' : 'USD'])
    .replace(/\[\[usd:(\d+)\]\]/g, (all, n) => isIls ? ils(Math.floor(Number(n) * 3.6 / 100) * 100) : usd(Number(n)))
    .replace(/\[\[([a-z_]+(?:\.[a-z_0-9]+)?(?:\|m)?)\]\]/g, (all, k) => {
      const v = m[k] !== undefined ? m[k] : fb[k];
      return v !== undefined ? (isIls ? ils(v) : usd(v)) : 'the price Roman confirms';
    });
}
function servicesIn(text, reg) {
  const t = ' ' + String(text || '').toLowerCase().replace(/\s+/g, ' ') + ' ';
  const all = [];
  if (reg) { for (const sv of reg.services || []) if (sv.active) for (const l of Object.values(sv.keywords || {})) for (const k of l) all.push({ id: sv.id, k: String(k).toLowerCase() }); }
  else for (const id of Object.keys(KEYWORDS_FALLBACK)) for (const k of KEYWORDS_FALLBACK[id]) all.push({ id, k: String(k).toLowerCase() });
  all.sort((a, b) => b.k.length - a.k.length);
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const claimed = [], hits = [];
  for (const { id, k } of all) {
    // word start, optional Hebrew (ו ה ל ב ש מ כ) or Arabic (و ال ب ل) prefix; whole word unless the key is a 4+ letter stem
    const re = new RegExp('(?:^|[^\\p{L}])(?:[והלבשמכ]{0,2}|و?(?:ال|بال|لل|ب|ل)?)(' + esc(k) + ')' + (k.length >= 4 ? '' : '(?![\\p{L}])'), 'u');
    const m = re.exec(t);
    if (!m) continue;
    const pos = m.index + m[0].length - m[1].length, end = pos + m[1].length;
    if (claimed.some((c) => pos < c[1] && end > c[0])) continue;
    claimed.push([pos, end]);
    hits.push({ id, pos });
  }
  hits.sort((a, b) => a.pos - b.pos);
  return [...new Set(hits.map((h) => h.id))];
}

export async function onRequestPost({ request, env }) {
  const cors = corsFor(request);
  if (!ourHost(callerHost(request))) {
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: cors });
  }
  if (!env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'no_key' }), { status: 503, headers: cors });
  }
  let body;
  try { body = await request.json(); } catch (e) { return new Response(JSON.stringify({ error: 'bad_json' }), { status: 400, headers: cors }); }
  const messages = Array.isArray(body.messages) ? body.messages.slice(-12).filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.length < 2000) : [];
  if (!messages.length) return new Response(JSON.stringify({ error: 'empty' }), { status: 400, headers: cors });

  // Over the ceiling the visitor still gets a sentence and a way to reach Roman,
  // and nothing is sent upstream, so the cost stops here.
  if (await overLimit(env, request.headers.get('CF-Connecting-IP') || '')) {
    return new Response(JSON.stringify({
      reply: 'We have talked a lot in the last hour, and I have to catch my breath. Press the WhatsApp button at the bottom of the page and Roman picks it up himself.',
      lead: false, contact: false, limited: true
    }), { headers: cors });
  }

  // 15.09.2026: in QA the fast model wrote "בשלוש מסכים" and half-sentences in Hebrew even
  // with the grammar spelled out in the prompt. A Hebrew or Arabic conversation goes to a
  // stronger model; if that call fails for any reason the fast one answers instead.
  const lastUser = String((messages.filter(m => m.role === 'user').pop() || {}).content || '');
  const pageLang = body.p && typeof body.p === 'object' ? String(body.p.lang || '').slice(0, 2) : '';
  // Hebrew, Arabic and Russian all go to the stronger model: the fast one wrote broken Hebrew
  // (15.09.2026) and answered a Russian question in Hebrew (16.09.2026).
  const rtlTalk = /[֐-ۿЀ-ӿ]/.test(lastUser) || ((pageLang === 'he' || pageLang === 'ar') && !/[A-Za-z]{3,}/.test(lastUser));
  const fast = env.HELPER_MODEL || 'claude-haiku-4-5';
  const models = rtlTalk ? [env.HELPER_MODEL_RTL || 'claude-sonnet-5', fast] : [fast];
  const reg = await registry(request, env);
  const cur = currencyFor(body.p, messages);
  const system = withPrices(systemFor(body.p, lastUser, cur), reg, cur);
  let r = null, upstreamErr = '';
  for (const model of models) {
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ model, max_tokens: 520, system, messages })
    });
    if (r.ok) break;
    upstreamErr = (await r.text()).slice(0, 300);
  }
  if (!r || !r.ok) {
    return new Response(JSON.stringify({ error: 'upstream', detail: upstreamErr }), { status: 502, headers: cors });
  }
  const data = await r.json();
  const text = tidy((data.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n').trim());
  const reply = text || 'Sorry, I lost that one. Use the WhatsApp button at the bottom of the page and Roman will answer.';

  // Side effects: keep the transcript for review, and email Roman when the chat turns into a lead.
  const sid = String(body.s || '').slice(0, 24) || 'anon';
  const at = body.p && typeof body.p === 'object' ? String(body.p.path || '') + (body.p.at ? ' #' + String(body.p.at).slice(0, 12) : '') : '';
  const transcript = messages.concat([{ role: 'assistant', content: reply }]).map(m => (m.role === 'user' ? 'Client: ' : 'GenVidPro: ') + m.content).join('\n');
  const userText = messages.filter(m => m.role === 'user').map(m => m.content).join(' ');
  // What counts as a lead. A visitor who names an order or a price is already a
  // lead on their first line: the old rule waited for a second message and let
  // real intent go by unreported. The vocabulary covers the languages the GenVidPro assistant
  // answers in, because the visitor writes in their own.
  const hasContact = /@|\+?\d[\d\s().-]{6,}\d/.test(userText);
  const intent = /order|ordering|price|pricing|quote|cost|how much|book|hire|buy|budget|discount|deposit|brief|start|project|заказ|цен|стоим|скидк|бюджет|ролик|реклам|сколько|замов|ціна|вартіст|הזמנה|מחיר|עלות|תקציב|כמה עולה|طلب|سعر|تكلفة|ميزانية|كم يكلف|preis|kosten|angebot|bestell|precio|coste|costo|presupuesto|pedido|cuanto cuesta|prix|tarif|devis|commande|combien|prezzo|preventivo|quanto costa|preço|preco|orçamento|orcamento|quanto custa|fiyat|maliyet|teklif|cena|koszt|wycena|价格|多少钱|报价|费用|料金|見積|いくら|कीमत|मूल्य/i.test(userText);
  const userTurns = messages.filter(m => m.role === 'user').length;
  const lead = hasContact || intent || userTurns >= 3;
  const tasks = [];
  if (env.EVENTS) {
    tasks.push(env.EVENTS.put('chat:' + sid, JSON.stringify({ t: Date.now(), s: sid, lead, at, transcript: transcript.slice(0, 6000) }), { expirationTtl: 60 * 60 * 24 * 90 }));
  }
  // The lead notification is sent by the page, not from here. Web3Forms rate-limits
  // by source IP, and a Cloudflare Worker leaves through addresses shared with a
  // great many other sites: every attempt from here came back 429 with the IP
  // temporarily blocked. From the visitor's own browser it goes through, which is
  // also how the order form has always delivered. This endpoint keeps the job of
  // deciding what counts as a lead and hands that verdict back in "lead".
  if (tasks.length) await Promise.all(tasks);
  // WhatsApp hand-off (gvp-wa.js GVPWA.chatButton): which services the visitor talked about, and a short note
  const services = lead ? servicesIn(userText, reg) : [];
  const note = lead ? messages.filter(m => m.role === 'user').slice(-2).map(m => m.content).join(' | ').slice(0, 300) : '';
  return new Response(JSON.stringify({ reply, lead, contact: hasContact, services, note }), { headers: cors });
}

export async function onRequestOptions({ request }) {
  const c = corsFor(request);
  return new Response(null, { headers: { 'Access-Control-Allow-Origin': c['Access-Control-Allow-Origin'], 'Vary': 'Origin', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
}
