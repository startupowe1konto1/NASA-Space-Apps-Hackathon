# Pitch deck

The deck for the live pitch and the Project Demo. Spec: `pitch/SPEC.md`. Plan: `pitch/PLAN.md`.

It is a static page with its own `package.json`, separate from the app.

```bash
cd pitch/deck
npm ci
npm run serve
```

Then open `http://localhost:8765/prototype/orbit.html` for the working prototype (slides 1, 2, 3 and 5 on the Iowa field; arrow keys or the buttons). The real deck will be `http://localhost:8765/`.

## What is here

| Path | What |
|---|---|
| `prototype/orbit.html` | The approved prototype: orbit, descent, field, data layers, similar regions. One file, kept for reference. |
| `data/field.json` | Every number the deck shows, for the pitch field. Written by the script below; do not edit. |
| `scripts/export-data.sh` | Regenerates `data/field.json` from the app's providers and engine. Run from the repo root. Calls NASA POWER and GUGiK ULDK. |
| `assets/img/` | NASA GIBS imagery: Blue Marble (`earth.jpg`), and the prototype's Iowa images. |
| `assets/glb/landsat8.glb` | Landsat 8 model from NASA 3D Resources. Draco-compressed. No NASA insignia on it. |

## Credits to print on the last slide

- Imagery: NASA GIBS (Blue Marble; MODIS Terra; HLS).
- Spacecraft model: Landsat 8, NASA 3D Resources.
- Typeface: Inter, SIL Open Font License 1.1.
