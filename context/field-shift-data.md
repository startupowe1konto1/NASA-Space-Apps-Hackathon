# Field Shift: soil moisture and crop suitability for one field near Poznań

Research question 2 from HANDOFF.md. Checked Sat 14 Nov 2026, 11:46–11:52 CET, with live requests from a cloud container (no Earthdata login).

Test field: 52.45 N, 17.10 E, picked only because a sample was at hand (handoff v1: the project is global, no region assumed). SoilGrids returns values here, so it is not masked as built-up. SoilGrids says the topsoil is about 72–76% sand, 7–11% clay, pH 5.7–6.7: loamy sand that holds little water.

## Answer in short

| Source | Login | Format and size | Time to first number | Use for us |
|---|---|---|---|---|
| SMAP L4 root-zone soil moisture via GIBS WMS + colormap | none | PNG, 11×11 px per request, colormap XML with 255 bins of about 0.003 m³/m³ | **0.5 s** | best route: daily values from 2015 to now, works in the browser |
| SMAP L3 enhanced (SPL3SMP_E, 9 km, daily) | Earthdata (302 to URS) | HDF5, **570–620 MB per global day** | minutes after login | not worth it; also on GIBS without login |
| SMAP L4 (SPL4SMGP, 9 km, 3-hourly) | Earthdata | HDF5, **about 143 MB per file**, 33,961 files | minutes after login | same data as the GIBS layer; OPeNDAP subsetting needs login |
| SMAP/Sentinel-1 (SPL2SMAP_S, 3 km) | Earthdata | HDF5, **3.6–4.7 MB per scene** | after login | small files, but the newest scene over the field is from 28 Jun 2026 |
| NISAR SME2 (200 m soil moisture) | Earthdata (302 to URS) | HDF5, **about 126 MB per granule**, no browse image | after login + HDF5 reading | 44 granules over the field, 28 Oct 2025 – 16 Oct 2026 (about every 8 days); provisional product |
| FAO GAEZ v4 via public ArcGIS ImageServer (`res05`) | none | JSON from `query` and `identify`; rasters 5 arc-min (about 9 km) | **under 1 s** per value, 34 s for 60 rasters | suitability class and attainable yield per crop, past (1981–2010) and future (2041–2070, 2071–2100, RCP4.5/8.5) |

## Numbers for the field

### SMAP L4 root-zone soil moisture, summer (Jun–Aug) mean, sampled every 6 days

| Year | Mean m³/m³ | Min |
|---|---|---|
| 2015 | 0.105 | 0.086 |
| 2016 | 0.126 | 0.115 |
| 2017 | 0.149 | 0.134 |
| 2018 | 0.119 | 0.095 |
| 2019 | 0.103 | 0.086 |
| 2020 | 0.112 | 0.098 |
| 2021 | 0.119 | 0.101 |
| 2022 | 0.108 | 0.092 |
| 2023 | 0.109 | 0.092 |
| 2024 | 0.121 | 0.095 |
| 2025 | 0.098 | 0.084 |
| **2026** | **0.083** | **0.073** |

2026 is the driest summer in the SMAP record for this field (12 summers). On 10 Nov 2026 the Poznań area is one of the driest patches in Europe on the SMAP L4 map (`data/samples/field-shift/smap_rz_europe_2026-11-10.png`).

Caveat: absolute SMAP L4 values depend on the model's soil properties, so sandy Wielkopolska always looks drier than loamy regions. For comparisons between places, use anomalies or percentiles per pixel, not raw m³/m³. Values read from the GIBS colormap are bin centres (±0.0015 m³/m³).

### FAO GAEZ v4, rain-fed, high input, current cropland at the field

Suitability class: 1 = very high … 3 = good, 4 = medium, 5 = moderate … (GAEZ v4 classes). Future = ENSEMBLE of GCMs, with CO2 fertilization.

| Crop | 1981–2010 class / yield (kg DW/ha) | 2041–2070 RCP4.5 | 2041–2070 RCP8.5 | 2071–2100 RCP8.5 |
|---|---|---|---|---|
| Wheat | 3 / 4,260 | 4 / 5,178 | 4 / 5,369 | 3 / 5,286 |
| Rapeseed | 3 / 2,450 | 2 / 2,393 | 3 / 2,590 | 3 / 2,517 |
| Soybean | 5 / 1,750 | 4 / 2,888 | 4 / 2,793 | 4 / 2,954 |
| Sunflower | 3 / 2,432 | 3 / 2,822 | 3 / 2,658 | 3 / 2,670 |
| Maize | 4 / 3,764 | not returned by the query | | |
| Rye | 3 / 3,394 | not returned | | |
| Sorghum | 3 / 3,884 | not returned | | |

