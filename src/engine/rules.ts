// Rule tables from data/rules/*.json (owner O4, task O4-B0). Each file is an array of rule rows with a source.
// Rows that the engine needs before those files are on the branch fall back to copies of the same rows from
// PR #24 (team decisions in SPEC section 7 and DECISIONS D9/D20, and the GAEZ and drought rows with their sources).
// A row in a file always wins over its fallback.
import { z } from 'zod';
import type { CropTraits, FieldProfile, GoalId, RotationOption } from '../contracts';
import type { SoilRules } from './soilHealth';
import { ruleRow } from '../contracts/schemas';

export type RuleRow = z.infer<typeof ruleRow>;

const DECISIONS_URL = 'https://github.com/startupowe1konto1/nasa-space-apps-hackathon/blob/main/docs/DECISIONS.md';
const SPEC_URL = 'https://github.com/startupowe1konto1/nasa-space-apps-hackathon/blob/main/docs/SPEC.md';
const GAEZ_LEGEND = "FAO GAEZ v4 res05 ImageServer legend, renderer 'Crop Suitability Index in Classes - All Land in Grid Cell'";

const goalRow = (id: string, value: RuleRow['value'], appliesTo: string): RuleRow => ({
  id,
  value,
  unit: 'weight (sums to 1)',
  appliesTo,
  sourceTitle: 'team decision D9',
  sourceUrl: DECISIONS_URL,
  sourceLocator: "D9 and SPEC section 7, table 'Total and ranking by goal'",
  checkedBy: 'O4, team decision',
});

/** Copies of rows in data/rules/hazards.json and goals.json (PR #24). Used only when the file has no such row. */
export const FALLBACK_RULES: RuleRow[] = [
  {
    id: 'hazards.drought.percentile',
    value: 20,
    unit: "percentile of the field's own monthly root-zone wetness (NASA POWER GWETROOT), all years of the record",
    appliesTo: 'drought check for every crop in its sensitive months; a month below this percentile counts as drought',
    sourceTitle: 'U.S. Drought Monitor, Drought Classification',
    sourceUrl: 'https://droughtmonitor.unl.edu/About/AbouttheData/DroughtClassification.aspx',
    sourceLocator: "table 'Percentile Range for Most Indicators': D1 Moderate Drought = 10.01 to 20.00",
    checkedBy: 'O4, source opened Sat 14 Nov 2026',
  },
  {
    id: 'hazards.calendar.markShare',
    value: 0.2,
    unit: 'share of years (0-1)',
    appliesTo:
      'calendar strip: a month cell gets a hazard mark when the crop in the ground is sensitive and the hazard occurred in more than this share of years',
    sourceTitle: 'team rule of thumb',
    sourceUrl: SPEC_URL,
    sourceLocator: 'SPEC section 8, calendar strip; value set by the team, shown on screen as a rule of thumb',
    checkedBy: 'O4, team rule',
  },
  {
    id: 'hazards.gaez.notSuitableBelowSI',
    value: 10,
    unit: 'GAEZ v4 crop suitability index (SI, 0-100)',
    appliesTo:
      "crops with SI at or below this value at the field (class 'Very marginal', 'Not suitable' or 'No cultivation') are excluded before scoring",
    sourceTitle: GAEZ_LEGEND,
    sourceUrl: 'https://gaez-services.fao.org/server/rest/services/res05/ImageServer/legend?f=json',
    sourceLocator: "legend classes: 'SI > 10 : Marginal', 'SI > 0 : Very marginal', 'Not suitable'; SPEC section 7 excludes below 'Marginal'",
    checkedBy: 'O4, source opened Sat 14 Nov 2026',
  },
  goalRow(
    'goals.keepSoil.weights',
    { soilHealth: 0.4, climateResilience: 0.45, priorities: 0.15 },
    "total score under the goal 'Keep my soil' (default)",
  ),
  goalRow('goals.improveSoil.weights', { soilHealth: 0.6, climateResilience: 0.25, priorities: 0.15 }, "total score under the goal 'Improve my soil'"),
  goalRow(
    'goals.income.weights',
    { soilHealth: 0.3, climateResilience: 0.2, income: 0.4, priorities: 0.1 },
    "total score under the goal 'Income'",
  ),
  {
    id: 'goals.soilFloor.points',
    value: 5,
    unit: 'soil health points (0-100 scale)',
    appliesTo: "goals keepSoil and income: a rotation more than this many points below the current rotation's soil health is not offered",
    sourceTitle: 'team decision D9',
    sourceUrl: DECISIONS_URL,
    sourceLocator: "D9: 'A rotation more than 5 points below the current rotation's soil health is not offered'",
    checkedBy: 'O4, team decision',
  },
  {
    id: 'goals.priorityDoubling.factor',
    value: 2,
    unit: 'multiplier on an indicator weight',
    appliesTo: "soil health: a farmer priority for nitrogen, erosion or organic matter doubles that indicator's weight",
    sourceTitle: 'team rule of thumb',
    sourceUrl: SPEC_URL,
    sourceLocator: "SPEC section 7, 'Soil health = weighted mean of the four indicators'",
    checkedBy: 'O4, team rule',
  },
  {
    id: 'goals.shownOthers.count',
    value: 3,
    unit: 'rotations',
    appliesTo: 'each goal shows the current rotation plus this many best others',
    sourceTitle: 'team decision D20 (a)',
    sourceUrl: DECISIONS_URL,
    sourceLocator: 'DECISIONS D20 (a) and SPEC section 8',
    checkedBy: 'O4, team decision',
  },
];

