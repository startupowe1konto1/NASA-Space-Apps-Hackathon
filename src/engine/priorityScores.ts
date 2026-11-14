// Step 4 priority scores that are not part of soil health: forage and water (SPEC 7, "Water priority").
//
// Water method (one of the two SPEC options): the crop's growing-season rain on this field, summed over its months
// in the ground (sowMonth..harvestMonth; a winter crop starts in the previous calendar year), is compared with a
// seasonal need in mm for its need class. analyzeField passes the needs from the data/rules rows
// 'water.needMm.<class>' (EngineRules.waterNeedMm) and scores water only when they exist (#105 item 6).
// Evapotranspiration is not used. Rain alone against a class need is a coarse check, so the water score is never
// 'strong': 'moderate' with a complete record, 'weak' when a season had to be skipped for a gap in the rain record.
import type { ClimateProfile, CropTraits, RotationOption, Score, WaterNeed } from '../contracts';
import { cropById } from './calendar';


/** Every message code this module emits, with the intended English text (task O3-B6 writes messages/en.json). */
export const PRIORITY_MESSAGE_CODES = [
  'priority.basis.forage', //        "{forageYears} of {years} rotation years give forage: a forage crop or a grazed cover crop. Counted from crop traits."
  'priority.basis.water', //         "Growing-season rain alone (evapotranspiration not counted) covered the crop's seasonal need in {coveredYears} of {cropYears} crop-years on this field's NASA POWER record (a model estimate). Range: 10th to 90th percentile year."
  'priority.basis.water-no-data', // "No growing season in the rain record is complete, so the water need could not be checked."
  'priority.basis.water-no-need-class', // "No crop in this rotation has a water need class, so the water need could not be checked."
] as const;
export type PriorityMessageCode = (typeof PRIORITY_MESSAGE_CODES)[number];

type Years = RotationOption['years'];
const round = (x: number) => Math.round(x * 10) / 10;

/** Share of rotation years with a forage main crop or a forage (grazed) cover crop, × 100. */
export function forageScore(years: Years, crops: CropTraits[]): Score {
  const forageYears = years.filter(
    (y) => cropById(crops, y.crop).forage || (y.coverCrop !== undefined && cropById(crops, y.coverCrop).forage),
  ).length;
  const value = years.length === 0 ? 0 : round((100 * forageYears) / years.length);
  return { value, low: value, high: value, confidence: 'strong', basis: { code: 'priority.basis.forage', params: { forageYears, years: years.length } } };
}

/** Nearest-rank percentile of sorted values. */
const percentile = (sorted: number[], p: number) => sorted[Math.round(p * (sorted.length - 1))] ?? 0;

/**
 * Share of crop-years (main crop of each rotation year × each year of the climate record) in which growing-season rain
 * reached the need of the crop's class. A season that runs before the record starts is left out; a season with a
 * missing month is left out and lowers confidence to weak. A crop without a water need class is skipped; when every
 * crop is, the basis is 'priority.basis.water-no-need-class'.
 *
 * `waterNeedMm` is the seasonal need in mm per class, from the 'water.needMm.<class>' rows. Confidence is at most
 * 'moderate', because rain alone against a class need is a coarse check.
 */
export function waterScore(
  years: Years,
  crops: CropTraits[],
  climate: ClimateProfile,
  waterNeedMm: Record<WaterNeed, number>,
): Score {
  const rain = new Map<string, number | null>();
  for (const m of climate.monthly) rain.set(`${m.year}-${m.month}`, m.rainMm);
  const recordYears = [...new Set(climate.monthly.map((m) => m.year))].sort((a, b) => a - b);

  let checked = 0;
  let covered = 0;
  let gaps = false;
  const perYear: number[] = [];
  for (const year of recordYears) {
    let yearChecked = 0;
    let yearCovered = 0;
    for (const y of years) {
      const crop = cropById(crops, y.crop);
      const need = crop.waterNeed;
      if (need === undefined) continue; // cover crops may carry no water need class (#44)
      const months: [number, number][] = [];
      if (crop.harvestMonth < crop.sowMonth) {
        for (let m = crop.sowMonth; m <= 12; m++) months.push([year - 1, m]);
        for (let m = 1; m <= crop.harvestMonth; m++) months.push([year, m]);
      } else {
        for (let m = crop.sowMonth; m <= crop.harvestMonth; m++) months.push([year, m]);
      }
      const values = months.map(([yy, mm]) => rain.get(`${yy}-${mm}`));
      if (values.some((v) => v === undefined)) continue; // outside the record
      if (values.some((v) => v === null)) {
        gaps = true;
        continue;
      }
      const seasonRain = values.reduce<number>((a, b) => a + (b ?? 0), 0);
      yearChecked++;
      if (seasonRain >= waterNeedMm[need]) yearCovered++;
    }
    if (yearChecked > 0) perYear.push(yearCovered / yearChecked);
    checked += yearChecked;
    covered += yearCovered;
  }

  if (!years.some((y) => cropById(crops, y.crop).waterNeed !== undefined)) {
    // Placeholder value: no crop could be checked at all, whatever the record holds.
    return { value: 0, low: 0, high: 0, confidence: 'weak', basis: { code: 'priority.basis.water-no-need-class' } };
  }
  if (checked === 0) {
    // Placeholder value: nothing was checked, the basis says so and confidence is weak.
    return { value: 0, low: 0, high: 0, confidence: 'weak', basis: { code: 'priority.basis.water-no-data' } };
  }
  const sorted = [...perYear].sort((a, b) => a - b);
  return {
    value: round((100 * covered) / checked),
    low: round(100 * percentile(sorted, 0.1)),
    high: round(100 * percentile(sorted, 0.9)),
    confidence: gaps ? 'weak' : 'moderate', // coarse check: rain only, one need per class
    basis: { code: 'priority.basis.water', params: { coveredYears: covered, cropYears: checked } },
  };
}
