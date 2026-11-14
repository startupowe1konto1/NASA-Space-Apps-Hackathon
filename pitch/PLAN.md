# Pitch deck: plan

Written Sun 15 Nov 2026, 00:30 CET. Spec: `pitch/SPEC.md`. Working prototype: `pitch/deck/prototype/orbit.html` (slides 1, 2, 3 and 5 in one file, on the Iowa field).

## How to run this plan

- **One lead session** owns the deck: it starts the tasks, reviews each one against the spec, and is the only writer of the shared files (`index.html`, `src/stage.js`, `src/scene.js`, `src/tokens.css`). It also talks to the pitch owner.
- **Each task runs as a subagent in its own git worktree**, on the model the task names. A task writes only the files listed for it. If it needs a change in a shared file, it says so in its report and the lead makes it.
- **Model rule:** Opus where the task needs design judgment with no prototype to copy; Sonnet where the spec or the prototype already says what to build; Haiku where the task is fetching, running, counting or checking. If a Haiku task meets something that needs a decision, it stops and reports; it does not decide.
- **Branch and PR:** one branch, `o2/pitch-deck`, one PR titled `[contract] Pitch deck`. Nothing here touches `src/`, so `npm run test` in the repo root is not affected; the gate for this work is the checks in each task plus P12.
- **Preview:** `cd pitch/deck && npm ci && npm run serve`, then `http://localhost:8765/`. Use the app on port 5172 only for the screenshots (P8).
- **Time:** now 00:30. Screenshots (P8) wait for the app's UI freeze. Deck frozen 08:10, PDF public by 09:30, submitted 10:10.

## Order and dependencies

```
P0 (person) ─┐
P1 scaffold ─┼─► P3 slide 1+2 ─► P4 slide 3 ─┐
P2 imagery ──┘        │                      ├─► P10 review ─► P11 PDF ─► P12 final checks ─► P13 (person)
                      ├─► P5 slide 4 (Opus) ─┤
                      ├─► P6 slide 5 ────────┤
                      ├─► P7 slide 7 ────────┤
              P8 screenshots ─► P9 slide 6 ──┘
```

P3 to P7 can run at the same time once P1 and P2 are merged into the branch: each writes one slide file.

## Tasks

### P0 · Three answers from the pitch owner (person, 10 min)

1. Look at parcel `302116_5.0015.28/1` (Uzarzewo, 52.4593° N, 17.1185° E, between road 194 and the railway) on the Geoportal orthophoto. Arable: go on. Not arable: use `302116_5.0015.2` and tell the lead, who reruns the export with that id.
2. Send the team member names as they should be printed.
3. Say where the PDF will be hosted (a public Google Drive link is enough).

### P1 · Scaffold and port the prototype (Sonnet, 60 min)

- **Files:** `pitch/deck/index.html`, `src/stage.js`, `src/scene.js`, `src/tokens.css`, `src/slides/*.js` as empty modules with the interface below, `README.md`.
- **Do:**
  1. Split `prototype/orbit.html` into the modules of spec §10. Keep the prototype file as it is.
  2. `stage.js`: 1920 × 1080 stage scaled to the window; slides 1–7, each with its own step count; right and left arrow, space, page keys; URL `#<slide>.<step>`; `?print=1` and `prefers-reduced-motion` jump to the final state; a key press during an animation finishes it.
  3. `scene.js`: one renderer and camera; rest views `orbit`, `field`, `europe`; `goTo(view)` with elapsed-time easing; the descent from orbit to field as in the prototype; loading of `data/field.json` and the textures; the WebGL-missing path (show `assets/stills/NN.png`).
  4. Slide interface: `export default { steps, mount(ctx), enter(step, ctx), final(ctx) }`, where `ctx` gives the scene, the overlay element for this slide and the data.
  5. `tokens.css`: the tokens and type scale of spec §8, the text block, the facts row, the table, the wash.
- **Done when:** the page loads with no console error; slide 1 shows the orbit; right arrow plays the descent and lands on slide 2's empty state at the Iowa field (the Poznań assets come in P3); `#5.0` opens the Europe rest view directly; `?print=1#1.0` renders with no motion.

### P2 · Imagery for the Poznań field (Haiku, 25 min)

