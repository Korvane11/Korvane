# SimNow website

A one-page site for SimNow, Salem's sim racing lounge. The page opens on a
black screen, the Lamborghini's headlights come on, the studio spotlights hit
one by one, and then the hero appears. Scrolling moves the camera around the
car (headlight, wheel, flank, rear, side profile) with one chapter per shot,
then the info sections: how it works, the experience, gear shop, and visit.

The car is not real-time 3D. It is rendered in Blender (Cycles) into frame
sequences, and the page draws the frames on a canvas as you scroll. This is
the same technique as the cinematic car sites it is modelled on, and it looks
photographic on every device.

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
| `js/main.js` | Frame loading, intro playback, scroll story (GSAP ScrollTrigger + Lenis) |
| `assets/film/lg/` | 1280×720 frames for larger screens |
| `assets/film/sm/` | 960×540 frames for phones |
| `assets/film/hd/` | Sharper stills of the six key shots, shown while a chapter holds |
| `assets/film/manifest.json` | Frame counts, key frames, and where the car sits in each frame |
| `assets/stills/` | Stills used in the section cards and the visit background |
| `render/` | The Blender scene and post-processing that produce all of the above |

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
