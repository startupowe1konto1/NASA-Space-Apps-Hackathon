# Flame in Freefall: PSI combustion data check (research question 5)

Checked Sat 14 Nov 2026, 12:06 to 12:11 CET, with curl, no login. Samples are in `data/samples/psi/`.

## Verdict

PSI works for this challenge. There is an unauthenticated JSON API behind the search page, 24 combustion investigations with rich text metadata and a DOI each, 22 small CSV "experimental tables" with about 2,000 test-run rows, and files that download without a login through presigned S3 links. License is CC0-1.0 on 23 of 24 records. The one catch: the API only allows CORS from psi.nasa.gov, so the app must use a snapshot taken at build time (or a small server proxy), not live calls from the browser.

## API behind the JavaScript page

The search page is an Angular app (`main.5216219a85b99359.js`). It calls these endpoints, all public, no token needed (the app sends an empty `user_token` header for anonymous users):

| What | Request | Time |
|---|---|---|
| Search (Elasticsearch passthrough) | `GET https://psi.nasa.gov/geode-py/ws/repo/search?term=combustion&ffield=Research%20Area&fvalue=combustion%20science&from=0&size=100` | 2 to 6 s |
| Filter values | `GET https://psi.nasa.gov/geode-py/ws/repo/filter-options` | 2 s |
| One investigation (full record) | `GET https://psi.nasa.gov/geode-py/ws/repo/investigations/PSI-98` | 4 s, 134 KB |
| File tree of an investigation | `POST https://psi.nasa.gov/geode-py/ws/files/v2` with JSON `{"folder":"","fileType":"study","studyId":"PSI-98","version":4}` | 2 s |
| Download link for one file | `GET https://psi.nasa.gov/geode-py/ws/studies/PSI-98/download?file=<file_name>&version=<n>&redirect=false` returns a presigned S3 URL as text | 2 s, then the S3 GET |

Search parameters (from the bundle): `term`, `source`, `type`, `from`, `size`, `sort`, `order`, and repeated `ffield`/`fvalue` pairs for filters. Search returns the Elasticsearch shape `hits.total`, `hits.hits[]._source`.

All 24 full records fetched in 44 s with 8 parallel requests.

CORS: `Access-Control-Allow-Origin: https://psi.nasa.gov` only. A browser app on our domain cannot call the API directly.

## How many

- Whole repository: 133 investigations (Materials Science 35, Complex Fluids 34, Fluid Physics 27, Combustion Science 24, Biophysics 7, Fundamental Physics 6).
- Filter `Research Area = combustion science`: **24 investigations**. `term=combustion` returns 26 (adds one materials and one fluids record). `term=fire` returns 17, all combustion.
- 19 are microgravity investigations flown on ISS (one, SAFFIRE-II, on the Cygnus spacecraft), 5 are ground investigations (modeling or analysis of flight data).
- Spacecraft-fire-relevant ones by name: SAFFIRE-I/II/III (large-scale fire on Cygnus), BASS and BASS-II (burning and suppression of solids), FLEX and FLEX-2 (flame extinguishment), SAME and SAME-R (smoke aerosol), DAFT (dust and aerosol), SPICE (smoke point), plus ACME (6 gaseous-flame investigations), CFI (cool flames), SLICE.
- Full list with DOI, platform and counts: `data/samples/psi/combustion-investigations.tsv`.

## Metadata per investigation

Fields in the full record (`/repo/investigations/<id>`): `accession`, `title`, `investigationAcronym`, `doi`, `licenseIdentifier`/`licenseName`/`licenseLink`, `researchArea`, `subResearchArea` (for example "Spacecraft Fire Safety", "Droplets", "Flames of Gaseous Fuels"), `projectType` (microgravity, ground, reduced gravity), `flightProgram` (ISS, Cygnus), `experimentHardware`, `experimentHardwareLink`, `objective`, `hypothesis`, `approach`, `researchImpacts`, `investigationStartDate`/`investigationEndDate`, `releaseDate`, `managingNasaCenter`, `contacts` (PI with name, affiliation, role), `publications[]` (`title`, `authorList`, `doi`, `pubMedID`, `status`), `related_glds` (related PSI ids), `experimentalTable[]`, `modelingTable[]`, `totalFileSize`, `restricted`.

How the brief's fields map:

