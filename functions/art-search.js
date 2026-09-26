/* Search for a painting that is free to animate.
   The page never talks to a museum directly: the browser asks us, we ask both
   collections, drop everything that is not public domain and hand back one list.
   Two reasons for the detour. The site's CSP allows connect-src 'self' only, and
   the licence filter has to be ours, not something a visitor can switch off.

   The Met's v1/search is switched off on 1 October 2026 — v1.1 only. */

const MET_SEARCH = 'https://collectionapi.metmuseum.org/public/collection/v1.1/search';
const MET_OBJECT = 'https://collectionapi.metmuseum.org/public/collection/v1/objects/';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const PER_PAGE = 30;
/* The Met gives no pixel size in the object record, only centimetres on the frame.
   Its originals are large as a rule, so they enter the sort with this estimate
   instead of dropping to the bottom next to Commons files that do report size. */
const MET_ASSUMED = 3000;
/* bumped when the tidying below changes, so a deploy does not keep serving
   yesterday's cleaned-up titles out of the edge cache */
const V = '6';

function json(data, status, cacheable) {
  const h = { 'Content-Type': 'application/json; charset=utf-8' };
  /* ten minutes, not an hour: the browser keeps this too, and after a deploy a
     visitor who had already searched was shown the old order for the whole hour */
  if (cacheable) h['Cache-Control'] = 'public, max-age=600';
  return new Response(JSON.stringify(data), { status: status || 200, headers: h });
}

function timed(url, ms) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms || 9000);
  return fetch(url, { signal: c.signal, headers: { 'User-Agent': 'GenVidPro/1.0 (genvidpro.com)' } })
    .then(r => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
    .finally(() => clearTimeout(t));
}

/* the licence gate: only these three shapes of wording are let through */
function freeLicence(name) {
  const s = String(name || '').toLowerCase();
  if (!s) return false;
  if (s.indexOf('public domain') >= 0) return true;
  if (s.indexOf('cc0') >= 0) return true;
  /* "PD-old", "PD-US" and friends, but never "CC BY" or "CC BY-SA" */
  return /(^|[^a-z])pd([^a-z]|$)/.test(s) || s.indexOf('pd-') === 0;
}

