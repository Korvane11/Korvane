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

The owner's words: "the opening of the website to kind of be an animation
at an espresso being poured then it opens up into the website".

1. **"an espresso being poured"**: a rendered pour. A white ribbed cup with a
   gold ring handle (the cup in their logo, in 3D) on a dark counter;
   espresso pours in, crema rises, the stream stops, steam rises.
   `render/pour.html` (a WebGL shader rendered offline frame by frame) gives
   `assets/pour/intro-l.*` (1600 x 900) and `intro-p.*` (900 x 1600, phones
   and tall windows).
2. **"then it opens up into the website"**: the pour is first seen through
   an opening in a dark wall, their own line made literal ("the hole in the
   wall that fills the gaps in your day"). At 3.55 s, with the stream
   stopped, the opening widens to the whole screen and the nav and the
   words come in around the cup (`js/home.js`). The steam keeps rising: a
   6 s seamless loop (`assets/pour/loop-*`) whose first frame is the pour's
   last.
3. **"a separate tab for the menu and stuff"**: Menu is its own page
   (`menu.html`), with Our story and Visit beside it in the nav.

It plays whenever the site is opened (link, new tab, refresh) and not when
coming back to the home page from another page of the site after seeing it.
`?skip` skips it, `?intro` plays it even after it has played this visit.
No loader, label or skip button. It starts on the first frame the browser
can play; if none comes within 2.5 s (or the video fails) the still comes up
out of the dark. The pour stays on screen under the steam loop until the
loop has a frame showing, so the hand-over has no black frame. Reduced
motion: the still, no video. No JavaScript: the still and every word.

## Design note

1. **The moment:** the pour through the hole in the wall, then the wall
   opening into the site. It is their tagline and their logo's cup, shown.
2. **What stays quiet:** everything after it. One dark room, one accent (their
   gold), hairlines rather than boxes, and nothing else that moves except
   things fading in as they scroll into view.
3. **Colour:** from their logo. The room is a neutral near-black `#121212`
   (their grey family, not espresso brown); warm white `#f1f0ed` for text
   (the cup); `#aaa9a4` for secondary text; their gold `#e2992a` for buttons,
   links and today's hours, and the ring on the cup; their grey `#7e7e7e`
   for the icon.
4. **Type:** Playfair at its narrowest (opsz 144, width 87.5) for headlines,
   a high-contrast Didone like the "ELEVEN" in their logo; Be Vietnam Pro for
   everything else (a Vietnamese typeface, for a café known for cà phê sữa
   đá). Both cover Vietnamese and the macron in Cafē.
5. **Motion:** the opening, once; fades of 0.9 s, ease-out; never decoration.
6. **Photos:** their two best Facebook photos (the phins dripping, the cup with
   a gift card), shown small and square with the same 10 px corners. The
   rendered cup is the only big image.
7. **Phones:** the render is reframed (a portrait version with the cup in
   the top third), so the words sit on the dark counter under it; the nav
   folds into a full-screen menu with Call and Directions.

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
| `render/` | The pour shader (`pour.html`), the frame renderer (`render_pour.cjs`), `render_all.sh`, `encode.sh`, the logo tracer and the icon maker |

## Rendering the pour again

`bash render/render_all.sh <frames dir>` renders every frame in headless
Chromium (SwiftShader, about 19 s a pour frame at 1600 x 900 with 4
samples on 4 cores, 4 s a steam frame; about 1.5 hours for everything),
then `bash render/encode.sh <frames dir>` writes `assets/pour/` (add `l` or
`p` to encode one layout), and `node render/make_og.cjs` the link-preview
image from the new still. The shot's timing is at the top of the
shader (`T_START`, `T_STOP`, `T_END` = 103/24 s, `LOOP` = 6 s); the steam's
noise wraps every loop, so loop frame 0 is the intro's last frame. If the
timing changes, update `OPEN_AT` in `js/home.js`; if the framing changes,
update `SHOT.hole` there (the opening's corners as fractions of the frame).

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

- Fonts: Playfair and Be Vietnam Pro, SIL Open Font License 1.1
  (`assets/fonts/OFL-*.txt`).
- Icons: Phosphor, MIT (`assets/icons/LICENSE-phosphor.txt`).
