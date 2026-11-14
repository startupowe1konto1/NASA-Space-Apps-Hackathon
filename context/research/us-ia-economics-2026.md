# R9: Iowa crop prices, budgets and NRCS rates (Story County demo field)

Research for O4's money table `data/money/us.json` (PR #60). Crops: corn for grain, soybeans, oats, alfalfa hay, and the cover crops cereal rye and red clover. Every value below was copied from a document opened on Sat 14 Nov 2026; the excerpt of each document is in `data/samples/research/us-ia/`. "Confirmed" means the value and its year are printed in an official document. Metric values are our calculation from the US value (conversion basis at the end).

## 1. Prices received (USDA NASS)

Marketing years (MY) for Iowa: corn and soybeans September 1 to August 31 (NASS Agricultural Prices, Sep 29 2026, p.25); oats July 1 to June 30 and hay June 1 to May 31, the "all other States" rule (Agricultural Prices, Aug 31 2026, p.26). "MY2025" is the 2025 crop.

| Crop | Area | MY | USD | Unit | USD/t | Status | Source | Locator |
|---|---|---|---|---|---|---|---|---|
| Corn | Iowa | 2024 | 4.25 | per bu | 167.3 | final | NASS, Crop Values 2025 Summary (Feb 2026), https://esmis.nal.usda.gov/sites/default/release-files/795791/cpvl0226.pdf | p.16, "Corn for Grain Price per Bushel ... States and United States: 2023-2025", row Iowa, col 2024 |
| Corn | Iowa | 2025 | 4.10 | per bu | 161.4 | preliminary (footnote 1) | same | p.16, row Iowa, col 2025 |
| Corn | US | 2025/26 | 4.16 | per bu | 163.8 | MYA, full year | NASS, Agricultural Prices (released Sep 29, 2026), https://esmis.nal.usda.gov/sites/default/release-files/796084/agpr0926.pdf | p.29, "Corn Prices Received and Marketing Percentages by Month", row MYA, col 2025-2026 |
| Corn | Iowa | Sep 2026 (month) | 4.72 | per bu | 185.8 | monthly | NASS, Agricultural Prices (released Oct 30, 2026), https://esmis.nal.usda.gov/sites/default/release-files/796128/agpr1026.pdf | p.13, "Prices Received for Corn – States", row Iowa, col September 2026 |
| Soybeans | Iowa | 2024 | 9.95 | per bu | 365.6 | final | Agricultural Prices, Sep 29, 2026 (URL above) | p.27, "Soybean Market Year Average Prices Received – States", row Iowa, col 2024 |
| Soybeans | Iowa | 2025 | 10.50 | per bu | 385.8 | MYA | same | p.27, row Iowa, col 2025 |
| Soybeans | US | 2025 | 10.50 | per bu | 385.8 | MYA | same | p.27, row United States, col 2025 |
| Oats | Iowa | 2024 | 3.60 | per bu | 248.0 | MYA | NASS, Agricultural Prices (released Aug 31, 2026), https://esmis.nal.usda.gov/sites/default/release-files/796040/agpr0826.pdf | p.29, "Oats Market Year Average Prices Received – States", row Iowa, col 2024 |
| Oats | Iowa | 2025 | 3.55 | per bu | 244.6 | MYA | same | p.29, row Iowa, col 2025 |
| Oats | US | 2025 | 3.23 | per bu | 222.5 | MYA | same | p.29, row United States, col 2025 |
| Alfalfa hay | Iowa | 2024 | 116.00 | per short ton | 127.9 | MYA | Agricultural Prices, Aug 31, 2026 (URL above) | p.33, "Hay Market Year Average Prices Received – States", row Iowa, Alfalfa col 2024 |
| Alfalfa hay | Iowa | 2025 | 108.00 | per short ton | 119.0 | MYA | same | p.33, row Iowa, Alfalfa col 2025 |
| Alfalfa hay | US | 2025 | 172.00 | per short ton | 189.6 | MYA | same | p.33, row United States, Alfalfa col 2025 |
| Alfalfa hay | Iowa | Aug 2026 (month) | 131.00 | per short ton | 144.4 | monthly | Agricultural Prices, Sep 29, 2026 | p.18, "Prices Received for Hay by Type – States", row Iowa, Alfalfa hay col August 2026 |