- **Files:** `pitch/deck/scripts/fetch-imagery.sh`, `assets/img/poznan-local.png`, `poznan-region.jpg`, `europe-wide.jpg`, `assets/README.md`.
- **Do:** write the script with these NASA GIBS WMS requests (`https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi`, `SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&STYLES=&CRS=EPSG:4326`; BBOX order is south,west,north,east), run it, and look at each image:
  1. `poznan-local.png`: `LAYERS=HLS_S30_Nadir_BRDF_Adjusted_Reflectance`, `TIME=2025-06-13`, a 13.3 km box centred on the field (52.3995,17.0205,52.5190,17.2166), `WIDTH=444&HEIGHT=444`, PNG. Native resolution on purpose; do not ask for more pixels.
  2. `poznan-region.jpg`: `LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor`, `TIME=2025-06-13`, a 445 km box (50.4593,13.8378,54.4593,20.3992), 2048 × 2048, JPEG.
  3. `europe-wide.jpg`: `LAYERS=BlueMarble_ShadedRelief_Bathymetry`, no `TIME`, a box that holds every `twins.cases[].place` in `data/field.json` with a 250 km margin, 2048 px on the long side, JPEG. Compute the box from the file and print it.
  4. `assets/README.md`: one row per file in `assets/`: source URL, date, licence, credit line. Include `earth.jpg` (Blue Marble, GIBS), `landsat8.glb` (NASA 3D Resources, `Landsat 8/Landsat 8.glb`) and the font.
- **Done when:** the three files exist and are not blank. If `poznan-region.jpg` is more than about a third cloud, try 2025-03-20 and 2025-03-05 and say which date was used. Stop and report if none is clear.

### P3 · Slides 1 and 2 on the real field (Sonnet, 60 min)

