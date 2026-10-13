# Skill review, 2026-10-13: decision list (awaiting approval)

First review of this log. 14 open observations, all read in full. Nothing
has been changed in any skill or project file yet: the items below are
proposals, waiting for the owner's approval.

## How the targets were classified (Step 2)

Most observations name skills someone else maintains, and a local edit to
those would be lost the next time they are updated:

| Skill | Maintained by | Route |
| --- | --- | --- |
| redesign-existing-projects, design-taste-frontend | Taste Skill author (installed in 644b994) | not edited; lesson goes to our own files; upstream report optional |
| webapp-testing | Anthropic | same |
| playwright-cli | Microsoft | same |
| design | claudekit | same |
| task-observer | rebelytics | same |
| animation-styles | us (Korvane) | staged copy, normal route |
| `prompts/site-blueprint.md`, `CLAUDE.md`, `.claude/settings.json` | us | staged as a patch |

`prompts/site-blueprint.md` is the brief every new client site starts from
(CLAUDE.md points to it), so it is where most site-building lessons will
actually be read.

## Already done (close them)

- **#4** Permission to use an asset is not a brief. Already in the
  blueprint: "Material they sent to show their taste is not material for
  the site unless they say so. Ask when it's unclear." Close.

## Decision 1: add the site-building lessons to the blueprint (one patch)

Target: `prompts/site-blueprint.md`. Each line below is a short addition;
the full patch is shown before it is applied.

| # | Observation | What the blueprint gains |
| --- | --- | --- |
| 5 | A medium swap dropped a beat of the brief | List the owner's experience as numbered beats in their words, and re-check each beat in a browser after any change underneath (new clip, new structure) |
| 13 | A restructure reworked the approved opening | Before a redesign, list what the owner has already seen and approved; keep those as they are unless the request names them; report each as unchanged or changed |
| 14 | Old site's photos were platform stock; its booking was dead | "Carry over everything" becomes "everything that works and is theirs to move": check where each photo, video and font came from, run each booking/form flow end to end, list what can't move and what replaced it |
| 7 | Asked the owner to change settings before trying search (remainder) | If their site can't be opened, try search and archives before asking the owner to change anything; render client-side sites in a browser |
| 9 | Intro waited for the whole clip, with chrome nobody asked for | An intro starts on the first frame the browser can play, falls back to a still after 2 to 3 s, and carries no loader, label or skip button unless the brief asks |
| 11 | Share tags present but broken (remainder) | Check the preview from the address people actually share, following redirects |
| 6, 12 | Screenshot-only tests; a vacuous overflow check | Browser checks: hit-test every main control at phone and desktop width, screenshots too; overflow compares against `clientWidth`; mailto forms read from Playwright's `request` event; a check counts once it has been seen failing |
| 10 | Logo refinement had no procedure | Their logo is theirs: present it better (size, resolution, a small variant) before changing it; redesigning it is the owner's call |
| 2 | Long render started on the wrong car | When the brief names a specific real object, check the asset against their reference before any long build, and ask for the exact asset first |

Verification: the patched blueprint read back in full; each line traced to
its observation; nothing in it contradicts CLAUDE.md.

## Decision 2: fix our animation-styles checker

- **#12** `scripts/check-demos.cjs` line 60 tests `scrollWidth > innerWidth`,
  which passes an overflowing page under phone emulation. Change it to
  compare with `document.documentElement.clientWidth` and fail when
  `innerWidth` differs from it. Staged as a full copy of the skill.
  Verification: rerun all 20 demos; confirm the new check fails on a demo
  copy made deliberately too wide.

## Decision 3 (needs your input): a session-start reminder hook

- **#3** Twice, a resumed session made tool calls before task-observer was
  started. Proposed: add a SessionStart hook to `.claude/settings.json`
  that prints the reminder into every new or resumed session. An earlier
  attempt by the agent alone was refused as self-modification, so this one
  needs your explicit yes; staged as a patch.

## Decision 4 (needs your input): a new skill for cinematic backgrounds

- **#1, #2, #8, #9** (and part of **#5**) all argue for one new skill,
  working name `scroll-film-renders`: when to pre-render instead of
  real-time 3D, the Blender pipeline and its speed settings, checking the
  asset against the reference, turning a social clip into a background
  (end card, watermark, rotation), and starting an intro on the first
  frame. The material exists in `sites/simnow/render/` and its README.
  Options: build it now, as its own task, with skill-creator; or park it
  until the next site needs a video or rendered background.

## Decision 5 (needs your input): reports to the skills' authors

The lessons in Decision 1 also apply to skills others maintain
(redesign-existing-projects #4 #5 #7 #11 #13 #14; design-taste-frontend
#4 #5 #7 #14; webapp-testing and playwright-cli #6 #12; design #10;
task-observer #3). Options: draft upstream issues later (each needs a
duplicate search first), or leave it, since the blueprint carries the
lessons for this project. Recommended: leave it for now.

## Decision 6: the review's own files (written directly)

- `cross-cutting-principles.md` gets three principles drawn from the log:
  1. A check counts once it has been seen failing on a broken case
     (#6, #11, #12).
  2. The brief is satisfied by the build: name what delivers each beat the
     owner asked for, re-prove it after any change underneath, and keep
     what they approved (#5, #9, #13).
  3. Before building on an asset or a flow, confirm its role, that it is
     yours to move, and that it works (#2, #4, #14).
- `skill-families.md`, first draft: design direction
  (redesign-existing-projects, design-taste-frontend, high-end-visual-design,
  impeccable, frontend-design, ui-ux-pro-max) and browser testing
  (webapp-testing, playwright-cli).
- `activation-tiers.txt`: CLAUDE.md activation block present; the
  SessionStart hook installs playwright-cli only and carries no
  task-observer reminder.

## Scheduling

No scheduled review exists. This environment can run Routines in fresh
cloud sessions, and the log lives in the git repository, so a weekly review
could run on its own and push its staged results. Offered, not set up.

## Log integrity

- 14 files, 14 open, 0 parked, 0 resolved; no duplicate ids; the id floor
  (14) matches the highest file; 0 non-conforming headers.
- All 14 carry `siblings_checked`; `skill:` names are all bare.
- Inbox not read: no user-scoped memory store exists in this environment.
