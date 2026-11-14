// ProfileProvider on NASA POWER monthly data.
import { SourceError, type ClimateProfile, type Field, type ProfileProvider } from '../contracts';
import { droughtYears, monthlyRisk, toMonthly, yearly, type Thresholds } from './climate';
import { fetchPowerMonthly, type PowerMonthly } from './power';
import { trends } from './trend';

export const DEFAULT_THRESHOLDS: Thresholds = {
  // Rule id 'hazards.drought.percentile' in data/rules/hazards.json (U.S. Drought Monitor D1 = 20th percentile).
  // Copied here until that file is on main; read it from there once it is.
  droughtPercentile: 20,
  // data/rules/hazards.json has no crop-independent heat or frost threshold; crops carry their own.
  heatC: null,
  frostDays: null,
};

export function buildClimateProfile(power: PowerMonthly, thresholds: Thresholds): ClimateProfile {
  const source = { datasetIds: ['nasa-power-monthly'], kind: 'model' as const, retrievedAt: power.retrievedAt };
  const monthly = toMonthly(power);
  const years = yearly(monthly, source);
  return {
    source,
    monthly,
    monthlyRisk: monthlyRisk(monthly, thresholds, source),
    yearly: years,
    droughtYears: droughtYears(monthly, thresholds.droughtPercentile),
    trends: trends(years, source),
  };
}

/** Same rounding as the POWER request URL, so two fields that ask for the same point share one request. */
const cacheKey = (lat: number, lon: number) => `${lat.toFixed(4)},${lon.toFixed(4)}`;

export function createPowerProfileProvider(fetchImpl?: typeof fetch): ProfileProvider {
  const cache = new Map<string, Promise<ClimateProfile>>();
  return {
    getClimate(field: Field): Promise<ClimateProfile> {
      const { lat, lon } = field.centroid;
      const key = cacheKey(lat, lon);
      const hit = cache.get(key);
      if (hit) return hit;
      const pending = fetchPowerMonthly(lat, lon, fetchImpl)
        .then((p) => buildClimateProfile(p, DEFAULT_THRESHOLDS))
        .catch((e: unknown) => {
          cache.delete(key);
          throw e instanceof SourceError
            ? e
            : new SourceError('NASA POWER', `NASA POWER data could not be read: ${e instanceof Error ? e.message : String(e)}`);
        });
      cache.set(key, pending);
      return pending;
    },
  };
}

export const powerProfileProvider: ProfileProvider = createPowerProfileProvider();
