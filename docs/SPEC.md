# Spec: Field Shift decision-support tool

Written Sat 14 Nov 2026, 14:45 CET (T+3:36) from `HANDOFF.md` v3 with PRs #19 and #20, `context/field-shift-*.md` and the team discussion. The project is called CropShifter (D55; "Field Shift tool" was the working name until Sun 15 Nov). The name lives in one constant (`src/app/brand.ts`), the `<title>` of `index.html` and one line of `README.md`.

## 1. Goal

A farmer says what matters most to them (keep the soil as it is, improve it, or income), marks a field and gets the three best crop rotations for that goal plus the current one. Every rotation is scored on soil health and climate resilience computed from 45 years of NASA data for that field, whatever the goal; the goal changes the weights, and money enters the ranking only when the farmer picks the income goal, and then it is income computed against the field's own 45 years of drought, heat and frost. Each rotation shows why it was suggested, the evidence, the benefits, the data gaps and the risks that need local review. The same app works for a field in Iowa and a field near Poznań.

The tool supports the farmer's decision and does not replace it. Every rotation card says so.

## 2. What the brief asks and where it shows on screen

| Brief requirement | Screen element | Module | In the minimum (T+9) |
|---|---|---|---|
| Compare at least three rotations including the existing one | four rotation cards, the current one marked "your rotation" | `src/steps/cards` | yes |
| Why suggested, evidence, benefits, information gaps, risks for local review | five fixed sections on every card; gaps and risks are required fields in the contract and sit in the card body | `src/engine`, `src/steps/cards` | yes |
| Bare-field periods and vulnerable seasons | month-by-month calendar strip on every card (section 8) | `src/engine/calendar`, `src/steps/calendar` | yes |
| Farmer priorities: water, forage, nitrogen, erosion, organic matter, market, income | step 1 main goal (keep soil, improve soil, income) sets the ranking weights; step 4 switches fine-tune it (water, forage, nitrogen, erosion, organic matter) | `src/steps/goal`, `src/steps/priorities`, `src/engine/scoring` | yes for the two soil goals; income when the money tables land |
| Explain terms | `<Term>` tooltip at first use and a glossary page (section 11) | `src/ui-kit`, `src/steps/glossary` | yes |
| Show uncertainty | every score has a low–high range and a confidence label (section 7) | `src/engine/scoring`, `src/ui-kit` | yes |
| Supports, does not replace farmer judgment | fixed sentence on each card | `src/steps/cards` | yes |
| NASA data integral (judging: Relevance) | the field's NASA record acts inside every score except the pest-cycle break: climate resilience, erosion, nitrogen loss, organic matter breakdown, water balance, yield loss in the income score, the hazard marks on the calendar and the twin features (section 7); crop rules, soil surveys and prices are labelled as what they are; each number carries a source label (section 10) | all | yes |

## 3. Scope

### Minimum, due T+9 (Sat 20:10)

1. Main goal: one tap on one of three icons. "Keep my soil" and "Improve my soil" work in the minimum; "Income" is visible and says "price data not loaded yet" until the money tables land.
2. Find the field: address search, click on the map, two demo-field shortcuts (Iowa, Poznań). In Poland a click returns the cadastral parcel from ULDK; in the USA the farmer draws the outline.
3. Crops: for the Iowa demo field the app proposes the CropScape history and the farmer confirms; elsewhere the farmer picks the last two or three crops from an icon list. The farmer's answer wins.
4. Priorities: water, forage, nitrogen, erosion, organic matter; equipment limits as exclusions.
5. Four rotation cards with scores, ranges, the five sections, the calendar strip, source labels, term tooltips and the "supports, does not replace" sentence. The goal can be changed on this screen and the cards re-rank at once.
6. Real NASA POWER data for any clicked point. Soil and crop suitability are real for the two demo fields at least.

### Parallel tracks (start at T+4, ship when ready, never block the minimum)

- Money tables: reference yields, prices, direct costs and payment rates per country (section 7). They switch on the "Income" goal.
- Field twins: evidence from similar places inside the cards (section 9).
- Parcel editing: split a parcel, merge parcels, redraw. The contract handles a list of fields from the start, so this needs no change elsewhere.

### After the minimum, in this order

1. Money detail section under the cards (payment conditions, costs, revenue per crop).
2. ~~Advisor report (print view and shareable link).~~ Built, then removed with the share link (D52).
3. Recent soil moisture from SMAP (2015 to now) in the field profile.
4. Polish UI text (the i18n layer exists from the skeleton).
5. Live crop history, soil and suitability for any field, not only the demo fields.
6. Field-level NDVI from HLS as a check on bare-soil periods.
7. ~~Bot that sends back the report link.~~ Dropped: there is no report link since D52.
8. Sonification of 45 years of soil moisture.

