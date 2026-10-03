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
#   musach-victor.co.il  its firewall answered with a refusal page and we read that page as
#                        the site, telling a working business it had no Hebrew and no phone
#                        link. It stopped refusing us on 02.10.2026, so this now accepts
#                        either answer — see the note on the case itself.
#   dalba.co.il          "fixed width 1280 px" off a stylesheet, about a site that is fine on
#                        a phone, because a later rule narrows it.
#   creativity32.com     Wix, which hands phones their own page at width=320. Called it "no
#                        phone layout".
#   yeshli.base44.app    Roma's own Base44 app: 3.8 KB, an empty <title>, and the whole
#                        site built by script. This is what the browser is for; without it
#                        there is nothing to read at all. Not app.base44.com — their
#                        marketing front page has plenty of HTML to read, which is the one
#                        thing this case must not have.
#   genvidpro.com        our own, and it had better come out clean.
#   info.cern.ch         no viewport at all. The oldest site on the web really has no phone
#                        layout, and saying so is correct.
#
# The scoring below mirrors findings() in index.html. If you change the thresholds there,
# change them here, and the point of this file is that you will notice.
#
# 29.09.2026, the lesson that cost a second round: a case must assert what the visitor SEES,
# not merely that the one bug it was written for is gone. dalba and creativity32 used to
# check "'fixed' not in bad" and "'vp' not in bad" — narrow, and both went green while
# creativity32 carried a red "837 KB of html" chip nobody had thought to look for. A case
# that names the chips it forgives can only ever catch the bug it already knows. They state
# the whole expected result now — empty for creativity32, exactly {reqs, lazy} for dalba —
# so a chip nobody thought about cannot hide behind one nobody forgave.
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
    # Browser Rendering on the free plan allows three browsers at once and one NEW browser
    # every 20 seconds. A visitor checks one site and never meets that; this file checks
    # eight in a row and meets it every time, and then every case "passes" on the HTML road
    # while telling you nothing about the browser. So it waits for a browser rather than
    # settling for the fallback, and says plainly when it gave up waiting.
    # Two tries, never more. /preview also guards itself at 40 lookups an hour per address,
    # and on 30.09.2026 a four-try loop over eight sites spent that guard instead of the
    # browser: every case came back 429 from our own edge and the run said nothing about
    # anything. A test that trips the product's abuse guard is measuring the guard.
    for attempt in (1, 2):
        try:
            with urllib.request.urlopen(r, timeout=90) as f:
                j = json.load(f)
        except Exception as e:
            return {'ok': False, 'why': 'request failed: %s' % e}
        if j.get('busy') and attempt == 1:
            time.sleep(25)      # the 20-second door for a new browser, plus a little
            continue
        return j

def bad_keys(c):
    """The red chips, by the same rules the page uses."""
    if not c:
        return set()
    f = set()
    if c.get('rendered'):
        # mirrors the rendered branch of findings() in index.html. 30.09.2026: overlaps,
        # emptyBig and zeros are measured but no longer shown, because on the first real
        # run they condemned our own clean page and a working studio; and the viewport
        # chip lives here again, because the browser happily lays out at 390 a page that a
        # phone would shrink, so overflow alone cannot see a missing viewport tag.
        if c.get('vp') == 'missing': f.add('vp')
        elif c.get('vp') == 'locked': f.add('lock')
        if (c.get('overflow') or 0) > 8: f.add('off')
        if c.get('rtl'): f.add('rtl')
        if c.get('https') is False: f.add('https')
        if not c.get('call'): f.add('call')
        if not c.get('install'): f.add('install')
        if (c.get('smallPct') or 0) > 40 and (c.get('textChars') or 0) >= 400: f.add('tiny')
        ts, tt = c.get('tapsSmall') or 0, c.get('taps') or 0
        if ts >= 3 and tt > 0 and ts / tt >= 0.2: f.add('tap')
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
    if (c.get('kb') or 0) > 250: f.add('kb')
    return f

def live(j, c, bad):     return j.get('ok') and not j.get('blocked')
CASES = [
    ('busi.co.il',          'four red chips on a poor phone site',
        lambda j, c, bad: live(j, c, bad) and len(bad) >= 4),
    ('bar-nikuy.co.il',     'http is open, so it is marked not secure',
        lambda j, c, bad: live(j, c, bad) and c and c.get('httpOpen') is True and 'https' in bad),
    # musach-victor: on 29.09.2026 its F5 firewall answered us with "The requested URL was
    # rejected" and we read that page as the site, telling a working garage it had no
    # Hebrew, no phone link and no manifest. On 02.10.2026 it stopped refusing us — a plain
    # curl now returns the real 46 KB page — so the live state this case was written
    # against no longer exists, and demanding blocked=True would be demanding a lie.
    # Either answer is correct and which one happens is their firewall's choice, not ours.
    # What must never come back is the third thing: a refusal page judged as a site. The
    # detection itself is pinned offline, deterministically, in scripts/preview-unit.mjs
    # (F5, Cloudflare, Imperva, a bare 403, and two pages that must NOT count as blocked).
    ('musach-victor.co.il', 'blocked and we say so, or read properly and judged on merit',
        lambda j, c, bad: j.get('ok') and (
            (j.get('blocked') is True and not c) or
            (j.get('blocked') is False and bool(c) and bool(j.get('title'))))),
    # dalba: the bug was "fixed width 1280 px" about a site that is fine on a phone, so no
    # layout chip may appear. The two that do are true and measured 29.09.2026 — 29 external
    # scripts plus 44 fetching links plus 7 images is 83 requests on first open, and not one
    # of those 7 images is lazy. Named exactly, so a new chip fails this, and an honest one
    # that goes away fails it too; either way somebody looks.
    # 'reqs' is an HTML-road chip and there is no browser equivalent, so with the browser on
    # the honest leftover is the one true thing: 7 images and not one of them lazy.
    ('dalba.co.il',         'fine on a phone; heavy, and only where it really is',
        lambda j, c, bad: live(j, c, bad) and bad == ({'lazy'} if c.get('rendered') else {'reqs', 'lazy'})),
    ('creativity32.com',    'a working Wix studio: no red chips at all',
        lambda j, c, bad: live(j, c, bad) and not bad and bool(j.get('title'))),
    # Roma's own Base44 app, named by him on 30.09.2026, not app.base44.com: their marketing
    # front page has enough HTML to read, which is exactly what this case must not have.
    # This one ships 3.8 KB with an empty <title> and builds everything in the browser — if
    # the browser is not running there is nothing here to judge, so it is the honest test.
    ('yeshli.base44.app',   'an app shell is read by the browser, not the HTML',
        lambda j, c, bad: live(j, c, bad) and bool(c) and c.get('rendered') is True),
    ('genvidpro.com',       'our own site comes out clean',
        lambda j, c, bad: live(j, c, bad) and len(bad) == 0),
    ('info.cern.ch',        'really has no phone layout, and we say so',
        lambda j, c, bad: live(j, c, bad) and ('off' in bad or 'vp' in bad)),
]

fails = 0
print('checker regression against %s\n' % SITE)
for idx, (host, what, ok) in enumerate(CASES):
    # one NEW browser every 20 seconds on the free plan, and eight sites in a row is the
    # one workload that meets that limit head on
    if idx: time.sleep(22)
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
