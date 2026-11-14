# Polish crop prices, costs, yields and 2026 payments (R8)

Research notes for O4, who turns them into `data/money/pl.json`. Research only: nothing here is read by the app. Retrieved Saturday 14 November 2026.

Crops: winter wheat, maize (grain), winter rapeseed, spring barley, rye, field pea, sugar beet, potato, and the cover crops white mustard and phacelia. Region: Wielkopolskie where a regional figure exists, otherwise Poland.

Every number below was copied from a document opened on 14 November 2026. The text of the page or table we quote is saved under `data/samples/research/pl/<topic>/` (paths in the tables are relative to that folder). Sources are official: GUS, the Ministry of Agriculture (MRiRW), ARiMR, Dziennik Ustaw via the Sejm ELI API, and WODR Poznań, the state agricultural advisory centre for Wielkopolska. Under D28 they may be cited even though their hosts are not in SPEC section 15; the app never calls them.

Number format: section 3 (yields) uses decimal points; everything else keeps the Polish decimal comma of the sources.

Summary of status:

- Prices: ZSRIR week 45/2026 (2–8 November 2026) for grain and rapeseed, GUS 2025 yearly averages for every crop. No prices for the cover crops.
- Direct costs: WODR Poznań calculation sheets, February 2026 and October 2025. Model calculations, not survey data. No figures for white mustard or phacelia.
- Yields: GUS final estimates for Wielkopolskie and Poland, 2020–2025, every crop except the cover crops.
- Payments: no 2026 rate is confirmed. The 2025 rates are confirmed for 2025; the 2026 figures are the ministry's estimates for advance payments. GAEC 7 text quoted from the 2025 consolidated regulation.

## 1. Prices

Two official series, both excluding VAT:

- MRiRW ZSRIR weekly bulletins (Zintegrowany System Rolniczej Informacji Rynkowej): prices paid by reporting businesses (traders, feed mills, flour mills, maltings), volume-weighted, for one week. The newest is week 45/2026 (2–8 November 2026). ZSRIR has no figure for Wielkopolskie alone; the closest is the north-west macroregion (kujawsko-pomorskie, lubuskie, pomorskie, wielkopolskie, zachodniopomorskie). The files came through the portal's public JSON API, the same portal the gov.pl page "Notowania" links to.
- GUS procurement prices ("ceny skupu"): purchases by legal entities only, in PLN per dt (multiply by 10 for PLN/t). Monthly (newest: September 2026) and yearly (newest: calendar year 2025). GUS does not split wheat into milling and feed, or barley into feed and malting, and its maize price mixes wet and dry grain.

Sources and excerpts:

- Z45: MRiRW ZSRIR, "Biuletyn informacyjny – rynek zbóż" nr 45/2026, file "zboża 45_2026.xlsx", https://zsrir.minrol.gov.pl/api/ZsrirData/DownloadReportFile?id=5319 (listed at https://zsrir.minrol.gov.pl/api/ZsrirData/GetReportFileList?id=2), sheet "ZAKUP ZIARNA". Excerpt `prices/zsrir_rynek_zboz_45_2026.txt`.
- O45: MRiRW ZSRIR, "Biuletyn informacyjny – rynek roślin oleistych" nr 45/2026, file "oleiste 45_2026.xlsx", https://zsrir.minrol.gov.pl/api/ZsrirData/DownloadReportFile?id=5313, sheet "ZAKUP RZEPAKU, SPRZEDAŻ". Excerpt `prices/zsrir_rynek_oleistych_45_2026.txt`.
- G09: GUS, "Ceny produktów rolnych we wrześniu 2026 r." (published 22.10.2026), https://publikacje.new.stat.gov.pl/portal-publikacje/ceny-produktow-rolnych-we-wrzesniu-2026-r, Tablice.xlsx sheets Tabl_1 and Tabl_2. Excerpt `prices/gus_ceny_produktow_rolnych_2026-09.txt`.
- GA: GUS, "Skup i ceny produktów rolnych w 2025 r." (published 28.05.2026, corrected table file of 10.06.2026), https://publikacje.new.stat.gov.pl/portal-publikacje/skup-i-ceny-produktow-rolnych-w-2025-r, file https://publikacje.new.stat.gov.pl/sites/default/files/2026-06/Tablice%20skup_i_ceny_produktow_rolnych_2025_korekta_2.xls, sheets "Tab1(26)" (Poland) and "Tabl.3(28)" (voivodeships). Excerpt `prices/gus_skup_i_ceny_2025_annual.txt`.

