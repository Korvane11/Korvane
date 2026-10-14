# Pour My Coffee Co: blueprint first response

Written 2026-10-14 against the master blueprint the Korvane owner sent with
"https://www.pourmycoffeeco.com/ heres the wbsite i need you to make a better
one for". Every fact below was read directly this session (their Wix site,
rendered in a browser; their Instagram and Facebook pages; Google Maps; the
joe coffee directory). Nothing here is invented.

## 1. Execution mode

**Rebuild a live business site from scratch, as a private preview.** Their
current site is Wix (pourmycoffeeco.com). We build ours in
`sites/pour-my-coffee/`, plain static files like the other Korvane sites,
`noindex` on every page until Pour My Coffee Co approves it. Nothing about
their Wix site, domain, Google listing or socials is touched (Gate 6 and 7
are theirs).

## 2. The business and the main action

Pour My Coffee Co ("Pour") is an independent coffee shop in Rita Ranch, on
Tucson's east side, in the Safeway shopping center (Rita Ranch Shopping
Center) at 9136 E Valencia Rd, Ste 160. Espresso drinks and brewed coffee,
custom drinks, lemonade and milkshakes, pastries, sandwiches and snacks; open
early every day (6am on weekdays). Their own line on Instagram: "Your daily
coffee stop." Their About page: "a comfortable, relaxing environment ... for
all to enjoy", for "catching up on work, meetings or get togethers, and
dates".