export interface LoadedRules {
  byId: Map<string, RuleRow>;
  /** Rows per file, keyed by the file name without '.json' (e.g. 'nitrogen'). Only files that exist. */
  byFile: Record<string, RuleRow[]>;
}

const rowList = z.array(ruleRow);

/** Parses rule files (path → JSON content) and lays them over the fallback rows. A malformed file throws. */
export function loadRules(files: Record<string, unknown>): LoadedRules {
  const byId = new Map(FALLBACK_RULES.map((r) => [r.id, r]));
  const byFile: Record<string, RuleRow[]> = {};
  for (const [path, content] of Object.entries(files).sort(([a], [b]) => a.localeCompare(b))) {
    const parsed = rowList.safeParse(content);
    if (!parsed.success) throw new Error(`rules: ${path} is not a list of sourced rule rows: ${parsed.error.message}`);
    const name = path.split('/').pop()!.replace(/\.json$/, '');
    byFile[name] = parsed.data;
    for (const r of parsed.data) byId.set(r.id, r);
  }
  return { byId, byFile };
}

export interface GoalWeights { soilHealth: number; climateResilience: number; priorities: number; income?: number }

export interface EngineRules {
  markShare: number;
  /** Drought limit (D30): percentile of the field's monthly root-zone wetness, all years of the record. */
  droughtPercentile: number;
  notSuitableBelowSI: number;
  floorPoints: number;
  shownOthers: number;
  doublingFactor: number;
  weights: Record<GoalId, GoalWeights>;
  /** Rule ids behind each number above, for Evidence.ruleIds. */
  ids: { markShare: string; gaez: string; floor: string; drought: string; weights: Record<GoalId, string> };
}

function numberOf(rules: LoadedRules, id: string): number {
  const v = rules.byId.get(id)?.value;
  if (typeof v !== 'number') throw new Error(`rules: '${id}' must be a number`);
  return v;
}

function weightsOf(rules: LoadedRules, id: string): GoalWeights {
  const v = rules.byId.get(id)?.value;
  if (typeof v !== 'object' || v === null) throw new Error(`rules: '${id}' must be a weight table`);
  const { soilHealth, climateResilience, priorities, income } = v;
  if (soilHealth === undefined || climateResilience === undefined || priorities === undefined) {
    throw new Error(`rules: '${id}' needs soilHealth, climateResilience and priorities`);
  }
  return income === undefined ? { soilHealth, climateResilience, priorities } : { soilHealth, climateResilience, priorities, income };
}

export function engineRules(rules: LoadedRules): EngineRules {
  const weightIds: Record<GoalId, string> = {
    keepSoil: 'goals.keepSoil.weights',
    improveSoil: 'goals.improveSoil.weights',
    income: 'goals.income.weights',
  };
  return {
    markShare: numberOf(rules, 'hazards.calendar.markShare'),
    droughtPercentile: numberOf(rules, 'hazards.drought.percentile'),
    notSuitableBelowSI: numberOf(rules, 'hazards.gaez.notSuitableBelowSI'),
    floorPoints: numberOf(rules, 'goals.soilFloor.points'),
    shownOthers: numberOf(rules, 'goals.shownOthers.count'),
    doublingFactor: numberOf(rules, 'goals.priorityDoubling.factor'),
    weights: {
      keepSoil: weightsOf(rules, weightIds.keepSoil),
      improveSoil: weightsOf(rules, weightIds.improveSoil),
      income: weightsOf(rules, weightIds.income),
    },
    ids: {
      markShare: 'hazards.calendar.markShare',
      gaez: 'hazards.gaez.notSuitableBelowSI',
      floor: 'goals.soilFloor.points',
      drought: 'hazards.drought.percentile',
      weights: weightIds,
    },
  };
}

