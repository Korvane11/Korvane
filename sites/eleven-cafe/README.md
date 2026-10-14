# Eleven Cafē website

A new site for Eleven Cafē, an espresso bar in downtown Tucson, Arizona. Their
only page online is Facebook (facebook.com/elevncafe, shared as
facebook.com/share/18QTL5QpG7). Started 2026-10-13. The owner (Korvane)
asked, in their words, for "a website for them with the same format I just
explained for that other coffee place": "I want the opening of the website
to kind of be an animation at an espresso being poured then it opens up
into the website make sure you have a separate tab for the menu and stuff",
"great and clean", and "make no mistakes".

Not yet approved by Eleven Cafē: every page carries
`<meta name="robots" content="noindex">` until they agree. Remove it at launch.

Live at https://korvane11.github.io/Korvane/sites/eleven-cafe/ (GitHub Pages
from `main`).

## Run it locally

```bash
cd sites/eleven-cafe
python3 -m http.server 8790
# open http://localhost:8790
```

`?skip` skips the opening, `?intro` plays it even after it has played this
visit.

## Facts and where each one came from

Read directly on 2026-10-13. Their Facebook page is the only source that is
theirs; the rest are third parties, used only where they agree with it.

| Fact | Value | Source |
| --- | --- | --- |
| Name | Eleven Cafē (their logo: "ELEVEN cafē", the e with a macron) | Facebook page name, their logo |
| Line | "The hole in the wall that fills the gaps in your day! Coffee, Espresso, Teas and more!" | Facebook intro |
| Kind | Coffee shop, price range $ | Facebook |
| Address | 33 N Stone Ave, Suite 150, Tucson, AZ 85701; SE corner of Church and Pennington; the storefront faces Pennington Street | Facebook (address and corner), Downtown Tucson Partnership listing (ZIP), tucson.com 2021 (storefront on Pennington) |
| Phone | (520) 624-8852 | Facebook, Downtown Tucson Partnership |
| Email | elevncafe@gmail.com | Facebook |
| Hours | Monday to Friday 7am to 2pm, Saturday and Sunday closed | Google's listing as shown on Wanderlog. NOT from Facebook (its hours need a log-in); it agrees with Facebook showing "Open now" on a Tuesday at 10am. Confirm with them. |
| Owner | Dung "Q" Hoang, who makes each cup by hand and knows his regulars by name | tucson.com, Aug 1 2021 ("Sugar crush"); reviewers call him Q |
| The name | "Eleven" is Q's birth order: the eleventh of eleven children | tucson.com 2021 |
| Signature drink | Cà phê sữa đá (Vietnamese iced coffee), slow-dripped through a phin | their Facebook posts (Mar 2020), tucson.com 2021 |
| Also served | Espresso, Americano, cappuccino, lattes, chai latte, hot cocoa, cold brew, teas | Facebook intro (coffee, espresso, teas), Facebook reviews (Americano, chai latte, cappuccino, lattes, hot cocoa), Wanderlog (cold brew) |
| Gift cards | "Did you know we have gift cards available? Ask us for more info!" | Facebook, Dec 2019 |
| Reviews | 100% recommend, 11 reviews | Facebook |
| Brand | grey `#7E7E7E`, white, gold `#E2992A`; a tulip cup drawn in white bars with a gold ring handle and gold steam; "ELEVEN" in a condensed high-contrast serif over "cafē" in a rounded sans | their logo (Facebook profile and cover), colours sampled |

