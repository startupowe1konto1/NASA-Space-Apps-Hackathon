# Martian Map: can we build on Mars Trek data?

Research question 1 from HANDOFF.md, checked Sat 14 Nov 11:20–11:50 CET.

**Answer: yes.** Every layer we need loads in a Leaflet map served from `http://localhost:5171`, with no proxy and no login. In the browser test 74 tiles from five layers loaded with 0 errors. Elevation in metres, an elevation profile along a line and Curiosity's route as GeoJSON all came back from the same page.

## What works

All requests go to trek.nasa.gov, which is the first resource listed for the challenge. No key, no login.

| Layer | Use in the app | Endpoint | Native max zoom | CORS |
|---|---|---|---|---|
| `curiosity_hirise_mosaic` | HiRISE close-up of Gale crater (about 0.6 m/px at z16) | WMTS tiles | 16 | `*` |
| `curiosity_ctx_mosaic` | CTX context mosaic around Gale | WMTS tiles | 10 | `*` |
| `mola128_mola64_merge_90Nto90S_SimpleC_clon0` | global MOLA base | WMTS tiles | 5 | `*` |
| `THEMIS_DayIR_ControlledMosaics_100m_v2_oct2018` | thermal layer (day IR, 100 m) | WMTS tiles | 9 | `*` |
| `THEMIS_NightIR_ControlledMosaics_100m_v2_oct2018` | thermal layer (night IR; reads as thermal inertia, loose vs. rocky ground) | WMTS tiles | 9 | `*` |
| `SIM3292_Global_Geology` | USGS global geologic map | ArcGIS WMTS (different URL, see below) | 11 | echoes origin |
| `Gale_DEM_SMG_1m` | HiRISE DEM of Gale, 1 m, float32 metres | ArcGIS ImageServer | n/a | echoes origin |
| `curiosity_path` | Curiosity traverse, 1 line, 19,188 points | ArcGIS MapServer query, GeoJSON | n/a | echoes origin |
| `curiosity_waypoints` | 14 named stops, Bradbury Landing to Hematite Hotspot | ArcGIS MapServer query, GeoJSON | n/a | echoes origin |

Thermal (THEMIS), topographic (DEM), optical (HiRISE/CTX) and geologic layers together already give the "at least three kinds of data" the brief asks for.

## URL patterns

Tiles (equirectangular, 256 px, z0 is 2×1 tiles, so Leaflet `L.CRS.EPSG4326` works without a custom CRS):

```
https://trek.nasa.gov/tiles/Mars/EQ/<layer>/1.0.0/default/default028mm/{z}/{y}/{x}.png
```

Geology tiles use the ArcGIS path instead (the `/tiles/` path returns 404 for this layer):

```
https://trek.nasa.gov/mars/trekarcgis/rest/services/SIM3292_Global_Geology/MapServer/WMTS/tile/1.0.0/SIM3292_Global_Geology/default/default028mm/{z}/{y}/{x}.png
```

DEM, values in metres (base URL `https://trek.nasa.gov/mars/trekarcgis/rest/services/Gale_DEM_SMG_1m/ImageServer`):

| Call | Result in the test |
|---|---|
| `/identify?geometry={"x":137.40,"y":-4.60}&geometryType=esriGeometryPoint&f=json` | `-4502.48` m |
| `/getSamples?geometry={"paths":[[[137.38,-4.62],[137.42,-4.58]]]}&geometryType=esriGeometryPolyline&sampleCount=50&returnFirstValueOnly=true&f=json` | 51 samples, −4512 to −4492 m |
| `/exportImage?bbox=137.39,-4.61,137.41,-4.59&size=256,256&format=tiff&pixelType=F32&f=image` | 263 KB float32 GeoTIFF in 3 s (limit 15000×4100 px) |

Route and stops: `.../curiosity_path/MapServer/0/query?where=1%3D1&outFields=*&f=geojson` (782 KB) and `.../curiosity_waypoints/MapServer/0/query?where=1%3D1&outFields=*&f=geojson`.

Catalogue search, to find more layers: `https://trek.nasa.gov/mars/TrekServices/ws/index/eq/searchItems?proj=urn:ogc:def:crs:EQ&start=0&rows=40&key=<word>&itemType=product`. The full ArcGIS service list (76 services): `https://trek.nasa.gov/mars/trekarcgis/rest/services?f=json`.

## Limits found

- The 1 m DEM and the HiRISE mosaic cover only 137.12–137.73 E, 4.25–4.93 S (Gale, Curiosity's area). Outside it we have MOLA (about 460 m) and CTX. So the demo should stay on Mount Sharp, which is also the brief's own example.
- DEM tiles on the `/tiles/` path are 8-bit grey pictures, not heights. For slopes and profiles use the ImageServer calls above.
- The Trek route layer is named `curiosity_path_line4_18` and ends at Vera Rubin Ridge / Hematite Hotspot (about 2018). The 2025 boxwork area from the brief is further up Mount Sharp and is not on this line. Newer positions would need another source (to check: the MSL traverse on the NASA science site).
- `Mars_MOLA_blend200ppx_HRSC_DEM...` and `Mars_MO_THEMIS-IR-Day_mosaic_global_100m_v12` from older docs return 404 on `/tiles/`. Use the names in the table.
- ArcGIS endpoints echo the request `Origin` rather than sending `*`. Fine for localhost and a deployed site. Not tested from a `file://` page.

## Samples saved

`data/samples/mars-trek/`: WMTS capabilities XML for 7 layers, one tile per layer over Mount Sharp, `Gale_DEM_SMG_1m.ImageServer.json`, `dem_profile_sample.json`, `gale_dem_256_f32.tif`, `curiosity_path.geojson`, `curiosity_waypoints.geojson`, and `leaflet-spike.html` (the throwaway test page; run it with `python -m http.server 5171` in that folder).

## What this means for the idea

The "Marswalk planner" from HANDOFF.md is buildable from the browser alone: HiRISE base map, DEM `getSamples` for the elevation profile and slope along a drawn route, THEMIS night IR as a loose-ground layer, geology on top, Curiosity's real stops as science cards. A 3D flyover would need the DEM grid from `exportImage` turned into a Cesium terrain or a three.js mesh; that is extra work, not a blocker.

Not checked: a radiation layer (the brief mentions radiation), CRISM mineral layers over Gale, Cesium terrain from the DEM.
