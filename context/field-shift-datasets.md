# Field Shift: datasets we plan to use

Written Sat 14 Nov 13:40 CET, after the team chose Field Shift with demo fields in the USA and in Poland. This is our list; a second list from the team will be compared against it later.

Status: ✅ tested live today, ◐ partly tested, ○ not tested yet. "Test" means we fetched real values, not that we read the docs.

Rule for the build: every number that decides a recommendation (drought, heat, frost, soil moisture, crop stress, bare-soil periods, soil-health effect) comes from NASA data (rows 1–11). The other rows give context (soil, crop history, crop traits) or money (prices, payments). That keeps NASA data the core of the solution, which is what the "Relevance" judging criterion scores.

## Core: NASA

| # | Dataset | What we use it for | Coverage | Access | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | [NASA POWER](https://power.larc.nasa.gov/) | 45 years (1981–2025) of temperature, heat, frost days, rain, root-zone and surface soil wetness, evapotranspiration, radiation | global, about 50 km | no login, CORS `*`, about 1 s per point | ✅ | [trend-detective.md](trend-detective.md), [field-shift-power-gaez.md](field-shift-power-gaez.md) |
| 2 | SMAP L4 soil moisture via [NASA GIBS](https://nasa-gibs.github.io/gibs-api-docs/) | soil moisture since 2015, drought years, anomalies | global, 9 km | GIBS WMS + colormap, no login | ✅ (O1) | [field-shift-data.md](field-shift-data.md) |
| 3 | [GPM IMERG](https://gpm.nasa.gov/data) | satellite rain since 2000, heavy-rain events, erosion risk | global (complete 60 N–60 S), about 10 km | via POWER (`IMERG_PRECTOT`, no login) or Giovanni (login) | ◐ | Giovanni login done 13:05 |
| 4 | MODIS NDVI/EVI (MOD13) | crop vigour, bare-soil periods, stress seasons since 2000 | global, 250 m | GIBS (no login) or AppEEARS (login) | ○ | |
| 5 | Landsat / HLS | field-level NDVI | global, 30 m | Earthdata login | ◐ (O1: STAC search works) | |
| 6 | VIIRS vegetation indices | continuity after MODIS | global | GIBS / Earthdata | ○ | |
| 7 | [ECOSTRESS](https://ecostress.jpl.nasa.gov/data) | land surface temperature and evapotranspiration, water-stress hotspots | ISS orbit, about ±52°: Iowa yes, Poland only partly | Earthdata login | ○ | |
| 8 | GRACE / GRACE-FO | long-term water storage decline | global, about 300 km | Earthdata login | ○ | context only, too coarse for a field |
| 9 | SRTM / NASADEM | slope, so erosion risk per field | 60 N–56 S, 30 m | Earthdata login (or OpenTopography) | ○ | |
| 10 | NISAR SME2 | 200 m soil moisture since Oct 2025, new mission | global | Earthdata login, 63–136 MB per granule | ◐ (O1: sizes) | nice-to-have, strong pitch line |
| 11 | GLDAS via [Giovanni](https://giovanni.gsfc.nasa.gov/) | modelled soil moisture back to 1948 | global | Giovanni, logged in | ○ | |

## Space Agency Partners

| # | Dataset | What we use it for | Status |
|---|---|---|---|
| 12 | [ESA Sentinel-2](https://dataspace.copernicus.eu/) | 10 m NDVI per field (listed in the challenge Resources) | ◐ (O1: STAC search works) |
| 13 | [ESA WorldCereal](https://esa-worldcereal.org/) | 10 m crop type maps (maize, winter and spring cereals, 2021), to guess last crops in Poland | ○ |
| 14 | ESA CCI Soil Moisture | 45-year satellite soil moisture, cross-check for NASA trends | ○ |
| 15 | ERA5 / ERA5-Land (ECMWF, Copernicus) | reanalysis weather (listed in the Resources) | ○ |

## Context: soil, crop history, crop traits

| # | Dataset | What we use it for | Where | Status |
|---|---|---|---|---|
| 16 | [FAO GAEZ v4](https://gaez.fao.org/) | suitability and attainable yield for 50 crops, past and future climate | global | ✅ |
| 17 | [USDA CropScape (CDL)](https://nassgeodata.gmu.edu/CropScape/) | crop history per field without asking the farmer (tested: Iowa corn–soy 2019–2025) | USA | ✅, no CORS: needs a small server or prefetch |
| 18 | [USDA SSURGO (Soil Data Access)](https://sdmdataaccess.sc.egov.usda.gov/) | field soil: texture, organic matter, drainage, water-holding capacity | USA | ✅, CORS `*` |
| 19 | [SoilGrids (ISRIC)](https://soilgrids.org/) | soil texture, pH, organic carbon | global, used for Poland | ✅ (O1, 3–15 s) |
| 20 | LUCAS topsoil (JRC ESDAC) | measured topsoil organic carbon and nutrients | EU | ○, may need registration |
| 21 | [EuroCrops v2 (JRC)](https://essd.copernicus.org/articles/18/4075/2026/essd-18-4075-2026-discussion.html) | crop declarations from CAP applications, several years | 16 EU countries; Poland not confirmed | ○ |
| 22 | FAO crop water needs (FAO-56 crop coefficients) | water use per crop and growth stage | global | ○ |
| 23 | FAO EcoCrop | crop requirements (temperature, rain, soil) | global | ○ |
| 24 | Polish soil maps (e.g. IUNG agricultural soil map) | field-level soil in Poland | Poland | ○, openness unknown |

## Money layer (an add-on, not the core)

| # | Dataset | What we use it for | Where | Status |
|---|---|---|---|---|
| 25 | ARiMR / Poland's CAP Strategic Plan | eco-scheme rules and rates (catch crops, crop diversity, legumes), GAEC 7 rotation rule | Poland | ○; 2026 rates not confirmed |
| 26 | NRCS EQIP/CSP payment schedules (state PDFs) | rates for practice 340 (cover crop) and 328 (conservation crop rotation) | USA, Iowa | ○ |
| 27 | USDA NASS QuickStats | county yields, for revenue estimates | USA | ○, free API key |
| 28 | USDA AMS Market News | crop prices | USA | ○ |
| 29 | USDA ERS fertilizer prices | input costs | USA | ○ |
| 30 | GUS crop and input prices | crop prices and fertilizer costs | Poland | ○ |
| 31 | Eurostat agricultural prices and NUTS 2 yields | prices and regional yields | EU | ○ |
| 32 | World Bank commodity prices ("Pink Sheet") | monthly fertilizer prices (urea, DAP) | global | ○ |

## Next step

Compare this list with the team's separate list: mark overlaps, datasets only on their list, and datasets only on ours, then decide what to drop. Test the ○ rows the plan depends on before the build starts (first: MODIS NDVI via GIBS, NRCS Iowa rates, ARiMR 2026 rates).
