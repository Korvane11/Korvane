# SimNow website

A one-page site for SimNow, Salem's sim racing lounge. A real-time 3D supercar
sits on a wet night circuit: the page opens on a black screen, the headlights
ignite, and scrolling moves the camera around the car through five chapters
before the info sections (how it works, race nights, gear shop, visit).

## Run it locally

The 3D scene uses ES modules and a WebAssembly decoder, so open it through a
web server rather than as a file:

```bash
cd sites/simnow
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static host works (GitHub Pages, Netlify, Vercel). There is no build step.

## Files

| Path | What it is |
| --- | --- |
| `index.html` | Page content and chapter text |
| `styles.css` | Layout and brand tokens (`--brand`, `--bg`, … at the top) |
| `js/stage.js` | three.js scene: car, materials, lights, wet road, camera path, post-processing |
| `js/main.js` | Intro timeline, GSAP ScrollTrigger story, Lenis smooth scroll, navigation |
| `assets/models/supercar.glb` | The 3D car (see below) |
| `vendor/` | three.js r186, GSAP 3.15 + ScrollTrigger, Lenis 1.3 (served locally, no CDN) |

## Swapping the car

`assets/models/supercar.glb` is a stand-in: "Ferrari 458 Italia" by vicent091036,
distributed with the three.js examples (credited in the footer). For a
Lamborghini, buy or license a GLB model (for example a CC-BY or commercial
model on Sketchfab or CGTrader), replace the file, and update the material
mapping in `js/stage.js` (`car.traverse(...)`), which matches parts by their
material names. Update the footer credit to match the new model's license.

## Behaviour notes

- Reduced motion: no intro animation and no camera moves; the lit car is shown
  and the chapters stack as normal content.
- No WebGL: an animated CSS track backdrop is used instead.
- Phones get a lower resolution and no road reflections; the scene also steps
  its resolution down automatically if the first seconds run slowly.
- `?debug` exposes the stage on `window.__simnow`; `?debug=pause` freezes the
  intro so individual moments can be inspected.

## Still needed from SimNow

- The booking link (all "Book a sim" buttons currently jump to the Visit section).
- The original logo file (the current one was taken from a screenshot).
- Phone number and social links, if they should appear.

## Licenses

three.js (MIT), Lenis (MIT), GSAP (GreenSock standard license, free for use on
websites), Barlow fonts (SIL Open Font License, `assets/fonts/OFL-LICENSE.txt`).
