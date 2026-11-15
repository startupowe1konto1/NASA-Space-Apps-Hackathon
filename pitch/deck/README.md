# Pitch deck

The deck for the live pitch and the Project Demo. Spec: `pitch/SPEC.md`. Plan: `pitch/PLAN.md`.

It is a static page with its own `package.json`, separate from the app.

```bash
cd pitch/deck
npm ci
npm run serve
```

Then open `http://localhost:8765/prototype/orbit.html` for the working prototype (slides 1, 2, 3 and 5 on the Iowa field; arrow keys or the buttons). The deck itself is `http://localhost:8765/`: right arrow, space or Page Down goes on, left arrow or Page Up goes back, and the URL hash `#<slide>.<step>` (for example `#5.0`) opens a slide directly. `?print=1` and `prefers-reduced-motion` show the final state of the requested slide with no motion. `?nowebgl=1` tests the no-WebGL path.

## What is here

| Path | What |
|---|---|
| `index.html` | The deck page: stage, import map, loads `src/stage.js`. |
| `src/stage.js` | 1920 x 1080 stage scaled to the window, slide and step control, keys, URL hash, print and reduced-motion mode. Documents the slide interface at the top. |
| `src/scene.js` | The one renderer and camera. Rest views `orbit`, `field`, `europe`; `goTo(view, {instant})`; the descent; loads `data/field.json` and the textures; the no-WebGL still. Only file that moves the camera. |
| `src/slides/01-orbit.js` ... `07-close.js` | One module per slide: `{ steps, mount, enter, final }`. Slides 2 to 7 are placeholders (eyebrow and title) until their tasks fill them in. |
| `src/tokens.css` | Colour tokens, type scale, text block, facts row, table and wash of spec section 8. |
| `prototype/orbit.html` | The approved prototype: orbit, descent, field, data layers, similar regions. One file, kept for reference. |
| `data/field.json` | Every number the deck shows, for the pitch field. Written by the script below; do not edit. |
| `scripts/export-data.sh` | Regenerates `data/field.json` from the app's providers and engine. Run from the repo root. Calls NASA POWER and GUGiK ULDK. |
| `assets/img/` | NASA GIBS imagery: Blue Marble (`earth.jpg`), and the prototype's Iowa images. |
| `assets/glb/landsat8.glb` | Landsat 8 model from NASA 3D Resources. Draco-compressed. No NASA insignia on it. |

## Credits to print on the last slide

- Imagery: NASA GIBS (Blue Marble; MODIS Terra; HLS).
- Spacecraft model: Landsat 8, NASA 3D Resources.
- Typeface: Inter, SIL Open Font License 1.1.
