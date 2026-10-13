---
id: 6
title: "Screenshot-only site tests shipped an invisible layer that blocked every tap; the hit tests that replaced them need on-screen points, miss pointer-events:none overlays that dim controls, and can't capture mailto by stubbing location"
status: actioned
type: open-source
skill: [webapp-testing, playwright-cli]
proposes_skill: []
target_file: []
siblings_checked: "no family registry yet; browser-testing skills: webapp-testing (Best Practices, Reconnaissance-Then-Action: read, nothing on hit-testing primary controls) added; playwright-cli added as the sibling that drives the same browser, assumed to share the gap, not read for it"
area: "smoke tests for marketing sites: interaction, not just rendering"
date: 2026-10-12
session_context: "SimNow site, 2026-10-12 and the 2026-10-13 multi-page split: a closed mobile menu (`<div hidden>` with author CSS `display: flex`, opacity 0, z-index above the page) covered the whole page on desktop and phone, so the hero CTAs and every in-page link were dead. It was live for several deploys. Every Playwright run had only scrolled and screenshotted. It surfaced only when a new test clicked a button and Playwright reported 'menu intercepts pointer events'"
parked_until:
resolved: 2026-10-13
resolution: "Staged in prompts/site-blueprint.md (patch staged at skill-updates/2026-10-13/_target-files/prompts/site-blueprint.md.patch) ('Checks that count, in a browser...'); mailto and overflow lines already in CLAUDE.md; cross-cutting principle 1. webapp-testing, playwright-cli: not edited, foreign-maintained."
reference:
commands_verified: "run: document.elementFromPoint at the centre of '.hero__ctas a' returned the #menu element before the fix and the link after `.menu[hidden] { display: none; }`, desktop 1440x900 and phone 390x844"
---

**Issue:** The site's test scripts loaded the page, scrolled through it and
took screenshots at desktop and phone sizes, then checked the console for
errors. They never clicked or tapped anything. A closed menu overlay had
the `hidden` attribute, but the stylesheet gave `.menu` a `display: flex`,
which overrides the browser's `[hidden] { display: none }`. So the "closed"
menu stayed in the layout at opacity 0, fixed over the full screen, above
the page content. Screenshots looked perfect. Console was clean. Every
button and link under it was dead on the live site. It was found by
accident, when a new test tried to click "Skip intro" and Playwright
reported which element intercepted the pointer.

**Suggested improvement:** Add a step to webapp-testing (Best Practices,
or a new "Interaction smoke check" next to Reconnaissance-Then-Action):
after load, for every primary control (CTAs, nav links, menu toggle,
form submit), hit-test its centre with `document.elementFromPoint` and
assert the hit lands on the control or inside it, at each breakpoint, in
each UI state (intro over, menu closed, modal closed). A Playwright
`click()` without `force` does the same check and names the blocker on
failure. Note the specific pitfall as a known cause: an element hidden
with the `hidden` attribute while author CSS sets its `display`. Also
note: in headless software GL, time-based intros can finish before
Playwright's actionability checks complete. Pause the animation timeline
inside the wait predicate, not after it.

**Principle:** A screenshot proves what a page looks like, not what it
does. Overlays are invisible by design, so an invisible layer that
catches input can only be found by an interaction test that asks what
receives the click.

**Follow-up (2026-10-13, SimNow split into six pages):** three more
pitfalls for the same interaction smoke check, all met while writing it:
- `elementFromPoint` returns `null` for a point outside the viewport. On
  phones the page headers sit under the video band, so two header buttons
  were below the screen and the check reported them as blocked "under
  undefined". Scroll each control into view (`block: 'center'`) before
  hit-testing it.
- The reverse blind spot: a layer with `pointer-events: none` is skipped by
  hit-testing, so it never "blocks" anything, yet it can still paint over
  the control. A section's fade-in (`.after::before`, 40vh tall, reaching
  upward) dimmed every page header's buttons to about half strength. Every
  hit test passed; only the screenshot showed it. Keep both checks: hit
  tests for taps, screenshots (or a computed-colour sample at the button's
  centre) for what is painted on top.
- Form submits that open `mailto:` can't be captured by stubbing
  `location.href` (it is unforgeable; the override silently does nothing).
  Playwright's `request` event and CDP `Page.frameRequestedNavigation` both
  report the mailto URL, so the test can assert the address, subject and
  body.
