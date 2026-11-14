// Income score (SPEC section 7 "Income score"). A replay of the field's own climate record at today's prices: what
// the rotation would have earned here in each past year. It is not a forecast and it promises no yield.
//
// Per crop and record year the yield comes from the same hazard checks as climate resilience (`yearlyHitsDetailed`):
// - drought: the largest (shortfall × yield response factor) over the crop's drought-sensitive months, in every year
//   below the median, hit or not; the shortfall is (median − wetness) / median of root-zone wetness for that calendar
//   month on this field (`shortfallVsMedian`, SPEC 7). The drought limit (D30) only decides resilience hits;
// - heat and frost: each sensitive row (hazard + months) with a hit in any of its months adds its `lossShare`;
// - the total loss is capped at 1; yield = reference yield × (1 − loss).
// margin = yield × price − direct costs. The rotation's margin in a year is the mean over its main crops; cover
// crops earn nothing here and cost nothing here (their seed cost is not in the money tables yet).
import type {
  AsyncResult,
  ClimateProfile,
  CropEconomics,
  CropId,
  CropTraits,
  Message,
  MoneyEstimate,
  RotationOption,
  Score,
  Sourced,
} from '../contracts';
import { percentile, recordYears, yearlyHitsDetailed } from './resilience';

/** Every Message code this module emits. The English text for each belongs in src/engine/messages/en.json. */
export const INCOME_MESSAGE_CODES = [
  // "What this rotation would have earned on this field over {years} past years at today's prices. Not a forecast."
  'income.basis.replay',
  // "No sourced price, yield or direct costs for {crop}, so income is not estimated for this rotation."
  'income.no-price',
  // "No yield response factor for {crop}, so its yield in dry years cannot be replayed."
  'income.no-yield-response',
  // "The climate record has no year in which every crop of this rotation could be checked, so income is not estimated."
  'income.no-climate-years',
  // "{programme}: the rate for this campaign could not be confirmed, so it is left out of the income."
  'gap.payment-unconfirmed',
  // "{programme}: no sourced rate per hectare, so it is left out of the income."
  'gap.payment-no-rate',
  // "{count} of {years} past years had missing climate data and were left out of the income replay."
  'gap.income-years-left-out',
] as const;

const RANGE_BASIS = '10th–90th percentile year of the record, at today’s prices';

const round = (x: number, digits: number) => {
  const f = 10 ** digits;
  return Math.round(x * f) / f;
};

export interface YearYield {
  year: number;
  yieldTPerHa: number;
  loss: number; // 0–1
}

/**
 * Yield of one crop in each record year. A year in which every check of the crop is missing is left out (never
 * filled). A crop with no sensitive months gets the reference yield in every record year. Throws when the crop is
 * drought-sensitive and has no yield response factor (cover crops may lack one; income uses main crops only).
 */
export function yearlyYield(
  crop: CropTraits,
  climate: ClimateProfile,
  referenceYieldTPerHa: number,
  droughtPercentile: number,
): YearYield[] {
  const years = recordYears(climate);
  const ky = (crop as { yieldResponseFactor?: number }).yieldResponseFactor;
  const droughtSensitive = crop.sensitive.some((s) => s.hazard === 'drought' && s.months.length > 0);
  if (droughtSensitive && (ky === undefined || ky === null || !Number.isFinite(ky))) {
    throw new Error(`income: no yield response factor for '${crop.id}'`);
  }
  const hasChecks = crop.sensitive.some((s) => s.months.length > 0);
  const { rows } = yearlyHitsDetailed(crop, climate, droughtPercentile);

  const out: YearYield[] = [];
  for (const year of years) {
    const yearRows = rows.filter((r) => r.year === year);
    if (hasChecks && yearRows.length === 0) continue; // every check missing: leave the year out

    let drought = 0;
    let other = 0;
    for (const s of crop.sensitive) {
      const inMonths = yearRows.filter((r) => r.hazard === s.hazard && s.months.includes(r.month));
      if (s.hazard === 'drought') {
        for (const r of inMonths) drought = Math.max(drought, (r.shortfallVsMedian ?? 0) * (ky as number));
      } else if (inMonths.some((r) => r.hit)) {
        other += s.lossShare;
      }
    }
    const loss = Math.min(1, drought + other);
    out.push({ year, yieldTPerHa: referenceYieldTPerHa * (1 - loss), loss });
  }
  return out;
}

export interface IncomeResult {
  estimate: MoneyEstimate;
  /** Rotation margin per replayed record year (mean over its main crops), in record-year order. No payments. */
  perYearMargins: number[];
  /** Sum of payments with `confirmed: true` and a sourced rate, per ha. Added to the income, not to marginPerHa. */
  confirmedPaymentsPerHa: number;
  /** Payments left out of the sum and record years left out of the replay. */
  gaps: Message[];
  /** Number of record years replayed. */
  years: number;
  /** False when a record year was left out or a hazard check was missing for a main crop. */
  complete: boolean;
}

const isSourced = (s: Sourced | undefined): s is Sourced & { value: number } =>
  s !== undefined && s.value !== null && Number.isFinite(s.value);

/**
 * The rotation's margin replayed over the record at today's prices. Returns `no-data` (never an estimate) when a main
 * crop lacks a sourced yield, price or direct costs, or a yield response factor, or when no year can be replayed.
 */
