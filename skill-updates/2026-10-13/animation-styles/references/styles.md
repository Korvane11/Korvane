# Style notes

Generated from the header of each demo by `scripts/build-reference.py`; edit the
demo header and rerun it rather than editing this file. Each entry: what it looks
like, when to use it and when not, what to pair it with, how it works, the values
to tune, what it costs, what reduced motion shows, and what makes it look cheap.

## Contents

- 01 Particles
- 02 Liquid morph
- 03 Holographic
- 04 Neon glow
- 05 Wireframe 3D (ink on paper)
- 06 Glassmorphism
- 07 Kinetic type
- 08 Isometric
- 09 Clay 3D
- 10 ASCII art
- 11 Gradient mesh
- 12 Comic book
- 13 Split-flap
- 14 Retro VHS
- 15 Halftone
- 16 Bauhaus
- 17 Pixel art
- 18 Blueprint
- 19 Art deco
- 20 Neo-brutalism

## 01 Particles

Demo: `assets/demos/01-particles.html` · still: `assets/demos/thumbs/01-particles.jpg`

- **Looks like:** A few thousand fine, softly glowing points gather into a word, hold, drift apart on a slow current and re-form. The pointer parts them like a hand through smoke.
- **Best for:** a launch hero, an AI or data product, a logo reveal
- **Avoid when:** the page is text-heavy or needs to load instantly on old phones
- **Pairs with:** a single bold sans headline, near-black navy, one cool accent
- **Technique:** Draw the word once on an offscreen canvas, read it back with getImageData and keep one lit pixel per grid cell (with jitter) as a target. Each particle homes to its target (exponential pull, so it settles in the same time at any frame rate) after a random delay, then is released into a smooth sine flow field. Canvas 2D: one pre-rendered glow sprite drawn per particle with 'lighter' (additive), and short trails from fading the last frame with 'destination-out'.
- **Knobs:** WORD (the headline the particles draw); MAX_DESK / MAX_PHONE (particle budget, sets the grid gap); T_DRIFT / CYCLE (seconds: release time, loop length); PULL (homing rate per second: 2 floaty, 6 snappy); DAMP (how long drift and pointer pushes coast); FLOW (drift strength); PUSH + RADIUS (pointer force, CSS px); FADE (0.2 long trails, 1 none); WARM (share of amber particles); --bg / --ink colours.
- **Cost:** Linear in particles: ~3k drawImage calls is 1-3 ms a frame on a laptop. The fade pass is a full-canvas fill, so fill-rate scales with pixels (DPR capped at 2). Phones get ~1.6k particles; drop MAX_PHONE further for low-end Android.
- **Reduced motion:** Every particle is placed on the word and drawn once: a finished glowing headline, no drift, no pointer response.
- **Pitfalls:** Big round dots read as confetti: cores stay under 2 px, sprite size follows the font size, and a soft sprite carries the glow. Pure white with additive blending blows out into a blob: alpha per particle is .35-.85 and the palette is cool white with a few warm points. Everything arriving at once looks mechanical: a per-particle delay with a left-to-right bias plus the flow still acting during the pull makes it assemble like smoke. Frame-count physics (v += a per frame) crawls on slow devices: the homing uses real seconds. Sampling every pixel gives 50k+ points: the grid gap is derived from the budget.

## 02 Liquid morph

Demo: `assets/demos/02-liquid-morph.html` · still: `assets/demos/thumbs/02-liquid-morph.jpg`

- **Looks like:** Mercury-like drops that drift, stretch into each other and pinch apart behind a headline, with a soft specular sheen so they read as heavy liquid metal rather than flat shapes.
- **Best for:** a calm premium hero, a beauty or wellness brand, a loading state
- **Avoid when:** the content needs the centre of the screen
- **Pairs with:** a high-contrast serif with italics, cool metal greys on deep charcoal
- **Technique:** Plain SVG circles on slow Lissajous paths, run through one "gooey" filter: blur them together (feGaussianBlur), then crush the blurred alpha back to a hard edge (feColorMatrix alpha row "0 0 0 A B"), so overlapping halos fuse into one surface. A wider blur of that shape is used as a height map for feSpecularLighting, clipped back inside the shape and added on top: the highlight slides over the bulges as they merge. Each circle has its own off-centre radial gradient so the body has volume and a dark rim.
- **Knobs:** BLOBS (radius as a share of the short side, orbit size, speed, phase); BLUR (merge distance, share of the short side); the alpha row values "20 -8" in #goo (higher = crisper edge, the offset sets how fat the bridges are); feSpecularLighting surfaceScale / specularExponent and feDistantLight azimuth / elevation (sheen size and direction); #metal stops (the metal colour); SPEED.
- **Cost:** The SVG filter re-runs on every frame over the whole stage, and cost scales with screen pixels and blur radius. Fine on laptops; on phones it holds 60 fps at this size but drop BLOBS or SPEED before adding more. For many blobs or full-bleed 4K, move to a WebGL metaball shader.
- **Reduced motion:** The blobs are drawn once in a pose where two pairs are mid-merge, so the liquid character still shows.
- **Pitfalls:** A threshold without the sheen looks like flat clip art: the specular pass is what makes it liquid. Blur larger than the smallest drop erases it: BLUR stays under the smallest radius. A filter region left at the default clips the goo into straight edges near the frame: the filter uses userSpaceOnUse over the whole viewBox. Busy, fast motion looks like a lava-lamp screensaver: orbits are slow and the palette is a single cool metal. Type over moving metal needs its own contrast: a mix-blend-mode: difference headline goes grey-on-grey over the metal's mid-tones, so the words are plain white with a soft dark shadow and a faint dark pool behind them.

