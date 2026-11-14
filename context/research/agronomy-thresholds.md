# Agronomy thresholds for `data/crops` (research R10)

Research for O4. It fills gaps listed in `data/crops/SOURCES.md` on `main` and helps two open PRs: #59 (oats, rye, spring barley, rapeseed) and #58 (heat and frost thresholds). Nothing here is in `data/` yet; O4 decides what goes in.

Every value below was copied from a document opened on Sat 14 Nov 2026. Each source has an excerpt file in `data/samples/research/agronomy/` with the quoted text and its page or table. Rows marked "missing" were searched for and not found; nothing was filled from memory and no proxy values (one crop's number used for another) are given.

## How the numbers fit NASA POWER monthly data

The engine reads two NASA POWER monthly parameters for heat and frost. Their definitions, from the saved sample `data/samples/power/parameters-frost-tmax-gwetroot.json`:

- `T2M_MAX` (monthly): "The maximum hourly air (dry bulb) temperature at 2 meters above the surface of the earth in the period of interest." It is the single hottest hour of the month, not a mean of daily maxima.
- `FROST_DAYS` (monthly): "A frost day occurs when the 2m temperature cools to the dew point temperature and both are less than 0 C or 32 F."

Conversion rules used in the tables:

1. Heat. A source temperature for damage (for example "above 30-32 °C during grain filling") is a short-spell limit, so it is compared with monthly `T2M_MAX` as it stands: a month whose hottest hour passes the limit counts as a heat month. This is the rule `data/crops/SOURCES.md` already uses. Where the source gives a range, the low end is listed as the threshold and the range is kept in the row.
2. Frost. `FROST_DAYS` counts days that reach 0 °C with frost forming; it does not say how far below 0 °C the air went. A source temperature for frost damage (for example -2 °C at heading) can therefore only be mapped as "at least 1 frost day in the months of that stage" (threshold 1, the existing rule). The temperature itself goes into the source locator so a reader can see that the mapping is coarser than the source.
3. °F to °C: (°F - 32) × 5/9, rounded to the nearest 0.5 °C.
4. Months: the stage's months come from a calendar source for the region (USDA NASS or ISU for Iowa, COBORU or IUNG for Poland), named in each row. Where only the stage is known, the months column says which existing `data/crops` calendar was used.

Winterkill limits (rapeseed, winter cereals) are minimum air temperatures, often with and without snow cover. Neither monthly parameter above measures them. NASA POWER also publishes a monthly `T2M_MIN` ("The minimum hourly air (dry bulb) temperature at 2 meters ... in the period of interest") and snow depth `SNODP` in cm (saved: `data/samples/research/agronomy/power-parameters-t2m-min-snodp.json`); using them would need a [contract] PR, so this file only lists the source values.

## 1. Yield response factor Ky

FAO Paper 33 (Doorenbos and Kassam 1979) has no copy on fao.org, so its stage table (Table 24) was not opened. The stage values below come from FAO Paper 66 Table 2, FAO Water Reports 22 and the FAO crop information pages, which all quote FAO-33.

| Crop id | Ky | Stage | Source | URL | Locator | Excerpt |
|---|---|---|---|---|---|---|
| winter-rapeseed | 1.52 | whole season (R² 0.73), winter canola, Sofia, Bulgaria, 2010-2013 | Moteva et al. (2016), Water use efficiency and yield-dependences for canola under irrigation, Agriculture & Forestry 62(1): 403-413 | https://repository.ukim.mk/bitstream/20.500.12188/28014/1/20160330-42%20Moteva%20et%20al.pdf | Summary p. 403; Results p. 408; Conclusion 4 p. 411 | `ky-moteva-2016-canola.txt` |
| winter-rapeseed | 0.87 | whole season (R² 0.71), Thrace, Turkey | Istanbulluoglu et al. (2010), Effects of deficit irrigation regimes on the yield and growth of oilseed rape, Biosystems Engineering | https://search.isc.ac/Inventory/10/1267486.htm | abstract only; full text paywalled, not opened | `ky-istanbulluoglu-2010-rapeseed.txt` |
| spring-barley | 0.16 (1985), 0.61 (1986) | drought in early grain filling | Andersen, Jensen and Lösch, Interaction of potassium and drought in barley, IPI 1/1994 (short version of Acta Agric. Scand. B 42: 34-44, 1992); Jyndevad, Denmark, sandy soil | https://www.ipipotash.org/uploads/pdf/review/11_1994_6.pdf (read through web.archive.org snapshot 20190412092525) | PDF p. 10, Table 5, ky(P) | `ky-andersen-1992-spring-barley.txt` |
| spring-barley | 0.42 (1986) | drought at flowering | same | same | Table 5, ky(P) | same |
| spring-barley | 0.38 (1985); 1.48 and 1.50 (1986) | whole growth period | same | same | Table 5, ky(PT) | same |
| field-pea | 0.2 / 0.9 / 0.7 / 0.2; season 1.15 | initial / development / mid-season / late | FAO Land & Water, crop information "Pea" (FAO-33 based) | https://www.fao.org/land-water/databases-and-software/crop-information/pea/en/ (now 404; read through web.archive.org snapshot 20250907125315) | stage table, row "Yield Response Factor, Ky" | `ky-fao-cropinfo-pea.txt` |
| potato | 0.60 / – / 0.70 / 0.20; season 1.10 | initial / development / mid-season / late | Steduto et al. (2012), FAO Irrigation and Drainage Paper 66, Table 2 (FAO-33 column) | https://www.fao.org/4/i2800e/i2800e.pdf | book p. 12 (PDF p. 27), Table 2 | `ky-fao66-tables-1-2.txt` |
| potato | 0.60 / – / 0.70 / 0.20; continuous 1.10 | same stages | Moutonnet (2002), Yield response factors of field crops to deficit irrigation, FAO Water Reports 22 | https://www.fao.org/4/y3655e/y3655e04.htm | Table 1 | `ky-fao-wr22-moutonnet.txt` |
| potato | 0.2 / 0.8 / – / 1.0; season 0.85 | initial / development / mid-season / late | FAO Land & Water, crop information "Potato" | https://www.fao.org/land-water/databases-and-software/crop-information/potato/en/ (web.archive.org snapshot 20260624043347) | stage table, Ky row | `ky-fao-cropinfo-potato.txt` |
| sugar-beet | 0.80 and 0.90 | continuous deficit (FAO); 0.95 and 1.07 in the IAEA Morocco trial | Moutonnet (2002), FAO Water Reports 22 | https://www.fao.org/4/y3655e/y3655e04.htm | Tables 1 and 2 | `ky-fao-wr22-moutonnet.txt` |
| sugar-beet | 0.86 / 0.74 / 0.64 | whole season / yield formation and ripening / vegetative and yield formation (Morocco) | Kirda (2002), FAO Water Reports 22, citing Bazza and Tayaa (1999) | https://www.fao.org/4/y3655e/y3655e03.htm | Table 1 | `ky-fao-wr22-kirda.txt` |
| maize (reference) | 0.40 / 1.50 / 0.50 / 0.20; season 1.25 | initial / development / mid-season / late | FAO Paper 66, Table 2 (FAO-33 column) | https://www.fao.org/4/i2800e/i2800e.pdf | book p. 12 (PDF p. 27) | `ky-fao66-tables-1-2.txt` |
| soybean (reference) | 0.20 / 0.80 / 1.00 / –; season 0.85 | initial / development / mid-season / late | FAO Paper 66, Table 2 | same | same | same |
| winter-wheat (reference) | 0.20 / 0.60 / 0.50 / –; season 1.00 | initial / development / mid-season / late | FAO Paper 66, Table 2 (Table 1 of the same paper gives 1.05 for the season) | same | same | same |

Notes on the Ky rows:

- Winter rapeseed: the two seasonal values disagree (1.52 against 0.87). The Bulgarian value is from a temperate-continental winter canola trial and is the closer match to Wielkopolska. The Turkish value was read from an abstract on a third-party index, not the paper, so it does not meet D28 as it stands.
- Spring barley: one Danish sandy-soil study, and the value swings about threefold between years. It is a measured Ky for barley, but a weak base for an income replay.
- The FAO crop information pages are official FAO text, but they are no longer live, so they were read through the Internet Archive. D28 says a third-party mirror may not be cited; O4 or O1 should decide whether an archived copy of an official page counts. FAO Paper 66 and FAO Water Reports 22 were opened on fao.org itself.
- The potato row on the FAO crop page looks inconsistent with FAO-33 (late 1.0, season 0.85 against 1.1). FAO Paper 66 and Water Reports 22 agree with each other, so use those.

## 2. Heat and frost thresholds by crop stage

"As given" is the source's own number and unit. "POWER rule" is the mapping proposed under the conversion rules above. Polish months come from COBORU variety trials at Śrem (Wielkopolska), one season per crop, so they are an example year, not a mean. Iowa months come from the dates in the Iowa State articles unless the row says otherwise.

### 2a. Maize, soybean, cereals, alfalfa, field pea

| Crop id | Hazard | As given | °C | Stage | Months Iowa | Months Poland | POWER rule | Source | URL | Locator | Excerpt |
|---|---|---|---|---|---|---|---|---|---|---|---|
| maize | frost | "28 oF or lower for a couple of hours will be lethal to growing tissue that has emerged"; 28-32 °F "minimal frost injury" | -2.0 lethal | emerged seedling | May | May (sown 6 May, emerged 19 May, Śrem 2025) | FROST_DAYS ≥ 1 in May | Licht (2020), Cold temperatures on the way; what will it mean for corn and soybean seedlings?, ISU Integrated Crop Management | https://crops.extension.iastate.edu/post/cold-temperatures-way-what-will-it-mean-corn-and-soybean-seedlings | paragraphs 8-9 | `hf-isu-spring-cold-seedlings.txt`, `hf-coboru-wedo-kukurydza-2025.txt` |
| maize | frost | "A freeze of 28 oF or less for a couple hours will result in whole plant death"; yield loss 12 % (late dent) to 41 % (beginning dent) | -2.0 | dent, before black layer | October (article of 7 Oct 2019) | September (full maturity 1 Oct, Śrem 2025) | FROST_DAYS ≥ 1 in the month before maturity; lossShare 0.12-0.41 from the same page | Licht and Hurburgh (2019), Harvest consideration for frost killed corn, ISU ICM | https://crops.extension.iastate.edu/post/harvest-consideration-frost-killed-corn | paragraphs 7 and 9 | `hf-isu-corn-fall-frost.txt` |
| maize | frost (PL) | "Spadki temperatury poniżej -2ºC powodują przerwanie wegetacji" (drops below -2 °C stop growth) | -2.0 | grain fill, before maturity | – | harvest "w drugiej lub trzeciej dekadzie września" at the earliest | as above | Księżak et al. (2015), Uprawa kukurydzy w systemie ekologicznym, IUNG-PIB Instrukcja 200 | https://www.iung.pl/wp-content/uploads/2023/09/Instrukcja-Uprawa-kukurydzy-w-systemie-ekologicznym.pdf | PDF pp. 22 and 24 | `hf-iung-kukurydza-ekologiczna-2015.txt` |
| maize | heat | "greater than 95 oF" heat stress; pollen "not killed until ... above 100 oF" | 35.0 stress; 38.0 pollen kill | 2 weeks either side of pollination | July | July (silking 26 Jul, Śrem 2025) | T2M_MAX > 35 in July (matches the 35 °C already in `data/crops`) | Licht and Archontoulis (2020), What impact will the heat and dry weather have on pollination 2020?, ISU ICM | https://crops.extension.iastate.edu/post/what-impact-will-heat-and-dry-weather-have-pollination-2020 | paragraphs 7-8 | `hf-isu-corn-pollination-heat.txt` |
| soybean | frost | cotyledons survive "unless there were several hours of temperatures below 30 oF"; growing point not killed "down to 28 oF" | -1.0 / -2.0 | emergence | May | May (emerged 14 May, Śrem 2022) | FROST_DAYS ≥ 1 in May (matches `data/crops`) | Licht (2020), ISU ICM, as above | https://crops.extension.iastate.edu/post/cold-temperatures-way-what-will-it-mean-corn-and-soybean-seedlings | paragraph 10 | `hf-isu-spring-cold-seedlings.txt`, `hf-coboru-wedo-bobowate-2022.txt` |
| soybean | frost | "below 32°F can damage soybean leaves ... below 30°F for an extended time periods can damage the stems, pods, and seeds. A killing freeze is considered to be 28°F"; at R7 "minimally affected" | 0.0 / -1.0 / -2.0 | green pods, before R7 | October (frost of 11-13 Oct 2019) | September (harvest maturity 22 Sep, Śrem 2022) | FROST_DAYS ≥ 1 in the pod-filling months | Hurburgh, Vittetoe and Anderson (2019), Frost Damage to Soybeans, ISU ICM | https://crops.extension.iastate.edu/post/frost-damage-soybeans | paragraphs 1-3 | `hf-isu-soybean-fall-frost.txt` |
| soybean | heat | "ideal temperature ... is 85℉. When temperatures exceed this threshold, especially for several subsequent days, heat stress can occur" | 29.5 | flowering to R5 | no Iowa source (North Carolina page) | late June to July (flowering 23 Jun-18 Jul, Śrem 2022) | not proposed: 85 °F is an optimum, not a damage limit; keep the 35 °C from Hatfield and Prueger already in `data/crops` | NC State Extension (2020), How Do High Temperatures Impact My Soybeans? | https://soybeans.ces.ncsu.edu/news/how-do-high-temperatures-impact-my-soybeans/ | paragraphs 2-4 | `hf-ncsu-soybean-heat.txt` |
| winter-wheat | frost | Table 1, two hours: tillering 12 F (-11 C); jointing 24 F (-4 C); boot 28 F (-2 C); heading and flowering 30 F (-1 C), yield effect "Severe"; milk and dough 28 F (-2 C) | as given in °C | tillering to dough | Kansas months only: jointing late Mar-Apr, heading first 3 weeks of May | jointing 5 Apr, heading 20 May, soft dough 10 Jul (Śrem 2024) | FROST_DAYS ≥ 1 in May and June (heading to grain fill; matches `data/crops`) | Shroyer, Mikesell and Paulsen (1995), Spring Freeze Injury to Kansas Wheat, C646, Kansas State University | https://bookstore.ksre.ksu.edu/pubs/C646.PDF | p. 2 Table 1; pp. 5-6 months | `hf-ksu-c646-wheat-freeze.txt`, `hf-coboru-wedo-zboza-ozime-2024.txt` |
| spring-barley | heat | "High temperatures (above 30-32 ºC) accelerate seed development towards maturity, shortening the grain filling period ... noticeable even if periods of high temperature are short (even only 3 days)" | 30 (low end of 30-32) | grain filling | – | grain-fill months from the COBORU Zboża jare calendar used in #59 (not opened here) | T2M_MAX > 30 in the grain-filling months | Steduto et al. (2012), FAO Irrigation and Drainage Paper 66, barley chapter | https://www.fao.org/4/i2800e/i2800e.pdf | book p. 139 (PDF p. 154) | `hf-fao66-crop-chapters.txt` |
| spring-barley | frost | no number; barley ranked the small grain "which is most susceptible" | – | spring stages | – | – | none | Reed (2026), Will Late Spring Low Temperatures Affect Small Grains?, Penn State Extension | https://extension.psu.edu/will-late-spring-low-temperatures-affect-small-grains | hardiness paragraph | `hf-psu-small-grains-freeze.txt` |
| rye | frost | no number; "cereal rye is cold hardier than all other small grains" | – | spring stages | – | jointing 20 Mar, heading 30 Apr, soft dough 12 Jul (Śrem 2024) | none | Penn State, as above | same | same | `hf-psu-small-grains-freeze.txt`, `hf-coboru-wedo-zboza-ozime-2024.txt` |
| alfalfa | frost | "more severe damage ... below 25°F for four or more hours"; "upper 20s" °F hurt only the top leaves | -4.0 severe | spring regrowth; seedlings after the 2nd trifoliate leaf | not given | not given | FROST_DAYS ≥ 1 in the regrowth months, once a month source is found | Bauder (2026), Effects of Late Spring Frost on Alfalfa, South Dakota State University Extension | https://extension.sdstate.edu/effects-late-spring-frost-alfalfa | paragraphs 1-2 | `hf-sdsu-alfalfa-spring-frost.txt` |
| field-pea | frost | "Seedlings are tolerant of spring frosts in the low 20s" °F; regrow from below ground up to about 7 nodes | -6.5 to -5.0 tolerated | seedling | – | emergence mid-April to early May (COBORU national, no Wielkopolska site) | none: the source gives tolerance, not damage | Endres et al. (2016), Field Pea Production A1166, NDSU Extension (copy hosted by Washington State University) | https://wpcdn.web.wsu.edu/extension/uploads/sites/54/2013/12/FieldPeaProduction_NDExtension_a1166.pdf | pp. 3-4 | `hf-ndsu-a1166-field-pea.txt`, `hf-coboru-wedo-bobowate-2022.txt` |
| field-pea | heat | "A few days of heat above 29°C in the field causes flower and young pod abortion" | 29 | flowering | – | June (flowering starts 1-16 Jun, COBORU 2021-22) | T2M_MAX > 29 in June | Bueckert, Pea yield formation in warming temperatures, Saskatchewan Pulse Growers research listing (University of Saskatchewan project) | https://saskpulse.com/research/listing/pea-yield-formation-in-warming-temperatures-phenological-mechanisms/ | Project Description | `hf-saskpulse-pea-heat.txt` |

Exposure times differ: the Kansas wheat table is for two hours, the Iowa State pages say "a couple of hours" or "several hours", and the alfalfa page says "four or more hours". Monthly POWER data cannot tell how long a cold spell lasted.

### 2b. Winter rapeseed, sugar beet, potato (Poland)

| Crop id | Hazard | As given | °C | Stage | Months Poland | POWER rule | Source | URL | Locator | Excerpt |
|---|---|---|---|---|---|---|---|---|---|---|
| winter-rapeseed | frost (winterkill) | "zimą znosi spadki temperatur do -15°C, ale niebezpieczne mogą być długotrwałe mrozy bez pokrywy śnieżnej" (in winter it withstands drops to -15 °C, but long frosts without snow cover can be dangerous) | -15 | hardened plants in winter | December to February | not expressible with FROST_DAYS; needs monthly T2M_MIN < -15 with SNODP near 0 (contract change) | Kowalska, Tyburski and Antkowiak (2025), Instrukcja uprawy rzepaku ozimego ... w systemie ekologicznym, IOR-PIB | https://www.ior.poznan.pl/plik,4965,instrukcja-uprawy-rzepaku-ozimego-ze-szczegolnym-uwzglednieniem-ochrony-w-systemie-ekologicznym-pdf.pdf | PDF p. 5 | `hf-ior-rzepak-ekologiczny-2025.txt` |
| winter-rapeseed | frost (winterkill) | "do - 15°C bez okrywy śnieżnej"; with 5-10 cm of snow plants "przetrzymują temperatury do -20 °C"; hardiness "wzrasta do połowy stycznia, po czym powoli maleje" (rises until mid-January, then slowly falls) | -15 without snow; -20 under 5-10 cm snow | hardened plants | December to February | as above | Markowicz and Tratwal (IOR-PIB) (2023), Rzepak. Przewodnik Rolnictwa Regeneratywnego, Fundacja Terra Nostra and EIT Food (an NGO guide citing Muśnicki 2003) | https://assets.eitfood.eu/files/1-RZEPAK-RAPESEED_Przewodnik-Rolnictwa-Regeneratywnego_EIT_FUNDACJA-TERRANOSTRA_RZEPAK-RAPESEED-PL-EN-A4-2.pdf | PDF p. 7 (PL), p. 29 (EN) | `hf-eit-terranostra-rzepak-2023.txt` |
| winter-rapeseed | frost (winterkill, field report) | damage after "spadkami temperatur poniżej -10 °C w drugiej połowie stycznia i w lutym" on fields "ze słabiej rozwiniętymi roślinami" (weakly developed plants) | below -10 without snow | weak plants after snow melt | late January, February | as above | Grabiński (2017), Ocena stanu zasiewów ... marzec 2017, IUNG-PIB | https://iung.pl/wp-content/uploads/2017/04/Ocena-stanu-przezimowania-2017-zboza-i-rzepak.pdf | PDF pp. 1 and 3 | `hf-iung-przezimowanie-2017.txt` |
| winter-rapeseed | (hardening condition) | rosette of "6–10 liści", root collar wider than 8 mm at winter entry; leaf growth stops at about 5 °C air, root growth at about 2 °C soil | – | autumn rosette | autumn | context for a future rule, not a threshold | Podleśna (2014), Potrzeby pokarmowe i nawożenie rzepaku ozimego, Studia i Raporty IUNG-PIB 37(11) | https://bc.iung.pl/bitstreams/5d343c43-cfe7-4650-983a-4a10aa0bbaf9/download | printed pp. 113-114 | `hf-iung-podlesna-2014-rzepak-rozeta.txt` |
| winter-rapeseed | heat | "high-temperature stress can occur at >25 ◦C in OSR, with >29 ◦C leading to >50 % reduction in seed yield" | 29 (yield loss above 50 %) | flowering | flowering month from the COBORU Oleiste calendar used in #59 (not opened here) | T2M_MAX > 29 in the flowering month; lossShare 0.5 is the lower bound the source gives | Tidy et al. (2025), Plant Stress 17: 100957 (open access, literature summary) | https://repository.rothamsted.ac.uk/id/eprint/33546/1/Tidy%20et%20al%202025%20Plant%20Stress.pdf | PDF p. 3, Introduction | `hf-tidy-2025-osr-heat-cold-flowering.txt` |
| potato | heat | "Temperatures above 25 ℃ have been found to delay tuberisation"; 35 ℃ day and 28 ℃ night "may completely inhibit tuberisation" | 25 delay; 35 stop | tuber initiation | June, July (from the potato calendar in `pl.json`, not from this source) | keep the 35 °C already in `data/crops` (FAO-66 p. 187). 25 °C is passed by the monthly hottest hour almost every summer, so it would mark nearly all years | Kiongo et al. (2025), Potato Research 68: 855-875 (open access) | https://repository.up.ac.za/bitstreams/e6d9c3ec-456a-4d05-9a80-cbeff9687e39/download | PDF p. 2, Introduction | `hf-kiongo-2025-potato-heat-tuberisation.txt` |
| potato | frost | "The temperature for frost or cold stress for potato is considered 1 oC and less" | 1 | not tied to a stage | May (emergence, as in `pl.json`) | FROST_DAYS ≥ 1 (already in `data/crops`) | FAO Paper 66, potato chapter | https://www.fao.org/4/i2800e/i2800e.pdf | book p. 187 (PDF p. 202) | `hf-fao66-crop-chapters.txt` |
| sugar-beet | frost | no damaging temperature; "Planting should be done when soil temperature is higher than 4 °C and the risks of frost is nil" | – | sowing | April | none | FAO Paper 66, sugar beet chapter | https://www.fao.org/4/i2800e/i2800e.pdf | book p. 202 (PDF p. 217) | `hf-fao66-crop-chapters.txt` |

## 3. Cover crop sowing and termination windows

| Crop id | Country | What | Window | Months | Source | URL | Locator | Excerpt |
|---|---|---|---|---|---|---|---|---|
| white-mustard, phacelia | PL | sow, ARiMR rule for a stubble catch crop (mixture of at least 2 species, not cereals only) | sow 1 July to 20 August; keep until 15 October or 8 weeks from sowing | July to October | Podleśny and Leszczyńska (2025), Międzyplony, IUNG-PIB presentation, which states the ARiMR requirements | https://www.iung.pl/wp-content/uploads/2026/03/Prezentacja-miedzyplony-2025.pdf | slide 5 | `cover-iung-miedzyplony-prezentacja-2025.txt` |
| white-mustard, phacelia | PL | sow, ARiMR rule for a winter catch crop | sow 1 July to 1 October; keep until 15 February; mulching only after 15 November | July to February | same | same | slide 5 | same |
| white-mustard, phacelia | PL | recommended latest sowing | by 15 August (mustard 20 kg/ha, phacelia 10 kg/ha, mixture 15 + 5); phacelia with legumes by 10 August | August | same | same | slides 29-30 | same |
| white-mustard | PL | effect of sowing date | dry matter 1.34 t/ha sown 10 August against 0.91 t/ha sown 20 August (values paired from the chart's text order; check the slide image) | August | same, citing Wilczewski (2023) | same | slide 31 | same |
| white-mustard, phacelia | PL | terminate | chop and work in as green manure in the third ten days of October or early November, or leave as winter mulch and work in in spring | late October, November, or spring | Sułek, Podleśny and Hołubowicz-Kliza (2025), Uprawa międzyplonów, IUNG-PIB | https://www.iung.pl/wp-content/uploads/2026/03/instrukcja.pdf | PDF p. 26 (also p. 13) | `cover-iung-uprawa-miedzyplonow-instrukcja-2025.txt` |
| phacelia, white-mustard | PL | growth stop and frost | growth stops below 5 °C; phacelia survives autumn frosts "do minus 7-10oC"; mustard tolerates frost (no number) | September, October | same | same | PDF pp. 14, 22, 24, 34 | same |
| white-mustard, phacelia | PL | old rule (2021 greening, archived) | 1 July to 20 August; keep at least until 15 October, or 8 weeks with a declaration | July to October | ARiMR (2021), Międzyplony i okrywa zielona | https://www.gov.pl/web/arimr/miedzyplony-i-okrywa-zielona-21 | section "Międzyplony i okrywa zielona" | `cover-arimr-efa-miedzyplony-2021.txt` |
| cereal-rye | US-IA | overseed into standing corn or soybean | last week of August to first week of September; cue: corn leaves firing up to the ear leaf, or soybean canopy starting to yellow; 60-70 lb/ac | August, September | Licht and Clemens (2021), Considerations when overseeding cover crops, ISU ICM News, 13 July 2021 | https://crops.extension.iastate.edu/cropnews/2021/07/considerations-when-overseeding-cover-crops | article body | `cover-isu-overseeding-2021.txt` |
| cereal-rye, red-clover | US-IA | interseed | into corn at dough stage (R4) ahead of soybean; near soybean leaf drop ahead of corn; drill after harvest if hot and dry | August, September (stage dates, months not in the source) | Iowa Soybean Association (2025), Guide to successful cover crops (industry flyer, not ISU) | https://iasoybeans.com/PDFLibraryUploads/RCFI25_Flyer_Guide%20to%20Successful%20Cover%20Crops.pdf | p. 1, system boxes | `cover-isa-cover-crop-guide-2025.txt` |
| cereal-rye | US-IA | terminate | cover at least 8-12 in tall; spray when days are above 60 °F (15.5 °C) and nights above 40 °F (4.5 °C); roller-crimp rye at anthesis or later | April, May (months not in the source) | same | same | p. 1, Termination box | same |
| cereal-rye | US-IA | terminate before corn | at least 10 days before planting corn; trials compared more than 14 days before planting, 3-7 days before and 0-3 days after | spring, before corn planting (May in NASS) | Robertson and Licht (2026), Terminating cover crops ahead of corn, ISU ICM | https://crops.extension.iastate.edu/post/terminating-cover-crops-ahead-corn | introduction, Fig. 1, Recommendations | `cover-isu-termination-before-corn-2026.txt` |

## Missing

Searched for, documents opened, nothing usable found:

- Ky for oats and rye: no measured value in FAO Water Reports 22 (all chapters opened), FAO Paper 66, or the Polish sources reached. Two candidate papers did not open (core.ac.uk download behind a cookie wall; MDPI Agriculture 13(7): 1315 "Access Denied"); a Polish paper on agro.icm.edu.pl sits behind a bot wall.
- Ky by stage for winter rapeseed and alfalfa: both opened sources give a seasonal value only; the FAO alfalfa page has "- - - - 1.1".
- FAO Paper 33 itself: no copy on fao.org.
- Spring barley frost and rye frost and heat: ranking only, no number. The University of Idaho bulletin 724 table did not survive text extraction.
- Winter wheat heat at grain fill: the Kansas State pages are JavaScript-only. The existing 34 °C in `data/crops` (FAO-66 p. 98) stays the only value.
- Soybean heat damage number: the Mississippi State page is behind a bot wall; the North Carolina page gives only the 85 °F optimum.
- Alfalfa heat (hay): no number. FAO-66 gives 27 °C for seed yield only.
- Alfalfa frost months, Iowa and Poland: not found.
- Field pea autumn frost: NDSU says only "tolerant to minor frost".
- Sugar beet frost at emergence or on roots in autumn: no opened source gives a number (IOR-PIB beet protection method, a farm press article; the Springer paper is paywalled, USDA ARS Kimberly reprints timed out).
- Potato frost on foliage beyond the FAO-66 "1 oC and less": MDPI paper bot-blocked; no IUNG or IHAR text found.
- Winter rapeseed frost at bolting or flowering in °C: none (Tidy et al. is qualitative; AHDB growth guide PDFs returned "BlobNotFound").
- The current (2023-2027) catch-crop rule on gov.pl or ARiMR: not opened; the dates come from the IUNG 2025 slide that quotes them. The 2021 gov.pl page is the archived greening rule.
- Iowa: NRCS 340 seeding-date table by zone (nrcs.usda.gov timed out), red clover frost seeding and termination dates (Practical Farmers of Iowa and ISU pages blocked or empty), Midwest Cover Crops Council selector (JavaScript app, not tried).

## Source caveats for D28

D28 allows official documents and rules out third-party mirrors. These rows need a decision before they go into `data/`:

- FAO crop information pages (pea, potato, alfalfa, sugar beet) and the IPI barley paper: official, but read through web.archive.org because the live pages are gone.
- Istanbulluoglu et al. (2010) rapeseed Ky: abstract on a third-party index; the paper was not opened.
- NDSU field pea guide: an NDSU document hosted on a Washington State University server.
- Terra Nostra / EIT Food rapeseed guide: an NGO publication written by IOR-PIB staff. The IOR-PIB 2025 instruction gives the same -15 °C and can be cited alone.
- Iowa Soybean Association flyer: an industry association, not a public agency.

## How O4 maps this to `data/crops`

Crop ids are those in `src/fixtures/crops.ts`. "#59" is the PR adding oats, rye, spring barley and rapeseed; "#58" is the heat and frost PR.

- `winter-rapeseed` (pl, #59): `yieldResponseFactor` 1.52 (Moteva et al. 2016), if the team accepts a single temperate trial. Heat row: months = COBORU flowering month, threshold 29, lossShare 0.5 (Tidy et al. 2025). Winterkill (-15 °C, -20 °C under snow) cannot be a frost row with FROST_DAYS; list it in the crop's gaps, or open a [contract] PR for `T2M_MIN` and `SNODP`.
- `spring-barley` (pl, #59): `yieldResponseFactor` from Andersen et al. is a range (0.38 to 1.50 over the whole season); it is safer to leave Ky out (D29 allows that) and cite the study in the gaps. Heat row: threshold 30, grain-filling months from COBORU Zboża jare, lossShare 0.2 team rule (FAO-66 gives no share). No frost row.
- `oats` (us-ia, #59) and `rye` (pl, #59): no Ky (D29: income `no-data`). No heat or frost value for either.
- `maize` (us-ia and pl, main + #58): add a frost row: FROST_DAYS ≥ 1 in May (emergence), source ISU 2020; and in the month before maturity (us-ia October, pl September), source ISU 2019 / IUNG 2015, lossShare 0.12 (late dent, low end of the ISU range). Heat stays 35 °C in July; the ISU 2020 page is a second source for it.
- `soybean` (us-ia): frost rows in May and the pod-filling months are confirmed by ISU 2020 and 2019; keep the 35 °C heat.
- `winter-wheat` (us-ia and pl): frost in May and June is confirmed by K-State C646 (-1 °C at heading and flowering, -2 °C at milk and dough).
- `field-pea` (pl): heat row: threshold 29, months [6], lossShare 0.2 team rule. Stage Ky 0.2 / 0.9 / 0.7 / 0.2 if a stage-wise Ky is ever used.
- `potato` (pl): no change; stage Ky 0.60 / – / 0.70 / 0.20 from FAO-66 Table 2.
- `sugar-beet` (pl): no heat or frost value; Ky stays 1.0 (FAO-33). Stage values exist only from Morocco trials.
- `alfalfa` (us-ia): frost threshold -4 °C (SDSU) has no month source; leave it out until one is found.
- `white-mustard`, `phacelia` (pl): sowing window 1 July to 20 August, keep until 15 October (ARiMR rule via IUNG 2025); termination late October or November. These match the current `sowMonth` 8 and `harvestMonth` 10.
- `cereal-rye` (us-ia): overseeding into standing corn or soybean in late August to early September (ISU 2021) supports `sowMonth` 9; termination at least 10 days before corn planting.
- `red-clover` (us-ia): nothing new.
- Crop-independent heat and frost (#58): the per-crop values above sit between 29 and 35 °C for heat and at 0 to -2 °C for spring frost, which fits the 35 °C and "any frost day" general rules in #58.

---

AI use: Claude Code (Claude Opus 5.5) searched, opened and excerpted the documents and drafted this file; values were checked against the saved excerpts.
