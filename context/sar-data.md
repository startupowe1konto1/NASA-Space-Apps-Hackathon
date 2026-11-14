# Dancing with the SARs: NISAR data check

Research question 4 from HANDOFF.md. Checked Sat 14 Nov 2026, 12:06–12:14 CET, live requests from the venue network, **no Earthdata login**. Builds on `context/field-shift-data.md` (branch `o1/r2-field-shift-data`), which already found SME2 at about 126 MB per granule with no browse image.

Test points (no region is assumed for the project; these are only for testing):
- 52.45 N, 17.10 E (same field as question 2)
- Sylhet haor basin, Bangladesh, 24.9 N, 91.9 E: seasonal monsoon flooding, easy to see
- Mexico City, 19.43 N, 99.13 W: a known subsidence hotspot (tens of cm per year)

## Answer in short

The fastest way to show change is **not** HDF5. NASA GIBS already serves NISAR GCOV as a map layer (`NISAR_L2_Geocoded_Polarimetric_Covariance`, "NISAR Normalized Radar Backscatter (False Color)"): PNG, no login, CORS `*`, one image per day from 29 Oct 2025 to 11 Nov 2026. Time to one PNG: **0.7–2 s**. Flood (open water) change is visible in it with no preprocessing. Soil moisture (SME2) and subsidence (GUNW) need the Earthdata login and HDF5 or GeoTIFF reading.

| Product | What it shows | File size (HDF5) | Grid | Browse image | Time to one PNG |
|---|---|---|---|---|---|
| GCOV (L2 backscatter) | floods, crops, forest, land cover | **1.27–2.13 GB** (median 2.05 GB, 48 granules at 52.45 N) | 10 or 20 m, UTM | yes: ASF browse PNG 2016×2005 px (4.4 MB, about 185 m/px) + 100×100 thumbnail, **no login**; also the **GIBS layer** | **0.7–2 s** via GIBS; 3–11 s via ASF browse PNG |
| GUNW (L2 interferogram, 12-day pairs) | ground motion, subsidence | **2.42–2.56 GB** (38 granules) | 80 m | yes: ASF browse PNG 1515×1505 px (2.4 MB), no login | 5 s for the browse PNG, but one 12-day pair does not show subsidence (see below) |
| SME2 (L3 soil moisture, provisional) | soil moisture | **63–136 MB** (median 132 MB, 44 granules) | 200 m EASE-Grid 2.0 (400 m for 5+5 MHz modes) | **none** | needs login: about 1–2 min download at 1.7 MB/s, plus HDF5 reading |
| GSLC / RSLC (for reference) | raw input for experts | 6.4–13.6 GB / 7.4–16 GB | | yes | not for a hackathon |

Sizes are from the ASF search API (`bytes` field), not from downloads. Nothing over 200 MB was downloaded.

## Download times (measured and estimated)

- Measured throughput from the venue to the ASF CloudFront bucket: **1.67 MB/s** (10.6 MB browse PNG in 6.3 s). Smaller files were slower (4.4 MB in 10.8 s, 2.4 MB in 4.6 s), so expect 0.4–1.7 MB/s.
- At 1.67 MB/s: one SME2 granule 40–80 s; one GCOV granule **13–21 min**; one GUNW granule **about 25 min**. At 0.5 MB/s, multiply by 3.
- The HDF5 links answer `302` to `urs.earthdata.nasa.gov/oauth/authorize`, so none of these can be measured without a login.

## Which change type is quickest to show

1. **Flood / open water (GCOV via GIBS): quickest, minutes of work.** Sylhet, 1°×1° box, 512×512 px WMS images:

   | Date (2026) | Dark pixels (low backscatter, open water proxy) |
   |---|---|
   | 2 Jul | 45.4% |
   | 14 Jul | 45.5% |
   | 30 Oct | 27.1% |
   | 11 Nov | 24.4% |

   The monsoon water covering the haor basin in July has shrunk by about half by November, and you can see it by eye in `data/samples/sar/gibs_nisar_gcov_sylhet_2026-07-02.png` vs `..._2026-11-11.png`. The threshold (max RGB < 70 on the false-colour PNG) is crude: smooth surfaces such as runways also look dark, and the GIBS colours are not calibrated values. For a real number, use GCOV HH/HV backscatter in dB (login + Harmony subset). At 52.45 N, 17.10 E the same measure gives 3.6% (7 Jul) and 7.9% (23 Oct): no flood, mostly lakes and wet fields.
2. **Soil moisture (SME2): medium, needs login.** No browse image and no GIBS layer. Path: Earthdata login → Harmony bbox subset to GeoTIFF (supported for SME2, see below) or the full 63–136 MB HDF5 → colour map → PNG. Estimate 1–2 h to a working pipeline for a few granules, then minutes per granule. SMAP L4 on GIBS (question 2) is a no-login fallback at 9 km.
3. **Subsidence (GUNW): slowest.** GUNW pairs are 12 days apart. Mexico City sinks up to about 35 cm/yr, which is about 1 cm per pair, about one tenth of a fringe at L-band (24 cm wavelength). The browse PNG for the 8→20 Oct 2026 pair over Mexico City shows broad atmospheric phase, not a subsidence bowl. Showing subsidence needs a stack of many 2.5 GB GUNW files and a time-series inversion (MintPy or similar): many hours, too risky for 24 h.

## Ways to avoid downloading GB-size HDF5

