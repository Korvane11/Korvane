---
id: 33
title: "The SessionStart hook's line names the skill load but not the workspace probe, so a session's first batch carried the load and lookup without the probe (2026-10-13, the routine's own session); the pre-skill tier must name the whole first batch"
status: actioned
type: open-source
skill: []
proposes_skill: []
target_file: [".claude/settings.json", "CLAUDE.md"]
siblings_checked: "none: the fix belongs in this project's activation config (the hook's echo line and the CLAUDE.md block), not in a skill; task-observer already states the rule (references/environments.md, 'The probe rides inside the first batched call') and is maintained upstream"
area: "activation: the pre-skill tier's wording"
date: 2026-10-19
session_context: "Weekly skill review (scheduled), Step 1 activation regression check; the instance is the same session's first turn on 2026-10-13"
parked_until:
resolved: 2026-10-19
resolution: "Staged as patches at skill-updates/2026-10-19/_target-files/.claude/settings.json.patch (the hook's echo names the whole first batch) and skill-updates/2026-10-19/_target-files/CLAUDE.md.patch (Task observer block, same sentence) (weekly review 2026-10-19)."
reference:
commands_verified: "run: read .claude/settings.json, second SessionStart group: echo 'Session start (new or resumed): before any other tool call, invoke the task-observer skill and run its Session Start Protocol, as CLAUDE.md (Task observer) says.' (no probe named). The 2026-10-13 first batch (this session's transcript): Skill task-observer + skill-load.sh; the ls of skill-observations came in the second batch"
---

**Issue:** The project's hook injects "before any other tool call, invoke
the task-observer skill and run its Session Start Protocol". It names the
load and not the probe. On 2026-10-13 this session's first batch was the
Skill call plus its `skill-load.sh` lookup; the `ls` of
`skill-observations/` came a batch later. No harm that time (the
repository was there), which is the only case where the slip shows.
task-observer's `references/environments.md` ("The probe rides inside the
first batched call") says the pre-skill tier's line must name the whole
first batch: the probe AND the skill loads, in one call. The scheduled
prompt does this correctly (probe, marker, then invoke); the hook and the
CLAUDE.md block do not.

**Suggested improvement:** Reword the hook's echo line and add one sentence
to the CLAUDE.md "Task observer" block: the first tool call is one batch
holding `ls /home/user/Korvane/skill-observations`, the task-observer
Skill invocation and its `skill-load.sh` lookup. Staged as patches (the
owner installs settings.json changes).

**Principle:** A line read before any skill has loaded must carry the whole
first action, not only the part it was written for: a rule that lives only
inside the skill cannot fire on the call that loads the skill.