| Crop | Value, PLN/t | Period | Geography | Source | Locator |
|---|---|---|---|---|---|
| Wheat, milling (pszenica konsumpcyjna) | 1005,59 | 2–8 Nov 2026 | NW macroregion | Z45 | row 48 |
| Wheat, milling | 979,56 | 2–8 Nov 2026 | Poland | Z45 | row 9 |
| Wheat | 887,4 (88,74/dt) | Sep 2026 | Wielkopolskie | G09 | Tabl_2, Wielkopolskie |
| Wheat | 824,6 (82,46/dt) | 2025 average | Wielkopolskie | GA | Tabl.3(28) row 18 |
| Maize, dry (kukurydza sucha) | 943,21 | 2–8 Nov 2026 | NW macroregion | Z45 | row 56 |
| Maize, dry | 945,43 | 2–8 Nov 2026 | Poland | Z45 | row 17 |
| Maize, wet (mokra) | 596,28 | 2–8 Nov 2026 | Poland | Z45 | row 16 |
| Maize (wet and dry mixed) | 938,5 (93,85/dt) | Sep 2026 | Wielkopolskie | G09 | Tabl_2, Wielkopolskie |
| Maize (wet and dry mixed) | 646,7 (64,67/dt) | 2025 average | Poland | GA | Tab1(26) row 26 |
| Rapeseed (nasiona rzepaku) | 2510,12 | 2–8 Nov 2026 | Poland | O45 | row 8 |
| Rapeseed and turnip rape | 2080,0 (208,00/dt) | 2025 average | Poland | GA | Tab1(26) row 66 |
| Barley, feed (jęczmień paszowy) | 806,50 | 2–8 Nov 2026 | NW macroregion | Z45 | row 53 |
| Barley, feed | 800,10 | 2–8 Nov 2026 | Poland | Z45 | row 14 |
| Barley, malting (browarny) | 874,29 | 2–8 Nov 2026 | Poland (NW: "nld", too few reports) | Z45 | row 15 |
| Barley | 792,4 (79,24/dt) | Sep 2026 | Wielkopolskie | G09 | Tabl_2, Wielkopolskie |
| Barley | 752,6 (75,26/dt) | 2025 average | Wielkopolskie | GA | Tabl.3(28) row 18 |
| Rye, milling (żyto konsumpcyjne) | 731,54 | 2–8 Nov 2026 | NW macroregion | Z45 | row 50 |
| Rye, milling | 696,93 | 2–8 Nov 2026 | Poland | Z45 | row 11 |
| Rye | 649,8 (64,98/dt) | Sep 2026 | Wielkopolskie | G09 | Tabl_2, Wielkopolskie |
| Rye | 645,2 (64,52/dt) | 2025 average | Wielkopolskie | GA | Tabl.3(28) row 18 |
| Field pea, edible, without seed (groch) | 1140,1 (114,01/dt) | 2025 average | Poland | GA | Tab1(26) row 48 |
| Sugar beet | 138,5 (13,85/dt) | 2025 average | Wielkopolskie | GA | Tabl.3(28) row 18 |
| Sugar beet | 135,7 (13,57/dt) | 2025 average | Poland | GA | Tab1(26) row 64 |
| Potato, edible, without early (jadalne bez wczesnych) | 1051,2 (105,12/dt) | 2025 average | Wielkopolskie | GA | Tabl.3(28) row 18 |
| Potato, all kinds | 706,5 (70,65/dt) | 2025 average | Poland | GA | Tab1(26) row 52 |
| Potato, all kinds (mostly industrial in this region and month) | 501,0 (50,10/dt) | Sep 2026 | Wielkopolskie | G09 | Tabl_2, Wielkopolskie, footnote c |

Also saved, superseded by the files above: GUS August 2026 (`prices/gus_ceny_produktow_rolnych_2026-08.txt`) and the ZSRIR weekly summary 41/2026 (`prices/zsrir_przeglad_41_2026.txt`).

Grain prices moved a lot in a year. ZSRIR week 45 shows milling wheat in Poland at 979,56 against 769,52 PLN/t in the same week of 2025 (Z45 row 9), so the choice between "this week" and "2025 average" changes the margin by hundreds of PLN per hectare.

## 2. Direct costs per hectare, Wielkopolska

All costs come from WODR Poznań (Wielkopolski Ośrodek Doradztwa Rolniczego) crop calculation sheets. These are model calculations for the region by the state advisory service, not survey results from a sample of farms. We found no survey figures (IERiGŻ AGROKOSZTY, FADN) for 2023–2025; see "Missing".

Two editions were opened:

- "2026 Luty" (February 2026), landing page https://www.wodr.poznan.pl/doradztwo/ekonomika/kalkulacje-rolnicze-produkcji-roslinnej-oraz-zwierzecej-luty-2026, PDFs under `https://www.wodr.poznan.pl/images/2026/doradztwo/ekonomika/kalkulacje/luty/<file>.pdf`.
- "2025 Październik" (October 2025), PDFs under `https://www.wodr.poznan.pl/images/2025/doradztwo/ekonomika/pazdziernik/<file>.pdf`. We could not find this edition's landing page; the PDFs were opened directly.

