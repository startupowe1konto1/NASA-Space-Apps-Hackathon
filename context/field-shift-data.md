# Field Shift: can a global web app get farm data for any point?

Research question 2 from HANDOFF.md, checked Sat 14 Nov 11:55–12:10 CET. Test points were picked only to cover several climates (Iowa, Paris, Delhi, Brasília); they say nothing about where the project will focus.

**Answer: yes, without a login.** NASA POWER gives 45 years of monthly agroclimate and soil wetness for any point in about 1 s, and the browser can call it directly. FAO GAEZ v4 (listed in the challenge Resources) gives crop suitability for 50 crops for any point in about 4 s per crop, and each global layer is a 3 MB GeoTIFF, so we can also preprocess the crops we need. SMAP, IMERG and Landsat through Earthdata were not tested (login needed); POWER already covers soil wetness and IMERG-based rain.

## NASA POWER (point)

`https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=GWETROOT,GWETTOP,PRECTOTCORR,T2M_MAX,FROST_DAYS,EVPTRNS&community=AG&longitude=-93.6&latitude=42.0&start=1981&end=2025&format=JSON`

- 200 in about 1 s, CORS `*`, 1981-01 to 2025-12 (585 monthly values per parameter incl. annual).
- Useful parameters for rotations: root-zone and surface soil wetness (`GWETROOT`, `GWETTOP`), rain (`PRECTOTCORR`, `IMERG_PRECTOT`), heat (`T2M_MAX`), frost days (`FROST_DAYS`), evapotranspiration (`EVPTRNS`), radiation (`ALLSKY_SFC_SW_DWN`). The point endpoint takes several parameters per call; the regional endpoint takes one.

## FAO GAEZ v4 (crop suitability)

ArcGIS ImageServer `https://gaez-services.fao.org/server/rest/services/res05/ImageServer` (theme 4, suitability and attainable yield). CORS echoes the request origin, so a browser app on our domain works.

Baseline rasters (climate 1981–2010, CRUTS32, rainfed, high input, "all land"): 50 crops, including wheat, maize, soybean, barley, rye, oat, rapeseed, sunflower, sugarbeet, white potato, alfalfa, dry pea, chickpea, phaseolus bean, sorghum, millets, cassava, rice, cotton. Future climate rasters (2011–2100, several models and RCPs) are in the same service, so "how does suitability change" is possible later.

How to read one crop at a point: `getSamples` with `mosaicRule={"mosaicMethod":"esriMosaicLockRaster","lockRasterIds":[<objectid>]}`. One raster per call (when several IDs were locked, only the first came back). Example object IDs: wheat 257880, maize 257854, soybean 257871.

Suitability index (0–10,000) at the test points:

| Point | Wheat | Maize | Soybean |
|---|---|---|---|
| 42.0 N, 93.6 W | 9945 | 9945 | 9945 |
| 28.6 N, 77.2 E | 2887 | 6244 | 6436 |
| 15.8 S, 47.9 W | 4894 | – | – |
| 48.85 N, 2.35 E (city centre) | 0 | – | – |

The 0 in a city centre is expected for "all land" at about 9 km resolution; the app should warn when a clicked point is urban or water.

Downloads: each raster has a public `download_url` on S3, for example `https://s3.eu-west-1.amazonaws.com/data.gaezdev.aws.fao.org/res05/CRUTS32/Hist/8110H/sxHr_whe.tif` (2.97 MB, global, 5 arc-minutes). Ten crops = about 30 MB, small enough to preprocess into tiles or a lookup.

## Limits

- POWER is about 50 km resolution and GAEZ about 9 km. Both describe the area around a field, not the field itself. Landsat or Sentinel-2 NDVI would add field detail but need more work (Sentinel-2 is a partner resource; Landsat needs Earthdata).
- GAEZ is an FAO (partner) resource, not NASA. NASA data still has to carry the story (POWER, plus SMAP or IMERG if we get a login).
- Rotation scoring rules (legume nitrogen, cover-crop erosion benefit, water use) are ours to write. They need a source per rule and a mentor check.

## Samples saved

`data/samples/power/point-monthly-1981-2025-ag.json` (point, six parameters), `data/samples/gaez/res05-imageserver.json` (service description), `data/samples/gaez/res05-suitability-rainfed-high-1981-2010.json` (the 50 baseline suitability rasters with object IDs and download URLs).
