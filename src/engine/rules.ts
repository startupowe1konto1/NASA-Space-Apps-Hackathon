// Rule tables from data/rules/*.json (owner O4, task O4-B0). Each file is an array of rule rows with a source.
// Rows that the engine needs before those files are on the branch fall back to copies of the same rows from
// PR #24 (team decisions in SPEC section 7 and DECISIONS D9/D20, and the GAEZ and drought rows with their sources).
// A row in a file always wins over its fallback.
import { z } from 'zod';
import type { GoalId } from '../contracts';
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
    appliesTo: 'drought check for every crop in its sensitive months; a month at or below this percentile counts as drought',
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