Locator for every row: PDF page 1 (each sheet is one page), line "KOSZTY BEZPOŚREDNIE RAZEM (zł/ha)". Excerpts: `costs/wodr_2026-02_<crop>.txt` and `costs/wodr_2025-10_<crop>.txt` (full extracted sheet text, URL and retrieval time at the top). Retrieved 2026-11-14.

What the WODR total contains: seed, fertiliser (wheat includes a quarter of a liming dose), crop protection, variable costs of own machinery (fuel is inside this line, priced per machine hour, never listed on its own), contracted services such as combine harvesting, and "other" (named per crop below). The "seed + fertiliser + protection" column is our calculation from the October 2025 components; use it only to compare with survey definitions that leave machinery out.

| Crop | Feb 2026 total, PLN/ha | Oct 2025 total, PLN/ha | Oct 2025 components: seed / fertiliser / protection / own machinery / services / other | Seed + fertiliser + protection, Oct 2025 (our calculation) | PDF file |
|---|---|---|---|---|---|
| Winter wheat | 4367,49 | 4417,44 | 522,50 / 1574,22 / 620,89 / 968,21 / 674,12 / 57,51 twine | 2717,61 | `pszenica_ozima.pdf` |
| Maize, grain | 7015,30 | 7035,39 | 884,63 / 1820,18 / 450,76 / 493,51 / 1261,31 / 2125,00 drying | 3155,57 | `kukurydza_na_ziarno.pdf` |
| Winter rapeseed | 5564,47 | 5967,30 | 586,39 / 2927,04 / 1103,94 / 727,02 / 622,91 / – | 4617,37 | `rzepak_ozimy.pdf` |
| Spring barley | 3162,16 | 3195,41 | 359,10 / 1107,40 / 269,42 / 882,89 / 519,09 / 57,51 | 1735,92 | `jęczmień_jary.pdf` |
| Rye (winter) | 3659,19 | 3697,73 | 287,54 / 1158,25 / 537,36 / 976,65 / 622,91 / 115,02 | 1983,15 | `żyto_ozime.pdf` |
| Field pea (groch jadalny, edible) | 3933,30 | 4009,70 | 821,60 / 880,60 / 1124,60 / 458,97 / 723,93 / – | 2826,80 | Oct 2025 `groch.pdf`; Feb 2026 `groch_jadalny.pdf` |
| Sugar beet | 8283,87 | 8164,19 | 633,60 / 1776,24 / 2647,24 / 638,41 / 2468,71 (includes transport to the sugar factory) / – | 5057,08 | `buraki_cukrowe.pdf` |
| Potato, table | 16134,91 | 15391,15 | 7708,25 / 1158,25 / 921,46 / 2122,09 / 2139,90 / 1341,20 hired labour | 9787,96 | `ziemniaki_jadalne.pdf` |
| Potato, starch | 12851,53 | 12152,62 | 5500,00 / 1287,40 / 962,89 / 1987,44 / 2180,18 / 234,71 hired labour | 7750,29 | `ziemniaki_przemysłowe.pdf` |

The research agent checked each October 2025 total against the sum of its components (they agree to 0,01 PLN). We re-checked wheat by hand: the sheet line reads "KOSZTY BEZPOŚREDNIE RAZEM (zł/ha) | 4417,44".

Yield and price each sheet assumes (October 2025 → February 2026). They are a cross-check for sections 1 and 3, not a replacement for GUS:

| Crop | Yield assumed | Price assumed, PLN/dt |
|---|---|---|
| Winter wheat | 60 dt/ha | 67,84 → 71,23 |
| Maize, grain | 85 dt/ha | 74,29 → 74,57 |
| Winter rapeseed | 40 dt/ha | 203,79 → 209,62 |
| Spring barley | 45 dt/ha | 63,89 (both) |
| Rye | 45 dt/ha | 54,76 → 57,53 |
| Field pea, edible | 30 dt/ha | 90,33 → 85,38 |
| Sugar beet | 510 dt/ha | 14,27 (both) |
| Potato, table | 300 dt/ha (264 dt table at 161,56 → 153,63, plus 36 dt feed at 20 → 28) | see left |
| Potato, starch | 350 dt/ha | 20,00 → 28,00 |

Watch out: the sheets' "WARTOŚĆ PRODUKCJI RAZEM" (value of production) includes payments. For wheat, 60 dt x 67,84 = 4070,40 plus 665,39 PLN/ha basic income support and complementary payment ("JPO+dodatkowa") gives the sheet's 4735,79. Other sheets add 879,96 (legume payment), 1580,89 (starch potato payment) and 1949,53 (total payments for sugar beet). Take only the direct-cost line from these sheets, or payments get counted twice.

## 3. Reference yields, GUS, Wielkopolskie and Poland

