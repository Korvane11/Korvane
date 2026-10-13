---
id: 3
title: "Tool calls made in a new session before the task-observer Session Start Protocol ran"
status: actioned
type: open-source
skill: [task-observer]
proposes_skill: []
target_file: [".claude/settings.json"]
siblings_checked: "no family registry yet; task-observer has no installed siblings in this project — checked, instance-specific to its activation"
area: "activation: session start in resumed cloud sessions"
date: 2026-10-12
session_context: "SimNow site: a resumed cloud session (instruction files re-read) where the owner asked whether GitHub Pages was live"
parked_until:
resolved: 2026-10-13
resolution: "Staged a SessionStart reminder hook for .claude/settings.json at skill-updates/2026-10-13/_target-files/.claude/settings.json.patch (owner approved 2026-10-13). task-observer: not edited, foreign-maintained (rebelytics)."
reference:
commands_verified: "none"
---

**Issue:** The harness re-read the instruction files and announced a new
session, and the project CLAUDE.md says to invoke task-observer and run its
Session Start Protocol before the first tool call of any session. The next
two turns were short status questions ("Now what", "Does it work now") and
were answered with GitHub API calls (workflow-run listings) without loading
the skill first; the protocol only ran a turn later. Protection in play:
written rule, loaded into context through CLAUDE.md, no hook. Short,
question-shaped turns in the middle of a long conversation read as "same
session", which is exactly the misclassification the activation block warns
about. A SessionStart hook that injects the reminder was attempted at install
time and refused by the permission classifier as self-modification, so the
only layer left was the written rule.

**Suggested improvement:** Make the reminder structural: a SessionStart hook
(owner-approved, since an agent-written one was refused) that injects
"invoke task-observer before the first tool call" as additionalContext on
every session start, including resumes. Until then, treat any "instruction
files were re-read when this session started" notice as the session start.

**Principle:** A rule keyed to "the first tool call of a session" fails when
the session boundary is invisible from inside the conversation; tie it to the
harness's own session-start signal, and enforce it with that signal rather
than with memory.