## 03 Holographic

Demo: `assets/demos/03-holographic.html` · still: `assets/demos/thumbs/03-holographic.jpg`

- **Looks like:** A dark foil card that catches the light: a pastel iridescent sheen and a soft specular glare slide across it as it tilts, over fine diffraction lines. It follows the pointer and sways on its own on touch screens or before any pointer input.
- **Best for:** a membership or ticket card, a product badge, a pricing tier
- **Avoid when:** the whole page: foil works on one object, not as a background
- **Pairs with:** a clean grotesk, dark neutral surroundings so the foil is the only colour
- **Technique:** One element, four stacked layers sharing a few CSS custom properties. JS eases a 2D "light" position (pointer, or a slow Lissajous sway) and writes --rx/--ry (3D tilt), --mx/--my (glare centre) and --pow (how hard the light hits). The foil is a repeating pastel gradient in color-dodge whose background-position slides with the tilt and is masked to the lit area; the diffraction lines are a 1px repeating gradient in overlay; the glare is a radial gradient in soft-light/overlay. CSS does all the drawing.
- **Knobs:** --tilt (max rotation in deg); --foil-a / --lines-a / --glare-a (layer strengths); the hue stops in .foil (keep 4-5 pastel hues, saturation <= 70%); SWAY_X / SWAY_Y (idle sway, 0-1) and SWAY_SPEED; EASE (how quickly the card chases the pointer); IDLE_MS (pointer silence before it goes back to swaying).
- **Cost:** Cheap: one card, transforms on the compositor, but the gradient layers repaint each frame because background-position and mask move. Card-sized repaints are fine on phones; don't do this full-screen or on dozens of cards at once (pause off-screen cards with IntersectionObserver).
- **Reduced motion:** The card is shown at a fixed, flattering angle with the glare and sheen frozen mid-sweep; no tilt or sway.
- **Pitfalls:** Fully saturated rainbow gradients look like a toy: hues are pastel, desaturated and only bloom where the glare is. A sheen that never changes intensity looks printed on: --pow scales foil and glare with the tilt angle. Snapping to the raw pointer feels cheap: the light eases with a time-based exponential. Mixing blend modes on a transparent page reveals the page behind: the card has its own dark base, so blending stays inside it.

## 04 Neon glow

Demo: `assets/demos/04-neon-glow.html` · still: `assets/demos/thumbs/04-neon-glow.jpg`

- **Looks like:** A pink neon sign on a dark brick wall at night: bent glass tubes with a white-hot core and layered glow, one stuttering power-on, then a steady light with a barely-there hum that tints the bricks around and below it.
- **Best for:** nightlife, bars, music, gaming, a 'we're open' moment
- **Avoid when:** daytime, corporate or medical brands
- **Pairs with:** rounded monoline lettering, one or two tube colours, dark textured walls
- **Technique:** Letters are hand-drawn monoline SVG paths (a real tube is one line, never an outlined font glyph), stroked four times with <use>: wide blurred halo, tight blurred bloom, coloured tube, near-white core. The same paths stroked faint and grey are the unlit glass you see before power-on. The wall is a generated SVG brick tile at full "lit" brightness; a fixed layer with mix-blend-mode: multiply darkens it to near-black except where a pink radial pool (the light) sits, so lit bricks keep their mortar shadows like real light does. The ignition is a stepped timeline per word driven by rAF time; afterwards only compositor-friendly opacity moves (the hum).
- **Knobs:** --neon / --tube / --core (halo, tube and core colours: change all three together); --brick (wall scale); IGNITE (ms -> level steps per word: the flicker script); WARM_MS (gas warm-up after ignition); HUM (0.02-0.04: steady-state shimmer, 0 to switch off); halo and bloom stdDeviation in the SVG (glow width); the .beam gradients (how far the light spills and how much reaches the wall below).
- **Cost:** Two SVG blur filters, but they re-render only while the sign flickers in the first ~1.5 s; after that the hum changes only opacity on the sign and the light layer, which the compositor handles. Cheap on phones.
- **Reduced motion:** The sign appears already lit and steady, with the wall lit and the caption shown; no flicker, no hum.
- **Pitfalls:** Neon from a stroked or outlined font (-webkit-text-stroke) gives double, broken outlines: use single-line paths with round caps. One big box-shadow/text-shadow glow looks boxy and flat: stack a wide faint halo, a tight bloom and a white core. Continuous random blinking reads as broken and tacky: flicker once on power-on, then hold. A glow that doesn't touch the wall looks pasted on: the multiply light layer makes the bricks pick up the colour.

## 05 Wireframe 3D (ink on paper)

Demo: `assets/demos/05-wireframe-3d.html` · still: `assets/demos/thumbs/05-wireframe-3d.jpg`