| Route | Login | What you get | Notes |
|---|---|---|---|
| **GIBS WMS/WMTS, layer `NISAR_L2_Geocoded_Polarimetric_Covariance`** | **no** | False-colour PNG for any bbox and date, EPSG:4326 (`15.625m` matrix set) and EPSG:3857 (`GoogleMapsCompatible_Level13`) | 200, CORS `*`, 0.7–2 s per image (one first request took 6.7 s). Works in Leaflet/OpenLayers directly. Time dimension: daily, 2025-10-29 → 2026-11-11 with gaps. A date with no pass returns an empty transparent PNG (Poznań 9 Nov 2025: 1 KB). One WMTS tile returned 500 once and 200 on retry: add a retry. |
| ASF browse PNG + KML (`browse` field in ASF search) | **no** | Per-granule PNG (GCOV, GUNW, GSLC, RSLC) and a KML with the 4 corner coordinates for a map overlay | 303 redirect to a signed CloudFront URL, CORS `*` on both. Content-Type is `binary/octet-stream` but `<img>` works. SME2 has no browse. |
| ASF search API | **no** | Granule list, dates, tracks, sizes, browse links as GeoJSON | 200, under 2 s. |
| Earthdata Harmony (`harmony-gdal-adapter`) | **yes** (303 to URS) | Bbox + variable subset, reprojection (123 CRSs), output GeoTIFF (GCOV also PNG) for GCOV, GUNW and SME2 | Makes SME2 and GUNW small. CMR service `S4389714698-ASF`. There is also `S4166720787-ASF` "NISAR GCOV Browse" (generates the GIBS-style browse). |
| ASF HyP3 on demand | yes | Job types only for Sentinel-1: `RTC_GAMMA`, `INSAR_GAMMA`, `AUTORIFT`, `ARIA_S1_GUNW`, `OPERA_DISP_TMS` | **No NISAR jobs.** Not useful here. |
| OPeNDAP | – | No OPeNDAP link found on the NISAR collections in CMR | Not checked further. |

CMR collection IDs: GCOV validated `C3622241360-ASF` (`NISAR_L2_GCOV_V1`), GUNW validated `C3622247503-ASF`, SME2 provisional `C2854344945-ASF`. Provisional and beta versions of each also exist.

## Coverage at the test points

| Point | GCOV | GUNW | SME2 | Dates |
|---|---|---|---|---|
| 52.45 N, 17.10 E | 48 | 38 | 44 | 28 Oct 2025 – 29 Oct 2026; a gap from 20 Jan to 18 Jun 2026; 4 tracks (paths 8, 57, 80, 158) |
| Sylhet, Bangladesh | 23 | 18 | 19 | 20 Jun – 11 Nov 2026 only (2 tracks, every 12 days each) |
| Mexico City | 73 | 66 | 70 | 25 Oct 2025 – 6 Nov 2026, 2 tracks |

## What needs the Earthdata login

- Every HDF5 file (GCOV, GUNW, SME2, GSLC, RSLC): `302` to `urs.earthdata.nasa.gov`.
- Harmony subsetting (`303` to URS).
- HyP3 jobs (`401`), though HyP3 has no NISAR job types anyway.
- **Not** needed: ASF search, ASF browse PNGs and KMLs, GIBS NISAR GCOV layer, CMR search, Harmony `capabilities`.

## Verdict against the rejection criteria

- **"Demo on real NASA data by T+8 (19:10)": passes, for flood or land-cover change.** A web map with the GIBS NISAR GCOV layer, a date slider and a before/after swipe works with no login and no backend. That could be on screen within 1–2 h.
- **"Data needs more than 1 h of preprocessing": passes for GCOV via GIBS (zero preprocessing).** Fails or is borderline for SME2 (login + HDF5/GeoTIFF pipeline, estimated 1–2 h) and clearly fails for subsidence (multi-GB stacks, time-series inversion).
- Risk: the GIBS layer is a false-colour picture, not calibrated dB. Numbers (area of water in km²) are a rough proxy unless someone pulls GCOV through Harmony with a login.
- Risk: "an existing NASA tool already does the same": Worldview shows the same GIBS layer. Our difference has to be the story (pick a place, a before/after, a plain-language explanation, time series of water area), not the map itself.

## How to reproduce

- ASF search: `https://api.daac.asf.alaska.edu/services/search/param?platform=NISAR&intersectsWith=POINT(<lon> <lat>)&processingLevel=GCOV&maxResults=200&output=geojson` (also `GUNW`, `SME2`).
- GIBS image: `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=NISAR_L2_Geocoded_Polarimetric_Covariance&CRS=EPSG:4326&FORMAT=image/png&WIDTH=512&HEIGHT=512&STYLES=&BBOX=24.4,90.9,25.4,91.9&TIME=2026-07-02`
- GIBS tile (Web Mercator): `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/NISAR_L2_Geocoded_Polarimetric_Covariance/default/2026-11-11/GoogleMapsCompatible_Level13/10/438/771.png`
- Harmony capabilities: `https://harmony.earthdata.nasa.gov/capabilities?collectionId=C2854344945-ASF`
- Water share: `python3 data/samples/sar/gibs_water_fraction.py <png>...` (numpy only). The table above was computed on the 512×512 originals; the saved 300×300 samples give 42.2% and 23.3%.

Samples in `data/samples/sar/`: ASF search summary with one full feature each for GCOV, GUNW and SME2 (`asf_nisar_search_poznan.json`), GCOV browse thumbnail and KML, GIBS images for Sylhet (2 Jul and 11 Nov 2026) and the test field (23 Oct 2026).

## Sources

- NISAR product docs (grid spacing): https://nisar-docs.asf.alaska.edu/gcov/, https://nisar-docs.asf.alaska.edu/gunw/, https://nisar-docs.asf.alaska.edu/sme2/
- GIBS capabilities: https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/1.0.0/WMTSCapabilities.xml
- CMR: https://cmr.earthdata.nasa.gov/search/collections.json?keyword=NISAR
- Harmony: https://harmony.earthdata.nasa.gov/
- HyP3 API: https://hyp3-api.asf.alaska.edu/openapi.json
