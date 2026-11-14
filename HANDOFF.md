# Handoff v1: challenge shortlist

Status: Sat 14 Nov, 12:05 CET (T+0:56). Five challenges on the shortlist, none chosen yet. The idea decision is due at T+2:00 (13:10), per HACKATHON.md §5. When the team picks one, this file is rewritten as the full handoff from HACKATHON.md §7 point 1.

Changes since v0: group 4 and Health Monitoring are dropped. Flame in Freefall stays on the shortlist (team decision at 12:05), so the shortlist is five challenges. Projects are global for now: no region is assumed. Research question 1 (Martian Map) is answered.

Everything below comes from the challenge Details and Resources tabs (read without logging in) and from live requests to the data sources listed there.

## What to do next

1. **Now → 12:30.** One challenge per person, five questions for four people (research questions at the bottom, prompt P1 in HACKATHON.md §14). Check against real data: save a response sample in `data/samples/`, write the result in `context/<topic>.md`, report in chat. Question 1 is done ([context/martian-map-trek.md](context/martian-map-trek.md), PR #5); that person can help with question 2 or 4, which need the same Earthdata login.
2. **By 12:10.** Agree the idea rejection criteria (proposal at the bottom). One person creates an Earthdata login (https://urs.earthdata.nasa.gov/) and keeps the credentials in `.env` only. Trend Detective, Dancing with the SARs and Field Shift all need it.
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
| 3. Crew health and safety | [Create Health Monitoring Software for Astronauts on Space Missions](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/) | Intermediate | dropped (Resources has articles only, no datasets) |
| 3. Crew health and safety | [Flame in Freefall: SI-Powered Fire Safety Insights](https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/) | Advanced, Intermediate | **shortlist** |
| 4. Education, games, art | [Build a Junior Astronaut Mission Trainer](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/) | Intermediate, Beginner | dropped (whole group) |
| 4. Education, games, art | [Space Mission Design Game](https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/) | Intermediate, Beginner | dropped (whole group) |
| 4. Education, games, art | [Abandoned but not Forgotten](https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/) | Intermediate, Beginner | dropped (whole group) |
| 4. Education, games, art | [The Earth Information Jukebox](https://www.spaceappschallenge.org/2026/challenges/the-earth-information-jukebox/) | Intermediate, Beginner | dropped (whole group) |

## Data access checked so far

Real requests from the venue network, not guesses. Where a point was needed for a test, we used 52.41 N, 16.93 E only because it was at hand; it says nothing about where the project will focus.

| Source | Result |
|---|---|
| [NASA POWER API](https://power.larc.nasa.gov/) | 200, no key. 24 years of monthly temperature for one test point in under 1 s. Global coverage. |
| [ASF search API](https://search.asf.alaska.edu/) for NISAR | 200, no key for search. At the test point: 226 NISAR granules from 28 Oct 2025 to 29 Oct 2026 (GCOV 48, GSLC 48, RSLC 48, SME2 soil moisture 44, GUNW 38), so about one year of data per place. Downloads need Earthdata login. File sizes not checked. |
| [AppEEARS API](https://appeears.earthdatacloud.nasa.gov/) | 200 on the product list. Requests need Earthdata login. |
| [Giovanni](https://giovanni.gsfc.nasa.gov/) | 200. Plots need Earthdata login. |
| [Mars Trek](https://trek.nasa.gov/mars/) | Works from a localhost web page, no login, CORS open. Details: [context/martian-map-trek.md](context/martian-map-trek.md). |

The built-in WebFetch tool fails on this network ("unable to get local issuer certificate"). curl and the browser work.

## Analysis of the five shortlisted challenges

Scores are a first guess, out of 5. Build = chance of a working demo on real data by T+8 (19:10). Pitch = what a judge sees in 3 minutes. Data = how well the Resources tab supports the challenge.

| Challenge | Build | Pitch | Data | One-line verdict |
|---|---|---|---|---|
| Martian Map | 4 | 5 | 5 | best demo; data access confirmed |
| Field Shift | 4 | 4 | 5 | richest data list, agronomy rules are ours |
| Trend Detective | 5 | 3 | 4 | safest build, needs a differentiator |
| Dancing with the SARs | 2 | 4 | 4 | new mission, heavy processing |
| Flame in Freefall | 3 | 3 | 3 | AI is required by the brief; PSI access not checked yet |

### Flame in Freefall: SI-Powered Fire Safety Insights

Brief: an AI-powered web dashboard that summarizes, ranks and interprets combustion experiments for fire safety in crew habitats: spacecraft, space stations, lunar and Mars bases, pressurized rovers. Users may find the investigations relevant to a habitat, pull out data for flammability and fire modelling, and see research that informs new fire safety equipment. Earth applications are a bonus.

Resources: the [PSI combustion repository](https://psi.nasa.gov/physci/repo/search?q=combustion) is named as "the source of the data upon which the NASA Space App is to be based". Background: [NASA combustion science](https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/), [researcher's guide to ISS combustion science](https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/) (2015, 50+ pages), [ScienceCasts video](https://www.youtube.com/watch?v=W1oXykoz9zg), accident reports [Apollo 1](https://sma.nasa.gov/sma-disciplines/accllp/apollo-1), [Apollo 13](https://sma.nasa.gov/sma-disciplines/accllp/apollo-13), [Mir 1997](https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/), spinoffs ([air tanks](https://spinoff.nasa.gov/node/9582), [fire detector](https://spinoff.nasa.gov/node/9407), [fire attire](https://spinoff.nasa.gov/node/9918)).

Ideas:
- **Habitat fire-risk ranker.** Pick a habitat (ISS module, pressurized rover, lunar base) and a material or scenario; the app ranks PSI investigations by relevance and shows the findings that apply, each linked to its PSI page and DOI.
- **Lessons-learned timeline.** Apollo 1, Apollo 13 and Mir mapped to the PSI investigations that later studied the same failure.
- **Earth spinoff view.** The same findings applied to firefighting on Earth, as the brief suggests.

Risk: we have not yet seen how many investigations PSI lists, what metadata comes with them, or whether files download without a login. The PSI site asks users to cite each dataset's DOI. Judges may read "chat over documents" as common, so the habitat ranking has to be the visible part.

### Interplanetary Survival Guide: Martian Map

Brief: a map or interface a Mars astronaut could use on a surface walk. Choose a science goal and a place (the brief's example is Curiosity's boxwork at Mount Sharp), layer at least three kinds of data (optical, thermal, spectral, topographic, atmospheric, radiation…), with astronaut safety first.

Resources: [Mars Trek](https://trek.nasa.gov/mars/), [USGS–NASA geologic map of Mars](https://astrogeology-usgs.hub.arcgis.com/pages/interactive-maps-mars), [Curiosity's proposed route up Mount Sharp](https://science.nasa.gov/resource/curiositys-proposed-path-up-mount-sharp/), [NASA Worldview](https://worldview.earthdata.nasa.gov/), [Perseverance raw images](https://mars.nasa.gov/mars2020/multimedia/raw-images/) (over 1 million rover images).

Research result (question 1, done): HiRISE (about 0.6 m/px), CTX, MOLA, THEMIS day and night IR, and the USGS geologic map load as tiles in Leaflet from localhost. The Gale 1 m DEM returns heights in metres per point, along a line, or as a float32 grid. Curiosity's route (19,188 points) and 14 named stops come as GeoJSON. Limits: the 1 m DEM and HiRISE cover only Gale crater; the route layer ends around 2018, before the 2025 boxwork area.

Ideas:
- **Marswalk planner.** Draw a route on Mount Sharp; the app shows the elevation profile and slope from the DEM, flags steep or loose ground (THEMIS night IR), estimates walking time and a "return to rover" point, with geology underneath.
- **Science stop cards.** Along Curiosity's real stops, each card shows a rover image, the geologic unit and what to sample there.
- **3D flyover for the pitch.** DEM grid turned into terrain, camera follows the planned route. Extra work, not a blocker.

Risk: no radiation layer checked yet (the brief mentions radiation).

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

## First recommendation (for discussion, not a decision)

- Strongest demo for the effort: Martian Map. Its data access is now confirmed.
- Richest data and a clear user: Field Shift, starting from NASA POWER (works now) plus SMAP soil moisture.
- Safe fallback: Trend Detective, which can reuse the NASA POWER code from Field Shift.
- Highest risk: Dancing with the SARs (data size and processing).
- Flame in Freefall: decide after question 5. If PSI gives a clean list of investigations with metadata, it is the only shortlisted challenge where AI is the core of the brief.

## Research questions (one per challenge)

1. **Martian Map:** done. See [context/martian-map-trek.md](context/martian-map-trek.md). Open follow-up: is there a radiation layer for Mars (for example from MSL RAD) we can show?
2. **Field Shift:** SMAP soil moisture and FAO GAEZ crop suitability for any one test field. Format, size, login, time to first number. Can a web app get both for a clicked point in under 10 s?
3. **Trend Detective:** does AppEEARS or Giovanni return a 20-year time series for a drawn box with our Earthdata login, and how long does it take? Can Mann-Kendall run in the browser on that series?
4. **Dancing with the SARs:** one NISAR SME2 and one GCOV granule: size, download time, time to one PNG. Which change type (soil moisture, flood, subsidence) is quickest to show?
5. **Flame in Freefall:** list the PSI combustion investigations: how many, what metadata (title, experiment, fuel, conditions, DOI), is there an API or export, do data files download without a login?

Proposed idea rejection criteria (agree by 12:10): no demo on real NASA data by T+8; data needs more than 1 h of preprocessing; an existing NASA tool already does the same thing without a clear difference.
