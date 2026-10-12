# SimNow website

A one-page site for SimNow, Salem's sim racing lounge. It opens on a black
screen, the Lamborghini's headlights flicker on in the dark, the night
spreads out around them as the car drives, and the site opens over it. The car keeps driving behind everything:
the hero, five scroll chapters, and (dimmed) the info sections: how it works,
the experience, gear shop, visit.

The background is one looping clip, `assets/drive/drive.mp4` (H.264, with
`drive.webm` for browsers without H.264): night-drive footage by
[@supercar_driven](https://www.tiktok.com/@supercar_driven), used with the
creator's permission and credited in the footer. The TikTok watermark was
removed (ffmpeg `delogo`, two positions: left until 5.0 s, bottom-right after)
and the music stripped. The clip is vertical (576x1024): it fills the screen
on phones and the right of the screen on desktop, feathered into the page.

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
| `js/lights.js` | The headlights-first intro: draws the clip through WebGL so only the headlights show (with a bloom), then reveals the scene and hands back to the `<video>` |
| `assets/drive/` | The clip (MP4 + WebM), its poster frame and the race-nights card image |
| `render/night_drive.py`, `render/night_post.py` | A 3D night-drive render, kept as a fallback background (not used now) |
| `render/svj_studio.py` | Car set-up shared by the renders (materials, SVJ wing and splitter); also an older studio scene |
| `render/post.py` | The grade (contrast, bloom on the lamps, vignette) |
| `render/upscale.py` | Real-ESRGAN 4x photo upscaler in plain numpy, kept for future photos |

## The headlights intro

`js/lights.js` runs for the first ~4 seconds (the clip plays at 0.8x under
it). Timeline: black, two blinks at 0.35 s, lamps up by 1.3 s, the scene
spreads out from the lamps from 1.6 s, the site opens at 2.1 s, and at
3.9 s the canvas fades out over the plain video, just before the clip's first
cut (3.1 s of footage). On desktop the clip sits in the middle of the screen
during the intro, then slides to the right as the site opens. On phones the
crop starts on the car, so both lamps are in view, then pans to centre.
Without WebGL the clip just fades up from black.

The lamp zone in the shader (`zone()`, about 43-53% down the frame and 24-99%
across) is where the headlights sit in this clip's first shot. A different
clip needs it re-measured, or other bright lights will show through.

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

With a better copy of the footage (ideally the creator's original file, which
has no watermark and a higher resolution), re-encode it as `drive.mp4` and
`drive.webm` and replace the poster (and re-measure the lamp zone, see
above):

```bash
ffmpeg -i original.mp4 -an -c:v libx264 -preset slow -crf 21 -pix_fmt yuv420p -movflags +faststart assets/drive/drive.mp4
ffmpeg -i original.mp4 -an -c:v libvpx-vp9 -b:v 0 -crf 32 -row-mt 1 assets/drive/drive.webm
```

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

## Still needed from SimNow

- The booking link (the "Book a sim" buttons jump to the Visit section).
- Hourly prices.
- The original logo file (the current one was taken from a screenshot).
- Social links, if they should appear.

Phone and email (971-345-2568, Info@SimNowUSA.com) come from their current
site and are on the Visit section, the footer and the JSON-LD listing in
`index.html`.

## Licences

GSAP (GreenSock standard licence, free for websites), Lenis (MIT), Barlow
fonts (SIL Open Font License, `assets/fonts/OFL-LICENSE.txt`).
