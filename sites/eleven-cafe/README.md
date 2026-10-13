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
- **Hours:** confirm Monday to Friday 7am to 2pm, closed weekends.
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
   everything but the cup is in soft focus. The light comes up from black
   (0.75 s), espresso pours in from above, crema rises, the stream stops
   (3.05 s), steam rises into the light. `assets/pour/intro-l.*`
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
| `index.html` | The pour, their line, the signature drink, why it's called Eleven, what people say, hours and the way in | See the menu |
| `menu.html` | Every drink their page and their reviewers name, with the reviewers' words; gift cards | Call (prices at the counter) |
| `story.html` | Why Eleven, the hole in the wall, made by hand, six reviews | (reading) |
| `visit.html` | Address, how to find the door, hours with open-now, call, email, Facebook | Get directions |

## Files

| Path | What it is |
| --- | --- |
| `index.html`, `menu.html`, `story.html`, `visit.html` | The pages (the nav, menu and footer are repeated in each: change all four) |
| `styles.css` | Every style, with the font faces inlined; tokens at the top |
| `js/site.js` | Every page: nav, menu, open-now status (Tucson time), the year, reveals |
| `js/home.js` | Home only: the opening and the steam loop |
| `assets/pour/` | The rendered pour and steam loop (MP4 for browsers, WebM for Playwright's Chromium) and their stills |
| `assets/brand/wordmark.svg` | Their "ELEVEN cafē" lettering, traced from their Facebook logo by `render/trace_logo.py` |
| `assets/brand/` | Icons (`render/make_icons.cjs`: the first E of their "ELEVEN"), the link-preview image |
| `assets/photos/` | Their two Facebook photos (390 px, the size Facebook serves logged out) |
| `assets/fonts/` | Playfair and Be Vietnam Pro (latin, latin-ext, vietnamese) with their OFL licences |
| `assets/icons/` | Phosphor icons (MIT), inlined into the pages |
| `render/` | The pour shader (`pour.html`), the frame renderer (`render_pour.cjs`), `render_all.sh`, `encode.sh`, the logo tracer, the icon maker and the link-preview maker (`make_og.cjs`, `og.html`) |
| `tests/behave.cjs` | The browser checks (Playwright, Chromium); see Checked |

## Checked

2026-10-13, in Chromium, desktop (1440 x 900) and phone (390 x 844), with
the stoneware mug rendered: `tests/behave.cjs`, 71 of 71, no page errors.
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
- Open-now status and today's row at seven moments of the week (Tucson
  time).
- The Vietnamese and the macron load from the site's own fonts.
- Every control is 44 px or taller and not covered by anything; nothing is
  wider than the screen; the phone menu opens, takes focus and closes with
  Escape.
- Share tags, one h1 per page, noindex, structured data, every file and
  internal link.

Each check written for a bug was first seen failing on the code before
the fix: the black frame at the hand-over, the still left hidden after a
failed video, the words over the cup on a short phone, the videos out of
step, and the font check (with the Vietnamese subset blocked).

## Rendering the pour again

`bash render/render_all.sh <frames dir>` renders every frame in headless
Chromium (SwiftShader on 4 cores: about 8.5 s a pour frame at 1600 x 900
with 4 samples, 5-8 s a steam frame with 2; about an hour for
everything), then `bash render/encode.sh <frames dir>` writes
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
- The camera (`main()`), the lens shift that places the cup (`shift`), and
  the soft focus (`uAper`, `uMaxC` in `renderFrame`, the focus distance is
  the camera's distance to the cup).
- Post: the glow threshold (`bright`), the exposure (`uExpo * 0.62`) and the
  vignette (`final`).

Preview a frame without the whole run: load `render/pour.html` in the same
headless Chromium and call `window.renderFrame(t, layout, passes, mode, w,
h)` (mode 0 the pour, 1 the steam loop). Setting `window.noDof` or
`window.noBloom` first turns those effects off, for comparing.

Depth is kept as the nearest value over the passes (an average at the
cup's edge would belong to neither the cup nor the background, and the soft
focus would spray the edge into the background).

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
