# Staged updates awaiting install

## 2026-10-19 (weekly review, scheduled run in session_016ffmjZpF4rUjxsqpdBpY7b)

State files staged as patches under `2026-10-19/_target-files/`. Each live
file's size and sha256 at staging is recorded; apply with
`git apply -p1 <patch>` from the repo root while the hash still matches,
otherwise apply the changed lines by hand.

- `prompts/site-blueprint.md.patch` (+41 -2; live 6770 bytes, sha256
  94f68eeb9de85addd2311fd03351c8b8be14b4c942290bcf2f4d6845c8aba677).
  #17 Facts: social-page-only sites; #24 the owner's words: save references,
  judge likeness side by side; #19 Build: video hand-over; #27 Build:
  contact sheet of an opening; #30 Build: waiting content hidden with
  opacity, not visibility/autoAlpha; #31 Build: `[hidden]` with a class
  that sets `display`; #25, #32 Build: offline renders (fit one waiter,
  resumable, PID file and done marker); #18, #19, #20, #30, #31 Checks:
  the channel a failure lives in, test-script rules.
- `CLAUDE.md.patch` (+13 -4; live 27862 bytes, sha256
  51bc985fffba1618c6c162812c4226d91b5dca7f209c7a2609deac4f79466990).
  #28 Plugins: no cloning or copying from any outside source, what to tell
  the owner instead; #33 Task observer: the first tool call is one batch
  (probe, Skill invocation, lookup).
- `.claude/settings.json.patch` (+1 -1; live 747 bytes, sha256
  4410b7f7a5c9a11de6c462a099460b3e538b7d2bd5d036ab4ed44c4fae808fcd).
  #33: the SessionStart hook's line names the whole first batch.
- `sites/eleven-cafe/render/render_all.sh.patch` (+4; live 554 bytes,
  sha256 0ad51e6d0c28b7288b7e9ab09daaf1c169450ce7b7afd53c6b4ff1e8500b6c0f)
  and `sites/callahan-cleaning/render/render_all.sh.patch` (+4; live 768
  bytes, sha256 cda2955d3ecc99db8f8bf4e0d71a33d45af87d4f50220b97ba9b49196907a886).
  #25: each script writes `render.pid` and `done`. Apply only while no
  render is running.

No skill bundles this round.

## Earlier

Installed 2026-10-13 (owner: "yes install"), each checked identical to its
staged copy after the copy:
- `2026-10-13/animation-styles` into `.claude/skills/animation-styles`
  (overflow check; plain Contents entries). Observation #12.
- `2026-10-13/_target-files/prompts/site-blueprint.md.*` into
  `prompts/site-blueprint.md` (live hash matched the staging hash first).
  Observations #2, #5, #6, #7, #9, #10, #11, #12, #13, #14.
- `2026-10-13/_target-files/.claude/settings.json.*` into
  `.claude/settings.json` (live hash matched first; valid JSON after).
  Observation #3.

The staged copies under `2026-10-13/` stay as the installed baseline
(keep-two rule).
