# Field Shift tool implementation plan

> **For agentic workers:** work one task at a time with `superpowers:subagent-driven-development` or `superpowers:executing-plans`. Read `CLAUDE.md`, `docs/SPEC.md` (contracts in section 6, your folders in section 13) and `docs/DECISIONS.md` first. Steps use checkbox (`- [ ]`) syntax.

**Goal:** a static web app where a farmer picks a goal, marks a field and gets the three best crop rotations plus the current one, scored against 45 years of NASA data for that field.

**Architecture:** the UI calls one function, `analyzeField(input, providers)`. The engine gets its data through four provider interfaces. The skeleton ships fixture providers, so every lane builds against fixtures and swaps in its real module with a one-line `[contract]` PR.

**Tech stack:** Vite, React 18, TypeScript (strict), Tailwind, Leaflet with proj4leaflet and Leaflet-Geoman, Zustand, zod, Vitest, Playwright, Vercel. Scripts in Python 3 (`python -I`).

Written Sat 14 Nov 2026, 15:05 CET (T+3:56). T0 = Sat 11:09 CET.

## Global constraints

- Shared types only from `src/contracts/`. A change there, or in any file outside your folders, is a separate `[contract]` PR reviewed by O1.
- A number from the analysis reaches the screen only as a `Sourced` value rendered by `<SourcedNumber>`. Missing data is `value: null` with `missingReason`, never a default.
- Every row in `data/rules/`, `data/crops/` and `data/money/` has a source (`title`, `url`, `locator`). Values are copied from the opened source document, not written from memory. `npm run validate:data` fails without a source.
- Every file in `data/precomputed/` and `data/twins/` has `meta: { retrievedAt, script, sourceUrl }`.
- The engine returns `Message` codes. Text lives in a `messages/en.json` next to the code that uses it, one file per folder (for example `src/steps/cards/messages/en.json`), so two tasks never edit the same text file. `pl.json` comes later.
- A decision made inside a task goes into the PR text under "Decisions made without humans"; O1 copies it to `docs/DECISIONS.md`. Lanes do not edit `docs/`.
- A rule, trait or price whose source cannot be opened is left out: the whole row for a rule or a price, the whole crop for a trait. It is listed under "missing" in `data/<folder>/SOURCES.md`. An indicator that lacks its rule is absent from `indicators` and named in the card's gaps.
- The two demo fields are defined once, in `src/fixtures/fields.ts`. O4-A1 corrects them with a `[contract]` PR.
- `src/app/providers.ts` has one provider per line. Each swap is its own `[contract]` PR and O1 merges them one at a time.
- Parsers are written against a saved sample in `data/samples/`. If no sample exists, saving one is the first step of the task.
- Data only from the hosts in SPEC section 15. Any other host: ask a human.
- TDD: write the test, see it fail, write the code, see it pass. UI tests wait for specific text.
- Before a PR: `git fetch && git rebase origin/main && npm run typecheck && npm run test && npm run build && npm run validate:data`.
- Every screen and card section goes through `<StateBoundary>`: loading, offline, no data, source error, ready.
- English UI text and docs follow the anti-ai-writing rules.
- Branch `o<n>/<id>-<topic>`, PR title starts with the task ID, claim with an empty commit and a draft PR. Dev ports: O1 5171, O2 5172, O3 5173, O4 5174.
- Log AI use in `docs/ai-usage/O<n>.md`.

## Gates

| Time | Gate |
|---|---|
| Sat 16:15 (T+5) | O1-S1 skeleton on `main`; lanes start |
| Sat 17:15 (T+6) | first integration: every lane has merged at least one PR that renders or computes something on `main` |
| Sat 18:10 (T+7) | app review on demo data; a thin real engine (calendar, candidates, climate resilience) is on `main` (D19) |
| Sat 20:10 (T+9) | minimum done (SPEC section 3); moved from 19:10 by D17 |
| Sun 00:10 (T+13) | all features done; after this only fixes and visuals |
| Sun 06:10 (T+19) | "senior developer" review |
| Sun 08:10 (T+21) | feature freeze |
| Sun 10:10 (T+23) | repo freeze, tag, submit |

## File map

| Folder | Owner | Holds |
|---|---|---|
| `src/contracts/` | O1 | `index.ts` (types from SPEC section 6), `schemas.ts` (zod) |
| `src/app/` | O1 | `App.tsx`, `store.ts`, `providers.ts`, `i18n.ts`, `datasets.ts`, `brand.ts` |
| `src/ui-kit/` | O1 | `SourcedNumber.tsx`, `Term.tsx`, `StateBoundary.tsx`, `ScoreBar.tsx`, `ConfidenceBadge.tsx` |
| `src/fixtures/` | O1 | `fields.ts`, `crops.ts`, `analysis.iowa.ts`, `analysis.poznan.ts`, `providers.ts` |
| `e2e/`, `docs/`, `.github/`, root config | O1 | Playwright tests, docs, CI, Vite, Tailwind, tsconfig |
| `src/map/` | O2 | map, search, parcels, drawing, field list |
| `src/steps/` | O2 | `goal/`, `crops/`, `priorities/`, `cards/`, `calendar/`, `money/`, `report/`, `glossary/` |
| `src/profile/` | O3 | POWER client, climate profile, later SMAP |
| `src/engine/` | O3 | `calendar.ts`, `candidates.ts`, `resilience.ts`, `soilHealth.ts`, `income.ts`, `ranking.ts`, `messages.ts`, `analyzeField.ts` |
| `data/rules/` | O4 | rule tables with sources |
| `scripts/`, `data/precomputed/` | O4 | precompute scripts and their output |
| `data/crops/`, `src/context-data/` | O4 | crop traits; `ContextProvider` |
| `data/money/`, `src/money/` | O4 | economics and payments tables; `MoneyProvider` |
| `data/twins/`, `src/twins/` | O4 | case base; `TwinsProvider` |
| `api/` | O4 (routing by O1) | `cropscape.ts` serverless proxy |

## Task list

`After` lists the tasks that must be merged first. Tasks in different streams of one person never share a file, so they can run as two subagents at once.

