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

## Starting a new site

`prompts/site-blueprint.md` is the brief to open a new client site with
(fill in the fields, paste it). It's our own, written from the SimNow
lessons; the owner asked for one after seeing a creator's "master
blueprint" reel, which was not copied.

`prompts/cold-call-script.md` is the phone pitch for selling a finished
site ($500), from the owner's draft (2026-10-29). Their tonality video
(youtu.be/KQ6c9vceu7A) couldn't be watched: YouTube is blocked here.

## SimNow (`sites/simnow/`)

Sim racing lounge, 3790 Silverton Rd NE, Suite C, Salem, OR 97305.
Live site: https://www.simnowusa.com. Brand red `#d0312c` / `#f0605a` on
near-black.

- What the owner wants (in their words): the site opens on black, the car's
  lights come on "driving at night", then the whole site opens and "the
  background is just the lambo driving around". On 2026-10-12 they swapped
  the clip and asked for the tail lights, not the headlights, to come on in
  the opening. The SVJ photo they sent (their own) only identifies their
  taste in cars: do NOT put the photo on the site ("Don't use that picture
  as the background"). Their earlier "car polish" reel set the quality bar
  (cinematic, photographic).
- The background is a clip the owner sent: a black Porsche 911 GT3 RS at
  night (they call it "the lambo"), by TikTok creator @nghtstlkr.idn, used
  with permission (owner confirmed, including the watermark removal) and
  credited in the footer.
  - Prepared with `render/clean_clip.py`: first 12.7 s kept (TikTok end
    card cut), watermark inpainted pixel by pixel (left until frame 150,
    then bottom-right), rotated upright from sideways storage, audio
    stripped. Result: `assets/drive/drive.mp4|webm`, 1024x576 landscape,
    and `drive-phone.mp4|webm` at about half the bitrate for the phone
    layout (chosen by `max-aspect-ratio: 1/1`, same as the band layout).
  - Desktop: full-screen background. Phones: a band across the top.
  - Intro (`js/lights.js`, WebGL): black, the light bar draws on from the
    middle with a soft red glow and a thin lens streak, then the night
    spreads out and the site opens; it hands back to the plain video (no
    WebGL: a fade from black). The owner found the first version (two
    blinks, broken outline, boxy glow) "tacky"; keep it clean.
  - No loading bar, "Warming up" label or Skip intro button: the owner had
    them removed and wanted less time on black. The clip plays as soon as it
    can (not after buffering); after 2.5 s without it the site opens on the
    poster. The site opens ~2 s into the intro.
  - The owner wants the video playing the whole time on loop: `js/site.js`
    restarts it whenever the browser pauses it (except a hidden tab or
    reduced motion).
  - `CLIP` in lights.js is measured on this clip's first shot; a new clip
    needs it re-measured (README).
- The previous clip (@supercar_driven, a Lamborghini, headlights intro) is
  replaced; it's still in git history (commit c95d87d and earlier).
- Fallback, not used: a 3D night-drive render (`render/night_drive.py`,
  `night_post.py`; Blender 5.2 via the `bpy` pip package, ~20-30 s a frame,
  light tree off, emission sampling NONE). Stock video sites, Sketchfab,
  Hugging Face and Poly Haven are blocked from this container.
- Logo: their own badge (`assets/simnow-logo.webp`) stays the logo. The nav
  shows only its SIMNOW lettering, traced to a vector
  (`assets/simnow-wordmark.svg`, `render/trace_logo.py`), because the whole
  badge was unreadable at nav size; the footer shows the full badge at 92px.
  The owner asked for the logo to "look better" (2026-10-12); the design
  itself was not changed, and redesigning it would be SimNow's call.
- Address-bound files, to update if the site moves to SimNow's domain: the
  absolute share URLs (og:url, og:image, twitter:image, canonical) in all
  six pages and the root `index.html` (the link that gets shared; it carries
  SimNow's preview too), and the root `404.html`'s
  `<base href="/Korvane/sites/simnow/">`.
- Six pages since 2026-10-13: the owner asked for separate "tabs" for
  booking and the rest instead of one long scroll. `index.html` (home:
  intro, hero and the five-chapter scroll story, then "Where to next?"
  cards, hours), `book.html` (prices and booking links, first visit, FAQ),
  `experience.html`, `events.html` (quote form), `gear.html` (request form),
  `visit.html` (map, contact, note form). No build step: the nav, menu and
  footer are repeated in each file, so change all six. `js/site.js` runs on
  every page (clip, nav, forms, hours, redirects from the old one-page
  anchors); `js/home.js` adds the intro and story on home. The clip
  carries on from page to page. README "Pages" has the details.
- The owner's words on the split: "keep the same opening and the car and
  stuff and the same dashboard part when you first open the website". So
  the intro, clip, hero and the five scroll chapters stay exactly as on the
  one-page site (a first version had cut the story to four chapters; it
  was put back). The intro plays on every open (link, new tab, refresh)
  and is skipped only when coming back to home from another SimNow page
  after seeing it. Nav labels: Prices, Experience, Events, Gear, Contact.
- Booking stays a link to simnowusa.com, not embedded (their site allows
  framing): it takes payments, which can't be tested from here, and
  embedding is SimNow's call.
- Added 2026-10-12 after an audit the owner approved: those share tags,
  square icons (`assets/icons/`, `render/make_icons.py`: an SN monogram
  from their lettering for tabs, the badge for home screens), a Book
  button in the phone nav, a lighter clip for the phone layout
  (`drive-phone.*`, crf 27/38 via `clean_clip.py`), and the 404 page.
  Still open from that audit, all needing SimNow or the owner: launch on
  their domain, real reviews (never invented), a clip filmed in their
  shop, and visitor stats (the owner makes the account).
- `?skip` skips the intro (for testing; there is no skip button), `?intro`
  forces it after it has played this visit, `?debug` exposes
  `window.__simnow`.
- Playwright's Chromium has no H.264, so tests get the WebM; real browsers
  get the MP4 (chosen with `canPlayType`).
- Run: `cd sites/simnow && python3 -m http.server 8000`.
- Test with Playwright (node, CommonJS `require('playwright')`) against
  Chromium at `/opt/pw-browsers/chromium`. Phone overflow: compare
  `scrollWidth` with `documentElement.clientWidth`, not `innerWidth` (with
  `isMobile` emulation wide content widens `innerWidth` too, so that check
  always passes). Mailto forms: read the URL from Playwright's `request`
  event; stubbing `location.href` silently does nothing.
- The 3D fallback's car model (an Aventador from github.com/saikat111/car-3d,
  SVJ parts added in code) has an unknown licence.
- Facts come from their current site, read directly on 2026-10-12 (the
  web-search summaries from earlier were stale: wrong hours and email).
  Summary and links: README "Content from simnowusa.com".
  - Phone 971-345-2568 (call or text), email SimNowOR@gmail.com,
    facebook.com/SimNowOR.
  - Hours: daily 1-9 PM, appointments only. 6 rigs, Fanatec direct-drive,
    iRacing.
  - Booking lives on their site (Angular app, live calendar, Stripe):
    simnowusa.com/book#booking. Our "Book" buttons link there.
  - They also run event rentals (Oregon and the Pacific Northwest) and a
    retail paddock.
- The owner asked for everything on their current site to be carried over
  into our design (2026-10-12). That's done: prices, booking links, event
  rentals, retail paddock, FAQ, contact (mailto form) and their photos. Keep
  the two in step if their site changes.
- Still needed from SimNow: whether the new design replaces simnowusa.com.
  If it does, booking and the staff log-in have to keep running somewhere.
- Network: the owner set this environment's Network access to Full on
  2026-10-12, so simnowusa.com loads (it was blocked before, 403 at the
  proxy).

## RC Cleaning (`sites/rc-cleaning/`)

Residential and commercial cleaning in Tucson, owned by Rosa. Started
2026-10-13 from their Wix site (rccleaningtucson.wixsite.com/website); the
owner asked to "keep all their info but just make their website way better
... similar to how we made simnow a better one but make it unique". Not yet
approved by RC Cleaning: every page is `noindex` until they agree.

- Pages: Home, Book Online, About, Hours (their nav labels). The opening
  wipes dusty glass off a Tucson sunset with a squeegee (`js/wipe.js`).
- The owner likes the opening ("I like the opening like how the screen
  gets cleaned"): keep the wipe and the hero it reveals as they are.
  Second pass the same day, asked to be "better and even cleaner": each
  fact said once, hairline rows instead of mixed cards, one closing per
  page, the home message form folded into the one on Hours, and the
  review on glass that clears as it scrolls in. Keep list and every change:
  README "Second pass".
- Their photos were Wix stock (Wix-only licence) and their online booking
  never worked, so neither was carried over: public-domain Library of
  Congress photos (Carol M. Highsmith) and a mailto request form instead.
- Facts, gaps and questions for them: the site README.
- Checked 2026-10-13 in Chromium, desktop and phone: the wipe (frames
  seeked through), every page's screens, taps (44 px+), the menu, the
  phone call bar, forms (mailto URLs read from Playwright's `request`
  event), reduced motion, no JavaScript, share tags, structured data and
  every internal link: 52 of 52. After the second pass:
  `sites/rc-cleaning/tests/behave.cjs`, 55 of 55 (serve the site on port
  8780 first).
- Live at https://korvane11.github.io/Korvane/sites/rc-cleaning/ (the root
  address still goes to SimNow).

## Eleven Cafē (`sites/eleven-cafe/`)

Espresso bar at 33 N Stone Ave, Suite 150, downtown Tucson (the door is on
Pennington Street), owned by Dung "Q" Hoang. Their only page online is
Facebook (facebook.com/elevncafe). Started 2026-10-13. Not yet approved by
Eleven Cafē: every page is `noindex` until they agree.

- The owner's words (2026-10-13, for an earlier coffee place, then "the same
  format" for this one): "I want the opening of the website to kind of be an
  animation at an espresso being poured then it opens up into the website
  make sure you have a separate tab for the menu and stuff", "great and
  clean", "make no mistakes".
- The opening and the look since 2026-10-13 (second pass), from two reference
  videos the owner sent: "make the opening scene and dashboard just like this
  one" (a coffee site: a sunlit counter by a window, a pour, three lines that
  change as you scroll) and "I also want the dark tones and themes of this
  website" (a near-black café site with amber light, serif headlines with a
  gold italic word, small gold labels, a pill nav). Structure and look were
  taken; copy, images and logos of those sites were not.
  - The scene (`render/pour.html`, offline): a white, finely speckled
    stoneware cup (wide round bowl, thin raw tan lip, loop handle; its
    proportions measured on the owner's photo) on a walnut counter by
    a tall window in low amber light, haze, soft focus; the light comes up,
    espresso pours, steam rises; a seamless steam loop follows. The cup is
    modelled on a photo of a mug the owner sent ("Use this mug for the
    website instead of the one your using", 2026-10-13); it replaced their
    logo's ribbed cup. The photo itself is not on the site. The owner's
    second message ("Change the mug / To the picture I sent") came after a
    first model that was too cream, too flecked and had a foot: compare the
    model with the photo itself, side by side, not with a description.
  - Home: the scene is pinned while three lines take turns with the scroll
    (made by hand; every shot pulled to order; the headline "The hole in the
    wall that fills the gaps in your day." with the buttons), then it sinks
    into the page. Reduced motion or no JavaScript: one screen, the headline.
  - Every page: warm near-black `#0d0b09`, amber glows, Playfair italic in
    their gold for accent words, gold labels with a rule, pill nav and
    buttons, tags on the menu. README "Design note" and "The opening".
  - The first version (the pour seen through "the hole in the wall") is in
    git history (commit c41cba4 and earlier).
- Facts and their sources (Facebook first; the 2021 tucson.com article and
  Google's hours via Wanderlog only where they agree), the gaps to ask
  about (still open? hours, menu and prices, photo originals): the site
  README. No menu or prices are published anywhere, so the Menu page lists
  only drinks their page and reviewers name, with no prices.
- Q asked the tucson.com writer not to photograph his face: never show him.
- Logo: their "ELEVEN cafē" lettering traced from their 720 px Facebook
  profile logo (`render/trace_logo.py`); icons are its first E.
- The scene renders offline (`render/render_all.sh`, about 1.7 h on 4
  cores, then `encode.sh` and `make_og.cjs`). Since 2026-10-14 ("keep
  refining it ... make sure the coffee pour is really good and the mug
  looks real") the camera looks down at about 19 degrees so the coffee
  shows rising, and the stream, crema, glaze and steam were reworked
  (README "The opening" and "Rendering the pour again"). The intro's last frame is the
  steam loop's first, and the page keeps the pour on screen until the loop
  has a frame showing (no black flash). If the framing changes, re-measure
  the cup's fractions (`CUP_L`, `CUP_P` in the test); README "Rendering the
  pour again" lists every knob.
- Checked 2026-10-14 in Chromium, desktop and phone, after the blueprint
  changes: `sites/eleven-cafe/tests/behave.cjs`, 88 of 88 (serve the site on port
  8790 first; `PAGES_ONLY=1` and `VIEWS=desk|mob` narrow it). README
  "Checked" lists what it covers.
- Live at https://korvane11.github.io/Korvane/sites/eleven-cafe/.
- The master blueprint (2026-10-14): the owner sent a "MASTER_BLUEPRINT" from an email and asked to "use this for
  the coffe website make it better and the cofee pur bette too". Then: "no dont use higgfiled just
  useeverything from the blueprint". So no Higgsfield, our own renderer only. The review against it is
  `sites/eleven-cafe/BLUEPRINT-REVIEW.md`. Applied:
  - Get directions is the one filled button everywhere, the menu is the outline button, the call is a plain link;
  - no live "Open now" until Q confirms the hours (`HOURS_CONFIRMED` in `js/site.js`; README "Gaps");
  - no video with a data saver on;
  - the phin drip render in the cà phê sữa đá section (README "The phin");
  - motion blur and a slow push-in on the pour;
  - the accessibility, local SEO and guidelines checks: `SEO.md`, plus `launch/` with robots.txt, sitemap.xml
    and llms.txt for their domain.

## Callahan Cleaning (`sites/callahan-cleaning/`)

Residential, commercial, office, move-in/out and Airbnb cleaning in Tucson
(mobile, no storefront), since 2017, locally owned and LGBTQ+ operated.
Started 2026-10-14 from their Wix site (callahancleaning74.wixsite.com/website),
their Facebook (facebook.com/callahancleaning) and their Yelp listing (via
MapQuest). Not yet approved by Callahan Cleaning: every page is `noindex`.

- The owner's words (2026-10-14): "create a website using all the plugins and
  skills to the best of your ability, make this professional, realisitic,
  artistic, and unique to the business, pull info from their socials, google,
  website, make this cinematic and use only real 3d rendering . use high
  quality images and videos, make sure everything meets the standard of a
  premium website". Then: "im going to lose wifi please remember this and
  complete when i reconnect" (so: finish it unattended, commit as you go).
- The opening: a Tucson living room at dawn (plaster, vigas, Saltillo tile),
  the blinds tilt open and the morning sun comes in in stripes; their logo
  comes up and its three sparkles light; then the page. Their own line
  "the fresh start you deserve" is the idea. Every image on the site is a
  Cycles render of rooms in that one house (no stock, no photos); Blender 5.2
  via `pip install bpy`, Poly Haven CC0 assets (`render/fetch_assets.py`,
  cache not committed). Rendering takes about 9 hours on 4 cores
  (`render/render_all.sh`, resumable, then `encode.sh`, `make_og.cjs`).
  README "The opening, beat by beat" and "The 3D renders".
- Pages: Home, Services, About, Book (`book.html`, the quote form: a mailto to
  callahan.cleaning74@gmail.com; their Wix booking page was empty). Light
  limewash page, their teal `#0c454c` (measured on their logo), Outfit and
  DM Sans.
- Facts and their sources, and the questions for them (which email, hours
  are Yelp's, the cut-off deep-clean list, Spanish, Kelsey): the site README.
- Logo: theirs, traced from their 960 px Facebook picture
  (`render/trace_logo.py`); icons are its three sparkles.
- Checked 2026-10-14 in Chromium, desktop and phone, with the final renders:
  `sites/callahan-cleaning/tests/behave.cjs`, 72 of 72 (serve the site on
  port 8800 first; `PAGES_ONLY=1` leaves out the opening, `OPENING=desk|mob`
  narrows it). Not checked: Safari/iOS, real phones.
- Live (once Pages deploys `main`) at
  https://korvane11.github.io/Korvane/sites/callahan-cleaning/.

## Pour My Coffee Co (`sites/pour-my-coffee/`)

Coffee shop in Rita Ranch, Tucson: 9136 E Valencia Rd, Ste 160 (Safeway
shopping center), 520-849-5359, PourMyCoffeeCo@gmail.com. Their site is Wix
(pourmycoffeeco.com). Started 2026-10-14. Not yet approved by Pour: every
page is `noindex`; their Wix site, domain and listings are untouched.

- The owner's words (2026-10-14): they pasted the master blueprint and
  "https://www.pourmycoffeeco.com/ heres the wbsite i need you to make a
  better one for". The blueprint's first response is
  `sites/pour-my-coffee/BLUEPRINT.md`; facts with sources, gaps and
  questions for Pour, the design note and the opening's beats: the site
  README.
- Pages keep their nav labels: Home, Menu, Location, About us (with Join our
  team). Main action Get directions (they're walk-in; no online ordering:
  their Menu page says "COMING SOON").
- Look: deliberately the opposite of Eleven Cafē: bright morning daylight,
  their aqua `#a1d0d8` with a deep teal `#17575e` for actions, Bricolage
  Grotesque and Figtree, light and dark modes. Their logo traced from their
  own PNG (`render/trace_logo.py`).
- The opening since 2026-10-15 (see below): a Blender Cycles render
  (`render/blender/`): low morning sun and leaf shadows on an oak table, a
  white porcelain cup and saucer; thick glossy caramel coffee pours in and
  swirls as it fills, the stream breaks, steam rises; the logo and words fade
  in beside the cup at 1.1 s; a 2 s steam loop follows. One 1200 px square
  render, cropped for both layouts (`encode.sh`). About 70 s a frame on 4
  cores; `render_all.sh` is resumable and writes `render.pid` and `done`. The
  container is reclaimed when the session is idle and that kills a render:
  keep a waiter running (observation 0032). Stills and share image:
  `render/blender/stills.py`. The first opening (the WebGL latte heart,
  `render/pour.html`) is in git history before this change.
- 2026-10-15, the owner: "I need you to change the coffee mug and coffee to
  make it look more realistic aswell as the coffee pour is there any plugins
  or skills I can have you add that will make it better?" The plugin catalog
  had nothing for 3D or video. Asked, they chose "Both, then I pick": a
  Blender Cycles render (bpy 5.2, as Callahan) and a Higgsfield AI video
  (their account: free plan, 10 credits on 2026-10-15; quote before spending),
  shown side by side; and "I'll send a photo" of Pour's actual cups: model the
  cup on that photo, compared side by side with it, before any long render.
  Then they sent a reference clip instead of a cup photo: "Use the pour from
  this video but just into the cup" (an AI-generated TikTok by @satisfyloopusa:
  thick glossy caramel coffee with tan and dark swirls pouring down marble
  steps; a look reference only, not on the site). Higgsfield: Grok Video Lite
  quoted 5 credits a clip, Seedance 35; the owner chose "Skip Higgsfield".
  So: Blender only (`render/blender/`, README "The opening in Blender").
- Wix stock photos are not carried over; their storefront photo (theirs) is.
  The footer says the cup is a 3D render.
- Hours shown Mon-Fri 6-5, Sat-Sun 7-5 (home page, Instagram, Google agree;
  two old Wix footers disagree): no "Open now" until Pour confirms
  (`HOURS_CONFIRMED` in `js/site.js`). No menu prices, reviews or ratings
  until Pour supplies or picks them.
- Tests: `sites/pour-my-coffee/tests/behave.cjs` (serve on port 8810 first;
  `PAGES_ONLY=1`, `VIEWS=desk|mob`).
- Live (once Pages deploys `main`) at
  https://korvane11.github.io/Korvane/sites/pour-my-coffee/.

## Skills

`.claude/skills/` holds the skills the owner installed for building sites.
The main ones:

- Design direction: `design-taste-frontend`, `high-end-visual-design`,
  `impeccable`, `frontend-design`, `ui-ux-pro-max`, `awesome-design-md`
  (borrow a brand's system, never its identity), `redesign-existing-projects`.
- Motion and 3D: `gsap-*`, `threejs-*`, `img2threejs`.
- Testing: `playwright-cli`, `webapp-testing`.
- Review: `web-design-guidelines` (Vercel's, added 2026-10-13; it fetches
  Vercel's Web Interface Guidelines from GitHub each time, with a dated copy
  in its `references/` if the fetch fails; origin and licence in its
  `SOURCE.md`).
- The owner's second "plugins" video (2026-10-13) named five: Taste Skill
  (`design-taste-frontend`), Vercel Web Design Guidelines
  (`web-design-guidelines`), Awesome DESIGN.md (`awesome-design-md`), Image
  to Code (`image-to-code`) and Playwright CLI (`playwright-cli`). All five
  are in `.claude/skills/`. `image-to-code` starts by generating design
  images, and this environment has no image-generation tool, so it can't run
  as written here.
- Components: `21st-ui` (the 21st MCP in `.mcp.json` needs `API_KEY_21ST`
  and network access to 21st.dev).
- Setup: `claude-automation-recommender` (Anthropic's Claude Code Setup
  plugin) for recommending hooks, skills, MCP servers and subagents.
- `task-observer`: see below.
- `animation-styles` (built here, 2026-10-12/13): twenty web animation styles
  from a reel's list (particles to neo-brutalism), each a tested,
  dependency-free demo in `assets/demos/`; notes in `references/styles.md`
  are generated from the demo headers (`scripts/build-reference.py`), and
  `scripts/check-demos.cjs` checks them in Chromium. Still to do: take the
  gallery thumbnails from the reduced-motion stills (two are mid-animation),
  one trial run, then package it as a .skill file for the owner's Claude app.

## Plugins

Installed on the owner's claude.ai account on 2026-10-13, from a "top 5
plugins" video: Superpowers (obra), caveman (short, terse replies; turn it
off if it gets in the way of explaining things to the owner),
claude-code-setup (its skill is also in `.claude/skills/` as
`claude-automation-recommender`) and claude-security (Anthropic's scanner).
Account plugins load when a session starts, not mid-session. Copying a
plugin's skills into a running session was refused by the auto-mode
classifier (untrusted code), so don't retry that; use a new session.
OmniRoute, also in that video, was not installed (Working rules: no API
proxies).

## Task observer

`.claude/skills/task-observer/` (CC BY 4.0, rebelytics) logs friction and
corrections during work and proposes skill improvements for review. The
instructions below are what switches it on each session.

Reviews: the first ran 2026-10-13 (record in
`skill-observations/reviews/2026-10-13/REVIEW.md`). A weekly review runs
on its own: the Routine `weekly-skill-review` (trig_01Nrqdrz79K6pVGtYYZgdtFD,
Mondays 7:57 AM Arizona time) wakes the session "Weekly skill review
(routine)" (session_016ffmjZpF4rUjxsqpdBpY7b, which has this repo
attached), and that session pulls main, reviews in autonomous mode and
pushes. A Routine that starts fresh sessions does not get the repo, which
is why it targets a fixed session. Staged updates wait in `skill-updates/`
until the owner says to install them.

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