- **Looks like:** A (2,3) torus-knot tube drawn as a fine blue-violet ink wireframe on warm engineering paper; it inks itself on, then turns slowly, far lines fading like a lighter pen stroke.
- **Best for:** engineering, architecture, product design studios, technical launches
- **Avoid when:** playful consumer brands
- **Pairs with:** a refined serif or a technical mono, ink blue on warm grid paper
- **Technique:** Build the tube mesh by hand (rings of RADIAL points around the knot curve, oriented with a cheap Frenet frame), rotate and perspective-project every vertex in plain canvas 2D, then sort edges into BUCKETS depth bins and stroke each bin once with its own alpha and line width (8 strokes per frame, not 4,000). The paper grid is pure CSS gradients.
- **Knobs:** --paper / --ink / --grid / --cell (paper colour, ink colour, grid tint, grid pitch). JS: P,Q (knot winding), TUBULAR, RADIAL (mesh density), TUBE (tube radius), CAM (camera distance: lower = stronger perspective), BUCKETS (depth bins), ALPHA_FAR/ALPHA_NEAR and LW_FAR/LW_NEAR (the depth fade), SPIN (rad/s), DRAW_MS (ink-on duration), TILT (pointer influence in rad).
- **Cost:** Canvas 2D, ~4,300 segments per frame batched into 8 paths; scales with TUBULAR x RADIAL. Cheap on phones; drop TUBULAR to 120 for very old devices.
- **Reduced motion:** The fully drawn knot at a fixed three-quarter angle, no draw-on, no rotation, no pointer tilt.
- **Pitfalls:** One stroke per segment with its own alpha is slow and looks noisy; batch by depth. Uniform line weight reads as flat CAD output: vary both alpha and width with depth. Pure black ink on pure white looks clinical: use a tinted ink on warm paper with a faint grid. Too much perspective (small CAM) distorts the knot into a fish-eye blob.

## 06 Glassmorphism

Demo: `assets/demos/06-glassmorphism.html` · still: `assets/demos/thumbs/06-glassmorphism.jpg`

- **Looks like:** Frosted-glass panels floating over slow, saturated shapes on a deep ink backdrop; the shapes smear into soft colour behind the glass while their crisp edges stay visible around it.
- **Best for:** dashboards and app marketing, cards over a colourful hero
- **Avoid when:** plain backgrounds (glass over flat colour is just a grey box) or long text
- **Pairs with:** a modern grotesk, vivid shapes behind, white glass with 1px light borders
- **Technique:** backdrop-filter: blur() saturate() on a barely-tinted translucent fill; a 1px gradient border drawn with a masked ::before (bright top-left, faint bottom-right) plus an inset top highlight; a long, soft, low-opacity drop shadow. Shapes move on slow Lissajous paths, cards parallax with the pointer at different depths (rAF, transforms only).
- **Knobs:** --blur (frost strength), --sat (colour boost through the glass), --tint (glass fill alpha), --edge (border brightness), --radius. JS: DRIFT (shape travel in px), SPEED (shape speed), PARALLAX (px per depth unit), TILT (deg of pointer tilt).
- **Cost:** backdrop-filter re-blurs whatever is behind each card every frame the background moves; cost scales with card area x blur radius. Fine for 2-4 cards; on phones keep --blur at 18-24px and avoid stacking glass on glass.
- **Reduced motion:** Shapes and cards hold a composed still; no drift, float or pointer parallax.
- **Pitfalls:** Glass over a flat or slow-gradient background shows nothing; it needs crisp, colourful shapes behind it. A uniform white 1px border looks like a cheap outline; fade it with a gradient. Putting transform, filter or opacity on a parent of the glass makes that parent the backdrop root and the blur goes blank: keep motion on the cards themselves. Without backdrop-filter support the card must fall back to a solid, readable tint (@supports block).

## 07 Kinetic type

Demo: `assets/demos/07-kinetic-type.html` · still: `assets/demos/thumbs/07-kinetic-type.jpg`

- **Looks like:** Editorial poster type in motion: a heavy condensed line and a serif-italic word that swaps every few seconds, letters rising out of a mask one by one, with a slow marquee rule along the bottom.
- **Best for:** editorial heroes, portfolios, announcements, agency sites
- **Avoid when:** small text or anything people must read quickly
- **Pairs with:** one big grotesk plus one italic serif accent, warm paper or black
- **Technique:** Split each word into letter spans yourself, each inside a line that clips vertically (overflow-y: clip). Every frame, a tiny timeline maps time to each letter's translateY / rotate. "Tracking" changes are done with per-letter translateX (no letter-spacing animation, so no layout). A fit() pass sizes the headline to the viewport whatever font the system substitutes.
- **Knobs:** --paper / --ink / --accent colours; WORDS (the rotating line); HOLD (seconds per word); IN / OUT (letter durations); STAG_IN / STAG_OUT (stagger per letter); SPREAD (start tracking, em per letter); MARQUEE_SPEED (px/s); MAX_FS (largest headline size).
- **Cost:** Very low: ~60 spans get a transform per frame; no canvas. Scales with letter count. Fine on phones.
- **Reduced motion:** The settled frame: "Make it move." in place, marquee still, nothing loops.
- **Pitfalls:** Bouncy back-easing makes type look cartoonish: this uses expo-out in, quad-in out. Animating letter-spacing or font-size reflows every frame: use transforms. Masks that clip italic overhangs or descenders look broken: clip only vertically and pad the mask. Fixed font sizes overflow when a wide fallback font loads: measure and fit.

## 08 Isometric

