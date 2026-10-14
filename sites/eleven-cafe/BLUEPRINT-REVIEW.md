# Eleven Cafē: blueprint review (first response)

Written 2026-10-14 against the master blueprint the Korvane owner sent
("use this for the coffee website make it better and the coffee pour better
too"). Facts are from the site README ("Facts and where each one came
from"); nothing here is new information about the business.

## 1. Execution mode

**Refine an existing, live project; keep what was approved.** The site is
built and live on GitHub Pages as a private preview: every page carries
`noindex`, and Eleven Cafē has not seen it yet. Kept as they are unless you
say otherwise:

- the opening pour into the stoneware mug from your photo;
- the three scroll lines over the pinned scene;
- the dark amber look you chose from the reference video;
- the four pages: Home, Menu, Our story, Visit.

## 2. The business and the main action

Eleven Cafē is a small walk-up espresso bar, "the hole in the wall that
fills the gaps in your day", at 33 N Stone Ave, Suite 150, downtown Tucson.
The door is on Pennington Street. It is run by Dung "Q" Hoang, who makes
every drink by hand. Its signature is cà phê sữa đá. It opens on weekday
mornings, and customers come in person: there is no ordering or booking
online.

- **Primary action: Get directions.** The visit is the sale.
- **Secondary:** See the menu.
- **Tertiary:** Call.

Today the hero's filled button is "See the menu" and the nav's filled pill
is the phone number, so three actions compete. Proposed: one filled
"Get directions", the menu as the outline button, and the phone as a plain
link.

## 3. Facts and conflicts

| Fact | Status |
| --- | --- |
| Name, line, address, corner, phone, email | Verified on their Facebook page |
| Owner Q, made by hand, knows regulars | tucson.com 2021 and reviews; public, fine to use |
| "Eleven" = Q is the eleventh of eleven children | tucson.com 2021 only: **NEEDS OWNER CONFIRMATION** before launch (personal detail) |
| Signature cà phê sữa đá, phin drip | Their Facebook posts, tucson.com |
| Drinks on the menu | Named on their page or in reviews; **prices UNKNOWN** |
| Hours Mon–Fri 7am–2pm | From Google via Wanderlog, consistent with "Open now" on Facebook: **NEEDS OWNER CONFIRMATION** |
| Still open at all | **CONFLICT:** last Facebook post Aug 2020, newest review Feb 2022, Google lists hours. Confirm before showing them anything |
| Reviews (11, 100% recommend) and the quotes | Real Facebook reviews, quoted word for word with name and month |

Not invented anywhere: no ratings, awards, prices, staff or claims.

**Fix proposed now:** the live "Open now / Closed" badge is built on
unconfirmed hours. Until Q confirms them, show the hours table only, with no
live claim.

## 4. Assets

| Asset | Class | Notes |
| --- | --- | --- |
| `assets/pour/intro-*`, `loop-*` (our 3D render, desktop 1600×900 and phone 900×1600) | A: hero | Ours; poster stills `hero-*` are the fallback (E) |
| `assets/photos/phins.*` (their Facebook photo, 390 px) | B: section support | Theirs, but soft at 2× screens: replace with the original (F when available) |
| `assets/photos/gift-card.*` (theirs, 390 px) | C: detail | Same resolution risk |
| `assets/brand/wordmark.svg` (traced from their 720 px logo) | Brand | Their lettering, not redrawn |
| Icons (their first E), `og.jpg` (render with the wordmark) | E | Fine |
| Fonts (Playfair, Be Vietnam Pro, OFL), Phosphor icons (MIT) | — | Licensed |

**Missing (Missing Asset Plan):**

- the storefront, the counter and the phins in the real shop: photos or a
  short clip from Q, never showing his face;
- photo originals;
- logo files;
- the menu with prices.

Until then the render stands in, and it is labelled honestly in the footer
("The cup is a 3D render").

## 5. Creative world (proposed refinement)

**World:** a narrow downtown espresso bar on Pennington Street: a counter,
morning light, steel phin filters dripping, one man making each drink. Small,
personal, unhurried: the gap in your day.

**First three seconds:** coffee, made by hand, downtown Tucson, open on
weekday mornings.

**First memorable moment:** the pour (kept). **Proposed second moment**, the
one only Eleven has: the phin. In the cà phê sữa đá section, a slow phin drip
onto condensed milk that plays as the section scrolls into view, rendered in
the same light as the opening.

**What stays calm:** everything after the hero. Hairlines, plain rows,
reviews in their own words, no carousels.

**Visual DNA:**

- **Colour:** warm near-black, their logo's gold `#E2992A` as the only
  accent, cream text.
- **Type:** Playfair for display with one gold italic word; Be Vietnam Pro
  for body text (a Vietnamese typeface).
- **Materials:** steel, glaze, walnut, crema.

A note on the dark look: the bar is a morning place, while this look is
"after dark". It is your choice from the reference and stays, but the
renders keep morning-gold light, not night.

**Motion DNA:** slow, ease-out, 0.7–0.9 s fades; nothing loops except the
steam (with a pause button); no scroll-jacking beyond the one pinned hero.

**Transition DNA:** the hero sinks into the page (kept); pages share one
nav, with no page-change effects.

**Effects allowed:** the pour, the steam, the phin drip, soft reveals.
**Effects forbidden:** particles, neon, glass cards, cursor effects,
carousels.

## 6. Page architecture (kept, with small moves)

- **Home:** opening → three lines ending on the headline with **Get
  directions** → cà phê sữa đá (+ phin moment) → the name story (after Q
  confirms it) → what people say → find us and hours → footer.
- **Menu:** signature → espresso bar → and more → gift cards (prices when Q
  sends them).
- **Our story:** why Eleven, the hole in the wall, made by hand, reviews.
- **Visit:** address and door, map links, hours, call, email.

## 7. Interaction map

| # | Interaction | Trigger | Purpose | Mobile | Reduced motion / fallback | Test |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Opening pour | first open | first impression: coffee made fresh | portrait render | still and headline; poster after 2.5 s without video | opening checks in `tests/behave.cjs` |
| 2 | Three lines over the pinned scene | scroll | offer in three beats, ending on the CTA | same, words under the cup | headline only | beat and cup-clearance checks at 13 sizes |
| 3 | Steam loop with pause | after the pour | atmosphere | same | none | pause check |
| 4 | Hours with today highlighted (live "Open now" only once hours are confirmed) | load | "can I go now?" → directions | same | static table | 7 moments of the week |
| 5 | Phin drip (proposed) | section in view | the signature drink, unique to them | shorter crop | still frame | new check |

## 8. Mobile and performance

**Mobile:**

- a portrait render with the cup high and the words below it;
- a full-screen menu;
- 44 px targets throughout.

**Risks and fixes:**

- **Data-saver:** the hero video loads even when it is on. Proposed: respect
  Save-Data and reduced data, and show the poster only.
- **The two Facebook photos are 390 px** and look soft on phones: replace
  them when Q sends originals.
- **The page weight is fine:** about 0.6 MB of video per layout, poster
  first.

## 9. The coffee pour: two ways to make it more real

1. **Higgsfield AI video (photoreal).** Our render's frames are the first and
   last frame, so the framing and the hand-over stay exact:
   - desktop pour, Seedance 2.0 Mini at 720p: 5 credits;
   - phone pour: 5 more;
   - the steam loop stays ours, laid over a photoreal still: free.

   The account has 10 credits, enough for one layout at 720p. 1080p for both
   layouts needs a top-up (a 5 s 1080p clip on Seedance 2.5 is 80 credits).
2. **Keep improving our own render:** free, but it will always look like a
   very good render rather than footage.

The best way to look real is still a clip filmed in their shop.

## 10. Ready for creative approval?

**Yes, for you (Korvane)**: direction, changes and pour approach.
**Not yet for Eleven Cafē**: Gate 1 (facts) is open on still-open status,
hours, prices and the name story, so the site stays a private `noindex`
preview.

## 11. Exact next action

Reply with:

- **(a) Approve the changes:**
  - Get directions as the one primary button;
  - no live "Open now" until the hours are confirmed;
  - data-saver support;
  - the phin moment.
- **(b) Pick the pour:**
  - Higgsfield on desktop now (5 of your 10 credits);
  - both layouts after a top-up;
  - or keep the render.

Then I build, test (71 checks plus new ones) and push.

## 12. What was done (2026-10-14)

You answered: "no dont use higgfiled just useeverything from the blueprint i sent". So no Higgsfield credits were
used, and the pour stays our own render. Done:

- **(a), every change you were asked to approve:**
  - Get directions is the one filled button: the nav at every size, the phone menu, the end of the opening, Find
    us. See the menu is the outline button, the call a plain link.
  - No live "Open now": the hours show as Google lists them, today's row marked, "Call ahead to check before you
    go". The structured data carries no hours until Q confirms them (one switch, README "Gaps").
  - Data saver: with Save-Data or reduced data on, no video loads anywhere. The still and the three lines remain.
  - The phin moment: a rendered 4 s loop in the cà phê sữa đá section. It plays only while on screen, has a
    pause button, and shows a still with reduced motion or a data saver. Their real phin photo stays on Menu and
    Our story.
- **(b), the pour, our render made better:**
  - motion blur (each sample at its own moment in half a frame), so the stream streaks as on film;
  - a slow 6% push-in that ends exactly where the page expects;
  - round ends on the stream;
  - 6 samples a frame instead of 4.
- **QA:**
  - **Accessibility:** contrast, alt text, names, headings, focus at every Tab stop, reflow at 320 px and 200%.
    It found one real problem, now fixed: the headline and its buttons were hidden from screen readers until
    you scrolled.
  - **Search and AI visibility:** `SEO.md`, with the launch files in `launch/`.
  - **Vercel's interface guidelines:** one fix, the browser bar colour now matches the page.
  - The tests cover every one of these (README "Checked").

Still open, all for Eleven Cafē (Gate 1): still open at all? the hours, prices, the name story, photo originals.
The site stays a `noindex` preview until they agree.
