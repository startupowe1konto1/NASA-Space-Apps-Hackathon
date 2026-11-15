# Pitch deck: spec

Written Sun 15 Nov 2026, 00:20 CET, from the team call of Sat 14 Nov (`context/meetings/2026-11-14-fathom-transcript.md`) and the decisions the pitch owner made afterwards. The task plan is `pitch/PLAN.md`. A working prototype of slides 1, 2, 3 and 5 is in `pitch/deck/prototype/orbit.html`.

## 1. What we are making

One deck, used twice:

- **Live pitch in Poznań:** 3 minutes of talking and 2 minutes of questions. We speak Polish; every word on screen is English.
- **Project Demo on the Space Apps project page:** the same seven slides as a PDF.

The deck is a static web page driven by the arrow keys. One camera travels through the whole story: orbit, down to one field, up over Europe, back to the field, back to orbit.

## 2. Hard limits

| Limit | Source |
|---|---|
| At most 7 slides, title slide included. More than 7 means no Global Judging. | Project Submission Guide 2026, "Tips for Creating a Project Demo" |
| Slides in English. | same |
| The slides name the team, the team members and the challenge. | same |
| The demo link is public: no login, no permission request. | same, "Link to Project Demo" |
| No NASA logo, flag or mission identifier in generated content. | same, "Use of Super Intelligence" |
| Images or video made by an AI tool carry a visible watermark. The deck uses none; if one is added, it gets the watermark. | same |
| No likeness of a person under 18. | same, "Submitting Your Project" |
| Judged on Impact, Creativity, Validity, Relevance, Presentation. | same |
| Our own deadline: slides frozen Sun 08:10, submitted Sun 10:10. | `HACKATHON.md` §6 |

The guide names no file format. We submit a PDF with exactly seven pages, because a click-through page makes "seven slides" arguable and the guide warns that a new website may be blocked by the judges' web filter. The animated page is an extra link in the project description.

## 3. Decisions already made

| # | Decision | By |
|---|---|---|
| 1 | Deck of 7 slides, not a 30-second video. | pitch owner |
| 2 | HTML page driven by the arrow keys; each key press plays the next step. | pitch owner |
| 3 | Look: space and technology. Satellite, Earth, a fast descent to the field. The low-poly farm (`pitch/farm-stills/`) is not used. | team, after the prototypes |
| 4 | One typeface, one colour system, no decorative icons, tables instead of badges. | team feedback on prototype 1 |
| 5 | The field is a real arable parcel near Poznań (section 6). Iowa is not shown. | pitch owner |
| 6 | The farmer is Mariusz. He is shown through his notebook, not as a figure. | pitch owner |
| 7 | Similar regions get their own slide: zoom out to Europe, our field in one colour, the regions in another. | team |
| 8 | The app is shown as real screenshots played in sequence, not as a live demo. | pitch owner |
| 9 | Every number on a slide comes from `pitch/deck/data/field.json`, which a script writes from the app's own code. | pitch owner |

## 4. The story

Mariusz farms 22 hectares near Poznań and plans next year's crop from a notebook. Forty-five years of NASA weather data, the terrain and the soil of that exact field already exist as open data. The tool reads them, tests every sensible rotation against those 45 years, looks at regions with the same climate, and gives him three rotations with their evidence. He decides.

## 5. Slides

Stage: 1920 × 1080. Each slide lists its steps (one key press each) and its **final state**, which is what the PDF page shows and must make sense without the speaker.

Times add up to 180 s. The speaker talks freely; the repo holds no speaker notes.

### Slide 1 · Orbit (10 s)

- **Scene:** Earth (NASA Blue Marble), thin blue air glow, stars, the Landsat 8 model in the lower left with its instrument towards Earth. Slow drift.
- **Text:** eyebrow `NASA Space Apps Challenge 2026 · Field Shift: Adapting Farms with NASA Data`; title: the project name (`Field Shift tool` until D13 is decided, read from one constant); lede `From orbit to one field.`; facts row: `Team` Vibecodersi · `Members` the names · `Local event` Poznań.
- **Steps:** none. The next key press starts the descent.
- **Final state:** as described.

### Transition · The descent (about 4 s, not a slide)

The camera accelerates from orbit to the field's coordinates, passes a bright flash of atmosphere, falls through the regional image and the neighbourhood image, and tilts to rest above the parcel. Already built in the prototype; keep its timing (1.7 s to the air, 2.6 s to the field).

### Slide 2 · Mariusz (25 s)

