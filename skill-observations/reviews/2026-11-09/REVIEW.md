# Skill review, 2026-11-09

Scheduled run (Routine `weekly-skill-review`, autonomous mode).
task-observer 3.6.0. Main pulled up to cc9e4eb. New since the last review:
site blueprint v2 (2026-11-04), the `business/` toolkit (Lead Desk,
playbook, templates), a CLAUDE.md update, and observation #35.

## Weekly Skill Review Complete — 2026-11-09

Updated (1 observation, 0 principles): no skill edited.

**CLAUDE.md** (staged as a patch,
`skill-updates/2026-11-09/_target-files/CLAUDE.md.patch`, +23 -6): #35.
The SimNow "Network" line becomes dated history plus a curl probe and a
fallback. CLAUDE.md changed again this week, so the earlier pending
CLAUDE.md changes (#28, #33, #34) were rebuilt on the current file and
carried in this one patch. The 2026-11-02 patch was removed.

**prompts/site-blueprint.md** (staged as a patch,
`skill-updates/2026-11-09/_target-files/prompts/site-blueprint.md.patch`,
+9): blueprint v2 replaced the file, so the 2026-10-19 patch no longer
applied. Checked point by point, v2 already carries #17 (Facebook-only
sites, line 59), #24 (likeness gate, line 157), #25 and #32 (pid file, done
marker, waiter, no `pgrep -f`, lines 172-176), #19 (no black frame at the
handover, lines 178, 270), #30 (accessibility tree, line 266) and #20
(`behavior: 'instant'`, line 276). The new patch adds the three points v2
lacks:
- #27: the animatic checked as a contact sheet, with the action in view
  and the angle compared against the reference;
- #31: the `[hidden]` rule next to the hit-test check;
- #18: test-script rules (page errors fail the run, wait for `<html>`,
  record an end only after its start).

The 2026-10-19 blueprint patch was removed.

Both patches pass `git apply --check -p1` against live. Hashes are in
`skill-updates/PENDING.md`, which was rewritten to list only what is still
pending.

### Observations Actioned
- #35 CLAUDE.md states the network level as a fact

### Still awaiting install (fourth review for the 2026-10-19 items)
`2026-10-19/.../.claude/settings.json.patch` (#33) and the two
`render_all.sh` patches (#25). Their live files are unchanged, so each
applies as is. Plus this week's two patches.

### Family coherence
Unchanged. 0 observations logged without a sibling check.

### Published skills
None.

### Parked
None.

### Arrived during this run
None.

### Log integrity
No duplicate ids. The id floor (35) matches the highest prefix. 15 active
files, 15 parsed. Archive: #34 had already been moved by the session that
logged #35. Inbox not read: no user-scoped memory store exists here.

### Skipped (needs manual review)
None.

0 bundles staged, 0 bundles presented

---

## Decisions for you

1. **Install the staged patches** (`skill-updates/PENDING.md` lists five:
   CLAUDE.md, the blueprint, settings.json and two render scripts). The
   oldest have waited four weeks. The CLAUDE.md patch has had to be
   rebuilt twice because the file kept moving while it waited.
2. **Build the `scroll-film-renders` skill?** Blueprint v2 now holds the
   render pipeline's outline (gates, budgets, encode ladder). That leaves
   the skill the render-specific detail: depth of field and soft-shadow
   traps, translucent layers, clip cleaning, snapshotting inputs (#1, #2,
   #8, #9, #19, #21, #22, #23, #24, #26, #27, #29). Recommended: build it,
   or decide the blueprint is enough and close the 12 entries.
3. **Upstream reports for task-observer, #15 and #16?** Recommended: draft
   them for you to send.
