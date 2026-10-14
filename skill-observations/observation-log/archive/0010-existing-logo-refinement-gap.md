---
id: 10
title: "'Make the logo look better' for a client with an existing raster badge: the design skill's logo route only generates new logos, so cleaning up the existing one had no procedure"
status: actioned
type: open-source
skill: [design]
proposes_skill: []
target_file: [references/logo-design.md]
siblings_checked: "no family registry yet; design (SKILL.md Logo Design section and references/logo-design.md, read: generation via Gemini, Atlas Cloud or MuAPI only; 'Responsive/Adaptive' appears only as a style name); brand and brandkit descriptions read: identity guidelines and image-generated brand boards, neither covers vectorising or small-size variants of an existing mark; checked, gap sits in design"
area: "logo work for an existing client brand: vectorising and small-size variants"
date: 2026-10-12
session_context: "SimNow site: the owner asked to 'make the company logo look better'. SimNow's logo is a 585x330 raster oval badge (an F1 car behind the SIMNOW lettering), shown at 30 px tall in the nav, where neither the car nor the name could be read"
parked_until:
resolved: 2026-10-13
resolution: "Staged in prompts/site-blueprint.md (patch staged at skill-updates/2026-10-13/_target-files/prompts/site-blueprint.md.patch) ('Their logo is theirs. Present it better first...'). design and its references/logo-design.md: not edited, foreign-maintained (claudekit)."
reference: "sites/simnow/render/trace_logo.py; sites/simnow/assets/simnow-wordmark.svg"
commands_verified: "run: trace_logo.py traced the badge's own lettering into a 25 KB SVG (colour scores per pixel, 8x bicubic upsample, Gaussian blur, potrace); rendered at 16x beside the original and at 20-28 px, where it read clearly and the badge did not; run: potracer's Bitmap fills the False pixels of a numpy mask, so the first trace came out inverted"
---

**Issue:** The request was to improve an existing real-business logo on its
website, not to create a new one. The design skill's only logo route
generates new logos with an AI image API, and that needs an API key. So the
skill offered:
- nothing for vectorising a client's raster logo;
- nothing for deriving a small-size variant (the lettering alone) from a
  detailed badge;
- no minimum-size rule for placing it.

The problem in practice was size. A detailed emblem shown at 30 px is a
blur. The fix was a responsive pair:
- **Nav:** the badge's own lettering, traced to vector.
- **Footer:** the full badge, at 92 px where it reads.

A generated "better" logo would have changed a real business's identity
without the business asking for it.

**Suggested improvement:** Add a "refine an existing logo" route to
`references/logo-design.md`, ahead of generation:
1. **Diagnose:** is the issue the mark itself or how it's displayed (size,
   resolution, background)? Changing the mark itself is the brand owner's
   call.
2. **Vectorise faithfully:** separate the elements by colour, upsample,
   blur slightly against compression noise, cut at half strength, then
   trace with potrace. Note: potracer fills the False pixels of a numpy
   mask, so invert it.
3. **Make a responsive set:** full emblem at large sizes; lettering only
   (or a symbol) below about 40 px tall.
4. **Sample the fills** from the original rather than picking near
   colours. The first guess here was visibly too orange.

**Principle:** When the logo belongs to a real client, "look better" first
means "present it better". Fix the size, resolution and variant before
changing the design, because the design is theirs.
