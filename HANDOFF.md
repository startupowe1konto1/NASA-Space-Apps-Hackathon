# Handoff v3: Field Shift chosen, ready for spec and plan

Written Sat 14 Nov 2026, 14:15 CET (T+3:06), for a fresh Claude Code session. Everything below was checked in this repo's history and in live requests; where something was not checked, it says so. The shortlist analysis that led here (v2 of this file) is in git history and in [context/challenge-comparison.md](context/challenge-comparison.md).

## Start here (fresh session)

1. Read `CLAUDE.md` (repo rules), `HACKATHON.md` §5 (schedule), §7 (idea to plan), §14 P2 (prompt), then this file.
2. Then read, in this order: [context/field-shift-team-notes.md](context/field-shift-team-notes.md) (team decisions, concept, farmer journey), [context/field-shift-datasets.md](context/field-shift-datasets.md) (43 sources with test status), [context/field-shift-data.md](context/field-shift-data.md) (O1's SMAP, NISAR SME2 and GAEZ checks), [context/field-shift-power-gaez.md](context/field-shift-power-gaez.md) (NASA POWER + GAEZ checks), [context/field-shift-candidate-datasets.md](context/field-shift-candidate-datasets.md) (O1's neutral list), [context/rules.md](context/rules.md).
3. Next task: prompt P2. Write `docs/SPEC.md` with `superpowers:brainstorming`, then `docs/PLAN.md` with `superpowers:writing-plans`. Skills the user approved for this phase: `superpowers:brainstorming`, `superpowers:writing-plans`, `ui-ux-pro-max`, `dataviz`, `anthropic-skills:anti-ai-writing`.
4. The user (team Vibecodersi) writes in Polish; answer in Polish. Repo files, UI and submission are in English (DECISIONS D3).
5. We are behind the §5 schedule: the skeleton should have been on `main` at T+3 (14:10). Spec and plan are the critical path.

## Event facts

