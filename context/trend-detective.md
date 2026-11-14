# Trend Detective: can we build a trend map without a login?

Research question 3 from HANDOFF.md, checked Sat 14 Nov 12:05–12:25 CET.

**Answer: yes, with NASA POWER.** A browser page on `http://localhost:5171` asked POWER for a 10°×10° box (357 grid cells, 1981–2024, monthly), ran Mann-Kendall and Sen's slope on every cell in JavaScript and coloured the map. Fetch 2.5–7 s, compute 73–387 ms. No key, no login, no server. Giovanni and AppEEARS (the tools named in the challenge Resources) were not tested: both need an Earthdata login, and the login in the browser pane failed.

## What works

| Check | Result |
|---|---|
| POWER regional endpoint `/api/temporal/monthly/regional` | 200, `access-control-allow-origin: *`, so a static web app can call it directly |
| Box size | 10°×10° worked (357 cells, about 0.5° lat × 0.625° lon, MERRA-2 grid). Larger boxes not tested. |
| Parameters per request | **one**. Two parameters return 422 "A maximum of 1 parameters…". |
| Time span | 1981 to 2025 monthly (45 years); the test used 1981–2024 annual means, n = 44 |
| Variables | 1,388 monthly parameters in the AG community catalogue, including root-zone and surface soil wetness (`GWETROOT`, `GWETTOP`), precipitation (`PRECTOTCORR`, IMERG-based `IMERG_PRECTOT`), temperature, frost days, radiation, humidity |
| Mann-Kendall + Sen's slope in the browser | 357 cells × 44 years in 73 ms (US Midwest box) and 387 ms (East Africa box) |

Two test boxes, root-zone soil wetness, 1981–2024, p < 0.05:

| Box | Rising | Falling | No significant trend |
|---|---|---|---|
| 35–45 N, 100–90 W (US Midwest) | 0 | 36 | 321 |
| 5 S – 5 N, 30–40 E (East Africa) | 107 | 60 | 190 |

The East Africa box shows the case the brief describes: the same variable rising in one part of a region and falling in another. The Midwest count was 37 when computed in Python with an exact `erfc`; the browser uses a polynomial `erfc` approximation, which moved one borderline cell. For the app, use an exact implementation or a stats library.

## How to call it

```
https://power.larc.nasa.gov/api/temporal/monthly/regional?parameters=GWETROOT&community=AG&latitude-min=-5&latitude-max=5&longitude-min=30&longitude-max=40&start=1981&end=2025&format=JSON
```

Response: GeoJSON `FeatureCollection`, one `Point` per cell, values in `properties.parameter.<NAME>["YYYYMM"]`; month `13` is the annual value. Missing values are `-999`.

Parameter list: `https://power.larc.nasa.gov/api/system/manager/parameters?community=AG&temporal=monthly`.

## Limits and open points

- POWER is a NASA dataset but it is listed under Field Shift's Resources, not Trend Detective's. The Trend Detective Resources name Giovanni, Hydrology Time Series, AppEEARS, NOAA CDO and KNMI Climate Explorer. Using POWER is within NASA data, but judges may expect one of the named tools. To check after an Earthdata login: does Giovanni or AppEEARS return an area time series for a drawn box (for example MODIS NDVI or GPM rain), and how long does it take?
- POWER is reanalysis and model output on a coarse grid (about 50 km). Fine for regional trends, not for a single field.
- One parameter per request means a "test ten variables" feature needs ten requests (about 25–70 s at the measured speed). Run them in parallel or cache.
- Mann-Kendall assumes no autocorrelation. Annual means reduce it; a note in the UI (or a pre-whitening option) answers the obvious judge question.
- Many cells means many tests: at p < 0.05, about 1 in 20 cells shows a "trend" by chance. A false-discovery-rate correction (Benjamini–Hochberg) or a field-significance note keeps the map honest.

## Samples saved

`data/samples/power/`: `point-monthly-1981-2025-ag.json` (one point, six agro parameters), `regional-monthly-T2M-4x4deg-2001-2024.json` (grid response format), `trend-spike.html` (the throwaway test page; serve the folder with `python -m http.server 5171` and open `trend-spike.html?box=-5,5,30,40&p=GWETROOT`).

## What this means for the idea

The "trend map with verdicts" from HANDOFF.md is buildable as a static web app on POWER alone: draw a box, pick a variable, get a map of rising / falling / no-trend cells, click a cell for its time series, Sen's slope and p-value in plain words. The differentiator against Giovanni is the per-cell significance map and the plain-language verdict, which Giovanni does not give.
