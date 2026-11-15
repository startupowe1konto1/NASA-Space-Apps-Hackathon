# CropShifter

CropShifter helps a farmer choose a crop rotation for one field. The farmer marks the field on a map, picks a goal (keep the soil, improve it, or income) and says what grew there in the last years. The app compares the current rotation with the three best alternatives for that goal. Each rotation is scored on soil health and climate resilience against 45 years (1981–2025) of NASA data for that field, and each card lists its evidence, its data gaps and the risks to check locally. The tool supports the farmer's judgment. It does not replace it.

Built in 48 hours for the NASA Space Apps Challenge 2026, challenge [Field Shift: Adapting Farms with NASA Data](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/).

| | |
|---|---|
| Team | Vibecodersi, local event Poznań, Poland |
| Members | Mikołaj Konieczny, Mateusz Wojciechowski, Oskar Pelzer, Wojciech Rudnicki |
| App | https://cropshifter-demo.vercel.app/?lang=en (English; `?lang=pl` for Polish) |
| Pitch deck (7 slides) | PDF: https://cropshifter-demo.vercel.app/pitch/deck.pdf · animated HTML on a laptop: https://cropshifter-demo.vercel.app/pitch/ (right arrow or space to advance) |
| Space Apps project page | https://www.spaceappschallenge.org/2026/find-a-team/ai-slopers/?tab=project |

## Try it

1. Open the app and press Start.
2. Find the field. In Poland, search a parcel number (try `302116_5.0015.28/1`, a 22 ha field in Uzarzewo near Poznań) or tap the map: the app loads the land register parcel from GUGiK. Elsewhere, search an address and draw the outline. Two demo fields sit behind the buttons on the map: one near Poznań, one in Iowa.
3. Pick a goal, for example "Keep my soil".
4. Mark the crops of the last two or three years.
5. Set the priorities (water, forage, nitrogen, erosion, organic matter) and the crops you will not grow.
6. Read the four rotation cards, then step 6, "Switch or stay?", which puts the best rotation next to the current one, with income.

The app works on a phone. It has no accounts and stores nothing on a server.

## What it does

- **Four rotations per field**: the farmer's current one and the three best for the chosen goal. Soil health and climate resilience come first on every card, whatever the goal. Money enters the ranking only under the income goal.
- **Scores with ranges**: every score has a low–high range and a confidence label, so a thin record looks thin.
- **Five sections per card**: why it was suggested, the evidence, the benefits, the data gaps and the risks for local review.
- **Calendar strip**: month by month, when the soil lies bare and which months were hit by drought, heat or frost in the field's record.
- **Similar fields**: regions in Europe and the USA with a climate like this field's, and the yields they reported.
- **Income replay**: past years replayed at today's prices and today's payment rates. It is not a forecast and promises no yield.
- **Sources on screen**: each number names its dataset, native resolution, period, retrieval date, and whether it is observed, a model estimate or our calculation. Missing data is shown as missing, with the reason.
- **Glossary**: technical terms open a plain-language explanation.

## NASA data

