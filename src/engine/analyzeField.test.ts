import { describe, expect, it } from 'vitest';
import { SourceError, type Analysis, type CropYear, type Message, type Priorities, type Providers } from '../contracts';
import { analysis as analysisSchema } from '../contracts/schemas';
import { demoFields, fixtureProviders } from '../fixtures';
import { analyzeField } from './analyzeField';
import en from './messages/en.json';

const priorities: Priorities = { goal: 'keepSoil', on: [], excludedCrops: [] };
const iowaHistory: CropYear[] = [2019, 2020, 2021, 2022, 2023, 2024, 2025].map((year, i) => ({
  year,
  crop: i % 2 === 0 ? 'maize' : 'soybean',
  source: 'cropscape',
}));
const poznanHistory: CropYear[] = [
  { year: 2023, crop: 'winter-wheat', source: 'farmer' },
  { year: 2024, crop: 'winter-rapeseed', source: 'farmer' },
  { year: 2025, crop: 'winter-wheat', source: 'farmer' },
];

/** Every Message code anywhere in the analysis (any object with a string `code`). */
function codes(value: unknown, out = new Set<string>()): Set<string> {
  if (Array.isArray(value)) value.forEach((v) => codes(v, out));
  else if (value && typeof value === 'object') {
    const m = value as Partial<Message>;
    if (typeof m.code === 'string') out.add(m.code);
    Object.values(value).forEach((v) => codes(v, out));
  }
  return out;
}

const run = (field: 'iowa' | 'poznan', providers: Providers = fixtureProviders, history = field === 'iowa' ? iowaHistory : poznanHistory) =>
  analyzeField({ field: demoFields[field], cropHistory: history, priorities }, providers);

describe('analyzeField with fixture providers', () => {
  for (const field of ['iowa', 'poznan'] as const) {
    it(`${field}: parses with the Analysis schema and shows four rotations under keepSoil`, async () => {
      const started = Date.now();
      const a = await run(field);
      expect(Date.now() - started).toBeLessThan(2000);
      const parsed = analysisSchema.safeParse(a);
      expect(parsed.success, parsed.success ? '' : parsed.error.message).toBe(true);
      expect(a.shownByGoal.keepSoil).toHaveLength(4);
      expect(a.shownByGoal.improveSoil).toHaveLength(4);
      expect(a.shownByGoal.income).toBeUndefined();
      expect(a.rotations.filter((r) => r.isCurrent)).toHaveLength(1);
      for (const r of a.rotations) {
        expect(r.why.length).toBeGreaterThan(0);
        expect(r.evidence.length).toBeGreaterThan(0);
        expect(r.gaps.length).toBeGreaterThan(0);
        expect(r.localReviewRisks.length).toBeGreaterThan(0);
        expect(r.income.status).toBe('no-data');
        expect(r.twins.status).toBe('no-data'); // the fixture twins provider says no-data
        expect(r.money.status).toBe('not-loaded');
      }
      expect(a.datasets.map((d) => d.id)).toContain('nasa-power-monthly');
    });

    it(`${field}: every emitted message code has English text`, async () => {
      const a = await run(field);
      const missing = [...codes(a)].filter((c) => !(c in en) && !c.startsWith('fx.'));
      expect(missing).toEqual([]);
    });
  }

  it('the current rotation is the maize and soybean cycle of the history', async () => {
    const a = await run('iowa');
    const current = a.rotations.find((r) => r.isCurrent)!;
    expect(current.years.map((y) => y.crop).sort()).toEqual(['maize', 'soybean']);
  });

  it('a twins provider that throws turns into an error for twins only', async () => {
    const providers: Providers = { ...fixtureProviders, twins: { getTwins: () => Promise.reject(new Error('down')) } };
    const a = await run('iowa', providers);
    expect(a.rotations.length).toBeGreaterThan(0);
    for (const r of a.rotations) expect(r.twins).toEqual({ status: 'error', source: 'Field twins', reason: { code: 'twins.error' } });
  });

  it('soil and slope that throw become missing values with a reason and a gap', async () => {
    const providers: Providers = {
      ...fixtureProviders,
      context: { ...fixtureProviders.context, getSoil: () => Promise.reject(new Error('x')), getSlope: () => Promise.reject(new Error('y')) },
    };
    const a = await run('iowa', providers);
    expect(a.profile.soil.sandPct.value).toBeNull();
    expect(a.profile.soil.sandPct.missingReason).toBeTruthy();
    expect(a.profile.slopePct.value).toBeNull();
    expect(analysisSchema.safeParse(a).success).toBe(true);
    expect(a.rotations[0]!.gaps.some((g) => g.code === 'gap.soil-missing')).toBe(true);
  });

  it('removes a crop that GAEZ marks not suitable and names it in the gaps', async () => {
    const providers: Providers = {
      ...fixtureProviders,
      context: {
        ...fixtureProviders.context,
        getSuitability: async (field, crops) => {
          const base = await fixtureProviders.context.getSuitability(field, crops);
          return { ...base, alfalfa: { ...base['alfalfa']!, value: 5 } };
        },
      },
    };
    const a = await run('iowa', providers);
    for (const r of a.rotations) {
      expect(r.years.some((y) => y.crop === 'alfalfa')).toBe(false);
      expect(r.gaps.some((g) => g.code === 'gap.not-suitable' && g.params?.crop === 'alfalfa')).toBe(true);
    }
  });

  it('rejects with the SourceError when the profile provider throws', async () => {
    const providers: Providers = { ...fixtureProviders, profile: { getClimate: () => Promise.reject(new SourceError('NASA POWER')) } };
    await expect(run('iowa', providers)).rejects.toBeInstanceOf(SourceError);
  });

  it('a field outside the USA and Poland returns the profile and no rotations', async () => {
    const field = { ...demoFields.iowa, country: 'OTHER' as const };
    const a: Analysis = await analyzeField({ field, cropHistory: iowaHistory, priorities }, fixtureProviders);
    expect(a.rotations).toEqual([]);
    expect(a.shownByGoal).toEqual({});
    expect(a.profile.monthly.length).toBeGreaterThan(0);
    expect(analysisSchema.safeParse(a).success).toBe(true);
  });

  it('with no crop history there is no current rotation, so no cards (the contract needs exactly one current)', async () => {
    const a = await run('poznan', fixtureProviders, []);
    expect(a.rotations).toEqual([]);
    expect(analysisSchema.safeParse(a).success).toBe(true);
  });
});