GUS publishes yields in dt/ha. Every value below is divided by 10 to give t/ha. Each cell reads Wielkopolskie / Polska. The 5-year mean covers 2020–2024 and is our calculation from the dt/ha values. The 2025 edition (page dated 30.04.2026) says it holds "Wyniki ostatecznych szacunków", so 2025 is final, not preliminary.

Source for every row: GUS, "Produkcja upraw rolnych i ogrodniczych w <rok>", XLSX tables by voivodeship, first "Polska" and "Wielkopolskie" rows of each table (section OGÓŁEM). Pages:

- 2020: https://stat.gov.pl/obszary-tematyczne/rolnictwo-lesnictwo/uprawy-rolne-i-ogrodnicze/produkcja-upraw-rolnych-i-ogrodniczych-w-2020-roku,9,19.html
- 2021: https://stat.gov.pl/obszary-tematyczne/rolnictwo-lesnictwo/uprawy-rolne-i-ogrodnicze/produkcja-upraw-rolnych-i-ogrodniczych-w-2021-roku,9,20.html
- 2022: https://stat.gov.pl/obszary-tematyczne/rolnictwo-lesnictwo/uprawy-rolne-i-ogrodnicze/produkcja-upraw-rolnych-i-ogrodniczych-w-2022-roku,9,21.html
- 2023: https://stat.gov.pl/obszary-tematyczne/rolnictwo-lesnictwo/uprawy-rolne-i-ogrodnicze/produkcja-upraw-rolnych-i-ogrodniczych-w-2023-roku,9,22.html
- 2024: https://stat.gov.pl/obszary-tematyczne/rolnictwo-lesnictwo/uprawy-rolne-i-ogrodnicze/produkcja-upraw-rolnych-i-ogrodniczych-w-2024-r-,9,23.html
- 2025: https://stat.gov.pl/obszary-tematyczne/rolnictwo-lesnictwo/uprawy-rolne-i-ogrodnicze/produkcja-upraw-rolnych-i-ogrodniczych-w-2025-r-,9,24.html

The XLSX download URL for each year is in the header of each excerpt file. Retrieved 2026-11-14.

| Crop (GUS name) | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | Mean 2020–24 | Locator | Excerpt |
|---|---|---|---|---|---|---|---|---|---|
| Winter wheat (pszenica ozima) | 5.57 / 5.42 | 5.43 / 5.18 | 5.61 / 5.44 | 5.77 / 5.48 | 5.73 / 5.29 | 5.95 / 5.65 | 5.62 / 5.36 | sheet "Tabl. 5" | `yields/gus-produkcja-upraw-pszenica-ozima-plony.tsv` |
| Maize for grain (kukurydza na ziarno) | 7.28 / 7.21 | 7.34 / 7.47 | 6.85 / 7.11 | 7.08 / 7.29 | 7.44 / 7.36 | 8.15 / 7.85 | 7.20 / 7.29 | sheet "Tabl. 18"; BDL var 47752 | `yields/gus-produkcja-upraw-kukurydza-na-ziarno-plony.tsv`, `yields/bdl-47752-kukurydza-na-ziarno-plony.json` |
| Winter rapeseed (rzepak i rzepik ozimy) | 3.37 / 3.20 | 3.28 / 3.23 | 3.45 / 3.40 | 3.53 / 3.41 | 3.43 / 3.25 | 3.33 / 3.32 | 3.41 / 3.30 | sheet "Tabl. 26" | `yields/gus-produkcja-upraw-rzepak-i-rzepik-ozimy-plony.tsv` |
| Spring barley (jęczmień jary) | 4.04 / 4.00 | 3.78 / 3.78 | 3.91 / 3.95 | 3.78 / 3.79 | 4.02 / 3.84 | 4.43 / 4.26 | 3.91 / 3.87 | sheet "Tabl. 10" | `yields/gus-produkcja-upraw-jeczmien-jary-plony.tsv` |
| Rye (żyto) | 3.59 / 3.51 | 3.48 / 3.31 | 3.81 / 3.60 | 3.91 / 3.55 | 3.91 / 3.57 | 4.18 / 3.82 | 3.74 / 3.51 | sheet "Tabl. 7"; BDL var 4338 | `yields/gus-produkcja-upraw-zyto-plony.tsv`, `yields/bdl-4338-zyto-plony.json` |
| Field pea, edible (groch) | – | – | – | 2.52 / 2.51 | 2.88 / 2.63 | 2.99 / 2.80 | 2.80 / 2.65 (2023–25 only) | sheet "Tabl. 38" (2023 on) | `yields/gus-produkcja-upraw-groch-jadalny-plony.tsv` |
| Edible pulses, pea fallback (strączkowe jadalne) | 2.76 / 2.45 | 2.44 / 2.36 | 2.83 / 2.57 | 2.48 / 2.44 | 2.78 / 2.49 | 2.84 / 2.53 | 2.66 / 2.46 | "Tabl. 29" (2020–22), "Tabl. 37" (2023–25) | `yields/gus-produkcja-upraw-straczkowe-jadalne-plony.tsv` |
| Fodder pea (peluszka na nasiona) | – | – | – | – | 2.61 / 2.12 | 2.63 / 2.08 | – | sheet "Tabl. 72" | `yields/gus-produkcja-upraw-peluszka-na-nasiona-plony.tsv` |
| Sugar beet (buraki cukrowe) | 62.5 / 60.8 | 61.8 / 61.0 | 64.5 / 63.8 | 67.8 / 65.0 | 68.5 / 66.3 | 78.2 / 71.9 | 65.0 / 63.4 | sheet "Tabl. 23"; BDL var 4374 | `yields/gus-produkcja-upraw-buraki-cukrowe-plony.tsv`, `yields/bdl-4374-buraki-cukrowe-plony.json` |
| Potato (ziemniaki) | 36.8 / 34.8 | 31.2 / 30.0 | 31.5 / 30.8 | 32.7 / 29.6 | 33.5 / 30.2 | 40.3 / 32.7 | 33.1 / 31.1 | sheet "Tabl. 22"; BDL var 4368 | `yields/gus-produkcja-upraw-ziemniaki-plony.tsv`, `yields/bdl-4368-ziemniaki-plony.json` |

