# Skill families and pattern groups

First draft, built by the 2026-10-13 review from the observation log. See
task-observer `references/observation-log.md`, "Skill families and the
sibling check", for what the fields mean.

## Design direction
**Kind:** pattern group
**Members:** redesign-existing-projects, design-taste-frontend, high-end-visual-design, impeccable, frontend-design, ui-ux-pro-max
**Shared:** nothing kept in sync; each is maintained by someone else. Lessons that apply to all of them go to cross-cutting principles and, for this project, to `prompts/site-blueprint.md`.
**Member-specific:** everything; they are alternative approaches to the same job (choosing and applying a visual direction), not companions.

## Browser testing
**Kind:** pattern group
**Members:** webapp-testing, playwright-cli
**Shared:** nothing kept in sync; both are maintained elsewhere. Testing lessons go to cross-cutting principles and to the "Checks that count" line in `prompts/site-blueprint.md`.
**Member-specific:** webapp-testing is a Python recipe set; playwright-cli is a command reference for the CLI.

## Scroll and reveal animation
**Kind:** pattern group (added by the 2026-10-19 review, from #30)
**Members:** gsap-core, gsap-scrolltrigger, scroll-reveal-libraries
**Shared:** nothing kept in sync; gsap-* are GreenSock's, scroll-reveal-libraries is freshtechbro's (commit 85719a0). How content is hidden while it waits its turn (opacity and pointer-events, not `visibility: hidden` / `autoAlpha: 0`) goes to cross-cutting principles and `prompts/site-blueprint.md`.
**Member-specific:** gsap-core's `autoAlpha` advice stays right for UI that is truly gone; locomotive-scroll, motion-framer and the other gsap-* skills don't decide how content is hidden and are not members.

## Not in a group
- web-design-guidelines (Vercel, added 2026-10-13): fetches and applies one external guideline set to review UI code. It audits rather than choosing a direction, so it is not a design-direction member; checked 2026-10-19.