Two story lines come out of this. Soybean, a legume, moves from moderate to medium suitability and its attainable yield rises by 60–70%, so a legume rotation gets stronger with time. For wheat, attainable yield rises (CO2 fertilization) while the suitability class for all land in the cell drops one class at mid-century. The tool should show both numbers and explain why they differ, not pick one.

## Clicked point in under 10 s? Yes, about 1–2 s (handoff v1 question)

Tested at 12:00 on two points outside Poland, all requests in parallel from Python (same calls a browser would make):

| Point | 12 SMAP dates (GIBS) + 18 GAEZ values (identify) | Sample values |
|---|---|---|
| Iowa, 42.0 N 93.6 W | **2.1 s** | SMAP root zone 0.29–0.36 m³/m³; GAEZ maize 10,950 kg/ha (1981–2010) |
| Kenya, 0.5 S 36.0 E | **1.2 s** | SMAP 0.29–0.37 m³/m³; GAEZ maize 6,698 kg/ha, rye 0 (not suitable) |

Conditions: look up the GAEZ raster IDs once (one `query`, 1.4 s, cacheable as a static JSON), then call `identify` with `mosaicRule` = lock raster. Without the lock, one `identify` over the whole mosaic took 6.7 s.

## Access to every Field Shift resource from the handoff (12:00)

CORS = the `Access-Control-Allow-Origin` header for an `Origin: http://localhost:5171` request, so whether a browser can call it directly.

| Resource | HTTP, time | CORS | Login | Notes |
|---|---|---|---|---|
| SMAP via GIBS WMS + colormap | 200, 0.2–0.6 s | `*` | no | the route we use |
| SMAP files (NSIDC) | 302 to Earthdata login | – | yes | 143–620 MB per file |
| FAO GAEZ ImageServer (`identify`, `query`) | 200, 0.5–1.4 s | echoes origin | no | browser can call it |
| FAO GAEZ GeoTIFFs on S3 | 200, 1 s | none | no | needs a server-side step, not callable from the browser |
| NASA POWER daily point | 200, 0.7 s | `*` | no | global |
| GPM/IMERG (CMR search) | 200, 0.2 s | `*` | search no, data yes | |
| MODIS/VIIRS/Landsat via CMR-STAC LPCLOUD | 200, 1.5 s | `*` | search no, data yes | |
| Sentinel-2, Copernicus STAC | 200, 0.9 s | `*` | no for STAC | |
| SoilGrids | 200, 3–15 s | `*` | no | too slow for a click; precompute or show "loading" |
| SRTM, ECOSTRESS, GEDI, EarthExplorer, ERA5 pages | 200/301 | – | data needs Earthdata or CDS login | info pages only checked |
| Earthdata login (urs.earthdata.nasa.gov) | timeout from the cloud container | – | – | check from the venue network |

## What this means for the build

1. Soil moisture without login: read the GIBS SMAP L4 layer pixel and map the colour to a value with the GIBS colormap. It is fast enough to run in the browser (about 0.5 s per date) or to precompute a JSON series per demo field.
2. GAEZ crop suitability without login: the ArcGIS ImageServer `query` + `identify` calls. Precompute per demo field; the service is slow for many rasters at once (about 0.5 s per raster).
3. NISAR SME2 is the "new mission" extra (200 m instead of 9 km), but it needs an Earthdata login, HDF5 reading and 126 MB per granule. Only worth it if one person preprocesses 5–10 granules for the demo fields into PNG or JSON in the first hours.
4. Soil texture from SoilGrids (no login, 3–11 s per request, fair-use limit): precompute.

## How to reproduce

- `context/scripts/gibs_point.py <colormap.xml> <layer> <lat> <lon> <date>...` reads SMAP from GIBS.
- `context/scripts/gaez_point.py <lat> <lon>` reads GAEZ suitability and yield.
- Samples: `data/samples/field-shift/` (GIBS image and colormap, CMR and ASF search results, GAEZ output, SMAP summer series, SoilGrids, NASA POWER daily).

## Sources

- SMAP L4 layer and colormap: https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/1.0.0/WMTSCapabilities.xml, https://gibs.earthdata.nasa.gov/colormaps/v1.3/SMAP_Analyzed_Soil_Moisture.xml
- SMAP collections: https://cmr.earthdata.nasa.gov/search/ (SPL3SMP_E, SPL4SMGP, SPL2SMAP_S)
- NISAR SME2: https://nisar-docs.asf.alaska.edu/sme2/ and the ASF search API https://api.daac.asf.alaska.edu/services/search/param
- FAO GAEZ v4 services: https://gaez-services.fao.org/server/rest/services/res05/ImageServer
- SoilGrids: https://rest.isric.org/soilgrids/v2.0/
