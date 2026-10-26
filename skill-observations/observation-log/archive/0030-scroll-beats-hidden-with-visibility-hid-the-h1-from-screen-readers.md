---
id: 30
title: "A pinned hero whose lines take turns with the scroll hid the waiting lines with visibility: hidden (the same thing GSAP's autoAlpha does at 0), which also took them out of the accessibility tree: the page's h1 and its two call-to-action links were invisible to screen readers until the visitor scrolled; an accessibility tree snapshot found it, the visual checks never could"
status: actioned
type: open-source
skill: [gsap-core, gsap-scrolltrigger, scroll-reveal-libraries]
proposes_skill: []
target_file: []
siblings_checked: "no registered family for the scroll and animation skills (skill-families.md has none); checked by description: gsap-core (recommends autoAlpha for fades, SKILL.md lines 85 and 242) added as primary; gsap-scrolltrigger added (pinned, scrubbed sequences are where content waits its turn); scroll-reveal-libraries added (reveal-on-scroll hides content until it enters); locomotive-scroll excluded, assumed (smooth scrolling, it hides nothing); gsap-timeline, gsap-utils, gsap-plugins, gsap-react, gsap-frameworks, gsap-performance excluded, assumed (they don't decide how content is hidden)"
area: "Scroll-driven text that is hidden until its turn: how it is hidden"
date: 2026-10-14
session_context: "Eleven Cafē site, blueprint QA: the accessibility review of the home page's pinned hero (three lines over the rendered scene, the last one the h1 with the buttons)"
parked_until:
resolved: 2026-10-19
resolution: "Staged as a patch to prompts/site-blueprint.md at skill-updates/2026-10-19/_target-files/prompts/site-blueprint.md.patch (Build: waiting content hidden with opacity and pointer-events, never visibility/autoAlpha; Checks: accessibility snapshot at load) and principle 4 in cross-cutting-principles.md (weekly review 2026-10-19). gsap-core, gsap-scrolltrigger (GreenSock) and scroll-reveal-libraries (freshtechbro) not edited: maintained upstream; owner's standing route is the blueprint. Family registered in skill-families.md."
reference: "sites/eleven-cafe/styles.css (the .js .beat rules: opacity and pointer-events now, no visibility); sites/eleven-cafe/tests/behave.cjs section 4c"
commands_verified: "run: Playwright accessibility snapshot of the home page at load with the old CSS: the first heading was the h2 'Cà phê sữa đá', no h1. run: computed style of the three beats at load: visible / hidden / hidden. run: the same snapshot with opacity and pointer-events instead of visibility: the h1 first, the directions link present; a Tab walk at 1440 and 390 px: every stop shown and clear of the nav"
---

**Issue:** The home page's opening pins the scene while three lines take
turns with the scroll. The last line is the page's h1 with its two buttons. The
lines waiting their turn were hidden with `opacity: 0; visibility: hidden`,
which is GSAP's `autoAlpha: 0`, the fade the installed gsap-core skill
recommends by default. `visibility: hidden` also removes an element from the
accessibility tree, so a screen reader landing on the page found no h1 and
none of the hero's buttons until the visitor had scrolled two thirds of the
way down the pinned section. Every earlier check was visual: screenshots,
beat timing, tap targets, tab order with the mouse-free path. The tab order even
skipped the hidden buttons silently. An accessibility tree snapshot
(`page.accessibility.snapshot()`) showed it at once.

**Suggested improvement:**
- **gsap-core (autoAlpha), gsap-scrolltrigger (pinned and scrubbed
  sequences):** say when `autoAlpha` / `visibility: hidden` is wrong. It is
  wrong for content that is only waiting its turn on screen: a heading, a line
  of copy, a call to action. That content stays in the accessibility tree with
  `opacity: 0; pointer-events: none`. Keyboard focus on it should bring it on
  screen (scroll to its step). `autoAlpha` is for UI that is truly gone: a
  closed menu, a dismissed toast.
- **scroll-reveal-libraries:** the same rule for content hidden until it scrolls
  in.
- **All three:** the check is an accessibility tree snapshot at load, looking
  for the h1 and the main call to action. Screenshots cannot see it.

**Principle:** Hiding something from the eye and hiding it from assistive
technology are different decisions. A visual transition should make only the
first. Content that is merely waiting its turn on screen is still content, and
the check for it reads the accessibility tree, not the pixels.