| ID | Owner | Stream | Task | After | Needed for minimum |
|---|---|---|---|---|---|
| O1-S1 | O1 | A | App skeleton, contracts, ui-kit, fixtures, CI | – | yes |
| O1-S2 | O1 | A | Deploy `main` to Vercel | O1-S1 | yes |
| O1-S3 | O1 | B | e2e tests on fixtures, then on real modules | O1-S1 | yes |
| O1-R | O1 | B | Review, merge, hourly e2e, lane watch | O1-S1 | yes |
| O2-A1 | O2 | A | Map step, demo-field buttons, click to point | O1-S1 | yes |
| O2-A2 | O2 | A | Address search (GUGiK, US Census, Nominatim); last of the four | O2-A3 | yes |
| O2-A3 | O2 | A | Polish parcel by click or ID (ULDK) | O2-A4 | yes |
| O2-A4 | O2 | A | Draw, edit, delete; field list and area | O2-A1 | yes |
| O2-A5 | O2 | A | Parcel layer (KIEG, EPSG:2180), split and merge | O2-A3, O2-A4 | no |
| O2-B1 | O2 | B | Visual direction; goal step; priorities step | O1-S1 | yes |
| O2-B2 | O2 | B | Crops step | O1-S1 | yes |
| O2-B3 | O2 | B | Rotation cards, goal switcher, sources panel | O2-B1 | yes |
| O2-B4 | O2 | B | Calendar strip | O1-S1 | yes |
| O2-B5 | O2 | B | Glossary terms and page | O1-S1 | yes |
| O2-B6 | O2 | B | Income on cards, money section | O2-B3 | no |
| O2-B7 | O2 | B | Advisor report and share link | O2-B3 | no |
| O2-B8 | O2 | B | Polish UI text | O2-B3 | no |
| O3-A1 | O3 | A | NASA POWER client and parser | O1-S1 | yes |
| O3-A2 | O3 | A | Climate profile and `ProfileProvider` | O3-A1 | yes |
| O3-A3 | O3 | A | Recent soil moisture from SMAP (GIBS) | O3-A2 | no |
| O3-B2 | O3 | B | Rotation calendar and bare months | O1-S1 | yes |
| O3-B3 | O3 | B | Candidate generator | O3-B2 | yes |
| O3-B4 | O3 | B | Climate resilience score and calendar exposure | O3-B2 | yes |
| O3-B5 | O3 | B | Soil health indicators, forage and water scores | O3-B2 | yes |
| O3-B6 | O3 | B | Ranking by goal, messages, real `analyzeField` | O3-A2, O3-B3, O3-B4, O3-B5 | yes |
| O3-B7 | O3 | B | Income score | O3-B6, O4-A4 | no |
| O4-A1 | O4 | A | Demo fields and their precomputed data | O1-S1 | yes |
| O4-A2 | O4 | A | Crop traits tables | O1-S1 | yes |
| O4-A3 | O4 | A | `ContextProvider` on precomputed data | O4-A1, O4-A2 | yes |
| O4-A4 | O4 | A | Money tables and `MoneyProvider` | O4-A2 | no |
| O4-A5 | O4 | A | Live soil, suitability and crop history | O4-A3 | no |
| O4-B0 | O4 | B | Rule tables with sources, before twins (D16) | O1-S1 | yes |
| O4-B1 | O4 | B | Twins case base: regions and features | O4-B0 | no |
| O4-B2 | O4 | B | Twins outcomes: crop shares and yields | O4-B1 | no |
| O4-B3 | O4 | B | `TwinsProvider` | O4-B1, O4-B2 | no |
| R8 | O1 | R | Research: Polish crop prices, costs, 2026 payments (D33) | – | no |
| R9 | O1 | R | Research: Iowa prices, ISU budgets, NRCS 340/328 rates (D33) | – | no |
| R10 | O1 | R | Research: Ky, heat and frost thresholds, cover-crop windows (D33) | – | no |

Stream A of O2 runs in the order A1, A4, A3, A2. If the minimum is at risk, cut in this order: O2-A2 address search, O2-A3 parcels, O2-A4 drawing, the glossary page of O2-B5 (tooltips stay); the demo buttons and a click on the map are enough for the demo. The plan assumes none of this is needed (D18). O3-B3 and O3-B4 can run as two subagents at once. Pitch, slides and the demo recording get tasks and an owner after O1-S1 is on `main`.

---

## O1: integrator

### O1-S1: app skeleton, contracts, ui-kit, fixtures, CI

**Branch:** `o1/s1-skeleton` · **After:** none · **Due:** Sat 16:00

