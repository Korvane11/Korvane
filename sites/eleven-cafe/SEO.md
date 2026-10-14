# Eleven Cafē: search and AI visibility

Checked 2026-10-14 on the four pages in this folder (the private preview) and on the open web. The aim is that
search engines and AI assistants can reach the site, read it, and get Eleven Cafē's facts right. Nobody can make
an assistant recommend a business, so nothing here tries to.

**The one-line version:** the site itself reads cleanly. What decides whether people find Eleven Cafē is
outside it: the hours nobody has confirmed, and the listings that the search results come from.

## Fix these five, in order

1. **Confirm the hours with Q, then publish them everywhere at once.** High impact, about 15 minutes with Q.
   - Asked "Eleven Cafe Tucson hours", the web search found no posted hours for them anywhere.
   - The site shows Google's listing, Monday to Friday 7am to 2pm, with "call ahead".
   - Once confirmed: README "Gaps and questions" (`HOURS_CONFIRMED`, and the hours back in the structured
     data), Google Business Profile, Facebook.
2. **Google Business Profile: Q claims or checks it.** High impact, about 30 minutes for Q.
   - Hours and category to check.
   - The site's address once it is live.
   - Assistants and Maps read it before anything else. Only the owner can claim it.
3. **At launch, take the site off `noindex` and put the launch files at the domain's root.** High impact, small.
   - The files are in `launch/`.
   - `robots.txt` lets every crawler in. That is a choice for Eleven Cafē: blocking AI crawlers is possible,
     but would keep assistants from reading their facts.
   - `sitemap.xml` lists the four pages.
   - `llms.txt` describes the café in plain words. It is a young convention, not a standard.
   - Every page carries `noindex` today, as agreed, so nothing is indexed before they approve.
   - Then re-point the share URLs, the canonicals and `hasMenu` to the new address (README, "Files").
4. **Link the new site from their listings.** Medium impact, small.
   - The listings: Facebook, the Downtown Tucson Partnership listing (downtowntucson.org/go/eleven-cafe) and
     Google.
   - The searches below found them through those listings and Wanderlog, which copies Google's.
5. **Is it still open?** High impact.
   - Their last Facebook post is from 2020.
   - The site must not go live, or tell anyone they are open, before Q confirms (BLUEPRINT-REVIEW, Gate 1).

## What an assistant sees today

These were asked on 2026-10-14 through a web search. Results vary from run to run and are not a ranking.
Repeat them monthly to see the direction.

- **"Eleven Cafe Tucson 33 N Stone Ave"**
  - Found them, through the Downtown Tucson Partnership listing ("Eleven Café") and Wanderlog.
  - The address and phone match the site exactly.
- **"Vietnamese iced coffee downtown Tucson espresso bar"**
  - Named Eleven Café first, citing the tucson.com article (2021) and Wanderlog.
  - Also named Café Thắng, on S. Sixth Ave, which is not downtown.
- **"Eleven Cafe Tucson hours open"**
  - No hours found for them. It suggested calling or checking Google.

## Done on the site (2026-10-14)

- **Structured data** (`index.html`): CafeOrCoffeeShop with name, address, phone, email, price range, cuisine,
  Facebook. Added:
  - `alternateName` "Eleven Cafe" and "Eleven Café", the spellings in the listings and in searches;
  - `hasMap` and `hasMenu`.
  - No hours until they are confirmed. No ratings: Google ignores a business's own review markup, and the reviews
    are Facebook's.
- **Descriptions:** the home and Menu descriptions now say "Vietnamese iced coffee", the words people search for,
  next to "cà phê sữa đá".
- **Already in place:**
  - one h1 per page, unique titles under 60 characters, descriptions under 155;
  - alt text on every image;
  - the same name, address and phone on every page;
  - all content in the HTML, nothing that needs JavaScript to read;
  - canonical URLs and share tags.

## Appendix: smaller things, none urgent

- A `Menu` schema on the Menu page (sections and items, no prices). It adds little until prices exist.
- `geo` coordinates in the structured data, only from a source that gives them (Google Business Profile once
  claimed). They are not guessed from the address.
- Their two Facebook photos are 390 px wide. Originals from Q would make the share previews and the pages sharper.

**Recheck:** 30 days after launch, the same three searches. Search and assistants pick up changes slowly; nothing
shows sooner.
