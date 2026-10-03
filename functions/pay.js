// Cloudflare Pages Function: /pay
// The deposit button's destination. GET /pay?amount=1450&currency=ILS&item=Website,%20Film
// answers 302 to PayPal's own payment page with the amount already filled in.
//
// Why a redirect instead of the link itself: until 03.10.2026 the page built the PayPal
// _xclick URL in the browser, so the payee address stood in plain text inside index.html —
// a file this site serves to anyone, in a repository that is public. Spam harvesters read
// exactly that. 03.10.2026, Roma: "ссылка для оплаты это моя почта, только она должна быть
// просто скрыта за кнопкой PayPal." The address now lives only as the Pages secret
// PAYPAL_EMAIL and is read here, on Cloudflare — the visitor sees /pay and the PayPal page,
// never the address.
//
// Degraded path on purpose: with no secret bound, the button still takes money through
// paypal.me, which is a public handle and leaks nothing. A deposit button that errors out
// is a lost sale; silence is not an option here.
const RETURN_URL = 'https://genvidpro.com/thanks.html';
const CANCEL_URL = 'https://genvidpro.com/';
const PAYPAL_ME = 'https://www.paypal.com/paypalme/romanchorny';
const CURRENCIES = ['ILS', 'USD'];

export async function onRequestGet({ request, env }) {
  const q = new URL(request.url).searchParams;
  const amount = Math.round(Number(q.get('amount')));
  const currency = String(q.get('currency') || 'USD').toUpperCase();
  // the item name is shown to the payer on PayPal's page; keep it one line and short
  const item = String(q.get('item') || '').replace(/\s+/g, ' ').trim().slice(0, 120);

  // A broken or hand-typed link must not open a payment page for a made-up sum.
  if (!(amount > 0 && amount <= 200000) || CURRENCIES.indexOf(currency) === -1) {
    return new Response(null, { status: 302, headers: { Location: CANCEL_URL, 'Cache-Control': 'no-store' } });
  }

  const mail = String(env.PAYPAL_EMAIL || '').trim();
  const url = mail
    ? 'https://www.paypal.com/cgi-bin/webscr?cmd=_xclick'
      + '&business=' + encodeURIComponent(mail)
      + '&item_name=' + encodeURIComponent('GenVidPro deposit 50% — ' + (item || 'GenVidPro package'))
      + '&amount=' + amount + '&currency_code=' + currency
      + '&no_shipping=1&no_note=0'
      + '&return=' + encodeURIComponent(RETURN_URL)
      + '&cancel_return=' + encodeURIComponent(CANCEL_URL)
    : PAYPAL_ME + '/' + amount + currency;

  return new Response(null, {
    status: 302,
    headers: { Location: url, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' },
  });
}
