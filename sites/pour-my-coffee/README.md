# Pour My Coffee Co website

A new site for Pour My Coffee Co ("Pour"), a coffee shop in Rita Ranch on
Tucson's east side. Started 2026-10-14 from their Wix site
(pourmycoffeeco.com). The owner (Korvane) sent the master blueprint with
"https://www.pourmycoffeeco.com/ heres the wbsite i need you to make a
better one for". The blueprint's first response (facts, assets, creative
world, page plan, interaction map) is `BLUEPRINT.md`.

Not yet approved by Pour My Coffee Co: every page carries
`<meta name="robots" content="noindex">` until they agree. Remove it at
launch. Their Wix site, domain, Google listing and socials are untouched.

Live (once Pages deploys `main`) at
https://korvane11.github.io/Korvane/sites/pour-my-coffee/.

## Run it locally

```bash
cd sites/pour-my-coffee
python3 -m http.server 8810
# open http://localhost:8810
```

`?skip` skips the opening, `?intro` plays it even after it has played this
visit. Tests: `node tests/behave.cjs` with the server running (README
"Checked").

## Pages

Their own nav labels are kept: Menu, Location, About us.

| Page | File | What it holds |
| --- | --- | --- |
| Home | `index.html` | the opening; "Your daily coffee stop." with Get directions and See the menu; what they pour; address, hours and their storefront; their coffee and food words; "Stop by today!" |
| Menu | `menu.html` | what they serve, grouped, no prices (see Gaps) |
| Location | `location.html` | address, directions, Google Maps, phone, email, socials, storefront, hours, a message form |
| About us | `about.html` | their About text, coffee and food, Join our team (their rules and a form) |

