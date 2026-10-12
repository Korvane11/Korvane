# Korvane

Websites built with Claude Code. Each site lives in `sites/<name>/` as plain
static files: no build step, libraries vendored under `vendor/`.

This file is the project's memory. Cloud sessions start from a fresh clone,
so anything a later session needs to know goes here (or in a site's README)
and gets committed.

## Working rules

- Commit and push to `main`. The owner chose `main` over feature branches.
- Never ask the owner to paste API keys or tokens into the chat. Keys go in
  the environment's settings.
- Sites for real businesses (SimNow) use their name and branding: never
  publish them as Claude Artifacts. Hosting is the owner's call (GitHub Pages
  from `main`, root `/`; the root `index.html` redirects to `sites/simnow/`).
- Impeccable's auto-run hooks stay off unless the owner asks for them.
- Don't install API proxies that reroute Claude Code's traffic (OmniRoute,
  Headroom and the like).

## SimNow (`sites/simnow/`)

Sim racing lounge, 3790 Silverton Rd NE, Suite C, Salem, OR 97305.
Live site: https://www.simnowusa.com. Brand red `#d0312c` / `#f0605a` on
near-black.

- What the owner wants (in their words): the site opens on black, the Lambo's
  lights come on "driving at night", then the whole site opens and "the
  background is just the lambo driving around". The SVJ photo they sent
  (their own) only identifies the car: do NOT put the photo on the site
  ("Don't use that picture as the background"). Their earlier "car polish"
  reel set the quality bar (cinematic, photographic).
- Stock video sites (Pexels, Pixabay, Mixkit, Coverr, Vimeo), Sketchfab,
  Hugging Face and Poly Haven are all blocked from this container; the owner
  chose a 3D render over sending a filmed clip.
- The background is a Blender render: `render/night_drive.py` (matte black
  Lamborghini on a wet highway at night, street lights, tracking camera,
  motion blur), graded and encoded by `render/night_post.py` into
  `assets/drive/` (intro plays once, loop is seamless; MP4 + WebM at 1280 and
  854). `js/main.js` plays intro then loop under the page, chapters fade over
  it on scroll. Blender 5.2 Cycles via the `bpy` pip package; ~20-30 s a frame
  here, about an hour for all 192 frames; run in the background, existing
  frames are skipped. Keep the light tree off and emission sampling at NONE.
- `?skip` skips the intro, `?debug` exposes `window.__simnow`.
- Playwright's Chromium has no H.264, so tests get the WebM; real browsers
  get the MP4 (chosen with `canPlayType`).
- Run: `cd sites/simnow && python3 -m http.server 8000`.
- Test with Playwright (node, CommonJS `require('playwright')`) against
  Chromium at `/opt/pw-browsers/chromium`.
- The car model is a Lamborghini Aventador from github.com/saikat111/car-3d
  with SVJ parts added in code. Its licence is unknown: it's a placeholder
  until a licensed SVJ (e.g. a CC BY one from Sketchfab, which this container
  can't reach) is swapped in and re-rendered.
- Still needed from SimNow: booking link, original logo file, phone and
  socials.

## Skills

`.claude/skills/` holds the skills the owner installed for building sites.
The main ones:

- Design direction: `design-taste-frontend`, `high-end-visual-design`,
  `impeccable`, `frontend-design`, `ui-ux-pro-max`, `awesome-design-md`
  (borrow a brand's system, never its identity), `redesign-existing-projects`.
- Motion and 3D: `gsap-*`, `threejs-*`, `img2threejs`.
- Testing: `playwright-cli`, `webapp-testing`.
- Components: `21st-ui` (the 21st MCP in `.mcp.json` needs `API_KEY_21ST`
  and network access to 21st.dev).
- Setup: `claude-automation-recommender` (Anthropic's Claude Code Setup
  plugin) for recommending hooks, skills, MCP servers and subagents.
- `task-observer`: see below.

## Task observer

`.claude/skills/task-observer/` (CC BY 4.0, rebelytics) logs friction and
corrections during work and proposes skill improvements for review. The
instructions below are what switches it on each session.

This container is ephemeral, so the workspace is the repository itself:
`skill-observations/` and `skill-updates/` must be committed and pushed to
`main` with the session's other work, or they are lost.

Before the first tool call of any session — and before writing or
proposing a plan, not merely before executing one — invoke the
task-observer skill AND execute its Session Start Protocol (storage
check, frontmatter scan, review trigger). Loading the skill and running
the protocol are separate steps; a session that loads the file and stops
has activated nothing. Any turn that will involve a tool call counts; do
not classify the session as "too simple" from its opening message.

Select skills on the DECISION the request is about, not on the artefact it
arrived as. Name what the user is deciding, then match the installed skill
descriptions against that — a request handed over as a file to review
still needs the skill whose description names its subject.

After completing each task, list the observation records written this
session in the same turn and report a one-line summary from that listing
(ids and titles, or "none logged and why") — never from memory of
writing them.

Loading a skill is not complete until you have queried the observation
log for OPEN observations naming it and read their bodies:
  bash "/home/user/Korvane/.claude/skills/task-observer/scripts/skill-load.sh" "/home/user/Korvane" <skill-name>
(<skill-name> is the bare name.) The Skill invocation and that call are ONE
batch. Apply their insights to the current work; editing a skill file
waits for the review ("Log, don't act" in SKILL.md).

The task-observer workspace for this project is:
  /home/user/Korvane
Every path the skill uses derives from that root and nothing else:
  /home/user/Korvane/skill-observations/observation-log/   (the log)
  /home/user/Korvane/skill-observations/cross-cutting-principles.md
  /home/user/Korvane/skill-updates/                        (staging root)
  /home/user/Korvane/skill-updates/PENDING.md              (staging manifest)
Never resolve any of them from the current working directory, and never
place the workspace inside a skills-discovery directory.

The user's repositories live under:
  /home/user

A subagent dispatched by a session that already runs this protocol does
not run it again and does not write to the log; it puts findings in its
final report and the controller writes them.

An observation file comes into being only through
  bash "/home/user/Korvane/.claude/skills/task-observer/scripts/new-observation.sh" <slug> "/home/user/Korvane"
which prints the path to write into. Never by copying another file's
header or counting a listing — including on the turn after a compaction.
