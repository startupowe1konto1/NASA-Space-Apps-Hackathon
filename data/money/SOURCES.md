# Money tables: sources

`us-ia.json` and `pl.json` follow the `moneyFile` schema in `src/contracts/schemas.ts`. Every number was copied from a document or API response opened on Sat 14 Nov 2026 (task O4-A4). Each economics row has one source per value, and the locator starts with the value it backs (`yield:`, `price:` or `direct costs:`); `src/money/provider.ts` reads that prefix to give each value its dataset. Raw API responses are in `data/samples/nass-quickstats`, `data/samples/eurostat`, `data/samples/gus` and `data/samples/nrcs`.

Income built on these tables is a replay of past years at today's prices. It is not a forecast and it promises no yield.

## Iowa (USD), demo field in Story County

| Crop | Yield t/ha | Price USD/t | Direct costs USD/ha |
|---|---|---|---|
| maize | 13.046 | 161.41 | 1195.00 |
| soybean | 4.230 | 385.81 | 717.12 |

- Yield: USDA NASS Quick Stats, Story County survey yields 2021 to 2025, mean of the five years. Maize 207.84 bu/acre, soybean 62.9 bu/acre.
- Price: USDA NASS Quick Stats, Iowa price received, 2025 marketing year. Maize $4.10/bu, soybean $10.50/bu.
- Direct costs: Iowa State University, Ag Decision Maker File A1-20, Estimated Costs of Crop Production in Iowa 2026. The variable part of "Total fixed, variable, Per acre" in the middle yield column: corn following soybeans $483.60/acre (page 3), herbicide tolerant soybeans following corn $290.21/acre (page 5). Variable costs are seed, fertilizer, chemicals, crop insurance, interest and variable machinery. Land, labor and fixed machinery are left out, so the margin is comparable with the Polish "nadwyżka bezpośrednia".
- Conversions: 56 lb/bu for maize, 60 lb/bu for soybean, 0.45359237 kg/lb, 1 acre = 0.404686 ha.

## Poland (PLN), demo field near Poznań (Wielkopolskie)

| Crop | Yield t/ha | Price PLN/t | Direct costs PLN/ha |
|---|---|---|---|
| winter-wheat | 5.622 | 887.40 | 4367.49 |
| maize | 7.198 | 938.50 | 7015.30 |
| potato | 33.154 | 501.00 | 12851.53 |
| sugar-beet | 65.016 | 176.40 | 8283.87 |

- Yield: Eurostat `apro_cpnhr`, region PL41 Wielkopolskie. Eurostat publishes no regional yield for Poland, only area (`AR_THS_HA`) and harvested production (`HPRD_THS_T`), so the yield is production divided by area for each year 2020 to 2024 and then averaged (our calculation). Crop codes: C1111 winter wheat, C1500 grain maize, R1000 potatoes, R2000 sugar beet.
- Price: GUS, "Ceny produktów rolnych we wrześniu 2026 r.", Tablica 2, average procurement prices in Wielkopolskie for wheat, maize and potatoes (the potato price is mostly industrial potatoes, footnote c). GUS monthly tables have no sugar beet price, so sugar beet uses Eurostat `apri_ap_crpouta`, Poland, 2024 unit value in PLN per 1000 kg, the latest year in that table.
- Direct costs: WODR Poznań, "Kalkulacje rolnicze produkcji roślinnej", February 2026, the line "KOSZTY BEZPOŚREDNIE RAZEM (zł/ha)" for pszenica ozima, kukurydza na ziarno, ziemniaki przemysłowe and buraki cukrowe. They include seed, fertilizer, crop protection, variable machinery, contractor services and other variable costs. Industrial potatoes were picked to match the GUS price.

## Payments