| Dataset | What the app uses it for |
|---|---|
| [NASA POWER](https://power.larc.nasa.gov/) daily and monthly agroclimatology, 1981–2025, about 50 km grid (model estimate) | Drought, heat and frost years for the field; water balance; climate resilience score; the hazard marks on the calendar; yield loss in the income replay |
| NASA POWER climatology | Climate features used to find similar fields |
| [NASADEM](https://planetarycomputer.microsoft.com/dataset/nasadem) elevation, via Microsoft Planetary Computer | Slope of the field (our calculation), which feeds the erosion risk |
| NASA GIBS imagery: HLS (Harmonized Landsat Sentinel-2), MODIS Terra, Blue Marble | Background imagery in the pitch deck |

HLS S30 is built from ESA Sentinel-2 data.

## Other data

ISRIC SoilGrids 2.0, FAO GAEZ v4, USDA NASS Cropland Data Layer (CropScape) and Quick Stats, USDA NRCS SSURGO and the Iowa FY2026 program booklet, Iowa State University Extension cost and custom rate tables, GUGiK ULDK (Polish parcel outlines), Statistics Poland (GUS) yields and prices, Polish Ministry of Agriculture ZSRIR prices and 2026 eco-scheme rates, Dziennik Ustaw, WODR Poznań crop budgets, Eurostat `apro_cpnhr`, OpenStreetMap tiles and Nominatim, US Census geocoder. The full list with URLs is in each module's `datasets.ts` and on screen. Every crop rule, crop trait, price and payment rate in `data/` carries the title, URL and page of the document it was copied from; `npm run validate:data` rejects a row without one.

## How it works

The app is a static Vite + React + TypeScript site. The browser calls the data services directly; a few large inputs are precomputed by scripts in `scripts/` into `data/precomputed/` and `data/twins/`.

`src/map/` and `src/steps/` collect the field, the goal, the crop history and the priorities. `src/engine/analyzeField.ts` turns them into the rotation cards. `src/steps/` shows the cards and `src/ui-kit/` puts a source on every number.

### The engine, step by step

1. **Climate record.** NASA POWER monthly and daily data for the field's point, 1981–2025 (`src/profile/`): rain, root-zone wetness, maximum temperature, frost days, evapotranspiration. This is the only input the engine cannot do without. If POWER does not answer, the screen shows a source error and no cards.
2. **Soil and slope.** Sand, clay, organic carbon and pH from SoilGrids (SSURGO in the USA). Slope from NASADEM. When a source fails, the value stays empty with the reason, and the cards name it in their gaps.
3. **Country.** Crop lists and money tables exist for Poland and Iowa. A field elsewhere gets its climate record and no cards.
4. **Crop list and suitability.** The engine loads the country's crop list (`data/crops/`: calendar, crop family, sensitive months and thresholds for drought, heat and frost, water need, legume flag) and drops the crops that FAO GAEZ v4 rates unsuitable at the field.
5. **Current rotation.** From the crop history (the farmer's answer, or CropScape for an Iowa field) the engine takes the shortest repeating cycle. Without a history there are no cards.
6. **Candidates.** One-step changes to the current rotation (add a cover crop, a small grain or a legume, replace one year), then every rotation of 2 to 5 years from the crop list, with and without a cover crop, up to 300. Rotations with an excluded crop, or where a crop would have to be sown before the previous one is harvested, are dropped.
7. **Calendar.** For each candidate, month by month: main crop, cover crop, residue or bare soil.
8. **Soil health**, 0–100, the mean of four indicators with equal weights. A step 4 priority doubles its indicator's weight.
   - *Nitrogen:* legume credit per year, minus leaching from rain in the bare months (NASA POWER), more on sandy soil.
   - *Organic matter:* humus balance of the crops, with faster breakdown in warm and wet climates (NASA POWER), adjusted for soil texture.
   - *Erosion:* USLE cover factor (USDA Agriculture Handbook 537) of each month × the month's rain (NASA POWER) × a slope factor (NASADEM).
   - *Pest-cycle break:* how often a crop family returns before its minimum interval.
9. **Climate resilience**, 0–100. For every crop and each of the 45 years, the engine checks the crop's sensitive months on this field. Drought means root-zone wetness below the 20th percentile of the same calendar month in the record. Heat means at least 3 days above the crop's threshold. Frost means more frost days than the crop tolerates. The score is the share of crop-years with no hit. The range runs from the 10th to the 90th percentile year, and the same checks put the hazard marks on the calendar.
10. **Water and forage**, only when switched on in step 4. Water is the share of crop-years in which growing-season rain covered the crop's need or the season's evapotranspiration, whichever is larger. Forage is the share of years with a forage crop.
11. **Income.** For every crop and past year, yield = reference yield × (1 − loss), scaled so that the average year matches the recent average harvest. The loss comes from the same drought, heat and frost checks, using each crop's yield response factor. Margin = yield × today's price − direct costs, plus payments the rotation qualifies for (Polish eco-schemes, NRCS practices in Iowa). The income score is the mean margin plus payments per hectare, scaled 0–100 across the candidates. It replays the past and is not a forecast.
12. **Uncertainty.** Each score gets a low–high range: from the source's range where it gives one, otherwise ±15% marked "rule of thumb". It also gets a confidence label (strong, moderate or weak), which drops for every missing input or rule without a range.
13. **Ranking by goal.** Total = weighted sum, weights in `data/rules/goals.json`. Under "Keep my soil" and "Income", a rotation more than 5 soil points below the current one is never offered. The screen shows the current rotation and the 3 best others.

    | Goal | Soil health | Climate resilience | Income | Priorities |
    |---|---|---|---|---|
    | Keep my soil | 0.40 | 0.45 | – | 0.15 |
    | Improve my soil | 0.60 | 0.25 | – | 0.15 |
    | Income | 0.30 | 0.20 | 0.40 | 0.10 |

14. **Card texts and similar fields.** The engine returns message codes, not sentences, so the English and Polish interfaces share it. `src/twins/` compares the field's NASA POWER climate with 558 regions: 473 US counties and 85 NUTS 2 regions in Germany, France, Poland and Czechia. It uses z-scored features and Euclidean distance, shown on a 0–100 scale. It lists up to 10 of the closest regions that grow a crop of the rotation, with their reported yields (USDA NASS, Eurostat).

Every weight, threshold, crop trait and price comes from a JSON row in `data/` with the source title, URL and page. If a row the engine needs is missing, the card names the gap instead of using a default.

## Run locally

Node 22 or newer.

```bash
npm ci
npm run dev
```

Checks:

```bash
npm run typecheck
npm run test
npm run build
npm run validate:data
```

`npm run e2e` runs the Playwright browser tests.

The pitch deck is a separate static page in `pitch/deck/` (Three.js). See [pitch/deck/README.md](pitch/deck/README.md). Its PDF is `pitch/out/deck.pdf`. The Vercel build (`vercel.json`) runs `vite build`, installs the deck's dependencies and runs `scripts/build-pitch.mjs`, which copies the deck to `dist/pitch/` and the PDF to `dist/pitch/deck.pdf`.

## Repository map

| Folder | Contents |
|---|---|
| `src/contracts/` | shared types and zod schemas |
| `src/app/` | app shell, state, provider wiring, i18n, dataset registry |
| `src/ui-kit/` | `SourcedNumber`, `StateBoundary`, `Term`, `ScoreBar`, `ConfidenceBadge` |
| `src/map/`, `src/steps/` | the map and the six steps |
| `src/profile/`, `src/engine/` | NASA climate profile, scoring engine |
| `src/context-data/`, `src/money/`, `src/twins/` | soil, slope and suitability; money tables; similar fields |
| `scripts/`, `data/` | data preparation, rule tables, crop traits, money tables, precomputed files, saved API samples |
| `pitch/` | pitch deck (HTML and PDF) and its plan |
| `docs/` | spec, plan, decisions, AI usage log |

## Limits

Crop lists and money tables exist for Poland and the USA (Iowa) only. Elsewhere the app shows the climate record and says that it has no crop list. NASA POWER is a model estimate on a grid of about 50 km, not a measurement on the field. The rule tables come from published agronomy sources and need review by a local advisor.

## Next step: the farmer's own data

Today every input comes from public datasets: soil texture, organic carbon and pH from SoilGrids (250 m), slope from NASADEM (30 m), rain and root-zone wetness from NASA POWER (about 50 km), yields from regional statistics. Jan, the farmer in our demo, knows his field better than a 50 km grid does. The next stage lets him see every value the engine used for his field and replace it with his own:

- **Soil:** the soil class from the land register (klasa bonitacyjna) or the texture and humus from a lab soil test. The organic matter score now always uses the medium class of the humus tables (light, medium, heavy).
- **Nitrogen:** a recent soil mineral nitrogen (Nmin) test and the manure or slurry he spreads.
- **Erosion:** the slope he measured, contour strips or terraces, ploughing or no-till.
- **Water:** irrigation, drainage, or a field that dries out or floods sooner than the grid says.
- **Yields and prices:** his own harvests and sale prices instead of regional averages.

The cards are then scored again. A value the farmer entered is marked "farmer's data" with the date, next to the public value it replaced, so every number still shows where it came from. Soil texture, organic carbon, slope and reference yields are already engine inputs and need a form and checks on the entered range. Manure, Nmin, irrigation and tillage need new rule rows with sources. The app also needs a place to keep these values: today it has no accounts and stores nothing on a server.

## Use of AI

The team wrote the code, data tables and documents with Claude Code (Anthropic, Claude Opus 5.5) as a coding assistant, including subagents for research, tests and reviews. People chose the challenge, the idea, the method and every decision in [docs/DECISIONS.md](docs/DECISIONS.md), and reviewed every merged pull request. Each team member logged their AI use, what a human checked and what went wrong in [docs/ai-usage/](docs/ai-usage/). No AI-generated images, video or audio are used in the app or the deck; the deck imagery comes from NASA GIBS and NASA 3D Resources.

## Credits

Imagery: NASA GIBS. Spacecraft model: Landsat 8, NASA 3D Resources. Typefaces: Inter and Caveat, SIL Open Font License 1.1. Map tiles © OpenStreetMap contributors. Libraries: React, Leaflet, Leaflet-Geoman, proj4, zod, zustand, Three.js.

No NASA logo or insignia is used.