Demo: `assets/demos/08-isometric.html` · still: `assets/demos/thumbs/08-isometric.jpg`

- **Looks like:** A small stone-and-terracotta city on a floating slab, built block by block in true 2:1 isometric: each block rises with a soft overshoot, its shadow growing with it, holds, then sinks away and the build starts again.
- **Best for:** platforms, infrastructure, logistics, 'how it works' sections
- **Avoid when:** brands that want to feel human and organic
- **Pairs with:** a geometric sans, three tones per material, one accent colour
- **Technique:** Plain SVG polygons from one projection, iso(x, y, z) = [(x - y) * TW/2, (x + y) * TH/2 - z * ZH] with TH = TW/2 and ZH = TW * 0.6124 (so a unit cube is a cube). Three tones per block (top light, left mid, right dark, light from the front-left), painter's order by x + y, heights re-projected every frame from a staggered timeline; ground shadows are one rectangle per block stretched along -y, drawn in a single group so overlaps never double up.
- **Knobs:** --bg-1 / --bg-2 (backdrop), --ink, --accent. JS: TW (tile width; scales nothing visually, the viewBox does), MAP (heights + palette letter per cell: a = accent, n = slate, p = park, - = empty), PAL (top/left/right tones per palette), STAGGER (s per diagonal), GROW (rise time), HOLD_AT / SINK_AT / LOOP (timeline in s), OVERSHOOT (easeOutBack strength), SHADOW (shadow length per unit height).
- **Cost:** ~180 SVG nodes, attributes rewritten only while a block is moving. Cheap everywhere; phones fine.
- **Reduced motion:** The finished city, shadows and windows in place, no rise, no bob.
- **Pitfalls:** 2:1 tiles with cube heights equal to TH look squashed: use ZH = 0.6124 * TW. Hairline seams between faces read as broken outlines: stroke each face in its own fill colour (stroke-linejoin round). Wrong draw order makes back blocks cut through front ones: sort by x + y. Random heights look like noise: hand-place a skyline (tall at the back, low at the front).

## 09 Clay 3D

Demo: `assets/demos/09-clay-3d.html` · still: `assets/demos/thumbs/09-clay-3d.jpg`

- **Looks like:** Soft, matte, pastel clay shapes (a breathing blob, a squishy torus, a lying pill, a bouncing ball) on a seamless warm-cream table, with soft contact shadows and gentle squash-and-stretch.
- **Best for:** friendly consumer apps, kids, onboarding, playful SaaS
- **Avoid when:** luxury or serious financial brands
- **Pairs with:** a soft rounded sans, warm off-white, pastel shapes
- **Technique:** One full-screen WebGL fragment shader raymarches signed-distance shapes; matte look = wrapped diffuse + sky fill + warm floor bounce + 5-tap ambient occlusion + a 24-step soft shadow, no specular. The floor is shaded as background colour x (shadow, AO), so it melts into the backdrop with no horizon. Motion lives in JS: positions and a volume-preserving squash factor per shape are passed as uniforms (y scaled by s, x/z by 1/sqrt(s)). The ball's squash is its "penetration" of the floor in a parabolic bounce, so it squashes only on contact.
- **Knobs:** --bg (must match BG in the shader), --ink. JS: QUALITY (render scale per device pixel; 0.5-0.8), MIN_SCALE (floor for 1x screens), MAX_PIXELS (hard cap on rendered pixels), BOUNCE (period s), HOP (bounce height), SQUISH (torus wobble), COLORS (sRGB albedos per shape). Shader: STEPS (raymarch), the light vector L, and the AO / shadow loop counts.
- **Cost:** Per-pixel raymarch, so cost = rendered pixels x steps. Rendered at 0.75 x device pixels (min 0.9 x CSS px) (soft matte surfaces hide upscaling), capped at 1.1 MP, and stepped down (x0.85, to half) while frames take over 40 ms. Phones are fine at this scale; raise QUALITY only on desktop.
- **Reduced motion:** One rendered still (ball mid-hop), no further frames. Without WebGL (or with ?nogl): CSS claymorphism shapes (inset light + shade shadows, soft contact shadows), also still under reduced motion.
- **Pitfalls:** Specular highlights or hard shadows turn clay into plastic: keep it matte and every shadow soft. A visible floor horizon breaks the studio look: shade the floor from the background colour and fade it. Non-uniform scaling breaks the distance field unless you multiply the distance by the smallest scale (done in sqz()). Full-resolution raymarching on a 3x phone melts the GPU: render small and let CSS upscale.

## 10 ASCII art

Demo: `assets/demos/10-ascii-art.html` · still: `assets/demos/thumbs/10-ascii-art.jpg`

