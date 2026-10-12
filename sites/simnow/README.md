# SimNow website

A one-page site for SimNow, Salem's sim racing lounge. The page opens on a
black screen, the Lamborghini's headlights flicker on, then the street fades
up around the car with rain falling. Scrolling moves a camera over the photo
(headlight, rain on the windscreen, the wing, a night look, the whole
street) with one chapter per shot, then the info sections: how it works, the
experience, gear shop, and visit.

The car is the owner's own photo of a matte black Aventador SVJ
(`assets/photo/`), brought to life on a canvas by `js/photo.js`: live
headlight glow, animated rain, a night grade and camera moves. The photo was
4x upscaled with Real-ESRGAN and graded (see `render/`).

There is also a second, optional stage: a pre-rendered Blender film of a 3D
car (see "Rendered film" below). It is switched off until a licensed SVJ
model is available.

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
| `js/main.js` | Intro, scroll story (GSAP ScrollTrigger + Lenis), nav, reveals |
| `js/photo.js` | The photo stage: headlight glow, rain, night grade, camera per chapter (`SHOTS`) |
| `assets/photo/` | The graded photo (full size, phone size, card crop) |
| `render/upscale.py` | Real-ESRGAN 4x upscaler in plain numpy (no PyTorch) |
| `render/photo_prep.py` | Grades the upscaled photo and writes `assets/photo/` and `assets/og.jpg` |
| `render/svj_studio.py`, `shots.py`, `post.py` | The optional Blender film (below) |

## Updating the photo

A sharper original makes the biggest difference: the current photo came in at
415×739 and was upscaled. With a new photo:

```bash
cd sites/simnow/render
python3 -I upscale.py RealESRGAN_x4plus.pth photo.jpg photo_x4.png   # skip for a full-size original
python3 -I photo_prep.py photo_x4.png ../assets
```

Then check the headlight positions (`LIGHTS`) and the camera shots (`SHOTS`)
at the top of `js/photo.js`; both are in 0..1 photo coordinates.

## Rendered film (optional)

To use the Blender film instead of the photo, render the frames, run
`post.py`, and add `data-stage="film"` to the `<html>` tag.

## Re-rendering

Needs the `bpy` Python package (Blender 5.2: `pip install bpy==5.2.2` on
Python 3.13) and the car model as glTF.

```bash
cd sites/simnow/render
python -I svj_studio.py -- car.gltf raw intro --res 1280x720 --samples 24
python -I svj_studio.py -- car.gltf raw/hd test 2 7 --res 1920x1080 --samples 64
python -I svj_studio.py -- car.gltf raw story --res 1280x720 --samples 24
python3 post.py raw ../assets
```

- `svj_studio.py` builds the scene: imports the car at real size, dresses it as
  a matte black SVJ (adds the rear wing and front splitter, gloss black
  wheels, SimNow-red calipers), and builds the studio: wet concrete floor,
  haze, six overhead spotlights, a soft box and strip lights.
- `shots.py` holds the camera moves and lighting cues. The intro is timed in
  frames at 30 fps; the story is a camera path through six key shots.
- `post.py` grades the frames (contrast, bloom on the lamps, vignette) and
  writes the WebP sets and the manifest.

On a 4-core CPU a 1280×720 frame takes about 30 seconds, so a full render is
a couple of hours. Rendering skips frames that already exist, so it can be
stopped and resumed.

## The car model

The renders use a Lamborghini Aventador model from the
[car-3d project](https://github.com/saikat111/car-3d), with the SVJ parts
added in `svj_studio.py`. That repository doesn't say where the model came
from or what its licence is, so **treat it as a placeholder until a licensed
SVJ replaces it.** Free SVJ models under CC BY exist on Sketchfab (for example
"Lamborghini Aventador LP 770-4 SVJ" by MARKETPLACE_BP3D). Download one as
glTF, check its licence, and re-render. The part and material names in
`svj_studio.py` (`car_materials`, `place_beams`) will need mapping to the
new model, and the footer credit updated.

## Still needed from SimNow

- The booking link (the "Book a sim" buttons jump to the Visit section).
- The original logo file (the current one was taken from a screenshot).
- Phone number and social links, if they should appear.

## Licences

GSAP (GreenSock standard licence, free for websites), Lenis (MIT), Barlow
fonts (SIL Open Font License, `assets/fonts/OFL-LICENSE.txt`).
