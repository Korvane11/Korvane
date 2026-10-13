# Where this skill came from

- `SKILL.md`: Vercel's `web-design-guidelines` skill, copied unchanged from
  github.com/vercel-labs/agent-skills (`skills/web-design-guidelines/SKILL.md`)
  on 2026-10-13. MIT licence (that repository's README).
- `references/command.md`: a snapshot, taken the same day, of the rules the
  skill fetches at use time from
  https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
  (MIT, `LICENSE` here is that repository's licence, Copyright 2025 Vercel Labs).
- Installed because the owner asked for the five tools in a "Claude Code
  plugins" video (Taste Skill, Vercel Web Design Guidelines, Awesome DESIGN.md,
  Image to Code, Playwright CLI); the other four were already in
  `.claude/skills/`.

Runtime: the skill wants network access to raw.githubusercontent.com. If the
fetch fails (WebFetch has failed on some hosts in this environment), use
`curl -sSL` on the same URL, or this snapshot, and say which one was used.
