---
name: animation-styles
description: "Twenty web animation and art styles, each with a tested, dependency-free demo to lift code from: particles, liquid morph, holographic foil, neon glow, wireframe 3D, glassmorphism, kinetic type, isometric, clay 3D, ASCII art, gradient mesh, comic book, split-flap, retro VHS, halftone, Bauhaus, pixel art, blueprint, art deco and neo-brutalism. Use it whenever someone names one of these looks, asks for a crazy, eye-catching or 'wow' animation, an animated hero, background, logo, headline or loading moment, or wants a page or component to feel retro, futuristic, techy, playful, luxurious or raw, even if they never say 'animation style'. Also use it to choose a style that fits a brand before building one."
license: MIT
metadata:
  author: Korvane and contributors
  source: github.com/Korvane11/Korvane
---

# Animation styles

Twenty visual styles for websites, each with a working demo and notes on
how to use it well. The demos are the recipes: self-contained HTML files
(no libraries, no network), checked in a real browser on desktop, on a
phone and with reduced motion. Pick a style, read its notes, open its
demo, and carry the technique into the project. Adapt it to the project's
brand and content; don't paste a demo in wholesale.

This skill needs no network: nothing here fetches anything.

## How to use it

1. **Pick the style.** If the person names one, use it. If they describe a
   feeling ("make it feel premium", "something retro"), use the mood table
   below and suggest one or two, saying why. For a real business, the style
   has to serve the brand and the content, not show off the effect.
2. **Read its entry** in `references/styles.md`: the look, what it's good
   for and when to avoid it, what type and colour suit it, the technique,
   the values that make it work, the cost, and the pitfalls. (That file is
   built from the demo headers by `scripts/build-reference.py`.)
3. **Open its demo** in `assets/demos/` (the header comment summarises the
   technique, the knobs and the costs). `assets/demos/thumbs/` has a still
   of each, and `assets/demos/index.html` shows all twenty side by side.
4. **Adapt it**: the brand's colours and type, real content, the right
   size and place on the page. Keep the key values unless there's a reason
   to change them; they're what makes the look work.
5. **Check it the way the demos were checked**: no console errors, looks
   right on a 390px phone and on desktop, a finished still frame with
   reduced motion, and it actually moves. `scripts/check-demos.cjs` does
   this for the demos (it needs Node, Playwright and Chromium); reuse its
   approach for the project's own page.

## The twenty

| # | Style | What it looks like | Core technique | Demo |
|---|---|---|---|---|
| 01 | Particles | Thousands of fine points that gather into a word and drift apart | Canvas 2D, text sampled from an offscreen canvas, flow field | `01-particles.html` |
| 02 | Liquid morph | Blobs that merge and split like mercury | SVG blur + alpha-threshold "gooey" filter | `02-liquid-morph.html` |
| 03 | Holographic | Iridescent foil card whose sheen follows the pointer | Layered gradients, blend modes, tilt | `03-holographic.html` |
| 04 | Neon glow | Glass-tube sign that powers on, with light on the wall | Monoline SVG paths stroked four times (halo, bloom, tube, core), one flicker | `04-neon-glow.html` |
| 05 | Wireframe 3D | Rotating line-drawn mesh, like ink on grid paper | Hand-built mesh, 3D projection in canvas 2D | `05-wireframe-3d.html` |
| 06 | Glassmorphism | Frosted cards over moving colour | `backdrop-filter`, light inner border | `06-glassmorphism.html` |
| 07 | Kinetic type | Big type that rises, swaps and shifts | Letters split into spans, staggered transforms | `07-kinetic-type.html` |
| 08 | Isometric | A small block world building itself | 2:1 isometric projection, three-tone faces | `08-isometric.html` |
| 09 | Clay 3D | Soft matte shapes that bob and squash | WebGL raymarched SDF shapes, matte light, soft shadows | `09-clay-3d.html` |
| 10 | ASCII art | A 3D shape drawn in text characters | Luminance mapped to a character ramp | `10-ascii-art.html` |
| 11 | Gradient mesh | Slow, drifting colour fields with grain | WebGL: colour points blended in linear light, domain-warped, grain | `11-gradient-mesh.html` |
| 12 | Comic book | Inked panels, halftone shading, a "POW" burst | Bold strokes, dot patterns, overshoot pop | `12-comic-book.html` |
| 13 | Split-flap | Departure-board tiles flipping to a message | 3D `rotateX` half-tiles on a hinge | `13-split-flap.html` |
| 14 | Retro VHS | Tape playback: scanlines, RGB split, tracking noise | WebGL pass over a painted scene: chroma bleed, RGB offset, rolling band | `14-retro-vhs.html` |
| 15 | Halftone | Dot screen whose dots swell with light | Dot grid sized by a moving shape, rotated screen | `15-halftone.html` |
| 16 | Bauhaus | Primary-colour shapes composing on a grid | One morphing quad (radius per corner) per cell, canvas | `16-bauhaus.html` |
| 17 | Pixel art | Crisp low-res scene with stepped motion | Tiny canvas scaled up, `image-rendering: pixelated` | `17-pixel-art.html` |
| 18 | Blueprint | White technical drawing drawing itself on blue grid | SVG stroke-dashoffset, dimension lines | `18-blueprint.html` |
| 19 | Art deco | Gold sunburst and stepped frame, metallic sheen | Symmetric canvas line draw-in, `source-atop` sheen | `19-art-deco.html` |
| 20 | Neo-brutalism | Thick outlines, hard shadows, buttons that press | Offset shadows that collapse on press, marquee | `20-neo-brutalism.html` |