The same figures are in NASS QuickStats (Survey, Price Received, State = Iowa, Marketing Year), saved as `nass-quickstats-iowa-price-received.csv`. The February 2026 Crop Values report has older preliminary MY2025 values for soybeans (10.20), oats (3.40) and alfalfa (107.00); the later Agricultural Prices tables above replace them. Iowa corn MY2025 has only the preliminary 4.10 so far; the final state value is due in the next Crop Values report.

Suggested `pricePerT` for "today's prices": the Iowa MY2025 value (161.4, 385.8, 244.6, 119.0 USD/t), year 2025.

## 2. Direct costs per acre (Iowa State University, Ag Decision Maker)

ISU splits each budget into "fixed" (machinery ownership, labor, cash rent) and "variable" (seed, fertilizer, chemicals, insurance, interest, fuel and repairs, drying). For the margin `yield x price - direct costs` (SPEC §7) the variable column is the direct cost; the total adds land rent and machinery ownership.

| Crop / budget (ISU yield level) | Variable USD/ac | Variable USD/ha | Total USD/ac (incl. land) | Year | Source | Locator |
|---|---|---|---|---|---|---|
| Corn following soybeans, 211 bu/ac | 483.60 | 1,195.00 | 911.98 | 2026 | ISU Extension, Ag Decision Maker A1-20 "Estimated Costs of Crop Production in Iowa – 2026" (Jan 2026), https://www.extension.iastate.edu/agdm/crops/pdf/a1-20.pdf | p.3, "Total fixed, variable – Per acre", middle column |
| Corn following corn, 193 bu/ac | 522.99 | 1,292.34 | 960.02 | 2026 | same | p.2, same row, middle column |
| Herbicide-tolerant soybeans following corn, 61 bu/ac | 290.21 | 717.12 | 679.11 | 2026 | same | p.5, same row, middle column |
| Oats (grain + 1 t straw), 80 bu/ac | 235.63 | 582.25 | 478.41 | 2026 | ISU AgDM worksheet "Production Costs for Oat Crop or Other Small Grain" (A1-20, v2.0_12026), https://www.extension.iastate.edu/agdm/crops/xls/a1-15-20oatsmallgrainbudget.xlsx | sheet 1, "Total fixed, variable and all costs – Per acre" |
| Established alfalfa hay, 4 t/ac, large round bales | 242.56 | 599.38 | 596.80 | 2026 | A1-20 2026 (URL above) | p.10, "Total fixed and variable cost using large round bales per acre", 4-ton column |
| Established alfalfa hay, 6 t/ac, large round bales | 325.38 | 804.03 | 803.86 | 2026 | same | p.10, same row, 6-ton column |

Land in these budgets: cash rent equivalent 274 USD/ac for the corn and soybean middle columns, 150 USD/ac for oats and 4-ton hay (pp.2–10). The 2025 edition is linked from the same page (`a1-20-2025.pdf`) but was not opened; p.13 of the 2026 file gives 2025 totals (corn after soybeans 881.03, soybeans after corn 668.90 USD/ac).

Cover crops (ISU has no full cover-crop budget in A1-20):

| Item | Value | Unit | USD/ha | Year | Source | Locator |
|---|---|---|---|---|---|---|
| Drilling cover crop seed (custom rate, average) | 19.05 | USD/ac | 47.07 | 2026 | ISU AgDM A3-10 "2026 Iowa Farm Custom Rate Survey", https://www.extension.iastate.edu/agdm/crops/pdf/a3-10.pdf | p.1, "Planting, Drilling, and Seeding", row "Drilling cover crop seed", Average |
| Aerial seeding of cover crop (average) | 14.70 | USD/ac | 36.32 | 2026 | same | p.1, row "Aerial seeding of cover crop", Average |
| Ground broadcast spraying, self-propelled (termination pass) | 9.35 | USD/ac | 23.10 | 2026 | same | p.2, row "Ground, broadcast, not incorporated, self-propelled", Average |

Cereal rye and red clover seed prices were not found in an ISU or USDA document (see Missing).

