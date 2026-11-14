# Five shortlisted challenges compared: data quality, data usefulness, existing tools

Written Sat 14 Nov 12:20–12:45 CET. Updated after merging O1's research (`context/sar-data.md`, `context/flame-psi-data.md`, `context/field-shift-data.md`): NISAR GCOV is on NASA GIBS without a login, NISAR file sizes are known, and PSI has 2,009 non-empty table rows for the 13:10 idea decision. Data facts come from our own requests (see the `context/` file per challenge). Existing-tool facts come from web searches made today; where a source is old or a feature was not confirmed, the cell says so.

## Scores at a glance

1 = poor, 5 = strong. Definitions under the table.

| | Martian Map | Flame in Freefall | Trend Detective | Field Shift | Dancing with the SARs |
|---|---|---|---|---|---|
| Data quality | 5 | 4 | 3 | 3 | 3 via GIBS / 5 raw HDF5 |
| Data usefulness for the brief | 4 | 5 | 4 | 3 | 3 now / 4 with login |
| Data access (login, CORS, speed) | 5 | 4 | 5 | 5 | 4 |
| Gap left by existing tools | 3 | 5 | 2 | 4 | 4 |
| Build by T+8 (19:10) | 4 | 4 | 5 | 4 | 4 |
| First 30 s of the pitch | 5 | 4 | 3 | 4 | 4 |
| **Total (of 30)** | **26** | **26** | **22** | **23** | **22** |

- **Data quality:** resolution, length of record, provenance (measured vs. modelled), calibration, cleanliness.
- **Data usefulness:** how directly the data answers what the brief asks, without data we would have to invent.
- **Data access:** tested today. 5 = no login, browser can call it, answers in seconds.
- **Gap left by existing tools:** 5 = we found no public tool doing this; 1 = a NASA tool already does it.
- **Build by T+8:** chance of a working demo on real data by 19:10.
- **First 30 s:** what a judge sees before reading anything.

Martian Map and Flame in Freefall tie on 26 for different reasons: Martian Map wins on data and demo, Flame in Freefall wins on the gap and on fit with the brief.

## Data quality and usefulness, per challenge

| Challenge | Main data (tested) | Quality: what is good | Quality: what is weak | Usefulness for the brief |
|---|---|---|---|---|
| Martian Map | Mars Trek: HiRISE mosaic (about 0.6 m/px at max zoom), 1 m HiRISE DEM of Gale (float32 metres), CTX, THEMIS day/night IR (100 m), TES thermal inertia and dust, USGS global geologic map, Curiosity route (19,188 points) and 14 stops | Science-grade orbital products, the same ones mission teams use; DEM gives real slopes | 1 m DEM and HiRISE cover only Gale (0.6° × 0.7°); route data ends around 2018; no radiation layer in Trek | Covers optical, topographic, thermal and geologic layers, so "at least three kinds of data" is met. Radiation (named in the brief) is missing. |
| Flame in Freefall | PSI: 24 combustion investigations with full text metadata; 22 CSV tables from 20 of them, 2,009 non-empty rows (FLEX 274, ACME CFI-G 333, SPICE 469, BASS/BASS-II 251, SAFFIRE 21) | Real ISS and Cygnus flight data; CC0; a DOI per investigation; 51 publications listed for FLEX alone | Every table has its own columns, units in headers, typos and BOMs; most tables have 2–30 rows; raw imagery (860 GB for FLEX) is out of reach | PSI is the source the brief names. The fields (O2 fraction, pressure, flow, material, burn time, extinction) map straight onto "fire safety for crew habitats". |
| Trend Detective | NASA POWER: monthly 1981–2025, about 0.5° × 0.625° grid, 1,388 parameters incl. soil wetness, rain, temperature | 45-year consistent record, global, no gaps | Reanalysis/model output (MERRA-2 based), coarse; satellite-native variables (MODIS NDVI etc.) need Giovanni/AppEEARS and a login | Lets us do exactly what the brief asks (series + significance) for any region. POWER is NASA data, but not on this challenge's Resources list. |
| Field Shift | NASA POWER point data (above); FAO GAEZ v4 suitability for 50 crops, 1981–2010 baseline plus future scenarios, 5 arc-minutes (about 9 km) | Global, consistent, crop-specific suitability from a recognised FAO model | Neither describes a single field; suitability is modelled; no soil map tested; rotation effects (nitrogen, erosion, pests) are not in any of this data | Covers climate and crop fit. The core of the brief (compare rotations, explain trade-offs) still needs agronomy rules we would write. |
| Dancing with the SARs | NISAR via ASF: about one year of GCOV, GSLC, RSLC, SME2, GUNW over any land point; geocoded browse PNGs | L-band radar, new mission, products from Beta to Validated | Without a login and HDF5 processing we only have browse PNGs: colour composites, no calibrated values; file sizes unknown | Browse images show change but cannot measure it. Measured change (water area, soil moisture, deformation) needs the HDF5 path. |

## Existing tools and the gap we would fill

