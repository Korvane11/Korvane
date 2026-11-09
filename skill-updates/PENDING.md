# Staged updates awaiting install

Rewritten by the 2026-11-09 review so it lists only patches that are still
live. Apply each one from the repo root with `git apply -p1 <patch>` while
the live file's sha256 still matches the one recorded here; if it doesn't,
apply the added lines by hand.

## Pending

- `2026-11-09/_target-files/CLAUDE.md.patch` (+23 -6; live 29868 bytes,
  sha256 bd816a269625ad505720f5fad421a3b75c9114e56fab0e359ebf9eeb751434d4).
  Carries #28 (Plugins: no cloning or copying from any outside source),
  #33 (Task observer: the first tool call is one batch), #34 (Working
  rules: detached HEAD, confirm origin/main before saying it's pushed) and
  #35 (SimNow "Network" line as dated history plus a probe). Replaces the
  2026-10-19 and 2026-11-02 CLAUDE.md patches (removed; in git history).
- `2026-11-09/_target-files/prompts/site-blueprint.md.patch` (+9; live
  17422 bytes, sha256
  5d41bdd40bea7227a1035b2a59f30eed645f1a280286f7aebf1f1041e2045ddf).
  Blueprint v2 (2026-11-04) already carries most of the 2026-10-19
  blueprint patch. This adds the three points it lacks: the animatic as a
  contact sheet, checking that the action stays in view (#27); the
  `[hidden]` rule beside the hit-test check (#31); and test-script rules
  (#18). Replaces `2026-10-19/_target-files/prompts/site-blueprint.md.patch`
  (removed; in git history).
- `2026-10-19/_target-files/.claude/settings.json.patch` (+1 -1; live 747
  bytes, sha256
  4410b7f7a5c9a11de6c462a099460b3e538b7d2bd5d036ab4ed44c4fae808fcd).
  #33: the SessionStart hook's line names the whole first batch.
- `2026-10-19/_target-files/sites/eleven-cafe/render/render_all.sh.patch`
  (+4; live 554 bytes, sha256
  0ad51e6d0c28b7288b7e9ab09daaf1c169450ce7b7afd53c6b4ff1e8500b6c0f) and
  `2026-10-19/_target-files/sites/callahan-cleaning/render/render_all.sh.patch`
  (+4; live 768 bytes, sha256
  cda2955d3ecc99db8f8bf4e0d71a33d45af87d4f50220b97ba9b49196907a886).
  #25: each script writes `render.pid` and `done`. Apply only while no
  render is running.

Staged by the weekly reviews of 2026-10-19 and 2026-11-09 (scheduled runs
in session_016ffmjZpF4rUjxsqpdBpY7b). The 2026-10-19 items have now been
through four reviews uninstalled.

## Installed

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