- **Looks like:** A torus turning in plain monospaced characters, phosphor green on near-black with a faint glow, beside a crisp mono headline and a prompt line. Add ?paper (or class "paper" on <html>) for ink on paper.
- **Best for:** developer tools, CLIs, hacker or terminal brands, retro tech
- **Avoid when:** audiences who aren't technical, or long reading
- **Pairs with:** a monospace everywhere, phosphor green or ink on paper
- **Technique:** Every character cell is a pixel. Per cell, cast a ray, clip it to a bounding sphere, sphere-trace the torus distance field, light the hit with diffuse + a small specular, and map brightness onto the ramp " .:-=+*#%@" (any hit gets at least "."). Rotation is applied to the ray, not the shape (one 3x3 per frame). The whole frame is written as one string into a <pre> with line-height 1; cell width is measured, so aspect stays correct.
- **Knobs:** --fg / --bg / --glow / --head / --head-glow (colours), RAMP (dark to bright), R / TUBE (torus radii), SPIN_A / SPIN_B (rad/s on two axes), LIGHT (light direction), SPEC (highlight strength), FADE_MS (intro: the shape densifies from dots), FONT_MIN / FONT_MAX (cell size range in px).
- **Cost:** CPU only: about cols x rows rays per frame (~12k on desktop, ~8k on phones), but the bounding sphere skips most of them and hits take ~10-20 steps. Text layout of one <pre> per frame is cheap; the glow (text-shadow) is the paint cost, so drop --glow on weak devices.
- **Reduced motion:** One fully lit frame at a three-quarter angle; no rotation, no fade.
- **Pitfalls:** Forgetting the cell aspect (characters are ~0.6 as wide as tall) squashes the shape; measure cell width and project in CSS pixels. A neon glow on every glyph plus scanlines and flicker is the tacky version: one soft text-shadow, no blinking cursor. Too fine a grid stops reading as type: keep cells at 8 px or more. Overlaying the headline on the art kills legibility: keep the art in its own region and set the headline in the same mono family, larger and brighter.

## 11 Gradient mesh

Demo: `assets/demos/11-gradient-mesh.html` · still: `assets/demos/thumbs/11-gradient-mesh.jpg`

- **Looks like:** Soft fields of colour drifting and blending into each other like a product-launch backdrop: deep navy with violet, coral and a little warm light moving through it, under a fine film grain, with a calm headline on top.
- **Best for:** product launches, fintech, calm premium backgrounds behind a headline
- **Avoid when:** when the content itself must carry the colour
- **Pairs with:** a clean geometric sans, two or three related hues, fine grain
- **Technique:** One full-screen WebGL fragment shader. Five colour points move on slow Lissajous paths; each pixel takes a weighted blend of their colours in linear light (Gaussian weights plus a constant "base" weight so empty space falls back to navy), then converts back to sRGB. The coordinates are first pushed around by low-frequency value noise (domain warping), which turns round blobs into flowing, liquid boundaries. Per-pixel animated noise is added at the end: it reads as film grain and dithers away 8-bit banding.
- **Knobs:** COLORS (base + five points as sRGB hex; converted to linear light so blends stay clean; keep them in one family); SIGMA (blob size: .25 tight, .5 washy); WARP (how liquid the edges are, 0 = clean circles); SPEED (1 = a slow minute-long loop); GRAIN (.02 invisible dither, .06 filmic); PIXEL_BUDGET (max canvas pixels: the field is soft, so it renders below full DPR on big screens).
- **Cost:** One draw call per frame; cost is pixels x 5 points x 2 noise lookups. PIXEL_BUDGET (1.2 MP) keeps a 4K monitor and a DPR-3 phone at the same cost as a laptop. Falls back to a static CSS gradient when WebGL is unavailable.
- **Reduced motion:** One frame is rendered at a chosen moment and never redrawn, grain included; with no WebGL the CSS fallback gradient shows.
- **Pitfalls:** Gradients without grain band visibly on 8-bit screens: the shader always adds grain. Many saturated hues at once turns into a rainbow: five related colours, one of them only a warm highlight. Fast motion makes a calm backdrop nauseating: the paths take 30-60 s per loop. White text on the lightest colour fails contrast: the warm point is kept small and the shader darkens the edges and the text band slightly.

## 12 Comic book

Demo: `assets/demos/12-comic-book.html` · still: `assets/demos/thumbs/12-comic-book.jpg`

- **Looks like:** A printed comic page: cream newsprint, thick ink panel borders, flat process colours shaded with halftone dots, speed lines, and a "POW!" burst that slams in with a snappy overshoot after the panels land one by one.
- **Best for:** events, games, playful announcements, kids' brands
- **Avoid when:** serious, premium or minimal brands
- **Pairs with:** heavy italic display type, flat primaries, black ink outlines
- **Technique:** CSS grid of panels with 4px ink borders. Halftone shading is drawn once per resize into a canvas per panel (dots on a rotated grid, radius from a coverage function: r = cell * sqrt(coverage / pi)). Speed lines are tapered wedges on one canvas, redrawn each frame around the burst. The burst is an SVG star polygon; panels, burst and balloon animate with transform/opacity using back-out easing, then a short damped "punch" repeats.
- **Knobs:** --paper --ink --red --yellow --blue (the process palette); CELL (halftone dot pitch, px); SCREEN (dot screen angle); LINES (speed-line count); PUNCH_EVERY (seconds between punches); the backOut overshoot (2.8 for the burst, 1.4 for panels).
- **Cost:** Low. Halftone canvases redraw only on resize; per frame it is ~80 canvas wedges plus a few transforms. Fine on phones.
- **Reduced motion:** The finished page: all panels in, burst at rest, speed lines still, no punch.
- **Pitfalls:** Comic Sans and rainbow palettes read as parody: use heavy uppercase italics and four flat inks. Soft shadows and gradients break the print look: only hard offsets and flat fills. Uniform-opacity dots look like a texture, not print: vary dot SIZE, never opacity. A punch that never stops shaking is tiring: it is short, damped and spaced out.

