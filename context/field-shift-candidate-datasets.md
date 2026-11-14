# Field Shift: candidate datasets

Datasets that could be used for "Field Shift: Adapting Farms with NASA Data". This is a neutral list, to be compared with the team's research (`context/field-shift-data.md`, `context/field-shift-power-gaez.md` and the dataset list in PR #16); it makes no choice between them.

"Checked" in the Access column means we made a live request on 14 Nov 2026 (see `context/field-shift-data.md`). "Not checked" means the access details come from the provider's documentation and were not tested by us.

## Weather and climate

| Dataset | What it gives | Resolution and period | Access |
|---|---|---|---|
| [NASA POWER](https://power.larc.nasa.gov/) | Daily and monthly temperature, precipitation, humidity, wind, solar radiation, root-zone soil wetness (GWETROOT) for any point | Meteorology about 0.5° × 0.625°, solar 1°; daily from 1981 | API, no key, browser-callable (CORS `*`). Checked. |
| [GPM IMERG](https://gpm.nasa.gov/data) | Precipitation | 0.1°; half-hourly, daily, monthly; from 2000 | Search without login; data files need Earthdata login. Checked. |
| [MERRA-2](https://gmao.gsfc.nasa.gov/reanalysis/MERRA-2/) | NASA atmospheric reanalysis (the source of most POWER meteorology) | 0.5° × 0.625°; hourly to monthly; from 1980 | Earthdata login. Not checked. |
| [ERA5 / ERA5-Land](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=overview) | ECMWF reanalysis: temperature, precipitation, soil moisture, evaporation | ERA5 0.25° from 1940; ERA5-Land 0.1° from 1950; hourly | Copernicus CDS account. Page checked, data not. |
| [Open-Meteo](https://open-meteo.com/) | Weather forecast and historical weather API built on reanalysis and forecast models (not a NASA source) | Varies by model; historical from 1940 | API, no key for non-commercial use. Not checked. |

## Soil moisture and water

| Dataset | What it gives | Resolution and period | Access |
|---|---|---|---|
| [SMAP L4 via NASA GIBS](https://gibs.earthdata.nasa.gov/) | Root-zone and surface soil moisture as map tiles; values read through the GIBS colormap | 9 km; daily from 2015 | WMS/WMTS, no login, CORS `*`, about 0.5 s per date. Checked. |
| [SMAP L3 / L4 files](https://www.earthdata.nasa.gov/data/platforms/space-based-platforms/smap) (SPL3SMP_E, SPL4SMGP, SPL2SMAP_S) | Soil moisture products as HDF5 files | 9 km daily (L3E), 9 km 3-hourly (L4), 3 km (SMAP/Sentinel-1); from 2015 | Earthdata login; 4 MB to 620 MB per file. Checked. |
| [NISAR SME2](https://nisar-docs.asf.alaska.edu/sme2/) | Radar-based soil moisture | 200 m; about every 8–12 days; from late Oct 2025 (provisional) | Earthdata login, HDF5, about 126 MB per granule. Checked. |
| [GRACE / GRACE-FO](https://grace.jpl.nasa.gov/data/get-data/) | Changes in total water storage, including groundwater | Monthly; about 300 km effective (gridded at 0.5°); from 2002 | Earthdata login. Not checked. |
| [GLDAS](https://ldas.gsfc.nasa.gov/gldas) | Land-surface model output: soil moisture by layer, evapotranspiration, runoff | 0.25° and 1°; 3-hourly and monthly; from 1948 (v2.0) and 2000 (v2.1) | Earthdata login. Not checked. |
| [ECOSTRESS](https://ecostress.jpl.nasa.gov/data) | Land surface temperature, evapotranspiration, evaporative stress | About 70 m; irregular revisit from the ISS; from 2018 | Earthdata login. Page checked, data not. |
| [MODIS MOD16](https://lpdaac.usgs.gov/products/mod16a2gfv061/) | Evapotranspiration | 500 m; 8-day; from 2000 | Earthdata login. Not checked. |

## Vegetation and crop condition

| Dataset | What it gives | Resolution and period | Access |
|---|---|---|---|
| [MODIS MOD13Q1 / MYD13Q1](https://lpdaac.usgs.gov/products/mod13q1v061/) | NDVI and EVI vegetation indices | 250 m; 16-day; from 2000 | Search without login (CMR-STAC); data needs Earthdata login. Checked. Imagery also on GIBS without login. |
| [VIIRS VNP13](https://lpdaac.usgs.gov/products/vnp13a1v002/) | NDVI and EVI, continuation of MODIS | 500 m; 16-day; from 2012 | Earthdata login. Search checked. |
| [Landsat 8/9](https://earthexplorer.usgs.gov/) and [HLS](https://www.earthdata.nasa.gov/data/projects/hls) | Surface reflectance for NDVI and field-level detail; HLS merges Landsat and Sentinel-2 | 30 m; 16 days per satellite (HLS about 2–3 days); Landsat archive from 1980s | USGS or Earthdata login. Search checked. |
| [Sentinel-2](https://dataspace.copernicus.eu/) | Multispectral imagery for NDVI and field-level detail | 10–20 m; about 5 days; from 2015 | STAC search without login; downloads need a Copernicus account. Checked. |
| [GEDI](https://gedi.umd.edu/data) | Lidar canopy height and structure | 25 m footprints; only between 51.6° N and 51.6° S; 2019–2023 and later | Earthdata login. Page checked, data not. |
| NDVI / EVI in general | Derived indices, not a separate source: computed from MODIS, VIIRS, Landsat or Sentinel-2 | Depends on the source | See the source rows. |

## Soil and terrain

| Dataset | What it gives | Resolution and period | Access |
|---|---|---|---|
| [SoilGrids (ISRIC)](https://rest.isric.org/soilgrids/v2.0/docs) | Soil texture (sand, silt, clay), pH, organic carbon, bulk density at six depths | 250 m; global; static | REST API, no login, CORS `*`; 3–15 s per request, fair-use limit. Checked. |
| [SRTM](https://www.earthdata.nasa.gov/data/instruments/srtm) | Elevation, slope | 30 m; 60° N to 56° S; static (2000) | Earthdata or USGS login. Page checked, data not. |
| [USDA SSURGO / Web Soil Survey](https://websoilsurvey.nrcs.usda.gov/) | Detailed soil survey | Field scale; United States only | No login. Not checked. |

## Crops and suitability

| Dataset | What it gives | Resolution and period | Access |
|---|---|---|---|
| [FAO GAEZ v4](https://gaez.fao.org/) | Crop suitability class and attainable yield per crop, rain-fed and irrigated, input levels | About 9 km (5 arc-min); baseline 1981–2010 and future periods to 2100 under several climate scenarios | ArcGIS ImageServer, no login, browser-callable; about 0.5–1.4 s per value. Checked. |
| [FAOSTAT](https://www.fao.org/faostat/) | Crop area, yield and production by country and year | National; from 1961 | No login. Not checked. |
| [FAO ECOCROP](https://gaez.fao.org/pages/ecocrop) | Growing requirements per crop (temperature, rainfall, soil pH ranges) | Per species | No login. Not checked. |
| [USDA CropScape (Cropland Data Layer)](https://nassgeodata.gmu.edu/CropScape/) and [NASS](https://www.nass.usda.gov/) | Crop type per field and crop statistics | 30 m, yearly; United States only | No login. Not checked. |

## Catalogues, platforms and base maps

| Dataset | What it gives | Access |
|---|---|---|
| [NASA GIBS / Worldview](https://worldview.earthdata.nasa.gov/) | Ready map tiles for hundreds of NASA products (SMAP, MODIS, VIIRS and more) | No login, CORS `*`. Checked. |
| [AppEEARS](https://appeears.earthdatacloud.nasa.gov/) | Point and area time series and subsets from MODIS, VIIRS, SMAP, ECOSTRESS and others | Product list without login; requests need Earthdata login. Checked. |
| [Earthdata Search / CMR / CMR-STAC](https://search.earthdata.nasa.gov/) | Catalogue search across NASA collections | Search without login; downloads need Earthdata login. Checked. |
| [Google Earth Engine](https://earthengine.google.com/) | Hosted catalogue and processing (MODIS, Landsat, Sentinel, ERA5, SMAP and others) | Account and cloud project registration. Not checked. |
| [Microsoft Planetary Computer](https://planetarycomputer.microsoft.com/) | STAC catalogue with Landsat, Sentinel-2 and other datasets | Most data without an account. Not checked. |
| [OpenStreetMap](https://www.openstreetmap.org/) | Base map, roads, land use, some field boundaries | Free (ODbL licence); tile usage policy applies. Not checked. |