- **Scene:** the parcel from above at an angle. Soft, darkened NASA imagery underneath; crisp thin lines for the neighbouring parcels; the field's outline in green.
- **Text:** eyebrow `The problem`; title `Mariusz plans next year from a notebook.`; facts row: `Location` Uzarzewo, near Poznań · `Coordinates` from `field.centroid` · `Area` from `field.areaHa`.
- **Steps:** (1) field and facts; (2) the notebook card slides in on the right: a ruled page with a handwritten-style table, one row per year from `notebook` (`2022 Winter wheat` … `2026 Winter wheat`); (3) a last row `2027` with a question mark, which pulses once.
- **Final state:** field, facts, notebook with the open question.
- **Rule:** the notebook is the only hand-drawn element in the deck. It is an HTML element, not a generated image.

### Slide 3 · The data (25 s)

- **Scene:** same view. Five translucent sheets fall onto the field one by one and hover as a stack.
- **Text:** eyebrow `The data`; title `Five layers already describe this field.`; lede `Open data, read for this exact place.`
- **Table (right), numbered, with a thin leader line from each sheet to its row:**

  | # | Layer | Source |
  |---|---|---|
  | 01 | Weather, 1981–2025 | NASA POWER |
  | 02 | Root-zone soil wetness | NASA POWER |
  | 03 | Slope | NASADEM |
  | 04 | Soil | SoilGrids |
  | 05 | Parcel boundary | GUGiK land register |

- **Facts row under the title, from `datasetsUsedForThisField` and `climate.years`:** `Datasets for this field` 14 · `From NASA` 4 · `Weather record` 45 years.
- **Steps:** (1) sheets fall, top first; (2) table and leader lines fade in; (3) facts row counts up.
- **Final state:** stack, table, facts.
- **Rule:** a layer is listed only if its dataset id is in `datasetsUsedForThisField.ids`. SMAP is registered in the app but is not read for the field today, so it is not a layer. If that changes before the freeze, rerun the export and update the row.

### Slide 4 · The engine (35 s)

- **Scene:** same view; the sheets press into the field. The lower half of the screen becomes a working panel.
- **Text:** eyebrow `The engine`; title `Every rotation is tested against 45 years.`
- **Panel, top:** a ribbon of 45 cells, one per year in `climate.yearly`, labelled at 1981, 1990, 2000, 2010, 2020, 2025. Cells with `drought: true` are marked in the risk colour; a small legend says `Drought year`.
- **Panel, below:** one row per rotation id in `shownByGoal.keepSoil` (the current rotation and the best three others, the same four the app shows for the soil goal), looked up in `rotations`: the crops as plain text (`Field pea → Winter wheat → Potato + phacelia`), and two bars with values, `Soil health` and `Climate resilience`, each with a thin whisker from `low` to `high`. The row with `isCurrent` carries the tag `Mariusz today`.
- **Steps:** (1) the ribbon draws left to right; (2) the rows appear in the order Mariusz would think of them (current first) with empty bars; (3) a playhead sweeps the ribbon once while the bars fill to their values; (4) the rows reorder by `rank`, best first; the three that are not the current one turn green; the current one keeps its tag and its place at the bottom.
- **Final state:** ribbon, four sorted rows, the three proposals highlighted, caption `Soil health and climate resilience come first. Income is a replay of past years at today's prices, not a forecast.`
- **Rules:** the bars show only exported values. Do not draw per-year results for a rotation; the export does not contain them. Do not print confidence words; the whisker carries the uncertainty.

### Slide 5 · Similar regions (20 s)

- **Scene:** the camera rises to a view of Europe (cloud-free Blue Marble). The field is a green dot with a slow ring; each case in `twins.cases` is an amber dot at `place`, numbered, joined to the field by a thin amber line.
- **Text:** eyebrow `Similar regions`; title `Ten regions share this climate.`; lede `What they grow, and how it yields, is evidence for this field.`
- **Table (right):** `#`, `Region`, `Similarity`, `Winter rapeseed, t/ha`, one row per case, from `twins.cases`. Region names are shortened to the name before the first bracket.
- **Footnote:** `Similarity is our calculation on five NASA POWER climate features. Yields: Eurostat, mean of 2019–2023. Evidence, not a forecast.`
- **Steps:** (1) the rise; (2) dots and lines appear in order of similarity; (3) the table fades in.
- **Final state:** map, ten dots, table, footnote.
- **Rule:** the word is always "regions". The app compares the field with NUTS 2 regions, not with other fields.

### Slide 6 · The answer (45 s)