**Files:** create `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `index.html`, `src/main.tsx`, everything in `src/contracts/`, `src/app/`, `src/ui-kit/`, `src/fixtures/`, `scripts/validate_data.mjs`, `vercel.json`; modify `.github/workflows/ci.yml`, `README.md`, `.gitignore`.

**Produces:** the types and provider interfaces of SPEC section 6; `useAppStore` with `goal`, `fields`, `cropHistory`, `priorities`, `analysis` and the actions `setGoal`, `addField`, `updateField`, `removeField`, `setCropHistory`, `setPriorities`, `runAnalysis`; `fixtureProviders: Providers`; `fixtureAnalyzeField: AnalyzeField`; the five ui-kit components; a step shell that mounts one component per step from `src/map/` and `src/steps/` (placeholders until lanes replace them).

- [ ] Scaffold Vite + React + TypeScript; add Tailwind, zustand, zod, leaflet, proj4, proj4leaflet, `@geoman-io/leaflet-geoman-free`, `@types/geojson`, vitest, `@testing-library/react`, jsdom, `@playwright/test`. Add the scripts `dev`, `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `build`, `validate:data`, `e2e`.
- [ ] Copy the contract code from SPEC section 6 into `src/contracts/index.ts`. Run `npm run typecheck`; fix the spec in the same PR if it does not compile.
- [ ] Write `src/contracts/schemas.ts` (zod) for `Sourced`, `CropTraits`, `Analysis`, the rule row and the `meta` block. Test: a `Sourced` with `value: null` and no `missingReason` fails; with a reason it passes.
- [ ] Write `scripts/validate_data.mjs`: parse every JSON under `data/rules`, `data/crops`, `data/money`, `data/precomputed`, `data/twins` with its schema; exit 1 on the first failure and print the file and path. It passes on empty folders.
- [ ] ui-kit, test first: `<SourcedNumber>` renders "no data" and the reason for `value: null`; renders value, unit and a chip that opens dataset name, resolution, period, retrieval date and "observed" / "model estimate" / "our calculation". `<StateBoundary>` renders each of the five states. `<Term id>` shows the tooltip text passed through props. `<ScoreBar>` shows value, the low–high range and the confidence label.
- [ ] Fixtures: two `Field`s (Iowa, Poznań), a crop traits list for both countries (typed `CropTraits[]`, values marked as fixture), one complete `Analysis` per field with four rotations, all three goals in `totals` and `shownByGoal`, non-empty `gaps` and `localReviewRisks`, a full `calendar`, `twins` as `no-data`, `income` as `no-data`. Test: both fixtures parse with the `Analysis` schema.
- [ ] `src/app/providers.ts` exports `providers` (all four from `fixtureProviders`) and `analyzeField` (`fixtureAnalyzeField`). `src/app/i18n.ts` merges `src/*/messages/en.json` by namespace and exports `t(message: Message): string`. `src/app/datasets.ts` joins `src/*/datasets.ts`.
- [ ] Step shell: seven steps, progress bar, back and forward, state in the store; step 5 lists the fixture rotations by id and rank so the path can be clicked end to end. Test: clicking through from step 1 with the Iowa demo field ends on a screen that contains "your rotation".
- [ ] CI: replace the placeholder job with install, typecheck, test, build, validate:data, with no `--if-present`.
- [ ] Run the full gate; open the PR; merge after green `ci`.

**Done when:** the four commands pass in CI, `npm run dev -- --port 5171` shows the seven-step shell, and both fixture analyses render their rotation ids.

### O1-S2: deploy

**Branch:** `o1/s2-deploy` · **After:** O1-S1 · **Files:** `vercel.json`, `README.md`

- [ ] A human connects the repo to Vercel (account owner decides, DECISIONS). Build command `npm run build`, output `dist`.
- [ ] Open the production URL; check that the shell loads and that a browser request to `https://power.larc.nasa.gov/api/temporal/monthly/point?...` from that origin returns 200.
- [ ] Put the URL in `README.md`.

**Done when:** the URL in the README shows the current `main`.

### O1-S3: e2e tests

**Branch:** `o1/s3-e2e` · **After:** O1-S1 · **Files:** `e2e/demo-fields.spec.ts`, `playwright.config.ts`

- [ ] Test "Iowa demo field": goal "Keep my soil", demo button, confirm crops, default priorities, step 5. Expect four cards; on each: text from `gaps`, text from `localReviewRisks`, the sentence starting "This is decision support", one calendar strip, at least one source chip.
- [ ] Test "Poznań demo field": the same path with the icon picker for crops.
- [ ] Test "source error": block `power.larc.nasa.gov` with `page.route`; expect the text "NASA POWER" and a retry button, and no empty main area.
- [ ] Run hourly on `main`; post failures on the team board with the failing step.

- [ ] Add `useOnline()` to `src/app/` and pass `offline` to `<StateBoundary>` on step 5 when the browser is offline; test with `page.context().setOffline(true)`.

**Done when:** tests 1 and 2 pass on the skeleton's placeholder steps and keep passing as O2 replaces them; test 3 is added once O3-B6 is wired, because fixtures never call POWER. All are re-run after each provider swap.

### O1-R: review, merge, lane watch (ongoing)

Review each PR with prompt P5 from `HACKATHON.md`; merge after green `ci`. Check the board every 30 minutes; a lane with no commit and no reply for 60 minutes is taken over. Keep `docs/DECISIONS.md` and `docs/tasks.json` current. At 18:10 run the app review (P6).

---

## O2: frontend

### O2-A1: map step

**Branch:** `o2/a1-map` · **After:** O1-S1 · **Files:** `src/map/MapStep.tsx`, `src/map/area.ts`, `src/map/pointToField.ts`, tests, `src/map/messages/en.json`

**Consumes:** `useAppStore().addField(field: Field)`, `demoFields` from `src/fixtures`. **Produces:** `MapStep` (named export, same path as the placeholder), `areaHa(polygon): number`, `pointToField(lat, lon): Field` (a 4 ha square around the point, used until the farmer draws).

- [ ] Test `areaHa(polygon)`: a 100 m × 100 m square at 52° N returns 1.0 ha ± 1%.

- [ ] Test: clicking "Iowa demo field" calls `addField` with `country: 'US'` and a polygon; fails first.
- [ ] Leaflet map with OpenStreetMap tiles and attribution; two demo buttons that add the field and fly to it; a click on the map adds a field from `pointToField` with the country guessed from the bounding boxes of Poland and the contiguous USA, else `'OTHER'`.
- [ ] Tile error state: if tiles fail, show the `StateBoundary` error with "map tiles" as the source; the demo buttons still work.

**Done when:** both demo buttons and a map click add a field and enable "next".

### O2-A2: address search

**Branch:** `o2/a2-search` · **After:** O2-A3 · **Files:** `src/map/search/{gugik,census,nominatim}.ts`, their tests, `src/map/search/SearchBox.tsx`, `src/map/search/messages/en.json`, `data/samples/geocoders/*.json`

- [ ] Save one real response per geocoder to `data/samples/geocoders/` (GUGiK UUG for "Swarzędz, Rynek 1", US Census for an Iowa address, Nominatim for one place).
- [ ] Per parser, test against the sample: returns `{ lat, lon, label }[]`; an empty result returns `[]`; a malformed body throws a typed `SourceError` with the source name.
- [ ] `SearchBox`: one input; Polish text goes to GUGiK, US addresses to Census, anything else and every miss to Nominatim, throttled to one request per second. Picking a result moves the map and drops a marker.

**Done when:** the three parser tests pass and a typed address moves the map.