Notes on the yield table:

- Pea: GUS puts "groch" in the section on edible pulses ("strączkowe jadalne (konsumpcyjne)"). The 2020–2022 editions have no separate pea table, only the edible pulses group. The fodder pea (peluszka) table exists only for 2024 and 2025.
- Rapeseed: GUS publishes "rzepak i rzepik ozimy" (rapeseed and turnip rape together). There is no rapeseed-only series.
- Cross-check: the BDL API (`https://bdl.stat.gov.pl/api/v1/data/by-variable/{id}?unit-level=2&year=...`, Wielkopolskie unit `023000000000`, Polska `000000000000`) matches the publication to within 0.5 dt/ha. BDL has no winter/spring split for wheat, barley or rapeseed (variables 4332, 4344, 4380), so those rows use the publication tables. BDL variable 47740 "rośliny strączkowe" is a broader group (Wielkopolskie 2020: 2.05 t/ha against 2.76 for edible pulses) and must not be used for pea.
- Sugar beet 2022: GUS gives 644.76 and 638.24 dt/ha; rounded here to one decimal.
- The 2020 edition gives area in thousand ha and harvest in thousand tonnes; yields are still dt/ha.

## 4. Payments for the 2026 campaign

No official document states a final 2026 rate yet. The 2025 rates came in a regulation dated 14 October 2025 (Dz.U. 2025 poz. 1397). As of 14 November 2026 the Sejm ELI index of Dziennik Ustaw holds Ministry of Agriculture acts up to DU/2026/1415 (23 October 2026) and has no rate regulation for the 2026 eco-schemes (`payments/eli_2026_no_ecoscheme_rate_regulation.txt`).

What exists for 2026 are the ministry's estimated rates for the advance payments ("stawki szacunkowe"). The announcement says they use the exchange rate of 31 July 2026 (4,3135 PLN/EUR), were cut by a further 3% ("dodatkowo pomniejszone o 3 proc."), and that "Ostateczne stawki płatności zostaną określone w odrębnych rozporządzeniach przed rozpoczęciem wypłaty płatności końcowych". So every 2026 figure below is `confirmed: false`. The 2025 figures are confirmed for 2025 only.

Point value of the eco-scheme "Rolnictwo węglowe i zarządzanie składnikami odżywczymi" (carbon farming and nutrient management):

| Year | PLN per point | Status | Source | Locator | Excerpt |
|---|---|---|---|---|---|
| 2025 | 87,52 | confirmed for 2025 | Rozporządzenie MRiRW z 14.10.2025 w sprawie stawek płatności w ramach schematów na rzecz klimatu i środowiska za 2025 r., Dz.U. 2025 poz. 1397, https://dziennikustaw.gov.pl/D2025000139701.pdf | § 3 ust. 1 | `payments/dzu_2025_1397_ecoscheme_rates_2025.txt` |
| 2026 | about 92,76 | estimate, not confirmed for 2026 | MRiRW, "Zaliczki dopłat dla rolników już od 8 września" (19.08.2026), https://www.gov.pl/web/rolnictwo/zaliczki-doplat-dla-rolnikow-juz-od-8-wrzesnia, attachment "Tabela 2" https://www.gov.pl/attachment/5b8e988c-33e8-4d41-bda7-82157d073500 | sentence "Szacunkowa stawka za 1 pkt, to ok.: 92,76 PLN/pkt" | `payments/mrirw_2026_estimated_ecoscheme_rates.txt` |

