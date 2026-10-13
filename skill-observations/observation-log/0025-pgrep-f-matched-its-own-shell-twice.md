---
id: 25
title: "Waiting on a background render by a PID from pgrep -f returned at once, twice in one session: the pattern also appeared in the tool call's own shell command, so pgrep found that shell, which exited; the lesson lived only in a conversation summary"
status: open
type: open-source
skill: []
proposes_skill: [scroll-film-renders]
target_file: ["sites/eleven-cafe/render/render_all.sh"]
siblings_checked: "reuses the open candidate scroll-film-renders (long offline renders run in the background and waited on); no installed skill covers running or waiting on long jobs; the render script named in target_file, where a PID file would remove the step; checked"
area: "Starting and waiting on long background jobs (offline renders) from the agent's shell"
date: 2026-10-13
session_context: "Eleven Cafē site: full renders of the opening scene (about 70 minutes) started in the background, with a background waiter that reports when they end"
parked_until:
resolved:
resolution:
reference: "the session's render logs lived in the scratchpad; the lesson from the first time is in this session's compaction summary only"
commands_verified: "run: `nohup bash render_all.sh DIR &` then `pgrep -f \"bash render_all.sh\" | head -1` in the same tool call printed 13937; the waiter `while kill -0 13937` returned within minutes while `ps` showed the render as PID 13944 (parent 13940), still on frame 3 of 103. run: `$!` right after the background start (the first render this session) gave the right PID"
---

**Issue:** A render was started with `nohup bash render_all.sh DIR &`, and
its PID taken with `pgrep -f "bash render_all.sh"` in the same tool call.
That tool call's own shell had the whole command line, pattern included, so
pgrep's first match was the shell, not the render. The waiter
(`while kill -0 PID; do sleep 60; done`) reported "done" as soon as that
shell exited. The same thing happened earlier in the session, and its fix
(use `kill -0` on the real PID) was written only into the conversation
summary, so it was not in front of the next attempt.

**Suggested improvement:**

- Structural (this is the second occurrence): `render_all.sh` writes its
  own PID (`echo $$ > "$OUT/render.pid"`) and its end (`touch
  "$OUT/done"`), and waiters read those, so no step needs a process search.
  Make that change when no render is running (bash reads a running script
  as it goes).
- Candidate skill, under running long renders: take the PID from `$!` on
  the line that starts the job, or from a PID file the job writes; never
  from `pgrep -f` with a pattern that the calling command line also
  contains. A waiter that ends within minutes of a job expected to run an
  hour is a broken waiter until the log says otherwise.

**Principle:** A search for a process by its command line matches every
process whose command line contains the pattern, including the one doing
the searching. Get the identity of a job from the act that started it, not
from a search afterwards.
