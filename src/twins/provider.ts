// TwinsProvider (task O4-B3): places with a similar climate that grow a crop of the rotation, from data/twins/cases.json.
// Evidence inside a card, never a forecast (SPEC section 9).
import type { AsyncResult, Country, CropId, Field, FieldProfile, RotationOption, TwinEvidence, TwinsProvider } from '../contracts';
import casesJson from '../../data/twins/cases.json';
import { fieldFeatures, similarity, zStats, type Features } from './similarity';

export const MAX_CASES = 10;

interface OutcomeCrop { sharePct: number; yieldTPerHa: number | null; nYears?: number; nAreaYears?: number; note?: string }
interface Outcome {
  years: string;
  source: string;                    // dataset id: 'usda-nass-quickstats' | 'eurostat-apro-cpnhr'
  kind: 'observation' | 'derived';   // derived = our calculation (Eurostat production / area)
  areaHa?: number;
  crops: Record<string, OutcomeCrop>;
  outcomeRegion?: { code: string; name: string; level: string; note: string }; // German regions: shares are for the Land
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

/** Our crop ids (data/crops) → the crop names used in the case base, where they differ (Eurostat codes have no season). */
const CASE_NAMES: Record<CropId, string[]> = {
  'winter-rapeseed': ['rapeseed'],
  'spring-barley': ['barley'],
};
const caseNamesOf = (crop: CropId): string[] => [crop, ...(CASE_NAMES[crop] ?? [])];
export interface CasesFile {
  meta: { retrievedAt: string; script: string; sourceUrl: string };
  regions: CaseRegion[];
}

const numericFeatures = (r: CaseRegion): Features =>
  Object.fromEntries(Object.entries(r.features).filter((e): e is [string, number] => typeof e[1] === 'number'));

export function createTwinsProvider(file: CasesFile): TwinsProvider {
  const stats = zStats(file.regions.map(numericFeatures));
  return {
    async getTwins(_field: Field, profile: FieldProfile, rotation: RotationOption['years']): Promise<AsyncResult<TwinEvidence>> {
      const own = fieldFeatures(profile.monthly);
      const wanted = [...new Set(rotation.flatMap((y) => (y.coverCrop ? [y.crop, y.coverCrop] : [y.crop])))];
      const ranked = file.regions
        .flatMap((region) => {
          const outcome = region.outcome;
          if (!outcome) return [];
          // each crop of the rotation with the case-base entry it matches
          const grown = wanted.flatMap((crop) => {
            const name = caseNamesOf(crop).find((n) => (outcome.crops[n]?.sharePct ?? 0) > 0);
            return name ? [{ crop, entry: outcome.crops[name]! }] : [];
          });
          if (grown.length === 0) return [];
          return [{ region, outcome, grown, score: similarity(own, numericFeatures(region), stats) }];
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_CASES);
      if (ranked.length === 0) return { status: 'no-data', reason: { code: 'twins.no-cases' } };

      const cases: TwinEvidence['cases'] = ranked.map(({ region, outcome, grown, score }) => {
        const share = grown.reduce((sum, g) => sum + g.entry.sharePct, 0);
        const land = outcome.outcomeRegion;
        return {
          regionName: land ? `${region.name} (shares for ${land.name})` : region.name,
          country: region.country,
          similarity: Math.round(score),
          crops: grown.map((g) => g.crop),
          years: outcome.years,
          outcome: {
            value: Math.round(share * 10) / 10,
            unit: '% of the harvested area of the case-base crops (not all farmland)',
            datasetIds: [outcome.source, 'nasa-power-climatology'],
            kind: outcome.kind,
            retrievedAt: file.meta.retrievedAt,
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
/** The provider the app uses, on data/twins/cases.json. */
export const caseBaseTwinsProvider: TwinsProvider = createTwinsProvider(casesJson as unknown as CasesFile);
