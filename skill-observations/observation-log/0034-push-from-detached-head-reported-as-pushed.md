---
id: 34
title: "A push from a detached HEAD sent nothing, and the session reported the work as pushed"
status: actioned
type: open-source
skill: []
proposes_skill: []
target_file: [CLAUDE.md]
siblings_checked: "none: the fix belongs in the project instructions (Working rules), not a skill"
area: "Committing and pushing to main from a fresh cloud checkout"
date: 2026-10-29
session_context: "Writing prompts/cold-call-script.md; the clone started on a detached HEAD at origin/main"
parked_until:
resolved: 2026-11-02
resolution: "Staged as a patch to CLAUDE.md at skill-updates/2026-11-02/_target-files/CLAUDE.md.patch (Working rules: git status -sb and checkout -B main on a detached HEAD; confirm git log origin/main -1 before reporting pushed) (weekly review 2026-11-02)."
reference:
commands_verified: "run: git push -q -u origin main from a detached HEAD: exit 0, no output, origin/main unchanged (local main was the old tip). run: git push origin HEAD:main: pushed both commits"
---

**Issue:** The cloud clone started on a detached HEAD. I committed and ran `git push -u origin main`, which pushed the local `main` branch (already at origin's tip), not the new commit. It printed nothing and exited 0, and I told the owner the script was "pushed to main". The stop hook caught the leftover uncommitted file; only then did `git status -sb` show `HEAD (no branch)`.

**Suggested improvement:** In CLAUDE.md Working rules: before the first commit, run `git status -sb`; if it shows no branch, `git checkout -B main`. After pushing, confirm with `git log origin/main -1` that the remote tip is the new commit before reporting it pushed.

**Principle:** A push exiting cleanly is not evidence that the commit reached the remote. Verify the remote ref names your commit before saying it is pushed.
