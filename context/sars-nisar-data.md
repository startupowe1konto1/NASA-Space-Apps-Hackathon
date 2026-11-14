# Dancing with the SARs: what NISAR data can we reach today?

Research question 4 from HANDOFF.md, checked Sat 14 Nov 11:40–12:05 CET. The test point (52.41 N, 16.93 E) was only a convenient place to query; it says nothing about the project's focus.

**Answer: browse images yes, science files only with a login.** The ASF search API lists NISAR granules for any point with no login. Each granule has a geocoded browse PNG (`_LATLON.png`, 2–4 MB) that downloads without a login. The HDF5 science files return 401 without an Earthdata login; their size is not published in the search metadata, so it is still unknown.

## What works without a login

| Check | Result |
|---|---|
| ASF search `https://api.daac.asf.alaska.edu/services/search/param?platform=NISAR&intersectsWith=POINT(lon%20lat)&output=jsonlite` | 200. 226 granules at the test point from 28 Oct 2025 to 29 Oct 2026: GCOV 48, GSLC 48, RSLC 48, SME2 44, GUNW 38. Each record has `wkt` (footprint), `startTime`, `browse`, `downloadUrl`, `frame`, `path`. |
| CMR collections `https://cmr.earthdata.nasa.gov/search/collections.json?keyword=NISAR&provider=ASF` | 40 NISAR collections: Beta, Provisional and Validated versions of RSLC, GSLC, GCOV, GUNW, GOFF, SME2 and others. |
| Browse image, GCOV | 200 after a redirect to CloudFront, 4.4 MB PNG, 2016×2005 px, RGB colour composite of polarizations |
| Browse image, GUNW | 200, 2.4 MB PNG with alpha, 1515×1505 px, interferogram colours |
| HDF5 download (`.h5`) | 401, redirect to `urs.earthdata.nasa.gov` |
| File size | not in ASF `sizeMB`/`bytes` or CMR `ArchiveAndDistributionInformation` |

`_LATLON.png` browse images are on a north-up lat/lon grid, and the footprint polygon comes with the search record, so a web map can place them with an image overlay and a time slider. SME2 records had no browse image in the first result.

## What this means

- **Cheap path (no login, no processing):** a NISAR change viewer for any clicked place. Search granules, show browse images on the map, swipe or slide between dates. Works on day one. The images are colour composites, not calibrated values, so the app can show change but not measure it.
- **Science path (login + HDF5):** GCOV backscatter for water masks or crop change, SME2 for soil moisture values, GUNW for deformation. Needs an Earthdata login, unknown file sizes (to measure first), an HDF5 reader (h5py or GDAL) and some SAR knowledge. Realistic only for one preprocessed area in the first hours.

## Open

- Earthdata login, then download one SME2 and one GCOV granule: size, time, and time to a PNG of one variable.
- The Earthdata login in the browser pane failed at 12:20 ("Invalid username or password"); someone with an account needs to log in.

## Samples saved

`data/samples/nisar/`: `asf-search-jsonlite-10.json` (10 search records), `gcov-browse-latlon-small.png` and `gunw-browse-latlon-small.png` (browse images resized to one sixth).
