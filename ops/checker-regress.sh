#!/usr/bin/env bash
# The site checker, held to the cases that caught it lying. Run after every deploy:
#   ops/checker-regress.sh [https://genvidpro.com]
#
# Each line is a real site and the thing we got wrong about it on 29.09.2026. The point is
# not coverage, it is that these exact lies cannot come back:
#
#   busi.co.il           a genuinely poor phone site: it must still show four red chips.
#   bar-nikuy.co.il      answers at http and never redirects, so a visitor lands unencrypted
#                        and every browser says "not secure". We only ever asked for https
#                        and called it fine.
#   musach-victor.co.il  its firewall answers with a refusal page. We read that page as the
#                        site and told a working business it had no Hebrew and no phone link.
#   dalba.co.il          "fixed width 1280 px" off a stylesheet, about a site that is fine on
#                        a phone, because a later rule narrows it.
#   creativity32.com     Wix, which hands phones their own page at width=320. Called it "no
#                        phone layout".
#   app.base44.com       an app shell: nothing in the HTML, the whole site built by script.
#                        This is what the browser is for; without it there is nothing to read.
#   genvidpro.com        our own, and it had better come out clean.
#   info.cern.ch         no viewport at all. The oldest site on the web really has no phone
#                        layout, and saying so is correct.
#
# The scoring below mirrors findings() in index.html. If you change the thresholds there,
# change them here, and the point of this file is that you will notice.
set -uo pipefail
SITE="${1:-https://genvidpro.com}"
cd "$(dirname "$0")/.."

python3 - "$SITE" <<'PY'
import json, sys, urllib.request, urllib.parse, time

SITE = sys.argv[1]

def ask(host):
    q = SITE + '/preview?u=' + urllib.parse.quote(host)
    # A browser's user agent, because Cloudflare's own bot rules answer Python-urllib
    # with a 403 before the function ever runs, and then every case "fails" for nothing.
    r = urllib.request.Request(q, headers={
        'Referer': SITE + '/', 'Cache-Control': 'no-store',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'})
    for attempt in (1, 2):
        try:
            with urllib.request.urlopen(r, timeout=70) as f:
                return json.load(f)
        except Exception as e:
            if attempt == 2:
                return {'ok': False, 'why': 'request failed: %s' % e}
            time.sleep(2)

def bad_keys(c):
    """The red chips, by the same rules the page uses."""
    if not c:
        return set()
    f = set()
    if c.get('rendered'):
        if (c.get('overflow') or 0) > 8: f.add('off')
        if c.get('rtl'): f.add('rtl')
        if c.get('https') is False: f.add('https')
        if (c.get('zeros') or 0) >= 2: f.add('zeros')
        if (c.get('overlaps') or 0) >= 2: f.add('overlap')
        if (c.get('emptyBig') or 0) >= 1: f.add('emptyb')
        if not c.get('call'): f.add('call')
        if not c.get('install'): f.add('install')
        mf = c.get('minFont') or 0
        if 0 < mf < 12: f.add('tiny')
        if (c.get('tapsSmall') or 0) >= 3: f.add('tap')
        if (c.get('lazyMissing') or 0) >= 5: f.add('lazy')
        return f
    if c.get('vp') == 'missing': f.add('vp')
    elif c.get('vp') == 'locked': f.add('lock')
    if c.get('rtl'): f.add('rtl')
    if c.get('https') is False: f.add('https')
    if (c.get('fixedW') or 0) > 500: f.add('fixed')
    if not c.get('call'): f.add('call')
    if not c.get('install'): f.add('install')
    if (c.get('reqs') or 0) > 40: f.add('reqs')
    if (c.get('lazyMissing') or 0) >= 5: f.add('lazy')
    if (c.get('kb') or 0) > 700: f.add('kb')
    return f

def live(j, c, bad):     return j.get('ok') and not j.get('blocked')
CASES = [
    ('busi.co.il',          'four red chips on a poor phone site',
        lambda j, c, bad: live(j, c, bad) and len(bad) >= 4),
    ('bar-nikuy.co.il',     'http is open, so it is marked not secure',
        lambda j, c, bad: live(j, c, bad) and c and c.get('httpOpen') is True and 'https' in bad),
    ('musach-victor.co.il', 'the firewall blocked us and we say so',
        lambda j, c, bad: j.get('ok') and j.get('blocked') is True and not c),
    ('dalba.co.il',         'fine on a phone: no width complaint',
        lambda j, c, bad: live(j, c, bad) and 'off' not in bad and 'fixed' not in bad),
    ('creativity32.com',    'Wix phone page counts as a phone layout',
        lambda j, c, bad: live(j, c, bad) and 'off' not in bad and 'vp' not in bad and bool(j.get('title'))),
    ('app.base44.com',      'an app shell is read by the browser, not the HTML',
        lambda j, c, bad: live(j, c, bad) and bool(c) and c.get('rendered') is True),
    ('genvidpro.com',       'our own site comes out clean',
        lambda j, c, bad: live(j, c, bad) and len(bad) == 0),
    ('info.cern.ch',        'really has no phone layout, and we say so',
        lambda j, c, bad: live(j, c, bad) and ('off' in bad or 'vp' in bad)),
]

fails = 0
print('checker regression against %s\n' % SITE)
for host, what, ok in CASES:
    j = ask(host)
    c = j.get('checks')
    bad = bad_keys(c)
    how = 'blocked' if j.get('blocked') else ('browser' if (c or {}).get('rendered') else ('html, browser busy' if j.get('busy') else 'html'))
    try:
        good = bool(ok(j, c, bad))
    except Exception as e:
        good = False
        what += ' [check raised %s]' % e
    if not good:
        fails += 1
    print('%-4s %-22s %-52s (%s)%s' % ('ok' if good else 'FAIL', host, what, how,
          '' if good else '\n     chips: %s\n     answer: %s' % (sorted(bad), json.dumps(j)[:400])))

print('\n%d of %d pass' % (len(CASES) - fails, len(CASES)))
sys.exit(1 if fails else 0)
PY
