---
id: 29
title: "A two-hour offline render read its scene file from the git working tree, stage by stage, while the same session committed other work: a git stash (to rebase before a push) put the committed scene file back for a moment, so a stage starting then would have rendered the old scene; the running bash driver script is unsafe to edit for the same reason"
status: open
type: open-source
skill: []
proposes_skill: [scroll-film-renders]
target_file: []
siblings_checked: "reuses the open candidate scroll-film-renders (0001, 0002, 0005, 0008, 0009, 0019, 0021-0027); related to 0025 (waiting on a background render) but a different failure: the render's inputs changing under it, not the wait; no installed skill runs long offline renders; checked, new-skill material"
area: "Long offline render jobs run alongside other commits in the same checkout"
date: 2026-10-14
session_context: "Eleven Cafē site: the pour was re-rendering (four stages, about two hours) from render/pour.html while the blueprint changes to the pages were committed and pushed from the same checkout"
parked_until:
resolved:
resolution:
reference: "sites/eleven-cafe/render/render_all.sh (one node process per stage, each loading render/pour.html when it starts)"
commands_verified: "run: git pull --rebase with pour.html modified: refused (unstaged changes). run: git stash, git pull --rebase, git stash pop: completed in about a second, during the first stage, so no stage started in the window; not reproduced on purpose"
---

**Issue:** The opening scene renders in four stages, each a new browser
process that loads the scene file from the working tree when it starts. The
scene file had uncommitted changes, which were the very changes being
rendered. Meanwhile the session committed and pushed page changes from the
same checkout. To rebase before the push, it ran `git stash` / `pull
--rebase` / `stash pop`, which put the committed (old) scene file back for
about a second. The first stage was mid-way, so nothing reloaded in that
window. A stage starting in it would have rendered half the footage from the
old scene, with nothing to show for it until the frames were compared. The
same holds for the driver script: bash reads a running script as it goes, so
an edit to `render_all.sh` mid-run can change or break the stages still to
come.

**Suggested improvement:** For the candidate skill (render pipeline): before
a long render, snapshot its inputs into the output directory (the scene file,
the driver and the stage commands) and render from the snapshot. That also
records exactly what produced the frames. Don't edit the driver while it runs.
When other work has to be committed during a render, commit only that work.
Push without a stash when the remote hasn't moved (`git fetch`, compare,
push). If it has moved, rebase with the render's inputs already committed or
snapshotted.

**Principle:** A long job should read inputs that nothing else can change
while it runs. A shared working tree is not such a place: every git operation
that rewrites files rewrites the job's inputs too. Copy them first, and the
copy also documents what produced the result.
