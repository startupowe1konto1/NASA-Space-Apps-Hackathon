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
| Hatfield and Prueger (2015), Temperature extremes: Effect on plant growth and development, Weather and Climate Extremes 10: 4-10, doi:10.1016/j.wace.2015.08.001 (open access copy opened) | https://pages.uoregon.edu/chendon/coffee_literature/old_literature/2015%20Weather%20Clim.%20Extremes,%20Temperature%20extremes%20on%20plant%20growth.pdf | page 5: maize pollen viability falls above 35 °C; soybean seed set falls from 30 to 35 °C and sterility is complete above 35 °C |
| FAO Irrigation and Drainage Paper 66, crop chapters | https://www.fao.org/4/i2800e/i2800e.pdf | wheat page 93 (frost at head development and flowering) and page 98 (above 34 °C during grain filling); soybean page 128 (frost at emergence and pod filling) and page 129 (flower and fruit abortion at 35 °C); potato page 187 (frost at 1 °C and less, heat at 35 °C or higher) |
| Barlow et al. (2013), Simulating the impact of extreme heat and frost events on wheat production: the first steps, MODSIM 2013 | https://mssanz.org.au/modsim2013/B2/barlow2.pdf | page 1: heat shock (>35 °C) and frost do most damage at ear emergence and anthesis; heat events cost 17-35 percent of yield |
| USDA NRCS and Iowa State University, Cereal Rye Cover Crop Fact Sheet for Iowa (May 2024) | https://www.nrcs.usda.gov/sites/default/files/2024-04/Cereal%20Rye%20Cover%20Crop%20Fact%20Sheet.pdf | seeding mid August to late October; grazing quality excellent; lasting residue excellent |
| USDA NRCS and Iowa State University, Red Clover Cover Crop Fact Sheet for Iowa (May 2024) | https://www.nrcs.usda.gov/sites/default/files/2024-05/Red%20Clover%20Crop%20Fact%20Sheet.pdf | winter seeding early August to mid September; grow until at least mid-May for nitrogen; grazing quality very good; lasting residue fair |
| Iowa State University Extension, Terminating cover crops ahead of corn (22 April 2026) | https://crops.extension.iastate.edu/post/terminating-cover-crops-ahead-corn | terminate the cover crop at least 10 days before planting corn |
| IUNG-PIB, Uprawa międzyplonów, instrukcja upowszechnieniowa (2025) | https://www.iung.pl/wp-content/uploads/2026/03/instrukcja.pdf | PDF pages 9, 13, 23-26: stubble catch crop sowing window, latest sowing dates for mustard and phacelia (Tabele 11 and 12), ARiMR rule to keep them until 15 October, termination in October, use of each species |

## How the numbers were derived