// A glob with no matching file yields {}, so the build stays green before data/rules exists.
const ruleFiles = import.meta.glob('../../data/rules/*.json', { eager: true, import: 'default' });

/** The rule tables shipped with the app, over the fallback rows. */
export const shippedRules: LoadedRules = loadRules(ruleFiles);

// ---------- soil rules: O4's tables (data/rules, PR #27) in the shape O3-B5's soilHealth reads ----------
//
// Every derived row keeps the source fields of the O4 row it comes from; `sourceIds` maps each derived id to the
// O4 row ids, so Evidence.ruleIds can name rows that exist in data/rules. Rows already in soilHealth's shape pass
// through unchanged. What is mapped:
// - nitrogen.credit.<crop>: O4 'nitrogen.credit.<crop>.<us-ia|pl>' for the field's country. {low,high} becomes
//   {low, mid = (low+high)/2, high}. A unit in lb N/acre is converted to kg N/ha (× 1.121, the factor printed in the
//   O4 unit text). Legumes without a row (red clover, PL legume catch crops) have none: soilHealth leaves nitrogen
//   out for rotations with them. A perennial legume (alfalfa) gets one credit per stand, not per year: soilHealth.ts
//   skips the credit for a year that continues a stand (the adapter cannot express it, because soilHealth scales
//   nitrogen by the largest credit row, so scaling the row would change the scale per rotation).
// - humus.coef.<crop>: O4 'humus.coef.<crop>.pl' (Poland only), the 'medium' soil class. The classes are not mapped
//   from the sand share because no sourced split is in the tables. The VDLUFA rows use another unit and are skipped.
// - erosion (per rotation, because soilHealth takes one C factor per cover state):
//   bare = erosion.slr.bare / 100; crop = mean over the rotation's main crops of the crop's conventional stage values
//   (seedbed to maturing) / 100, alfalfa = erosion.slr.meadow.alfalfa / 100; residue = mean over the main crops of
//   erosion.slr.residueCover.<crop>.tilled30, else the crop's 'residue' stage, else its 'roughFallow' stage, / 100;
//   cover-crop = mean over the cover crops of erosion.slr.meadow.redClover (red clover) or the mean of
//   erosion.slr.maize.noTillInRyeCover (cereal rye), / 100. A crop or cover without a row: erosion is left out.
//   slopeFactor = erosion.ls.slopeLength75ft. zeroScoreIndex = the index of continuous bare fallow on this field
//   (C = 1 every month, the field's mean monthly rain, the same slope factor), sourced to erosion.slr.bare, so 0
//   means "as bad as bare fallow".
// - pestBreak.minReturn.<family>: for each family of the crop list, the O4 'pestBreak.returnYears.<x>' rows where x is
//   the family or a crop of that family ('wheat' = crops with 'wheat' in the id) give {low = largest low, mid = that,
//   high = largest high}; a family without such a row gets 'pestBreak.returnYears.anyFamily'.
const LB_PER_ACRE_TO_KG_PER_HA = 1.121;
const SMALL_GRAINS = new Set(['oats', 'winter-wheat', 'spring-barley', 'rye', 'wheat', 'barley']);
const CROP_STAGES = ['seedbed', 'establishment', 'development', 'maturing80', 'maturing90', 'maturing96'];

export interface SoilRuleSet { rules: SoilRules; sourceIds: Record<string, string[]> }

const meanOf = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const r3 = (x: number) => Math.round(x * 1000) / 1000;

function derivedRow(id: string, value: RuleRow['value'], unit: string, from: RuleRow, appliesTo: string): RuleRow {
  return {
    id,
    value,
    unit,
    appliesTo,
    sourceTitle: from.sourceTitle,
    sourceUrl: from.sourceUrl,
    sourceLocator: from.sourceLocator,
    checkedBy: `derived by the engine from ${from.id}`,
  };
}

/** Step lookup like soilHealth's: the value under the largest numeric key that is ≤ x. */
function stepLookup(table: Record<string, number>, x: number | null): number | undefined {
  if (x === null) return undefined;
  let best: { key: number; value: number } | undefined;
  for (const [k, value] of Object.entries(table)) {
    const key = Number(k);
    if (Number.isFinite(key) && key <= x && (!best || key > best.key)) best = { key, value };
  }
  return best?.value;
}

