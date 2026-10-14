---
id: 14
title: "Rebuilding a site-builder site: its photos were the builder's own stock (licensed for that platform only) and its Book Now buttons were dead; reading the pages showed neither, and the redesign audit has no step for either"
status: actioned
type: open-source
skill: [redesign-existing-projects, design-taste-frontend]
proposes_skill: []
target_file: ["prompts/site-blueprint.md"]
siblings_checked: "no family registry yet; redesign-existing-projects (Design Audit read: 'Dead links' covers href='#' only, Iconography 'Stock diverse team photos' is about taste, nothing on asset licence or testing the old site's flows) added as primary; design-taste-frontend §11.B 'Audit Before Touching' (read: content blocks, patterns to retire including 'dead links', no licence or flow check) added; impeccable excluded: it audits the build in hand, not a third-party source site, assumed, not read; the project blueprint (prompts/site-blueprint.md, 'Carry over everything their current site offers') named in target_file because it tells the builder to carry things over without saying to check them first"
area: "Design Audit / §11.B Audit Before Touching: what to verify on the current site before carrying it over"
date: 2026-10-13
session_context: "New client site for a Tucson cleaning company, rebuilt from its Wix site ('keep all their info but just make their website way better')"
parked_until:
resolved: 2026-10-13
resolution: "Staged in prompts/site-blueprint.md (patch staged at skill-updates/2026-10-13/_target-files/prompts/site-blueprint.md.patch) ('Carry over everything ... that works and is theirs to move'); cross-cutting principle 3. redesign-existing-projects, design-taste-frontend: not edited, foreign-maintained."
reference: "sites/rc-cleaning/README.md, 'What their site had that this one doesn't' and 'Photos'"
commands_verified: "run: Playwright crawl of all seven pages; image URLs on static.wixstatic.com/media without a site prefix (74e6c854..., 3b65f3e3..., a4bb5686..., 1c8e62f8..., 64a3fe0d...) are Wix's free media library, alt text 'Warm Interior', 'Scrubbing the Sink' etc; the one uploaded image (d9ba69_..~mv2.jpg, 249x203) is a generic lobby. run: clicking 'Book Now' on each of the three service pages showed 'Sorry, this service is not yet available for online bookings. Please contact us for more information.'"
---

**Issue:** The brief was "keep all their info but make it way better". The
pages' text, links and images were all read. Two problems only showed up
when I checked further:

- **The photos weren't theirs to move.** Five of the six were Wix's free
  media library, which Wix licenses for use on Wix sites only. The sixth
  was a 249 px web image of a generic lobby. Carrying "all their info"
  over would have put another company's licensed stock on a non-Wix site.
  The filenames give it away: stock files have no site prefix, while files
  a site uploaded carry a prefix and `~mv2`. A reader of the page sees only
  pleasant photos.
- **The booking flow was dead.** Every "Book Now" opened "Sorry, this
  service is not yet available for online bookings." Read as text, the
  site offers online booking. A redesign that "keeps" it would link to a
  broken flow, or rebuild a feature the business never had working.

The skill's audit has neither check. Its "Dead links" item covers buttons
that link to `#`. Its stock-photo item is about taste ("uncanny"), not
licence. The project's blueprint says "Carry over everything their current
site offers" without saying to check each thing first.

**Suggested improvement:** Add an "Inventory the current site" step to
redesign-existing-projects' Scan (and to design-taste-frontend §11.B):
- **Assets:** for each image, video and font, record where it came from
  and whether it can move. A site builder's bundled media (Wix, Squarespace
  and Webflow libraries) usually can't leave the platform. Images the
  owner uploaded need the owner's word.
- **Flows:** run each conversion path end to end in a browser: booking,
  forms, chat, checkout. Record what actually happens, and carry over the
  working result, not the label on the button.
- **Report:** list what can't move, and what replaced it.

In the blueprint, change "Carry over everything" to "Carry over everything
that works and is theirs to move; list the rest".

**Principle:** A redesign inherits the old site's obligations along with
its content. Before carrying anything over, check that it's yours to move
(licences) and that it does what it says (flows). Text on a page can't tell
you either.
