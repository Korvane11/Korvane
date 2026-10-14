---
id: 7
title: "The existing site was unreachable; the owner was asked to change settings before the search route was tried, and the search-derived facts then published on the new site were stale"
status: actioned
type: open-source
skill: [redesign-existing-projects, design-taste-frontend]
proposes_skill: []
target_file: []
siblings_checked: "no family registry yet; skills that start from an existing site: redesign-existing-projects (Design Audit, read: assumes the current site can be opened) added; design-taste-frontend §11 REDESIGN PROTOCOL added, assumed to share the assumption, not read for it; impeccable excluded: audits the build in hand, not a third-party site, assumed"
area: "redesign audit: getting the current site's content when the sandbox blocks it"
date: 2026-10-12
session_context: "SimNow site rebuild in a sandboxed cloud container: the owner asked why the agent couldn't read their current site to see everything that must carry over; follow-up the same day once the owner opened network access"
parked_until:
resolved: 2026-10-13
resolution: "Partly already applied (blueprint: search summaries go stale); the remainder (try search and archives before asking the owner; render web-app sites) staged in prompts/site-blueprint.md (patch staged at skill-updates/2026-10-13/_target-files/prompts/site-blueprint.md.patch). redesign-existing-projects, design-taste-frontend: not edited, foreign-maintained."
reference:
commands_verified: "run: curl to both hosts returned 'CONNECT tunnel failed, response 403'; the web fetch tool returned ENOTFOUND for the site and for a public DNS resolver; WebSearch returned summaries of the site's homepage, including its phone, email and hours"
---

**Issue:** The owner wanted the new site to carry everything from their
existing site. The container's network policy blocked that host (403 at the
proxy), and the in-container fetch tool was blocked the same way. The agent
explained how to allowlist the domain and asked the owner to do it. The owner
didn't change the setting; they just sent the link again, which cost a full
round trip. Only then did the agent try web search. Search runs outside the
container, and it returned the site's own contact block: phone, email and
hours. It also returned the service list (hourly rentals, new and pre-owned
gear, delivery and setup, consulting, weekly community races, an events
list). That covered most of what was needed. The missing phone number had
been listed as "still needed from the client" for several sessions,
although it was one search away the whole time.

**Suggested improvement:** In redesign-existing-projects, at the start of
the Design Audit (and in design-taste-frontend §11 REDESIGN PROTOCOL), add a
content-inventory step with a fallback ladder for when the existing site
can't be opened directly:
1. A direct fetch.
2. A search engine, with queries for the brand plus address, phone, hours
   and prices.
3. A web archive, if it can be reached.
4. Screenshots or pasted text from the owner.
5. A settings change that only the owner can make.

Only step 5 needs the owner, so try it last. Record each fact with its
source, and mark search-derived facts as possibly stale. Keep a "still
needed from the client" list only for facts that every route has failed to
produce.

**Follow-up (same day):** The owner then set network access to Full, and
the site was rendered in a headless browser. It's a client-side app, so a
plain fetch returned an empty shell. Two of the facts taken from search and
already published on the new site were wrong:
- The hours were 1-9 PM daily by appointment, not 9 AM-9 PM.
- The email was a different address.

The search index had kept an older version of the page. The rendered site
also had a whole service line (event rentals), live prices and a booking
system that the search summaries never mentioned. So the ladder above
needs a second rule: a search-derived fact may stand in for a direct read
in a draft, but it must not ship as fact. Either tag it for the client to
confirm, or replace it once a direct read is possible. Also, when the
direct read does become possible, render the page in a browser rather than
fetching its HTML.

**Principle:** When the direct path to a source is blocked, try the routes
that don't share the blocked path before handing work to the user. A
question the user has to act on costs a round trip, and they may not act on
it the way you expect.