- **Files:** `src/slides/01-orbit.js`, `src/slides/02-mariusz.js`, plus a request to the lead for any `scene.js` change.
- **Do:** spec §5 slides 1 and 2. The field outline and the neighbouring parcels come from `field.ring` and `neighbours[].ring` (convert to kilometres from the centroid, x east, z south, as the prototype's `toKm`). Neighbour lines: 1 px, white at 28%. Field outline: the field colour, as in the prototype. The notebook is HTML: a ruled card, rows from `notebook`, crop ids turned into names by one small map in the file, and the `2027 ?` row.
- **Done when:** the descent ends on the parcel with its real shape; the facts row equals `field.json`; the notebook shows five years and the open row; `?print=1#2.3` gives the final state.

### P4 · Slide 3, the layers (Sonnet, 40 min)

- **Files:** `src/slides/03-data.js`.
- **Do:** port the prototype's sheets, table and leader lines. Sheets take the parcel's shape (extrude the ring, do not use a rectangle). Rows as in spec §5. The facts row reads `datasetsUsedForThisField` and `climate.years`.
- **Done when:** five sheets, five rows, straight leader lines that do not cross; a row whose dataset id is missing from `datasetsUsedForThisField.ids` makes the slide throw in the console (so a stale table cannot ship).

### P5 · Slide 4, the engine (Opus, 90 min)

- **Files:** `src/slides/04-engine.js`.
- **Why Opus:** there is no prototype. The task is to make 45 cells and seven rows read at a glance from the back of a room.
- **Do:** spec §5 slide 4, exactly its four steps. HTML and SVG over the scene, no new 3D. Crop names from the same map as P3 (ask the lead to move the map to a shared file). Bars 0–100 with the `low`–`high` whisker; values printed as whole numbers.
- **Check with the lead after step 2 of the build**, with one screenshot of the final state, before polishing motion.
- **Done when:** the final state matches the spec; the rows are exactly the ids in `shownByGoal.keepSoil`; the current rotation is tagged; nothing on the slide says "forecast" except the caption's "not a forecast"; no per-year marks on the rows.

### P6 · Slide 5, similar regions (Sonnet, 45 min)

- **Files:** `src/slides/05-regions.js`.
- **Do:** port the prototype's regions step to the `europe` rest view and `europe-wide.jpg`. Dots at `twins.cases[].place`, numbered in table order; table columns as in the spec; region names cut at the first bracket; the footnote.
- **Done when:** ten dots inside the frame, none under the text block or the table; table values equal `field.json`; the header reads "Winter rapeseed, t/ha" only if every case's unit says winter rapeseed, otherwise the slide throws.

### P7 · Slide 7, back to orbit (Sonnet, 35 min)

- **Files:** `src/slides/07-close.js`.
- **Do:** spec §5 slide 7. Camera to the `orbit` view. Sources table built from `datasetsUsedForThisField.ids` joined with `datasets.list`. Team names and the project name from one constants file (ask the lead). QR code only if the lead gives a URL; draw it as SVG with no library if it is short, otherwise leave the link as text.
- **Done when:** every dataset id used appears once; NASA entries first; credits line present; no logo.

### P8 · Screenshots of the app (Sonnet, 40 min, after the UI freeze)

- **Files:** `pitch/deck/scripts/shoot-app.mjs`, `assets/app/01-field.png` … `04-rotations.png`.
- **Do:** Playwright with system Chrome (`channel: 'chrome'`), viewport 1280 × 800, against `http://localhost:5172`, English. Add the parcel by its number, enter the notebook years, pick the goal "Keep my soil", wait for the rotations text, and save one PNG per step. Wait for specific text, not for elements. Read the current screen order from the app first; it changed in #165.
- **Done when:** four PNG files, no loading or error state in any of them, the parcel number visible on the first.
- **If the analysis shows a source error:** stop and report with the screenshot. Do not retouch.

### P9 · Slide 6, the answer (Sonnet, 45 min)

- **Files:** `src/slides/06-answer.js`.
- **Do:** spec §5 slide 6. A plain browser frame (rounded rectangle, a thin top bar, no brand marks) with the four screenshots cross-fading in order; step 5 moves the frame left and shows the closing lines.
- **Done when:** the two card headings and the judgment sentence are on the final state, word for word as in the spec.

### P10 · Review of the whole deck (Opus, 45 min)

- Play the deck start to end at 1920 × 1080 and 1366 × 768. For each slide compare the final state with spec §5 and §8 and list every difference.
- Read every English line for plain wording (the anti-ai-writing check) and fix it.
- Time the Polish notes read aloud at a normal pace; adjust the notes, not the slides, to land at 2:50–3:05.
- Give the fixes to the slide owners or make them; rerun.

### P11 · PDF and backup video (Haiku, 25 min)

- **Files:** `scripts/export-pdf.mjs`, `scripts/record.mjs`, `assets/stills/01.png` … `07.png`, `pitch/out/deck.pdf`, `pitch/out/deck.webm`.
- **Do:** as spec §10. Print the page count and the file size.
- **Done when:** seven pages; each page image is not blank and not a loading state (open each one and look).

### P12 · Final checks (Haiku, 20 min)

Run and report each line as pass or fail with the evidence:

1. `sh pitch/deck/scripts/export-data.sh` on the current `main`; `git diff --stat pitch/deck/data/field.json`. If numbers changed, tell the lead, who reruns P11.
2. Every number in the seven stills appears in `field.json` (list them).
3. `grep -ri "nasa" pitch/deck/src pitch/deck/index.html` shows text mentions only, no image named logo, insignia or meatball.
4. `grep -rin "forecast" pitch/deck/src` shows only "not a forecast".
5. Slide 1 still has team, members and challenge.
6. `pitch/out/deck.pdf` opens and has seven pages.
7. `~/.local/bin/trufflehog git file://. --no-update` on the branch finds nothing new.

### P13 · People (30 min)

- Two rehearsals with a timer and two practice questions each: why "weak" on the soil score, and why a Polish field and not Iowa.
- Play the deck once on the pitch laptop on a second screen.
- Upload the PDF, open the link in a private window, paste it into "Link to Project Demo".

## If time runs short

Cut in this order, each cut keeps seven valid PDF pages:

1. The backup video (P11 second half).
2. Slide 4's playhead sweep: show the final state after the ribbon.
3. Slide 6's four-step sequence: show the rotations screen only.
4. The live 3D on slides 3 to 7: use the stills and keep the motion of the text and tables. Slides 1 and 2 with the descent stay live; they are built.

## Known traps (from the prototype)

- zsh does not split `$VAR` into words: write lists into `for` loops literally.
- The Landsat model is Draco-compressed: the loader needs `DRACOLoader` with the decoder path `node_modules/three/examples/jsm/libs/draco/gltf/`.
- GIBS upsamples with hard pixels if asked for more pixels than the data has. Ask for the native size.
- The Browser pane must be visible while testing, or the page stops drawing frames and screenshots are stale.
- `integracja.gugik.gov.pl` fails half of its EPSG:3857 requests; the deck does not call it, it uses the outlines in `field.json`.
- `mapy.geoportal.gov.pl` is not on the allowed list; the orthophoto check is done by a person in a browser.