function strip(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* Commons names a file, not a painting: "Rembrandt - The Night Watch - Google Art
   Project (cropped).jpg". What is left after this reads like a title in a gallery. */
function tidyTitle(t, artist) {
  let s = String(t || '')
    .replace(/\s*[-–—]\s*(Google Art Project|Google Cultural Institute|Google Arts? & Culture)[^]*$/i, '')
    .replace(/\s*\((cropped|edited|retouched|restored|full size|high resolution)[^)]*\)/ig, '')
    .replace(/\s*,?\s*by\s+[A-Z][^,]{2,40}$/,'')
    .replace(/\s+/g, ' ')
    .trim();
  /* "Rembrandt - The Abduction of Europa" -> the painting alone. Split on the dash
     rather than building a regex out of a name: names carry brackets and dots. */
  const words = String(artist || '').split(/[^A-Za-z']+/).filter(w => w.length > 3);
  const a = (words[words.length - 1] || '').toLowerCase();
  if (a) {
    const parts = s.split(/\s[-–—]\s/);
    if (parts.length > 1 && parts[0].length < 60 && parts[0].toLowerCase().indexOf(a) >= 0) {
      s = parts.slice(1).join(' - ');
    }
  }
  /* catalogue numbers in the file name say nothing to a visitor */
  s = s.replace(/\s*(LCCN|RP|SK|inv\.?|no\.?)[-\s]?[A-Z]?[0-9]{4,}/ig, '');
  /* files are often named with the year in front: "1665 Girl with a Pearl Earring" */
  s = s.replace(/^\s*(1[0-9]{3}|20[0-2][0-9])\s*[-–—,]?\s*/, '');
  return s.replace(/^[\s\-–—,]+|[\s\-–—,]+$/g, '') || String(t || 'Untitled');
}

/* Commons writes a librarian's name string: "Katsushika, Hokusai, 1760-1849, artist".
   A gallery label would say "Katsushika Hokusai". */
function tidyArtist(a) {
  let s = String(a || '')
    .replace(/,?\s*(artist|painter|author|creator|attributed to|after)\.?/ig, ' ')
    .replace(/,?\s*\(?1?[0-9]{3}\s*[-–—]\s*1?[0-9]{3}\)?/g, ' ')
    .replace(/\s*\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,]+|[\s,]+$/g, '');
  /* "Katsushika, Hokusai" -> "Katsushika Hokusai"; a real "Surname, Name" flips */
  const two = s.split(',').map(x => x.trim()).filter(Boolean);
  if (two.length === 2 && two[0].split(' ').length < 3 && two[1].split(' ').length < 3) s = two[1] + ' ' + two[0];
  return s || 'Unknown artist';
}

/* the date field on Commons carries wikidata scaffolding: "1632 date QS:P571,+1632-" */
function tidyDate(d) {
  const s = String(d || '');
  const range = s.match(/(1[0-9]{3}|20[0-2][0-9])\s*[-–—]\s*(1[0-9]{3}|20[0-2][0-9])/);
  if (range) return range[1] + '–' + range[2];
  const one = s.match(/(1[0-9]{3}|20[0-2][0-9])/);
  return one ? one[1] : '';
}

/* The Met's two integers when objectDate is blank. "1650–1883" on a Rembrandt is the
   museum hedging about a copy, not a date — a span wider than a working life is
   shown as nothing rather than as a guess. */
function metYears(b, e) {
  b = parseInt(b, 10); e = parseInt(e, 10);
  if (!b || b < 1000) return '';
  if (!e || e === b) return String(b);
  if (e - b > 30) return '';
  return b + '–' + e;
}

/* Second pass on a Commons title, run after tidyTitle. The card already shows the
   painter and the year on their own lines, so the same words in the title are
   noise: "Homerus, Rembrandt van Rijn, 1663, Mauritshuis, The Hague" is "Homerus". */
const PLACE_PHRASES = ['the hague','den haag','new york','los angeles','san francisco','st petersburg','st. petersburg',
  'national gallery','national gallery of art','the met','metropolitan museum','metropolitan museum of art',
  'museum of fine arts','museum of art','fine arts','google art project','google cultural institute'];
const PLACE_WORDS = new Set(('mauritshuis rijksmuseum amsterdam louvre paris london museum museo musée musee gallery galerie ' +
  'galleria hermitage prado madrid uffizi florence firenze berlin vienna wien munich münchen dresden kassel washington ' +
  'boston philadelphia getty metropolitan collection kunsthalle kunsthaus staatliche gemäldegalerie wallace frick ' +
  'stockholm nationalmuseum copenhagen oslo edinburgh dublin cologne köln brussels antwerp bruges rome roma milan ' +
  'milano venice venezia naples napoli tokyo kyoto moscow pushkin tretyakov budapest prague warsaw kraków krakow chicago ' +
  'detroit cleveland toledo houston dallas pasadena ottawa montreal toronto rotterdam haarlem leiden utrecht braunschweig ' +
  'karlsruhe stuttgart frankfurt städel staedel lisbon lisboa barcelona seville sevilla glasgow cambridge oxford ' +
  'liverpool manchester birmingham hague haag york angeles francisco petersburg ' +
  'the of art arts fine national royal state city university foundation trust house palace castle abbey cathedral ' +
  'church institute institution library archive archives gemeentemuseum stedelijk kunstmuseum pinakothek alte neue ' +
  'inv inventory cat catalogue catalog wga scan scanned detail details crop cropped jpeg jpg png tif tiff copy ' +
  'black white bw colour color grayscale greyscale version edited retouched restored').split(' '));
const isPlace = seg => {
  const t = String(seg || '').toLowerCase().replace(/[().]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return false;
  if (PLACE_PHRASES.indexOf(t) >= 0) return true;
  /* "Princeton University Art Museum": the town is unknown, the institution is not */
  if (/\b(museum|museo|musée|musee|gallery|galerie|galleria|collection|institute|library|kunsthalle|kunsthaus|kunstmuseum|rijksmuseum|mauritshuis|louvre|prado|hermitage|uffizi|getty|pinakothek|gemäldegalerie|nationalmuseum|foundation)\b/.test(t)) return true;
  const words = t.split(' ');
  return words.every(w => PLACE_WORDS.has(w) || /^\d{1,4}$/.test(w) || /^[a-z]{1,2}\d+[a-z]*$/.test(w) || w.length < 2);
};
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PART = '(?:van|von|de|der|den|di|da|del|della|le|la|du|des|ter|ten)';

function pass2(title, artist, hasDate) {
  let s = String(title || '');
  /* catalogue codes that tidyTitle does not know: WGA24685, DP319026, SK-A-4691 */
  s = s.replace(/\s*\b(?:MET\s+)?[A-Z]{2,4}[-\s]?\d{4,}[A-Z]*\b/g, '');
  s = s.replace(/\s*\bSK-[A-Z]-\d+\b/g, '');
  /* an accession number at the tail: "MET 14.76.59.1–.102", "RP-P-1961-1177" */
  s = s.replace(/\s*\b(?:MET|RP|SK|NG|inv\.?|acc\.?)\s*[-\s]?[\d][\d.\-–—]{3,}\s*$/i, '');
  /* "black and white", "(detail)", "FXD" — words about the file, not the picture */
  s = s.replace(/\s*\(?\b(?:black and white|b&w|bw|detail|details|grayscale|greyscale|colou?r version|full size|FXD|HD)\b\)?/ig, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  /* "Vermeer-view-of-delft": a file name with hyphens where the spaces should be */
  if (s.indexOf(' ') < 0 && /[a-z]-[a-z]/.test(s)) s = s.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase());
  const words = String(artist || '').split(/\s+/).filter(w => /^[A-Za-zÀ-ɏ'.-]{2,}$/.test(w));
  if (words.length) {
    const first = words[0], last = words[words.length - 1];
    const particles = '(?:\\s+' + PART + ')*';
    /* "Rembrandt Harmensz. van Rijn": first name, up to two middle names, particles, surname */
    const fullish = escRe(first) + '(?:\\s+[A-ZÀ-Ý][a-zà-ÿ]+\\.?){0,2}' + particles + '\\s+' + escRe(last);
    /* a painter known by one name is filed under the fuller one; the first name is
       known, the surname is not, and anchored on the first name it is safe to take off */
    const fullUnknown = escRe(first) + '(?:\\s+[A-ZÀ-Ý][a-zà-ÿ]+\\.?){0,2}(?:\\s+' + PART + ')+\\s+[A-ZÀ-Ý][a-zà-ÿ]+';
    const withParticle = '(?:' + PART + '\\s+)+' + escRe(last);
    const forms = [fullish, fullUnknown, escRe(words.join(' ')), withParticle];
    if (first !== last) forms.push(escRe(first));
    forms.push(escRe(last));
    forms.forEach(f => {
      /* "por Rembrandt", "by Rembrandt", "- Rembrandt", "Rembrandt -", "Rembrandt's" at the edges */
      /* …unless the sentence goes on: "by Hokusai and His Disciples" keeps its name */
      s = s.replace(new RegExp('(?:^|[\\s,(-])(?:por|by|von|par|di|de|attributed to|after|workshop of|circle of)\\s+' + f + '(?!(?:\\s+[A-ZÀ-Ý][\\w.\'-]*){0,3}\\s+and\\b)(?=$|[\\s,.)])', 'ig'), ' ');
      s = s.replace(new RegExp('^\\s*' + f + "(?:'s|s)?\\s*[-–—:,]\\s*", 'i'), '');
      s = s.replace(new RegExp('\\s*[-–—:,]\\s*' + f + '\\s*$', 'i'), '');
      s = s.replace(new RegExp('(?:^|,)\\s*' + f + '\\s*(?=,|$)', 'ig'), '');
    });
    /* the fuller name at the head with the real title behind it: "Rembrandt van Rijn Harmen Doomer" */
    s = s.replace(new RegExp('^\\s*(?:' + fullUnknown + '|' + fullish + ')\\s+(?=[A-ZÀ-Ý])'), '');
    /* the first name on its own at the head, then a capitalised word: "Rembrandt Homer Dictating" */
    if (first !== last) s = s.replace(new RegExp('^\\s*' + escRe(first) + '\\s+(?=[A-ZÀ-Ý])'), '');
    else s = s.replace(new RegExp('^\\s*' + escRe(first) + '\\s+(?=[A-ZÀ-Ý][a-zà-ÿ]+\\s)'), '');
    /* the surname alone at the head of a lower-case file name: "Vermeer view of delft" */
    s = s.replace(new RegExp('^\\s*' + escRe(last) + '\\s+(?=[a-zà-ÿ])'), '').replace(/^[a-zà-ÿ]/, c => c.toUpperCase());
    /* what is left is only names and particles, with the painter among them:
       "Jan Vermeer van Delft", "Harmensz. van Rijn" */
    const partRe = new RegExp('^' + PART + '$', 'i');
    const toks = s.replace(/[\s\-–—_]+\d{1,3}[a-z]?$/i, '').trim().split(/\s+/).filter(Boolean);
    /* …but only when the painter himself is among those words, and the line does
       not open like a title: "The Conspiracy of Claudius Civilis" is not a name */
    const article = /^(the|a|an|het|de|la|le|il|el|das|der|die|een|un|une|los|las)$/i;
    const nameish = toks.length > 0 && toks.length <= 5 && !article.test(toks[0]) &&
      toks.every(t => /^[A-ZÀ-Ý][a-zà-ÿ'.-]*$/.test(t) || partRe.test(t)) &&
      (toks.some(t => t.toLowerCase().replace(/\./g, '') === last.toLowerCase()) ||
       toks.some(t => t.toLowerCase().replace(/\./g, '') === first.toLowerCase()));
    if (nameish) return '';
  }
  if (hasDate) {
    /* the year is on its own line under the title: "1663", "1630-1631", "circa 1640" */
    s = s.replace(/[\s,(]*(?:circa|ca\.?|c\.|around|about|probably)?\s*(1[0-9]{3}|20[0-2][0-9])(?:\s*[-–—/]\s*(?:1[0-9]{3}|20[0-2][0-9]|[0-9]{2}))?(?:\s*(?:s|ies))?[\s)]*(?=,|$|\s)/ig, ' ');
  }
  /* museums and cities hanging after the last commas or dashes, a segment at a time */
  /* a one-letter segment is what a removed name leaves behind: ", y," */
  let parts = s.split(/\s*,\s*|\s+[-–—]\s+/).map(x => x.trim()).filter(x => x.replace(/[^A-Za-zÀ-ɏ0-9]/g, '').length > 1);
  while (parts.length > 1 && isPlace(parts[parts.length - 1])) parts.pop();
  s = parts.join(', ');
  /* "(Rijksmuseum Amsterdam)", "(detail)" */
  s = s.replace(/\s*\(([^)]*)\)/g, (m, inner) => isPlace(inner) ? '' : m);
  /* ", from Prado in Google Earth" — where the file was taken from, not what it shows */
  s = s.replace(/,?\s*\bfrom\s+(?:the\s+)?[A-ZÀ-Ý][\w\s]{0,30}?\s+in\s+Google\s+Earth\s*$/i, '');
  s = s.replace(/,?\s*\bfrom\s+(?:the\s+)?([A-ZÀ-Ý][\w\s]{0,30}?)\s*$/i, (m, pl) => isPlace(pl) ? '' : m);
  /* the file number at the end: "van Rijn 013", "Self-portrait 2" */
  s = s.replace(/[\s\-–—_]+\d{1,3}[a-z]?$/i, '');
  s = s.replace(/\s+/g, ' ').replace(/^[\s\-–—,:.]+|[\s\-–—,:.]+$/g, '');
  return s;
}

/* is that "artist" really the person who uploaded the file, or nobody at all? */
function looksLikeNick(a, fileTitle) {
  const s = String(a || '').trim();
  if (!s) return true;
  if (/user:|uploader|scan by|photo by|own work|anonymous|unknown|unidentified|wikimedia|commons/i.test(s)) return true;
  if (s.indexOf(' ') < 0) {
    if (/[a-z][A-Z]/.test(s) || /\d/.test(s) || /[_]/.test(s) || s.length > 18) return true;
    /* "Rembrandt" at the head of a file name is the painter; "rembrandtfan" at the
       head of it is the uploader. A capitalised plain word is left alone. */
    const plainName = /^[A-ZÀ-Ý][a-zà-ÿ'-]+$/.test(s);
    if (!plainName) return true;
  }
  return false;
}

/* one key for the same painting under two roofs */
function key(artist, title) {
  /* Commons holds the same canvas several times over — "… - 670 - Mauritshuis",
     "…FXD", a cropped one — so the key is the painter plus the first few words of
     the title, which is what a person would call the same painting. */
  const norm = s => String(s || '')
    .toLowerCase()
    .replace(/\b(the|a|an|of|le|la|les|der|die|das|el|los|van|de)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  const t = norm(title).split(' ').filter(Boolean).slice(0, 4).join(' ');
  const w = norm(artist).split(' ').filter(Boolean);
  return (w[w.length - 1] || '') + '|' + t;
}

async function met(q, page) {
  const want = PER_PAGE * page;
  const s = await timed(MET_SEARCH + '?q=' + encodeURIComponent(q) +
    '&hasImages=true&medium=Paintings&limit=' + Math.min(120, want + PER_PAGE));
  const ids = (s && s.objectIDs) || [];
  const slice = ids.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const out = [];
  /* the API allows 80 calls a second; eight at a time stays far below that */
  for (let i = 0; i < slice.length; i += 8) {
    const batch = await Promise.all(slice.slice(i, i + 8).map(id =>
      timed(MET_OBJECT + id, 8000).catch(() => null)));
    batch.forEach(o => {
      if (!o || !o.isPublicDomain || !o.primaryImageSmall) return;
      out.push({
        src: 'The Met',
        id: 'met-' + o.objectID,
        title: o.title || 'Untitled',
        artist: o.artistDisplayName || 'Unknown artist',
        /* objectDate is often empty even when the record knows the years; the two
           integers always carry them. Shaped the same way as Commons: "1632" or "1630–1631". */
        /* a date written in words ("18th century") is still a date worth showing */
        date: tidyDate(o.objectDate) || (/centur|dynasty|period/i.test(o.objectDate || '') ? String(o.objectDate).slice(0, 28) : metYears(o.objectBeginDate, o.objectEndDate)),
        thumb: o.primaryImageSmall,
        view: o.primaryImageSmall,
        full: o.primaryImage || o.primaryImageSmall,
        w: MET_ASSUMED, h: MET_ASSUMED, sized: false
      });
    });
  }
  return { items: out, more: ids.length > page * PER_PAGE };
}

async function commons(q, page) {
  const u = COMMONS + '?action=query&format=json&formatversion=2&generator=search' +
    '&gsrsearch=' + encodeURIComponent(q + ' painting') +
    '&gsrnamespace=6&gsrlimit=' + PER_PAGE + '&gsroffset=' + ((page - 1) * PER_PAGE) +
    '&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=420';
  const d = await timed(u);
  const pages = (d && d.query && d.query.pages) || [];
  const out = [];
  const dropped = { licence: 0, title: 0, titles: [] };
  pages.forEach(p => {
    const ii = (p.imageinfo || [])[0];
    if (!ii) return;
    const em = ii.extmetadata || {};
    const lic = em.LicenseShortName && em.LicenseShortName.value;
    if (!freeLicence(lic)) { dropped.licence++; return; }   /* silently dropped */
    /* Commons hangs a ?utm_source= on the file url, so the extension has to be
       read off the path, not off the whole string, and the tail is cut here */
    const clean = u => String(u || '').split('?')[0];
    if (!/\.(jpe?g|png|tiff?)$/i.test(clean(ii.url))) return;
    const raw = String(p.title || '').replace(/^File:/, '').replace(/\.[a-z]+$/i, '').replace(/_/g, ' ');
    /* the Artist field is whoever filled it in — sometimes the uploader's handle.
       Better no name than a wrong one. */
    let artist = tidyArtist(strip(em.Artist && em.Artist.value).slice(0, 90));
    if (artist === 'Unknown artist' || looksLikeNick(artist, raw)) artist = '';
    const date = tidyDate(strip(em.DateTimeOriginal && em.DateTimeOriginal.value));
    const title = pass2(tidyTitle(raw, artist), artist, !!date);
    /* nothing readable left after the cleaning: not worth a card */
    if (title.replace(/[^A-Za-zÀ-ɏ]/g, '').length < 3) { dropped.title++; dropped.titles.push(raw); return; }
    out.push({
      src: 'Wikimedia Commons',
      id: 'wc-' + p.pageid,
      title: title,
      raw: raw,
      artist: artist,
      date: date,
      thumb: clean(ii.thumburl || ii.url),
      /* What the magnifier shows. A Commons original can be forty megapixels and
         thirty megabytes, and a made-up thumbnail width is refused with a 400 —
         Special:FilePath is the endpoint that renders any width, or hands back
         the original when the file is too big to resize. */
      view: 'https://commons.wikimedia.org/wiki/Special:FilePath/' +
            encodeURIComponent(String(p.title || '').replace(/^File:/, '').replace(/ /g, '_')) + '?width=1400',
      full: clean(ii.url),
      w: ii.width || 0, h: ii.height || 0, sized: true
    });
  });
  return { items: out, more: !!(d && d.continue), dropped: dropped };
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim().slice(0, 90);
  const page = Math.min(6, Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1));
  if (q.length < 2) return json({ items: [], more: false, sources: [] });

  const cache = caches.default;
  const ck = new Request('https://art.genvidpro.internal/s?v=' + V + '&q=' + encodeURIComponent(q.toLowerCase()) + '&p=' + page);
  const hit = await cache.match(ck);
  if (hit) return hit;

  const [a, b] = await Promise.all([
    met(q, page).catch(e => ({ items: [], more: false, err: String(e).slice(0, 60) })),
    commons(q, page).catch(e => ({ items: [], more: false, err: String(e).slice(0, 60) }))
  ]);

  if (a.err && b.err) return json({ error: 'sources', items: [] }, 502);

  const seen = new Map();
  a.items.concat(b.items).forEach(it => {
    const k = key(it.artist, it.title);
    const old = seen.get(k);
    /* the same work in both places: keep the bigger file */
    if (!old || (it.w * it.h) > (old.w * old.h)) seen.set(k, it);
  });
  /* The Met first — its records are clean and its dates are right — then Commons;
     inside each group the larger file comes first. */
  const rank = it => (it.src === 'The Met' ? 0 : 1);
  const items = [...seen.values()].sort((x, y) => rank(x) - rank(y) || (y.w * y.h) - (x.w * x.h));
  const debug = url.searchParams.get('debug') === '1';
  const dropped = b.dropped || { licence: 0, title: 0, titles: [] };
  if (!debug) items.forEach(it => { delete it.raw; });

  const res = json({
    items: items,
    more: !!(a.more || b.more),
    sources: [a.err ? null : 'met', b.err ? null : 'commons'].filter(Boolean),
    dropped: { licence: dropped.licence, title: dropped.title, titles: debug ? dropped.titles : undefined }
  }, 200, !debug);
  if (!debug) await cache.put(ck, res.clone());
  return res;
}
