// The real analyzeField (task O3-B6): profile → GAEZ gate → candidates → scores → ranking by goal → card texts.
// Only the climate record is required: when it fails, analyzeField rejects with the SourceError (DECISIONS D20 c).
// Every other provider failure turns into a missing value or an error result for that part.
import type {
  AnalyzeField,
  AnalyzeInput,
  IndicatorId,
  Message,
  Analysis,
  AsyncResult,
  CalendarMonth,
  CropId,
  CropTraits,
  Dataset,
  Field,
  FieldProfile,
  GoalId,
  PriorityId,
  Providers,
  RotationOption,
  Score,
  Soil,
  Sourced,
  TwinEvidence,
} from '../contracts';
import { datasets as datasetRegistry } from '../app/datasets';
import { buildCalendar } from './calendar';
import { currentRotation, generateCandidates } from './candidates';
import { CROP_CALENDARS_ID } from './datasets';
import { INDICATOR_LABEL, cardMessages, cropLabel, type SoilOutcome } from './messages';
import { forageScore } from './priorityScores';
import { GOALS, INCOME_NOT_WIRED, changedYears, rankByGoal, rankSoil, type Scored } from './ranking';
import { resilienceScore, withExposure } from './resilience';
import { engineRules, shippedRules, toSoilRules, type EngineRules, type LoadedRules } from './rules';
import { soilHealth, type SoilRules } from './soilHealth';

type Years = RotationOption['years'];

const MONEY_NOT_LOADED = { status: 'not-loaded' } as const;
const RULE_OF_THUMB = 0.15;
const round1 = (x: number) => Math.round(x * 10) / 10;
const today = () => new Date().toISOString().slice(0, 10);

/** Rotation id from its years: 'maize+cereal-rye/soybean'. */
export const rotationId = (years: Years) => years.map((y) => (y.coverCrop ? `${y.crop}+${y.coverCrop}` : y.crop)).join('/');

function missing(datasetId: string, source: string, error: unknown, unit?: string): Sourced {
  const detail = error instanceof Error ? error.message : String(error);
  return {
    value: null,
    ...(unit ? { unit } : {}),
    datasetIds: [datasetId],
    kind: 'observation',
    retrievedAt: today(),
    missingReason: `${source} did not answer: ${detail}`,
  };
}

async function loadSoil(field: Field, providers: Providers): Promise<Soil> {
  try {
    return await providers.context.getSoil(field);
  } catch (e) {
    const [id, source] = field.country === 'US' ? ['usda-ssurgo', 'USDA soil survey'] : ['isric-soilgrids', 'SoilGrids'];
    return {
      sandPct: missing(id, source, e, '%'),
      clayPct: missing(id, source, e, '%'),
      organicCarbon: missing(id, source, e, '% by weight'),
      ph: missing(id, source, e, 'pH'),
    };
  }
}

async function loadSlope(field: Field, providers: Providers): Promise<Sourced> {
  try {
    return await providers.context.getSlope(field);
  } catch (e) {
    return missing('nasadem', 'NASADEM slope', e, '%');
  }
}

/** Soil cover share of the cycle: the stand-in for soil health while no indicator has a sourced rule. */
export function coverOnlyScore(totalMonths: number, bareMonths: number): Score {
  const value = round1(((totalMonths - bareMonths) / totalMonths) * 100);
  return {
    value,
    low: round1(Math.max(0, value * (1 - RULE_OF_THUMB))),
    high: round1(Math.min(100, value * (1 + RULE_OF_THUMB))),
    confidence: 'weak',
    basis: { code: 'soil.basis.cover-only' },
  };
}

/**
 * The soil step, behind one function: O3-B5's soil health when at least one indicator has rules, else the
 * cover-only stand-in. B5's placeholder total (no indicator scored) is never ranked on.
 */