## Choosing by mood

| The brief says | Reach for | Also fits |
|---|---|---|
| Premium, product launch, calm luxury | Gradient mesh, glassmorphism | Art deco, holographic |
| Futuristic, tech, AI, data | Particles, wireframe 3D | ASCII art, holographic |
| Night, speed, cars, gaming, music | Neon glow, retro VHS | Particles, kinetic type |
| Playful, friendly, kids, consumer apps | Clay 3D, liquid morph | Neo-brutalism, isometric |
| Retro, nostalgic | Retro VHS, pixel art | Split-flap, halftone, comic book |
| Editorial, bold, confident | Kinetic type, Bauhaus | Neo-brutalism, halftone |
| Engineering, architecture, process | Blueprint, isometric | Wireframe 3D |
| Luxury, hospitality, events, old glamour | Art deco | Gradient mesh |
| Travel, transport, schedules, countdowns | Split-flap | Kinetic type |
| Indie, startup, loud and honest | Neo-brutalism | Comic book, Bauhaus |

## What every style has in common

These rules come from building and checking all twenty, and from a site
owner who rejected an effect as "tacky". Each one has a reason:

- **One hero effect per page.** A style carries a page when it has the
  stage to itself. Stacking several reads as a demo reel, not a brand.
  Pair a hero style with quiet sections, or with a second style that's
  plainly secondary (see Combining).
- **Content stays readable.** The effect sits behind or beside the words,
  never across them at full strength. Check contrast on the busiest frame,
  not the calmest.
- **Restraint reads as quality.** Soft, layered glows instead of hard
  boxy ones; one flicker, not continuous blinking; a small palette; easing
  with weight. Cheap versions of these styles all fail the same way: too
  much, too fast, too bright.
- **Reduced motion gets a designed still.** With `prefers-reduced-motion:
  reduce`, show a finished, good-looking frame: never a blank or
  half-drawn one, and never the animation anyway.
- **Phones are first-class.** Touch has no hover, so anything that follows
  the pointer also needs motion of its own. Scale particle counts and
  shader resolution to the screen, cap canvas pixel ratio at 2, and check
  a 390px-wide screen for overflow.
- **Pay only for what's on screen.** `requestAnimationFrame` already
  pauses in hidden tabs. For effects lower down a page, stop the loop when
  an IntersectionObserver says the element is off screen.
- **No dependencies by default.** Every demo is plain HTML, CSS and JS. If
  the project already uses GSAP or Three.js, use them for timelines or
  real 3D (the `gsap-*` and `threejs-*` skills); otherwise don't add a
  library for one effect.

## Combining styles

Pairs that work, because one leads and one supports: gradient mesh behind
glassmorphism; blueprint grid under a wireframe 3D object; halftone
shading inside comic book panels; retro VHS over neon glow; kinetic type
over almost any calm background. Pairs that fight: two glow styles at once
(neon plus holographic), two 3D treatments (clay plus isometric), or
anything busy behind particles.

## Related skills

- `ui-ux-pro-max`: palettes, font pairings and style descriptions to
  match a chosen style to a brand.
- `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`: sequencing these
  effects or tying them to scroll.
- `threejs-*`: when a style needs real 3D models, lighting or post effects.
- `industrial-brutalist-ui`: a full brutalist interface system, beyond the
  neo-brutalism component look.
- `lightweight-3d-effects`: Vanta, Zdog and tilt effects as alternatives.

## Feedback on this skill

If a demo breaks in a browser, looks cheap, or a style is missing, say so
and fix the demo rather than working around it in the project. Then rerun
`scripts/check-demos.cjs NN --thumbs` (checks it and refreshes its still)
and `python3 scripts/build-reference.py` (if its header changed).

---
The list of twenty comes from a short-video roundup of "Claude animation
styles"; the notes and demos here are original and tested. Korvane and
contributors | MIT