## 13 Split-flap

Demo: `assets/demos/13-split-flap.html` · still: `assets/demos/thumbs/13-split-flap.jpg`

- **Looks like:** A station departure board: rows of dark character tiles split by a hinge, each flapping through the drum of characters until the next message settles, with a mechanical clatter of staggered starts. A small flap clock keeps real time.
- **Best for:** travel, transport, schedules, countdowns, menus that change
- **Avoid when:** brands with nothing to 'announce'
- **Pairs with:** a bold condensed sans in caps, cream on charcoal, one warm accent
- **Technique:** Each tile is four half-height layers: a static top (next character) and static bottom (current), plus two flaps. The top flap folds down (rotateX 0 to -90deg, hinge at its bottom edge, accelerating), then the bottom flap lands (rotateX 90deg to 0, hinge at its top edge) with a small bounce. Each half shows its slice of the character by clipping a full-height line box. A tile steps one drum character per flip until it reaches its target; start delays per column and row give the cascade.
- **Knobs:** --tile-top / --tile-bot / --ink (tile colours); --amber (accent); COLS (tiles per row); MESSAGES (each row COLS characters or fewer); DRUM (character order the tiles turn through); FLIP (seconds per flap); CYCLE (seconds per message); the 6deg landing bounce in step().
- **Cost:** Low: only tiles that are flipping are touched, two transforms and an opacity per frame each. 36 + 4 tiles here; hundreds are fine.
- **Reduced motion:** The first message and the current time, set directly with no flipping, and nothing cycles.
- **Pitfalls:** Flipping straight to the target (no intermediate characters) loses the mechanism: step through the drum. Every tile starting together looks digital: stagger by column with jitter. Flat halves with no hinge line or shading read as a font, not hardware. A clock that flips through letters is wrong: give digit tiles their own drum.

## 14 Retro VHS

Demo: `assets/demos/14-retro-vhs.html` · still: `assets/demos/thumbs/14-retro-vhs.jpg`

- **Looks like:** A home-video tape playing back: a dusky sunset scene with soft colour that bleeds past its edges, faint RGB fringes, grain, a slow tracking band rolling up the picture, head-switching noise along the bottom, and the VCR's crisp on-screen display (PLAY, SP, tape counter).
- **Best for:** music, film, nostalgia campaigns, retro product drops
- **Avoid when:** anything that must look crisp and trustworthy (banking, health)
- **Pairs with:** a heavy italic sans, sunset gradients, monospace OSD text
- **Technique:** The scene is painted once per resize into an offscreen canvas 2D, uploaded as a texture, and played back through one WebGL fragment shader: luma and chroma are split (YIQ), chroma is blurred wide and lags to the right (colour bleed), red and blue get a 1-2px offset, lines wobble by a smooth noise, a rolling band tears lines sideways and adds streaks, grain is a per-frame hash. The HTML headline sits on top with CSS chroma fringes and is nudged sideways only while the band crosses it; a CSS scanline layer covers everything.
- **Knobs:** BAND_SPEED (band passes per second); BLEED (chroma blur width, px); SPLIT (red/blue offset, px); GRAIN (noise amount); WOBBLE (line jitter); RES (render scale, VHS is soft so 1-1.5 is plenty); --scan (scanline darkness); the palette in drawScene().
- **Cost:** One full-screen shader pass with 13 texture reads per pixel; scales with RES x screen area. Cheap on phones at RES 1. Scene repaint only on resize.
- **Reduced motion:** One played-back frame with the band switched off and still grain; the counter does not run.
- **Pitfalls:** Turning every effect up makes it unreadable and cheap: here split is 1.5px, grain 6%, the band is one soft strip. Rainbow synthwave palettes are a different style: tape looks faded and warm, so lift the blacks and desaturate. Real VCR text (the OSD) is NOT distorted: keep it crisp, only the tape picture degrades. Blinking "PLAY" is a cliché: it stays on.

## 15 Halftone

Demo: `assets/demos/15-halftone.html` · still: `assets/demos/thumbs/15-halftone.jpg`

- **Looks like:** A printed poster that breathes: a sphere and a soft sun rendered entirely in ink dots on cream paper, two inks on their own rotated screens, the dots swelling and shrinking as the light slides across.
- **Best for:** posters, editorial, music and culture, print-inspired brands
- **Avoid when:** photo-real or glossy product brands
- **Pairs with:** a condensed bold sans, warm paper, one dark ink plus one spot colour
- **Technique:** Canvas 2D. For each ink, walk a grid rotated to that ink's screen angle (45° for the dark ink, 15° for the red, as in print, so the two screens don't beat into a moiré), sample a brightness field at every dot, and draw a dot whose AREA follows the darkness (radius = maxR * sqrt(darkness)). All dots of one ink go into a single path and one fill; the second ink is laid over with 'multiply', like ink on ink.
- **Knobs:** CELL (screen spacing in CSS px, scaled down on small screens); MAX_R (largest dot as a share of CELL: 0.7 lets neighbours just touch in the darkest areas); INKS (colour and screen angle of each ink); LIGHT_SPEED (how fast the light orbits); the sphere's centre and radius in layout().
- **Cost:** About 10-14k dots per ink at 1440x900, drawn as one path per ink: fine on laptops and recent phones. Cost grows with screen area / CELL², so raise CELL before adding inks. The canvas pixel ratio is capped at 2.
- **Reduced motion:** One frame is drawn with the light at the upper left, a classic print pose; nothing moves.
- **Pitfalls:** Radius proportional to darkness (not its square root) crushes the mid-tones into black blobs: area must follow tone. Screens at the same angle, or 30° apart with similar frequency, make moiré stripes: 45° and 15° with a slightly different CELL each avoids it. Dots on pure white with pure black ink look like a filter preset: warm paper, an ink that isn't quite black, and a little per-dot jitter make it read as print.