## 3. Reference yields, Story County (USDA NASS QuickStats)

Query: Survey / Crops / Yield / County / Iowa / Story (QuickStats web page, "Download Spreadsheet"; file `nass-quickstats-story-county-yield.csv`). Source title for all rows: "USDA NASS Quick Stats, county yield estimates", https://quickstats.nass.usda.gov/results/C2D23D98-A6DF-357D-8B91-4A684965F802, locator "County = STORY, Data Item, Year".

| Crop | 2021 | 2022 | 2023 | 2024 | 2025 | Mean 2021–25 | Unit | Mean t/ha |
|---|---|---|---|---|---|---|---|---|
| Corn, grain | 201.2 | 207.1 | 211.4 | 215.5 | 204.0 | 207.8 | bu/ac | 13.05 |
| Soybeans | 63.6 | 60.0 | 64.1 | 63.2 | 63.6 | 62.9 | bu/ac | 4.23 |
| Oats | – | – | 106.3 | – | – | (one year) | bu/ac | 3.81 (2023 only) |
| Alfalfa hay | – | – | – | – | – | none since 2013 | t/ac | – |

NASS publishes Story County oats only for 2023 in this period and alfalfa last in 2013 (2.5 t/ac). The Central district series stops in 2019. Fallback is the Iowa state yield (query uuid E36EBCF7-51E6-3EBD-9FFA-64E1D30FC097, file `nass-quickstats-iowa-state-yield.csv`):

| Crop (Iowa) | 2021 | 2022 | 2023 | 2024 | 2025 | Mean | Unit | Mean t/ha |
|---|---|---|---|---|---|---|---|---|
| Oats | 77 | 82 | 80 | 82 | 92 | 82.6 | bu/ac | 2.96 |
| Alfalfa hay | 3.5 | 3.7 | 3.2 | 3.8 | 4.2 | 3.68 | short t/ac | 8.25 |
| Corn, grain (for comparison) | 204 | 200 | 201 | 211 | 210 | 205.2 | bu/ac | 12.88 |
| Soybeans (for comparison) | 63 | 58.5 | 58 | 60 | 63.5 | 60.6 | bu/ac | 4.08 |

The alfalfa yield is dry hay as NASS reports it (no moisture adjustment).

## 4. NRCS payments, Iowa

All of these are paid only if the application is ranked and selected (SPEC §7 label "if your application is selected"). Regular rate = 75% of estimated cost and foregone income; HU (historically underserved: beginning, limited resource, socially disadvantaged, tribal, veteran) = 90% (FY2026 booklet, p.1).

### 4a. FY2026 rates (confirmed for FY2026)

Source for every row: USDA NRCS Iowa, "Iowa Financial Assistance Program Scenario Booklet – List of Eligible Practices, Limitations and Payment Scenario Guidance, FY2026", April 28, 2026, https://www.nrcs.usda.gov/sites/default/files/2026-04/FY26%20FA%20Program%20Scenario%20Booklet_April%2028%202026.pdf

| Practice | Scenario ID and name | Programme | Regular USD/ac | HU USD/ac | Regular USD/ha | Locator |
|---|---|---|---|---|---|---|
| 340 Cover Crop | 340-1 Single Species | EQIP | 74.34 | 89.20 | 183.70 | p.38, Payment Schedule |
| 340 Cover Crop | 340-1 Single Species | CSP (italic rate) | 123.89 | – | 306.14 | p.38 |
| 340 Cover Crop | 340-11 Multi-Species (≥2 species) | EQIP | 77.54 | 93.05 | 191.61 | p.39 |
| 340 Cover Crop | 340-11 Multi-Species | CSP (italic rate) | 129.24 | – | 319.36 | p.39 |
| 340 Cover Crop | 340-29 Single Species, Organic | EQIP / CSP | 99.45 / 165.75 | 119.34 | 245.75 | p.39 |
| 328 Conservation Crop Rotation | 328-1 Basic, Two Crop Types | EQIP | 11.53 | 13.84 | 28.49 | p.32 |
| 328 Conservation Crop Rotation | 328-139 Winter or Spring Annual (add a small grain, e.g. oats) | EQIP | 45.34 | 54.41 | 112.04 | p.33 |
| 328 Conservation Crop Rotation | 328-138 Perennial, Short-Term (e.g. alfalfa, ≥2 years) | EQIP | 51.40 | 61.68 | 127.01 | p.33 |
| 328 (CSP supplemental) | "SU-Resource Conserving Crop Rotation" (printed ID 382-107) | CSP | 154.22 | – | 381.09 | p.33 |
| 328 (CSP supplemental) | "SU-Improved Resource Conserving Crop Rotation" (printed ID 392-106) | CSP | 125.49 | – | 310.09 | p.33 |

