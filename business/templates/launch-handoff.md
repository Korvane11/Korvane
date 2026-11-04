# Launch and handoff checklist

Copy into the client's site README and tick through it on launch day.

## Before launch
- [ ] Final payment received.
- [ ] Every fact checked against the owner's answers (hours, prices, phone,
      address) on the day of launch.
- [ ] Blueprint QA passes (`tests/behave.cjs`), plus a check on a real
      iPhone in Safari and a real Android phone.
- [ ] Forms tested end to end on the live address: the email arrives where
      the owner expects it.

## Launch
- [ ] Site deployed to the client's host (Cloudflare Pages, proposed).
- [ ] Domain connected (registered in the client's name); HTTPS working;
      www and the bare domain both work.
- [ ] `noindex` removed from every page.
- [ ] Absolute URLs updated (og:url, og:image, canonical) to their domain.
- [ ] robots.txt and sitemap.xml added; sitemap submitted in Google Search
      Console (owner's account).
- [ ] Google Business Profile's website link updated to the new site.
- [ ] Old site: redirected or taken down (their choice); booking and payment
      links still work.
- [ ] Link preview checked (text a link to yourself).
- [ ] Analytics set up on the owner's account, if they want it.

## Handoff (send to the owner)
- [ ] The live link and a 1-minute screen recording of the site.
- [ ] Where their domain is, and that it's in their name.
- [ ] How to ask for changes (care plan: what's included; otherwise the
      hourly rate).
- [ ] The site's files (zip or repository access).
- [ ] Two weeks later: a short message asking for a Google review, with the
      direct review link.

## In the Lead Desk
- [ ] Project steps ticked; care plan amount set on the lead.
