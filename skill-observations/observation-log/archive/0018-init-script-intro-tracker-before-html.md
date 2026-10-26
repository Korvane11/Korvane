---
id: 18
title: "A page-opening tracker installed with Playwright's addInitScript threw on every page (document.documentElement is null that early) and its 'intro finished' timestamp fired on an unrelated class change before the intro had started"
status: actioned
type: open-source
skill: [webapp-testing, playwright-cli]
proposes_skill: []
target_file: ["prompts/site-blueprint.md"]
siblings_checked: "skill-families.md Browser testing: webapp-testing (recipe set; Best Practices and examples read before, nothing on init scripts or timing an opening) added as primary; playwright-cli added, assumed to share the gap (it can add init scripts too), not read for it; the project blueprint's 'Checks that count' line named in target_file, since that is where this project's testing lessons go"
area: "Recipes for timing a site's opening animation from a test (init scripts, class-change observers)"
date: 2026-10-13
session_context: "Eleven Cafē site: browser checks that time the espresso-pour opening (when html.intro is set, when is-opening is added, when intro is removed)"
parked_until:
resolved: 2026-10-19
resolution: "Staged as a patch to prompts/site-blueprint.md at skill-updates/2026-10-19/_target-files/prompts/site-blueprint.md.patch ('Test scripts' line: wait for <html>, end only after start, page errors fail the run) (weekly review 2026-10-19). webapp-testing and playwright-cli not edited: maintained upstream; owner's standing route is the blueprint."
reference: "sites/eleven-cafe/tests/behave.cjs, trackIntro"
commands_verified: "run: PAGES_ONLY=1 node tests/behave.cjs with the first tracker: 4 page errors 'Cannot read properties of null (reading classList)', one per reduced-motion page that installed it; after waiting for <html> with a MutationObserver on document, no page errors. The early 'done' was found by reading the code (the head script adds the js class before the intro class, and the observer counted any attribute change without intro as done); the timing run that would show it waits for the render"
---

**Issue:** The site's opening is driven by classes on `<html>`: an inline
head script adds `js`, then `intro`; the page script later adds
`is-opening` and removes `intro`. The test recorded those moments from an
init script (`page.addInitScript`). It had two bugs:

1. It read `document.documentElement` at the top of the init script.
   Playwright runs init scripts as soon as the document is created, before
   `<html>` exists, so the script threw on every page that used it. The
   failures surfaced only as page errors, not as failed checks.
2. It counted "intro finished" as the first attribute change on `<html>`
   with no `intro` class. The head script adds `js` before `intro`, so
   that first change came before the intro had even started. Every timing
   built on that timestamp would have been wrong, or passed by accident.

**Suggested improvement:** In webapp-testing's recipes (and the blueprint's
"Checks that count"), add a pattern for timing an opening from a test:

- Wait for `<html>` before touching it. If `document.documentElement` is
  null, observe `document` for childList changes and start once it
  appears.
- Record a state's end only after its start has been seen (a seen-intro
  flag), never as the first change that lacks the class.
- Fail the run on page errors. The first bug showed only there.

**Principle:** An observer that marks "X ended" as the first change where X
is absent also fires before X has begun. Record an end only after its start
was seen. And code injected before the page exists has to wait for what it
reads.
