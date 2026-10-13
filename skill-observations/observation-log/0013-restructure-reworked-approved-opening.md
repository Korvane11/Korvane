---
id: 13
title: "Asked to split a site into pages and 'make it better in every way', the redesign reworked the home page's approved scroll story and nav labels too; the owner had to ask for the opening to be kept"
status: open
type: open-source
skill: [redesign-existing-projects]
proposes_skill: []
target_file: []
siblings_checked: "no family registry yet; design-direction skills read for a keep-the-signature-pieces rule: design-taste-frontend has it (Redesign - Preserve: 'Patterns to preserve - signature interactions, recognisable hero, copy voice', lines 811-829), impeccable has it ('Refinement preserves; redesign replaces', line 28); redesign-existing-projects has only 'Do not break existing functionality' (Rules), so the gap is there; high-end-visual-design has no redesign mode, does not apply"
area: "How This Works (Scan, Diagnose, Fix) and Rules"
date: 2026-10-13
session_context: "SimNow site: 'keep working on the simnow website refine it and make it better in every way you can have separate tabs for like booking and other stuff'; the follow-up was 'make sure you keep the same opening and the car and stuff and the same dashboard part when you first open the website'"
parked_until:
resolved:
resolution:
reference:
commands_verified: "run: diff of the story section of the pre-split index.html (commit 7efd2d1) against the split version: five chapters (Lights out, Rent by the hour, Every driver welcome, Race with Salem, Take it home) had become four (Every driver welcome and Race with Salem replaced by We bring the race), each with an added link, story height 640vh to 540vh; nav labels Prices, Events, Gear, Contact had become Experience, Events, Gear, Visit; after restoring, a test asserts the six original headings and the nav labels"
---

**Issue:** The request had two parts:
- a concrete one: split the long page into separate pages ("tabs");
- a broad one: "make it better in every way".

I read the broad part as permission to rework the home page too. As
well as moving sections out to the new pages, I:
- cut its scroll story from five chapters to four, rewriting one;
- added a link to each chapter;
- renamed the nav (Prices / Contact became Experience / Visit).

The owner had already seen and accepted that opening: the intro, the car,
the first screen and the story. The intro and the car clip I did keep, and
I re-proved them (observation 0005's lesson). The story and the nav I
treated as fair game, and the report didn't say they had changed. The
owner's next message asked for the opening and "the same dashboard part"
to be kept, so they had either noticed or worried. Putting it back took
one turn: a diff against the commit before the split.

**Suggested improvement:** In redesign-existing-projects, How This Works,
step 1 (Scan):
- **Write a keep list:** the pieces the client has already seen and
  approved, such as an intro, the hero, a signature scroll sequence and the
  nav labels.
- **Freeze them:** a broad mandate ("make it better", "refine everything")
  does not cover the keep list. Change an item only when the request names
  it, or after asking.
- **Report against it:** in the closing report, say for each keep-list
  item "unchanged", or what changed and why.

Add to Rules: "Restructuring is not permission to rework approved pieces;
keep them byte-for-byte unless the request names them."

design-taste-frontend's "Redesign - Preserve" mode and impeccable's
"Refinement preserves" already say this; redesign-existing-projects is the
skill used for exactly this kind of job, and it has nothing like it.

**Principle:** The broader the mandate, the more explicit the list of what
it does not touch has to be. A client who approved something treats it as
settled, so changing it without saying so reads as a loss even when each
change is defensible.
