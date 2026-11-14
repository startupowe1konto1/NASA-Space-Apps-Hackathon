# Dancing with the SARs: challenge analysis, plan, risks

Written Sat 14 Nov 2026, 12:10–12:25 CET, as input for the 13:10 decision. Data access details and measurements are in [sar-data.md](sar-data.md) (research question 4); this file covers the rest: the resources, a verdict, a build plan for four people, competition and risks. Where the two files disagree, sar-data.md wins, because it was measured from the venue network.

## Verdict

**Feasible, medium risk. Suggested score 3/4/4 (build/pitch/data), up from 2/4/4.**

- The NISAR GCOV map layer in NASA GIBS needs no login and no preprocessing, covers 29 Oct 2025 to 11 Nov 2026 daily with gaps, and shows flood change at Sylhet by eye (sar-data.md). A web map with a date slider and a before/after swipe can be on screen in 1–2 h.
- Numbers (soil moisture over time, water area in km²) still need the Earthdata login and HDF5 or a Harmony GeoTIFF subset. Plan 1–2 h for that pipeline.
- The main risk is not data, it is the difference from NASA Worldview, which already shows the same layer with a time slider.

## What the challenge asks

An interactive, open source app for a broad audience that uses NISAR radar data to track and visualize one or more types of surface change (floods, forests, crops, soil moisture, glaciers, subsidence) at places around the world.

## The Resources tab, one by one