Q asked the tucson.com writer not to photograph his face ("It's my pet
peeve"). Nothing on this site shows him.

## Gaps and questions for Eleven Cafē

- **Still open?** Their last Facebook post is August 2020, but the newest
  review is February 2022, the cover photo is from about 2025 and Google
  lists weekday hours. Confirm before showing them the site.
- **Hours:** confirm Monday to Friday 7am to 2pm, closed weekends. Until
  they do, the site shows them as Google lists them, with "Call ahead to
  check before you go" under the table. Today's row is marked, but nothing
  says "Open now" and the structured data carries no hours. Once Q confirms
  them:
  1. set `HOURS_CONFIRMED = true` in `js/site.js`. The status line then
     says "Open now, until 2pm" or "Opens … at 7am", the dot comes back and
     the note goes;
  2. put the hours back in `index.html`'s structured data, after `address`:
     ```json
     "openingHoursSpecification": [{ "@type": "OpeningHoursSpecification",
       "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
       "opens": "07:00", "closes": "14:00" }],
     ```
     The test reads the flag and checks for it.
  If the hours themselves change, they appear in these places:
  - `OPEN` and `CLOSE` in `js/site.js`;
  - both hours tables (`index.html`, `visit.html`);
  - the home page's last scroll line and its status line;
  - Visit's lead, status line and descriptions;
  - the footer of all four pages.

  There is no build step, so there is no single place to keep the facts in.
  `grep -n 7am *.html` finds every copy.
- **Menu and prices:** no menu is published anywhere. The Menu page lists
  only drinks their page and their reviewers name, with no prices
  ("prices at the counter"). Ask for the full menu, prices and sizes.
- **Photos:** their Facebook photos are only 390 px wide logged out. Ask for
  the originals (the phins on the bar, the "CAFE" letters, the cup and gift
  card) and their logo files.
- **Name spelling:** Facebook and the logo use "Cafē" (macron); the downtown
  listing uses "Café". This site follows Facebook and the logo.
- **Website and social:** no Instagram or other page found. Ask.

## The opening, beat by beat

The owner's words, first: "the opening of the website to kind of be an
animation at an espresso being poured then it opens up into the website".
Then, on 2026-10-13, two reference videos: "I want you to make the opening
scene and dashboard just like this one here" (a coffee site by
@afterframe.design, "Kanto Coffee": a sunlit counter by a window, a pour,
three lines that change as you scroll, then the page) and "But I also want
the dark tones and themes of this website" (a café site by
@sitebuilt.tiktok: near-black, warm amber light, serif headlines with a
word or two in gold italic, small gold labels, a floating pill nav). The
structure and the look were taken from them; the colours, facts and words
are Eleven Cafē's own, and nothing of theirs (copy, images, logo) was
reused. Later the same day the Korvane owner sent a photo of a speckled
stoneware mug: "Use this mug for the website instead of the one your
using". The scene's cup is modelled on it (the photo itself is not on the
site).