ARiMR's 2026 practice page writes "1 pkt = ok. 22,47 EUR, tj. ok. 100 PLN". That is a rounded illustration, not a rate; do not use it.

Rates per practice. Points per hectare come from ARiMR's 2026 page "Rolnictwo węglowe i zarządzanie składnikami odżywczymi" (https://www.gov.pl/web/arimr/rolnictwo-weglowe-i-zarzadzanie-skladnikami-odzywczymi-2026, table "Przyznana liczba pkt", excerpt `payments/arimr_2026_carbon_farming_points.txt`). The 2025 PLN/ha column comes from ARiMR, "Stawki płatności bezpośrednich oraz przejściowego wsparcia krajowego za rok 2025" (https://www.gov.pl/web/arimr/stawki-platnosci-bezposrednich-oraz-przejsciowego-wsparcia-krajowego-za-rok-2025, eco-scheme table, excerpt `payments/arimr_2025_rates_table.txt`), which matches Dz.U. 2025 poz. 1397. The 2026 column is the MRiRW Tabela 2 estimate. Conditions are summarised from the ARiMR 2026 practice pages (`payments/arimr_2026_practice_conditions.txt`, one section per page with its URL).

| Practice (Polish name) | English | Points/ha 2026 | 2025 PLN/ha (confirmed for 2025) | 2026 PLN/ha (estimate) | Confirmed for 2026 | Condition (2026 ARiMR page) |
|---|---|---|---|---|---|---|
| Międzyplony ozime lub wsiewki śródplonowe | winter catch crops or undersown crops | 5 | 437,60 | 463,80 | no | Sown 1 Jul–1 Oct and kept until 15 Feb (mulching allowed after 15 Nov), or an undersown legume kept 8 weeks after harvest; a mixture of at least 2 species, not cereals only; no pesticides |
| Uproszczone systemy uprawy | simplified tillage | 3 | 262,56 | 278,28 | no | No-plough or strip-till for the whole year, all residues left as mulch |
| Zróżnicowana struktura upraw | diversified crop structure | 3 | 233,13 | 278,28 | no | At least 3 crops; largest at most 65%; cereals at most 65%; at least 20% crops that build soil organic matter (mostly legumes); at most 30% crops that deplete it |
| Opracowanie i przestrzeganie planu nawożenia, wariant podstawowy | fertilisation plan, basic | 1 | 87,52 | 92,76 | no | Soil test (P, K, Mg, pH, valid 4 years), nitrogen balance plan, records on all land |
| Opracowanie i przestrzeganie planu nawożenia, wariant z wapnowaniem | fertilisation plan with liming | 3 | 262,56 | 278,28 | no | Basic variant plus liming where pH is 5,5 or below, once per 4 years per parcel |
| Wymieszanie obornika na gruntach ornych w terminie 12 godzin | manure mixed into arable soil within 12 h | 2 | 175,04 | 185,52 | no | Manure, poultry droppings or digestate mixed in within 12 hours |
| Stosowanie nawozów naturalnych płynnych innymi metodami niż rozbryzgowo | liquid manure not splash-spread | 3 | 262,56 | 278,28 | no | Liquid manure or digestate applied by a method other than splash plate |
| Wymieszanie słomy z glebą | straw mixed into the soil | 1 | 87,52 | 92,76 | no | All straw chopped and mixed in or ploughed |

Notes on the payments table:

- Diversified crop structure paid 233,13 in 2025, not 3 x 87,52 = 262,56, because § 3 ust. 2 of Dz.U. 2025 poz. 1397 applies a points coefficient of 0,887902. The 2026 estimate (278,28) applies no coefficient, so the final 2026 rate may be lower.
- Legumes: the 2026 carbon-farming list has 9 practices and none is a legume practice ("uprawa roślin bobowatych" is not an eco-scheme practice). Legumes count inside the diversification practice (the 20% organic-matter group) and as undersown crops. Two related payments exist: the coupled payment "Płatność do roślin strączkowych na nasiona" (2025: 879,96 PLN/ha; 2026 estimate in MRiRW Tabela 1: 878,45) and the eco-scheme "Materiał siewny kwalifikowany" for legumes (2025: 168,93; 2026 estimate 179,04; Dz.U. 2025 poz. 1397 § 8 pkt 2). Both are for legumes grown for seed, so they fit the field pea only if the farmer grows it for seed.
- The 2023 allocation was different (simplified tillage 4 points, straw 2 points, 103,56 PLN per point; `payments/mrirw_2023_carbon_farming_rates.txt`). Do not mix 2023 points with 2025 or 2026 values.
- The minimum number of points per farm and how practices combine are on the ARiMR 2026 points page (`payments/arimr_2026_carbon_farming_points.txt`); O4 should read that paragraph before summing practices.

### GAEC 7, the rotation rule