| Resource | What it gives us | Use it? |
|---|---|---|
| [ASF Vertex](https://search.asf.alaska.edu/) and its search API | Granule lists, sizes, browse PNGs, no key. HDF5 download needs Earthdata login. | Yes, core |
| [Earthdata Search](https://search.earthdata.nasa.gov/search) | Same data through a GUI | Manual browsing only |
| [NISAR data user guide](https://nisar-docs.asf.alaska.edu/) | Product specs; the [Worldview page](https://nisar-docs.asf.alaska.edu/worldview/) names the GIBS layer; the [access page](https://nisar-docs.asf.alaska.edu/access-overview) says GDAL `/vsicurl/` can read a subset of an HDF5 file without downloading all of it | Yes, reference |
| [Intro to remote sensing](https://www.earthdata.nasa.gov/learn/earth-observation-data-basics/remote-sensing), [intro to SAR](https://www.earthdata.nasa.gov/learn/earth-observation-data-basics/sar) | Text for a "how to read radar" panel (dark = smooth water, bright = forest and buildings) | Yes, content |
| [ARSET trainings](https://appliedsciences.nasa.gov/get-involved/training) | The Nov 2026 NISAR course covers displacement (InSAR, OPERA). Slides only, no notebooks listed | Background |
| [NISAR StoryMaps](https://nisar.jpl.nasa.gov/applications/arcgis-storymaps/), [application white papers](https://nisar.jpl.nasa.gov/applications/societal-benefit/) | Ready use cases (floods, farming, forests) and quotes for the pitch | Yes, content |
| [UAVSAR postcards](https://uavsar.jpl.nasa.gov/education/postcards.html) | Good-looking radar images from an older airborne mission | Pitch slide only, not as NISAR data |
| [CSA SAR tutorial](https://github.com/asc-csa/Synthetic_Aperture_Radar_Tutorial) | Beginner notebook: plot an RCM raster with GDAL and cartopy. No change detection | Warm-up for the data person |
| CSA [RCM](https://donnees-data.asc-csa.gc.ca/en/dataset/rcm), [RADARSAT-1](https://donnees-data.asc-csa.gc.ca/en/dataset/radarsat1) | Site blocked our fetch; not checked. Likely account and mostly Canada | Optional |
| CONAE [SAOCOM](https://catalogos.conae.gov.ar/catalogo/catalogoSatSaocomInfo.html) | L-band like NISAR, but registration takes time | No, not in 24 h |

AppEEARS: no sign that it serves NISAR products. Not an alternative.

## Getting the data, and the "6 GB" question

- A year of SME2 at one place is about 44 granules × 132 MB ≈ 6 GB. At the measured 1.67 MB/s that is about an hour, so full downloads are the fallback, not the plan.
- Cheaper routes, best first:
  1. **Harmony bbox subset to GeoTIFF** (works for SME2, GCOV and GUNW; needs login). A small region becomes kilobytes to a few MB per date.
  2. **Remote partial read**: GDAL `/vsicurl/` or `earthaccess` + `fsspec` + xarray, reading only the window we need ([MAAP example](https://docs.maap-project.org/en/hub/science/NISAR/NISAR_access.html)).
  3. **Full download, cut down**: one region, one track instead of four, one pass every two weeks. About 12–25 files, 1.6–3.3 GB, in the background.
- Credentials: free Earthdata login in a local `.netrc` or `.env`, never in the repo.
- Storage: raw `.h5` stays on the data person's laptop in `data/raw/` (gitignored). The repo gets only the processed PNG and JSON (a few MB) and the script that makes them. No Google Drive, no AWS us-west-2 needed.

## Competition and what could make us different

| Existing tool | What it does | Gap we can fill |
|---|---|---|
| [NASA Worldview](https://worldview.earthdata.nasa.gov/) | Same NISAR GIBS layer, time slider, compare mode, animation | No explanation, no numbers, expert UI |
| ASF Vertex, Earthdata Search | Find and download granules | Not for a broad audience |
| Copernicus Browser (Sentinel-1) | Mature SAR viewer with time-lapse | C-band, no NISAR |
| [LANCE Flood Dashboard](https://lance.modaps.eosdis.nasa.gov/flood), OPERA DSWx | Flood and surface water maps | Mostly optical or Sentinel-1 based |
| NISAR StoryMaps | Explained stories | Static, not interactive |
| Space Apps 2021 "What on Earth is SAR", [2022 "InSAR Change Detectives"](https://2022.spaceappschallenge.org/challenges/2022-challenges/insar-change-detectives) | Many SAR education projects | "We explain radar" alone is not new |

Possible differentiators:
- **Same day, two views.** A cloudy MODIS true-colour image (also on GIBS, no login) next to the NISAR radar image that sees through the clouds. One gesture explains why NISAR exists.
- **Numbers, not only pictures.** Water share or soil moisture over time next to rainfall from NASA POWER. Worldview does not do this.
- **The first year of a new mission, told for non-experts.** Each story answers "what am I looking at and why does it matter".

## Example build: "Radar Pulse" (working name)

A world map with 4–5 change stories seen through the clouds:
- Each story: GIBS NISAR layer, date slider, before/after swipe, optical vs radar on the same day, two sentences of explanation. Change types: flood (Sylhet is already checked), crops, forest. Subsidence is a stretch goal only.
- Soil moisture: for 1–2 regions, preprocessed SME2 as PNG overlays plus a time-series chart with NASA POWER rain.
- Every screen has loading, offline, no data and source error states. A date with no pass returns a transparent PNG, which must show "no pass on this date", not an empty map.

### Roles

- **O1, integration and front end:** Vite + Leaflet, GIBS layer with retry, slider, swipe, deploy, PR review.
- **O2, data:** Earthdata login, Harmony subset (or `asf_search`/`earthaccess` download) for SME2 → PNG + JSON series; sample in `data/samples/`.
- **O3, science and content:** pick places and dates with real events between Oct 2025 and Nov 2026, check them in GIBS, write "what you see" texts, questions for the 15:00 mentor. Stretch: water area from a GCOV subset in dB.
- **O4, UX and pitch:** chart (soil moisture + rain), visual design, slides, demo recording, submission text, AI usage log.

### Timeline

| When (CET) | Milestone |
|---|---|
| Sat 13:10–14:00 | Earthdata login. O1: GIBS layer in Leaflet for 3 places. O2: first SME2 PNG via Harmony. **14:00 go/no-go.** |
| 15:00 | Mentor checks the radar interpretation and the story list |
| 16:00 | End to end: GIBS map + one SME2 overlay |
| 19:10 (T+8) | Demo on real data: 3 stories, slider, swipe, one soil moisture chart |
| 19:10–24:00 | All stories, rain on the chart, "how to read radar" panel, error states, public URL |
| Night | Sleep in shifts; stretch: water area from GCOV |
| Sun 07:00–09:00 | Fixes, README, slides, 30 s demo video. **09:00 feature freeze** |
| Sun 10:10 | Repo freeze and submission (buffer to 11:59). 10:30 pitch coaching, 13:30 slides to the desk, 14:30 pitch |

### Deliverables

- Live URL with the map and stories.
- Repo: front end, the pipeline script with a README ("process your own region"), open source licence.
- 3-minute pitch: 0–30 s a flood seen through clouds; 30–90 s slider and swipe live; 90–150 s soil moisture against rain; the rest on who benefits and the limits (provisional data).
- `docs/ai-usage/O*.md`.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Looks like "Worldview with a new skin" | Lead the pitch with optical-vs-radar and the chart, not the bare map |
| GIBS colours are not calibrated values; dark-pixel water share is a rough proxy | Label it as a proxy; for real numbers use GCOV dB through Harmony |
| SME2 is provisional, not validated | Say so on screen and in the pitch |
| Team is new to SAR and may misread images | Mentor at 15:00; texts taken from NISAR docs and ARSET |
| Harmony or partial reads fail | Full downloads, one track, every second pass |
| Slow venue Wi-Fi (0.4–1.7 MB/s measured) | Downloads in the background; the front end runs on GIBS with no login |
| Subsidence needs stacks of 2.5 GB GUNW files and a time-series inversion | Out of scope; stretch only |
| GIBS tile returns 500 now and then | Retry in the tile layer |
