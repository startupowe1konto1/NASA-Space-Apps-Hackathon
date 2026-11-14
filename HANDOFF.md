# Handoff v0: challenge shortlist

Status: first analysis, Sat 14 Nov, 11:45 CET (T+0:36). No challenge chosen yet. The idea decision is due at T+2:00 (13:10), per HACKATHON.md §5. When the team picks one challenge, this file is rewritten as the full handoff from HACKATHON.md §7 point 1.

Everything below comes from the challenge Details and Resources tabs (read without logging in) and from live requests to the data sources listed there.

## What to do next

1. **Now → 12:10.** Each person takes one research question from the list at the bottom (prompt P1 in HACKATHON.md §14). Check against real data: save a response sample in `data/samples/`, write the result in `context/<topic>.md`, report in chat.
2. **By 12:10.** Agree the idea rejection criteria (proposal at the bottom). One person creates an Earthdata login (https://urs.earthdata.nasa.gov/) and keeps the credentials in `.env` only; three of the six challenges need it.
3. **12:10 → 13:10.** Compare the research results against the criteria. Cut the shortlist to two, then pick one challenge and one idea from the "Ideas" lists below. Give the project a name.
4. **13:10.** Record the decision in `docs/DECISIONS.md`, then run prompt P2: rewrite this file as the full handoff, write `docs/SPEC.md` and `docs/PLAN.md`.
5. **Ask the Local Lead** which deadline counts (see "Event facts"). Write the answer in `context/rules.md` and `docs/DECISIONS.md`.

## Event facts found at T0

- Poznań local schedule ([event page, Schedule tab](https://www.spaceappschallenge.org/2026/local-events/poznan/?tab=schedule)): Sun 13:30 is the "Firm Deadline" to submit on the global portal and hand pitch slides to the info desk. Live pitches start at 14:30: 3 minutes plus 2 minutes of questions in front of the jury. Awards at 18:00.
- The repo (CLAUDE.md, HACKATHON.md §1, context/rules.md, DECISIONS D4) says Sun 23:59. Our plan freezes the repo at T+23 (Sun 10:10), so we make 13:30 either way, but the 12.8 h buffer in §5 does not exist if 13:30 is the deadline.
- Mentors: Sat 15:00 (session 1), Sun 10:30 (pitch coaching). Local Lead: Rahaf Zorba (contact on the event page). Venue: +Jeden, ul. Za Bramką 1, Poznań.
- A 3-minute pitch rewards a project that shows real data on screen within the first 30 seconds.

## All 14 challenges, grouped

Source: [2026 challenges](https://www.spaceappschallenge.org/2026/challenges/). Each challenge page has Details and Resources tabs; add `?tab=resources` to the URL to open the data list.

| Group | Challenge | Difficulty | Team decision |
|---|---|---|---|
| 1. Earth data | [Be An Earth System Trend Detective!](https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/) | Advanced | shortlist |
| 1. Earth data | [Dancing with the SARs](https://www.spaceappschallenge.org/2026/challenges/dancing-with-the-sars/) | Advanced, Intermediate | shortlist |
| 1. Earth data | [Field Shift: Adapting Farms with NASA Data](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/) | Advanced, Intermediate | shortlist |
| 1. Earth data | [Harmonization of MODIS and VIIRS Hot Spots](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/) | Advanced, Intermediate | dropped |
| 2. Moon, Mars, sky | [Interplanetary Survival Guide: Martian Map](https://www.spaceappschallenge.org/2026/challenges/interplanetary-survival-guide-martian-map/) | Intermediate | shortlist |
| 2. Moon, Mars, sky | [Lunar Landing Site Navigator](https://www.spaceappschallenge.org/2026/challenges/lunar-landing-site-navigator/) | Advanced, Intermediate | dropped |
| 2. Moon, Mars, sky | [Identify Earth Locations that Analog the Permanent Moon Base Locations and Mars](https://www.spaceappschallenge.org/2026/challenges/permanent-moon-base-locations-and-mars/) | Advanced, Intermediate, Beginner | dropped |
| 2. Moon, Mars, sky | [Planet X and SPHEREx](https://www.spaceappschallenge.org/2026/challenges/planet-x-and-spherex/) | Advanced | dropped |
| 3. Crew health and safety | [Create Health Monitoring Software for Astronauts on Space Missions](https://www.spaceappschallenge.org/2026/challenges/health-monitoring-software/) | Intermediate | shortlist |
| 3. Crew health and safety | [Flame in Freefall: SI-Powered Fire Safety Insights](https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/) | Advanced, Intermediate | shortlist |
| 4. Education, games, art | [Build a Junior Astronaut Mission Trainer](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/) | Intermediate, Beginner | dropped (whole group) |
| 4. Education, games, art | [Space Mission Design Game](https://www.spaceappschallenge.org/2026/challenges/space-mission-design-game/) | Intermediate, Beginner | dropped (whole group) |
| 4. Education, games, art | [Abandoned but not Forgotten](https://www.spaceappschallenge.org/2026/challenges/nasas-discarded-equipment-storytelling/) | Intermediate, Beginner | dropped (whole group) |
| 4. Education, games, art | [The Earth Information Jukebox](https://www.spaceappschallenge.org/2026/challenges/the-earth-information-jukebox/) | Intermediate, Beginner | dropped (whole group) |

## Data access checked at 11:40

Real requests from the venue network, not guesses.

| Source | Result |
|---|---|
| [NASA POWER API](https://power.larc.nasa.gov/) | 200, no key. Monthly T2M for Poznań (52.41 N, 16.93 E), 2001–2024, in under 1 s. |
| [ASF search API](https://search.asf.alaska.edu/) for NISAR | 200, no key for search. 226 NISAR granules over Poznań, 28 Oct 2025 – 29 Oct 2026: GCOV 48, GSLC 48, RSLC 48, SME2 (soil moisture) 44, GUNW 38. Downloads need Earthdata login. File sizes not checked. |
| [AppEEARS API](https://appeears.earthdatacloud.nasa.gov/) | 200 on the product list. Requests need Earthdata login. |
| [Giovanni](https://giovanni.gsfc.nasa.gov/) | 200. Plots need Earthdata login. |
| [Mars Trek](https://trek.nasa.gov/mars/) | 200. Tile URLs and CORS not checked. |
| [PSI repository, combustion](https://psi.nasa.gov/physci/repo/search?q=combustion) | Public search page, no login prompt. It is a JavaScript app; the result list was still loading at 11:40. Download rules not checked. |

The built-in WebFetch tool fails on this network ("unable to get local issuer certificate"). curl and the browser work.

## Analysis of the six shortlisted challenges

Scores are a first guess, out of 5. Build = chance of a working demo on real data by T+8 (19:10). Pitch = what a judge sees in 3 minutes. Data = how well the Resources tab supports the challenge.

| Challenge | Build | Pitch | Data | One-line verdict |
|---|---|---|---|---|
| Martian Map | 4 | 5 | 4 | best demo, depends on Mars Trek tiles |
| Field Shift | 4 | 4 | 5 | best local story, richest data list |
| Trend Detective | 5 | 3 | 4 | safest build, needs a differentiator |
| Flame in Freefall | 3 | 3 | 3 | AI is required by the brief; PSI access unknown |
| Health Monitoring | 5 | 4 | 1 | easy to build, no datasets in Resources |
| Dancing with the SARs | 2 | 4 | 4 | new mission, heavy processing |

### Interplanetary Survival Guide: Martian Map

Brief: a map or interface a Mars astronaut could use on a surface walk. Choose a science goal and a place (the example is Curiosity's boxwork at Mount Sharp), layer at least three kinds of data (optical, thermal, spectral, topographic, atmospheric, radiation…), with astronaut safety first.

Resources: [Mars Trek](https://trek.nasa.gov/mars/) (NASA portal with data at landing sites), [USGS–NASA geologic map of Mars](https://astrogeology-usgs.hub.arcgis.com/pages/interactive-maps-mars), [Curiosity's proposed route up Mount Sharp](https://science.nasa.gov/resource/curiositys-proposed-path-up-mount-sharp/), [NASA Worldview](https://worldview.earthdata.nasa.gov/), [Perseverance raw images](https://mars.nasa.gov/mars2020/multimedia/raw-images/) (over 1 million rover images).

Ideas:
- **Marswalk planner.** Click two points on Mount Sharp; the app draws a route that avoids slopes above a limit, shows elevation profile, walking time, sun angle and a "return to rover" point, with geology and thermal layers underneath.
- **Science stop cards.** Along Curiosity's real route, each stop shows a rover raw image, the geologic unit and what to sample there.
- **3D flyover for the pitch.** Cesium terrain from Mars Trek elevation, camera follows the planned route.

Risk: everything rests on Mars Trek tiles loading in a web map. Check first.

### Field Shift: Adapting Farms with NASA Data

Brief: a decision-support tool that uses NASA Earth observations plus soil, crop and farmer priorities to compare crop rotations. At least three strategies, including the current one, each with the reason, the evidence and the trade-offs.

Resources, NASA (all global): [SMAP](https://www.earthdata.nasa.gov/data/platforms/space-based-platforms/smap) soil moisture every 2–3 days, [GPM/IMERG](https://gpm.nasa.gov/data) rainfall, [Landsat](https://earthexplorer.usgs.gov/) and [MODIS](https://lpdaac.usgs.gov/products/)/[VIIRS](https://search.earthdata.nasa.gov/search?q=VIIRS) NDVI, [NASA POWER](https://power.larc.nasa.gov/) agroclimate, [SRTM](https://www.earthdata.nasa.gov/data/instruments/srtm) terrain, [ECOSTRESS](https://ecostress.jpl.nasa.gov/data) heat and evapotranspiration, GLDAS (search in Earthdata), [GEDI](https://gedi.umd.edu/data). Partner resources usable for Poland: [Sentinel-2](https://dataspace.copernicus.eu/), [ERA5](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=overview), [FAO GAEZ](https://gaez.fao.org/) (crop suitability and soil constraints). The USDA sources in the list (Web Soil Survey, SSURGO, CropScape, NASS) cover the US only.

Ideas:
- **Rotation compare for a Wielkopolska field.** Farmer picks a field on the map and the current rotation (for example wheat → rapeseed → wheat). The app shows 20 years of rain, heat and frost from NASA POWER, soil moisture from SMAP, and scores three alternatives (add a legume, a cover crop, a drought-tolerant crop) on water use, soil, erosion and income, with the evidence for each score.
- **Bare-soil and stress calendar.** NDVI and SMAP by month show when the field is bare or stressed under each rotation.
- **AI explanation layer.** Each recommendation gets a short plain-language "why", built only from the numbers on screen.

Risk: the rotation rules are ours. Get a mentor or a farmer to sanity-check them at the 15:00 mentor session.

### Be An Earth System Trend Detective!

Brief: pick Earth science variables, get them for a region, plot a long time series, test whether the trend is significant (t-test, Mann-Kendall, confidence intervals). Plot plus test meets the full scope.

Resources: [Giovanni](https://giovanni.gsfc.nasa.gov/) (many variables, time series, download), [Hydrology Time Series](https://disc.gsfc.nasa.gov/information/tools?title=Hydrology%20Time%20Series), [AppEEARS](https://appeears.earthdatacloud.nasa.gov/) (time series from federal archives), [NOAA CDO](https://www.ncei.noaa.gov/cdo-web/), [SeaWiFS trend paper](https://ntrs.nasa.gov/api/citations/20090042747/downloads/20090042747.pdf) (example of significance testing), [KNMI Climate Explorer](https://climexp.knmi.nl/), [trend tests article](https://medium.com/@snp.kriss/statistical-test-methods-to-detect-trends-in-time-series-data-b361a0ec530b), CSA: [RCM](https://donnees-data.asc-csa.gc.ca/en/dataset/rcm), [SWOT](https://www.asc-csa.gc.ca/eng/satellites/swot/), [SAR tutorial](https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial).

Ideas:
- **Trend map with verdicts.** Draw a box anywhere; the app runs Mann-Kendall and Sen's slope on each grid cell and colours where a variable rises, falls or shows no significant change. This answers the brief's point that one variable can trend up in one region and down in another.
- **"Detective case file".** For one region, test ten variables at once (temperature, rain, soil moisture, NDVI, snow…) and list only the significant ones, in plain language with p-values.
- **Wielkopolska drought case** as the pitch story, reusing the NASA POWER code from Field Shift.

Risk: looks like Giovanni with a new skin unless the map of opposite trends or the case file is the visible feature.

### Flame in Freefall: SI-Powered Fire Safety Insights

Brief: an AI-powered web dashboard that summarizes, ranks and explains combustion experiments for fire safety in spacecraft, stations, lunar and Mars bases and pressurized rovers.

Resources: the [PSI combustion repository](https://psi.nasa.gov/physci/repo/search?q=combustion) is named as "the source of the data upon which the NASA Space App is to be based". Background: [NASA combustion science](https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/), [researcher's guide to ISS combustion science](https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/) (2015, 50+ pages), [ScienceCasts video](https://www.youtube.com/watch?v=W1oXykoz9zg), accident reports [Apollo 1](https://sma.nasa.gov/sma-disciplines/accllp/apollo-1), [Apollo 13](https://sma.nasa.gov/sma-disciplines/accllp/apollo-13), [Mir 1997](https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/), spinoffs ([air tanks](https://spinoff.nasa.gov/node/9582), [fire detector](https://spinoff.nasa.gov/node/9407), [fire attire](https://spinoff.nasa.gov/node/9918)).

Ideas:
- **Habitat fire-risk ranker.** Pick a habitat (ISS module, pressurized rover, lunar base) and a material or scenario; the app ranks PSI experiments by relevance and shows the findings that apply, each linked to its PSI page and DOI.
- **Lessons-learned timeline.** Apollo 1, Apollo 13 and Mir mapped to the PSI experiments that later studied the same failure.
- **Earth spinoff view.** The same findings applied to firefighting on Earth, as the brief suggests.

Risk: we have not yet seen how many experiments PSI lists or whether files download without a login. The PSI site asks users to cite each dataset's DOI.

### Create Health Monitoring Software for Astronauts on Space Missions

Brief: a visual tool where astronauts enter health indicators (text, clicks, camera images) and get an assessment and guidance; a human figure showing problem areas is suggested.

Resources: reading material only, no datasets: [5 hazards of human spaceflight](https://www.nasa.gov/hrp/hazards/), [HRP risks](https://www.nasa.gov/hrp/risks/), [ongoing HRP research](https://www.nasa.gov/hrp/ongoing-hrp-research/), CSA [radiation monitoring](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp) and [why experiments in space](https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp).

Ideas:
- **Body map plus mission timeline.** Daily check-in (sleep, mood, heart rate, bone and vision symptoms); a body figure lights up areas at risk; trends over a simulated 180-day mission; an alert when a value needs the flight surgeon.
- **Hazard-to-indicator mapping.** Each indicator links to the HRP hazard and risk page it comes from, so every threshold has a NASA source.

Risk: weakest "use of NASA data" of the six, and medical claims must stay advisory.

### Dancing with the SARs

Brief: an interactive app that uses NISAR radar data to track and visualize one or more types of surface change (floods, forests, crops, soil moisture, glaciers, subsidence), open source, for a broad audience.

Resources: [Earthdata Search](https://search.earthdata.nasa.gov/search), [ASF Vertex](https://search.asf.alaska.edu/) (NASA's SAR archive), [NISAR data user guide](https://nisar-docs.asf.alaska.edu/), [intro to remote sensing](https://www.earthdata.nasa.gov/learn/earth-observation-data-basics/remote-sensing), [intro to SAR](https://www.earthdata.nasa.gov/learn/earth-observation-data-basics/sar), [ARSET trainings](https://appliedsciences.nasa.gov/get-involved/training), [NISAR StoryMaps](https://nisar.jpl.nasa.gov/applications/arcgis-storymaps/), [NISAR application white papers](https://nisar.jpl.nasa.gov/applications/societal-benefit/), [UAVSAR postcards](https://uavsar.jpl.nasa.gov/education/postcards.html); partners: CSA [RCM](https://donnees-data.asc-csa.gc.ca/en/dataset/rcm), [RADARSAT-1](https://donnees-data.asc-csa.gc.ca/en/dataset/radarsat1) (open archive), [SAR tutorial](https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial), CONAE [SAOCOM](https://catalogos.conae.gov.ar/catalogo/catalogoSatSaocomInfo.html) (registration).

Ideas:
- **Poznań soil-moisture year.** The 44 SME2 granules over Poznań played as a time-lapse with a slider, next to rainfall. Links to the Field Shift story.
- **Flood or wetland pulse.** GCOV backscatter for the Warta valley, water mask per date, area of water over time.
- **Before/after swipe** for one event anywhere in the world.

Risk: HDF5 products, likely gigabytes each, Earthdata login, SAR know-how. Workable only if one person preprocesses one small area into PNG frames or tiles in the first two hours.

## First recommendation (for discussion, not a decision)

- Strongest demo for the effort: Martian Map, if Mars Trek tiles load in a web map.
- Strongest local story: Field Shift, with NASA POWER (works now) plus SMAP or NISAR SME2 soil moisture for Wielkopolska.
- Safe fallback: Trend Detective, which can reuse the NASA POWER code from Field Shift.
- Highest risk: Dancing with the SARs (data size and processing). Health Monitoring is the easiest build but uses the least NASA data.

## Research questions until 12:10 (one per person)

1. **Martian Map:** Mars Trek tile URLs (WMTS) for the base map, elevation and one more layer (thermal or geology). Do they load in Leaflet or Cesium from localhost (CORS)? Save one tile and the capabilities XML in `data/samples/`.
2. **Field Shift:** SMAP (or NISAR SME2) soil moisture and FAO GAEZ suitability for one field near Poznań. Format, size, login, time to first number.
3. **Flame in Freefall:** list PSI combustion investigations: how many, what metadata, do data files download without login, is there an API or export.
4. **Trend Detective and SARs:** one NISAR SME2 or GCOV granule over Poznań: size, download time, time to one PNG. Also: does AppEEARS give a 20-year point time series for Poznań with our Earthdata login?

Proposed idea rejection criteria (agree by 12:10): no demo on real NASA data by T+8; data needs more than 1 h of preprocessing; an existing NASA tool already does the same thing without a clear difference.
