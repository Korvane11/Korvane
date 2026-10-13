# Staged updates awaiting install

Written by the task-observer review of 2026-10-13. Each entry leaves when it
is installed (or superseded); the next session's reconciliation gate checks.

## 2026-10-13/animation-styles (skill, our own)
- Bundle: `2026-10-13/animation-styles.skill` (46 files, validator gate passed)
- Changes: the phone overflow check in `scripts/check-demos.cjs` compares
  against `document.documentElement.clientWidth` (was `innerWidth`, which
  passed overflowing pages); SKILL.md step 5 says the same;
  `scripts/build-reference.py` writes plain Contents entries so the
  bundle validator accepts `references/styles.md` (regenerated).
- Proof: old checker passed a deliberately 700 px-wide demo, new checker
  failed it; all 20 real demos pass the new checker.
- Observations: #12.
- Install: replace `.claude/skills/animation-styles/` with the staged copy.

## 2026-10-13/_target-files/prompts/site-blueprint.md.patch (state file)
- Live file at staging: 4604 bytes, sha256
  c86cfdf331bb07a39502c310738c90b8df37e0c1edffe37bd78b864882d6af70
- Adds 35 lines: facts when the site can't be opened (#7), carry over only
  what works and is theirs to move (#14), the brief as beats (#5), keep
  what they approved (#13), check the asset against the reference (#2),
  their logo is theirs (#10), intros start on the first frame (#9),
  previews from the shared address (#11), checks that count (#6, #12).
- Install: hash unchanged, so apply the patch (`patch -p0` from the repo
  root, or copy `site-blueprint.md.new` over the live file).

## 2026-10-13/_target-files/.claude/settings.json.patch (state file)
- Live file at staging: 425 bytes, sha256
  15ac7ceeb5d0ed54859aa68212979f503cd711dce3356fbe504c617693911fa1
- Adds a second SessionStart hook that prints the task-observer reminder
  into every new or resumed session (#3). Nine added lines, none removed;
  the new file parses as JSON and the command was pipe-tested.
- Install: hash unchanged, so apply the patch. Approved by the owner on
  2026-10-13 ("approve all").
