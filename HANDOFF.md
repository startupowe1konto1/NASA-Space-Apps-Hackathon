# Handoff v2: challenge shortlist with research results

Status: Sat 14 Nov, 12:15 CET (T+1:06). Five challenges on the shortlist, none chosen yet. Research questions 1, 2, 3, 5 are answered and 4 is answered without a login; see "Recommended solution per challenge" below. The idea decision is due at T+2:00 (13:10), per HACKATHON.md §5. When the team picks one, this file is rewritten as the full handoff from HACKATHON.md §7 point 1.

Changes since v0: the team dropped groups 3 and 4 whole, except Flame in Freefall, which O1 kept on the shortlist (DECISIONS D6). Health Monitoring stays dropped. Projects are global for now: no region is assumed. Research question 1 (Martian Map) is answered.

Everything below comes from the challenge Details and Resources tabs (read without logging in) and from live requests to the data sources listed there.

## What to do next

1. **Now → 12:30.** Read "Recommended solution per challenge" and the `context/` files. Only research question 4 has an open part (NISAR HDF5, needs an Earthdata login).
2. **Now.** Agree the idea rejection criteria (proposal at the bottom). If anyone has an Earthdata account, log in and keep any token in `.env` only; it is needed only for measured NISAR change and for Giovanni/AppEEARS. The top three options do not need it.
3. **12:30 → 13:10.** Compare the research results against the criteria. Cut to two, then pick one challenge and one idea from the "Ideas" lists. Name the project. Choose a region or area of interest only after the idea is picked, and only if the idea needs one.
4. **13:10.** Record the decision in `docs/DECISIONS.md`, then run prompt P2: rewrite this file as the full handoff, write `docs/SPEC.md` and `docs/PLAN.md`.

## Event facts found at T0

