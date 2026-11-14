// Climate resilience score and calendar exposure (SPEC section 7 "Climate resilience", section 8 "Calendar strip").
// Both use the same per-crop hazard checks from `yearlyHits`, so the calendar marks and the score always agree.
//
// Hazard checks, per record year and per (hazard, month) the crop is sensitive to:
// - drought: the month's root-zone wetness is strictly below the crop's percentile (`threshold`, e.g. 20) of the
//   field's own record for the same calendar month (all years, missing months left out). Percentiles use linear
//   interpolation between closest ranks (h = (n − 1) · p). With 45 distinct values the 20th percentile lies between
//   the 9th and 10th lowest, so exactly 9 years are hit. "Strictly below" means a month with the same wetness every
//   year is never a drought.
// - heat: the month's maximum temperature (°C) is above `threshold`.
// - frost: the month's frost days are above `threshold`.
// A check reads the record month of the same calendar year as the record year (a climatological frequency: for a
// winter crop the autumn months come from the same record year, not the previous one).
import type { CalendarMonth, ClimateProfile, CropId, CropTraits, Hazard, Message, RotationOption, Score } from '../contracts';

/** Every Message code this module emits. The English text for each lives in src/engine/messages/en.json (task O3-B6). */
export const RESILIENCE_MESSAGE_CODES = [
  // "Share of crop-years without drought, heat or frost damage at this field, {years} years ({from}–{to}); the range is the 10th to 90th percentile year."
  'resilience.basis.years',
  // "Share of crop-years without drought, heat or frost damage at this field, {years} years ({from}–{to}); {count} of {needed} months the crops need are missing from the record and were left out."
  'resilience.basis.missing-months',
] as const;

type Row = ClimateProfile['monthly'][number];

export interface HazardHit { year: number; month: number; hazard: Hazard; hit: boolean; deficit: number }
export interface MissingCheck { year: number; month: number; hazard: Hazard }

const VARIABLE: Record<Hazard, 'rootWetness' | 'tMaxC' | 'frostDays'> = {
  drought: 'rootWetness',
  heat: 'tMaxC',
  frost: 'frostDays',
};

/** Percentile p (0–100) of the values by linear interpolation between closest ranks. Needs at least one value. */
export function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const h = (sorted.length - 1) * (p / 100);
  const lo = Math.floor(h);
  const hi = Math.ceil(h);
  const a = sorted[lo] as number;
  const b = sorted[hi] as number;
  return a + (h - lo) * (b - a);
}

const round = (x: number, digits: number) => {
  const f = 10 ** digits;
  return Math.round(x * f) / f;
};