export function incomeEstimate(
  years: RotationOption['years'],
  crops: CropTraits[],
  climate: ClimateProfile,
  economics: CropEconomics[],
  payments: MoneyEstimate['payments'],
  currency: MoneyEstimate['currency'],
  campaign: string,
  droughtPercentile: number,
): AsyncResult<IncomeResult> {
  const mainIds: CropId[] = [...new Set(years.map((y) => y.crop))];

  const perCrop = new Map<CropId, Map<number, number>>(); // crop → year → margin
  const datasetIds = new Set<string>(climate.source.datasetIds);
  const dates: string[] = [climate.source.retrievedAt];
  let complete = true;

  for (const id of mainIds) {
    const econ = economics.find((e) => e.crop === id);
    if (!econ || !isSourced(econ.referenceYieldTPerHa) || !isSourced(econ.pricePerT) || !isSourced(econ.directCostsPerHa)) {
      return { status: 'no-data', reason: { code: 'income.no-price', params: { crop: id } } };
    }
    const crop = crops.find((c) => c.id === id);
    if (!crop) throw new Error(`income: no crop traits for '${id}'`);

    let rows: YearYield[];
    try {
      rows = yearlyYield(crop, climate, econ.referenceYieldTPerHa.value, droughtPercentile);
    } catch {
      return { status: 'no-data', reason: { code: 'income.no-yield-response', params: { crop: id } } };
    }
    if (yearlyHitsDetailed(crop, climate, droughtPercentile).missing.length > 0) complete = false;

    const price = econ.pricePerT.value;
    const cost = econ.directCostsPerHa.value;
    perCrop.set(id, new Map(rows.map((r) => [r.year, r.yieldTPerHa * price - cost])));
    for (const s of [econ.referenceYieldTPerHa, econ.pricePerT, econ.directCostsPerHa]) {
      s.datasetIds.forEach((d) => datasetIds.add(d));
      dates.push(s.retrievedAt);
    }
  }

  // Rotation margin per year: only years in which every main crop could be replayed.
  const record = recordYears(climate);
  const perYearMargins: number[] = [];
  for (const year of record) {
    const margins = mainIds.map((id) => perCrop.get(id)!.get(year));
    if (margins.some((m) => m === undefined)) continue;
    perYearMargins.push((margins as number[]).reduce((a, b) => a + b, 0) / margins.length);
  }
  if (perYearMargins.length === 0) return { status: 'no-data', reason: { code: 'income.no-climate-years' } };

  const gaps: Message[] = [];
  const leftOut = record.length - perYearMargins.length;
  if (leftOut > 0) {
    complete = false;
    gaps.push({ code: 'gap.income-years-left-out', params: { count: leftOut, years: record.length } });
  }

  let confirmedPaymentsPerHa = 0;
  for (const p of payments) {
    if (!p.confirmed) gaps.push({ code: 'gap.payment-unconfirmed', params: { programme: p.programme } });
    else if (!isSourced(p.amountPerHa)) gaps.push({ code: 'gap.payment-no-rate', params: { programme: p.programme } });
    else confirmedPaymentsPerHa += p.amountPerHa.value;
  }

  const mean = perYearMargins.reduce((a, b) => a + b, 0) / perYearMargins.length;
  const marginPerHa: Sourced = {
    value: round(mean, 2),
    unit: `${currency}/ha`,
    datasetIds: [...datasetIds],
    kind: 'derived',
    retrievedAt: dates.reduce((a, b) => (b > a ? b : a)),
    range: {
      low: round(percentile(perYearMargins, 10), 2),
      high: round(percentile(perYearMargins, 90), 2),
      basis: RANGE_BASIS,
    },
  };

  return {
    status: 'ready',
    data: {
      estimate: { marginPerHa, currency, payments, campaign },
      perYearMargins,
      confirmedPaymentsPerHa,
      gaps,
      years: perYearMargins.length,
      complete,
    },
  };
}

/** What `incomeScores` compares: margin plus confirmed payments, per ha, mean and bad/good year. */
export interface IncomeTotal {
  meanPerHa: number;
  lowPerHa: number; // 10th percentile year + confirmed payments
  highPerHa: number; // 90th percentile year + confirmed payments
  years: number;
  complete: boolean;
}

export function incomeTotal(r: IncomeResult): IncomeTotal {
  const m = r.estimate.marginPerHa;
  const pay = r.confirmedPaymentsPerHa;
  return {
    meanPerHa: (m.value as number) + pay,
    lowPerHa: m.range!.low + pay,
    highPerHa: m.range!.high + pay,
    years: r.years,
    complete: r.complete,
  };
}

/**
 * Income scores of the candidates of one field: mean margin plus confirmed payments, scaled so the lowest candidate is
 * 0 and the highest 100 (all equal, or one candidate: 50). low/high are the bad-year and good-year totals scaled the
 * same way and clamped to 0–100. Confidence is never strong: 'moderate', or 'weak' when climate data was missing.
 */
export function incomeScores(totals: Record<string, IncomeTotal>): Record<string, Score> {
  const ids = Object.keys(totals);
  if (ids.length === 0) return {};
  const means = ids.map((id) => totals[id]!.meanPerHa);
  const min = Math.min(...means);
  const max = Math.max(...means);
  const span = max - min;
  const scale = (x: number) => (span === 0 ? 50 : round(Math.min(100, Math.max(0, ((x - min) / span) * 100)), 1));

  const out: Record<string, Score> = {};
  for (const id of ids) {
    const t = totals[id]!;
    out[id] = {
      value: scale(t.meanPerHa),
      low: scale(t.lowPerHa),
      high: scale(t.highPerHa),
      confidence: t.complete ? 'moderate' : 'weak',
      basis: { code: 'income.basis.replay', params: { years: t.years } },
    };
  }
  return out;
}
