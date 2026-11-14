# Flame in Freefall: what PSI gives us

Research question 5 from HANDOFF.md, checked Sat 14 Nov 11:55–12:25 CET.

**Answer: enough for a real data product, no login needed.** PSI lists 24 combustion investigations. All have full metadata (objectives, hypothesis, approach, Earth and space benefits, keywords, publications with DOIs, related investigations). 20 of them publish experimental tables as CSV: 22 files, 2,009 non-empty rows, 211 KB, all downloaded in 27 s. Licence CC0-1.0 with a dataset DOI on each investigation except one.

## Endpoints (all public)

| What | URL | Notes |
|---|---|---|
| Search (all 133 PSI investigations) | `https://psi.nasa.gov/geode-py/ws/repo/search?term=&source=psi&type=investigation&size=200` | Elasticsearch-style `hits.hits[]._source`. Without `size` it returns 25. Filter combustion on `Research Area == "Combustion Science"` in code; the `research_area` parameter is ignored. |
| Investigation detail | `https://psi.nasa.gov/geode-py/ws/repo/investigations/PSI-69` | 30 KB JSON: `objective`, `hypothesis`, `approach`, `doi`, `licenseIdentifier`, `publications[]` (51 for FLEX), `experimentalTable[]` with file names |
| Table download | `https://psi.nasa.gov/geode-py/ws/studies/PSI-69/download?file=<file name>&version=1&redirect=false` | Returns a signed S3 URL; fetch that for the CSV |
| Landing page for links in the app | `https://psi.nasa.gov/physci/repo/data/investigations/PSI-69` | |

CORS on the PSI API allows only `https://psi.nasa.gov`, so a browser app cannot call it directly. Fetch everything once with a script at build time (27 s) and ship it as static JSON. The data is small and CC0, so this is the simple path anyway.

## The 24 combustion investigations

19 microgravity, 5 ground. Sub-areas: Spacecraft Fire Safety 10, gaseous flames 5, droplets 2, smoke 2, others 5.

Tables by investigation (rows):

| Investigation | Rows | What it measures (first columns) |
|---|---|---|
| PSI-69 FLEX | 274 | fuel, pressure, O2/N2/CO2/He fractions, droplet diameter, extinction diameter, burning rate, burn time, test end |
| PSI-68 FLEX-2 | 8 | fuel, droplet diameter, gas mixture, O2 fraction, pressure, temperature, flow velocity |
| PSI-39 CFI | 87 | pressure, O2, N2, He |
| PSI-159 ACME CFI-G | 179 + 154 (the second file also has 861 empty rows) | fuel, cool flame yes/no, O2 before/after, pressure |
| PSI-10 ACME Flame Design | 207 + 120 | fuel fraction and flow, O2, N2 |
| PSI-20/21/22/23 ACME (BRE, CLD, E-field, s-Flame) | 18–32 each | burner, fuel, O2, flames ignited |
| PSI-107 SPICE | 469 | fuel, nozzle, fuel rate |
| PSI-25 BASS-II | 129 | fuel sample material, flow restrictor, fan |
| PSI-26 BASS | 122 | fuel sample material |
| PSI-98 / PSI-99 / PSI-100 SAFFIRE-I/II/III | 4 / 15 / 2 | material, thickness, size, air flow, O2 %, ignition power (large-scale fires on Cygnus) |
| PSI-101 SAME-R / PSI-102 SAME | 109 / 8 | smoke: sample material, flow, weight loss, aging |
| PSI-106 SLICE | 12 | fuel type |
| PSI-47 DAFT | 2 | smoke particles by location |
| PSI-142 | 8 | index of figures in a publication |

No tables: PSI-60, PSI-62, PSI-115, PSI-117 (metadata only).

## What the data supports

- **Material and condition lookup.** A crew planner picks oxygen level, pressure and air flow for a habitat (ISS ~21% O2 at 1 atm; exploration atmospheres are discussed at lower pressure and higher O2). The app shows which tested materials and fuels burned, how fast, and where flames went out, from BASS, SAFFIRE, FLEX and ACME rows, each with its DOI.
- **Suppressant comparison.** FLEX rows carry CO2 and He fractions with extinction diameter and burn time, so the effect of a diluent can be plotted directly from flight data.
- **"Why" from metadata.** Objectives, hypotheses and Earth/space benefit text per investigation feed an AI summary and ranking per habitat type, with every claim linked back to an investigation and DOI.

## Limits

- Columns differ per experiment (units in headers, typos such as "Samle Thickness", a BOM in some files). Merging needs a per-table mapping to a common schema: material/fuel, O2 fraction, pressure, flow velocity, outcome. An LLM can propose the mapping; a person checks it.
- Most tables are small (2–30 rows) except FLEX, ACME and SPICE. Rankings will lean on metadata and publications more than on numbers.
- The raw imagery and video behind the tables is large (FLEX alone lists 860 GB). Not needed for the dashboard.
- The brief asks for "SI-powered". Where the AI runs (build time vs. live calls with a key in hosting variables) is a design decision for the spec.

## Samples saved

`data/samples/psi/`: `combustion-investigations.json` (24 search records with full text fields), `tables-summary.json` (file, rows, columns per table), and the 22 CSV tables (file names with spaces replaced by underscores).
