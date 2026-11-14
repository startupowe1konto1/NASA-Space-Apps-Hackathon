// Test data only, not imported by the app.
// Verbatim copies of rows from origin/o4/b0-rules-2 (PR #27), data/rules/{nitrogen,humus,erosion,pest-break}.json.
export const O4_ROWS = [
  {
    "id": "nitrogen.credit.soybean.us-ia",
    "value": {
      "low": 45,
      "high": 60
    },
    "unit": "lb N/acre less N fertilizer needed by maize after soybean than by maize after maize (x 1.121 = kg N/ha)",
    "appliesTo": "Iowa: nitrogen benefit of soybean to the following maize crop (crop ids: soybean -> maize)",
    "sourceTitle": "Sawyer, J. (2008). Nitrogen Fertilization for Corn Following Corn. ISU Agronomy Extension Soil Fertility, Current Topic, 19 Mar 2008",
    "sourceUrl": "https://www.agronext.iastate.edu/soilfertility/currenttopics/CC_Nitrogen_3-19-08.pdf",
    "sourceLocator": "p. 1, Introduction: 'the N fertilizer rate requirement is approximately 45 to 60 lb N/acre higher with CC than SC'",
    "checkedBy": "O4, source opened Sat 14 Nov 2026"
  },
  {
    "id": "nitrogen.credit.alfalfa.us-ia",
    "value": {
      "low": 145,
      "high": 170
    },
    "unit": "lb N/acre less N fertilizer needed by first-year maize after alfalfa than by continuous maize; our subtraction of two numbers in the same paper",
    "appliesTo": "Iowa: nitrogen benefit of alfalfa to the first following maize crop (crop ids: alfalfa -> maize)",
    "sourceTitle": "Sawyer, J.E. (2004). With high fertilizer prices is it business as usual or should fertilization practices change? 2004 Integrated Crop Management Conference, Iowa State University",
    "sourceUrl": "https://www.agronext.iastate.edu/soilfertility/info/highfertilizerprices04icm.pdf",
    "sourceLocator": "p. 165: continuous corn 'highest return to N occurs at 170 lb N/acre'; minus first-year corn after alfalfa optimum 0-25 lb N/acre (Table 2, p. 172) = 145-170",
    "checkedBy": "O4, source opened Sat 14 Nov 2026"
  },
  {
    "id": "nitrogen.credit.field-pea.pl",
    "value": 25,
    "unit": "kg N/ha of plant-available N left for the next crop",
    "appliesTo": "Poland: legume grown alone as a main crop (field pea, crop id field-pea), crop residues ploughed in; subtracted from the next crop's N dose",
    "sourceTitle": "Rozporządzenie Rady Ministrów z dnia 31 stycznia 2023 r. w sprawie \"Programu działań mających na celu zmniejszenie zanieczyszczenia wód azotanami pochodzącymi ze źródeł rolniczych\" (Dz.U. 2023 poz. 244)",
    "sourceUrl": "https://api.sejm.gov.pl/eli/acts/DU/2023/244/text.pdf",
    "sourceLocator": "Załącznik nr 8, Tabela 13 'Ilość azotu działającego pozostającego po uprawie roślin bobowatych', Dz.U. page 121 (annex page 120); IUNG-PIB IU251 p. 6 names this term Nb in its N dose formula, column 'Bobowate w czystym siewie, plon główny', row 'Przyorane resztki pożniwne' = 25 kg",
    "checkedBy": "O4, source opened Sat 14 Nov 2026"
  },
  {
    "id": "humus.coef.maize.pl",
    "value": {
      "light": -1.12,
      "medium": -1.15,
      "heavy": -1.22,
      "blackEarth": -0.91
    },
    "unit": "change in soil organic matter (humus) per hectare per crop-year, in tonnes, by soil class: light, medium, heavy, blackEarth (czarne ziemie); negative = degradation, positive = reproduction. The slide prints the unit column as '1ha'; tonnes is how the Code of Good Agricultural Practice states these coefficients, a mentor should confirm",
    "appliesTo": "humus balance, one crop-year of maize grown as a main crop (group 'Kukurydza'); Polish coefficients, for a field outside Poland they are a borrowed value",
    "sourceTitle": "IUNG-PIB (Siebielec G., 2014), slide 'Współczynniki reprodukcji i degradacji glebowej substancji organicznej [Kodeks Dobrej Praktyki Rolniczej, 2004]'",
    "sourceUrl": "https://iung.pl/wp-content/uploads/2013/01/1.5-PIB-2014.pdf",
    "sourceLocator": "slide 4 (PDF page 4), table row 'Kukurydza': light -1.12, medium -1.15, heavy -1.22, black earth -0.91",
    "checkedBy": "O4, source opened Sat 14 Nov 2026"
  },
  {
    "id": "humus.coef.winter-wheat.pl",
    "value": {
      "light": -0.49,
      "medium": -0.53,
      "heavy": -0.56,
      "blackEarth": -0.38
    },
    "unit": "change in soil organic matter (humus) per hectare per crop-year, in tonnes, by soil class: light, medium, heavy, blackEarth (czarne ziemie); negative = degradation, positive = reproduction. The slide prints the unit column as '1ha'; tonnes is how the Code of Good Agricultural Practice states these coefficients, a mentor should confirm",
    "appliesTo": "humus balance, one crop-year of winter-wheat grown as a main crop (group 'Zboża, oleiste'); Polish coefficients, for a field outside Poland they are a borrowed value",
    "sourceTitle": "IUNG-PIB (Siebielec G., 2014), slide 'Współczynniki reprodukcji i degradacji glebowej substancji organicznej [Kodeks Dobrej Praktyki Rolniczej, 2004]'",
    "sourceUrl": "https://iung.pl/wp-content/uploads/2013/01/1.5-PIB-2014.pdf",
    "sourceLocator": "slide 4 (PDF page 4), table row 'Zboża, oleiste': light -0.49, medium -0.53, heavy -0.56, black earth -0.38",
    "checkedBy": "O4, source opened Sat 14 Nov 2026"
  },
  {
    "id": "erosion.slr.bare",
    "value": 100,
    "unit": "percent of the soil loss from continuous tilled fallow (C = 1)",
    "appliesTo": "a month the calendar shows as bare soil",
    "sourceTitle": "Wischmeier, W.H. and Smith, D.D. (1978). Predicting Rainfall Erosion Losses: A Guide to Conservation Planning. USDA Agriculture Handbook 537",
    "sourceUrl": "https://www.ars.usda.gov/ARSUserFiles/60600505/RUSLE/AH_537%20Predicting%20Rainfall%20Soil%20Losses.pdf",
    "sourceLocator": "p. 20: 'the basic, clean-tilled, continuous fallow conditions for which C = 1'",
    "checkedBy": "O4, source opened Sat 14 Nov 2026"
  },
  {
    "id": "erosion.slr.maize.conventional",
    "value": {
      "roughFallow": 43,
      "seedbed": 64,
      "establishment": 56,
      "development": 43,
      "maturing80": 32,
      "maturing90": 25,
      "maturing96": 21,
      "residue": 37
    },
    "unit": "percent of the soil loss from continuous tilled fallow in the same period (soil loss ratio; /100 = cover-management C for that period). Cropstage keys (p. 18): roughFallow = plowing to seedbed tillage; seedbed = until 10% canopy; establishment = until 50% canopy; development = until 75% canopy; maturing80/90/96 = until harvest, by final canopy cover %; residue = harvest to next tillage",
    "appliesTo": "maize after maize, small grain or soybean-like crops, moldboard plow, residues left, spring plowing, 2,600 lb/acre spring residue",
    "sourceTitle": "Wischmeier, W.H. and Smith, D.D. (1978). Predicting Rainfall Erosion Losses: A Guide to Conservation Planning. USDA Agriculture Handbook 537",
    "sourceUrl": "https://www.ars.usda.gov/ARSUserFiles/60600505/RUSLE/AH_537%20Predicting%20Rainfall%20Soil%20Losses.pdf",
    "sourceLocator": "Table 5, line 3 ('CORN AFTER C, GS, G OR COT IN MEADOWLESS SYSTEMS', 'Moldboard plow, conv till', 'RdL, sprg TP', 2,600 lb), pp. 22-24",
    "checkedBy": "O4, source opened Sat 14 Nov 2026"
  },
  {
    "id": "erosion.slr.maize.noTillInRyeCover",
    "value": {
      "seedbed": 11,
      "establishment": 11,
      "development": 11,
      "maturing80": 11,
      "maturing90": 9,
      "maturing96": 7
    },
    "unit": "percent of the soil loss from continuous tilled fallow in the same period (soil loss ratio; /100 = cover-management C for that period). Cropstage keys (p. 18): roughFallow = plowing to seedbed tillage; seedbed = until 10% canopy; establishment = until 50% canopy; development = until 75% canopy; maturing80/90/96 = until harvest, by final canopy cover %; residue = harvest to next tillage",
    "appliesTo": "maize planted no-till into a killed winter cover (rye or wheat, reached stemming stage, 3,000 lb/acre); crop ids cereal-rye -> maize",
    "sourceTitle": "Wischmeier, W.H. and Smith, D.D. (1978). Predicting Rainfall Erosion Losses: A Guide to Conservation Planning. USDA Agriculture Handbook 537",
    "sourceUrl": "https://www.ars.usda.gov/ARSUserFiles/60600505/RUSLE/AH_537%20Predicting%20Rainfall%20Soil%20Losses.pdf",
    "sourceLocator": "Table 5, right column block 'CORN AFTER WC OF RYEGRASS OR WHEAT SEEDED IN C STUBBLE', 'No-till pl in killed WC', 3,000 lb row, pp. 22-24",
    "checkedBy": "O4, source opened Sat 14 Nov 2026"
  },
  {
    "id": "erosion.slr.soybean.conventional",
    "value": {
      "roughFallow": 33,
      "seedbed": 60,
      "establishment": 52,
      "development": 38,
      "maturing90": 20,
      "maturing96": 17
    },
    "unit": "percent of the soil loss from continuous tilled fallow in the same period (soil loss ratio; /100 = cover-management C for that period). Cropstage keys (p. 18): roughFallow = plowing to seedbed tillage; seedbed = until 10% canopy; establishment = until 50% canopy; development = until 75% canopy; maturing80/90/96 = until harvest, by final canopy cover %; residue = harvest to next tillage",
    "appliesTo": "soybean after maize, spring plowing, residues left, conventional tillage, high productivity; residue period: use erosion.slr.residueCover.soybean",
    "sourceTitle": "Wischmeier, W.H. and Smith, D.D. (1978). Predicting Rainfall Erosion Losses: A Guide to Conservation Planning. USDA Agriculture Handbook 537",
    "sourceUrl": "https://www.ars.usda.gov/ARSUserFiles/60600505/RUSLE/AH_537%20Predicting%20Rainfall%20Soil%20Losses.pdf",
    "sourceLocator": "Table 5, line 123 ('BEANS AFTER CORN', 'Sprg TP, RdL, conv till', HP), pp. 22-24",
    "checkedBy": "O4, source opened Sat 14 Nov 2026"
  },
  {
    "id": "erosion.slr.meadow",
    "value": {
      "grassLegume3to5tHay": 0.4,
      "grassLegume2to3tHay": 0.6,
      "grassLegume1tHay": 1.0,
      "redClover": 1.5,
      "alfalfa": 2.0,
      "sweetclover": 2.5
    },
    "unit": "percent of the soil loss from continuous tilled fallow, full-year value for an established meadow",
    "appliesTo": "established perennial forage (alfalfa, red-clover in its full year)",
    "sourceTitle": "Wischmeier, W.H. and Smith, D.D. (1978). Predicting Rainfall Erosion Losses: A Guide to Conservation Planning. USDA Agriculture Handbook 537",
    "sourceUrl": "https://www.ars.usda.gov/ARSUserFiles/60600505/RUSLE/AH_537%20Predicting%20Rainfall%20Soil%20Losses.pdf",
    "sourceLocator": "Table 5-B, 'ESTABLISHED MEADOW, FULL-YEAR PERCENTAGES', p. 26",
    "checkedBy": "O4, source opened Sat 14 Nov 2026"
  },
  {
    "id": "erosion.slr.residueCover.maize",
    "value": {
      "tilled20": 48,
      "tilled30": 37,
      "tilled40": 30,
      "tilled50": 22,
      "tilled60": 17,
      "tilled70": 12,
      "noTill20": 34,
      "noTill30": 26,
      "noTill40": 21,
      "noTill50": 15,
      "noTill60": 12,
      "noTill70": 8
    },
    "unit": "percent of the soil loss from continuous tilled fallow in the residue period (cropstage 4); key = tilled seedbed or no-till + percent of surface covered by residue",
    "appliesTo": "months between maize harvest and the next tillage or seeding (calendar 'residue' state)",
    "sourceTitle": "Wischmeier, W.H. and Smith, D.D. (1978). Predicting Rainfall Erosion Losses: A Guide to Conservation Planning. USDA Agriculture Handbook 537",
    "sourceUrl": "https://www.ars.usda.gov/ARSUserFiles/60600505/RUSLE/AH_537%20Predicting%20Rainfall%20Soil%20Losses.pdf",
    "sourceLocator": "Table 5-C 'Soil loss ratios (percent) for cropstage 4 when stalks are chopped and distributed without soil tillage', columns 'Corn or Sorghum', mulch cover 20-70%, p. 26 (rows 80-95% left out: the extracted text of those rows is not clear)",
    "checkedBy": "O4, source opened Sat 14 Nov 2026"
  },
  {
    "id": "erosion.slr.residueCover.soybean",
    "value": {
      "tilled20": 60,
      "tilled30": 46,
      "tilled40": 38,
      "tilled50": 28,
      "tilled60": 21,
      "tilled70": 15,
      "noTillInCornResidue20": 42,
      "noTillInCornResidue30": 32,
      "noTillInCornResidue40": 26,
      "noTillInCornResidue50": 19,
      "noTillInCornResidue60": 16,
      "noTillInCornResidue70": 10
    },
    "unit": "percent of the soil loss from continuous tilled fallow in the residue period (cropstage 4); key = tillage + percent residue cover",
    "appliesTo": "months between soybean harvest and the next tillage or seeding",
    "sourceTitle": "Wischmeier, W.H. and Smith, D.D. (1978). Predicting Rainfall Erosion Losses: A Guide to Conservation Planning. USDA Agriculture Handbook 537",
    "sourceUrl": "https://www.ars.usda.gov/ARSUserFiles/60600505/RUSLE/AH_537%20Predicting%20Rainfall%20Soil%20Losses.pdf",
    "sourceLocator": "Table 5-C, columns 'Soybeans' (tilled seedbed; no-till in corn residue), mulch cover 20-70%, p. 26",
    "checkedBy": "O4, source opened Sat 14 Nov 2026"
  },
  {
    "id": "erosion.ls.slopeLength75ft",
    "value": {
      "0.2": 0.075,
      "0.5": 0.09,
      "0.8": 0.107,
      "2": 0.185,
      "3": 0.264,
      "4": 0.357,
      "5": 0.464,
      "6": 0.583,
      "8": 0.859,
      "10": 1.19,
      "12": 1.56,
      "14": 1.99,
      "16": 2.46,
      "18": 2.97,
      "20": 3.53
    },
    "unit": "topographic factor LS (dimensionless, 1.0 = 72.6 ft unit plot at 9% slope); key = slope percent",
    "appliesTo": "slope weighting of the erosion indicator; the app does not know slope length, so the team uses the 75 ft column (closest to the unit plot) - a team choice, interpolate between keys",
    "sourceTitle": "Wischmeier, W.H. and Smith, D.D. (1978). Predicting Rainfall Erosion Losses: A Guide to Conservation Planning. USDA Agriculture Handbook 537",
    "sourceUrl": "https://www.ars.usda.gov/ARSUserFiles/60600505/RUSLE/AH_537%20Predicting%20Rainfall%20Soil%20Losses.pdf",
    "sourceLocator": "Table 3 'Values of the topographic factor, LS, for specific combinations of slope length and steepness', column 'Slope length 75 feet', p. 12",
    "checkedBy": "O4, source opened Sat 14 Nov 2026"
  },
  {
    "id": "pestBreak.returnYears.anyFamily",
    "value": 3,
    "unit": "years between successive plantings of production crops of the same plant family",
    "appliesTo": "default minimum return interval for every crop family without its own row; recommendation, not a hard limit (the source does not say 'never'); score penalty only",
    "sourceTitle": "USDA NRCS Conservation Practice Standard, Conservation Crop Rotation, Code 328 (September 2014)",
    "sourceUrl": "https://www.nrcs.usda.gov/sites/default/files/2022-09/Conservation_Crop_Rotation_328_CPS.pdf",
    "sourceLocator": "p. 328-3, 'Additional Considerations to Reduce Plant Pest Pressures': 'allow three years or longer between successive plantings of production crops within the same family'",
    "checkedBy": "O4, source opened Sat 14 Nov 2026"
  },
  {
    "id": "pestBreak.returnYears.soybean",
    "value": 3,
    "unit": "years between two plantings of the crop (family) in the same field; low-high = range of the minimum return times the source lists for the named diseases",
    "appliesTo": "Fabaceae (soybean): soybean cyst nematode Y (3+), sudden death syndrome Y (3); recommendation, not a hard limit (the source does not say 'never'); score penalty only",
    "sourceTitle": "Mohler, C.L. and Johnson, S.E., eds. (2009). Crop Rotation on Organic Farms: A Planning Manual. SARE / NRAES-177",
    "sourceUrl": "https://www.sare.org/wp-content/uploads/Crop-Rotation-on-Organic-Farms.pdf",
    "sourceLocator": "Appendix 3, section 'Soybean', rows 'Soybean cyst nematode' Y (3+) and 'Sudden death syndrome' Y (3), p. 136",
    "checkedBy": "O4, source opened Sat 14 Nov 2026"
  },
  {
    "id": "pestBreak.returnYears.maize",
    "value": {
      "low": 2,
      "high": 3
    },
    "unit": "years between two plantings of the crop (family) in the same field; low-high = range of the minimum return times the source lists for the named diseases",
    "appliesTo": "Poaceae (maize): Diplodia ear and stalk rot, Gibberella stalk and ear rot, northern corn leaf blight, all Y (2-3); recommendation, not a hard limit (the source does not say 'never'); score penalty only",
    "sourceTitle": "Mohler, C.L. and Johnson, S.E., eds. (2009). Crop Rotation on Organic Farms: A Planning Manual. SARE / NRAES-177",
    "sourceUrl": "https://www.sare.org/wp-content/uploads/Crop-Rotation-on-Organic-Farms.pdf",
    "sourceLocator": "Appendix 3, section 'Corn', rows 'Diplodia ear rot, stalk rot' Y (2-3) (p. 134), 'Gibberella stalk and ear rot' Y (2-3) and 'Northern corn leaf blight' Y (2-3) (p. 135)",
    "checkedBy": "O4, source opened Sat 14 Nov 2026"
  }
];
