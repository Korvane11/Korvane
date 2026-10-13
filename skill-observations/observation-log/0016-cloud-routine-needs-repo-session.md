---
id: 16
title: "Claude Code on the web: a Routine that starts a fresh session per firing gets no repository, so a review whose workspace lives in the repo would skip every week; the environment table has no row for this setup"
status: open
type: open-source
skill: [task-observer]
proposes_skill: []
target_file: [".claude/skills/task-observer/references/environments.md"]
siblings_checked: "no family registry entry for task-observer; the environment table and 'The access grant is part of the task definition' live only in references/environments.md (read); no other installed skill registers scheduled work; checked, instance-specific to task-observer's setup guidance"
area: "references/environments.md: the environment table (Scheduled review row) and 'The access grant is part of the task definition'"
date: 2026-10-13
session_context: "First skill review: registering the weekly review as a Claude Code on the web Routine, with the observation log kept in the git repository"
parked_until:
resolved:
resolution:
reference: "skill-observations/scheduler-registered.txt"
commands_verified: "run: create_trigger with create_new_session_on_fire returned a session_request whose config.sources was []; get_session on the calling session showed its repository under session_context.sources (session-level, not environment-level); the Routine was recreated with persistent_session_id pointing at a session created with source_url, and that session listed the workspace and saw main at the latest commit"
---

**Issue:** The workspace for this install is the git repository itself
(the container is ephemeral). The first Routine was created to start a
fresh session on each firing. Its stored session request had no sources:
the repository the calling session works in is attached to that session,
not to the environment, so fresh sessions would start empty, find no
`skill-observations/`, and skip with "workspace offline" every week. That
would look like a transient outage, and no firing would heal it. The
skill's guidance already says the access grant belongs to the task
definition and must be verified from inside the task's own context. That
guidance is what caught it, but the environment table has no row saying
how this setup provides the grant.

**Suggested improvement:** Add a row for Claude Code on the web (cloud
Routines) to the environment table in `references/environments.md`:
- **Workspace:** the git repository, attached per session.
- **Scheduled review:** a Routine that fires into a persistent session
  created with the repository as its source. A fresh session per firing
  starts without it.
- **Verify:** have that session list the workspace once from inside its
  own container before writing `scheduler-registered.txt`.
- **Prompt:** start each run with `git pull --rebase` after committing any
  leftovers, and end it with a commit and push. Otherwise the review's
  writes are lost with the container, and a leftover change can block the
  next pull.

**Principle:** A scheduled job inherits only what its definition carries.
Name, in the setup step, what the job needs that the interactive session
had for free, such as the repository or credentials, and prove it from
inside the job's own context before trusting the schedule.
