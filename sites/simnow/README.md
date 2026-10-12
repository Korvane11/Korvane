# SimNow website

A one-page site for SimNow, Salem's sim racing lounge. It opens on a black
screen: the Lamborghini's running lights flicker on, the headlight beams hit
the road, and the street lights switch on down a wet highway at night. Then
the site opens, and the car keeps driving behind everything: the hero, five
scroll chapters, and the info sections (how it works, the experience, gear
shop, visit).

The drive is a 3D render (Blender Cycles), not filmed footage: a matte black
Lamborghini on a wet highway with street lights, a guardrail and distant city
lights, a tracking camera and motion blur. Two videos:

- `assets/drive/intro-*.mp4|webm`: the lights-on intro (2 s, plays once)
- `assets/drive/loop-*.mp4|webm`: the drive (6 s, loops seamlessly)

The loop's first frame matches the intro's last, so the hand-over can't be
seen. Each comes at 1280 px for larger screens and 854 px for phones, as
H.264 MP4 with a VP9 WebM for browsers without H.264.

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
| `js/main.js` | Intro and loop playback, scroll chapters (GSAP ScrollTrigger + Lenis), nav, reveals |
| `assets/drive/` | The videos, a poster frame and the race-nights card image |
| `render/night_drive.py` | The night-drive scene and render |
| `render/night_post.py` | Grades the frames and encodes the videos, poster, card and `og.jpg` |
| `render/svj_studio.py` | Car set-up shared by the renders (materials, SVJ wing and splitter); also an older studio scene |
| `render/post.py` | The grade (contrast, bloom on the lamps, vignette) |
| `render/upscale.py` | Real-ESRGAN 4x photo upscaler in plain numpy, kept for future photos |

## Re-rendering the drive

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

## The car model

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
- The original logo file (the current one was taken from a screenshot).
- Phone number and social links, if they should appear.

## Licences

GSAP (GreenSock standard licence, free for websites), Lenis (MIT), Barlow
fonts (SIL Open Font License, `assets/fonts/OFL-LICENSE.txt`).
