---
id: 17
title: "A business whose only site is a Facebook page: logged out, a desktop browser is sent to the log-in wall, but a phone user agent gets the page (intro, address, phone, email, reviews, recent posts and a 720 px logo in og:image); hours, menu and full-size photos stay behind the log-in. The blueprint's 'read their site directly' step has no route for this"
status: open
type: open-source
skill: [redesign-existing-projects]
proposes_skill: []
target_file: ["prompts/site-blueprint.md"]
siblings_checked: "skill-families.md design direction: redesign-existing-projects (How This Works step 1 Scan, read: it scans a codebase, not a third-party page) added; design-taste-frontend §11.B Audit Before Touching excluded (it audits an existing site the agent owns, assumed, not read for Facebook); impeccable excluded (audits the build in hand, assumed); the project blueprint (prompts/site-blueprint.md, Facts: 'If their site can't be opened directly, try search and web archives') named in target_file because it is where new-client reading starts"
area: "Reading the current site when it is a social page: what is reachable logged out, and how"
date: 2026-10-13
session_context: "New client site for a downtown Tucson espresso bar whose only web presence is a Facebook page shared as a /share/ link"
parked_until:
resolved:
resolution:
reference: "sites/eleven-cafe/README.md, 'Facts and where each one came from'"
commands_verified: "run: Playwright Chromium, desktop viewport, default user agent: the share link redirected to facebook.com/login. run: same link with an iPhone Safari user agent at 390x844: the page rendered (name, intro line, category and price range, 'Open now', address, phone, email, 11 reviews, posts to 2020) and its og:image meta held the profile logo at 720x720. run: /about, /about_contact_and_basic_info and /photos redirected to the log-in page; /reviews rendered with every review's text and date. run: tapping 'Open now' or 'Details' did not reveal the hours logged out."
---

**Issue:** The brief was a Facebook share link: the business has no other
website. The blueprint says to read every fact from the business's own site
directly, and if it can't be opened, to try search and web archives. A
plain Playwright visit at desktop size went straight to Facebook's log-in
page, which looks like "can't be opened". The page was in fact readable:
with a phone user agent, logged out, Facebook served the page itself:

- the intro line, category and price range;
- the address, phone and email;
- every review with its date (on /reviews);
- recent posts;
- an og:image holding the profile logo at 720 px, big enough to trace into
  a clean vector.

What stayed behind the log-in:

- the hours (the page showed "Open now", but the list would not open);
- /about, the photo albums and the menu tab;
- photos larger than 390 px.

The hours finally came from Google's listing via a third-party site,
treated as a draft and cross-checked against Facebook's "Open now" at a
known local time.

**Suggested improvement:** In the blueprint's Facts rules (and in
redesign-existing-projects' Scan, for a client whose current site is a
social page), add:

- If their only site is a Facebook page, render it logged out with a phone
  user agent. Read the main page and /reviews.
- Take the logo from og:image, which holds the largest copy logged out.
- Expect the hours, the menu and full-size photos to need the owner. Ask
  for them, and treat third-party listings as drafts. Where possible,
  check them against something the page itself shows, such as "Open now"
  at a known local time.

**Principle:** "Couldn't open it" is a claim about the request, not the
source. Before falling back to third parties, vary the request a real
visitor would make (device, user agent, logged-out paths). Then list
exactly which facts still need the owner, rather than treating the source
as unreadable.
