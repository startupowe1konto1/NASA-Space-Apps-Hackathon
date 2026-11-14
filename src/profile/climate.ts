// Climate profile summaries computed from the NASA POWER monthly series.
// Every value here is our calculation (kind 'derived') on a NASA POWER model estimate.
//
// Percentile method, used everywhere in this file: nearest rank. The p-th percentile of n values
// is the ceil(p/100 x n)-th smallest value k. A year counts as dry when its value is below that limit (D26,
// hazards.json). POWER rounds GWETROOT to 2 decimals, so several years can share the limit value; they share
// the remaining dry years as fractional credit, so the drought share is exactly k/n (9 of 45 at p = 20) and
// rounding alone cannot raise a month's share.
import type { ClimateProfile, Hazard, MonthlyRisk, Sourced } from '../contracts';
import { evapotranspirationMm, rainMm, type PowerMonthly } from './power';

type Monthly = ClimateProfile['monthly'];
type Row = Monthly[number];
type Yearly = ClimateProfile['yearly'][number];

export interface Thresholds {
  droughtPercentile: number;  // 0-100; root-zone wetness below this percentile of the month's own record (ties share credit)
  heatC: number | null;       // monthly T2M_MAX above this; null = no crop-independent threshold
  frostDays: number | null;   // FROST_DAYS above this; null = no crop-independent threshold
}

export const NO_GENERAL_THRESHOLD = "no crop-independent threshold; the calendar uses each crop's own threshold";

const DATASET_IDS = ['nasa-power-monthly'];
/** April to September: the growing season for the Northern Hemisphere fields the tool covers (Iowa, Poland). */
export const GROWING_SEASON = [4, 5, 6, 7, 8, 9];
const HAZARDS: Hazard[] = ['drought', 'heat', 'frost'];

const isNumber = (x: number | null): x is number => x !== null;

/** Nearest-rank percentile: the ceil(p/100 x n)-th smallest value (at least the smallest). */
export function percentileValue(values: number[], percentile: number): number {
  if (values.length === 0) throw new Error('percentileValue of an empty list');
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.min(sorted.length, Math.max(1, Math.ceil((percentile / 100) * sorted.length)));
  return sorted[rank - 1]!;
}

/**
 * Share of values below the nearest-rank percentile, with tied values at the limit given fractional credit
 * so the share is exactly ceil(p/100 x n)/n. Null for an empty list.
 */
export function droughtShare(values: number[], percentile: number): number | null {
  const n = values.length;
  if (n === 0) return null;
  const k = Math.min(n, Math.max(1, Math.ceil((percentile / 100) * n)));
  const limit = percentileValue(values, percentile);
  const below = values.filter((v) => v < limit).length;
  const ties = values.filter((v) => v === limit).length;
  const credit = ties === 0 ? 0 : (k - below) / ties; // share of each tied year that counts as dry
  return (below + ties * credit) / n;
}

export function toMonthly(power: PowerMonthly): Monthly {
  return power.months.map((m) => ({
    year: m.year,
    month: m.month,
    rootWetness: m.GWETROOT,
    rainMm: rainMm(m),
    tMaxC: m.T2M_MAX,
    frostDays: m.FROST_DAYS,
    evapotranspirationMm: evapotranspirationMm(m),
  }));
}