## 16 Bauhaus

Demo: `assets/demos/16-bauhaus.html` · still: `assets/demos/thumbs/16-bauhaus.jpg`

- **Looks like:** A 1920s Bauhaus poster come to life: red, yellow, blue and black circles, squares, quarter-circles, triangles and bars on off-white paper, locked to a strict 4x4 grid, with a heavy geometric lowercase headline.
- **Best for:** design studios, galleries, architecture, education, editorial
- **Avoid when:** brands with soft or organic personalities
- **Pairs with:** a geometric sans (Futura-like), red / yellow / blue and black on off-white
- **Technique:** Every shape in a cell is ONE primitive: a four-corner quad with a radius per corner (square = no radii, circle = .5 everywhere, quarter-circle = 1 on one corner, leaf = 1 on two opposite corners, triangle = one corner pulled to the centre). Interpolating corners, radii, quarter-turns and colours morphs any shape into any other on canvas. Compositions are written as 4-character tokens per cell; a diagonal stagger and a hard ease-in-out make the recomposition feel mechanical. Between recompositions "free" cells (lowercase tokens) tick round 90 degrees.
- **Knobs:** CSS --paper --ink --red --yellow --blue (palette, read by JS); SCENES (the compositions: shape letter S C Q L H T B D _, quarter-turns 0-3, fg colour, bg colour; lowercase shape = free to tick); MOVE (seconds a cell takes to change), STAGGER (diagonal delay per cell), HOLD (seconds a composition rests), TICK_EVERY (pace of the idle ticks); ease() (the mechanical curve).
- **Cost:** Very low: 16 cells of canvas paths per frame, no shadows or blur. The grain is a static overlay generated once. Fine on any phone.
- **Reduced motion:** The first composition, fully composed and still.
- **Pitfalls:** Off-palette in-betweens (colour lerps pass through mud): most cells keep their colour between scenes and moves are short. Hairline seams between neighbouring cells: cell size is an even whole number of device pixels and the grid origin is pixel-snapped. Bouncy or elastic easing reads as cartoon, not Bauhaus: quartic in-out only. Random compositions look like clip art: the scenes are composed by hand.

## 17 Pixel art

Demo: `assets/demos/17-pixel-art.html` · still: `assets/demos/thumbs/17-pixel-art.jpg`

- **Looks like:** A 16-bit night drive: a low-resolution city scrolls past in parallax layers, windows switch on and off, stars step through three brightnesses, a red coupe cruises with a dithered headlight beam, and the title is set in a hand-made bitmap font.
- **Best for:** games, indie products, playful retro campaigns, 404 pages
- **Avoid when:** premium or corporate brands
- **Pairs with:** a bitmap-style display face, a limited palette, dark night blues
- **Technique:** Everything is drawn into a tiny canvas (about 110 art pixels on the short side) and scaled up by a WHOLE number of device pixels with image-rendering: pixelated, so every art pixel is a crisp square. The sky is a Bayer ordered-dither gradient, buildings are seeded procedural strips drawn once and tiled at integer offsets, light is dithered (checkerboard) instead of blended, and all motion advances on a 20 Hz tick from the rAF timestamp.
- **Knobs:** ART (art pixels on the short side: lower = chunkier), TPS (ticks per second: the stepped frame rate), SPEED (art px per tick for each parallax layer), P (the palette), CAR (sprite rows; one letter = one palette colour), TITLE / SUB (text; add any missing glyph to FONT5 / FONT3 as row bitmasks).
- **Cost:** Tiny: the buffer is ~200x120 pixels whatever the screen, and the canvas only redraws when the tick changes (20 times a second). The DPR is not capped because the integer scale is computed from real device pixels; the buffer size does not grow with it.
- **Reduced motion:** One finished frame of the scene (city, moon, stars, car, title); nothing moves.
- **Pitfalls:** Blurry or uneven pixels from fractional scaling: the scale is a whole number of device pixels and smoothing is off. Mixed pixel sizes ("mixels") look amateur: text, sprites and scenery all share one pixel grid. Smooth sub-pixel motion breaks the illusion: every position is an integer advanced on the tick. Anti-aliased gradients and alpha glows: the sky and the lights are dithered from a fixed palette instead.

## 18 Blueprint

Demo: `assets/demos/18-blueprint.html` · still: `assets/demos/thumbs/18-blueprint.jpg`