Conditions printed in the booklet: 340 is a one-year management practice, payable up to 5 years on the same land unit, no full-width tillage after the cover crop until the next cash crop (p.38). 328 "may be paid annually for up to 5 consecutive years"; 328-139 requires adding a winter or spring annual or small grain to a rotation of at least two crop types; 328-138 requires the perennial to stay at least two years (p.32). The two SU rows carry IDs 382-107 and 392-106 in the PDF although they sit in the 328 table; we copied them as printed.

### 4b. Current online schedule (rates confirmed, fiscal year not printed)

NRCS Payment Schedules page, https://www.nrcs.usda.gov/getting-assistance/payment-schedules, cost list report for Iowa, Story County, opened Sat 14 Nov 2026. The results page shows no fiscal year. Its scenario names and rates differ from the FY2026 booklet (for example 328 "Basic, Multiple Annual Crops" 36.84 vs 328-1 "Basic, Two Crop Types" 11.53), so it is probably the FY2027 list (FY2027 began 1 Oct 2026, and the NRCS Iowa "Financial Assistance - Iowa" page says "The updated payment schedule is released in the first quarter each Fiscal Year (Oct-Dec)", excerpt `nrcs-iowa-financial-assistance-page.txt`). Treat as `confirmed: false` until a dated FY2027 document is found. Full rows: `nrcs-payment-schedule-iowa-eqip-1-story-county.tsv`, `nrcs-payment-schedule-iowa-cstwp-1-story-county.tsv`.

| Practice | Component | List | USD/ac | HU USD/ac | USD/ha |
|---|---|---|---|---|---|
| 340 | Any Species | Iowa EQIP-1 | 74.75 | 89.70 | 184.71 |
| 340 | Any Species | Iowa CStwP-1 (CSP) | 124.59 | – | 307.87 |
| 328 | Basic, Multiple Annual Crops | Iowa EQIP-1 | 36.84 | 44.21 | 91.03 |
| 328 | Winter or Spring Annual | Iowa EQIP-1 | 47.78 | 57.34 | 118.07 |
| 328 | Perennial, Short-Term | Iowa EQIP-1 | 53.45 | 64.15 | 132.08 |
| 328 | SU_Resource Conserving Crop Rotation | Iowa CStwP-1 (CSP) | 95.57 | – | 236.16 |
| 328 | SU_Improved Resource Conserving Crop Rotation | Iowa CStwP-1 (CSP) | 106.91 | – | 264.18 |

CSP enhancements: the Iowa CStwP-1 list has no E340*/E328* enhancement codes (the only "E" code is E300EAP). CSP enhancement rates for cover crops were not found.

### 4c. How competitive EQIP is

| Fact | Value | Period | Source | Locator |
|---|---|---|---|---|
| EQIP applications received vs funded, national | 1,202,851 received, 386,140 with contracts, 32.10% | FY2009–2018 | USDA NRCS, "Regulatory Impact Analysis for the Environmental Quality Incentives Program (EQIP)", https://www.nrcs.usda.gov/sites/default/files/2023-03/Regulatory_Impact_Analysis_for_the_Environmental_Quality_Incentives_Program.pdf | p.11, "Table 4. Historical Funding and Participation in EQIP", row Total |
| Lowest and highest year | 24.15% (FY2015), 45.86% (FY2018) | FY2009–2018 | same | p.11, Table 4 |
| Text | "Since FY 2009, there have been 3 times more applications than funded contracts." | – | same | p.10 |

No Iowa-specific or post-2018 funding rate was found in an official document.

## Missing

