// TwinsProvider (task O4-B3): places with a similar climate that grow a crop of the rotation, from data/twins/cases.json.
// Evidence inside a card, never a forecast (SPEC section 9).
import type { AsyncResult, Country, CropId, Field, FieldProfile, RotationOption, TwinEvidence, TwinsProvider } from '../contracts';
import casesJson from '../../data/twins/cases.json';
import { fieldFeatures, similarity, zStats, type Features } from './similarity';

export const MAX_CASES = 10;

interface OutcomeCrop { sharePct: number; yieldTPerHa?: number | null; years: string; source: string }
export interface CaseRegion {
  id: string;
  name: string;
  country: Country;
  centroid: { lat: number; lon: number };
  features: Record<string, number | null | { value: null; missingReason: string }>;
  outcome: { crops: Record<CropId, OutcomeCrop>; missingReason?: string } | null;
}
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
      const wanted = new Set(rotation.flatMap((y) => (y.coverCrop ? [y.crop, y.coverCrop] : [y.crop])));
      const ranked = file.regions
        .flatMap((region) => {
          const grown = Object.entries(region.outcome?.crops ?? {})
            .filter(([crop, o]) => wanted.has(crop) && o.sharePct > 0)
            .map(([crop]) => crop);
          if (grown.length === 0 || !region.outcome) return [];
          return [{ region, grown, score: similarity(own, numericFeatures(region), stats) }];
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_CASES);
      if (ranked.length === 0) return { status: 'no-data', reason: { code: 'twins.no-cases' } };

      const cases: TwinEvidence['cases'] = ranked.map(({ region, grown, score }) => {
        const entries = grown.map((crop) => region.outcome!.crops[crop]!);
        const share = entries.reduce((sum, o) => sum + o.sharePct, 0);
        const sources = [...new Set(entries.map((o) => o.source))];
        return {
          regionName: region.name,
          country: region.country,
          similarity: Math.round(score),
          crops: grown,
          years: entries[0]!.years,
          outcome: {
            value: Math.round(share * 10) / 10,
            unit: '% of harvested area in these crops',
            datasetIds: [...sources, 'nasa-power-climatology'],
            kind: 'observation',
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
