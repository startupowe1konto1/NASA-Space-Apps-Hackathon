# Crop traits: sources

`us-ia.json` and `pl.json` hold one `CropTraits` row per crop (schema `cropTraits` in `src/contracts/schemas.ts`). Every value was copied from a document opened on Sat 14 Nov 2026 (task O4-A2). Each row lists its sources with a page, table or section.

## Sources used

| Source | URL | What was taken |
|---|---|---|
| USDA NASS, Field Crops Usual Planting and Harvesting Dates (Agricultural Handbook 628), October 2010 | https://esmis.nal.usda.gov/sites/default/release-files/vm40xr56k/dv13zw65p/w9505297d/planting-10-29-2010.pdf | Iowa table, page 39: most active planting and harvest windows for corn for grain, corn for silage, soybeans, winter wheat, spring oats and alfalfa hay |
| COBORU, Wyniki porejestrowych doświadczeń odmianowych: Zboża ozime 2024 (No. 219) | https://coboru.gov.pl/Publikacje_COBORU/Wyniki_PDO/WPDO_219_Zboza_ozime_2024.pdf | Tabela 2, page 37: winter wheat sowing, heading and harvest dates, national trial means 2024 and 2023 |
| COBORU, Kukurydza 2024 (No. 208) | https://coboru.gov.pl/Publikacje_COBORU/Wyniki_PDO/WPDO_kukurydza_2024.pdf | page 13: grain maize sowing, emergence and harvest dates; Tabela 4, page 14: days from emergence to silking |
| COBORU, Bobowate 2024 (No. 211) | https://coboru.gov.pl/Publikacje_COBORU/Wyniki_PDO/WPDO_211_Bobowate_2024.pdf | Tabela 3 (groch siewny), page 24: field pea sowing, flowering and harvest dates |
| COBORU, Burak cukrowy 2024 (No. 207) | https://coboru.gov.pl/Publikacje_COBORU/Wyniki_PDO/WPDO_207_Burak_cukrowy_2024.pdf | page 10: sugar beet sowing and harvest dates |
| COBORU, Ziemniak 2024 (No. 214) | https://coboru.gov.pl/Publikacje_COBORU/Wyniki_PDO/WPDO_214_Ziemniak_2024.pdf | Tabela 15, page 25: planting and harvest dates of mid-early and mid-late ware potatoes |
| FAO Irrigation and Drainage Paper 66, Crop yield response to water (2012) | https://www.fao.org/4/i2800e/i2800e.pdf | Table 1, page 6: seasonal yield response factors (Ky) from FAO Paper 33 |
| FAO Irrigation and Drainage Paper 56, chapter 6 | https://www.fao.org/4/x0490e/x0490e0b.htm | Table 11: stage lengths (initial, development, mid-season, late) used to place the mid-season stage when the calendar source gives no flowering date |
| FAO Irrigation Water Management Training Manual 3, chapter 3 | https://www.fao.org/4/s2022e/s2022e07.htm | Table 14: seasonal crop water need in mm, turned into the water need class |
| USDA NRCS Washington, Technical Note Agronomy 22 (2025) | https://nrcs.usda.gov/plantmaterials/wapmctn15062.pdf | pages 3 to 5: high residue and low residue crop lists, fragile and non-fragile residue list |
| USDA NRCS Nebraska Conservation Planning Sheet No. 4, Crop Residue Management (2006) | https://www.mssoy.org/sites/default/files/documents/residue-mgmt-nrcs-2006.pdf | section "Residue type": soybeans are a low residue crop |
| Iowa State University Extension, Alfalfa Seeding Recommendations (17 April 2024) | https://crops.extension.iastate.edu/post/alfalfa-seeding-recommendations | alfalfa is commonly spring-planted with an oat companion crop |

## How the numbers were derived