export function soilStep(
  years: Years,
  crops: CropTraits[],
  profile: FieldProfile,
  rules: SoilRules,
  on: PriorityId[],
  doublingFactor: number,
  bareMonths: number,
): SoilOutcome & { indicators: RotationOption['indicators'] } {
  const result = soilHealth(years, crops, profile, rules, { goal: 'keepSoil', on, excludedCrops: [] }, doublingFactor);
  if (result.total.basis.code === 'soil.basis.no-indicators' || Object.keys(result.indicators).length === 0) {
    return {
      score: coverOnlyScore(years.length * 12, bareMonths),
      coverOnly: true,
      evidence: [],
      missing: result.missing,
      indicators: {},
    };
  }
  // plain labels in the basis, and a separate code when every indicator was scored
  const basis: Message =
    result.missing.length === 0
      ? { code: 'soil.basis.total-complete', params: { indicators: Object.keys(result.indicators).length } }
      : { code: 'soil.basis.total', params: { indicators: Object.keys(result.indicators).length, missing: result.missing.map((id) => INDICATOR_LABEL[id]).join(', ') } };
  const score = result.total.basis.code === 'soil.basis.total' ? { ...result.total, basis } : result.total;
  return { score, coverOnly: false, evidence: result.evidence, missing: result.missing, indicators: result.indicators };
}

interface Candidate extends Scored {
  months: ReturnType<typeof buildCalendar>['months'];
  bareMonths: number;
  soil: SoilOutcome & { indicators: RotationOption['indicators'] };
}

const SOIL_INPUT_LABEL: Record<keyof Soil, string> = { sandPct: 'sand', clayPct: 'clay', organicCarbon: 'organic carbon', ph: 'pH' };

/** Dataset entries for every datasetId used anywhere in the analysis, NASA first. */
function datasetsUsed(value: unknown, registry: Dataset[]): Dataset[] {
  const ids = new Set<string>();
  const walk = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') {
      const o = v as { datasetIds?: unknown };
      if (Array.isArray(o.datasetIds)) o.datasetIds.forEach((id) => typeof id === 'string' && ids.add(id));
      Object.values(v).forEach(walk);
    }
  };
  walk(value);
  return registry.filter((d) => ids.has(d.id));
}

export interface AnalyzeOptions {
  rules?: LoadedRules;
  registry?: Dataset[];
}