- Local event schedule ([event page, Schedule tab](https://www.spaceappschallenge.org/2026/local-events/poznan/?tab=schedule)): Sun 13:30 is the "Firm Deadline" to submit on the global portal and hand pitch slides to the info desk. Live pitches start at 14:30: 3 minutes plus 2 minutes of questions in front of the jury. Awards at 18:00.
- Our deadline is **Sun 11:59** (DECISIONS D5, set by O1), earlier than the 13:30 on the local schedule. Freeze and submit at T+23 (Sun 10:10); there is no buffer after T+24.
- Mentors: Sat 15:00 (session 1), Sun 10:30 (pitch coaching). Local Lead: Rahaf Zorba (contact on the event page). Venue: +Jeden, ul. Za Bramką 1.
- A 3-minute pitch rewards a project that shows real data on screen within the first 30 seconds.

## All 14 challenges, grouped

Source: [2026 challenges](https://www.spaceappschallenge.org/2026/challenges/). Add `?tab=resources` to a challenge URL to open its data list.

| Group | Challenge | Difficulty | Team decision |
|---|---|---|---|
| 1. Earth data | [Be An Earth System Trend Detective!](https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/) | Advanced | **shortlist** |
| 1. Earth data | [Dancing with the SARs](https://www.spaceappschallenge.org/2026/challenges/dancing-with-the-sars/) | Advanced, Intermediate | **shortlist** |
| 1. Earth data | [Field Shift: Adapting Farms with NASA Data](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/) | Advanced, Intermediate | **shortlist** |
| 1. Earth data | [Harmonization of MODIS and VIIRS Hot Spots](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/) | Advanced, Intermediate | dropped |
| 2. Moon, Mars, sky | [Interplanetary Survival Guide: Martian Map](https://www.spaceappschallenge.org/2026/challenges/interplanetary-survival-guide-martian-map/) | Intermediate | **shortlist** |
| 2. Moon, Mars, sky | [Lunar Landing Site Navigator](https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/) | Advanced, Intermediate | dropped |
| 2. Moon, Mars, sky | [Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars](https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/) | Advanced, Intermediate, Beginner | dropped |
| 2. Moon, Mars, sky | [Planet X and SPHEREx](https://www.spaceappschallenge.org/2026/challenges/planet-x-and-spherex/) | Advanced | dropped |
| 3. Crew health and safety | [Create Health Monitoring Software for Astronauts on Space Missions](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/) | Intermediate | dropped |
| 3. Crew health and safety | [Flame in Freefall: SI-Powered Fire Safety Insights](https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/) | Advanced, Intermediate | **shortlist** (kept by O1, D6) |
| 4. Education, games, art | [Build a Junior Astronaut Mission Trainer](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/) | Intermediate, Beginner | dropped (whole group) |
| 4. Education, games, art | [Space Mission Design Game](https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/) | Intermediate, Beginner | dropped (whole group) |
| 4. Education, games, art | [Abandoned but not Forgotten](https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/) | Intermediate, Beginner | dropped (whole group) |
| 4. Education, games, art | [The Earth Information Jukebox](https://www.spaceappschallenge.org/2026/challenges/the-earth-information-jukebox/) | Intermediate, Beginner | dropped (whole group) |

## Data access checked so far

Real requests from the venue network, not guesses. Where a point was needed for a test, we used 52.41 N, 16.93 E only because it was at hand; it says nothing about where the project will focus.

| Source | Result |
|---|---|
| [NASA POWER API](https://power.larc.nasa.gov/) | No key, CORS `*`. Point: 45 years (1981–2025) of monthly agroclimate and soil wetness in about 1 s. Grid: a 10°×10° box (357 cells) in 2.5–7 s, one parameter per request. Details: [context/trend-detective.md](context/trend-detective.md), [context/field-shift-data.md](context/field-shift-data.md). |
| [FAO GAEZ v4](https://gaez.fao.org/) (Field Shift partner resource) | No key. Crop suitability for 50 crops at any point, about 4 s per crop; each global layer is a 3 MB GeoTIFF. Details: [context/field-shift-data.md](context/field-shift-data.md). |
| [ASF search API](https://search.asf.alaska.edu/) for NISAR | No key for search. 226 granules at the test point over one year. Geocoded browse PNGs (2–4 MB) download without a login; HDF5 files return 401 without Earthdata, size unknown. Details: [context/sars-nisar-data.md](context/sars-nisar-data.md). |
| [PSI](https://psi.nasa.gov/physci/repo/search?q=combustion) | No key. 24 combustion investigations with full metadata; 20 have CSV experimental tables (22 files, 2,870 rows, 211 KB, CC0, DOI). CORS limited to psi.nasa.gov, so fetch at build time. Details: [context/flame-in-freefall-psi.md](context/flame-in-freefall-psi.md). |
| [Mars Trek](https://trek.nasa.gov/mars/) | No key, CORS open. Tiles, 1 m DEM heights in metres, Curiosity route as GeoJSON. No radiation layer in the Trek catalogue. Details: [context/martian-map-trek.md](context/martian-map-trek.md). |
| [AppEEARS](https://appeears.earthdatacloud.nasa.gov/), [Giovanni](https://giovanni.gsfc.nasa.gov/) | Need an Earthdata login. Not tested: the login in the browser pane failed at 12:20. |

The built-in WebFetch tool fails on this network ("unable to get local issuer certificate"). curl and the browser work.

## Analysis of the five shortlisted challenges

Scores out of 5, updated after the research. Build = chance of a working demo on real data by T+8 (19:10). Pitch = what a judge sees in 3 minutes. Data = how well the data we reached supports the brief. Login = whether the demo needs an Earthdata login.

| Challenge | Build | Pitch | Data | Login | One-line verdict |
|---|---|---|---|---|---|
| Martian Map | 4 | 5 | 5 | no | best demo; every layer tested in a browser |
| Flame in Freefall | 4 | 4 | 4 | no | real ISS flight data (2,870 rows, CC0); AI is the core of the brief |
| Trend Detective | 5 | 3 | 4 | no | working trend map in a browser already; must not look like Giovanni |
| Field Shift | 4 | 4 | 4 | no | POWER + GAEZ work for any point; rotation rules are ours |
| Dancing with the SARs | 3 | 4 | 2 | for real values | browse images only without a login; no measured change |

### Interplanetary Survival Guide: Martian Map

Brief: a map or interface a Mars astronaut could use on a surface walk. Choose a science goal and a place (the brief's example is Curiosity's boxwork at Mount Sharp), layer at least three kinds of data (optical, thermal, spectral, topographic, atmospheric, radiation…), with astronaut safety first.

Resources: [Mars Trek](https://trek.nasa.gov/mars/), [USGS–NASA geologic map of Mars](https://astrogeology-usgs.hub.arcgis.com/pages/interactive-maps-mars), [Curiosity's proposed route up Mount Sharp](https://science.nasa.gov/resource/curiositys-proposed-path-up-mount-sharp/), [NASA Worldview](https://worldview.earthdata.nasa.gov/), [Perseverance raw images](https://mars.nasa.gov/mars2020/multimedia/raw-images/) (over 1 million rover images).

Research result (question 1, done): HiRISE (about 0.6 m/px), CTX, MOLA, THEMIS day and night IR, and the USGS geologic map load as tiles in Leaflet from localhost. The Gale 1 m DEM returns heights in metres per point, along a line, or as a float32 grid. Curiosity's route (19,188 points) and 14 named stops come as GeoJSON. Limits: the 1 m DEM and HiRISE cover only Gale crater; the route layer ends around 2018, before the 2025 boxwork area.

Ideas:
- **Marswalk planner.** Draw a route on Mount Sharp; the app shows the elevation profile and slope from the DEM, flags steep or loose ground (THEMIS night IR), estimates walking time and a "return to rover" point, with geology underneath.
- **Science stop cards.** Along Curiosity's real stops, each card shows a rover image, the geologic unit and what to sample there.
- **3D flyover for the pitch.** DEM grid turned into terrain, camera follows the planned route. Extra work, not a blocker.

Risk: the Trek catalogue has no radiation layer (the brief mentions radiation); a radiation estimate would need a source outside the Resources list and a human OK.

### Field Shift: Adapting Farms with NASA Data

Brief: a decision-support tool that uses NASA Earth observations plus soil, crop and farmer priorities to compare crop rotations, for farmers anywhere. At least three strategies, including the current one, each with the reason, the evidence and the trade-offs.

Resources, NASA (all global): [SMAP](https://www.earthdata.nasa.gov/data/platforms/space-based-platforms/smap) soil moisture every 2–3 days, [GPM/IMERG](https://gpm.nasa.gov/data) rainfall, [Landsat](https://earthexplorer.usgs.gov/) and [MODIS](https://lpdaac.usgs.gov/products/)/[VIIRS](https://search.earthdata.nasa.gov/search?q=VIIRS) NDVI, [NASA POWER](https://power.larc.nasa.gov/) agroclimate, [SRTM](https://www.earthdata.nasa.gov/data/instruments/srtm) terrain, [ECOSTRESS](https://ecostress.jpl.nasa.gov/data) heat and evapotranspiration, GLDAS (search in Earthdata), [GEDI](https://gedi.umd.edu/data). Partner resources with global coverage: [Sentinel-2](https://dataspace.copernicus.eu/), [ERA5](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=overview), [FAO GAEZ](https://gaez.fao.org/) (crop suitability and soil constraints). The USDA sources in the list (Web Soil Survey, SSURGO, CropScape, NASS, PRISM, OpenET) cover the US only, so a global tool cannot rely on them.

Ideas:
- **Rotation compare for any field.** The farmer clicks a field anywhere and enters the current rotation. The app shows 20+ years of rain, heat and frost from NASA POWER, soil moisture from SMAP, crop suitability from GAEZ, and scores three alternatives (add a legume, a cover crop, a drought-tolerant crop) on water use, soil, erosion and income, with the evidence for each score.
- **Bare-soil and stress calendar.** NDVI and SMAP by month show when the field is bare or stressed under each rotation.
- **Plain-language "why".** Each recommendation gets a short explanation built only from the numbers on screen.

Risk: the rotation rules are ours. Get a mentor to sanity-check them at the 15:00 session. A global tool also needs crop rules that work across climates; GAEZ suitability is the most likely way to keep that honest.

### Be An Earth System Trend Detective!

Brief: pick Earth science variables, get them for a region, plot a long time series, test whether the trend is significant (t-test, Mann-Kendall, confidence intervals). Plot plus test meets the full scope.

Resources: [Giovanni](https://giovanni.gsfc.nasa.gov/) (many variables, time series, download), [Hydrology Time Series](https://disc.gsfc.nasa.gov/information/tools?title=Hydrology%20Time%20Series), [AppEEARS](https://appeears.earthdatacloud.nasa.gov/) (time series from federal archives), [NOAA CDO](https://www.ncei.noaa.gov/cdo-web/), [SeaWiFS trend paper](https://ntrs.nasa.gov/api/citations/20090042747/downloads/20090042747.pdf) (example of significance testing), [KNMI Climate Explorer](https://climexp.knmi.nl/), [trend tests article](https://medium.com/@snp.kriss/statistical-test-methods-to-detect-trends-in-time-series-data-b361a0ec530b), CSA: [RCM](https://donnees-data.asc-csa.gc.ca/en/dataset/rcm), [SWOT](https://www.asc-csa.gc.ca/eng/satellites/swot/), [SAR tutorial](https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial).

Ideas:
- **Trend map with verdicts.** Draw a box anywhere on Earth; the app runs Mann-Kendall and Sen's slope on each grid cell and colours where a variable rises, falls or shows no significant change. This answers the brief's point that one variable can trend up in one region and down in another.
- **"Detective case file".** For one region, test ten variables at once (temperature, rain, soil moisture, NDVI, snow…) and list only the significant ones, in plain language with p-values.
- **Shared code with Field Shift.** The NASA POWER time-series code is the same, so this is also a fallback if Field Shift stalls.

Risk: looks like Giovanni with a new skin unless the map of opposite trends or the case file is the visible feature.

### Dancing with the SARs

Brief: an interactive app that uses NISAR radar data to track and visualize one or more types of surface change (floods, forests, crops, soil moisture, glaciers, subsidence) at locations around the world, open source, for a broad audience.

Resources: [Earthdata Search](https://search.earthdata.nasa.gov/search), [ASF Vertex](https://search.asf.alaska.edu/) (NASA's SAR archive), [NISAR data user guide](https://nisar-docs.asf.alaska.edu/), [intro to remote sensing](https://www.earthdata.nasa.gov/learn/earth-observation-data-basics/remote-sensing), [intro to SAR](https://www.earthdata.nasa.gov/learn/earth-observation-data-basics/sar), [ARSET trainings](https://appliedsciences.nasa.gov/get-involved/training), [NISAR StoryMaps](https://nisar.jpl.nasa.gov/applications/arcgis-storymaps/), [NISAR application white papers](https://nisar.jpl.nasa.gov/applications/societal-benefit/), [UAVSAR postcards](https://uavsar.jpl.nasa.gov/education/postcards.html); partners: CSA [RCM](https://donnees-data.asc-csa.gc.ca/en/dataset/rcm), [RADARSAT-1](https://donnees-data.asc-csa.gc.ca/en/dataset/radarsat1) (open archive), [SAR tutorial](https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial), CONAE [SAOCOM](https://catalogos.conae.gov.ar/catalogo/catalogoSatSaocomInfo.html) (registration).

Ideas:
- **Soil-moisture year anywhere.** NISAR SME2 granules (about one per week at the test point) played as a time-lapse with a slider, next to rainfall from GPM. Links to the Field Shift story.
- **Change-type gallery.** A handful of places around the world, one per change type from the brief (flood, forest loss, subsidence, glacier), each as a before/after swipe built from GCOV or GUNW.
- **Flood or wetland pulse.** Water mask per date from GCOV backscatter, area of water over time for a chosen river valley.

Risk: HDF5 products, likely gigabytes each, Earthdata login, SAR know-how. Workable only if one person preprocesses a small area into PNG frames or tiles in the first two hours.

### Flame in Freefall: SI-Powered Fire Safety Insights

Brief: an AI-powered web dashboard that summarizes, ranks and explains combustion experiments for fire safety in spacecraft, stations, lunar and Mars bases and pressurized rovers.

Resources: the [PSI combustion repository](https://psi.nasa.gov/physci/repo/search?q=combustion) is named as "the source of the data upon which the NASA Space App is to be based". Background: [NASA combustion science](https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/), [researcher's guide to ISS combustion science](https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/) (2015, 50+ pages), [ScienceCasts video](https://www.youtube.com/watch?v=W1oXykoz9zg), accident reports [Apollo 1](https://sma.nasa.gov/sma-disciplines/accllp/apollo-1), [Apollo 13](https://sma.nasa.gov/sma-disciplines/accllp/apollo-13), [Mir 1997](https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/), spinoffs ([air tanks](https://spinoff.nasa.gov/node/9582), [fire detector](https://spinoff.nasa.gov/node/9407), [fire attire](https://spinoff.nasa.gov/node/9918)).

Ideas:
- **Habitat fire-risk ranker.** Pick a habitat (ISS module, pressurized rover, lunar base) and a material or scenario; the app ranks PSI experiments by relevance and shows the findings that apply, each linked to its PSI page and DOI.
- **Lessons-learned timeline.** Apollo 1, Apollo 13 and Mir mapped to the PSI experiments that later studied the same failure.
- **Earth spinoff view.** The same findings applied to firefighting on Earth, as the brief suggests.

Research result (question 5, done): 24 combustion investigations with full metadata through a public API; 20 publish CSV experimental tables (22 files, 2,870 rows, 211 KB, CC0, each with a DOI), all downloaded without a login in 27 s. Examples: FLEX droplet tests (274 rows: fuel, pressure, O2/CO2/He, burn time, extinction), SAFFIRE large-scale fires on Cygnus (material, thickness, air flow, O2), BASS and ACME flame tests. CORS allows only psi.nasa.gov, so the app ships the data as static JSON. The PSI site asks users to cite each dataset's DOI. The AI layer must only summarize what the PSI records say, with links, so judges can check every claim.

## Recommended solution per challenge

One concrete product per challenge, built only on data we have already fetched. Each is a static web app plus, where noted, a build-time script.

| Challenge | Recommended product | Data (tested) | First screen in the pitch | Main risk |
|---|---|---|---|---|
| Martian Map | **Marswalk planner on Mount Sharp.** Draw a route; elevation profile and slope from the 1 m DEM, loose-ground warning from THEMIS night IR / TES thermal inertia, geology underneath, Curiosity's real stops as science cards, walking time and turn-back point. | Mars Trek tiles, Gale DEM ImageServer, Curiosity route GeoJSON | HiRISE close-up with a drawn route and a red "too steep" segment | no radiation map in Trek; the 2025 boxwork area is past the 2018 route data |
| Flame in Freefall | **Habitat fire-safety explorer.** Choose a habitat (ISS, rover, lunar base) and its atmosphere (O2 %, pressure, air flow); the app filters the 22 PSI tables to tests run near those conditions, shows what burned or went out and how fast, and an AI summary ranks the investigations that matter for that habitat, every sentence linked to a PSI record and DOI. | PSI search and detail API, 22 CSV tables (build-time fetch) | "Lunar base, 34% O2, 0.56 atm": a ranked list with FLEX and SAFFIRE results and a plot of burn time vs O2 | columns differ per table, so a common schema has to be made and checked; AI claims must stay traceable |
| Trend Detective | **Trend map with verdicts.** Draw a box anywhere, pick a variable; per-cell Mann-Kendall + Sen's slope, map of rising / falling / no trend, click a cell for its series and a plain-language verdict with p-value; a false-discovery-rate option. | NASA POWER regional grid (CORS open) | East Africa soil moisture: blue and red cells side by side in one region | POWER is not on this challenge's Resources list; Giovanni/AppEEARS need a login |
| Field Shift | **Rotation compare for any field.** Click a field, enter the current rotation; 45 years of rain, heat, frost and soil wetness from POWER, GAEZ suitability for the candidate crops, three alternatives scored on water, soil, erosion and suitability, each score with its evidence. | NASA POWER point, FAO GAEZ getSamples (or preprocessed GeoTIFFs) | one field, three rotation cards with scores and the climate chart behind them | the agronomy rules are ours and need sources; data is about 9–50 km, not field-scale |
| Dancing with the SARs | **NISAR change viewer.** Click a place; the app lists NISAR passes and plays the geocoded browse images on the map with a date slider and before/after swipe. Measured change (water area, soil moisture) only if someone with an Earthdata login downloads and processes a granule. | ASF search, browse PNGs | a river valley flickering through a year of radar passes | without the HDF5 files it shows change but cannot measure it |

Ranking for the 13:10 decision, against the proposed rejection criteria:

1. **Martian Map** passes all three criteria and has the strongest first 30 seconds.
2. **Flame in Freefall** passes all three. It is the only one where AI is the brief itself, and its data is real flight data that few teams will have parsed. Its weak point is the schema work on 22 different tables.
3. **Trend Detective** passes all three and is already half-built (`data/samples/power/trend-spike.html`). Weakest "wow".
4. **Field Shift** passes, but the value depends on rotation rules we would have to write and defend.
5. **Dancing with the SARs** fails "no demo on real data by T+8" for measured change unless a login and HDF5 processing work in the next hour.

## Research questions (status)

1. **Martian Map:** done. [context/martian-map-trek.md](context/martian-map-trek.md) (PR #5). The Trek catalogue has no radiation layer (searched "radiation", "dust"); TES dust and thermal inertia layers exist.
2. **Field Shift:** done without SMAP. [context/field-shift-data.md](context/field-shift-data.md). POWER point + GAEZ: a clicked point gets climate and three crops in about 13 s (1 s + 3 × 4 s), or under 2 s with preprocessed GAEZ layers. SMAP via Earthdata not tested.
3. **Trend Detective:** done with POWER. [context/trend-detective.md](context/trend-detective.md) (PR #10). Giovanni/AppEEARS not tested (login).
4. **Dancing with the SARs:** half done. [context/sars-nisar-data.md](context/sars-nisar-data.md). Open: HDF5 size and processing time, needs an Earthdata login.
5. **Flame in Freefall:** done. [context/flame-in-freefall-psi.md](context/flame-in-freefall-psi.md).

Proposed idea rejection criteria (agree by 12:10): no demo on real NASA data by T+8; data needs more than 1 h of preprocessing; an existing NASA tool already does the same thing without a clear difference.