| Row | Rate | Confirmed | Rule in `src/money/payments.ts` |
|---|---|---|---|
| NRCS EQIP 340 Cover Crop, Iowa | $74.75/acre = 184.71 USD/ha | no | years with a cover crop, as a share of the rotation |
| NRCS EQIP 328 Conservation Crop Rotation, Iowa | $36.84/acre = 91.03 USD/ha | no | at least two different annual main crops |
| Eco-scheme, winter cover crops or undersown crops | 5 points x 87.52 = 437.60 PLN/ha | no | years with a cover crop, as a share of the rotation |
| Eco-scheme, diverse crop structure | 3 points x 0.887902 x 87.52 = 233.13 PLN/ha | no | shares of annex 5, see below |
| Eco-scheme, straw mixed into the soil | 1 point x 87.52 = 87.52 PLN/ha | no | years with a cereal, maize, oilseed or legume grain crop |
| GAEC 7 crop rotation rule | 0, a pass or fail condition | yes | see below |

- NRCS: payment schedule tool at nrcs.usda.gov, cost list report for Iowa, Story County, schedule "Iowa EQIP-1", components "Any Species" (340) and "Basic, Multiple Annual Crops" (328), the standard rows, not HU or WP. The page does not say which fiscal year the schedule is for. NRCS fiscal year 2027 began on 1 Oct 2026, so the rate is not confirmed for a campaign and stays out of the income sum. The condition text says "only if your application is selected", because EQIP is competitive.
- Poland, rates: Dz.U. 2025 poz. 1397, the rates for 2025 (87.52 PLN per point, coefficient 0.887902 for the diverse crop structure). A search of the Sejm ELI database on 14 Nov 2026 found no regulation with the 2026 rates, so every eco-scheme row is unconfirmed. Points per practice: Dz.U. 2023 poz. 493 § 4 ust. 2, with the straw practice cut from 2 points to 1 by Dz.U. 2025 poz. 333. Dz.U. 2026 poz. 325 does not change the points.
- Poland, diverse crop structure: the rule is checked for the whole farm (Dz.U. 2023 poz. 493 § 8 and annex 2 part II point 5 as amended by Dz.U. 2023 poz. 1926). The tool applies the same shares to the years of one rotation: at least three crops, the largest at most 65%, crops from annex 5 list 1 (here field pea) at least 20%, cereals from list 2 (here winter wheat) at most 65%, crops from list 3 (sugar beet, potato) at most 30%.
- Poland, cover crops: the points need a winter cover crop mix of at least two species, sown 1 July to 1 October and kept until 15 February, or an undersown small-seeded legume (§ 6 and annex 2 part II point 2). Mustard or phacelia alone do not count; the condition text says so, because the rotation model does not record the mix.
- GAEC 7: Dz.U. 2025 poz. 1674 (unified text) § 5, still in force in 2026 after Dz.U. 2026 poz. 161 removed only ust. 12. On farms with more than 10 ha of arable land the same main crop may stay at most 3 years in a row; a cover crop or undersown crop after the main crop meets the rule; legumes, grasses and perennial crops are exempt. The farm-wide rule that 40% of arable land changes crop each year cannot be checked on one field and is named in the condition text.

## Missing

These crops have no row in `economics`, so income for a rotation with them is `no-data` with the crop named:

- Iowa, winter-wheat: Quick Stats has no Story County wheat yield after 1992, and File A1-20 has no wheat budget.
- Iowa, alfalfa: Quick Stats has no Story County alfalfa yield (the hay series is "excluding alfalfa" and stops in 2017). The Iowa alfalfa hay price and the A1-20 alfalfa budget exist; a state-level yield could fill the gap in a later task.
- Poland, field-pea: Eurostat `apro_cpnhr` has no field pea area or production for PL41 in 2020 to 2024. The price (Eurostat dried peas, 2024: 143.21 PLN/100 kg) and the WODR budget (groch jadalny, 3933.30 PLN/ha) exist.
- Cover crops (cereal-rye, red-clover, white-mustard, phacelia) are not sold, so they need no row; the provider skips them. Their seed cost is not in the tables yet.
- Polish eco-scheme rates for 2026 and the fiscal year of the NRCS Iowa schedule (see above).
