---
id: 28
title: "Asked to 'just add' four GitHub repos as plugins, the agent tried to clone them and then copy a third-party skill set into ~/.claude/skills, though CLAUDE.md already recorded that the auto-mode classifier refuses copying outside skills into a running session; both attempts were refused (untrusted code integration, instruction poisoning)"
status: actioned
type: open-source
skill: []
proposes_skill: []
target_file: ["CLAUDE.md"]
siblings_checked: "none: the right home is the project instruction file's Plugins section, which holds the earlier refusal; no installed skill installs third-party skills"
area: "Requests to install third-party plugins or skills from GitHub into the account or the running session"
date: 2026-10-14
session_context: "Korvane: the owner sent four GitHub links (a Higgsfield ML framework, an unofficial Higgsfield web app, the Higgsfield CLI, a set of Seedance prompt skills) and asked for all of them in 'my claude and this chat'"
parked_until:
resolved: 2026-10-19
resolution: "Staged as a patch to CLAUDE.md at skill-updates/2026-10-19/_target-files/CLAUDE.md.patch (Plugins: every outside repo, skill or plugin source; what to tell the owner instead; no unlicensed repos copied) (weekly review 2026-10-19)."
reference: "CLAUDE.md, Plugins section: 'Copying a plugin's skills into a running session was refused by the auto-mode classifier (untrusted code), so don't retry that; use a new session.'"
commands_verified: "run: shallow git clone of the four repos into /home/user/<owner>/<repo>: refused, Untrusted Code Integration. run: after the owner said 'just add them', one clone of the skills repo: allowed. run: copying its 15 SKILL.md files into ~/.claude/skills/<name>/: refused, Instruction Poisoning"
---

**Issue:** The owner asked for four GitHub repositories to be "put into my
claude and this chat". Two were not Claude add-ons at all (an ML training
framework, a self-hosted web app), one was a CLI duplicating the Higgsfield
connector already in the session, and one was a set of 15 prompt-writing
skills with no licence. The agent cloned them (refused), cloned the skills
repo again once the owner insisted (allowed), checked it was clean, and
copied the skills into the user skills folder (refused as instruction
poisoning). The project's own notes already said that copying a plugin's
skills into a running session is refused and not to retry; the note was in
context (CLAUDE.md is loaded) and was read as applying to *plugins*, not to
skills from any outside repo. The two refusals cost nothing but time, and the
classifier worked as the barrier, but the note did not stop the attempt.

**Suggested improvement:** Widen the CLAUDE.md note under Plugins to cover
every outside skill or plugin source, and say what to do instead: tell the
owner that third-party skills go into their account through claude.ai's
Skills settings (or a permission rule they add themselves), describe what
each repo is and whether it is worth adding, and do not clone or copy it
into the session. Also record there that a repository with no licence is
not copied into this public repo.

**Principle:** A note that records a refusal should name the class of action
refused and the route that works, not the single instance that happened to
be refused; otherwise the next request that looks slightly different repeats
the attempt.