function derived(value: number | null, unit: string, retrievedAt: string, missingReason: string): Sourced {
  const base = { unit, datasetIds: DATASET_IDS, kind: 'derived' as const, retrievedAt };
  return value === null ? { ...base, value: null, missingReason } : { ...base, value };
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * Share of years in which each hazard hit each calendar month.
 * Years where the month's value is null are left out of the denominator.
 */
export function monthlyRisk(monthly: Monthly, thresholds: Thresholds, source: { retrievedAt: string }): MonthlyRisk[] {
  const out: MonthlyRisk[] = [];
  for (let month = 1; month <= 12; month++) {
    const rows = monthly.filter((r) => r.month === month);
    const noData = `no NASA POWER values for ${MONTH_NAMES[month - 1]} in the record`;
    const share = (values: number[], hit: (v: number) => boolean): number | null =>
      values.length === 0 ? null : values.filter(hit).length / values.length;

    for (const hazard of HAZARDS) {
      let probability: Sourced;
      if (hazard === 'drought') {
        const values = rows.map((r) => r.rootWetness).filter(isNumber);
        probability = derived(droughtShare(values, thresholds.droughtPercentile), 'share of years', source.retrievedAt, noData);
      } else {
        const threshold = hazard === 'heat' ? thresholds.heatC : thresholds.frostDays;
        if (threshold === null) {
          probability = derived(null, 'share of years', source.retrievedAt, NO_GENERAL_THRESHOLD);
        } else {
          const values = rows.map((r) => (hazard === 'heat' ? r.tMaxC : r.frostDays)).filter(isNumber);
          probability = derived(share(values, (v) => v > threshold), 'share of years', source.retrievedAt, noData);
        }
      }
      out.push({ month, hazard, probability });
    }
  }
  return out;
}

function byYear(monthly: Monthly): Map<number, Row[]> {
  const years = new Map<number, Row[]>();
  for (const r of monthly) {
    const list = years.get(r.year) ?? [];
    list.push(r);
    years.set(r.year, list);
  }
  return new Map([...years.entries()].sort((a, b) => a[0] - b[0]));
}

/** The values of `key` for the given months, or null when any of them is missing or null. */
function complete(rows: Row[], months: number[], key: 'rootWetness' | 'rainMm' | 'tMaxC' | 'frostDays'): number[] | null {
  const values: number[] = [];
  for (const month of months) {
    const v = rows.find((r) => r.month === month)?.[key] ?? null;
    if (v === null) return null;
    values.push(v);
  }
  return values;
}

const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const sum = (v: number[]) => v.reduce((a, b) => a + b, 0);

function growingSeasonMean(rows: Row[]): number | null {
  const values = complete(rows, GROWING_SEASON, 'rootWetness');
  return values === null ? null : sum(values) / values.length;
}

/** One summary row per year. A value is null when a month it needs is missing. */
export function yearly(monthly: Monthly, source: { retrievedAt: string }): Yearly[] {
  const at = source.retrievedAt;
  return [...byYear(monthly).entries()].map(([year, rows]) => {
    const seasonGap = `a month of April to September ${year} is missing in NASA POWER`;
    const yearGap = `a month of ${year} is missing in NASA POWER`;
    const temps = complete(rows, ALL_MONTHS, 'tMaxC');
    const frost = complete(rows, ALL_MONTHS, 'frostDays');
    const rain = complete(rows, ALL_MONTHS, 'rainMm');
    return {
      year,
      growingSeasonWetness: derived(growingSeasonMean(rows), 'share of saturation, April to September', at, seasonGap),
      maxTempC: derived(temps === null ? null : Math.max(...temps), '°C', at, yearGap),
      frostDays: derived(frost === null ? null : sum(frost), 'days', at, yearGap),
      rainMm: derived(rain === null ? null : sum(rain), 'mm', at, yearGap),
    };
  });
}

/**
 * Years whose growing-season (April to September) mean root-zone wetness is at or below the
 * nearest-rank `percentile` of all years' growing-season means. Years with a gap in the season are left out.
 */
export function droughtYears(monthly: Monthly, percentile: number): number[] {
  const means = [...byYear(monthly).entries()].flatMap(([year, rows]) => {
    const m = growingSeasonMean(rows);
    return m === null ? [] : [{ year, m }];
  });
  if (means.length === 0) return [];
  const limit = percentileValue(
    means.map((x) => x.m),
    percentile,
  );
  return means.filter((x) => x.m <= limit).map((x) => x.year);
}