| Brief asks for | Where it is | Coverage |
|---|---|---|
| Title | `title`, `investigationAcronym` | 24/24 |
| DOI | `doi` (DataCite prefix 10.60555, resolves to the PSI page) | 24/24 |
| Gravity level | No numeric field. `projectType` (microgravity / ground) and `flightProgram` | 24/24, categorical only |
| Fuel | Columns in the experimental table CSV (`Fuel`, `Material`, `Fuel Sample Material`, `Sample (Fuel Type)`) and in the free text | 19 of 22 tables, column names differ |
| Pressure | Columns in some tables: `Ambient pressure; mmHg` (FLEX), `Pressure` (CFI), `pinit/pfinal/pmean (atm)` (ACME Flame Design), `approx p (bar)` (CFI-G), `Ambient Pressure (atm)` (FLEX-2) | 7 of 22 tables (5 investigations) |
| Oxygen | `Percent O2`, `XO2`, `Oxygen Conc (percent)`, `Oxygen Mole Fraction`, O2 initial mole fraction | 11 of 22 tables (9 investigations) |
| Findings | No "findings" field. `researchImpacts` and `objective`/`hypothesis`/`approach` text (1,800 to 5,500 characters per record, median 3,100), plus 352 publication titles (284 with a DOI). No abstracts in PSI. | 24/24 text |

Experimental tables: 22 CSV files over 20 investigations, **2,009 rows** in total, each a list of test runs. Largest: SPICE 469 rows, FLEX 274, CFI-G 179+154, ACME Flame Design 207+120, BASS-II 129, BASS 122, SAME-R 109. Smallest: SAFFIRE-I 4 rows, SAFFIRE-III 2. Every table has its own column set (2 to 20 columns), so a shared schema needs a column mapping step.

Example (SAFFIRE-I, full file in `data/samples/psi/experimental-table-PSI-98-SAFFIRE-1.csv`): columns `Sample Number, Material, Sample Thickness (cm), Sample Length (cm), Sample Width (cm), Air Flow (cm/s), Percent O2, Ignition Power (W), Ignition Time (s), Burn Time (s), Flow Direction, Camera 1, Camera 2`; row S1 is SIBAL fabric, 20 cm/s air, 21.5 to 21.7% O2, 420 s burn, concurrent flow.

## Files and login

- No login, no terms to accept for public files. The download endpoint returns a presigned S3 URL (`psi-repo-prod.s3.amazonaws.com` or `psi-curation-prod.s3.amazonaws.com`); a plain GET works. Tested: SAFFIRE-I CSV (469 B, HTTP 200) and a raw-data ZIP (Range request, HTTP 206, 566,718 bytes, `application/zip`). All 22 experimental tables downloaded in under 2 s in parallel.
- `restricted` is false on all 24 records. The bundle has a "data access request" flow (`/dar/...`) for restricted files; we did not hit it.
- Size: total 13.5 TB across the 24 (ACME records are 0.8 to 2.2 TB each, mostly video and images). We do not need any of it for the dashboard: metadata plus the CSV tables are about 3 MB.
- Presigned URLs carry temporary credentials. Link users to the PSI page or DOI, never store the S3 link.

## License and citation

- `licenseIdentifier: CC0-1.0` on 23 records; PSI-10 has an empty license field (check before shipping, or cite and link only).
- PSI asks users to cite each dataset's DOI. Each card in the app should show the DOI link `https://doi.org/10.60555/...` and the PSI page `https://psi.nasa.gov/physci/repo/data/investigations/<id>`.

## Second source: NASA Technical Reports Server

- `GET https://ntrs.nasa.gov/api/citations/search?q=spacecraft%20fire%20safety%20microgravity&page.size=5`: public, HTTP 200 in 2.4 s, 143 hits. Each result has `title`, `abstract`, `authorAffiliations`, `center`, `subjectCategories`, `distribution` (PUBLIC), `downloads[].links.pdf`. Sample: `data/samples/psi/ntrs-search-spacecraft-fire-safety.json`.
- Use: abstracts for the publications PSI only lists by title, and papers on SAFFIRE, BASS, FLEX by name. CORS not checked; treat it like PSI (snapshot at build time).

## Rejection criteria

- **Demo on real NASA data by T+8 (19:10):** passes. Snapshot script (24 records + 22 CSVs) runs in about a minute; the data is already understood.
- **More than 1 h of preprocessing:** passes for metadata and text (no preprocessing, JSON as is). Normalizing fuel, O2 and pressure across 22 different CSV schemas is the only real work: about 30 to 60 min with a hand-written column map, or an LLM proposes the map and a person checks it. Can be skipped for a first demo by showing each table as is.
- **Existing NASA tool already does it:** partly. PSI already has search, filters and per-record pages. It has no summarizing, no ranking by a scenario (habitat, material, oxygen level), no explanation in plain language and no cross-experiment comparison. That is the difference, and it is what the brief asks for.

## What the AI layer can do with this data

- Summarize each investigation from `objective`, `hypothesis`, `approach`, `researchImpacts` into a short card with the DOI, and only from that text.
- Rank the 24 investigations for a scenario the user picks (for example "fabric fire in a pressurized rover at 30% O2") using the text plus experimental-table values for fuel, oxygen and pressure.
- Propose the column mapping for the 22 CSV schemas (fuel, O2, pressure, flow, burn time) so the app can filter test runs across experiments; a person checks the map once.
- Answer questions with citations: retrieval over 24 records, 352 publication titles and NTRS abstracts, each answer linked to a PSI id or NTRS id.
