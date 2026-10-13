# RC Cleaning website

A new site for RC Cleaning, a residential and commercial cleaning company in
Tucson, Arizona, run by Rosa. Built 2026-10-13 from their current Wix site
(https://rccleaningtucson.wixsite.com/website), keeping all of its
information. The owner (Korvane) asked to "keep all their info but just make
their website way better ... similar to how we made simnow a better one but
make it unique".

Not yet approved by RC Cleaning: every page carries
`<meta name="robots" content="noindex">` so search engines don't list it
next to their real site. Remove it at launch.

## Run it locally

```bash
cd sites/rc-cleaning
python3 -m http.server 8000
# open http://localhost:8000
```

`?skip` skips the opening wipe on the home page, `?intro` plays it even if
it already played this visit.

## Content from their current site

Read directly on 2026-10-13 (all seven pages: Home, Book Online, About,
Hours and the three service pages).

- **Name:** RC Cleaning, "Residential and Commercial Cleaning". Licensed and
  insured. Tagline: "Local People. Great Service."
- **Owner:** Rosa ("Rosa, owner of RC Cleaning Services", from their review).
- **Since:** 2016 ("Since opening our doors for first time in 2016").
- **Phone:** 520-833-0865. Their main button: "Call for a free estimate".
- **Email:** rccleaningtucson@gmail.com (header, footer). Their contact
  section and service pages spell it rcccleaningtucson@gmail.com (three c's);
  that looks like a typo, so this site uses the two-c address. Ask them.
- **Hours:** Mon - Fri 8am-8pm, Sat & Sun 8am-8pm (every day, 8 to 8).
- **Services:** house cleaning, window cleaning, commercial cleaning. Each is
  a free 1-hour consultation at the customer's place, with free in-home
  estimates. Their copy for each is kept (one typo fixed: "to big" became
  "too big").
- **Review:** one, from Avery Smith, kept word for word.
- **Contact form:** Name, Email, Subject, Message (kept, same fields).
- **Address:** their service pages list 3286 S Kennedy Park Hills Pl, Tucson,
  AZ 85713. Not shown on this site: it looks like a home address and
  customers don't visit it (they clean at the customer's place). Ask them.

### What their site had that this one doesn't

- **Online booking.** Their "Book Now" buttons don't work: each one says
  "Sorry, this service is not yet available for online bookings. Please
  contact us for more information." This site replaces them with a
  consultation request form (it opens the visitor's email app, addressed to
  RC Cleaning, with everything filled in) and the phone number.
- **The Wix chat bubble.** Wix-only.
- **Social links.** The Facebook, X and LinkedIn icons on their site point to
  Wix's own accounts (a template leftover), not RC Cleaning's. Dropped; add
  theirs if they have any.
- **Photos.** Their photos are Wix's free media library, licensed for Wix
  sites only, plus one small web image (a lobby). Not reused. See Photos.

## Design note

1. **The moment to remember:** the home page opens on dusty glass over a
   Tucson sunset, and a squeegee wipes it clean in three strokes, the way a
   window cleaner does. It's their service shown, not described, and the
   line their customer wrote about them ("cloudy for months ... shine") is
   the same story. It runs once when the site is opened (about 2 s), never
   again while moving between pages.
2. **What stays quiet:** everything after it. Plain type, one accent, no
   other motion beyond things fading in as they scroll into view.
3. **Colour:** from their current site and the photo. Ink blue `#18213f`
   (their blue, deepened: text, the footer), terracotta `#b4503c` (their
   brick red, the one accent: buttons and links), a cool white `#f5f7fa`
   (the page: clean, not cream), and the sky's soft pink only inside photos.
4. **Type:** Bricolage Grotesque for headings (friendly, a little
   hand-made, local), Figtree for everything else (clear at small sizes).
5. **Motion:** short and eased (0.6-1 s, ease-out). Motion only shows a
   change (the wipe, a section arriving); it never loops or decorates.
   Reduced motion: no wipe, nothing moves.
6. **Photos:** two public-domain photographs of Tucson by Carol M.
   Highsmith (Library of Congress): one sunset saguaro, one aerial of
   downtown with the Santa Catalina Mountains. Same place, same light. Their
   own photos (Rosa, the team, before-and-after) would be better still.
7. **Phones:** the hero becomes a tall crop centred on the saguaro, and a
   bar at the bottom of the screen keeps "Call" and "Book online" under the
   thumb.

## Pages

Their nav labels are kept: Home, Book Online, About, Hours.

| Page | Purpose | Main action |
| --- | --- | --- |
| `index.html` | Who they are in five seconds: the wipe, the tagline, services, the review, the contact form | Call for a free estimate |
| `book-online.html` | The three services and a consultation request form | Book online (the form) |
| `about.html` | Their story since 2016, Rosa, what they stand behind | Call for a free estimate |
| `hours.html` | Every day 8 to 8, open-now status, phone, email, the contact form | Call |

## Files

| Path | What it is |
| --- | --- |
| `index.html`, `book-online.html`, `about.html`, `hours.html` | The pages |
| `styles.css` | Every style, tokens at the top |
| `js/site.js` | Every page: menu, reveals, the email forms, open-now status (Tucson time), the year |
| `js/home.js` | Home only, loaded by `site.js`: runs the wipe when the inline script in the page head says to |
| `js/wipe.js` | The home page's opening: dusty glass wiped clean (canvas 2D) |
| `assets/photos/` | Web versions of the two Highsmith photos, made by `render/export_photos.py` (see Photos) |
| `assets/fonts/` | Bricolage Grotesque and Figtree (latin subsets, woff2) with their OFL licences |
| `assets/icons/` | Phosphor icons (MIT), inlined into the pages |
| `assets/brand/` | The favicon, home-screen icons and link-preview image |

## Photos

Both by Carol M. Highsmith, from the Library of Congress Prints and
Photographs Division, Carol M. Highsmith Archive. She placed the archive in
the public domain ("No known restrictions on publication"); the footer
credits her anyway.

- `LC-DIG-highsm-55932`: sunset saguaro in the Sonoran Desert near Marana,
  north of Tucson (2018703854). Hero, phone hero, window card, link preview.
- `LC-DIG-highsm-55770`: aerial view of Tucson from Tucson Mountain Park,
  with the Santa Catalina Mountains (2018703692). Commercial card, About.

Exports were made from the original TIFFs, downscaled with Lanczos, saved as
WebP (served first) and JPEG.

## Licences

Bricolage Grotesque and Figtree: SIL Open Font License 1.1
(`assets/fonts/OFL-*.txt`). Phosphor icons: MIT
(`assets/icons/LICENSE-phosphor.txt`). Photos: public domain (above).

## Still needed from RC Cleaning

- Whether this replaces their Wix site, and on which domain.
- Which email is right (two c's or three).
- Whether to show the street address.
- Their own photos, a logo if they have one, any more reviews (real ones,
  never invented), and their social links.
