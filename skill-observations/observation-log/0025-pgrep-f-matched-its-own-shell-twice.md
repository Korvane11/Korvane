---
id: 25
title: "Waiting on a background render by a PID from pgrep -f returned at once, twice in one session, a third time (2026-10-14) pgrep -f said a finished render was still running, and a fourth time (2026-10-14, Pour My Coffee Co) pkill -f killed the tool call's own shell instead of only the render: the pattern also appeared in the tool call's own shell command, so pgrep found that shell; the lesson lived only in a conversation summary and this log"
status: open
type: open-source
skill: []
proposes_skill: [scroll-film-renders]
target_file: ["sites/eleven-cafe/render/render_all.sh"]
siblings_checked: "reuses the open candidate scroll-film-renders (long offline renders run in the background and waited on); no installed skill covers running or waiting on long jobs; the render script named in target_file, where a PID file would remove the step; checked"
area: "Starting and waiting on long background jobs (offline renders) from the agent's shell"
date: 2026-10-13
session_context: "Pour My Coffee Co site, 2026-10-14: stopping a running render to change its shader; Eleven Cafē site: full renders of the opening scene (about 70 minutes) started in the background, with a background waiter that reports when they end; 2026-10-14, the phin loop's render (render_phin.cjs), checked after its last frame"
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

**Again, 2026-10-14 (the other direction):** after the phin loop's last frame
was written, `pgrep -f "render_phin.cjs" >/dev/null && echo "still running"`
printed "still running": the tool call's own shell held the pattern in its
command line. The render had exited. It did no harm, because the frames were
counted directly (96 of 96). Waiting on a file the job writes last, or on a log
line ("ALL FRAMES DONE"), was right both times it was used this session. The
same false positive would keep a waiter looping forever.

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

**Fourth instance (2026-10-14, Pour My Coffee Co).** To stop a running
render, one tool call ran `pkill -f render_all.sh; pkill -f
render_pour.cjs; ...` followed by the shader edit and a test render. The
tool call's own shell had `render_all.sh` in its command line, so the first
`pkill` killed that shell (exit 144): the render kept running and the edit
never happened. Recovered by listing with `pgrep -fa "node .*render_pour"`
(the listing showed the shell too), then `kill` with the exact PIDs. The
structural fix above (a PID file written by the job) would have made it
`kill $(cat "$OUT/render.pid")`; the Pour render scripts were written in
this session without it, so the barrier still lives only here.