Legal text: Obwieszczenie MRiRW z 14.11.2025, consolidated text of the regulation on conditionality norms (Dz.U. 2025 poz. 1674), § 5, https://api.sejm.gov.pl/eli/acts/DU/2025/1674/text.pdf, pp. 4–6, amended by Dz.U. 2026 poz. 161 (https://api.sejm.gov.pl/eli/acts/DU/2026/161/text.pdf). The regulation does not print the label "GAEC 7"; ARiMR maps § 5 to GAEC 7 on https://www.gov.pl/web/arimr/warunkowosc-2026. Excerpts: `payments/dzu_gaec7_norms_regulation_par5.txt`, `payments/arimr_2026_gaec7_conditionality.txt`.

§ 5 ust. 1 (rotation): "W przypadku gdy grunty orne w gospodarstwie obejmują powierzchnię powyżej 10 ha, na tych gruntach uprawy prowadzi się w taki sposób, aby na powierzchni: 1) co najmniej 40 % gruntów ornych była prowadzona inna uprawa w plonie głównym niż uprawa prowadzona w tym plonie w roku poprzednim; 2) wszystkich gruntów ornych taka sama uprawa w plonie głównym nie była prowadzona dłużej niż 3 lata, przy czym przy ustaleniu spełnienia tego warunku bierze się pod uwagę uprawę w plonie głównym prowadzoną nie wcześniej niż w 2023 r."

§ 5 ust. 4 (diversification as the alternative): "W przypadku gdy warunek określony w ust. 1 nie został spełniony, a grunty orne w gospodarstwie obejmują powierzchnię: 1) powyżej 10 ha i nie więcej niż 30 ha, na tych gruntach prowadzi się co najmniej dwie różne uprawy, przy czym uprawa o największej powierzchni nie może zajmować więcej niż 75 % gruntów ornych; 2) powyżej 30 ha, na tych gruntach prowadzi się co najmniej trzy różne uprawy, przy czym uprawa o największej powierzchni nie może zajmować więcej niż 75 % gruntów ornych, a dwie uprawy o największej powierzchni nie mogą łącznie zajmować więcej niż 95 % gruntów ornych."

In English: a farm with more than 10 ha of arable land must grow a different main crop than the year before on at least 40% of its arable land, and no main crop may stay on the same land more than 3 years in a row, counting from 2023. A farm that fails this can comply through diversification instead: at least 2 crops on 10–30 ha (largest at most 75%), at least 3 crops above 30 ha (largest at most 75%, two largest together at most 95%). The ARiMR page says a winter or stubble catch crop, or a recorded undersown crop, also counts as a change.

Exemptions: § 5 ust. 3 leaves out fallow, legumes, grass and other herbaceous forage, small-seeded legume–grass mixtures, perennial crops and maize seed plantations. § 5 ust. 11 exempts farms with more than 75% of arable land under grass, forage, fallow or legumes, or more than 75% of agricultural land under permanent grassland. ARiMR adds: "Od 2026 r. rolnicy, których maksymalna wielkość gospodarstwa nie przekracza 30 hektarów użytków rolnych zadeklarowanych we wniosku o przyznanie płatności są zwolnieni z kontroli i kar w zakresie normy GAEC 7" (based on EU Regulation 2025/2649).

For the engine, the check on a single field is a simplification: the rule applies to the farm's arable land, not to one parcel. A rotation that repeats the same main crop for a fourth year fails ust. 1 pkt 2 on that field; the 40% condition cannot be judged from one field. The card should say that.

Open point: Dz.U. 2026 poz. 161 repeals § 5 ust. 12 (the organic-farm exemption) from 15 March 2026, but ARiMR's 2026 page still lists the organic exemption. Not resolved here.

## Missing