- **Looks like:** White technical linework on blue drafting paper with a fine and a coarse grid: a flanged hub in plan and in section draws itself line by line, dimensions and leaders follow, the hatching fades in and the title block types itself out. Calm, exact, engineering-grade.
- **Best for:** engineering, manufacturing, architecture, process explainers
- **Avoid when:** consumer lifestyle brands
- **Pairs with:** a technical sans in caps, white line work on blueprint blue
- **Technique:** An inline SVG built from a few helpers (line, circle, path, dimension, leader). Every stroke draws on with stroke-dasharray = stroke-dashoffset = its getTotalLength(), eased to 0 on a declarative timeline (data-t start, data-d duration). Dash-dot centre lines cannot use their own dash for this, so each gets a solid twin inside a <mask> and the twin is what draws. Text types in by slicing its string; arrowheads and hatching fade.
- **Knobs:** CSS --paper / --paper-edge (sheet colour), --ink (line colour), --grid-fine / --grid-coarse (cell sizes), --grid-a (grid strength); JS SPEED (multiplies every start time and duration), ease() (pen acceleration), POS (where each view sits, per orientation), the t values passed to each helper (the drawing order).
- **Cost:** Low. A few dozen SVG strokes animate for about 7 s, then the loop stops completely (click or tap replays). The grid is CSS gradients, painted once.
- **Reduced motion:** The finished sheet: every line, dimension, hatch and title-block field in place.
- **Pitfalls:** Glows or thick strokes make it look like neon, not drafting: hairlines and two line weights only. Markers (marker-end) appear before their line is drawn: arrowheads here are separate paths that fade in when the line arrives. Dashed lines ignore a dashoffset draw-on: they reveal through a masked solid twin. Text that scales with the drawing gets unreadable on phones: the SVG swaps to a stacked portrait layout instead of shrinking.

## 19 Art deco

Demo: `assets/demos/19-art-deco.html` · still: `assets/demos/thumbs/19-art-deco.jpg`

- **Looks like:** Gatsby-era luxury, kept restrained: a double stepped frame, fan medallions and a fine sunburst in gold draw outward from the centre over deep emerald-black, then a slow metallic sheen glides across the gold and the high-contrast serif headline.
- **Best for:** hospitality, events, cocktail bars, jewellery, luxury invitations
- **Avoid when:** tech products or casual brands
- **Pairs with:** a high-contrast Didone or geometric deco caps, gold on black or emerald
- **Technique:** Canvas 2D for the ornament. Each frame quarter is a polyline drawn to a fraction of its length, so all four quarters start on the vertical axis and meet at the sides (symmetry is the style). Rays grow from just outside the frame, staggered by their angle from the vertical. The sheen is one gradient band painted with globalCompositeOperation = 'source-atop', so it lands only on gold already drawn; the headline gets the same band through a second background layer clipped to its text, positioned to line up with the canvas band.
- **Knobs:** CSS --bg-1/--bg-2/--bg-3 (emerald-black backdrop), --gold-hi/--gold/--gold-lo (metal), --serif and --sans; JS RAYS (sunburst density), STEP (corner step size), GAP (space between the two frames), SHEEN_EVERY / SHEEN_DUR (seconds between sweeps / per sweep), DRAW (seconds of the opening draw).
- **Cost:** Low. About 130 strokes per frame during the 2.6 s opening and during each 1.9 s sheen; between sweeps the canvas is not redrawn at all. The headline sheen repaints only the h1 box. Fine on phones.
- **Reduced motion:** The finished composition (frames, fans, sunburst, headline), no sheen.
- **Pitfalls:** Flat yellow reads as costume, not gold: every stroke uses a multi-stop bronze-to-champagne gradient. Thick strokes and big glows look cheap: hairlines, with a faint wide under-stroke as the only glow. Asymmetry breaks deco: every element is mirrored and draws symmetrically. A constant shimmer cheapens it: one slow sweep every few seconds, nothing in between.

## 20 Neo-brutalism

Demo: `assets/demos/20-neo-brutalism.html` · still: `assets/demos/thumbs/20-neo-brutalism.jpg`

- **Looks like:** Loud and honest: cream paper, flat bright fills, thick black outlines and hard offset shadows, chunky type, stickers slapped on at an angle, a marquee band running across, and buttons that physically press down.
- **Best for:** startups, indie tools, creators, loud honest marketing pages
- **Avoid when:** luxury, healthcare or anything that must feel calm
- **Pairs with:** a black geometric sans, cream paper, four flat fills, hard black shadows
- **Technique:** Pure CSS. Every surface is a flat fill with a 3px black border and a hard shadow (box-shadow: 6px 6px 0 #000, no blur). Pressing moves the element by the shadow's offset while the shadow shrinks to nothing, so it looks pushed into the page. The marquee is two copies of one strip translated by -50% in a loop. Cards drop in once with a short overshoot; stickers sway a few degrees.
- **Knobs:** --line (outline width), --shadow (hard-shadow offset; the press distance follows it), --paper and the four fill colours (--sun, --coral, --mint, --violet), --marquee-speed, the sticker rotations (--tilt on each sticker).
- **Cost:** Negligible: a handful of transforms on the compositor. Works the same on phones (press states run on :active for touch).
- **Reduced motion:** The marquee, entrance and sticker sway are switched off; the layout is complete and still, and buttons still press (that's feedback, not decoration).
- **Pitfalls:** Soft blurred shadows or rounded pastel cards turn it into ordinary flat UI: shadows stay hard and black, corners nearly square. Too many colours at once reads as a children's toy: four fills, one per job, on cream. Brutalist doesn't mean careless: the grid, spacing and type sizes are strict, which is what keeps the loudness clean. A press that doesn't move by the shadow's exact offset looks like a glitch.
