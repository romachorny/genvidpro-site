// Cloudflare Pages Function: POST /tts  {text, lang}  ->  audio/mpeg
//
// The assistant used to read its answers with window.speechSynthesis, and on a
// Windows Chrome the only Hebrew voice there is Microsoft Asaf, an old SAPI voice
// that sounds like a railway announcement. Hebrew is the language of the clients,
// so this asks Microsoft Azure Speech for a neural voice instead.
//
// Two secrets in the Pages project turn it on: AZURE_TTS_KEY and AZURE_TTS_REGION
// (for example "westeurope"). Without them this answers 503 and the page falls
// back to the browser voice, exactly as it behaved before.
//
// Every answer is kept in the EVENTS KV for 30 days under the SHA-256 of the voice
// and the text, so an answer the assistant gives a hundred times is paid for once.

const VOICES = {
  he: 'he-IL-HilaNeural',
  ru: 'ru-RU-SvetlanaNeural',
  en: 'en-US-AndrewNeural',
  ar: 'ar-SA-ZariyahNeural'
};
const MAX_CHARS = 600;
const TTL = 60 * 60 * 24 * 30;
const PER_IP_HOUR = 60;       // fresh renders only, a cached answer costs nothing
const SITE_HOSTS = ['genvidpro.com', 'www.genvidpro.com'];

function hostOf(u) { try { return new URL(u).hostname.toLowerCase(); } catch (e) { return ''; } }
function ourHost(h) {
  return !!h && (SITE_HOSTS.indexOf(h) !== -1 || h === 'genvidpro.pages.dev' || h.endsWith('.genvidpro.pages.dev') ||
    h === 'localhost' || h === '127.0.0.1');
}
function callerHost(request) {
  return hostOf(request.headers.get('Origin') || '') || hostOf(request.headers.get('Referer') || '');
}
const JSON_H = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
function fail(status, why) { return new Response(JSON.stringify({ ok: false, why }), { status, headers: JSON_H }); }

// The alphabet of the text wins over the label the page sends: the assistant
// answers in the visitor's language, which is not always the language of the page.
function langOf(text, asked) {
  if (/[֐-׿]/.test(text)) return 'he';
  if (/[؀-ۿ]/.test(text)) return 'ar';
  if (/[Ѐ-ӿ]/.test(text)) return /[іїєґ]/i.test(text) ? 'uk' : 'ru';
  const a = String(asked || '').slice(0, 2).toLowerCase();
  return /[a-z]/i.test(text) && (a === 'en' || !a) ? 'en' : a;
}

// Cut at the last sentence end that fits, so a long answer is not read out to the
// middle of a word.
function cap(text) {
  if (text.length <= MAX_CHARS) return text;
  const head = text.slice(0, MAX_CHARS);
  const m = /^[\s\S]*[.!?。׃؟](?=\s|$)/.exec(head);
  return (m && m[0].length > MAX_CHARS * 0.5 ? m[0] : head).trim();
}

function xml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

async function sha256(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function overLimit(env, ip) {
  if (!env.EVENTS || !ip) return false;
  const key = 'tts:rl:' + ip + ':' + Math.floor(Date.now() / 3600000);
  try {
    const n = parseInt((await env.EVENTS.get(key)) || '0', 10);
    if (n >= PER_IP_HOUR) return true;
    await env.EVENTS.put(key, String(n + 1), { expirationTtl: 3600 });
  } catch (e) {}
  return false;
}

const AUDIO_H = (hit) => ({ 'Content-Type': 'audio/mpeg', 'Cache-Control': 'private, max-age=86400', 'X-TTS-Cache': hit ? 'HIT' : 'MISS' });

export async function onRequestPost({ request, env }) {
  if (!ourHost(callerHost(request))) return fail(403, 'forbidden');
  if (!env.AZURE_TTS_KEY || !env.AZURE_TTS_REGION) return fail(503, 'no_key');

  let body;
  try { body = await request.json(); } catch (e) { return fail(400, 'bad_json'); }
  const text = cap(String((body && body.text) || '').replace(/\s+/g, ' ').trim());
  if (!text) return fail(400, 'empty');
  const voice = VOICES[langOf(text, body.lang)];
  if (!voice) return fail(422, 'no_voice');   // the page keeps the browser voice for this language

  const key = 'tts:' + await sha256(voice + '\n' + text);
  if (env.EVENTS) {
    try {
      const hit = await env.EVENTS.get(key, 'arrayBuffer');
      if (hit && hit.byteLength) return new Response(hit, { headers: AUDIO_H(true) });
    } catch (e) {}
  }

  if (await overLimit(env, request.headers.get('CF-Connecting-IP') || '')) return fail(429, 'too_many');

  const lang = voice.slice(0, 5);
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}">` +
    `<voice name="${voice}">${xml(text)}</voice></speak>`;
  let r;
  try {
    r = await fetch(`https://${env.AZURE_TTS_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': env.AZURE_TTS_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'genvidpro-tts'
      },
      body: ssml,
      signal: AbortSignal.timeout(15000)
    });
  } catch (e) {
    return fail(502, 'upstream_unreachable');
  }
  if (!r.ok) return fail(502, 'upstream_' + r.status);
  const audio = await r.arrayBuffer();
  if (!audio.byteLength) return fail(502, 'upstream_empty');
  if (env.EVENTS) {
    try { await env.EVENTS.put(key, audio, { expirationTtl: TTL }); } catch (e) {}
  }
  return new Response(audio, { headers: AUDIO_H(false) });
}

export async function onRequestGet() { return fail(405, 'post_only'); }
