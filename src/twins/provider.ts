// TwinsProvider (task O4-B3): places with a similar climate that grow a crop of the rotation, from data/twins/cases.json.
// Evidence inside a card, never a forecast (SPEC section 9).
//
// - Similarity is on NASA POWER features: the region's climatology (case base) against the field's own monthly record.
// - Regions with identical features sit in one NASA POWER grid cell; they count as one case, named after the first,
//   and their yields are averaged (#79 items 9, 13).
// - The region the field sits in is left out: it is its own climate, not a twin (#79 item 14).
// - The outcome is the yield of the first rotation crop the region grows (SPEC 9 "how it did", #79 item 15).
// - The 385 KB case base is loaded on first use (#79 item 16).
import type { AsyncResult, Country, CropId, Field, FieldProfile, RotationOption, TwinEvidence, TwinsProvider } from '../contracts';
import { fieldFeatures, similarity, zStats, type Features, type ZStats } from './similarity';

export const MAX_CASES = 10;
/** A region whose centroid is this close to the field is taken as the region the field sits in. */
export const OWN_REGION_KM = 100;

interface OutcomeCrop { sharePct: number; yieldTPerHa: number | null; nYears?: number; nAreaYears?: number; note?: string }
interface Outcome {
  years: string;
  source: string;                    // 'usda-nass-quickstats' | 'eurostat-apro-cpnhr'
  kind: 'observation' | 'derived';   // derived = our calculation (Eurostat production / area)
  areaHa?: number;
  crops: Record<string, OutcomeCrop>;
  outcomeRegion?: { code: string; name: string; level: string; note: string }; // German regions: figures are for the Land
}
export interface CaseRegion {
  id: string;
  name: string;
  country: Country;
  centroid: { lat: number; lon: number };
  features: Record<string, number | null | { value: null; missingReason: string }>;
  outcome: Outcome | null;
  outcomeMissingReason?: string;
}
export interface CasesFile {
  meta: { retrievedAt: string; script: string; sourceUrl: string };
  regions: CaseRegion[];
}

/** Our crop ids (data/crops) → the crop names used in the case base, where they differ (Eurostat codes have no season). */
const CASE_NAMES: Record<CropId, string[]> = {
  'winter-rapeseed': ['rapeseed'],
  'spring-barley': ['barley'],
};
const caseNamesOf = (crop: CropId): string[] => [crop, ...(CASE_NAMES[crop] ?? [])];

/** Case-base source ids → dataset ids in src/twins/datasets.ts (the money tables use NASS for other numbers and periods). */
const DATASET_OF_SOURCE: Record<string, string> = { 'usda-nass-quickstats': 'usda-nass-county-crops' };
const FEATURE_DATASETS = ['nasa-power-climatology', 'nasa-power-monthly'];

const numericFeatures = (r: CaseRegion): Features =>
  Object.fromEntries(Object.entries(r.features).filter((e): e is [string, number] => typeof e[1] === 'number'));
const featureKey = (r: CaseRegion) => JSON.stringify(Object.entries(numericFeatures(r)).sort());

function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = Math.PI / 180;
  const h = Math.sin(((b.lat - a.lat) * rad) / 2) ** 2
    + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lon - a.lon) * rad) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** The region the field sits in: the nearest centroid, if it is within OWN_REGION_KM (the case base has no polygons). */
function ownRegionId(regions: CaseRegion[], field: Field): string | undefined {
  let best: { id: string; km: number } | undefined;
  for (const r of regions) {
    const km = distanceKm(r.centroid, field.centroid);
    if (!best || km < best.km) best = { id: r.id, km };
  }
  return best && best.km <= OWN_REGION_KM ? best.id : undefined;
}

interface Prepared { file: CasesFile; stats: ZStats }

export function createTwinsProvider(load: () => Promise<CasesFile>): TwinsProvider {
  let prepared: Promise<Prepared> | undefined;
  const prepare = () =>
    (prepared ??= load().then((file) => ({ file, stats: zStats(file.regions.map(numericFeatures)) })));

  return {
    async getTwins(field: Field, profile: FieldProfile, rotation: RotationOption['years']): Promise<AsyncResult<TwinEvidence>> {
      const { file, stats } = await prepare();
      const own = fieldFeatures(profile.monthly);
      const ownId = ownRegionId(file.regions, field);
      const wanted = [...new Set(rotation.flatMap((y) => (y.coverCrop ? [y.crop, y.coverCrop] : [y.crop])))];

      // regions with an outcome for at least one crop of the rotation, grouped by identical features (one grid cell)
      const groups = new Map<string, { regions: CaseRegion[]; score: number }>();
      for (const region of file.regions) {
        if (region.id === ownId || !region.outcome) continue;
        const outcome = region.outcome;
        const growsOne = wanted.some((crop) => caseNamesOf(crop).some((n) => (outcome.crops[n]?.sharePct ?? 0) > 0));
        if (!growsOne) continue;
        const key = featureKey(region);
        const group = groups.get(key);
        if (group) group.regions.push(region);
        else groups.set(key, { regions: [region], score: similarity(own, numericFeatures(region), stats) });
      }
      const ranked = [...groups.values()].sort((a, b) => b.score - a.score).slice(0, MAX_CASES);
      if (ranked.length === 0) return { status: 'no-data', reason: { code: 'twins.no-cases' } };

      const cases: TwinEvidence['cases'] = ranked.map(({ regions, score }) => {
        const first = regions[0]!;
        const outcome = first.outcome!;
        // the case-base rows of a rotation crop in the regions of this cell
        const rowsOf = (crop: CropId) => regions.flatMap((r) =>
          caseNamesOf(crop).flatMap((n) => (r.outcome && (r.outcome.crops[n]?.sharePct ?? 0) > 0 ? [r.outcome.crops[n]!] : [])));
        const grown = wanted.filter((crop) => rowsOf(crop).length > 0);
        const lead = grown[0]!;
        const yields = rowsOf(lead).map((c) => c.yieldTPerHa).filter((v): v is number => v !== null);
        const meanYield = yields.length === 0 ? null : Math.round((yields.reduce((a, b) => a + b, 0) / yields.length) * 100) / 100;
        const land = outcome.outcomeRegion;
        const others = regions.length - 1;
        const name = land ? `${first.name} (figures for ${land.name})` : first.name;
        return {
          regionName: others > 0 ? `${name} (+${others} more in the same NASA POWER grid cell)` : name,
          country: first.country,
          similarity: Math.round(score),
          crops: grown,
          years: outcome.years,
          outcome: {
            value: meanYield,
            unit: `t/ha, ${lead}, mean ${outcome.years}`,
            datasetIds: [DATASET_OF_SOURCE[outcome.source] ?? outcome.source, ...FEATURE_DATASETS],
            kind: outcome.kind,
            retrievedAt: file.meta.retrievedAt,
            ...(meanYield === null ? { missingReason: `the case base has an area for ${lead} here but no yield` } : {}),
          },
        };
      });
      // from the shown (rounded) similarities, so the mean on the card matches the numbers listed under it
      const meanSimilarity = cases.reduce((sum, c) => sum + c.similarity, 0) / cases.length;
      return { status: 'ready', data: { cases, caseCount: cases.length, meanSimilarity } };
    },
  };
}

// ---------- the shipped case base ----------
/** The provider the app uses, on data/twins/cases.json, loaded on first use. */
export const caseBaseTwinsProvider: TwinsProvider = createTwinsProvider(
  async () => (await import('../../data/twins/cases.json')).default as unknown as CasesFile,
);
