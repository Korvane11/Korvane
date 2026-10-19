# Skill review, 2026-10-19

Scheduled run (Routine `weekly-skill-review`, autonomous mode). Nobody was
present, so the approval policy for unattended runs applied: everything
that didn't need a decision from the owner was staged, and the rest is
listed under "Decisions for you" below. Nothing has gone live: every change
is a staged patch, waiting for the owner to install it.

task-observer 3.6.0. Main pulled at the start of the run (up to 683eba7).

## Weekly Skill Review Complete — 2026-10-19

Updated (9 observations, 1 principle added): no skill was edited. Every
target skill is maintained by someone else, and the owner's standing route
(review 2026-10-13, Decision 5) sends those lessons to our own files.

**prompts/site-blueprint.md** (staged as a patch, +41 -2): Facts: a business
whose only site is a social page (#17); the owner's words: save references,
judge likeness side by side (#24); Build: video hand-over (#19), a contact
sheet of an opening (#27), waiting content hidden with opacity rather than
`visibility`/`autoAlpha` (#30), `[hidden]` against a class that sets
`display` (#31), offline renders that fit one waiter, resume, and write a
PID file and a done marker (#25, #32); Checks: check through the channel a
failure lives in, plus rules for test scripts (#18, #19, #20, #30, #31).

**CLAUDE.md** (staged as a patch, +13 -4): Plugins: no cloning or copying
from any outside source, and what to tell the owner instead (#28). Task
observer: the first tool call is one batch holding the probe, the Skill
invocation and its lookup (#33).

**.claude/settings.json** (staged as a patch, +1 -1): the SessionStart
hook's line names that whole first batch (#33).

**sites/eleven-cafe/render/render_all.sh** and
**sites/callahan-cleaning/render/render_all.sh** (staged as patches, +4
each): each writes `render.pid` and `done`, so no waiter needs `pgrep -f`
(#25). Pour's Blender script already did. Apply only while no render runs.

**Workspace files written directly:** `cross-cutting-principles.md`
(principle 4 added: check through the channel the failure lives in, from
#8, #19, #20, #24, #30, #31); `skill-families.md` (new pattern group
"Scroll and reveal animation": gsap-core, gsap-scrolltrigger,
scroll-reveal-libraries; web-design-guidelines recorded as in no group);
`activation-tiers.txt` (this run's tiers); `skill-updates/PENDING.md`
(this round's entry, with hashes).

Verification: each patch passes `git apply --check -p1` against the live
file; the live file's size and sha256 are in PENDING.md. Both scripts pass
`bash -n`; settings.json parses as JSON. Facts checked before promotion:
gsap-core's `autoAlpha` advice (SKILL.md lines 85, 242) sets `visibility:
hidden` at 0; the Facebook behaviour (#17) can't be re-checked from here
without a fresh visit, so the blueprint carries it with its date ("seen
October 2026").

### Observations Actioned
- #17 A business whose only site is a Facebook page
- #18 An init-script tracker that ran before `<html>` existed
- #20 Smooth scrolling hid scroll reveals in screenshots
- #25 Waiting on a render through `pgrep -f`
- #28 Retried installing outside skills despite the note
- #30 Waiting content hidden from screen readers with `visibility: hidden`
- #31 A `hidden` menu brought back by `display: flex`
- #32 An idle container killed a long render
- #33 The hook's line names the load, not the probe (logged by this review)

### Family coherence
- #17 (redesign-existing-projects), #18 and #20 (webapp-testing,
  playwright-cli), #30 (gsap-core, gsap-scrolltrigger,
  scroll-reveal-libraries): none of those skills was edited, because each
  is maintained upstream (Taste Skill author, Anthropic, Microsoft,
  GreenSock, freshtechbro). Each entry's resolution names that and where
  the lesson went.
- #19, #24, #27: the blueprint now carries their general parts; they stay
  OPEN as members of the scroll-film-renders decision below, as #2 and #9
  did last week.
- Drift audit: nothing to audit. The three groups are pattern groups with
  nothing kept in sync. web-design-guidelines (new since the last review)
  was checked and belongs to no group.
- 0 observations logged without a sibling check. Exclusions marked
  `assumed`: 10 entries (#17, #18, #19, #21, #22, #23, #24, #26, #30, #31).
  Because none of the excluded siblings was edited, none of those
  exclusions changed what was staged. The one that matters, gsap-core's
  `autoAlpha` advice, was opened and confirmed.

### Published skills
None published from this repository.

### Parked
None.

### Arrived during this run
- #33, logged by this review (Step 1 activation check). It targets
  CLAUDE.md and settings.json, both staged this run, so it was folded in
  and actioned.

### Log integrity
No duplicate ids. The id floor matches the highest prefix (32 at Step 1,
33 after #33). 0 non-conforming headers (first measured run 2026-10-13:
0 hits; this run 0 hits, 0 true defects, 0 normalised). 23 files, 23
parsed. All `skill:` names are bare, with no plugin-qualified ones. Inbox
not read: no user-scoped memory store exists in this environment. The
archive sweep moved nothing: nothing was resolved before today.
Confidentiality: the open-source entries name clients (SimNow, Eleven Cafē,
Pour My Coffee Co) in Issue fields only. The log lives in the same public
repository as those clients' sites, so nothing was stripped. Every
Principle line is generic.

### Skipped (needs manual review)
None skipped. Two decisions are escalated (below).

0 bundles staged, 0 bundles presented

---

## Decisions for you

### 1. Build the `scroll-film-renders` skill? (new skill: a review can't create one)
Members: #1, #2, #8, #9, #19, #21, #22, #23, #24, #26, #27, #29 (12
entries, up from 4 last week).

They all describe one job: making cinematic background footage for a site,
either rendered (Blender, raymarched WebGL) or adapted from a supplied
clip. The material they cover: when to pre-render instead of using
real-time 3D; Blender speed settings; checking the asset and the framing
against the reference; turning a social clip into a background; depth of
field and soft-shadow traps in offline renders; translucent layers; video
hand-overs; snapshotting a render's inputs. Four sites now use this
(SimNow, Eleven Cafē, Callahan Cleaning, Pour My Coffee Co), and the
scripts and READMEs under each site's `render/` are the source material.
No such skill exists in `.claude/skills/` or `~/.claude/skills/`.

Recommended: build it as its own task with skill-creator, starting from
these 12 entries and the four `render/` folders. The other option is to
leave the lessons in the blueprint alone, accepting that the render-specific
detail (#21, #22, #23, #26, #29) has no home there.

### 2. Upstream reports for task-observer (#15, #16)
- #15: the bundle validator rejects Markdown link entries in a Contents
  index. We worked around it by writing plain entries.
- #16: the environment table needs a row for Claude Code on the web cloud
  Routines. The repository is attached per session, so a Routine must fire
  into a fixed session. Supporting this, on 2026-10-13 the session-start
  scripts left two uncommitted checkpoint lines, which a later
  `git pull --rebase` would have refused to run over. That is #16's
  "commit leftovers first" point.

task-observer is maintained by rebelytics, so editing it here would be
lost at the next update. Last week you chose not to send upstream reports
for now. Options: draft both as GitHub issues for you to send (each needs
a duplicate search first), or close both as declined. Recommended: draft
them. Both are small, concrete and easy for the maintainer to act on.

## Next steps
1. **Install this week's patches.** Problem: the lessons above aren't live
   until they are. Change: from the repo root, run
   `git apply -p1 skill-updates/2026-10-19/_target-files/<file>.patch` for
   each patch listed in PENDING.md (the render-script ones only while no
   render runs). Verify: `git diff --stat` shows the five files, and
   PENDING.md's hashes matched before applying.
2. **Decision 1** (the render skill).
3. **Decision 2** (the task-observer reports).