1. **The scene** (`render/pour.html`, a WebGL raymarcher rendered offline
   frame by frame): that mug, a wide round bowl of white, finely speckled,
   glossy stoneware, widest at the rim and half as tall, tapering to a
   small flat base, with a thin raw tan lip and a tall loop handle
   (proportions measured on the photo), on a walnut counter by a tall
   window, late in the day. Low amber
   sun comes through the panes in stripes, the air is hazy with it, and
   everything but the cup is in soft focus. The camera looks down at about
   19 degrees (as the reference's does, more or less), so the coffee is in
   view as it rises. The light comes up from black (0.75 s); espresso pours
   in from above, a dark glossy stream with lighter tiger stripes that
   glows amber at its edges against the sun; it fills the cup, and crema
   forms around where it lands, turning slowly; the stream thins and
   breaks (3.05 s), and steam rises into the light. `assets/pour/intro-l.*`
   (1600 x 900) and `intro-p.*` (900 x 1600, phones and tall windows), then
   a 6 s seamless steam loop (`loop-*`) whose first frame is the pour's last.
2. **The words come in** 0.65 s after the pour starts, with the nav: a gold
   label ("Espresso bar, downtown Tucson") and the first of three lines.
3. **Scrolling** (`js/home.js`): the scene stays put while the lines take
   turns over it, as in the reference:
   - "Made by hand, *one cup* at a time." (every drink made to order by Q,
     the owner, on Pennington Street);
   - "Every shot, *pulled to order.*" (espresso, Americano, cappuccino and
     lattes, made the way you like them, and the cà phê sữa đá);
   - the headline, their own line: "The hole in the wall that *fills the
     gaps* in your day.", with the address, the hours, "See the menu" and
     "Get directions".
   The camera leans in a little (6%) and, at the end, the scene sinks into
   the page.
4. **"a separate tab for the menu and stuff"**: Menu is its own page
   (`menu.html`), with Our story and Visit beside it in the nav.

It plays whenever the site is opened (link, new tab, refresh) and not when
coming back to the home page from another page of the site after seeing it.
`?skip` skips it, `?intro` plays it even after it has played this visit.
No loader, label or skip button. It starts on the first frame the browser
can play; if none comes within 2.5 s (or the video fails) the still comes up
out of the dark with the words. The pour stays on screen under the steam
loop until the loop has a frame showing, so the hand-over has no black
frame. Reduced motion, or no JavaScript: one screen, the still and the
headline with its buttons (the first two lines are left out).

## Design note

1. **The moment:** the light coming up on the cup by the window, the pour,
   and the three lines over it. A handmade stoneware cup (the one the
   Korvane owner picked), in their gold light, and their own line as the
   headline.
2. **What stays quiet:** everything after it. A dark room with warm light
   pooling in it, one accent (their gold), hairlines rather than boxes, and
   nothing else that moves except things fading in as they scroll into view.
3. **Colour:** a warm near-black `#0d0b09` (the café after dark), `#120f0c`
   for quieter bands, `#18140f` for cards; cream `#f4ece0` for text (the
   cup), `#b2a896` for secondary text (8:1); their gold `#e2992a` for
   buttons, links, labels, the accent words and today's hours, and soft
   amber glows (`rgba(226, 153, 42, 0.13)`) behind sections.
4. **Type:** Playfair at its narrowest (opsz 144, width 87.5) for headlines,
   a high-contrast Didone like the "ELEVEN" in their logo, with a word or two
   in its italic, in gold; Be Vietnam Pro 300 for text and 600 for labels (a
   Vietnamese typeface, for a café known for cà phê sữa đá). Both cover
   Vietnamese and the macron in Cafē.
5. **Shapes:** buttons and the nav are pills; photos 14 px; cards 18 px;
   menu tags 4 px.
6. **Motion:** the opening and the three lines; fades of 0.7-0.9 s,
   ease-out; never decoration.
7. **Photos:** their two best Facebook photos (the phins dripping, the cup
   with a gift card), with a soft amber glow under them. The rendered cup
   is the only big image.
8. **Phones:** the render is reframed (a portrait version with the cup high
   in the frame), so the words sit on the dark counter under it; the nav
   folds into a full-screen menu with Call and Directions. On short phones
   the headline and spacing tighten so everything fits under the cup.

## Pages

| Page | Purpose | Main action |
| --- | --- | --- |
| `index.html` | The pour, their line, the signature drink (with the rendered phin), why it's called Eleven, what people say, hours and the way in | Get directions |
| `menu.html` | Every drink their page and their reviewers name, with the reviewers' words; gift cards | Get directions (nav); the call for gift cards |
| `story.html` | Why Eleven, the hole in the wall, made by hand, six reviews | Get directions (nav) |
| `visit.html` | Address, how to find the door, hours (today marked; "call ahead" until confirmed), call, email, Facebook | Get directions (Google or Apple Maps) |

One main action everywhere, from the blueprint: **Get directions** is the one filled button (the nav at every
size, the phone menu, the end of the opening, Find us). See the menu is the outline button. The call is a
plain link (`.link--call`), never a button. `tests/behave.cjs` checks this on every page.

## Files

| Path | What it is |
| --- | --- |
| `index.html`, `menu.html`, `story.html`, `visit.html` | The pages (the nav, menu and footer are repeated in each: change all four) |
| `styles.css` | Every style, with the font faces inlined; tokens at the top |
| `js/site.js` | Every page: nav, menu, today's hours (Tucson time; the live open-now only once `HOURS_CONFIRMED`), the year, reveals |
| `js/home.js` | Home only: the opening, the steam loop and the phin loop (none of them with reduced motion or a data saver) |
| `assets/pour/` | The rendered pour and steam loop (MP4 for browsers, WebM for Playwright's Chromium) and their stills |
| `assets/phin/` | The rendered phin loop (4 s, 720 x 900) and its still |
| `assets/brand/wordmark.svg` | Their "ELEVEN cafē" lettering, traced from their Facebook logo by `render/trace_logo.py` |
| `assets/brand/` | Icons (`render/make_icons.cjs`: the first E of their "ELEVEN"), the link-preview image |
| `assets/photos/` | Their two Facebook photos (390 px, the size Facebook serves logged out) |
| `assets/fonts/` | Playfair and Be Vietnam Pro (latin, latin-ext, vietnamese) with their OFL licences |
| `assets/icons/` | Phosphor icons (MIT), inlined into the pages |
| `render/` | The pour shader (`pour.html`), the frame renderer (`render_pour.cjs`), `render_all.sh`, `encode.sh`; the phin scene (`phin.html`, `render_phin.cjs`, `encode_phin.sh`); the logo tracer, the icon maker and the link-preview maker (`make_og.cjs`, `og.html`) |
| `tests/behave.cjs` | The browser checks (Playwright, Chromium); see Checked |
| `BLUEPRINT-REVIEW.md` | The review against the owner's master blueprint (facts, assets, interaction map, what was approved) |
| `SEO.md`, `launch/` | Search and AI visibility: what was checked and found, and `robots.txt`, `sitemap.xml`, `llms.txt` ready for their domain at launch |

## Checked

2026-10-14, in Chromium, desktop (1440 x 900) and phone (390 x 844), after
the blueprint changes (one main action, honest hours, the data saver, the
phin, the accessibility fix): `tests/behave.cjs`, 88 of 88, no page errors.
Serve the site on port 8790, then `NODE_PATH=$(npm root -g) node
tests/behave.cjs` (or pass the live address). `PAGES_ONLY=1` leaves out the
opening; `VIEWS=desk` or `VIEWS=mob` times the opening in one layout. A
stalled wait reports a failed check instead of stopping the run.

- The opening, both layouts: the pour plays on a dark screen with nothing
  else showing; the nav and the first line come in about 0.65 s in; the
  steam loop takes over at the end with no black frame; the pause button
  works; scrolling, the scene stays while the second line and then the
  headline (with both buttons tappable) take over; the page carries on
  after it.
- At 13 screen sizes, from 360 x 640 to 2560 x 1080: the headline and
  buttons stay 16 px or more clear of the cup (its box measured from a
  cup-only mask render) and on screen.
- When it plays: on opening and refresh; not when coming back to home from
  another page; it does play when home is first reached from another page.
- No video, or one that takes 6 s: the still comes up within 3 s, with the
  words and the nav.
- Reduced motion and no JavaScript, every page: nothing hidden, no video.
- Hours at seven moments of the week (Tucson time), on Visit and home: today's row marked; while
  `HOURS_CONFIRMED` is false, no "Open now" and the call-ahead note; once true, the live status. The test reads
  the flag, so it checks whichever is set.
- A data saver on (Save-Data), both layouts: no video is fetched; the still shows; the three lines still turn.
- Screen readers find the h1 and the hero's directions button while the first line is showing.
- The phin, both layouts: no video until it's in view; it drips in view; its button pauses and plays it; it stops
  off screen. Reduced motion and the data saver keep it a still.
- One main action on every page at both sizes: every filled button gets directions (the nav's too), and the call
  is a plain link.
- The Vietnamese and the macron load from the site's own fonts.
- Every control is 44 px or taller and not covered by anything; nothing is
  wider than the screen; the phone menu opens, takes focus and closes with
  Escape.
- Share tags, one h1 per page, noindex, structured data (no hours until confirmed), every file and
  internal link.

Also checked by hand on 2026-10-14, with scripts in the session (not in the suite):
- contrast of every piece of text, all at or above 4.5:1 (3:1 for large);
- every Tab stop shows its focus ring and ends clear of the nav, at both sizes;
- no sideways scroll at 320 px or at 200% zoom;
- landmarks, names and alt text.

Vercel's Web Interface Guidelines pass; `theme-color` now matches the page background.

Each check written for a bug was first seen failing on the code before
the fix: the black frame at the hand-over, the still left hidden after a
failed video, the words over the cup on a short phone, the videos out of
step, and the font check (with the Vietnamese subset blocked).

## Rendering the pour again

`bash render/render_all.sh <frames dir>` renders every frame in headless
Chromium (SwiftShader on 4 cores: about 25 s a pour frame at 1600 x 900
with 6 samples, less for a steam frame; about 2 hours for everything), then `bash render/encode.sh <frames dir>` writes
`assets/pour/` (add `l` or `p` to encode one layout), and
`node render/make_og.cjs` the link-preview image from the new still.

What sets the shot, all at the top of the shader's sections:

- Timing: `T_START`, `T_STOP`, `T_END` = 103/24 s, `LOOP` = 6 s. The steam's
  noise wraps every loop, so loop frame 0 is the intro's last frame (and
  `encode.sh` copies it over the intro's last).
- The room: the window wall `XW`, its posts (`SP` apart, `PW` wide, `PD`
  deep, phase `Z0`), the sun `SUN` and its colour `SUNC`, the sky through
  the glass `GLASS`, the room's bounce `AMB`, the haze `SIG`. The posts are
  spaced so the cup sits in a band of sun with a dark post behind it; if
  `SUN`, `SP` or the camera moves, check both in a preview.
- The camera: `CAM` in the page script (position, field of view and the
  lens shift that places the cup, per layout); the focus distance follows
  it. Before tuning anything else, check from the camera that the coffee
  rising is in view (a contact sheet of the whole pour). The soft focus:
  `uAper`, `uMaxC` in `renderFrame`.
- Post: the glow threshold (`bright`), the exposure (`uExpo * 0.62`) and the
  vignette (`final`).
- Motion blur and the push-in (in the page script): each of a frame's samples is drawn at its own moment inside
  half a frame (`SHUTTER`, a film camera's 180 degrees), so the stream and the drops streak as they would on
  film. During the pour the camera starts 6% further back (`PUSH`) and eases in to `CAM` by the last frame, so
  the hand-over to the steam loop and the page's layout are unchanged. The stream's ends are round (a capsule),
  not cut flat.

Preview a frame without the whole run: load `render/pour.html` in the same
headless Chromium and call `window.renderFrame(t, layout, passes, mode, w,
h)` (mode 0 the pour, 1 the steam loop). Setting `window.noDof` or
`window.noBloom` first turns those effects off, for comparing.

Depth is kept as the nearest value over the passes (an average at the
cup's edge would belong to neither the cup nor the background, and the soft
focus would spray the edge into the background). The soft focus samples
a small disk the size of each pixel's own blur as well as the whole one
(with only the wide set, slightly soft edges such as the far rim came out
spiky).

The steam is a layer of its own (`uSteamPass`): the scene is drawn and
soft-focused without it, the steam is drawn over the scene's depth into
`T.steam`, and the post pass lays it over the blurred result. Drawn into
the scene, the steam gave its pixels the cup's depth, and the background
seen through it came out sharp.

The cup (`rOut`, `sdSide`, `sdHandle`) follows the owner's photo, measured
on it with a grid: the rim `RR` (about 10 cm across), the height `H` (0.49
of the rim's width), a flat base `RB` (0.44 of the rim), and a side whose
radius rises from the base as `1 - (1 - h)^3.15` (every measured point gave
an exponent between 3.0 and 3.3). The handle is a tilted oval loop of a flat
strap, about 3 cm tall and 1.7 cm out from the rim. The wall is an even
offset of the outside (`sdCav`), and the coffee fills that cavity up to
`LMAX`. Compare any change with the photo side by side.

Shadow and occlusion rays read the true distance (`gExact`): never the
bounding cylinder's, nor the 0.8 marching margin. Both effects read the
distance's size, so a stand-in shows: the bound drew a false, saw-toothed
penumbra on the counter, and an approximate ellipse distance put rings
into the occlusion. The bowl's outside takes shadow and occlusion only
from the handle (`gOnlyHandle`): rays grazing the bowl, which is widest at
the rim, banded its own shadow, the wrapped light already darkens it past
the terminator, and a convex outside occludes nothing of itself. Shadow
rays are jittered per pass.

The coffee is filled close to the rim (`LMAX`): the camera is low, and with
a wide bowl the near rim hides the far wall's lower part, so a lower level
shows an empty-looking cup.

If the framing or the cup changes, re-measure the cup's fractions of the
frame (`CUP_L`, `CUP_P` at the top of `tests/behave.cjs`): the test checks
that the headline and buttons stay clear of the cup at 13 screen sizes. To
measure, render the last frame from a copy of `pour.html` whose `render()`
returns white where the camera ray hits the cup and black elsewhere (before
the steam), with `noDof` and `noBloom` set, and take the white pixels' box.

## The phin (cà phê sữa đá)

The blueprint asked for a second moment that only Eleven has: their drink. In the cà phê sữa đá section on
home, a steel phin sits on a glass of condensed milk under a layer of coffee, in the same counter and window
light as the opening. Under the filter a bead swells, lets go, falls, and rings the surface.

- **When it plays:** only while it's on screen (an IntersectionObserver), and never with reduced motion or a data
  saver: the still (`assets/phin/phin.*`) stands instead. Its button pauses it, as the steam's does.
- **Their real photo of the phins** stays on Menu and Our story.
- **Rendering:** `render/phin.html` renders it; it copies the room, the light, the haze and the lens from
  `pour.html`, so change both if those change.
  - `node render/render_phin.cjs <frames dir> 720 900 24 5` renders it, about 30 s a frame and 50 minutes in
    all.
  - Then `bash render/encode_phin.sh <frames dir> [still frame]` writes `assets/phin/`.
  - The renderer copies `phin.html` into the frames folder first and renders from that copy. An edit, or git,
    can't change the scene halfway through, and the copy records what made the frames.
- **The loop:** three holes drip on cycles of 1, 4/3 and 2 s, which all divide the loop's 4 s, so the clip loops
  without a seam (`DR` in the shader).
  - The holes are near the floor's edge on the camera's side. From the camera's height, the filter's foot hides
    the middle of its own floor.
  - A falling drop is drawn as the streak it makes in its slice of the shutter, and the slices overlap.
  - The rings on the surface are summed over the current and the previous drop of each hole.
- **The glass** is a thin wall the rays step through. Its own light (reflections, the sun's glint, the bright
  line where the wall is seen edge-on) goes to a second layer that is laid over after the soft focus, so the
  window seen through the glass stays soft.
  - The liquid's shadow on the counter is worked out exactly: the milk stops the sun; the coffee lets a little
    amber through where the path is short.
- **The coffee** is black in the middle and amber at its thin edge against the light.
  - The milk is ivory-gold, a little deeper at the bottom.
  - The haze is half the opening's: this is a close-up.
- **Preview:** load a copy of `phin.html` in the same headless Chromium and call `window.renderFrame(t, passes,
  w, h)`. `window.noGlass`, `noDof` and `noBloom` turn those off for comparing.

## Photos and credits

- `assets/photos/phins.*` and `gift-card.*`: Eleven Cafē's own photos from
  their Facebook page. Credited in the footer. Ask for the originals.
- Not used: their "CAFE" letters photo, a repost from @downtowntucson (not
  theirs to give); the article's photos (tucson.com, Ellice Lueders).
- The cup, the stream and the steam are rendered (no stock footage).
- Reviews are quoted word for word from their Facebook reviews, with each
  reviewer's name and the month, as Facebook shows them publicly. One quote
  on the Menu page ("The best Americano EVER.", Amy Taylor) is a comment on
  their March 2020 post, not a review. Checked against the reviews page
  again on 2026-10-13.

## Licences

- Fonts: Playfair (roman and italic) and Be Vietnam Pro, SIL Open Font
  License 1.1 (`assets/fonts/OFL-*.txt`).
- Icons: Phosphor, MIT (`assets/icons/LICENSE-phosphor.txt`).