export function toSoilRules(
  loaded: LoadedRules,
  country: 'US' | 'PL',
  crops: CropTraits[],
  years: RotationOption['years'],
  profile: Pick<FieldProfile, 'monthly' | 'slopePct'>,
): SoilRuleSet {
  const all = [...loaded.byId.values()];
  const get = (id: string) => loaded.byId.get(id);
  const sourceIds: Record<string, string[]> = {};
  const out: SoilRules = { nitrogen: [], humus: [], erosion: [], pestBreak: [] };
  const add = (group: keyof SoilRules, row: RuleRow, from: string[]) => {
    if (out[group].some((r) => r.id === row.id)) return;
    out[group].push(row);
    sourceIds[row.id] = from;
  };
  // rows already in soilHealth's shape
  const B5_PREFIX: Record<keyof SoilRules, RegExp> = {
    nitrogen: /^nitrogen\.(credit\.[^.]+|leachingRainMm|leachingMaxLoss|leachingBySand)$/,
    humus: /^humus\.(coef\.[^.]+|climateLimits|climateFactor|textureBySand)$/,
    erosion: /^erosion\.(cFactor\.[^.]+|slopeFactor|zeroScoreIndex)$/,
    pestBreak: /^pestBreak\.minReturn\.[^.]+$/,
  };
  for (const row of all) {
    for (const group of Object.keys(B5_PREFIX) as (keyof SoilRules)[]) if (B5_PREFIX[group].test(row.id)) add(group, row, [row.id]);
  }
  const suffix = country === 'US' ? 'us-ia' : 'pl';

  // nitrogen
  for (const crop of crops) {
    const row = get(`nitrogen.credit.${crop.id}.${suffix}`);
    if (!row) continue;
    const factor = row.unit.startsWith('lb N/acre') ? LB_PER_ACRE_TO_KG_PER_HA : 1;
    const v = row.value;
    let value: RuleRow['value'] | undefined;
    if (typeof v === 'number') value = r3(v * factor);
    else if (typeof v === 'object' && typeof v.low === 'number' && typeof v.high === 'number') {
      value = { low: r3(v.low * factor), mid: r3(((v.low + v.high) / 2) * factor), high: r3(v.high * factor) };
    }
    if (value !== undefined) add('nitrogen', derivedRow(`nitrogen.credit.${crop.id}`, value, 'kg N/ha', row, row.appliesTo), [row.id]);
  }

  // humus (Poland only)
  if (country === 'PL') {
    for (const crop of crops) {
      const row = get(`humus.coef.${crop.id}.pl`);
      const v = row?.value;
      if (row && typeof v === 'object' && typeof v.medium === 'number') {
        add('humus', derivedRow(`humus.coef.${crop.id}`, v.medium, row.unit, row, `${row.appliesTo}; 'medium' soil class`), [row.id]);
      }
    }
  }

  // erosion, for this rotation
  const bare = get('erosion.slr.bare');
  const ls = get('erosion.ls.slopeLength75ft');
  const record = (id: string) => {
    const v = get(id)?.value;
    return typeof v === 'object' ? v : undefined;
  };
  const cropC = (id: string): { c: number; from: string } | undefined => {
    if (id === 'alfalfa') {
      const m = record('erosion.slr.meadow')?.alfalfa;
      return m === undefined ? undefined : { c: m / 100, from: 'erosion.slr.meadow' };
    }
    const rowId = SMALL_GRAINS.has(id) ? 'erosion.slr.smallGrain.conventional' : get(`erosion.slr.${id}.conventional`) ? `erosion.slr.${id}.conventional` : `erosion.slr.${id}`;
    const t = record(rowId);
    const stages = CROP_STAGES.map((k) => t?.[k]).filter((x): x is number => typeof x === 'number');
    return stages.length === 0 ? undefined : { c: meanOf(stages) / 100, from: rowId };
  };
  const residueC = (id: string): { c: number; from: string } | undefined => {
    const cover = record(`erosion.slr.residueCover.${id}`)?.tilled30;
    if (cover !== undefined) return { c: cover / 100, from: `erosion.slr.residueCover.${id}` };
    const rowId = SMALL_GRAINS.has(id) ? 'erosion.slr.smallGrain.conventional' : `erosion.slr.${id}.conventional`;
    const t = record(rowId) ?? record(`erosion.slr.${id}`);
    const v = t?.residue ?? t?.roughFallow;
    return v === undefined ? undefined : { c: v / 100, from: t === record(rowId) ? rowId : `erosion.slr.${id}` };
  };
  const coverC = (id: string): { c: number; from: string } | undefined => {
    if (id === 'red-clover') {
      const m = record('erosion.slr.meadow')?.redClover;
      return m === undefined ? undefined : { c: m / 100, from: 'erosion.slr.meadow' };
    }
    if (id === 'cereal-rye') {
      const t = record('erosion.slr.maize.noTillInRyeCover');
      const v = t ? Object.values(t) : [];
      return v.length === 0 ? undefined : { c: meanOf(v) / 100, from: 'erosion.slr.maize.noTillInRyeCover' };
    }
    return undefined;
  };
  const mains = [...new Set(years.map((y) => y.crop))];
  const covers = [...new Set(years.map((y) => y.coverCrop).filter((x): x is string => x !== undefined))];
  const combine = (list: string[], f: (id: string) => { c: number; from: string } | undefined) => {
    const parts = list.map(f);
    if (parts.length === 0 || parts.some((p) => p === undefined)) return undefined;
    const ok = parts as { c: number; from: string }[];
    return { c: r3(meanOf(ok.map((p) => p.c))), from: [...new Set(ok.map((p) => p.from))] };
  };
  if (bare && typeof bare.value === 'number' && years.length > 0) {
    const states: [string, { c: number; from: string[] } | undefined][] = [
      ['bare', { c: bare.value / 100, from: [bare.id] }],
      ['crop', combine(mains, cropC)],
      ['residue', combine(mains, residueC)],
      ['cover-crop', covers.length === 0 ? undefined : combine(covers, coverC)],
    ];
    for (const [state, v] of states) {
      if (!v) continue;
      const src = get(v.from[0]!)!;
      add('erosion', derivedRow(`erosion.cFactor.${state}`, v.c, 'RUSLE cover-management factor C', src, `calendar cover state '${state}' of this rotation`), v.from);
    }
    let slopeFactor: number | undefined;
    if (ls && typeof ls.value === 'object') {
      add('erosion', derivedRow('erosion.slopeFactor', ls.value, ls.unit, ls, ls.appliesTo), [ls.id]);
      slopeFactor = stepLookup(ls.value, profile.slopePct.value as number | null);
    }
    const rain = Array.from({ length: 12 }, (_, i) => {
      const vals = profile.monthly.filter((m) => m.month === i + 1 && m.rainMm !== null).map((m) => m.rainMm as number);
      return vals.length === 0 ? null : meanOf(vals);
    });
    if (rain.every((x) => x !== null)) {
      const zero = r3((rain as number[]).reduce((a, b) => a + b, 0) * (slopeFactor ?? 1));
      if (zero > 0) {
        add(
          'erosion',
          derivedRow('erosion.zeroScoreIndex', zero, 'index of continuous bare fallow on this field', bare, 'erosion score 0 = as much soil loss as continuous bare fallow on this field'),
          [bare.id, ...(ls ? [ls.id] : [])],
        );
      }
    }
  }

  // pest break
  const anyFamily = get('pestBreak.returnYears.anyFamily');
  const familyOf = (key: string): string | undefined => {
    if (crops.some((c) => c.family === key)) return key;
    if (key === 'wheat') return crops.find((c) => c.id.includes('wheat'))?.family;
    return crops.find((c) => c.id === key)?.family;
  };
  const byFamily = new Map<string, RuleRow[]>();
  for (const row of all) {
    const m = /^pestBreak\.returnYears\.(.+)$/.exec(row.id);
    if (!m || m[1] === 'anyFamily') continue;
    const fam = familyOf(m[1]!);
    if (fam) byFamily.set(fam, [...(byFamily.get(fam) ?? []), row]);
  }
  for (const family of new Set(crops.map((c) => c.family))) {
    const rows = byFamily.get(family);
    if (rows && rows.length > 0) {
      const lowOf = (r: RuleRow) => (typeof r.value === 'number' ? r.value : typeof r.value === 'object' ? r.value.low : undefined);
      const highOf = (r: RuleRow) => (typeof r.value === 'number' ? r.value : typeof r.value === 'object' ? r.value.high : undefined);
      const valid = rows.filter((r) => typeof lowOf(r) === 'number');
      if (valid.length === 0) continue;
      const pick = valid.reduce((a, b) => (lowOf(b)! > lowOf(a)! ? b : a));
      const low = lowOf(pick)!;
      const high = Math.max(low, ...valid.map((r) => highOf(r) ?? low));
      add('pestBreak', derivedRow(`pestBreak.minReturn.${family}`, { low, mid: low, high }, 'years', pick, `crop family ${family}`), valid.map((r) => r.id));
    } else if (anyFamily && typeof anyFamily.value === 'number') {
      add('pestBreak', derivedRow(`pestBreak.minReturn.${family}`, anyFamily.value, 'years', anyFamily, `crop family ${family}`), [anyFamily.id]);
    }
  }
  return { rules: out, sourceIds };
}
