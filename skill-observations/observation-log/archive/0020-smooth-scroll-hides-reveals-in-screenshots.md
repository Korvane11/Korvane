---
id: 20
title: "Full-page review screenshots showed most sections empty: the script scrolled with scrollTo(0, y) on a page with scroll-behavior: smooth, so each step was cancelled by the next and the scroll-in fades never fired; it looked like a site bug"
status: actioned
type: open-source
skill: [webapp-testing, playwright-cli]
proposes_skill: []
target_file: ["prompts/site-blueprint.md"]
siblings_checked: "skill-families.md Browser testing: webapp-testing (recipe set; its screenshot examples read before: they screenshot without scrolling through) added as primary; playwright-cli added, assumed to share the gap (it takes full-page screenshots too), not read for it; the blueprint's 'Checks that count' named in target_file, where this project's testing lessons go"
area: "Review screenshots of pages with reveal-on-scroll and smooth scrolling"
date: 2026-10-13
session_context: "Eleven Cafē site: full-page screenshots of the four pages for the visual review before pushing"
parked_until:
resolved: 2026-10-19
resolution: "Staged as a patch to prompts/site-blueprint.md at skill-updates/2026-10-19/_target-files/prompts/site-blueprint.md.patch ('Test scripts' line: scroll with behavior 'instant', check scrollY before calling it a site bug) and principle 4 in cross-cutting-principles.md (weekly review 2026-10-19). webapp-testing and playwright-cli not edited: maintained upstream; owner's standing route is the blueprint."
reference: "sites/eleven-cafe/styles.css line 146 (html scroll-behavior: smooth); the review screenshot script lived in the session scratchpad"
commands_verified: "run: full-page screenshots after scrollTo(0, y) every 60 ms: index.html showed the hero and the first section, then three empty bands; menu.html showed an empty band where the menu groups are. run: the same pages after scrollTo({ top: y, behavior: 'instant' }) every 120 ms: every section shown. The behaviour checks (which scroll each control into view with behavior 'instant', and run reduced motion with scroll-behavior auto) passed on both runs"
---

**Issue:** The site sets `scroll-behavior: smooth` on `html`, and its
sections fade in when they scroll into view. The review script stepped
down each page with `scrollTo(0, y)` every 60 ms, then took a full-page
screenshot. Smooth scrolling turned each `scrollTo` into an animation,
and the next call cancelled it, so the page barely moved and the lower
sections never entered the viewport. The screenshots showed large empty
bands where the content should be. It looked like a broken page. A fix
made from that picture would have changed working code.

**Suggested improvement:** In webapp-testing's screenshot recipe (and the
blueprint's "Checks that count"): before a full-page screenshot of a page
with scroll-triggered reveals, scroll through it with
`scrollTo({ top: y, behavior: 'instant' })` (or `scrollIntoView` with
`behavior: 'instant'`) and short pauses, then return to the top and wait
for the fades. When a screenshot shows missing content, check whether the
script's scrolling actually moved the page (`scrollY` after each step)
before treating it as a site bug.

**Principle:** A screenshot is also a test of how the script got there.
When the picture shows something broken, first rule out the way it was
taken (scroll, timing, viewport), then change the product.