- T0: Sat 14 Nov 11:09 CET. Our deadline: **Sun 11:59** (DECISIONS D5). Freeze and submit at T+23 (Sun 10:10).
- **Open conflict, needs O1:** the official [Project Submission Guide](https://www.spaceappschallenge.org/resources/project-submission-guide/) says submission closes Sun 15 Nov **11:59 p.m.** local time. The [Poznań schedule](https://www.spaceappschallenge.org/2026/local-events/poznan/?tab=schedule) asks for submission and slides at the info desk by **13:30**, pitches from 14:30 (3 min + 2 min Q&A). D5 (11:59) is stricter than both, so it is safe, but it may be a misread of "11:59 p.m.".
- Mentors: Sat 15:00, Sun 10:30 (pitch coaching).
- Submission needs: a demo (max 7 slides or a 30 s video), English, all data, code and images listed in References, a description of AI ("SI") use, no NASA logos in generated content.

## Decision

**Challenge: [Field Shift: Adapting Farms with NASA Data](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/).** Demo fields in the **USA (Iowa)** and **Poland**. Dropped: Trend Detective, Dancing with the SARs, Martian Map, Flame in Freefall and the other nine challenges.

Not yet in `docs/DECISIONS.md`: O1 should add D7 (challenge and demo fields).

## What the challenge asks

Farmers face shifting temperatures, less predictable rain, water shortages, extreme weather and declining soil health, so choosing rotations that protect fields and conserve water is hard. Build a decision-support tool that uses NASA Earth observations with local soil, crop traits and farmer priorities to explore rotations that improve soil health and resilience. Explicit asks from the Objectives:

- compare **at least three rotation strategies, including the existing one**;
- for each: why it was suggested, the evidence, benefits, information gaps, risks that need local review;
- show bare-field periods and seasons when current crops are vulnerable;
- take farmer priorities into account: water use, forage, nitrogen fixing, erosion, organic matter, market suitability, supplemental income;
- explain terms (evapotranspiration, anomalies, NDVI), show uncertainty, and say the tool supports and does not replace farmer judgment.

AI is welcome but **not required** (it appears as an opportunity and in the optional "Potential Considerations").

## Judging criteria (each scored 1–5)

Impact, Creativity, Validity, Relevance ("NASA data integral, not superficial"), Presentation. To be eligible for global awards the project must use at least one NASA dataset or resource ([Judging & Awards Guide](https://www.spaceappschallenge.org/resources/judging-awards-guide/)). Phase 1 judging is local: the Poznań jury picks the global nominees.

## Concept

**One sentence:** the farmer marks a field and gets the **3 best rotations plus the current one**, ranked first on **soil health** and **climate resilience** from 45 years of NASA data for that field, each with evidence, risks and data gaps, and only then the money; the same app works in the USA and in Poland.

Team rules (from the discussion, see team notes):

- Soil health is the core. Money (payments, costs, revenue) is an add-on and must not reorder the ranking by default. The team explicitly does not want a price or subsidy comparison site.
- Recommendations come from the field's history, NASA climate risk, soil-health effects and, last, the money.
- Show 3 best rotations plus the current one. The engine may score more.
- **Data transparency** (added by O1, not yet covered by the concept). Every number on screen shows its source dataset, native resolution, time period and retrieval date, and says whether it is an observation, a model estimate or our own calculation. Missing data is shown as missing, never filled with invented values.
- **The tool supports the farmer and does not replace them** (added by O1; the brief asks for this explicitly, see "What the challenge asks"). Each rotation card and the advisor report say so in plain words, and the information gaps and risks that need local review are part of every card, not a footnote.

### Farmer journey (7 steps)

1. **Find the field:** address (GUGiK geocoder in Poland, US Census in the USA, Nominatim elsewhere), parcel number (ULDK, Poland) or click.
2. **Boundaries:** Polish cadastral parcels shown on the map (KIEG); the farmer can split a parcel, merge parcels, redraw. A cadastral parcel is not a field.
3. **Crops:** where data exists (USA, CropScape) the app asks "corn in 2025, soy in 2024, correct?"; otherwise (most of Poland) the farmer picks the last 2–3 crops from an icon list. The farmer's answer wins.
4. **Priorities:** soil health always on; the farmer adds water, forage, income, equipment limits.
5. **Rotations:** 3 best + current; each card has why, evidence, benefits, gaps, risks.
6. **Money (add-on):** Poland: eco-schemes and the GAEC 7 rotation rule; USA: NRCS practices 340 (cover crop) and 328 (conservation crop rotation), shown as "if your application is selected" (EQIP/CSP are competitive: about 24% and 37% of applications funded in FY2025). Costs and revenue at current prices.
7. **Decision:** report for the farm advisor.

### Analysis engine (background)

- **Field profile:** droughts, heat, frost, soil moisture, bare-soil periods, slope, from NASA data.
- **Field twins:** places and years with similar climate and soil, what was grown there and how it did (county or regional yields; NDVI from NASA satellites). Twins are evidence inside the cards, not a separate screen. Builds on the known climate-analogue method ([CCAFS Climate Analogues](https://ccafs.cgiar.org/fr/node/113047)); new is adding soil, the crops actually grown and their results. The USA (CropScape + NASS yields) is the richest case base; Polish fields can find twins there. Optional future view: NASA NEX-GDDP-CMIP6 projections (on Planetary Computer and AWS, no login). Scope for 24 h: precomputed features for US farm counties and EU NUTS 2 regions, not a global search.
- **Soil health score:** nitrogen, organic matter, erosion, pest-cycle break. Highest weight. Each rule needs a source.

### Add-ons, in priority order

1. Pictures and icons instead of text, colour scores, risk pictograms (cheap, wanted).
2. Polish and English UI, ready for more languages.
3. WhatsApp/Telegram bot that sends back the report link (simplest version only; full chat after T+8 if ever).
4. Sonification: 45 years of soil moisture as sound, droughts heard as silence (pitch differentiator, only if time is left).
5. Offline mode: not now.

### What is new compared with existing tools

FAO GAEZ shows suitability but no rotations; Crop-CASMA (NASA/USDA) shows soil moisture, US only; US cover-crop selectors are regional; climate-analogue tools compare climate only. We found no free tool that combines a field's NASA climate risk, soil-health scoring of whole rotations, evidence from similar places with real outcomes, and the payment rules, in two countries. Sources in [context/challenge-comparison.md](context/challenge-comparison.md) and the team notes.

## Data

Full list with status: [context/field-shift-datasets.md](context/field-shift-datasets.md). Rule: every number that decides a recommendation comes from NASA data.

Tested and working (no login unless noted):

| Source | Use | Access notes |
|---|---|---|
| NASA POWER | 45 years of climate and soil wetness per point or 10°×10° grid | CORS `*`; regional endpoint takes one parameter per request |
| SMAP L4 via NASA GIBS | soil moisture since 2015 | values read from the GIBS colormap (O1) |
| NASA HLS (30 m) and NASADEM via Microsoft Planetary Computer | field-level NDVI, slope | STAC CORS `*`, anonymous SAS token per collection; MODIS collections returned 403 (token to fix) |
| FAO GAEZ v4 ImageServer | suitability and attainable yield, 50 crops, past and future | one raster per `getSamples` call (lock raster ID); 3 MB GeoTIFF per crop on S3 |
| USDA CropScape (CDL) | crop history per field, USA | x/y in EPSG:5070 (Albers); **no CORS**, needs a server or prefetch |
| USDA SSURGO (Soil Data Access) | field soil, USA | CORS `*`, SQL over POST |
| SoilGrids | soil texture, pH, carbon, Poland | 3–15 s per request (O1) |
| GUGiK geocoder (UUG), ULDK, KIEG WMS | address, parcel by click or ID, parcel map, Poland | CORS `*`; KIEG renders only in **EPSG:2180** (needs proj4 or a proxy) |
| US Census geocoder, Nominatim | addresses, USA and global | Nominatim: max 1 request/s |
| Giovanni | 2,049 variables, area time series | Earthdata login done in the browser pane and GES DISC licence accepted at 13:05; time series not run yet |

Still to check before building on them: MODIS NDVI/ET from Planetary Computer (403), NRCS Iowa rates for practices 340/328, ARiMR 2026 eco-scheme rates (portals quote 437.60 PLN/ha for catch crops in 2025 and about 700 PLN/ha for legumes in 2026, not confirmed), EuroCrops coverage of Poland, crop prices and fertilizer costs.

## Technical gotchas found today

- The WebFetch tool fails on the venue network ("unable to get local issuer certificate"); use curl or the built-in browser.
- Python on this Windows machine writes `\r\n`; strip `\r` before using its output in shell URLs. Use `python -I`.
- ASF/NISAR HDF5 downloads do not accept the browser-pane Earthdata session; they would need an Earthdata token in `.env` (not set up).
- Test pages from today: `data/samples/mars-trek/leaflet-spike.html` (Leaflet + EPSG:4326 tiles), `data/samples/power/trend-spike.html` (POWER grid + Mann-Kendall in the browser). Serve a folder with `python -m http.server 5171`.

## Risks

| Risk | Mitigation |
|---|---|
| Soil-health and rotation rules are ours | one source per rule; mentor check at 15:00; show "check locally" |
| Turning into a subsidy comparison site | money section below the cards, not used for ranking by default |
| Twins scope too big for 24 h | precomputed US counties + EU NUTS 2 only; show similarity and number of cases |
| Yield depends on inputs and management, not only climate | present twins as evidence and inspiration, not a forecast; never promise "best yield" |
| Payment rules change yearly and differ by country | one country table each, dated "campaign 2026, check ARiMR / NRCS" |
| Poland lacks per-field crop history | farmer enters it; icon list makes it quick |
| KIEG projection and CropScape CORS | proj4 in the map; a small server for CropScape and prefetched GAEZ |

## Pitch outline (3 minutes)

0–30 s: a real field near Poznań and one in Iowa, the drought of 2026 in NASA soil-moisture data. 30–120 s: live app: mark the field, confirm crops, three rotations with soil-health scores and "places like yours" evidence. 120–150 s: the money add-on in both countries. 150–180 s: who benefits, what is next (more countries as plug-ins), the limits we state openly.

## Open questions for the spec

- Exact soil-health score: which indicators, which sources, which weights.
- Which rotations the engine generates (crop list per country, 6–8 crops for the demo).
- Twins: features, distance measure, outcome measure (yield vs NDVI), case base size.
- Stack and hosting (CLAUDE.md still has placeholders), owner folders for O1–O4.
- Project name (HACKATHON.md §2 rule 7: one name everywhere).

## Repo state at 14:15

`main` at `98634fa` (PR #17 merged), no open PRs. Merged today from this session: #4, #5, #7, #10, #13, #15 (O1's, at the user's request), #16, #17 (O1's, at the user's request); #9 closed as a duplicate of O1's #8. Never push to `main`; squash-merge through PRs; the user asks to merge handoff updates as soon as they are written.