### O2-A3: Polish parcel by click or ID

**Branch:** `o2/a3-uldk` · **After:** O2-A4 · **Files:** `src/map/parcels/uldk.ts`, `src/map/parcels/reproject.ts`, tests, `src/map/parcels/messages/en.json`, `data/samples/uldk/*.txt`

**Produces:** `getParcelByPoint(lat, lon): Promise<Field | null>`, `getParcelById(id: string): Promise<Field | null>`.

- [ ] Save ULDK samples for `GetParcelByXY` and `GetParcelById` (`302116_5.0008.428/1`) with `result=geom_wkt,teryt`.
- [ ] Test `reproject`: a known EPSG:2180 coordinate converts to WGS84 within 1e-5 degrees (take the pair from the sample and the GUGiK geocoder result).
- [ ] Test the parser: the sample WKT becomes a `Field` with a closed WGS84 polygon, `parcelIds` set and `areaHa` above 0; the ULDK "-1" answer returns `null`.
- [ ] In Poland a map click calls `getParcelByPoint` and shows the parcel outline; a box accepts a parcel number.

**Done when:** a click near Swarzędz draws the parcel outline and the field list shows its number and area.

### O2-A4: draw, edit, field list

**Branch:** `o2/a4-draw` · **After:** O2-A1 · **Files:** `src/map/draw/Draw.tsx`, `src/map/draw/FieldList.tsx`, `src/map/draw/messages/en.json`, tests

- [ ] Test `FieldList`: two fields in the store render two rows with name and area from `areaHa`; clicking a row calls `selectField`; delete calls `removeField`.
- [ ] Geoman draw-polygon, edit and delete; each shape becomes a `Field` in the store; `FieldList` shows name (editable), area and a delete button; the selected field is the one analysed.

**Done when:** a drawn polygon appears in the list with its area and can be renamed and removed.

### O2-A5: parcel layer, split and merge (parallel track)

**Branch:** `o2/a5-parcel-edit` · **After:** O2-A3, O2-A4 · **Files:** `src/map/parcels/KiegLayer.tsx`, `src/map/parcels/splitMerge.ts`, tests

- [ ] Spike, 30 minutes: show the KIEG WMS (`dzialki`, `numery_dzialek`) on a Leaflet map with a proj4leaflet EPSG:2180 CRS. If the base map needs a host outside SPEC section 15, stop and ask a human.
- [ ] Test `split(field, line)`: a square cut by a line through its middle returns two polygons whose areas sum to the original ± 1%. Test `merge(a, b)`: two squares sharing an edge return one polygon.
- [ ] Wire Geoman's cut tool to `split` and a "merge selected" button to `merge`; each result is a new `Field` with the parent's `parcelIds`.

**Done when:** a parcel can be cut in two and two fields joined, and each resulting field can be analysed.

### O2-B1: visual direction, goal step, priorities step

