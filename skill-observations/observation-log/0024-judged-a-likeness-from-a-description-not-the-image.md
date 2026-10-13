---
id: 24
title: "A 3D cup meant to match the owner's photo was checked against a summary's words about the photo, not the photo: after a context compaction the image was gone, the words ('speckled, brown rim') fit the wrong model, and the owner had to ask again"
status: open
type: open-source
skill: []
proposes_skill: [scroll-film-renders]
target_file: ["prompts/site-blueprint.md"]
siblings_checked: "reuses the open candidate scroll-film-renders (0001, 0002, 0005, 0008, 0009, 0019, 0021, 0022, 0023) for rendered footage made to a reference; image-to-code checked by description: it builds pages from generated design images and cannot run here (CLAUDE.md, Skills), assumed not to cover this, not read; the site blueprint named in target_file, where this project's lessons for client sites go; checked"
area: "Matching a model, render or page to a reference image the client sent"
date: 2026-10-13
session_context: "Eleven Cafē site: the owner sent a photo of a stoneware mug for the opening scene; the conversation was compacted before the model was previewed"
parked_until:
resolved:
resolution:
reference: "sites/eleven-cafe/render/pour.html (sdSide, sdHandle and the glaze, rebuilt from the photo's measurements); CLAUDE.md, Eleven Cafē section (the owner's second message)"
commands_verified: "run: the owner's image extracted from the session transcript (the user message's base64 image block) and viewed: a bright white glossy glaze with very fine sparse specks, a round bowl without a foot, a thin tan lip; the first model was cream with large dense flecks and a foot ring. run: the photo enlarged with a 20 px grid; rim, base and side measured (height 0.49 of the rim's width, base 0.44, a near quarter ellipse); the rebuilt model previewed beside it"
---

**Issue:** The owner sent a photo of a mug: "Use this mug for the website
instead of the one your using". The first model was written, then the
conversation was compacted. The summary described the photo in a phrase
("speckled white stoneware cup, wide round bowl, loop handle on the right,
thin raw brown rim, brown speckles"), and the previews were checked against
that phrase. They matched it: the render had speckles, a brown rim and a
loop handle. They did not match the photo: the photo's glaze is bright
white and glossy with specks so fine they nearly vanish, and the bowl is
rounder with no foot. The owner replied "Change the mug / To the picture I
sent". The image was still recoverable from the session transcript, and
once it was on screen beside a render, every difference was obvious in
one look.

**Suggested improvement:**

- Candidate skill (rendered footage made to a reference): save every
  reference image the client sends into the workspace at once, and compare
  each preview with it side by side, at the same angle where possible.
  Measure proportions on the image (a grid overlay works) rather than
  estimating them.
- Site blueprint, "Checks that count": a likeness check is a side-by-side
  with the reference, never a check against a description of it. After a
  compaction or in a new session, get the image back first (from the
  workspace or the transcript) before judging anything against it.

**Principle:** A description of a reference keeps the features someone
thought to name and drops the rest, so a check against it passes whatever
fits those words. Judge likeness against the reference itself, and keep
the reference somewhere that survives the conversation.