- **Scene:** the camera returns to the field. A browser frame rises from it and holds real screenshots of the app, taken for this parcel.
- **Text:** eyebrow `The tool`; title `Three rotations, each with its evidence.`
- **Steps:** (1) frame with the field step (the parcel on the map); (2) the crop history step with the notebook rows; (3) the goal step; (4) the rotations screen with the first card open; (5) the frame moves left and the closing lines appear on the right: `What we do not know` and `Check locally` are on every card. Below: `The tool supports the farmer's judgment. It does not replace it.`
- **Final state:** the rotations screen in the frame and the closing lines.
- **Rules:** screenshots are taken by a script from the running app after the UI freeze, in English, at one fixed size. No mock-ups. If a screenshot shows a `weak` label on the soil score, that is what the app says; do not crop it out, be ready to explain it in the questions.

### Slide 7 · Back to orbit (20 s)

- **Scene:** the camera pulls back up to the orbit view of slide 1.
- **Text:** eyebrow `Built on open data`; title: the project name.
- **Table (right):** two groups. `NASA`: the NASA entries of `datasetsUsedForThisField`, by name. `Partners and others`: the remaining entries, grouped by provider. One line below: `Imagery in this deck: NASA GIBS (Blue Marble, MODIS Terra, HLS). Spacecraft model: Landsat 8, NASA 3D Resources.`
- **Left, under the title:** team name, member names, the challenge name, the link to the app (and a QR code if the app is hosted by then), and `Built with AI assistance; details on the project page.`
- **Steps:** none.
- **Final state:** as described.

## 6. The field

- **Parcel:** `302116_5.0015.28/1`, Uzarzewo, Swarzędz commune (name from Nominatim), 22.0 ha, centroid 52.4593° N, 17.1185° E, 1.63 km from the old demo point. A plain four-sided field between road 194 (Biskupicka) and the railway.
- **Why not the old one:** the demo rectangle (52.45° N, 17.10° E) is on Dworcowa street in Kobylnica, on houses.
- **How it was chosen:** the land register (ULDK) was asked for every parcel within 2 km; the 40 parcels of 4 to 45 ha were each sampled at about 140 points against the OpenStreetMap map, and the share of points drawn as farmland was counted. This parcel: 100%, no buildings. On NASA HLS imagery it is pale on 20 Mar 2025 and beige on 13 Jun 2025.
- **A warning from this search:** the first pick (`…0015.175`) looked like a winter crop on the satellite colours and is a forest. Do not choose a field from colour alone; check the land use.
- **Still to confirm by a person:** look at the parcel on the Geoportal orthophoto. Fallback: `302116_5.0015.2` (19.1 ha, 96% farmland, 1.28 km away). To switch, run `sh pitch/deck/scripts/export-data.sh <parcel id>`.
- **No backend change:** soil, slope and crop suitability are precomputed for the demo point and the app uses them for any field within 2 km (`MAX_DISTANCE_KM` in `src/context-data/provider.ts`). The export ran the app's analysis for this parcel and it matches the demo field's. Strictly, the soil and slope values are those of the demo point 1.63 km away. Weather and similar regions come from NASA POWER, whose grid cell is about 50 km wide. A field further than 2 km away would lose soil, slope and suitability until the O4 scripts are rerun; do not move it that far.
- **In the app:** the parcel is added with the parcel number search or a tap on the map. `src/fixtures/fields.ts` is not changed.

## 7. Data

`pitch/deck/data/field.json` is written by `sh pitch/deck/scripts/export-data.sh` from the app's providers and engine (NASA POWER and GUGiK ULDK are called live). It holds the parcel outline, the neighbouring parcels' outlines, the notebook, soil and slope, 45 years with the drought years, every rotation with its scores, the ten similar regions with yields and map positions, and the datasets used.