### Out of scope

Offline use (the app only detects that it is offline and says so), user accounts, saving fields on a server, yield forecasts, fertilizer or pesticide dosing, countries other than the USA and Poland for crop lists and payments. A field outside those two countries still gets the climate profile, with no rotations and the text "Crop lists exist for the USA and Poland only".

## 4. Stack

| Part | Choice | Why |
|---|---|---|
| App | Vite + React 18 + TypeScript (strict) | static build, no server to keep alive during the demo |
| Styling | Tailwind CSS | fast, no shared CSS files to conflict on |
| Map | Leaflet + proj4leaflet + Leaflet-Geoman | KIEG parcels render only in EPSG:2180; Geoman has draw and cut tools (cut still to verify) |
| State | Zustand, one store in `src/app` | small, no boilerplate |
| Validation | zod schemas next to the types | parsers and precomputed JSON are checked against the same schema |
| Tests | Vitest (unit), Playwright (e2e, O1's laptop only) | `CLAUDE.md` rule |
| Scripts | Python 3 (`python -I`) or Node, in `scripts/` | existing checks in `context/scripts` are Python |
| Hosting | Vercel, static; one serverless function allowed for the CropScape proxy | CropScape has no CORS |

There is no backend service. "Backend" in the lane table means the analysis engine (pure TypeScript functions running in the browser) and the scripts that prepare data files.

Commands: `npm run dev -- --port <lane port>`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run validate:data`, `npm run e2e`.

## 5. Architecture

```
            ┌──────────── src/app (store, wiring) ────────────┐
 src/map ──▶│ Field[]                                         │
 src/steps ▶│ CropYear[], Priorities ──▶ analyzeField(input)  │──▶ src/steps (cards, calendar, money)
            └───────────────────────────────┬─────────────────┘
                                            │ calls four providers through interfaces
        ┌────────────────┬──────────────────┼──────────────────┬───────────────┐
   ProfileProvider   ContextProvider   (rules, crops)     TwinsProvider   MoneyProvider
   src/profile       src/context-data  data/rules,        src/twins       src/money
   POWER, SMAP       soil, suitability, data/crops        data/twins      data/money
                     crop history
```

- The UI calls one function: `analyzeField(input): Promise<Analysis>`. It never calls a data source for analysis itself.
- `analyzeField` lives in `src/engine` and receives its four providers as arguments. `src/app/providers.ts` chooses the real provider or the fixture provider for each one.
- The skeleton ships fixture providers and a fixture `analyzeField` result for both demo fields, so the UI lane builds every screen before any real module exists. Real modules replace fixtures one provider at a time, each in a one-line `[contract]` PR to `src/app/providers.ts`.
- Map tiles, geocoders and parcel lookups are called by `src/map` directly; they do not go through the engine.

### Data flow per source

| Data | Minimum | Later |
|---|---|---|
| Climate and soil wetness, 1981–2025 (NASA POWER, monthly, point) | live from the browser, about 1 s | cache per 0.5° cell in `localStorage` |
| Recent soil moisture (SMAP L4 via GIBS) | – | live, pixel colour mapped through the GIBS colormap |
| Soil texture, organic carbon, pH | precomputed for demo fields | SSURGO live (USA), SoilGrids live with a loading state (3–15 s) |
| Crop suitability (FAO GAEZ v4) | precomputed for demo fields and the crop list | ImageServer `getSamples`, one raster per call |
| Crop history (USDA CropScape) | precomputed for the Iowa demo field | Vercel function as a proxy |
| Slope (NASADEM via Planetary Computer) | precomputed for demo fields | live read of the COG with an anonymous SAS token |
| Parcels and addresses (ULDK, KIEG, GUGiK geocoder, US Census, Nominatim) | live | – |
| Twins case base, crop traits, rules, margins, payments | JSON files in the repo | – |

## 6. Contracts

All shared types live in `src/contracts/` (owner O1). Other folders import from there and never redefine them. A change is a `[contract]` PR. The code below is the source for `src/contracts/index.ts`; O1 compiles it in the skeleton PR before lanes start.

```ts
// ---------- provenance (HANDOFF "Data transparency") ----------
export type ValueKind = 'observation' | 'model' | 'derived'; // derived = our own calculation

export interface Dataset {
  id: string;            // e.g. 'nasa-power-monthly'
  name: string;          // 'NASA POWER monthly agroclimatology'
  provider: string;      // 'NASA LaRC'
  url: string;
  nasa: boolean;         // true for NASA data, false for partners and others
  resolution: string;    // native, as text: 'about 50 km', '9 km', '30 m'
  period: string;        // '1981–2025'
  kind: ValueKind;
}

export interface Sourced<T = number> {
  value: T | null;                 // null = missing; never a filled-in guess
  unit?: string;
  datasetIds: string[];            // every dataset the value depends on
  kind: ValueKind;
  retrievedAt: string;             // ISO date of the request or of the precompute run
  range?: { low: number; high: number; basis: string }; // e.g. '10th–90th percentile of 1981–2025'
  missingReason?: string;          // required when value is null
}

// ---------- field and farmer input ----------
export type Country = 'US' | 'PL' | 'OTHER';
export interface Field {
  id: string;
  name: string;
  country: Country;
  polygon: GeoJSON.Polygon;        // WGS84
  centroid: { lat: number; lon: number };
  areaHa: number;
  parcelIds?: string[];            // Polish cadastral IDs, when the field came from ULDK
}

export type CropId = string;       // key of data/crops/<country>.json, e.g. 'maize', 'soybean', 'winter-wheat'
export interface CropYear { year: number; crop: CropId; coverCrop?: CropId; source: 'farmer' | 'cropscape' }

export type GoalId = 'keepSoil' | 'improveSoil' | 'income'; // one main goal, default 'keepSoil'
export type PriorityId = 'water' | 'forage' | 'nitrogen' | 'erosion' | 'organicMatter';
export interface Priorities { goal: GoalId; on: PriorityId[]; excludedCrops: CropId[] }

// ---------- field profile (NASA data) ----------
export type Hazard = 'drought' | 'heat' | 'frost';
export interface MonthlyRisk { month: number; hazard: Hazard; probability: Sourced } // share of the 45 years, 0–1
export interface ClimateProfile {                    // what the ProfileProvider returns (NASA POWER, later SMAP)
  source: { datasetIds: string[]; kind: ValueKind; retrievedAt: string };   // applies to every value in monthly
  monthly: { year: number; month: number; rootWetness: number | null; rainMm: number | null; tMaxC: number | null; frostDays: number | null; evapotranspirationMm: number | null }[]; // raw series for the engine; null = missing
  monthlyRisk: MonthlyRisk[];                       // 12 months x 3 hazards
  yearly: { year: number; growingSeasonWetness: Sourced; maxTempC: Sourced; frostDays: Sourced; rainMm: Sourced }[];
  droughtYears: number[];
  trends: { variable: string; direction: 'up' | 'down' | 'none'; perDecade: Sourced; significant: boolean }[];
}
export interface Soil { sandPct: Sourced; clayPct: Sourced; organicCarbon: Sourced; ph: Sourced }
export interface FieldProfile extends ClimateProfile { soil: Soil; slopePct: Sourced } // joined by the engine

// ---------- crop traits (data/crops/<country>.json, owner O4) ----------
export interface SourceRef { title: string; url: string; locator: string }       // locator = page, table or section
export type WaterNeed = 'low' | 'medium' | 'high';
export interface CropTraits {
  id: CropId; family: string; legume: boolean;
  kind: 'cash' | 'cover' | 'perennial';
  sowMonth: number; harvestMonth: number;          // harvestMonth < sowMonth means harvest in the next calendar year
  sensitive: { hazard: Hazard; months: number[]; threshold: number; lossShare: number }[]; // lossShare 0-1 when the hazard hits
  waterNeed?: WaterNeed;                           // required unless kind is 'cover' (D29)
  yieldResponseFactor?: number;                    // FAO Ky; optional for every kind, missing Ky = no income for that crop (D29)
  forage: boolean;
  residueCover: 'low' | 'medium' | 'high';
  sources: SourceRef[];                            // min 1
}

// ---------- rotations ----------
export interface Score {
  value: number;                   // 0–100
  low: number; high: number;       // range across the 45 years or across rule uncertainty
  confidence: 'strong' | 'moderate' | 'weak';
  basis: Message;                  // one sentence: what the range and confidence rest on
}
export interface Message { code: string; params?: Record<string, string | number> } // text comes from i18n files
export interface Evidence { message: Message; values: Sourced[]; ruleIds: string[] }

export type CoverState = 'crop' | 'cover-crop' | 'residue' | 'bare';
export interface CalendarMonth {
  yearIndex: number; month: number;  // position in the rotation
  crop?: CropId; cover: CoverState;
  exposure: { hazard: Hazard; probability: Sourced }[]; // only hazards the crop is sensitive to that month
}

export type IndicatorId = 'nitrogen' | 'organicMatter' | 'erosion' | 'pestBreak';
export interface RotationOption {
  id: string;
  isCurrent: boolean;
  years: { crop: CropId; coverCrop?: CropId }[];
  totals: Record<GoalId, AsyncResult<Score>>;   // one total per goal; 'no-data' for income without money tables
  rankByGoal: Partial<Record<GoalId, number>>;  // 1 = best; the current rotation is ranked with the others
  belowSoilFloor: boolean;                      // soil health more than 5 points under the current rotation's
  soilHealth: Score;
  indicators: Partial<Record<IndicatorId, Score>>; // an indicator without a sourced rule is absent and named in gaps
  climateResilience: Score;
  priorityScores: Partial<Record<PriorityId, Score>>;
  income: AsyncResult<Score>;                   // 'no-data' until the money tables cover every crop of the rotation
  why: Message[];                               // min 1
  evidence: Evidence[];                         // min 1
  benefits: Message[];
  gaps: Message[];                              // min 1; 'none found' is not allowed, name what was not checked
  localReviewRisks: Message[];                  // min 1
  calendar: CalendarMonth[];
  bareMonths: number;                           // per rotation cycle
  twins: AsyncResult<TwinEvidence>;
  money: AsyncResult<MoneyEstimate>;
}

export interface TwinEvidence {
  cases: { regionName: string; country: Country; similarity: number; crops: CropId[]; outcome: Sourced; years: string }[];
  caseCount: number;
  meanSimilarity: number;                       // 0–100
}
export interface MoneyEstimate {
  marginPerHa: Sourced;                         // mean over the 45 years; range = 10th and 90th percentile year
  currency: 'USD' | 'PLN';
  payments: { programme: string; amountPerHa: Sourced; condition: Message; confirmed: boolean }[];
  campaign: string;                             // 'campaign 2026, check ARiMR' / 'FY2026, check NRCS'
}

export interface Analysis {
  field: Field; profile: FieldProfile;
  rotations: RotationOption[];                  // every rotation shown under any goal; empty for a field outside the USA and Poland
  shownByGoal: Partial<Record<GoalId, string[]>>; // rotation ids per goal that has data: the current rotation plus the three best others, best first
  datasets: Dataset[];                          // everything used, for the sources panel and References
  generatedAt: string;
}

// ---------- async and errors ----------
export type AsyncResult<T> =
  | { status: 'ready'; data: T }
  | { status: 'no-data'; reason: Message }             // the module is wired and has nothing for this field or rotation
  | { status: 'error'; source: string; reason: Message }
  | { status: 'not-loaded' };                           // the module is not wired yet, or was not asked

// ---------- providers (implemented by lanes, wired in src/app/providers.ts) ----------
export interface AnalyzeInput { field: Field; cropHistory: CropYear[]; priorities: Priorities }
export interface ProfileProvider { getClimate(field: Field): Promise<ClimateProfile> }
export interface ContextProvider {
  getCrops(country: Country): Promise<CropTraits[]>;
  getCropHistory(field: Field): Promise<AsyncResult<CropYear[]>>;
  getSuitability(field: Field, crops: CropId[]): Promise<Record<CropId, Sourced>>;
  getSoil(field: Field): Promise<Soil>;
  getSlope(field: Field): Promise<Sourced>;
}
export interface TwinsProvider { getTwins(field: Field, profile: FieldProfile, rotation: RotationOption['years']): Promise<AsyncResult<TwinEvidence>> }
export interface CropEconomics { crop: CropId; referenceYieldTPerHa: Sourced; pricePerT: Sourced; directCostsPerHa: Sourced }
export interface MoneyProvider {                 // tables only; the engine does the year-by-year calculation
  getEconomics(field: Field, crops: CropId[]): Promise<AsyncResult<CropEconomics[]>>;
  getPayments(field: Field, rotation: RotationOption['years']): Promise<AsyncResult<MoneyEstimate['payments']>>;
}
export type AnalyzeField = (input: AnalyzeInput, providers: Providers) => Promise<Analysis>;
export interface Providers { profile: ProfileProvider; context: ContextProvider; twins: TwinsProvider; money: MoneyProvider }
```

Rules that follow from the contract:

- The engine returns `Message` codes, not prose. Each module keeps its own text files (`src/<module>/messages/en.json`, `pl.json`) and `src/app/i18n.ts` merges them by namespace. No shared text file exists.
- Each module that fetches or ships data exports its `Dataset[]` (`src/<module>/datasets.ts`). `src/app/datasets.ts` joins them.
- A number without a `Sourced` wrapper does not reach the screen. `src/ui-kit` has no component that prints a bare number from the analysis.

## 7. Scores, ranking and uncertainty

All weights and thresholds live in `data/rules/` as JSON, one row per rule: `{ id, value, unit, appliesTo, sourceTitle, sourceUrl, sourceLocator, checkedBy }`. `npm run validate:data` fails when a row has no source. The numbers below the framework level are filled by O4 from the source documents, not from memory (D16), and a mentor reviews the table as soon as one is free.

### Soil health (scored for every rotation under every goal)

| Indicator | What it measures | Method | Candidate sources to confirm |
|---|---|---|---|
| Nitrogen | nitrogen the rotation fixes and keeps for the next crop | share of years with a legume or legume cover crop, times a credit per crop, reduced by the leaching risk: the field's NASA rain record in the months the calendar shows bare soil, and soil texture | Iowa State University Extension nitrogen credit guidance; IUNG-PIB fertilisation recommendations |
| Organic matter | whether the rotation builds or runs down soil organic matter | humus balance: sum of per-crop reproduction and degradation coefficients, adjusted for soil texture and for the field's temperature and wetness class from NASA POWER (warm and moist soils break organic matter down faster) | IUNG-PIB coefficients (Poland); NRCS Soil Conditioning Index (USA) |
| Erosion | soil exposed when erosive rain falls | bare and low-cover months from the calendar, weighted by the field's monthly rain record (NASA POWER) and slope class | RUSLE cover-management factor (USDA Agriculture Handbook 703) |
| Pest-cycle break | whether crop families return too soon | minimum return interval per crop family; penalty per violation | NRCS Conservation Practice Standard 328; SARE "Crop Rotation on Organic Farms" |

Soil health = weighted mean of the four indicators. Start with equal weights; a farmer priority for nitrogen, erosion or organic matter doubles that indicator's weight.

### Climate resilience (from the field's NASA record)

For each crop in the rotation, `data/crops` lists the months it is in the ground and the months it is sensitive to drought, heat and frost. For each of the 45 years the engine checks whether the hazard occurred in a sensitive month at this field (root-zone wetness below the field's own low percentile, monthly maximum temperature above the crop threshold, frost days above the crop threshold). The score is the share of crop-years without a damaging hazard. Because it is computed per year, the 10th and 90th percentile years give the range directly.

### Income score (used only by the income goal)

Income is computed against the field's own climate record, so it answers "what would this rotation have earned on this field over the last 45 years", not "which crop has the best price".

- For each crop and each of the 45 years: `yield = reference yield x (1 - loss)`. The loss comes from the same hazard checks as climate resilience: a water shortfall in the crop's sensitive months (root-zone wetness from NASA POWER against the field's median) times the crop's yield response factor, plus a loss class for heat or frost in a sensitive month. Candidate source for the factors: FAO Irrigation and Drainage Papers 33 and 66.
- `margin = yield x price - direct costs`, at current prices, from `data/money/<country>.json`. The rotation's margin is the mean over its crops and over the 45 years; the 10th and 90th percentile years are shown as "in a bad year" and "in a good year".
- Payments the rotation qualifies for are added per hectare and shown as their own line with the condition (Poland: eco-schemes, with the GAEC 7 rotation rule as a pass or fail; USA: NRCS practices 340 and 328, labelled "if your application is selected", because EQIP and CSP are competitive). A rate we could not confirm for the 2026 campaign is left out of the sum and named in the card's gaps; income is then margin only.
- Income score = margin plus confirmed payments, scaled 0–100 across the candidates for this field. Its confidence is never above `moderate`: this is a replay of past years at today's prices, not a forecast, and the card says so.
- Every yield, price, cost and rate is a `Sourced` value dated with its year. A crop without a sourced price gives `no-data` for the rotation's income; nothing is estimated to fill the hole.
- Payments also appear on the cards under the two soil goals, as information ("this rotation also qualifies for ..."), without affecting the rank.

### Water priority

When the farmer switches on "water", each crop's seasonal water need (class from `data/crops`) is compared with rain and evapotranspiration at the field in its growing months (NASA POWER). The score is the share of crop-years in which rain covered the need.

### Total and ranking by goal

The farmer picks one main goal in step 1. The goal sets the weights; the scores themselves do not change, so switching the goal on the rotations screen re-ranks at once. The engine computes the totals for all three goals in one run.

| Goal | Soil health | Climate resilience | Income | Step 4 priorities | Extra rule |
|---|---|---|---|---|---|
| Keep my soil (default) | 0.40 | 0.45 | – | 0.15 | soil floor; ties go to the smallest change from the current rotation |
| Improve my soil | 0.60 | 0.25 | – | 0.15 | – |
| Income | 0.30 | 0.20 | 0.40 | 0.10 | soil floor |

- Step 4 priorities: the mean of the switched-on scores for water and forage. Nitrogen, erosion and organic matter act inside soil health (they double their indicator's weight). With nothing switched on, that weight is shared by the other columns in proportion.
- Soil floor: a rotation whose soil health is more than 5 points below the current rotation's is not offered among the three best. This is how the team rule "soil health is the core, not a subsidy comparison site" survives the income goal: the farmer can rank by income, but only among rotations that do not run the soil down. If fewer than three rotations pass, the list is shorter and the screen says why.
- Whatever the goal, every card shows soil health and climate resilience first, and one line with the rotation's rank under the default goal ("3rd if you rank on keeping the soil").
- Crops with GAEZ suitability below the "marginal" class at the field are excluded before scoring and listed in the card's gaps as "not suitable here according to FAO GAEZ".
- Diversity rule: no two shown rotations may differ only by a cover crop.

The weights are a starting proposal. They live in `data/rules/goals.json`, the mentor reviews them, and the card's "why" section names the goal that produced the ranking.

### Uncertainty and confidence

- Range: climate resilience uses the spread across years; soil-health indicators use the low and high values of the rule where the source gives a range, otherwise ±15% and the basis text says "rule of thumb".
- Confidence: `strong` when every input is present and the rules are sourced with ranges; `moderate` when one input is missing or precomputed for a nearby point; `weak` when two or more inputs are missing, the field is outside the USA and Poland, or the crop history is shorter than two years.
- A card with `weak` confidence shows a visible badge and puts the reason first in the gaps section.
- Twin evidence always shows the number of cases and the mean similarity.

## 8. Rotations and the calendar

### Crop lists for the demo

- Iowa: maize, soybean, oats, winter wheat, alfalfa; cover crops: cereal rye, red clover.
- Poland: winter wheat, winter rapeseed, maize, spring barley, rye, field pea, sugar beet, potato; cover crops: white mustard, phacelia.

`data/crops/us-ia.json` and `data/crops/pl.json` hold, per crop: family, sowing and harvest months, sensitive months per hazard with thresholds, water need class, yield response factor, loss class for heat and frost, forage use, legume flag, residue cover. Each row has a source like the rules. Candidate sources: USDA NASS "Usual Planting and Harvesting Dates", FAO Crop Calendar, FAO-56 crop coefficients, FAO EcoCrop.

### Generating candidates

1. The current rotation: the repeating cycle found in the crop history, or the history as entered if no cycle repeats.
2. One-step changes to the current rotation: add a cover crop after the earliest-harvested crop, add a small grain, add a legume, replace one year.
3. Rotations of two to five years enumerated from the crop list.
4. Filters: excluded crops; sowing must not come before the previous harvest month (from the calendars, so maize followed by winter rapeseed is dropped, while winter wheat sown in the month maize is harvested stays); crop family return intervals as hard limits only where the source says "never".

The engine scores all candidates. For each goal it shows the current rotation plus the three best others: four cards, or fewer when fewer than three others pass the soil floor.

### Calendar strip

One row of months per rotation year. Each month cell shows the cover state by colour (crop, cover crop, residue, bare) and up to three small hazard marks when the crop in the ground is sensitive that month and the hazard, measured against that crop's own thresholds, occurred in more than a set share of the 45 years at this field (the share is a row in `data/rules/hazards.json`). Tapping a mark shows the number ("drought in 11 of 45 years in July") with its source label. The strip for the current rotation sits above the strips of the alternatives so bare months can be compared by eye. Bare periods are our calculation from crop calendars; the label says so.

## 9. Field twins (parallel track)

Places with similar climate and soil, what is grown there and how it did. Twins are evidence inside a card, never a screen of their own and never a forecast.

- Case base: one row per region, US counties in the main farm states and EU NUTS 2 regions, in `data/twins/cases.json`. Features: growing-season temperature, rain, root-zone wetness, frost days and hot days from NASA POWER climatology at the region centroid; sand, clay and organic carbon from SoilGrids.
- Outcomes: crop shares and yields per region (USDA NASS QuickStats; Eurostat). NDVI from NASA satellites is a later option.
- Similarity: Euclidean distance on z-scored features, shown as 0–100. The ten nearest regions that grow at least one crop of the rotation are the cases.
- States: `not-loaded` (track not merged yet), `no-data` ("no similar places with this crop in our case base"), `error`, `ready`.
- O4 decides the exact region list in the first task and writes the count into the file's metadata. If the case base is not ready at T+9, the cards ship with the `no-data` text and the pitch does not mention twins.

## 10. Data transparency

- Every number on screen is rendered by `<SourcedNumber>`: value, unit, and a source chip. The chip opens: dataset name, provider, native resolution, period, retrieval date, and one of "observed", "model estimate", "our calculation".
- Honest labels for our main sources: NASA POWER and SMAP L4 are model estimates that assimilate observations; GAEZ suitability is a model; SSURGO is a soil survey (observation); CropScape is a satellite classification (model estimate); every score is our calculation.
- Missing data shows as "no data" with the reason. No component substitutes a default.
- Precomputed files carry `{ retrievedAt, script, sourceUrl }` in a `meta` block; `validate:data` checks it.
- A "Sources" panel lists every dataset used for the current field, NASA first. The same list feeds the References section of the submission.

## 11. Terms and the "supports, not replaces" text

- `<Term id="evapotranspiration">` renders the word with an info icon; the tooltip is one plain sentence. The glossary page lists all terms.
- Terms for the minimum: evapotranspiration, anomaly, NDVI, soil moisture (m³/m³), root zone, soil wetness index, suitability class, cover crop, catch crop, humus balance, percentile range, model estimate.
- Glossary text lives in `src/steps/glossary/terms.en.json` and `terms.pl.json` (owner O2). Other lanes ask for a new term in the PR that needs it; O2 adds it.
- Every card ends with: "This is decision support. It does not replace your judgment or your advisor's. Check the gaps and risks above against what you know about this field."

## 12. Screens and states

One page: a start page, then six steps with a progress bar, back and forward (D52).

| Step | Screen | Main elements |
|---|---|---|
| 0 | Start | the app name as the title, one sentence on what the tool does, a large Start button; no progress bar |
| 1 | Field | map, address box (a hit outlines the field there: the ULDK parcel in Poland, the Iowa demo field within 2 km of it, else a 4 ha square), parcel number box (Poland); parcel layer (KIEG), click to select, draw, split and merge; Undo for every field edit; list of fields |
| 2 | Goal | "What matters most to you?" with three icons and one line each; changeable later with Back |
| 3 | Crops | proposed history with confirm or correct; icon picker for the last two or three years |
| 4 | Priorities | switches with one-line explanations; excluded crops |
| 5 | Rotations | goal switcher, field profile summary, four cards, calendar strips, sources panel |
| 6 | Money | margins and payments per rotation with their conditions, dated, below the cards |

Every screen and every card section handles five states through `<StateBoundary>` from `src/ui-kit`: loading (skeleton with the name of the source being fetched), offline, no data, source error (which source, retry button), ready. A failed source never blanks the screen: the rest of the analysis renders and the failed part shows its error.

Design: icons and colour before text, large touch targets, readable on a phone held in a field. O2 runs `ui-ux-pro-max` for the visual direction before building step 5.

## 13. Owner folders

Each person runs two streams at once. Streams never share a file, so two subagents can work in parallel inside one lane.

| Owner | Stream A | Stream B |
|---|---|---|
| **O1** merger, reviewer, monitoring | `src/contracts/`, `src/app/`, `src/ui-kit/`, `src/fixtures/`, root config, `.github/`, `api/` routing, deploy | `e2e/`, `docs/`, review and merge of all PRs, hourly e2e on `main` |
| **O2** frontend | `src/map/` (search, parcels, boundary editing) | `src/steps/` (goal, crops, priorities, cards, calendar, money, glossary) |
| **O3** engine | `src/profile/` (POWER and SMAP clients, field profile) | `src/engine/` (candidates, scoring, goals, calendar, `analyzeField`) |
| **O4** data and evidence | `scripts/`, `data/precomputed/`, `data/crops/`, `src/context-data/`, `api/cropscape.ts`, then `src/money/`, `data/money/` | `data/rules/` first (D16), then `src/twins/`, `data/twins/` |

Anything outside your folders is a separate `[contract]` PR reviewed by O1. Pitch and presentation get an owner after the skeleton is on `main`.

## 14. Tests

- Unit (Vitest): parsers run against saved samples in `data/samples/`; scoring and calendar functions have table-driven tests with hand-checked cases; each provider has a test that a missing input yields `value: null` with a reason.
- Contract: `src/fixtures/` and every file in `data/` parse with the zod schemas (`npm run validate:data`).
- e2e (Playwright, O1): Iowa demo field from step 1 to step 5 ends with four cards; each card has non-empty gaps and risks, the support sentence, a calendar strip and at least one source chip; the Poznań demo field does the same; with POWER blocked the page shows a source error and no blank screen.
- CI runs typecheck, unit tests, build and `validate:data` on every PR.

## 15. Allowed data sources

`power.larc.nasa.gov`, `gibs.earthdata.nasa.gov`, `planetarycomputer.microsoft.com` and its blob storage, `gaez-services.fao.org`, `nassgeodata.gmu.edu`, `quickstats.nass.usda.gov`, `sdmdataaccess.sc.egov.usda.gov`, `rest.isric.org`, `services.gugik.gov.pl`, `uldk.gugik.gov.pl`, `integracja.gugik.gov.pl` and `integracja02.gugik.gov.pl` (the KIEG parcel map; D49), `geocoding.geo.census.gov`, `nominatim.openstreetmap.org` (max 1 request per second), `tile.openstreetmap.org`, `ec.europa.eu` (Eurostat) including `gisco-services.ec.europa.eu` (NUTS regions), `www2.census.gov` (US county centroids, build scripts only; D38). Any other server: ask a human.

## 16. Submission

Demo of at most seven slides or a 30-second video, English, a References list generated from the datasets registry plus code and image credits, the AI usage description merged from `docs/ai-usage/`, no NASA logos in generated content, public repo, one project name everywhere. Checklist: `HACKATHON.md` §13.

## 17. Risks specific to this design

| Risk | Answer |
|---|---|
| The minimum grew with PR #19 and #20 (calendar, ranges, source labels, glossary) and we are about 100 minutes behind the schedule | provenance and state components come with the skeleton so lanes get them for free; "minimum done" moved from T+8 to T+9, Sat 20:10 (D17) |
| Rule values are ours to defend | one source per row, enforced by CI; mentor review; `weak` and "rule of thumb" shown on screen |
| POWER is about 50 km, so two fields in one cell get the same climate | the source chip says so; soil, slope and crop history are what make fields differ |
| Leaflet-Geoman cut tool and EPSG:2180 are unverified together | split and merge is a parallel track; click and draw are enough for the minimum |
| The income goal turns the tool into a price or subsidy comparison | income is replayed over the field's 45 NASA years, not read from a price list; there is no ranking by payments alone; soil floor; soil health and climate shown first on every card; default goal is "Keep my soil" |
| Prices and payment rates for 2026 are partly unconfirmed (ARiMR eco-schemes, NRCS Iowa rates) | each rate is `Sourced` and dated; an unconfirmed rate is left out of the sum and named in the gaps; income then rests on margin only |
| The yield-loss replay looks like a forecast | confidence capped at `moderate`; the card says "past years at today's prices, not a forecast"; factors sourced from FAO |
| Twins case base may not finish | `no-data` state is designed in; twins are left out of the pitch if missing at T+9 |
| Hosting was never tested (the T+1 gate was skipped) | O1 deploys the empty skeleton to Vercel before lanes start |

## 18. Open decisions for `docs/DECISIONS.md`

1. D7: challenge is Field Shift, demo fields in Iowa and near Poznań (from HANDOFF, not yet recorded).
2. D8: submission deadline stays Sun 11:59 (D5); the official guide says 11:59 p.m. and the Poznań desk 13:30.
3. D9: the ranking depends on the farmer's main goal (keep soil, improve soil, income). This replaces the HANDOFF rule "money must not reorder the ranking by default" with: the default goal is soil, money ranks only when the farmer chooses income, income is margin replayed over the field's 45 NASA years plus confirmed payments, there is no ranking by payments alone, and the soil floor applies. Weights in section 7 need the team's yes.
4. Exact coordinates of the two demo fields (O4 picks arable fields and records them).
5. Who owns the Vercel account and whether the repo owner connects it.
6. Decided (D17): "minimum done" is at T+9 (Sat 20:10).
7. Project name, at the end.