- Sowing and harvest month (Iowa): the month that holds the midpoint of the NASS "most active" window. Alfalfa has no planting date in NASS, so its sowing month is the spring oat window (Iowa State says alfalfa is usually sown with oats), and its harvest month is the end of the most active cutting window (15 September).
- Sowing and harvest month (Poland): the month of the mean of the 2024 and 2023 national trial dates in COBORU. COBORU gives national means, not Wielkopolska alone.
- Drought-sensitive months: FAO Paper 66 (page 6, below Table 1) names flowering and yield formation as the stages most sensitive to water stress. Where COBORU gives a flowering date (heading for wheat, silking for maize, start of flowering for pea), the sensitive months are that month and the next one. Otherwise the mid-season stage start comes from FAO-56 Table 11 counted from the sowing date, and the sensitive months are that month and the next one. For alfalfa hay each cut is a harvest, so the sensitive months are those with at least 10 days inside the NASS cutting window (June to September).
- Water need class: from the upper bound of the FAO Table 14 range. Up to 600 mm is low, 601 to 750 mm medium, above 750 mm high.
- Residue cover: crops on the NRCS high residue list are `high`, crops on the low residue list are `low`. Alfalfa hay is on the low residue list (residue removed) but is non-fragile, so it is `medium`.
- Forage: `true` only where the calendar source lists a forage use (Iowa "Corn for silage" and "Hay, alfalfa"; the COBORU silage maize series).
- Family and legume flag: copied from `src/fixtures/crops.ts`, as task O4-A2 requires.
- Heat: a source temperature for damage at flowering or grain filling is used as the threshold for the monthly maximum of NASA POWER T2M_MAX, in the same flowering and yield-formation months as drought. A short spell above the source temperature is enough to do the damage the sources describe, so the monthly maximum is compared with it directly.
- Frost: where a source says the crop is damaged by frost at a stage, the threshold is 1 frost day (NASA POWER FROST_DAYS) in the months of that stage. Wheat: heading and grain filling. Soybean (Iowa): emergence in May and pod filling in August and September (FAO-56 Table 11 stages from the sowing midpoint). Potato: emergence in May (FAO-56 initial stage from planting).
- Cover crops (`kind: 'cover'`): no water need or yield response factor (contract PR #44), and no hazard rows, since they are not harvested for yield. Sowing month is the midpoint of the seeding window for Iowa (NRCS fact sheets). For the Polish stubble catch crops it is August: IUNG gives the latest sowing date as 10 August (phacelia mixtures) or 15 August (mustard) and says they follow the cereal harvest, which COBORU puts in August. `harvestMonth` is the termination month. Residue: the NRCS Washington note puts any cover crop left on the field on the high residue list; a cover crop the note lists as fragile (mustard, fall seeded cover crops) is `medium`.

## Team rules of thumb

These values have no document behind them. Each row says so in a source entry titled "team rule of thumb" that points to SPEC section 7.

- Drought threshold 20: the 20th percentile of the field's own root-zone wetness (SPEC section 7).
- `lossShare` 0.2 for drought, and for heat and frost where no source gives a loss share: no opened document gives a share of yield lost in a damaging month. The income score uses the yield response factor for water shortfall, so the drought value only matters where the engine reads `lossShare` for drought. Winter wheat heat uses 0.17, the low end of the 17-35 percent loss in Barlow et al. (2013).

## Missing

Crops left out of the files, with the trait that has no opened source:

| Crop | File | Missing trait |
|---|---|---|
| oats | us-ia | yield response factor: FAO Paper 66 Table 1 (the FAO-33 seasonal values) has no oats value |
| spring-barley | pl | yield response factor: no barley value in FAO Table 1 (the calendar is in COBORU Zboża jare 2024, "JĘCZMIEŃ JARY. Warunki prowadzenia doświadczeń") |
| rye | pl | yield response factor and water need: not in FAO Table 1 or Table 14 (the calendar is in COBORU Zboża ozime 2024, "ŻYTO OZIME. Warunki prowadzenia doświadczeń") |
| winter-rapeseed | pl | yield response factor and water need: not in FAO Table 1 or Table 14 (the calendar is in COBORU Oleiste 2024, Tabela 5) |

Proxy values (for example the wheat Ky for oats or rye) were not approved, so these crops stay out until a document with their own Ky is opened.

Heat and frost rows missing (these crops have drought only):

| Crop | File | Missing |
|---|---|---|
| maize | us-ia, pl | frost: no opened source names a damaging frost stage for maize |
| alfalfa | us-ia | heat and frost |
| field-pea | pl | heat and frost |
| sugar-beet | pl | heat and frost |
| cover crops | us-ia, pl | not scored for hazards (not harvested for yield) |

FAO EcoCrop (https://ecocrop.apps.fao.org/ecocrop/srv/en/home) opened, but its name search returned no records on 14 Nov 2026, so it gave no thresholds.

## Opened but not used for values

- IUNG-PIB, "ABC wysiewu zbóż" (2023), https://www.iung.pl/wp-content/uploads/2023/07/ABC_wysiewu_zboz_zadanie8.pdf, page 15: optimal sowing in western Poland is the second half of September for winter wheat and 15 to 30 September for rye. COBORU trial means (6 October for wheat) were used instead, because COBORU also gives harvest and flowering dates from the same trials.
- FAO Crop Calendar API (https://api-cropcalendar.apps.fao.org/api/v1/countries): Poland is not among its 58 countries.