- Cereal rye and red clover: no NASS price (they are cover crops, not sold), no ISU seed price per pound or per acre, no yield. With D29, a cover crop without a price gives `no-data` income unless O4 models it as a cost only (seeding 19.05 USD/ac plus seed). Seed cost per acre is still missing.
- Iowa corn MY2025 final price (only the February 2026 preliminary 4.10 exists).
- Story County oats (only 2023) and alfalfa (none since 2013) yields; state yields used instead.
- A dated FY2027 Iowa payment schedule or booklet; the online rates in 4b have no fiscal year on the page.
- CSP enhancement rates for 340 or 328 in Iowa.
- Iowa share of EQIP applications funded, and any national figure after FY2018.
- Red clover as a frost-seeded cover in oats has no ISU budget line; the A1-20 hay establishment budget (p.9) covers alfalfa-grass with an oat companion, not red clover.

## How O4 maps this to `data/money/us.json`

- `campaign`: "prices MY2025 (NASS), costs ISU 2026, NRCS Iowa FY2026"; `currency`: "USD".
- `economics[]`, one row per crop, all values per hectare or tonne:
  - corn: `referenceYieldTPerHa` 13.05 (Story mean 2021–25), `pricePerT` 161.4 (Iowa MY2025 prelim.), `directCostsPerHa` 1,195.00 (corn after soybeans, variable), `year` 2025.
  - soybean: 4.23, 385.8, 717.12, 2025.
  - oats: 2.96 (Iowa mean, no county series), 244.6, 582.25, 2025. The ISU oat cost includes straw harvest; a grain-only cost would be lower.
  - alfalfa: 8.25 (Iowa mean), 119.0, 599.38 (4-ton budget; 804.03 for 6 tons), 2025. The ISU budgets assume 4 or 6 short t/ac; the Iowa mean is 3.68.
  - cereal rye, red clover: leave out of `economics` (no price); the engine then returns `no-data` for income of rotations with them, or O4 adds a cost-only rule through a [contract] PR.
- `payments[]`: use the FY2026 booklet rows as `confirmed: true` with `programme` "NRCS EQIP" and condition "if your application is selected; up to 5 years":
  - `nrcs-340-ia-fy26` 183.70 USD/ha (340-1 Single Species, regular rate), for rotations with a cover crop year.
  - `nrcs-328-ia-fy26-small-grain` 112.04 USD/ha (328-139), for rotations that add oats; `nrcs-328-ia-fy26-perennial` 127.01 USD/ha (328-138) for alfalfa; `nrcs-328-ia-fy26-basic` 28.49 USD/ha otherwise.
  - The online rates in 4b go in as `confirmed: false` if O4 wants the newer numbers visible but out of the sum.
- Sources: one `sourceRef` per value, title, URL and locator from the tables above. The excerpt files in `data/samples/research/us-ia/` back each one.

## Conversion basis (our calculation)

1 acre = 0.40468564 ha; 1 lb = 0.45359237 kg; 1 short ton = 0.90718474 t. Bushel weights: corn 56 lb, soybeans 60 lb, oats 32 lb, so 1 bu/ac = 0.06277 (corn), 0.06725 (soybeans), 0.03587 (oats) t/ha, and 1 short t/ac = 2.2417 t/ha. Cross-check against NASS "Crop Production 2025 Summary" (Jan 2026), pp.95 and 97, US 2025: corn 186.5 bu/ac = 11.71 t/ha, soybeans 53.0 bu/ac = 3.56 t/ha, oats 73.8 bu/ac = 2.65 t/ha, alfalfa 3.42 t/ac = 7.67 t/ha (excerpt `nass-crop-production-2025-summary-metric.txt`). The bushel weights themselves are not printed in any document we opened; O4 should cite the NASS metric table as the check.

## Notes on access

- NASS reports were downloaded from esmis.nal.usda.gov, USDA's own publication archive (the cornell.edu links redirect there).
- extension.iastate.edu sits behind a browser check; the files were opened in a normal browser, not scripted around.
- QuickStats CSVs come from the QuickStats web form ("Download Spreadsheet"); no API key was used.

AI use: Claude (Opus 5.5) found, opened and transcribed the documents and computed unit conversions; a team member should spot-check the locators before merge.