The nav, phone menu, footer and phone call bar are repeated in each file
(no build step): change all four. `js/site.js` runs on every page (nav,
menu, today's hours row, forms, reveals); `js/home.js` adds the opening.

The one main action is **Get directions** (the only filled button);
**See the menu** is the outline button; the phone number is a plain link.
On phones a bar at the bottom keeps Directions and Call in reach.

## Facts and where each one came from

Read directly on 2026-10-14 (their Wix site rendered in Chromium; Instagram
and Facebook as a logged-out visitor sees them; Google Maps; joe coffee).

| Fact | Value | Source |
| --- | --- | --- |
| Name | Pour My Coffee Co, "Pour" | their site, logo, Instagram |
| Line | "Your daily coffee stop." | Instagram bio |
| Address | 9136 E Valencia Rd, Ste 160, Tucson, AZ 85747 | their Contact page; Google ("#160", "Located in: Rita Ranch Shopping Center") |
| Where | "in Rita Ranch at the Safeway shopping center" | their Location and About pages |
| Phone | 520-849-5359 | their site, Facebook, Google |
| Email | PourMyCoffeeCo@gmail.com | their Contact and Join Our Team pages, Facebook |
| Hours | Mon-Fri 6am-5pm, Sat-Sun 7am-5pm | their home page box, Instagram bio, joe coffee, Google ("Closes 5 PM" on Wednesday 2026-10-14) |
| Drinks | "espresso, brewed coffee, lemonade, and milk shakes"; custom drinks | Location page; page title "Espresso Sandwiches Custom Drinks" |
| Food | "Pastries, sandwiches, snacks, and more!"; "fresh baked pastries"; sandwiches for "Breakfast, lunch, or afternoon snack" | Location page; their old home page (/home-full) |
| Lattes, blended drinks (caramel toffee, chai frap), breakfast burritos and sandwiches pressed "panini-style" | named by customers | reviews quoted on joe coffee (from Google and Yelp) |
| Coffee | "carefully selected to be sourced from quality roasters ... grown by ethical farms, are always fresh" | About page (/about-us-1) |
| Food | "We chose some of the best fresh ingredients for our food." | About page |
| Room | "a comfortable, relaxing environment ... for all to enjoy"; for "work, meetings or get togethers, and dates"; "Our welcoming team will be ready to serve you!" | About page |
| Hiring | form or résumé by email; "Please do not call or walk in"; may not reply | Join Our Team page |
| Socials | instagram.com/pourmycoffeeco, Facebook page id 100090196694802, x.com/PourMyCoffeeCo | their footer |
| Map point | 32.1183384, -110.7976841 | Google's pin (via the joe coffee directions link) |
| Brand | aqua `#a1d0d8` (their header), white logo, brown `#5d3708` | sampled from their site; logos from their Wix uploads |

Copy on the site keeps their words where it can ("Great coffee. Amazing
service.", "Stop by today!", "Your daily coffee stop."), lightly edited for
grammar.

## Gaps and questions for Pour

- **Hours.** Their home page, Instagram and Google say Mon-Fri 6-5,
  Sat-Sun 7-5, which the site shows. But their old home footer said 6-6 /
  7-6 and the Menu page footer says Mon-Fri 6-7, Sat 7-7, Sun 7-4. Ask
  which is right. Until they confirm, today's row is marked but nothing
  says "Open now" and the structured data has no hours. Once confirmed:
  set `HOURS_CONFIRMED = true` in `js/site.js` (the status line appears);
  add `openingHoursSpecification` to `index.html`'s structured data. If the
  hours change, they are in: `OPEN`/`CLOSE` in `js/site.js`, both hours
  tables (`index.html`, `location.html`), the hero line and closing line on
  home, the footer of all four pages, Location's description.
- **The menu and prices.** Not published anywhere (their Menu page says
  "COMING SOON"). The Menu page lists only what they or their customers
  name, with no prices, and says prices are at the counter. Ask for the
  menu board or a photo of it.
- **Photos.** Every photo on their Wix site except the storefront is Wix
  stock (see below). Ask for originals of their drinks, food, counter and
  room; until then the site uses our renders and their storefront photo
  (640x480, from an iPhone, Feb 2023; a larger original would help).
- **Reviews.** Real reviews exist (joe coffee quotes several from Google
  and Yelp, mostly without names; Google shows 4.8, joe coffee 4.7 from 236
  reviews). None are on the site: ask Pour which they would like quoted,
  with names, and whether to show a rating.
- **Holiday hours.** Their home page shows last season's (12-24 6am-1pm,
  12-25 closed, 12-31 and 1-01 6am-1pm). Not carried over; ask for this
  year's when it comes.
- **Owner, roaster, opening date, story.** Not published. Their footer's
  Story, F.A.Q. and Our Coffee are not links. Nothing invented.

## What was left out, and why

- Wix stock photos (espresso pull, coffee beans, croissant, grilled cheese,
  cappuccino, holiday backgrounds): Wix's licence keeps them on Wix. The
  "Cappuccino_edited.jpg" upload is the same image as Wix's stock
  "Cappuccino".
- The draft pages still public on their site (/home-full, /about-us) and the
  holiday background.
- The Wix chat widget (no way to know who answers it).
- TikTok (@pourtucson has no posts; one footer linked to Wix's own TikTok).
- A map embed: a link to Google Maps instead, so nothing heavy loads.

## Design note

1. **The moment:** their name, done. Six in the morning, low sun through
   the storefront glass and the desert tree out front; milk is poured into
   an espresso and leaves a heart; steam rises. Then the words come in
   beside the cup.
2. **Quiet around it:** one family of type, one accent colour, no other
   motion than a soft rise as sections come into view.
3. **Colour:** their aqua `#a1d0d8` as the brand field (the hours band, the
   closing band, icon backgrounds); a deep lagoon teal `#17575e` for text
   accents and the one filled button (white on aqua fails contrast); a cool
   near-white page `#f5f9f9`. Dark mode: night teal `#0c1c1e` with the aqua
   as accent. The opening and the hero stay light in both modes.
4. **Type:** their logo carries the serif. Bricolage Grotesque for headings,
   Figtree for text (both OFL, vendored in `assets/fonts/`).
5. **Motion:** ease-out, 0.4-1 s, transform and opacity only; reveals once,
   never repeated; nothing hides content without JavaScript. Reduced
   motion: no opening, no reveals, the still.
6. **Pictures:** every drink is our render of one cup in one light, so they
   look like one set; their storefront photo is shown at its real size,
   never stretched. The footer says the cup is a render.
7. **Phones:** a portrait render with the cup low and the words above it,
   at about half the bitrate; the call bar; the hero logo drops on short
   screens.

Eleven Cafē (`sites/eleven-cafe/`) is also a Tucson coffee site with a pour:
Pour is deliberately its opposite (bright daylight, milk not espresso, a
top-down heart, their aqua, a sans) so the two never look alike.

## The opening, beat by beat

| Beat | Time | What happens | Made by |
| --- | --- | --- | --- |
| 1 | 0-0.9 s | black, then the light comes up warm on the oak table and the cup of espresso | exposure ramp and a warm-to-day sun (`pour.html`, `final` shader and `sunCol`) |
| 2 | 0.7-1.5 s | the milk's stream falls in; the crema lightens around it | `sdStream`, `surfaceColor` |
| 3 | 1.55-2.7 s | the white comes up and grows | `blobC`, `blobRad` |
| 4 | 2.7-3.15 s | the stream lifts and pulls through: a heart | `pullK`, `pullZ`, the displacement in `surfaceColor` |
| 5 | 3.15-5 s | the stream breaks, ripples settle, steam rises into the sun | `steam`, `surfNormal` |
| 6 | 1.1 s on | the nav, the logo, the headline and the buttons fade in beside the cup | `LIT_AT` in `js/home.js`, `.js.intro` in `styles.css` |
| 7 | after 5 s | the steam loops (6 s, seamless; the loop's first frame is the intro's last) while the hero is on screen | `startLoop()` |

No loader, no skip button. If the video can't start in 2.5 s, the page
opens on the still. Data saver or reduced motion: the still, no video.

## Rendering the opening

`render/pour.html` is our own WebGL2 ray marcher (the scene is maths: a
white porcelain cup and saucer, an oak table, the sun through a tree and
the glass, the latte surface, the milk stream, steam). It has no models,
textures or stock. It reuses the post-processing of Eleven Cafē's renderer
(depth of field, bloom, tone).

```bash
cd sites/pour-my-coffee
bash render/render_all.sh /path/to/frames     # about 1.5-2.5 h on 4 cores, resumable; then encodes
node render/stills.cjs /path/to/frames        # the two drink stills and the share image
```

Knobs: the timing constants at the top of the shader (`T_START`, `T_EMERGE`,
`T_PULL`, `T_STOP`, `T_END`); the heart's size and place (`blobC`,
`blobRad`, `pullZ`); the light (`SUN`, `sunCol`, `SKY`, `treeLight`); the
camera per layout (`CAM` in the page script). A changed `T_END` must also
change `DUR` in `render_pour.cjs` and the frame number in `encode.sh`.

## Brand files

- `assets/brand/logo-*.svg`: their logo, traced from their own transparent
  PNG (3365 px) with `render/trace_logo.py`; not redrawn. White, teal and
  aqua fills.
- `assets/brand/mark-*.svg`: their cup in its ring, traced the same way;
  the icons (`render/make_icons.cjs`, `render/make_ico.py`).
- The source PNGs and the storefront photo are in `render/source/`.

## Checked

2026-10-14, Chromium (Playwright), desktop 1440x900 and phone 375x812, with
the final renders: `tests/behave.cjs`, **460 of 460**. It covers, per page
and view: no sideways scroll (scrollWidth against clientWidth), one h1,
title and description, `noindex`, canonical and og:url pointing at the page,
the absolute og:image, icons and manifest load, no em or en dashes, alt text
and sizes on every image, every internal link and anchor, every external
link is theirs, every main control at least 44 px and the topmost element at
its centre, the footer clears the phone call bar, today's hours row on a
fixed Wednesday and no "Open now" claim, no console errors or missing files;
the phone menu (focus in, kept, Escape, focus back); both forms (empty, bad
email, then the mailto URL read from Playwright's request event); the
structured data against the visible phone and address; no JavaScript
(nothing left invisible, the hero still); the opening (plays on a fresh
open, the right file per layout, words and Get directions showing and
clickable by 2.5 s, the loop takes over, pauses off screen and with its
button, not replayed when coming back from another page); reduced motion
(no opening, no video loaded). The checks were seen to fail first: the
closed phone menu was an invisible layer over every page until
`.menu[hidden] { display: none; }`.

Also looked at by eye: screenshots of every page in light and dark mode, the
first screen at 390, 820 and 1280 px wide, and the opening at 2.6 s and 7 s
on desktop and phone.

Not checked: Safari and iOS (the MP4 path), real phones, screen readers
other than the accessibility tree.
