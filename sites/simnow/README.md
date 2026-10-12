# SimNow website

A one-page site for SimNow, Salem's sim racing lounge. It opens on a black
screen, a car's tail lights blink and then sweep on in the dark, the night
spreads out around them as it drives, and the site opens over it. The car
keeps driving behind everything: the hero, five scroll chapters, and (dimmed)
the info sections.

The background is one looping clip, `assets/drive/drive.mp4` (H.264, with
`drive.webm` for browsers without H.264): a black Porsche 911 GT3 RS at night,
footage by [@nghtstlkr.idn](https://www.tiktok.com/@nghtstlkr.idn), used with
the creator's permission (owner confirmed, including removing the watermark)
and credited in the footer. From the TikTok download:
- Kept: the first 12.7 s. The TikTok end card was cut.
- Removed: the watermark (left until 5.0 s, then bottom-right), painted out
  pixel by pixel with `render/clean_clip.py`; and the audio.
- Fixed: the clip was stored on its side, so it was turned upright, to
  landscape 1024x576.

Layout: on wide screens the clip fills the whole background. On phones it's
a band across the top that fades into the page.

It never stops: the clip loops, and `js/main.js` restarts it if the browser
pauses it (power saving, a stalled download, coming back to the tab) and on
the first tap or scroll where autoplay was refused. It pauses only while the
tab is hidden, and doesn't play at all for visitors who ask for reduced
motion (they get the still poster).

## Run it locally

```bash
cd sites/simnow
python3 -m http.server 8000
# open http://localhost:8000
```

Add `?skip` to jump past the intro, `?debug` to expose `window.__simnow`.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | Content: hero, five chapters, info sections |
| `styles.css` | Layout and brand tokens (`--brand`, `--black`, …) |
| `js/main.js` | Intro and background clip, scroll chapters (GSAP ScrollTrigger + Lenis), nav, reveals |
| `js/lights.js` | The tail-lights-first intro: draws the clip through WebGL so only the red tail lights show (with a bloom), then reveals the scene and hands back to the `<video>` |
| `assets/drive/` | The clip (MP4 + WebM), its poster frame and the race-nights card image |
| `assets/photos/` | SimNow's own shop and event photos, from their current site |
| `render/night_drive.py`, `render/night_post.py` | A 3D night-drive render, kept as a fallback background (not used now) |
| `render/svj_studio.py` | Car set-up shared by the renders (materials, SVJ wing and splitter); also an older studio scene |
| `render/post.py` | The grade (contrast, bloom on the lamps, vignette) |
| `render/clean_clip.py` | Prepares a TikTok clip: cuts the end card, paints out the watermark, turns it upright, encodes MP4 + WebM |
| `render/upscale.py` | Real-ESRGAN 4x photo upscaler in plain numpy (used for `assets/drive/card.webp`) |

## The tail-lights intro

The page opens on plain black: no loading bar, no label, no skip button (the
owner asked for all three to go). `index.html` sets the clip's source as soon
as the `<video>` is parsed, and `js/main.js` plays it straight away instead
of waiting for it to buffer. The intro starts on the first frame that plays.
If the clip hasn't started within 2.5 s (`START_WAIT`: a slow connection, or
autoplay refused), the site opens on the poster frame and the keep-alive
starts the drive when it can.

`js/lights.js` then runs for ~3.5 seconds (the clip plays at 0.8x under it).
Timeline:
- 0.1 s: the light bar draws on from the middle outward, over 1 s.
- From 0.35 s: a soft red glow and a long, thin lens streak grow out of it.
- 1.3 s: the night spreads out from the lights, and the streak gives way.
- 1.95 s: the site opens.
- 3.5 s: the canvas fades out over the plain video, well before the clip's
  first cut (3.9 s of footage).

The glow and streak are blurred at 1/4 size in many small steps (big steps
leave stacked copies of a thin line), and stored as square roots in the 8-bit
buffers so the faint edges don't band.

Phones: the band sits in the middle of the screen during the intro, then
slides up as the site opens. Without WebGL the clip just fades up from
black.