export function createAnalyzeField(options: AnalyzeOptions = {}): AnalyzeField {
  const loaded = options.rules ?? shippedRules;
  // A row the engine needs is missing from data/rules: no cards, a reason, never invented numbers.
  let engine: EngineRules | null;
  try {
    engine = engineRules(loaded);
  } catch {
    engine = null;
  }
  const registry = options.registry ?? datasetRegistry;

  return async (input, providers) => {
    const { field, cropHistory, priorities } = input;
    // 1. climate: required; a rejection propagates
    const climate = await providers.profile.getClimate(field);
    // 2. soil and slope: missing values with a reason when they fail
    const [soil, slopePct] = await Promise.all([loadSoil(field, providers), loadSlope(field, providers)]);
    const profile: FieldProfile = { ...climate, soil, slopePct };
    const generatedAt = new Date().toISOString();
    const empty = (reason: Message): Analysis => {
      const a: Analysis = { field, profile, rotations: [], shownByGoal: {}, datasets: datasetsUsed(profile, registry), generatedAt };
      emptyReasons.set(a, reason);
      return a;
    };

    // 3. outside the USA and Poland: profile only
    if (field.country === 'OTHER') return empty({ code: 'empty.outside-coverage' });
    if (!engine) return empty({ code: 'empty.rules-missing' });
    const rules = engine;
    const country = field.country;

    // 4. crops and the GAEZ gate
    let crops: CropTraits[];
    try {
      crops = await providers.context.getCrops(field.country);
    } catch {
      return empty({ code: 'empty.crops-error' });
    }
    let suitability: Record<CropId, Sourced> = {};
    let suitabilityError = false;
    try {
      suitability = await providers.context.getSuitability(field, crops.map((c) => c.id));
    } catch {
      suitabilityError = true;
    }
    const removedCrops: { crop: CropId; index: number }[] = [];
    const unknownSuitability = new Set<CropId>();
    for (const c of crops) {
      const v = suitability[c.id]?.value;
      if (typeof v === 'number' && v <= rules.notSuitableBelowSI) removedCrops.push({ crop: c.id, index: v });
      else if (!suitabilityError && (v === null || v === undefined)) unknownSuitability.add(c.id);
    }
    const removed = new Set(removedCrops.map((r) => r.crop));

    // 5. current rotation and candidates. The contract needs exactly one current rotation per analysis, so
    // without a crop history there are no cards (the crops step asks for the last years first).
    // Without a history from the farmer, try the provider's (CropScape for Iowa). A failure there is not fatal.
    let history = cropHistory;
    let historySource: 'farmer' | 'provider' = 'farmer';
    if (history.length === 0) {
      try {
        const fromProvider = await providers.context.getCropHistory(field);
        if (fromProvider.status === 'ready' && fromProvider.data.length > 0) {
          history = fromProvider.data;
          historySource = 'provider';
        }
      } catch {
        // no history: handled below
      }
    }
    // A history crop outside the crop list (e.g. sorghum from CropScape) cannot be scored: its year is dropped and the
    // crop is named in the gaps, as long as two known years remain. An unknown cover crop is dropped from its year.
    const known = new Set(crops.map((c) => c.id));
    const unknownCrops = [...new Set(history.flatMap((h) => [h.crop, ...(h.coverCrop ? [h.coverCrop] : [])]).filter((id) => !known.has(id)))];
    if (unknownCrops.length > 0) {
      const knownYears = history
        .filter((h) => known.has(h.crop))
        .map((h) => (h.coverCrop && !known.has(h.coverCrop) ? { year: h.year, crop: h.crop, source: h.source } : h));
      if (knownYears.length < 2) return empty({ code: 'empty.unknown-crops', params: { crops: unknownCrops.map(cropLabel).join(', ') } });
      history = knownYears;
    }
    const current = currentRotation(history);
    if (current.length === 0) return empty({ code: 'empty.no-history' });
    const usesRemoved = (years: Years) => years.some((y) => removed.has(y.crop) || (y.coverCrop !== undefined && removed.has(y.coverCrop)));
    const list = generateCandidates(current, crops, priorities).filter((years, i) => i === 0 || !usesRemoved(years));

    // 6. scores per candidate
    const on = priorities.on;
    const candidates: Candidate[] = [];
    list.forEach((years, i) => {
      const isCurrent = i === 0;
      try {
        const { months, bareMonths } = buildCalendar(years, crops);
        const climateResilience = resilienceScore(years, crops, climate, rules.droughtPercentile);
        const soilRules = toSoilRules(loaded, country, crops, years, profile);
        const soilOut = soilStep(years, crops, profile, soilRules.rules, on, rules.doublingFactor, bareMonths);
        // name the rows in data/rules that each derived rule came from
        soilOut.evidence = soilOut.evidence.map((e) => ({
          ...e,
          ruleIds: [...new Set(e.ruleIds.flatMap((id) => soilRules.sourceIds[id] ?? [id]))],
        }));
        const priorityScores: Scored['priorityScores'] = {};
        if (on.includes('forage')) priorityScores.forage = forageScore(years, crops);
        candidates.push({
          id: rotationId(years),
          isCurrent,
          years,
          months,
          bareMonths,
          soilHealth: soilOut.score,
          climateResilience,
          priorityScores,
          soil: soilOut,
        });
      } catch (e) {
        if (isCurrent) return; // reported below: no current card means no cards
        void e; // a candidate that cannot be scored is skipped; the generator only builds from known crops
      }
    });
    const currentCandidate = candidates.find((c) => c.isCurrent);
    if (!currentCandidate) return empty({ code: 'empty.current-not-scored' });

    // soil for ranking: compared with the current rotation over the indicators both have (rankSoil)
    const PRIORITY_INDICATOR: Partial<Record<IndicatorId, PriorityId>> = { nitrogen: 'nitrogen', erosion: 'erosion', organicMatter: 'organicMatter' };
    const weightOf = (id: IndicatorId) => (PRIORITY_INDICATOR[id] && on.includes(PRIORITY_INDICATOR[id]!) ? rules.doublingFactor : 1);
    const currentSoil = { isCurrent: true, coverOnly: currentCandidate.soil.coverOnly, soilHealth: currentCandidate.soilHealth, indicators: currentCandidate.soil.indicators };
    const sharedOf = new Map<string, IndicatorId[]>();
    for (const c of candidates) {
      const r = rankSoil({ isCurrent: c.isCurrent, coverOnly: c.soil.coverOnly, soilHealth: c.soilHealth, indicators: c.soil.indicators }, currentSoil, weightOf);
      c.rankSoil = r.score;
      if (r.partial) sharedOf.set(c.id, r.shared);
    }

    // 7. ranking
    const ranked = rankByGoal(candidates, rules, on);
    const shownIds = new Set(Object.values(ranked.shownByGoal).flat());
    const byId = new Map(candidates.map((c) => [c.id, c]));
    const shown = ranked.items.filter((r) => shownIds.has(r.id));

    // 8. card texts; 9. twins and money
    const soilInputsMissing = (Object.keys(SOIL_INPUT_LABEL) as (keyof Soil)[])
      .filter((k) => soil[k].value === null)
      .map((k) => SOIL_INPUT_LABEL[k]);
    const prioritiesNotScored = (['water', 'forage'] as const).filter((p) => on.includes(p) && !currentCandidate.priorityScores[p]);
    const retrievedAt = today();

    const rotations: RotationOption[] = await Promise.all(
      shown.map(async (r) => {
        const c = byId.get(r.id)!;
        const calendar: CalendarMonth[] = withExposure(c.months, crops, climate, rules.markShare, rules.droughtPercentile);
        const shownGoals = GOALS.filter((g: GoalId) => ranked.shownByGoal[g]?.includes(r.id));
        const texts = cardMessages({
          years: r.years,
          isCurrent: r.isCurrent,
          current: currentCandidate.years,
          crops,
          climate,
          calendar,
          bareMonths: c.bareMonths,
          currentBareMonths: currentCandidate.bareMonths,
          resilience: r.climateResilience,
          currentResilience: currentCandidate.climateResilience.value,
          soil: c.soil,
          changedYears: changedYears(r.years, currentCandidate.years),
          rankByGoal: r.rankByGoal,
          shownGoals,
          candidateCount: candidates.length,
          removedCrops,
          unknownSuitability: [...new Set(r.years.flatMap((y) => [y.crop, ...(y.coverCrop ? [y.coverCrop] : [])]))].filter((id) =>
            unknownSuitability.has(id),
          ),
          suitabilityError,
          soilInputsMissing,
          slopeMissing: slopePct.value === null,
          prioritiesNotScored,
          ruleIds: { drought: rules.ids.drought, markShare: rules.ids.markShare },
          calendarDatasetId: CROP_CALENDARS_ID,
          retrievedAt,
          unknownCrops,
          soilComparedOn: sharedOf.get(r.id),
          history: r.isCurrent ? { source: historySource, years: history.map((h) => h.year), cropscape: history.some((h) => h.source === 'cropscape') } : undefined,
        });
        let twins: AsyncResult<TwinEvidence>;
        try {
          twins = await providers.twins.getTwins(field, profile, r.years);
        } catch {
          twins = { status: 'error', source: 'Field twins', reason: { code: 'twins.error' } };
        }
        return {
          id: r.id,
          isCurrent: r.isCurrent,
          years: r.years,
          totals: r.totals,
          rankByGoal: r.rankByGoal,
          belowSoilFloor: r.belowSoilFloor,
          soilHealth: r.soilHealth,
          indicators: c.soil.indicators,
          climateResilience: r.climateResilience,
          priorityScores: r.priorityScores,
          income: INCOME_NOT_WIRED,
          ...texts,
          calendar,
          bareMonths: c.bareMonths,
          twins,
          money: MONEY_NOT_LOADED,
        };
      }),
    );

    const analysis: Analysis = { field, profile, rotations, shownByGoal: ranked.shownByGoal, datasets: [], generatedAt };
    analysis.datasets = datasetsUsed(analysis, registry);
    return analysis;
  };
}

export const analyzeField: AnalyzeField = createAnalyzeField();

/** Why an analysis has no rotation cards, as set by analyzeField; read with emptyReason. */
const emptyReasons = new WeakMap<Analysis, Message>();

/**
 * Why the analysis has no rotation cards, for the UI's "no data" state; null when it has cards. The contract has no
 * field for it yet, so analyzeField records it next to the returned object; for an analysis it did not produce
 * (e.g. restored from a link), the reason is worked out from the input.
 */
export function emptyReason(analysis: Analysis, input: Pick<AnalyzeInput, 'field' | 'cropHistory'>): Message | null {
  if (analysis.rotations.length > 0) return null;
  const recorded = emptyReasons.get(analysis);
  if (recorded) return recorded;
  return input.field.country === 'OTHER' ? { code: 'empty.outside-coverage' } : { code: 'empty.no-history' };
}
