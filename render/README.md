# gvp-render — the browser behind the site checker

`/preview` on genvidpro.com used to judge a stranger's site by reading its HTML. That is
blind to every builder that paints the page with JavaScript — Wix, Base44, Lovable, Duda,
WordPress page builders, any React app — and it is how a working Wix site was told it had
no phone layout and an app shell looked like an empty site.

This Worker renders the page in a real Chromium at a phone's size (390 x 844, DPR 3, a
phone user agent) and at 1440 x 900, and measures the faults on what was painted: how far
the page runs off the side, the smallest type, tap targets under 44 px, the rendered text
direction, counters stuck at zero, text printed over text, screen-wide empty blocks, tel
and manifest links. It also takes the two screenshots the page shows in its phone frames.

## It has no address

`workers_dev = false` and no route. The only caller is genvidpro.com's `/preview`, through
the service binding in the site's `wrangler.toml`. That is deliberate: a renderer reachable
from the internet is an open door for fetching arbitrary URLs from someone else's name.

## The budget

Workers Free: 10 browser minutes a day for the whole account, 3 browsers at once, one new
browser every 20 seconds. So:

* every address is rendered once and kept for 24 hours (`rr:<url>` in KV);
* sessions are reused instead of launched;
* the spend is counted per UTC day (`brms:<day>`) and `GET /budget` reports it;
* at 97 % of the day it stops launching browsers and answers `busy`, and `/preview` falls
  back to reading the HTML and tells the visitor that is what it did. The check never fails.

`~/bin/gvp-render-budget.sh` (a user timer, every 30 minutes) reads `/preview?budget=1` and
messages Roma the first time a day passes 70 %.

## Publish

```
ops/render-deploy.sh        # this Worker, needs node_modules; run it FIRST
ops/deploy.sh "..."         # the site, which binds it
ops/checker-regress.sh      # the eight sites that caught the checker lying
```

The Cloudflare token in `~/.secrets/cloudflare.env` needs **Workers Scripts:Edit** and
**Browser Rendering:Edit** on top of its Pages access. Without them `ops/render-deploy.sh`
stops with "No access to the specified resource", and the site keeps working from the HTML.