The lights are found by colour, inside a zone measured on this clip's first
shot. The bar's core burns orange-white, so the test is strong red, and red
well above blue (not pure red, which only catches its edges). `CLIP` at the top of `lights.js` holds
the zone, the middle of the bar, its width, the glow colour, and where a
narrow phone crop starts. A different clip needs these re-measured, or other
red things will show through (or the lights won't).

To check the intro, `?debug` exposes `window.__simnow.lights.timeline`: pause
it, seek, and set `video.currentTime` to 0.8x the timeline time. Headless
screenshots are too slow to catch it in real time.

## The 3D night drive (fallback, not used now)

Needs the `bpy` Python package (Blender 5.2: `pip install bpy==5.2.2` on
Python 3.13), ffmpeg with libx264 and libvpx-vp9, and the car model as glTF.

```bash
cd sites/simnow/render
python -I night_drive.py -- car.gltf raw --res 1280x720 --samples 20
python3 -I night_post.py raw ../assets
```

- Frames 1–48 are the intro, 49–192 the loop. Everything that moves repeats
  every 144 m of road (24 m/s for 6 s): street lights every 36 m, lane dashes
  every 12 m, guardrail posts every 4 m, and the road texture is sampled on a
  cylinder so it wraps too.
- The car stays put and the world slides past it; the wheels spin, the body
  bobs slightly, and the camera sways on a loop-length cycle.
- The light cues (`lights_at`) and camera (`camera_at`) are at the bottom of
  `night_drive.py`.
- About 20–30 s a frame on a 4-core CPU, roughly an hour in all. Existing
  frames are skipped, so a render can be stopped and resumed.

## Replacing the clip

From a TikTok download, find the end card's first frame, the two watermark
boxes and the frame where the watermark jumps (a contact sheet at 1 fps
shows all three). Then:

```bash
python3 -I render/clean_clip.py tiktok.mp4 out --frames 382 --switch 150 \
  --box-a 0,455,150,570 --box-b 440,765,576,875 --rotate ccw
cp out/drive.mp4 out/drive.webm assets/drive/
```

Those are the values for the current clip. After that:
- Replace `assets/drive/poster.webp`, `card.webp` and `assets/og.jpg` with
  stills from the new clip.
- Re-measure `CLIP` in `js/lights.js`.
- Update the footer credit.

The creator's original file (no watermark, higher resolution) would beat any
of this; skip the inpainting then.

## The car model (3D fallback only)

The renders use a Lamborghini Aventador model from the
[car-3d project](https://github.com/saikat111/car-3d), dressed as a matte
black SVJ in `svj_studio.py`. That repository doesn't say where the model came
from or what its licence is, so **treat it as a placeholder until a licensed
SVJ replaces it.** Free SVJ models under CC BY exist on Sketchfab (for example
"Lamborghini Aventador LP 770-4 SVJ" by MARKETPLACE_BP3D). Download one as
glTF, check its licence, and re-render. The part and material names in
`svj_studio.py` (`car_materials`) and `night_drive.py` (`rig_wheels`,
`add_beams`) will need mapping to the new model.

## Content from simnowusa.com

Read from their live site on 2026-10-12. It's an Angular app with its own
API and Stripe payments, so booking stays there and our buttons link to it.

- **Contact:** 971-345-2568 (call or text), SimNowOR@gmail.com,
  https://www.facebook.com/SimNowOR/
- **Hours:** daily 1-9 PM, appointments only (no walk-ins). 6 rigs.
- **Hardware:** Fanatec direct-drive, iRacing.
- **Booking:** https://simnowusa.com/book#booking. Per package it's
  `book?session=11111111-1111-1111-1111-1111111111NN#booking`:

  | Package | NN | Price | Time | Drivers |
  | --- | --- | --- | --- | --- |
  | Solo session | 01 | $25 | 1 hr 20 min | 1 |
  | Bring a friend | 02 | $40 | 1 hr | 2 |
  | Small group | 03 | $49 | 1 hr 30 min | 3 |
  | Full grid | 04 | $99 | 1 hr 30 min | 6 |

- **Event rentals:** delivered across Oregon and the Pacific Northwest, with
  setup and race management included. Covers corporate events, dealership
  events, private parties, and car shows and motorsports. Quotes go to
  `mailto:SimNowOR@gmail.com?subject=SimNow Event Rental Quote`.
- **Retail paddock:** try before you buy, Salem pickup, setup help included,
  in stock and made to order. Nothing is listed yet; gear requests go by
  email.
- **Images:** their logo (`assets/simnow-logo.webp|png`). In
  `assets/photos/`: their shop photos (`cockpits`, `driver`) in the
  experience cards and their event photos (`event-*`) in the event rentals
  cards. All are resized and recompressed from
  `https://simnowusa.com/assets/HomePage/Images/` and
  `/assets/EventDetails/Images/`.
- **Contact:** their contact form posts to their own API. Ours has no
  server, so "Send a note" opens the visitor's email app with the note
  filled in (`js/main.js`).

## Still needed from SimNow

- Whether this design replaces simnowusa.com. If it does, the booking app
  (API and Stripe) has to keep running somewhere, and so does the staff
  log-in.

## Licences

GSAP (GreenSock standard licence, free for websites), Lenis (MIT), Barlow
fonts (SIL Open Font License, `assets/fonts/OFL-LICENSE.txt`).