- Rerun it after any merge that changes the engine or the data, and once more just before the freeze. The file records the commit it was made from.
- The deck reads the file at load. No number is typed into a slide. Text that depends on a number (for example "Ten regions") is checked against the file by the PDF check in the plan.
- Export of Sun 00:50 (main at 73e7d71, after the soil rule rows of #175): 13 datasets used for this field, 4 from NASA; 45 years (1981–2025); 9 drought years; 7 rotations; current rotation soil health 27, best 58; ten regions with similarity 83–95.
- `rank` is not the order of the soil score: for the soil goal the second row (rank 7) scores 53 and the third (rank 9) scores 55. The engine ranks on more than the soil score; be ready to say so in the questions.

## 8. Look

- **Typeface:** Inter (variable, bundled from `@fontsource-variable/inter`, OFL). Tabular numbers. No second typeface, except the notebook rows, which use a handwriting-style face bundled the same way (pick one OFL face, for example Caveat, and use it nowhere else).
- **Type scale (px at 1920 wide):** eyebrow 21, weight 500, letter-spacing 0.14em, upper case; title 88, weight 600, letter-spacing −0.03em, line-height 1.02; lede 34; table text 23–25; table head and small labels 16–18 upper case; footnotes 16–17.
- **Colour tokens:** background `#05070d`; text `#f5f7fa`; muted `#9aa4b2`; hairline `rgba(255,255,255,.16)`; field and product `#3ddc97`; similar regions `#f5b84a`; data layers `#8ec5ff`; risk `#ff7a6b`. Each colour has one meaning and is used for nothing else.
- **Layout:** margins 112 px; text block top left, at most 640 px wide; tables on the right, 560–620 px wide; one dark wash behind each of them instead of boxes. The subject of the scene sits between them.
- **Not allowed:** icons, emoji, badges, glows, corner brackets, drop shadows on text boxes, gradient text, more than one accent colour in a text block, slogans in upper case.
- **Imagery:** NASA only (GIBS). At field level the image is requested at its native resolution and smoothed by the GPU, darkened to about 36%, and the sharpness comes from vector lines (parcel outlines), never from upscaled pixels.

## 9. Motion

- Every animation runs on elapsed time, not on frames, so a slow machine arrives on time (the prototype shows the pattern in its rest-view easing).
- Durations: text 0.5 s; sheets 0.9 s each, 0.22 s apart; camera moves between rest views 1.5–2.5 s with an exponential ease; the descent as in the prototype.
- One thing moves at a time. Nothing loops except the slow camera drift and the field's ring on slide 5.
- `prefers-reduced-motion` and `?print=1` both skip to the final state of the requested slide.
- A key press during an animation jumps to that step's final state; a second press goes on. Left arrow goes back one step, to its final state.

## 10. Build

- **Folder:** `pitch/deck/`, a static site with its own `package.json` (three 0.180.0, the Inter font). It does not touch the app's dependencies. Served with any static server; `npm run serve` uses Python's.
- **Files:** `index.html` (the deck); `src/stage.js` (scaling, slide and step control, URL `#slide.step`, print mode); `src/scene.js` (renderer, camera, rest views, the descent); `src/slides/01-orbit.js` … `07-close.js` (one file per slide: its text, steps and what it adds to the scene); `src/tokens.css`; `assets/`; `data/field.json`; `scripts/`.
- **Rest views:** orbit, field, Europe. Slides ask the scene for a view; only `scene.js` moves the camera.
- **Without WebGL:** the page shows the PDF page images of the same slides (`assets/stills/NN.png`) with the same text. This is also the path for the PDF.
- **PDF:** `scripts/export-pdf.mjs` opens each slide with `?print=1` in system Chrome through Playwright at 1920 × 1080, saves seven PNG files to `assets/stills/`, and builds `pitch/out/deck.pdf` with seven pages. It fails if a slide logs a console error or if the PDF does not have exactly seven pages.
- **Backup video:** `scripts/record.mjs` plays the whole deck with fixed delays and records it, for a room with no usable laptop.
- **Assets and credits:** `assets/README.md` lists every file, its source URL, licence and the credit line. NASA imagery and the Landsat 8 model are credited on slide 7. The model has no NASA insignia; check again if it is replaced.

## 11. Done when

1. The deck plays from slide 1 to slide 7 with the right arrow only, in Chrome, at 1920 × 1080 and at 1366 × 768, with no console error.
2. The PDF has seven pages, each readable alone, and each page's numbers equal `field.json`.
3. Slide 1 names the team, the members and the challenge.
4. No NASA logo appears anywhere; every non-NASA source is named on slide 7.
5. The sentence about supporting the farmer's judgment is on slide 6; "forecast" appears only in "not a forecast".
6. A timed run-through of the talk takes 2:50–3:05.
7. The deck was played once on the laptop that will be used, on the room's screen or a second display.
8. The English text went through the anti-ai-writing check.

## 12. Open, needs a person

- ~~Confirm the parcel on the orthophoto (section 6).~~ Confirmed by the pitch owner, Sun 00:30.
- ~~Team member names as they should appear on slide 1 and 7.~~ In `src/constants.js`.
- The project name (D13). The deck reads it from `PROJECT_NAME` in `src/constants.js`.
- ~~Where the PDF is hosted.~~ In the repo, `pitch/out/deck.pdf`; public when the repo is made public.
- Every soil score carries `weak` confidence. That is the engine's rule, not a fault: a rule without a low and high value costs one level, and an indicator that cannot be computed (erosion has no row for these crops) costs another. It changes only if O4 adds those rule rows. Be ready to say this in the questions.
- `rank` is a rotation's position among every candidate the engine scored (the current rotation is 99th for the soil goal). The deck may say so only if the total number of candidates is added to the export; it is not there today.