Customers walk in. There is no online ordering (their Menu page says "COMING
SOON"; a directory's "Order online" button links back to that page).

- **Primary action: Get directions.** The visit is the sale.
- **Secondary: See the menu.**
- **Tertiary: Call** (520-849-5359), shown as a plain link.

## 3. Facts and conflicts

| Fact | Value | Source | Status |
| --- | --- | --- | --- |
| Name | Pour My Coffee Co; short form "Pour" | their site, logo, Instagram | verified |
| Address | 9136 E Valencia Rd, Ste 160, Tucson, AZ 85747 | Contact page; Google Maps (#160, "Located in: Rita Ranch Shopping Center") | verified |
| Where | Rita Ranch, at the Safeway shopping center | Location and About pages | verified |
| Phone | 520-849-5359 | site, Facebook, Google | verified |
| Email | PourMyCoffeeCo@gmail.com | Contact and Join Our Team pages, Facebook | verified |
| Hours | Mon-Fri 6am-5pm, Sat-Sun 7am-5pm | home page box, Instagram bio, joe coffee, Google ("Closes 5 PM" on a Wednesday) | **CONFLICT, see below** |
| Drinks | espresso, brewed coffee, lemonade, milk shakes; custom drinks | Location page; page title "Espresso Sandwiches Custom Drinks" | verified |
| Food | pastries, sandwiches, snacks "and more" | Location page, old home page | verified |
| Coffee | "carefully selected to be sourced from quality roasters", beans "grown by ethical farms", "always fresh" | About page (/about-us-1) | verified, their words |
| Food | "some of the best fresh ingredients" | About page | their words |
| Hiring | applications by form or résumé to the email; "Please do not call or walk in" | Join Our Team page | verified |
| Socials | instagram.com/pourmycoffeeco, Facebook page 100090196694802, x.com/PourMyCoffeeCo, tiktok.com/@pourtucson (empty) | site footer | verified |
| Menu and prices | not published | their Menu page: "COMING SOON" | **UNKNOWN** |
| Ratings | Google shows 4.8; joe coffee shows 4.7 from 236 Google and Yelp reviews | Google Maps, joe coffee | **not used**: two different numbers, and both belong to third parties |
| Reviews | real customer quotes exist (joe coffee, from Google and Yelp, mostly without names) | joe coffee | **NEEDS OWNER CONFIRMATION**: not published until Pour picks the quotes and we can attribute them |
| Owner, staff, opening date, roaster | none published | | **UNKNOWN** |

**Hours conflict.** The home page box, Instagram, joe coffee and Google all
agree on Mon-Fri 6-5, Sat-Sun 7-5, so the site shows that. But their Wix
footers disagree with each other: the home footer once said "M-F 6am - 6pm,
Sat-Sun 7am - 6pm", the Menu page footer says "M-F 6am - 7pm, Saturday 7am -
7pm, Sunday 7am - 4pm". These look like stale edits. Shown as 6-5 / 7-5, no
live "Open now" badge until Pour confirms (the same switch as Eleven Cafē:
`HOURS_CONFIRMED` in `js/site.js`).

**What their site gets wrong today** (the problems we fix): the home page is
a stock photo with the headline overlapping a small box; the menu, the
nav's most wanted page, is "COMING SOON"; the footer's Story, F.A.Q. and Our
Coffee links go nowhere; two leftover drafts (/home-full, /about-us) are
still public; hours disagree between pages; there is no address or map on
the home page; the TikTok icon in one footer links to Wix's own account.

## 4. Assets

| Asset | What | Class | Use |
| --- | --- | --- | --- |
| `Pour logo white.png` | their logo, 3365x1294, transparent: POUR, a cup with an S of steam, MY COFFEE CO | A | traced to SVG for the nav and footer, colour kept white or their teal; never redrawn |
| `Pour logo Black.png` | the same in black | C | source for the dark-on-light SVG |
| `Pour logo no cup white.png` | the lettering alone | C | not needed (the full logo reads at nav size) |
| `Coffee Cup round outline` (white and black), 2000 px | the cup mark in a ring | A | the favicon and app icons |
| `IMG_0875.jpg`, 640x480, iPhone 13 Pro Max, Feb 20 2023 | their storefront: white stucco, tile roof edge, agave, desert trees, "Pour My Coffee" on the door | B | the Location page and "find us" section; small, so shown at its size, never as a full-bleed hero |
| `Cappuccino_edited.jpg` | a cappuccino on white | F | the same image is in Wix's stock library ("Cappuccino", 11062b_ prefix): not theirs to move |
| espresso pull hero, coffee beans, croissant, grilled cheese, cappuccino, holiday backgrounds | Wix and Wix-licensed stock | F | excluded: Wix's licence keeps them on Wix |
| their Facebook, Instagram and Google photos | exist, behind log-ins or owned by customers | F | **ask Pour** for originals of their drinks, food, counter and room |

Missing, and covered by our own rendering (no stock, no photos of anyone):
the opening scene and the drink stills. Everything we render is a picture of
a drink, not a claim about their room.

## 5. Creative world

**Statement.** Pour is the neighbourhood's first stop of the day: the door
opens at six, the desert light comes in low through the trees out front,
and the first cup is poured. Bright, clean, unhurried, friendly. The
opposite of a dark espresso bar.

- First three seconds: a coffee shop in Rita Ranch, open early, come by.
- The first memorable moment: their own name, done. In early sun with the
  shadow of a desert tree across a pale oak table, milk is poured into an
  espresso in a white cup and a heart forms; steam rises into the sun, and
  their logo and the words come up beside the cup (never baked into the
  picture).
- Their thing: the pour itself (it is their name), the cup-and-steam mark
  they already own, and their storefront's white stucco, desert trees and
  agave in morning light.
- Scrolling should feel like a calm morning: light, room to breathe, short
  lines, nothing shouting.
- Valuable without dishonesty: their own words about sourcing and fresh
  ingredients, real hours, a real address, no stars or claims we can't back.
- Quiet, so the pour lands: plain type, one accent colour, no motion
  competing with the opening.

**Visual DNA.**
- Colour, from their logo and their building: their aqua `#a1d0d8` (sampled
  from their site header) as the brand field; a deep lagoon teal `#17575e`
  for text accents and the one filled button (aqua fails contrast with
  white text); a near-white with a cool cast `#f6f9f9` for the page; white
  stucco `#ffffff` for cards that need lifting; their espresso brown
  `#5d3708` (sampled from their old site) only in the renders. Dark mode:
  night teal `#0c1d1f` with the aqua as accent.
- Type: their logo carries the serif. The site sets in one family,
  Bricolage Grotesque (friendly, a little hand-made, wide at display sizes),
  with Figtree for body. No serif headlines, no gold, no italic accent words
  (Eleven Cafē's look stays Eleven's).
- Materials: white stucco, pale wood, glazed white porcelain, the aqua.
- Renders: daylight, soft desert shadows, white porcelain on a pale table.
- Shape: soft 14px corners on images and panels, pill buttons, hairlines
  between list rows.

**Motion DNA.** Calm and soft: ease-out, 400-700 ms; scroll reveals rise
12px and fade once, never repeat. Motion is never used to hide the CTA or
the hours. Reduced motion: no opening, the still poster, no reveals.

**Transition DNA.** The opening hands over without a cut: the last frame of
the pour is the hero's first; the hero copy fades in over it. Pages change
with a plain navigation (no fake SPA transitions).

**Effects DNA.** Allowed: the rendered opening, a slow steam loop under the
hero, soft reveals. Forbidden: dark mode as default, gold, glass, particles,
neon, parallax stacks, carousels, scroll snapping, a loader or skip button.

## 6. Architecture

Their nav is kept as it was (Menu, Location, About us). Four pages:

1. **Home** (`index.html`): the opening, then the hero (logo, "Your daily
   coffee stop.", Get directions + See the menu); what's poured (drinks and
   food, in their words); hours and where (the storefront photo, the
   directions link); their sourcing words; the final call (Get directions).
2. **Menu** (`menu.html`): what they serve, grouped (coffee, blended and
   cold, food), no prices, a plain note that prices and the full menu are
   at the counter until Pour sends them.
3. **Location** (`location.html`): address, directions, Google Maps, hours
   table, phone, email, the storefront photo, socials, a message form
   (mailto).
4. **About us** (`about.html`): their About text, the coffee and food lines,
   and Join our team (their rules carried over, a mailto form).

## 7. Interaction map

| # | Where | Trigger | What it does | Why | Mobile | Reduced motion | Fallback | Pass test |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | home opening | page load | the pour: light comes up, milk pours a heart, steam rises; the logo and hero copy fade in beside the cup at ~1.1 s | their name made visible, a memorable first moment | a portrait render (not the desktop one, smaller file) | skipped: the still and the copy at once | no video in 2.5 s, or data saver on: the poster | headline and both buttons are in the DOM at t=0, visible by 2.5 s, never under the cup |
| 2 | home hero | after the opening | a slow steam loop over the cup | keeps the cup alive, quietly | the portrait loop | still | poster | loop pauses when the hero is off screen |
| 3 | sections | scroll into view | soft rise and fade, once | reading order | same | none | content visible without JS | no content hidden with visibility or display |
| 4 | hours | page load | today's row marked | the most asked question answered | same | same | full table | the right row on a fixed date |
| 5 | forms | submit | validated mailto with a clear status line | contact without a backend | same | same | the email address is printed beside each form | the mailto URL is read from the request |

## 8. Mobile strategy and performance risks

Phone first: one column, a 44px+ tap size, a slim bottom bar with Directions
and Call on phones. The opening is rendered twice (landscape and portrait)
and the phone gets the portrait at a lower bitrate. Risks: the opening
video weight (target under 1.5 MB per layout), font weight (two families,
subset woff2, preloaded), and the third-party map (a link to Google Maps,
not an embed, so nothing heavy loads).

## 9. Ready for creative approval?

Gate 1 (facts and assets) is as ready as it can be without Pour: the gaps
are hours confirmation, the menu and prices, photos of their own, and which
reviews they would like quoted. None of them blocks a preview. Gates 2 and 3
are built together here as a private preview (`noindex`), the way the other
Korvane sites were; anything in sections 5-7 can change on the owner's word.

## 10. Next action

Build the four pages and the rendered opening, test them in Chromium at
phone and desktop widths, push the preview, and send the owner the link with
the questions for Pour.