- Sowing and harvest month (Iowa): the month that holds the midpoint of the NASS "most active" window. Alfalfa has no planting date in NASS, so its sowing month is the spring oat window (Iowa State says alfalfa is usually sown with oats), and its harvest month is the end of the most active cutting window (15 September).
- Sowing and harvest month (Poland): the month of the mean of the 2024 and 2023 national trial dates in COBORU. COBORU gives national means, not Wielkopolska alone.
- Drought-sensitive months: FAO Paper 66 (page 6, below Table 1) names flowering and yield formation as the stages most sensitive to water stress. Where COBORU gives a flowering date (heading for wheat, silking for maize, start of flowering for pea), the sensitive months are that month and the next one. Otherwise the mid-season stage start comes from FAO-56 Table 11 counted from the sowing date, and the sensitive months are that month and the next one. For alfalfa hay each cut is a harvest, so the sensitive months are those with at least 10 days inside the NASS cutting window (June to September).
- Water need class: from the upper bound of the FAO Table 14 range. Up to 600 mm is low, 601 to 750 mm medium, above 750 mm high.
- Residue cover: crops on the NRCS high residue list are `high`, crops on the low residue list are `low`. Alfalfa hay is on the low residue list (residue removed) but is non-fragile, so it is `medium`.
- Forage: `true` only where the calendar source lists a forage use (Iowa "Corn for silage" and "Hay, alfalfa"; the COBORU silage maize series).
- Family and legume flag: copied from `src/fixtures/crops.ts`, as task O4-A2 requires.

## Team rules of thumb

These values have no document behind them. Each row says so in a source entry titled "team rule of thumb" that points to SPEC section 7.

- Drought threshold 20: the 20th percentile of the field's own root-zone wetness (SPEC section 7).
- Drought `lossShare` 0.2: no source gives a share of yield lost in a drought month. The income score uses the yield response factor for water shortfall, so this number only matters where the engine reads `lossShare` for drought.

## Missing

Crops left out of the files, with the trait that has no opened source:

| Crop | File | Missing trait |
|---|---|---|
| oats | us-ia | yield response factor: FAO Paper 33/66 Table 1 has no oats value |
| cereal-rye (cover) | us-ia | yield response factor and water need: no FAO value for rye; no sowing calendar opened for the cover crop |
| red-clover (cover) | us-ia | yield response factor and water need: no FAO value; no sowing calendar opened for the cover crop |
| spring-barley | pl | yield response factor: no barley value in FAO Table 1 (the calendar is in COBORU Zboża jare 2024, Tabela "JĘCZMIEŃ JARY. Warunki prowadzenia doświadczeń") |
| rye | pl | yield response factor and water need: not in FAO Table 1 or Table 14 (the calendar is in COBORU Zboża ozime 2024, "ŻYTO OZIME. Warunki prowadzenia doświadczeń") |
| winter-rapeseed | pl | yield response factor and water need: not in FAO Table 1 or Table 14 (the calendar is in COBORU Oleiste 2024, Tabela 5) |
| white-mustard (cover) | pl | yield response factor, water need and sowing calendar |
| phacelia (cover) | pl | yield response factor, water need and sowing calendar |

Hazard rows left out of every crop:

- Heat and frost: no crop-specific monthly maximum temperature or frost-day threshold was found in an opened document. FAO EcoCrop (https://ecocrop.apps.fao.org/ecocrop/srv/en/home) opened but its search returned no records on 14 Nov 2026. The `sensitive` arrays therefore hold drought only, and the engine will not count heat or frost damage for any crop until thresholds are sourced.

## Opened but not used for values

- IUNG-PIB, "ABC wysiewu zbóż" (2023), https://www.iung.pl/wp-content/uploads/2023/07/ABC_wysiewu_zboz_zadanie8.pdf, page 15: optimal sowing in western Poland is the second half of September for winter wheat and 15 to 30 September for rye. COBORU trial means (6 October for wheat) were used instead, because COBORU also gives harvest and flowering dates from the same trials.
- FAO Crop Calendar API (https://api-cropcalendar.apps.fao.org/api/v1/countries): Poland is not among its 58 countries.
