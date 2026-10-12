---
id: 11
title: "The redesign audit checks that share tags and a favicon exist, not that they work: a relative og:image and a squashed wide-logo favicon both passed, and the URL actually shared (a redirect page) had no tags at all"
status: open
type: open-source
skill: [redesign-existing-projects]
proposes_skill: []
target_file: []
siblings_checked: "no family registry yet; grepped the design-direction skills for og:image and favicon checks: only redesign-existing-projects has them (Iconography 'Missing favicon', Code Quality 'Missing meta tags'); design-taste-frontend, impeccable and high-end-visual-design have no meta or icon check at all, so there is nothing in them to tighten; checked, gap sits in redesign-existing-projects"
area: "Design Audit: Code Quality 'Missing meta tags' and Iconography 'Missing favicon'"
date: 2026-10-12
session_context: "SimNow site: the owner asked 'what else could I do to make this even better'; an audit of the live site against the skill's checklist"
parked_until:
resolved:
resolution:
reference:
commands_verified: "run: grep of sites/simnow/index.html head: og:image content=\"assets/og.jpg\" (relative), no og:url, no canonical; the icon and apple-touch-icon are assets/simnow-logo.png, 400x226 (not square); grep of the design-direction skills for og:image and favicon: only redesign-existing-projects lines 111 and 124"
---

**Issue:** The site had every item the checklist asks for:
- a title, a description and `og:image`;
- a branded favicon.

So the audit's presence checks passed it. But two of those items don't do
their job:
- **Share image:** `og:image` was a relative path. The Open Graph spec and
  the major link-preview crawlers need an absolute URL, so a shared link
  can come up with no picture. That matters here, because the owner sends
  the link around by text.
- **Favicon and home-screen icon:** both were the business's wide oval
  badge (400x226). Browsers fit it into a square, so at 16-32 px it is an
  unreadable smear.

Both problems surfaced only when the files were opened and the values
read, not from a "present / missing" pass.

**Suggested improvement:** In the Design Audit, turn the two presence
checks into validity checks:
- **Meta tags:** `og:image` and `og:url` are absolute URLs on the final
  domain, a canonical link exists, and the image is about 1200x630.
- **Favicon:** the icon is square (with a 180x180 `apple-touch-icon`), is
  legible at 32 px, and is not just a wide logo scaled down. Wide marks
  need a square crop or a monogram.

Add one line to Rules: re-check absolute URLs whenever the site moves to
a new domain.

**Principle:** A checklist item that asks "is X present?" passes a broken X.
For anything consumed by another system (crawlers, browsers, home screens),
the check has to read the value and test it against what that system
accepts.

**Follow-up (same day, while fixing it):** The worse gap was on a page the
audit never looked at. The address that actually gets shared is the
repository root, a redirect page that forwards to the site. It had no
preview tags at all, and its title was the repository's name. So every
shared link previewed as that name, with no picture, however good the
site's own tags were. The meta check should therefore start from the URL
people share and follow redirects, not from the page being redesigned.