- White mustard and phacelia: no price (cover crops are not sold, and seed prices appear only in seed companies' price lists, which are not official sources), no cost sheet (WODR has no sheet for either; `gorczyca.pdf` and `facelia.pdf` return 404), and no GUS yield. Their direct costs need another official source, or the engine needs a rule for crops that earn nothing (see the mapping note).
- Survey costs (IERiGŻ AGROKOSZTY, FADN by activity) for 2023–2025. The newest IERiGŻ cost book we found covers 2021–2022 and is paid; FADN Polska publishes results by farm type and region, not by crop. All costs here are WODR model calculations.
- Wielkopolskie prices for rapeseed, pea and maize: GUS gives only purchase quantities by voivodeship for these, and ZSRIR has no regional rapeseed price. National prices are used.
- 2026 prices for pea, sugar beet and potato: GUS publishes the 2026 yearly prices around May 2027. The sugar beet contract minimum price was not used because it comes from industry contracts, not an official document.
- Final 2026 eco-scheme rates and the 2026 diversification coefficient. No regulation in Dziennik Ustaw as of 23 October 2026. Check again in December.
- Separate GUS pea yields for 2020–2022 (only the edible pulses group exists for those years).
- The organic-farm exemption from GAEC 7: repealed in the regulation from 15 March 2026, still listed on the ARiMR 2026 page. Not resolved.
- IERiGŻ market reports were not read; GUS and ZSRIR covered every crop first.

## How O4 maps this to data/money

`data/money/pl.json` holds one `economics` row per crop (`referenceYieldTPerHa`, `pricePerT`, `directCostsPerHa`, `year`, `sources`) and a `payments` list (`amountPerHa`, `condition`, `confirmed`). A suggestion, O4 decides:

| Crop id | Reference yield, t/ha | Price, PLN/t | Direct costs, PLN/ha | Comment |
|---|---|---|---|---|
| `winter-wheat` | 5,70 (Wielkopolskie mean 2021–2025, our calculation) | 1005,59 (ZSRIR NW, milling, week 45/2026) | 4367,49 (WODR Feb 2026) | |
| `maize` | 7,37 (same) | 943,21 (ZSRIR NW, dry, week 45/2026) | 7015,30 | WODR includes 2125 PLN/ha drying, so pair it with the dry price, not GUS |
| `winter-rapeseed` | 3,40 (same, "rzepak i rzepik ozimy") | 2510,12 (ZSRIR Poland, week 45/2026) | 5564,47 | |
| `spring-barley` | 3,98 (same) | 806,50 (ZSRIR NW, feed, week 45/2026) | 3162,16 | |
| `rye` | 3,86 (same) | 731,54 (ZSRIR NW, milling, week 45/2026) | 3659,19 | WODR sheet is winter rye |
| `field-pea` | 2,80 (Wielkopolskie groch, mean 2023–2025 only) | 1140,1 (GUS 2025, Poland, edible) | 3933,30 | Edible pea throughout; fodder pea (peluszka) yields are lower |
| `sugar-beet` | 68,16 (Wielkopolskie mean 2021–2025) | 138,5 (GUS 2025, Wielkopolskie) | 8283,87 | |
| `potato` | 33,84 (same, all potatoes) | 1051,2 (GUS 2025, Wielkopolskie, edible without early) | 16134,91 (table potato) | GUS yield covers all potatoes, price and cost are for table potatoes; starch potato is the alternative (WODR 12851,53 PLN/ha, assumed price 28,00 PLN/dt) |
| `white-mustard`, `phacelia` | none | none | none | Missing |

Mean yields 2021–2025 for Wielkopolskie, our calculation from the GUS values in section 3: wheat 5,70, maize 7,37, rapeseed 3,40, spring barley 3,98, rye 3,86, edible pulses 2,67, sugar beet 68,16, potato 33,84 t/ha.

Points to settle when writing the JSON:

1. Price period. The table above uses the newest price per crop: ZSRIR week 45/2026 for grain and rapeseed, GUS 2025 for pea, sugar beet and potato (no 2026 figure yet). That fits SPEC section 7, "today's prices". The other consistent choice is GUS 2025 yearly averages for every crop (section 1), which are one source and one period but a year old and, for maize, mix wet and dry grain. Each row has its own `year`, so either works with the schema.
2. Costs: take only "KOSZTY BEZPOŚREDNIE RAZEM (zł/ha)" from the WODR sheets. Their "value of production" line includes payments, and adding our payments on top would count them twice.
3. Payments: every 2026 row gets `confirmed: false`, with the 2026 estimate as `amountPerHa` and the 2025 regulation as a second source. With nothing confirmed, income for Polish fields is margin only, as SPEC section 7 says, and the card names the estimated payments in its gaps. If O4 prefers the confirmed 2025 rate, the condition text must say "2025 rate".
4. The practices the engine can check from a rotation: catch crops or undersown crops (a cover crop sown after the main crop), diversified crop structure (needs farm shares, so on one field only as information), and straw incorporation. The fertilisation plan, manure and liquid manure practices are about farm management, not the rotation; leave them out of the rotation's payments.
5. GAEC 7 as pass or fail on one field: fail when the same main crop appears a fourth year in a row (§ 5 ust. 1 pkt 2). The 40% condition and the diversification alternative need the whole farm, so the card should say the check is partial, and that farms up to 30 ha are exempt from checks and penalties from 2026.
6. Cover crops: if the contract keeps "a crop without a sourced price gives `no-data` income", any rotation with mustard or phacelia gets `no-data` income. A cover crop is not sold, so O3 and O4 may want a rule for it (costs only, or no economics row). That is a contract question for O1.

AI use: research agents (Claude Opus 5.5 in Claude Code) found and downloaded the documents with curl, extracted the quoted rows into the excerpt files, and drafted these notes. The lead session checked a sample of values against the excerpts by hand. A person on the team has not yet checked the numbers.
