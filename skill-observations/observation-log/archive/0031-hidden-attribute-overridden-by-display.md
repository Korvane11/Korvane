---
id: 31
title: "A phone menu toggled with the hidden attribute had display: flex in its class rule, which beats the browser's [hidden] style: the closed menu was an invisible full-screen layer over every page, on desktop too, eating every click; only a click test found it, the screenshots looked perfect"
status: actioned
type: open-source
skill: []
proposes_skill: []
target_file: ["prompts/site-blueprint.md"]
siblings_checked: "Design direction (pattern group): redesign-existing-projects, design-taste-frontend, high-end-visual-design, impeccable, frontend-design, ui-ux-pro-max: excluded, assumed (none is maintained here; per the family note, lessons for all of them go to prompts/site-blueprint.md, named in target_file). Browser testing (pattern group): webapp-testing, playwright-cli: excluded, assumed (the detection side is already the blueprint's 'hit-tested at its centre' check, which is what caught it)"
area: "Building: components shown and hidden with the hidden attribute"
date: 2026-10-14
session_context: "Pour My Coffee Co site, first build: the phone menu (.menu { display: flex; opacity: 0 } with the hidden attribute when closed)"
parked_until:
resolved: 2026-10-19
resolution: "Staged as a patch to prompts/site-blueprint.md at skill-updates/2026-10-19/_target-files/prompts/site-blueprint.md.patch (Build: [hidden] with a class that sets display; Checks: click under a closed overlay) and principle 4 (weekly review 2026-10-19)."
reference: "sites/pour-my-coffee/styles.css (.menu[hidden] { display: none; }); sites/pour-my-coffee/tests/behave.cjs (the form tests' page.click and the controls' elementFromPoint check)"
commands_verified: "run: tests/behave.cjs before the fix: page.click on the Location form's submit button timed out, Playwright's log said '<div id=\"menu\" hidden class=\"menu\"> intercepts pointer events'. run: the same after adding .menu[hidden] { display: none; }: the click went through and 432 of 444 checks passed (the rest were unrelated)"
---

**Issue:** The phone menu was closed with the `hidden` attribute and opened
by removing it, with a fade. Its class rule set `display: flex` (and
`opacity: 0` until open). An author `display` beats the browser's
`[hidden] { display: none }`, so the closed menu stayed in the layout: a
fixed, full-screen, fully transparent layer on top of every page, at every
width, taking every click. Full-page screenshots looked right, because it
was invisible. The test suite's first `page.click` on a form button failed
with Playwright reporting the menu as the element intercepting the pointer.

**Suggested improvement:** In `prompts/site-blueprint.md` (Build): "Anything
shown and hidden with the `hidden` attribute whose class sets `display`
needs `[hidden] { display: none }` for that class (or a global
`[hidden] { display: none !important }`). Check closed overlays with a click
on what lies under them, not with a screenshot."

**Principle:** An invisible element still takes clicks. When visibility is
switched by an attribute the browser styles weakly, any rule that sets
`display` on the same element silently switches it back on; the only check
that sees it is one that clicks through where it would be.