| Challenge | Existing tools found | What they do not do | Our angle |
|---|---|---|---|
| Martian Map | **Mars Trek** itself lists distance measurement, elevation plots, and lighting and slope analysis ([Trek "About"](https://trek.nasa.gov/mars/jpl/config/textAbout.html)); NASA's education guide has students draw rover routes and get an elevation profile in Trek ([JPL Edu](https://www.jpl.nasa.gov/edu/learn/project/map-a-mars-rover-driving-route)). Traverse planning was announced for Trek in 2017 ([IAC 2017](https://iafastro.directory/iac/archive/browse/IAC-17/A3/IP/39299/)); we did not confirm it is live. NASA's SEXTANT traverse planner exists for planetary surfaces (not checked for Mars). Esri has written on least-cost paths on Mars ([ArcUser](https://www.esri.com/about/newsroom/arcuser/finding-the-best-paths-for-rovers-and-humans-on-mars)). | Trek is a general expert portal: tools are separate and there is no astronaut-walk view that combines slope limits, ground type, turn-back point and science stops in one plan. | A focused **Marswalk planner** for one site, written for the astronaut, not the GIS user. The gap is the packaging and safety logic, not the data. Judges will know Trek, so the demo must show what Trek does not. |
| Flame in Freefall | **PSI search** (keyword search, one page per investigation); **MAPTIS**, NASA's database of material flammability tests under NASA-STD-6001 ([NTRS](https://ntrs.nasa.gov/citations/20040084025), [SAE 2003](https://saemobilus.sae.org/papers/obtaining-nasa-approval-use-non-metallic-materials-manned-space-flight-2003-01-2907)); we found no current public interface for it. The 2015 researcher's guide to ISS combustion is a PDF. | No public tool compares PSI combustion results across investigations, filters them by habitat atmosphere, or explains them for fire safety. MAPTIS covers material approval tests, not microgravity flame physics, and its access is unclear. | **First cross-investigation view of PSI combustion data**, filtered by habitat conditions, with AI summaries that cite DOIs. Largest gap of the five. |
| Trend Detective | **Giovanni**: area-averaged time series, area statistics, Hovmöller plots ([User Guide 2024.1](https://giovanni.gsfc.nasa.gov/giovanni/doc/UsersManualworkingdocument.docx.html), [Eos 2018](https://eos.org/project-updates/giovanni-the-bridge-between-data-and-science)); no dedicated trend test found. **Google Earth Engine** has a per-pixel Mann-Kendall + Sen's slope tutorial, code required ([GEE tutorial](https://developers.google.com/earth-engine/tutorials/community/nonparametric-trends)). **KNMI Climate Explorer** (in the Resources) analyses gridded climate data for researchers. Climate Engine was not confirmed in our searches. | The pieces exist, but for coders or specialists. Giovanni averages a region into one line, which hides opposite trends inside it, the exact point the brief makes. | **No-code per-cell significance map** with a plain-language verdict and a multiple-testing option. Smallest gap: judges may see it as "Giovanni plus a test". |
| Field Shift | **FAO GAEZ portal** (suitability maps, no rotation logic); **Crop-CASMA**, a NASA/USDA/GMU web tool for SMAP soil moisture on US cropland ([JPL](https://www.jpl.nasa.gov/news/nasa-data-powers-new-usda-soil-moisture-portal/), [NTRS](https://ntrs.nasa.gov/citations/20230005742)); regional **cover crop selectors** for the US Northeast, Midwest and West ([Northeast tool](https://northeast.sare.org/resources/northeast-cover-crop-decision-support-tool), [NC State list](https://covercrops.ces.ncsu.edu/decision-support-tools/)); the German research system "Fruchtfolge" for rotation optimisation ([AgEcon](https://ageconsearch.umn.edu/record/305287?ln=en)), hosting status unknown. | Existing tools are US-only or single-purpose (soil moisture, cover crop species). We found no free global tool that compares whole rotations against long-term NASA climate data. | **Global rotation comparison** with the evidence behind each score. A real gap, but credibility depends on rules we write in a day. |
| Dancing with the SARs | **ASF Vertex** (search, download, browse images); **NISAR StoryMaps** (in the Resources); ASF change-detection StoryMaps and interactive maps built on Sentinel-1 ([ASF tutorial](https://asf.alaska.edu/?p=23957)); **OPERA DSWx** water extent in NASA Worldview; NISAR on-demand processing in HyP3 is "planned" ([NISAR docs, tools overview](https://nisar-docs.asf.alaska.edu/tools-services-overview)). | We found no NISAR-specific change viewer for the public. Existing change maps use Sentinel-1 (C-band). | **First public NISAR change viewer**. A real gap, but without HDF5 processing it would be a browse-image slideshow. |

## What the table says

- If the team wants the safest strong result: **Martian Map**. Best data and demo; the risk is that judges know Mars Trek, so the pitch must name what Trek does not do.
- If the team wants the biggest gap and the best fit with "AI": **Flame in Freefall**. The data is real, small and open; the work is the schema mapping and keeping AI claims traceable.
- **Trend Detective** is the fastest build but the smallest gap. **Field Shift** has a real gap but rests on rules we invent. **Dancing with the SARs** moved up after O1 found NISAR GCOV as a NASA GIBS map layer (no login): a change viewer on real backscatter imagery is buildable. Measured values (water area, soil moisture) still need the 1.3–2.1 GB GCOV or 63–136 MB SME2 files and a login.

## Not checked

Past Space Apps winners for these challenge themes; whether Mars Trek's traverse planning or SEXTANT for Mars are live; Climate Engine's trend features; MAPTIS public access today.