**Branch:** `o2/b1-goal-priorities` · **After:** O1-S1 · **Files:** `src/steps/goal/GoalStep.tsx`, `src/steps/goal/messages/en.json`, `src/steps/priorities/PrioritiesStep.tsx`, `src/steps/priorities/messages/en.json`, tests, `src/steps/design.md` (move the texts you take over out of the skeleton's `src/steps/messages/en.json`)

- [ ] Run `ui-ux-pro-max` for a phone-first tool used outdoors: palette, type scale, icon set. Write the result to `src/steps/design.md`; send Tailwind theme changes as a `[contract]` PR.
- [ ] Test `GoalStep`: three options "Keep my soil", "Improve my soil", "Income"; clicking one calls `setGoal` with `'keepSoil' | 'improveSoil' | 'income'`; "Income" shows "price data not loaded yet" when `moneyAvailable` from `src/app/providers.ts` is `false` (no analysis exists yet at step 1).
- [ ] Test `PrioritiesStep`: five switches (water, forage, nitrogen, erosion, organic matter), each with a one-line explanation; a crop exclusion list from `providers.context.getCrops(country)`; changes call `setPriorities`.

**Done when:** both steps write to the store and pass their tests.

### O2-B2: crops step

**Branch:** `o2/b2-crops` · **After:** O1-S1 · **Files:** `src/steps/crops/CropsStep.tsx`, `src/steps/crops/CropPicker.tsx`, tests

- [ ] Test: when `getCropHistory` is `ready`, the step shows "Is this right?" with the years and crops, and "Yes" stores them with `source: 'cropscape'`; editing one year stores that year with `source: 'farmer'`.
- [ ] Test: when it is `no-data`, the step shows the icon picker for the last three years; at least two years are required to continue.
- [ ] Icons from the chosen icon set, one per crop id in `getCrops(country)`; a crop without an icon shows its name.

**Done when:** both paths store a `CropYear[]` and the tests pass.

### O2-B3: rotation cards

**Branch:** `o2/b3-cards` · **After:** O2-B1 · **Files:** `src/steps/cards/RotationsStep.tsx`, `RotationCard.tsx`, `GoalSwitcher.tsx`, `FieldSummary.tsx`, `SourcesPanel.tsx`, `messages/en.json`, tests

- [ ] Test `RotationCard` with the Iowa fixture: shows the crop sequence with icons, soil health and climate resilience as `<ScoreBar>` before anything else, the five headed sections (why, evidence, benefits, gaps, risks to check locally), the support sentence, and "your rotation" on the current one.
- [ ] Test: a rotation with `confidence: 'weak'` shows the badge and its first gap above the fold.
- [ ] Test `GoalSwitcher`: switching to "Improve my soil" reorders the cards to `analysis.shownByGoal.improveSoil` without calling `runAnalysis`; each card shows "nth if you rank on keeping the soil" from `rankByGoal.keepSoil` when another goal is active.
- [ ] `FieldSummary` above the cards: drought years, the months with the highest drought, heat and frost risk, soil texture and slope, each through `<SourcedNumber>`; a missing value shows its reason.
- [ ] Test: an analysis with no rotations (field outside the USA and Poland) shows the field summary and the text "Crop lists exist for the USA and Poland only".
- [ ] `SourcesPanel` lists `analysis.datasets`, NASA first, with resolution, period and kind.
- [ ] Each section of the card is wrapped in `<StateBoundary>`; `twins` in `no-data` shows its reason text.

**Done when:** the four fixture cards render for both demo fields and the goal switch reorders them.

### O2-B4: calendar strip

**Branch:** `o2/b4-calendar` · **After:** O1-S1 · **Files:** `src/steps/calendar/CalendarStrip.tsx`, test

- [ ] Test with a fixture `CalendarMonth[]`: one row per rotation year, twelve cells, cover state shown by colour and by a text alternative (`aria-label` "March, bare soil"); a cell with exposure shows a hazard mark; clicking it shows "drought in 11 of 45 years" through `<SourcedNumber>`.
- [ ] Legend with the four cover states and three hazards; a caption "bare periods are our calculation from crop calendars".

**Done when:** the strip renders on every card and the current rotation's strip sits above the others.

### O2-B5: glossary

**Branch:** `o2/b5-glossary` · **After:** O1-S1 · **Files:** `src/steps/glossary/terms.en.json`, `GlossaryPage.tsx`, `useTerm.ts`, test

- [ ] Write one plain sentence for each term in SPEC section 11 (twelve terms). Test: every term id used by a `<Term>` in `src/` exists in `terms.en.json` (the test greps the source).
- [ ] Glossary page reachable from every step (the link in the header is a `[contract]` PR to `src/app/App.tsx`); `useTerm(id)` feeds `<Term>`.

**Done when:** the test passes and tooltips show on the cards.

### O2-B6, O2-B7, O2-B8 (after the minimum)

- **O2-B6 income and money** (`o2/b6-money`, after O2-B3): on each card an income line "in a bad year / on average / in a good year" from `money.marginPerHa.range`, and payments with their condition; unconfirmed payments shown greyed with "rate not confirmed for 2026". Test with a fixture `MoneyEstimate`. Under the soil goals payments read "this rotation also qualifies for". The same task renders twin evidence when `twins.status === 'ready'`: case count, mean similarity and the three nearest regions with their outcome.
- **O2-B7 report** (`o2/b7-report`, after O2-B3): print stylesheet and a page with field, goal, the four rotations, sources and the support sentence at the top; "copy link" encodes goal, field polygon, crops and priorities in the URL hash and restores them on load (the restore hook in `src/app/` is a `[contract]` PR). Test: encode then decode returns the same input.
- **O2-B8 Polish text** (`o2/b8-pl`, after O2-B3): `pl.json` next to every `en.json` in O2's folders, language switch in the header (a `[contract]` PR to `src/app/App.tsx` and `i18n.ts`); O3 and O4 add theirs in their own PRs. Test: every key in `en.json` exists in `pl.json`.

---

## O3: engine

### O3-A1: NASA POWER client

**Branch:** `o3/a1-power` · **After:** O1-S1 · **Files:** `src/profile/power.ts`, `src/profile/power.test.ts`, `src/profile/datasets.ts`

**Produces:** `fetchPowerMonthly(lat, lon): Promise<PowerMonthly>` where `PowerMonthly = { months: { year, month, GWETROOT, GWETTOP, PRECTOTCORR, T2M_MAX, FROST_DAYS, EVPTRNS }[]; retrievedAt: string }`.

- [ ] Test `parsePowerMonthly` against `data/samples/power/point-monthly-1981-2025-ag.json`: 540 monthly rows (45 years × 12), the annual key (month 13) dropped, the fill value -999 turned into `null`.
- [ ] Test `fetchPowerMonthly` with a mocked `fetch`: builds the URL from HANDOFF's example with `community=AG`, `start=1981`, `end=2025`; a 500 or a network failure throws `SourceError('NASA POWER')`.
- [ ] Units, tested on the sample: `PRECTOTCORR` is mm/day, so `rainMm` = value × days in the month; `EVPTRNS` is MJ/m²/day, so `evapotranspirationMm` = value / 2.45 × days in the month. Read the units from the sample's `parameters` block and fail the test if they differ.
- [ ] Export `datasets: Dataset[]` from `src/profile/datasets.ts` with the entry: `nasa: true`, resolution "about 50 km", period "1981–2025", `kind: 'model'`.

**Done when:** tests pass and a manual call for 42.0, -93.6 returns 540 rows.

### O3-A2: climate profile and provider

**Branch:** `o3/a2-profile` · **After:** O3-A1 · **Files:** `src/profile/climate.ts`, `src/profile/trend.ts`, `src/profile/provider.ts`, tests

Thresholds come from `data/rules/hazards.json`, which O4-B0 ships as its first step. Until it is on `main`, pass the thresholds into the functions as arguments and use in-test values.

**Produces:** `powerProfileProvider: ProfileProvider` (`getClimate(field)` → `ClimateProfile`).

- [ ] Test `monthlyRisk` on a hand-made 45-year series: drought probability for a month = share of years with root-zone wetness below the 20th percentile of that month's own record, so 9 of 45 by construction; heat = share of years with monthly `T2M_MAX` above the threshold from `data/rules/hazards.json`; frost = share of years with `FROST_DAYS` above its threshold. Each result is `Sourced` with `kind: 'derived'` and `datasetIds: ['nasa-power-monthly']`.
- [ ] Test `yearly` and `droughtYears`: a series with two planted dry growing seasons returns exactly those years. `yearly.maxTempC` is the highest monthly `T2M_MAX` of the year; POWER monthly data has no count of hot days.
- [ ] Test `mannKendall`: a strictly rising series returns `direction: 'up', significant: true`; a constant series `'none'`. Port the logic from `data/samples/power/trend-spike.html`.
- [ ] Test the provider: a `null` month in the input stays `null` in `monthly` with a `missingReason`.
- [ ] `[contract]` PR: point `providers.profile` at `powerProfileProvider`.

**Done when:** the profile for both demo fields loads live in the app in under 3 s.

### O3-A3: recent soil moisture from SMAP (after the minimum)

**Branch:** `o3/a3-smap` · **After:** O3-A2 · **Files:** `src/profile/smap.ts`, test. Port `context/scripts/gibs_point.py`: request the GIBS WMS pixel, map its colour through `data/samples/field-shift/cmap_rz.xml`, return monthly means since 2015 as `Sourced` (`kind: 'model'`, resolution "9 km"). Test the colour lookup against `smap_rz_summer_series.tsv`. Adding the series to `ClimateProfile` is a `[contract]` PR.

### O3-B2: rotation calendar

**Branch:** `o3/b2-calendar` · **After:** O1-S1 · **Files:** `src/engine/calendar.ts`, test

**Produces:** `buildCalendar(years: RotationOption['years'], crops: CropTraits[]): { months: Omit<CalendarMonth, 'exposure'>[]; bareMonths: number }`, `canFollow(prev: CropTraits, next: CropTraits): boolean`.

- [ ] Test: maize (sown month 5, harvested 10) then soybean (5, 10) gives two years with months 11–4 as `residue` or `bare` according to `residueCover`, and months 5–10 as `crop`.
- [ ] Test: a winter crop (sown 9, harvested 7 of the next year) spans the year boundary; a cover crop after harvest turns the gap months into `cover-crop`.
- [ ] Test `canFollow`: maize harvested in month 10 followed by winter rapeseed sown in month 8 is `false`; winter wheat harvested in 7 followed by rapeseed in 8 is `true`.

**Done when:** tests pass using the fixture crop traits.

### O3-B3: candidate generator

**Branch:** `o3/b3-candidates` · **After:** O3-B2 · **Files:** `src/engine/candidates.ts`, test

**Produces:** `currentRotation(history: CropYear[]): RotationOption['years']`, `generateCandidates(current, crops, priorities): RotationOption['years'][]`.

- [ ] Test `currentRotation`: maize, soybean, maize, soybean returns the two-year cycle; three different crops return the sequence as entered.
- [ ] Test `generateCandidates`: includes the current rotation, its one-step variants (cover crop added, small grain added, legume added) and rotations of two to five years; excludes `excludedCrops` and every sequence where `canFollow` is false; contains no duplicates up to rotation of the cycle.
- [ ] Cap the output at 300 candidates, keeping all one-step variants.

**Done when:** tests pass and the Iowa maize–soybean history yields between 20 and 300 candidates.

### O3-B4: climate resilience and calendar exposure

**Branch:** `o3/b4-resilience` · **After:** O3-B2 · **Files:** `src/engine/resilience.ts`, test

**Produces:** `yearlyHits(crop: CropTraits, climate: ClimateProfile): { year: number; hazard: Hazard; hit: boolean; deficit: number }[]`, `resilienceScore(years, crops, climate): Score`, `withExposure(months, crops, climate): CalendarMonth[]`.

- [ ] Test `yearlyHits` on a hand-made climate: a crop sensitive to drought in month 7 is hit exactly in the years whose July wetness is below the field's 20th percentile.
- [ ] Test `resilienceScore`: value = share of crop-years without a hit × 100; `low` and `high` are the 10th and 90th percentile of the per-year shares; a climate with missing months lowers `confidence` to `moderate` and names the gap in `basis`.
- [ ] Test `withExposure`: only months where the crop in the ground is sensitive get an exposure entry. The probability is the share of years with a hit from `yearlyHits` for that crop and month, so the marks on the calendar and the resilience score always agree. (`climate.monthlyRisk` uses crop-independent thresholds and feeds only the field summary.) A cell is marked when the share is above the mark threshold in `hazards.json`.

**Done when:** tests pass.

### O3-B5: soil health indicators

**Branch:** `o3/b5-soil-health` · **After:** O3-B2 · **Files:** `src/engine/soilHealth.ts`, `src/engine/priorityScores.ts`, tests

The functions take the rule rows as an argument. Tests use in-test rows with made-up values, so this task does not wait for O4-B0; the real tables are loaded in O3-B6.

**Produces:** `soilHealth(years, crops, profile: FieldProfile, rules, priorities): { total: Score; indicators: Partial<Record<IndicatorId, Score>>; evidence: Evidence[]; missing: IndicatorId[] }`, `forageScore(years, crops): Score`, `waterScore(years, crops, climate): Score`.

- [ ] Test nitrogen: a rotation with one legume year in two scores higher than one with none; the same rotation on a field with more rain in its bare months scores lower.
- [ ] Test organic matter: the sum of the humus coefficients from `data/rules/humus.json` for a hand-computed rotation matches to two decimals before the climate adjustment; a warmer, wetter field class lowers it.
- [ ] Test erosion: more bare months, a steeper slope class or more rain in the bare months each lower the score; with `slopePct.value === null` the score is still computed and `confidence` drops one level.
- [ ] Test pest break: a rotation that repeats a crop family inside its minimum return interval loses points per violation.
- [ ] Test weights: with the "erosion" priority on, the erosion indicator counts double in the total.
- [ ] Test a missing rule: with no humus rows the organic matter indicator is absent, `missing` contains `'organicMatter'`, and the total is the mean of the remaining indicators with `confidence` lowered one level.
- [ ] Test `forageScore`: the share of rotation years with a forage crop or a grazed cover crop × 100. Test `waterScore`: the share of crop-years in which growing-season rain covers the crop's need class.
- [ ] Every indicator returns an `Evidence` naming the `ruleIds` used and the `Sourced` inputs.

**Done when:** tests pass on in-test rule rows.

### O3-B6: ranking by goal and the real `analyzeField`

**Branch:** `o3/b6-analyze` · **After:** O3-A2, O3-B3, O3-B4, O3-B5 · **Files:** `src/engine/ranking.ts`, `src/engine/messages.ts`, `src/engine/analyzeField.ts`, `src/engine/messages/en.json`, tests

**Produces:** `analyzeField: AnalyzeField`.

- [ ] Test `rankByGoal`: with hand-made scores the totals follow the weights in `data/rules/goals.json`; a rotation more than 5 points under the current rotation's soil health is absent from `shownByGoal.keepSoil` and `shownByGoal.income` and has `belowSoilFloor: true`; no two shown rotations differ only by a cover crop; each shown list is the current rotation plus the three best others, so four cards, or fewer when fewer than three others pass the floor; under `keepSoil` a tie goes to the rotation with the fewest changed years against the current one.
- [ ] Test `messages`: every rotation gets at least one `why`, one `evidence`, one `gaps` and one `localReviewRisks` entry; a missing soil input produces the gap code `gap.soil-missing`; every code used exists in `messages/en.json`.
- [ ] Test `analyzeField` with fixture providers: returns a value that parses with the `Analysis` schema; `income` and `twins` are `no-data` when their providers say so; a twins or money provider that throws turns into an `error` result for that part and the rest still returns; when the profile provider throws, `analyzeField` rejects with the `SourceError` and the store shows the whole analysis as an error with a retry (there is no analysis without the climate record).
- [ ] Test: a field with `country: 'OTHER'` returns the profile, `rotations: []` and an empty `shownByGoal`.
- [ ] Load the real tables from `data/rules/` and `providers.context.getCrops`; an indicator without rules is left out and produces the gap code `gap.rule-missing`.
- [ ] GAEZ gate: crops with suitability below the "marginal" threshold in `data/rules/hazards.json` are removed before scoring and named in `gaps`.
- [ ] If O3-B5 is late, merge a thin version first (calendar, candidates, resilience, ranking on climate only, soil indicators absent and named in the gaps) so real cards are on `main` for the 18:10 review.
- [ ] `[contract]` PR: point `analyzeField` in `src/app/providers.ts` at the real one.

**Done when:** both demo fields produce four cards from real POWER data and the e2e tests pass.

### O3-B7: income score (after the minimum)

**Branch:** `o3/b7-income` · **After:** O3-B6, O4-A4 · **Files:** `src/engine/income.ts`, test

- [ ] Test `yearlyYield`: with no hazard hits the yield equals the reference yield; a drought hit with deficit 0.5 and `yieldResponseFactor` 1.2 gives a loss of 0.6; heat or frost in a sensitive month applies `lossShare`; losses are capped at 1.
- [ ] Test `incomeEstimate`: margin = yield × price − direct costs, averaged over crops and years; `range` is the 10th and 90th percentile year; unconfirmed payments are excluded from the sum and produce the gap code `gap.payment-unconfirmed`; a crop without a price returns `no-data`; `confidence` is never `strong`.
- [ ] Wire it into `analyzeField`; the `income` goal total appears in `totals`. `[contract]` PR: set `moneyAvailable` to `true` in `src/app/providers.ts`.

**Done when:** the "Income" goal re-ranks the Iowa demo field and the card shows bad-year and good-year margins.

---

## O4: data and evidence

### O4-A1: demo fields and precomputed data

**Branch:** `o4/a1-demo-data` · **After:** O1-S1 · **Files:** `scripts/{cropscape_history,soil_point,gaez_suitability,nasadem_slope}.py`, `data/precomputed/{cropscape,soil,gaez,slope}.json`, `data/samples/` for each new source

- [ ] Pick one arable field in Iowa (maize–soybean in CropScape for 2019–2025) and one near Poznań (a ULDK parcel that is arable on the orthophoto). Until then everyone uses the fixture fields (42.03 N, 93.63 W and 52.45 N, 17.10 E). Send the corrected polygons, names and centroids as a `[contract]` PR to `src/fixtures/fields.ts` and name the choice in the PR text.
- [ ] `cropscape_history.py`: CropScape `GetCDLValue` for the Iowa centroid in EPSG:5070 for 2016–2025; map CDL codes to crop ids; output years with `source: 'cropscape'`.
- [ ] `soil_point.py`: SSURGO (Soil Data Access SQL) for Iowa, SoilGrids for Poznań; sand, clay, organic carbon, pH for 0–30 cm.
- [ ] `gaez_suitability.py`: port `context/scripts/gaez_point.py`; one `getSamples` call per crop of the country list, raster ids from `data/samples/gaez/res05-suitability-rainfed-high-1981-2010.json`.
- [ ] `nasadem_slope.py`: NASADEM tile from Planetary Computer with an anonymous SAS token; mean slope in percent over the polygon.
- [ ] Each script strips `\r` from its inputs, writes UTF-8 with `\n`, and adds the `meta` block. `npm run validate:data` passes.

**Done when:** the four files exist for both fields (crop history only for Iowa) and validate.

### O4-A2: crop traits

**Branch:** `o4/a2-crops` · **After:** O1-S1 · **Files:** `data/crops/us-ia.json`, `data/crops/pl.json`, `data/crops/SOURCES.md`

- [ ] For each crop in SPEC section 8 fill a `CropTraits` row from the opened source: sowing and harvest months (USDA NASS "Usual Planting and Harvesting Dates" for Iowa; FAO Crop Calendar or a Polish source for Poland), sensitive months and thresholds, water need class and yield response factor (FAO Irrigation and Drainage Papers 33 and 66, FAO-56), family, legume and forage flags, residue cover.
- [ ] Keep the crop ids and families of `src/fixtures/crops.ts`; O3's rule tables key on them. A new id is a `[contract]` PR.
- [ ] A crop with any trait that has no source is left out of the file and listed under "missing" in `data/crops/SOURCES.md`; the validator rejects rows without `sources`.

**Done when:** both files validate and cover every crop and cover crop of the demo lists.

### O4-A3: context provider

**Branch:** `o4/a3-context` · **After:** O4-A1, O4-A2 · **Files:** `src/context-data/provider.ts`, `src/context-data/datasets.ts`, test

**Produces:** `precomputedContextProvider: ContextProvider`.

- [ ] Test: for the Iowa demo field `getCropHistory` is `ready` with the precomputed years; for a field elsewhere it is `no-data` with the reason code `context.no-crop-history`.
- [ ] Test: `getSoil`, `getSlope`, `getSuitability` return `Sourced` values with `retrievedAt` from the file's `meta` for a field whose centroid is within 2 km of a demo field; elsewhere `value: null` with `missingReason`.
- [ ] `getCrops(country)` reads `data/crops`; `'OTHER'` returns `[]`.
- [ ] `[contract]` PR: point `providers.context` at it.

**Done when:** the engine runs on real soil, slope, suitability and crop history for both demo fields.

### O4-A4: money tables and provider (parallel track)

**Branch:** `o4/a4-money` · **After:** O4-A2 · **Files:** `data/money/us-ia.json`, `data/money/pl.json`, `src/money/provider.ts`, `src/money/payments.ts`, tests, `data/money/SOURCES.md`

- [ ] Per crop: reference yield (USDA NASS county yield for the Iowa field's county; GUS or Eurostat regional yield for wielkopolskie), price and direct costs, each with source, URL and year.
- [ ] Payments: Polish eco-scheme rates and the GAEC 7 rule; NRCS Iowa rates for practices 340 and 328. A rate not found in an official 2026 document gets `confirmed: false` and stays out of the sums.
- [ ] Test `getEconomics`: returns `ready` when every requested crop has yield, price and costs, else `no-data` naming the missing crop.
- [ ] Test `getPayments`: a rotation with a cover crop qualifies for the cover-crop payment; one without does not; GAEC 7 fails a rotation that repeats one crop beyond the rule.
- [ ] `[contract]` PR: point `providers.money` at it.

**Done when:** the provider returns `ready` for the Iowa demo rotations, or `data/money/SOURCES.md` says which numbers are missing.

### O4-A5: live context (after the minimum)

**Branch:** `o4/a5-live-context` · **After:** O4-A3 · **Files:** `src/context-data/{ssurgo,soilgrids,gaez}.ts`, `api/cropscape.ts`, tests against saved samples. SSURGO and GAEZ are called from the browser; SoilGrids with a visible loading state; CropScape through the Vercel function. Each falls back to `value: null` with the source named.

### O4-B0: rule tables (before twins)

**Branch:** `o4/b0-rules` · **After:** O1-S1 · **Files:** `data/rules/{nitrogen,humus,erosion,pest-break,hazards,goals}.json`, `data/rules/SOURCES.md`

- [ ] First 20 minutes: ship `hazards.json` and `goals.json` in their own PR, because O3-A2 and O3-B4 read them. `hazards.json` holds the drought percentile (20), the heat and frost thresholds per crop group, the share of years above which a calendar cell gets a hazard mark, and the GAEZ index below which a crop counts as not suitable. Rows we set ourselves say `sourceTitle: 'team rule of thumb'` and the screen labels them so.
- [ ] For each table open the candidate source named in SPEC section 7, copy the values with page or table number into rows `{ id, value, unit, appliesTo, sourceTitle, sourceUrl, sourceLocator, checkedBy }`. `goals.json` holds the weights of SPEC section 7 and the 5-point soil floor with `sourceTitle: 'team decision D9'`.
- [ ] Where a source cannot be opened or gives no number, leave the row out and list it in `data/rules/SOURCES.md` under "missing"; the engine then leaves that indicator out of `indicators` and names it in the gaps.
- [ ] `npm run validate:data` passes.
- [ ] Hand `data/rules/SOURCES.md` to a mentor as soon as one is free; the next fixed slot (Sun 10:30) is after the freeze.

**Done when:** every row has a source and the list of missing rules is written down.

### O4-B1: twins case base, regions and features (parallel track)

**Branch:** `o4/b1-twins-base` · **After:** O4-B0 · **Files:** `scripts/twins_regions.py`, `scripts/twins_features.py`, `data/twins/cases.json`

- [ ] Decide the region list in the first 20 minutes and name it in the PR text: start with the counties of Iowa, Illinois, Nebraska, Minnesota and Indiana and the NUTS 2 regions of Poland, Germany, Czechia and France; grow only if time allows.
- [ ] `twins_features.py`: for each region centroid, NASA POWER climatology (growing-season mean temperature, rain, root-zone wetness, frost days, hot days) with one request per second; cache responses on disk so a rerun does not refetch.
- [ ] Output one row per region with features, `meta` and the region count.

**Done when:** `cases.json` validates and holds the features for every listed region.

### O4-B2: twins outcomes

**Branch:** `o4/b2-twins-outcomes` · **After:** O4-B1 · **Files:** `scripts/twins_outcomes.py`, update `data/twins/cases.json`. Crop shares and yields per region from USDA NASS QuickStats (needs a free key in `.env`, ask a human) and Eurostat; regions without outcomes stay in the file with `outcome: null`.

### O4-B3: twins provider

**Branch:** `o4/b3-twins-provider` · **After:** O4-B1, O4-B2 · **Files:** `src/twins/provider.ts`, `src/twins/similarity.ts`, tests

- [ ] Test `similarity`: identical features give 100; the z-scored Euclidean distance of a hand-made pair matches a hand calculation.
- [ ] Test `getTwins`: returns the ten nearest regions that grow at least one crop of the rotation, with `caseCount` and `meanSimilarity`; with no such region it is `no-data` with the reason code `twins.no-cases`.
- [ ] `[contract]` PR: point `providers.twins` at it.

**Done when:** the Iowa demo cards show twin evidence with case count and similarity.

---

## Research tasks (D33)

R8, R9 and R10 run as separate Claude Code sessions, each on its own branch (`o1/r8-pl-economics`, `o1/r9-ia-economics`, `o1/r10-agronomy`). **Files:** `context/research/<topic>.md` and `data/samples/research/<topic>/` only. Every value has a source title, URL and locator copied from an opened document; unconfirmed 2026 rates are marked so. O4 maps the results into `data/money/` (O4-A4) and `data/crops/` (O4-A2, O4-B0 1b). **Due:** Sat 18:00. **Done when:** a ready PR per topic lists what is confirmed, not confirmed and missing; O1 merges it.

## Plan pre-flight

Before lanes start, a subagent reads this plan against `docs/SPEC.md` and returns missing dependencies, file conflicts between tasks and questions with a recommended answer each. O1 accepts them in bulk; the answers go to `docs/DECISIONS.md` and the task table to `docs/tasks.json` (`id`, `owner`, `branch`, `after`, `files`, `conflicts`).