/** The years the record spans, first to last, including years with no rows. */
export function recordYears(climate: ClimateProfile): number[] {
  if (climate.monthly.length === 0) return [];
  const ys = climate.monthly.map((r) => r.year);
  const from = Math.min(...ys);
  const to = Math.max(...ys);
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

const rowIndex = (climate: ClimateProfile) => {
  const index = new Map<string, Row>();
  for (const row of climate.monthly) index.set(`${row.year}-${row.month}`, row);
  return (year: number, month: number) => index.get(`${year}-${month}`);
};

/**
 * Hazard checks of one crop over the record, plus the checks that could not be made because the input month is
 * missing (no row, or the needed value is null). Missing checks get no row in `rows`.
 */
export function yearlyHitsDetailed(
  crop: CropTraits,
  climate: ClimateProfile,
): { rows: HazardHit[]; missing: MissingCheck[] } {
  const years = recordYears(climate);
  const get = rowIndex(climate);
  const rows: HazardHit[] = [];
  const missing: MissingCheck[] = [];

  for (const s of crop.sensitive) {
    const variable = VARIABLE[s.hazard];
    for (const month of s.months) {
      const values = years.map((year) => get(year, month)?.[variable] ?? null);
      const present = values.filter((v): v is number => v !== null);
      const limit = s.hazard === 'drought' && present.length > 0 ? percentile(present, s.threshold) : 0;
      const median = s.hazard === 'drought' && present.length > 0 ? percentile(present, 50) : 0;

      years.forEach((year, i) => {
        const v = values[i] ?? null;
        if (v === null) {
          missing.push({ year, month, hazard: s.hazard });
          return;
        }
        let hit: boolean;
        let deficit = 0;
        if (s.hazard === 'drought') {
          hit = v < limit;
          if (hit && median > 0) deficit = Math.max(0, (median - v) / median);
        } else {
          hit = v > s.threshold;
        }
        rows.push({ year, month, hazard: s.hazard, hit, deficit });
      });
    }
  }
  return { rows, missing };
}

/** One row per record year × each (hazard, month) the crop is sensitive to. Missing input months are omitted. */
export function yearlyHits(crop: CropTraits, climate: ClimateProfile): HazardHit[] {
  return yearlyHitsDetailed(crop, climate).rows;
}

function cropById(crops: CropTraits[], id: CropId): CropTraits {
  const crop = crops.find((c) => c.id === id);
  if (!crop) throw new Error(`resilience: no crop traits for '${id}'`);
  return crop;
}

/**
 * Climate resilience of a rotation: the share of crop-years (main crop × record year) without a hazard hit, × 100.
 * Cover crops are not scored. A crop-year is hit when any of its checks hit; a crop-year with no hit but a missing
 * check is unknown and left out (never counted as safe). low/high = 10th and 90th percentile of the per-year share
 * of the rotation's crops without a hit.
 */
export function resilienceScore(years: RotationOption['years'], crops: CropTraits[], climate: ClimateProfile): Score {
  if (years.length === 0) throw new Error('resilience: empty rotation');
  const record = recordYears(climate);
  if (record.length === 0) throw new Error('resilience: empty climate record');
  const from = record[0] as number;
  const to = record[record.length - 1] as number;

  const mains = years.map((y) => cropById(crops, y.crop));
  const checks = new Map<CropId, { hit: Set<number>; missing: Set<number> }>();
  const neededMonths = new Set<string>();
  const missingMonths = new Set<string>();

  for (const crop of mains) {
    if (checks.has(crop.id)) continue;
    const { rows, missing } = yearlyHitsDetailed(crop, climate);
    checks.set(crop.id, {
      hit: new Set(rows.filter((r) => r.hit).map((r) => r.year)),
      missing: new Set(missing.map((m) => m.year)),
    });
    for (const s of crop.sensitive) for (const m of s.months) for (const y of record) neededMonths.add(`${y}-${m}`);
    for (const m of missing) missingMonths.add(`${m.year}-${m.month}`);
  }

  let known = 0;
  let safe = 0;
  const perYear: number[] = [];
  for (const year of record) {
    let yearKnown = 0;
    let yearSafe = 0;
    for (const crop of mains) {
      const c = checks.get(crop.id)!;
      if (c.hit.has(year)) yearKnown++;
      else if (!c.missing.has(year)) {
        yearKnown++;
        yearSafe++;
      }
    }
    known += yearKnown;
    safe += yearSafe;
    if (yearKnown > 0) perYear.push(yearSafe / yearKnown);
  }
  if (known === 0) throw new Error('resilience: no crop-year could be checked against the climate record');

  const value = round((safe / known) * 100, 1);
  // The 10th–90th percentile years usually bracket the mean; clamp so the range always contains the value.
  const low = Math.min(value, round(percentile(perYear, 10) * 100, 1));
  const high = Math.max(value, round(percentile(perYear, 90) * 100, 1));

  const count = missingMonths.size;
  const needed = neededMonths.size;
  const yearsParams = { years: record.length, from, to };
  let confidence: Score['confidence'] = 'strong';
  let basis: Message = { code: 'resilience.basis.years', params: yearsParams };
  if (count > 0) {
    confidence = count / needed > 0.1 ? 'weak' : 'moderate';
    basis = { code: 'resilience.basis.missing-months', params: { count, needed, ...yearsParams } };
  }
  return { value, low, high, confidence, basis };
}

/**
 * Adds hazard marks to calendar cells. A cell with a crop or cover crop in the ground gets one entry per hazard the
 * crop is sensitive to that month, when the share of record years with a hit (from `yearlyHits`) is above
 * `markShare` (rule `hazards.calendar.markShare` in data/rules/hazards.json). Other cells get no entries.
 */
export function withExposure(
  months: Omit<CalendarMonth, 'exposure'>[],
  crops: CropTraits[],
  climate: ClimateProfile,
  markShare: number,
): CalendarMonth[] {
  const cache = new Map<CropId, HazardHit[]>();
  const hitsOf = (crop: CropTraits) => {
    let rows = cache.get(crop.id);
    if (!rows) {
      rows = yearlyHits(crop, climate);
      cache.set(crop.id, rows);
    }
    return rows;
  };

  return months.map((cell) => {
    if ((cell.cover !== 'crop' && cell.cover !== 'cover-crop') || !cell.crop) return { ...cell, exposure: [] };
    const crop = cropById(crops, cell.crop);
    const exposure: CalendarMonth['exposure'] = [];
    for (const s of crop.sensitive) {
      if (!s.months.includes(cell.month)) continue;
      const rows = hitsOf(crop).filter((r) => r.month === cell.month && r.hazard === s.hazard);
      if (rows.length === 0) continue; // the whole record is missing for this month: no mark, nothing invented
      const share = rows.filter((r) => r.hit).length / rows.length;
      if (share <= markShare) continue;
      exposure.push({
        hazard: s.hazard,
        probability: {
          value: round(share, 3),
          unit: 'share of years',
          datasetIds: climate.source.datasetIds,
          kind: 'derived',
          retrievedAt: climate.source.retrievedAt,
        },
      });
    }
    return { ...cell, exposure };
  });
}
