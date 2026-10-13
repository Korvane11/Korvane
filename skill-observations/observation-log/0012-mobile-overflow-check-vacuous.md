---
id: 12
title: "A phone overflow check of scrollWidth > innerWidth passes a page that overflows: under Playwright's isMobile emulation wide content widens the layout viewport, so innerWidth grows with it"
status: open
type: open-source
skill: [animation-styles, webapp-testing]
proposes_skill: []
target_file: [".claude/skills/animation-styles/scripts/check-demos.cjs"]
siblings_checked: "no family registry yet; grepped every skill for scrollWidth and overflow checks: animation-styles/scripts/check-demos.cjs line 60 has the vacuous check (and SKILL.md step 5 tells readers to reuse its approach); webapp-testing and playwright-cli have no overflow check or recipe at all, so webapp-testing is the place a correct recipe belongs; playwright-cli is a command reference, instance-specific, no propagation; impeccable's live-browser.js compares a toolbar, not the page, and is unaffected"
area: "check-demos.cjs phone pass; SKILL.md 'How to use it' step 5"
date: 2026-10-13
session_context: "SimNow site split into six pages; the scratch page test (pages.cjs) reported 'fits' for gear.html on a 390px phone while the screenshot showed a card cut off at the right"
parked_until:
resolved:
resolution:
reference:
commands_verified: "run: Playwright Chromium, viewport 390x844, isMobile true, hasTouch true, gear.html before the fix: innerWidth 661, documentElement.scrollWidth 661, documentElement.clientWidth 390, visualViewport.width 390; after '.shop__grid .card { grid-column: auto; }' all three read 390 on all six pages"
---

**Issue:** The check `document.documentElement.scrollWidth > innerWidth`
is meant to catch content that sticks out past a 390px phone screen. It
passed a page that did exactly that.

On gear.html one card spanned 12 grid columns inside a narrower grid, so
the page was 661px wide. With Playwright's `isMobile: true` emulation
(what a phone test uses), Chromium behaves like a phone browser and
widens the layout viewport to fit the content:

- `innerWidth` became 661, the same as `scrollWidth`, so the check read
  "no overflow".
- `documentElement.clientWidth` stayed 390, the real screen width.
- On an actual phone this shows as a zoomed-out page or a sideways
  scroll, which is the failure the check exists to catch.

Without `isMobile`, `innerWidth` stays at the viewport width and the
check works, so it looks correct when it is written and tried on desktop
settings.

The same line is in `animation-styles/scripts/check-demos.cjs` (the phone
pass, line 60). SKILL.md step 5 tells readers to "reuse its approach" for
their own pages, so the flaw spreads to every project that follows it.
The demos may still be fine; the check just can't tell.

**Suggested improvement:**
- In `check-demos.cjs`, compare against the screen, not the layout
  viewport: `document.documentElement.scrollWidth > document.documentElement.clientWidth`,
  and also fail when `innerWidth !== document.documentElement.clientWidth`
  (the layout viewport was widened). Then rerun all twenty demos with it.
- Add a short phone-overflow recipe to `webapp-testing`, which has none:
  the two comparisons above, plus listing the widest elements
  (`getBoundingClientRect().right > clientWidth`) so a failure names the
  culprit instead of just saying "overflow".

**Principle:** A check is only proven by watching it fail on a known-bad
input. Before trusting a pass, break the thing on purpose (or find a page
that is broken) and confirm the check reports it. Here the "known-bad"
page existed and the check said it was fine.
