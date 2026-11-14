import { describe, expect, it } from 'vitest';
import { SourceError, type Analysis, type CropYear, type Message, type Priorities, type Providers } from '../contracts';
import { analysis as analysisSchema } from '../contracts/schemas';
import { demoFields, fixtureProviders } from '../fixtures';
import { MONEY_SOURCE, analyzeField, incomeMessage, createAnalyzeField, emptyReason } from './analyzeField';
import { incomeEstimate } from './income';
import { engineRules, loadRules, shippedRules } from './rules';
import en from './messages/en.json';
import moneyMessages from '../money/messages/en.json';
import { tableMoneyProvider } from '../money/provider';
import moneyPl from '../../data/money/pl.json';
import moneyUs from '../../data/money/us-ia.json';

const shippedDrought = engineRules(shippedRules).droughtPercentile;
const shippedHeatMinDays = engineRules(shippedRules).heatMinDays;

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
      const a = await run(field);
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

  // #98 item 13: the live provider falls back to SoilGrids for a US point without an SSURGO map unit, so the reason
  // names the source that failed (from the SourceError), not the one the country would suggest.
  it('names the soil source from the SourceError when the soil provider fails', async () => {
    const providers: Providers = {
      ...fixtureProviders,
      context: { ...fixtureProviders.context, getSoil: () => Promise.reject(new SourceError('SoilGrids', 'SoilGrids gave no answer within 60 s')) },
    };
    const a = await run('iowa', providers);
    expect(a.profile.soil.sandPct.missingReason).toMatch(/^SoilGrids did not answer/);
    expect(a.profile.soil.sandPct.datasetIds).toEqual(['isric-soilgrids']);
    expect(analysisSchema.safeParse(a).success).toBe(true);
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

  it('with no crop history from the farmer it uses the provider history (CropScape for Iowa)', async () => {
    const a = await run('iowa', fixtureProviders, []);
    expect(analysisSchema.safeParse(a).success).toBe(true);
    const current = a.rotations.find((r) => r.isCurrent)!;
    expect(current.why.some((w) => w.code === 'why.history.cropscape')).toBe(true);
    expect(a.datasets.map((d) => d.id)).toContain('usda-cropscape');
  });

  it('with no crop history anywhere there is no current rotation, so no cards (the contract needs exactly one current)', async () => {
    const a = await run('poznan', fixtureProviders, []);
    expect(a.rotations).toEqual([]);
    expect(analysisSchema.safeParse(a).success).toBe(true);
  });

  it('a crop history provider that throws is not fatal', async () => {
    const providers: Providers = { ...fixtureProviders, context: { ...fixtureProviders.context, getCropHistory: () => Promise.reject(new Error('down')) } };
    const a = await run('iowa', providers, []);
    expect(a.rotations).toEqual([]);
  });

  it('with the rule tables in data/rules, soil indicators are scored and evidence names the O4 rows', async () => {
    const withRules = createAnalyzeField({ rules: shippedRules });
    for (const field of ['iowa', 'poznan'] as const) {
      const a = await withRules({ field: demoFields[field], cropHistory: field === 'iowa' ? iowaHistory : poznanHistory, priorities }, fixtureProviders);
      const parsed = analysisSchema.safeParse(a);
      expect(parsed.success, parsed.success ? '' : parsed.error.message).toBe(true);
      const missing = [...codes(a)].filter((c) => !(c in en) && !c.startsWith('fx.'));
      expect(missing).toEqual([]);
      expect(a.shownByGoal.keepSoil!.length).toBeGreaterThan(0);
    }
    const a = await withRules({ field: demoFields.iowa, cropHistory: iowaHistory, priorities }, fixtureProviders);
    const current = a.rotations.find((r) => r.isCurrent)!;
    expect(Object.keys(current.indicators).sort()).toEqual(['erosion', 'nitrogen', 'pestBreak']);
    expect(current.soilHealth.basis.code).toBe('soil.basis.total');
    const ruleIds = current.evidence.flatMap((e) => e.ruleIds);
    expect(ruleIds).toContain('nitrogen.credit.soybean.us-ia');
    expect(ruleIds.some((id) => id.startsWith('nitrogen.credit.soybean') && !id.endsWith('us-ia'))).toBe(false);
  });

  it('without rule tables it returns the profile, no cards and a reason, not invented values', async () => {
    const noRules = createAnalyzeField({ rules: loadRules({}) });
    const input = { field: demoFields.iowa, cropHistory: iowaHistory, priorities };
    const a = await noRules(input, fixtureProviders);
    expect(a.rotations).toEqual([]);
    expect(a.profile.monthly.length).toBeGreaterThan(0);
    expect(analysisSchema.safeParse(a).success).toBe(true);
    expect(emptyReason(a, input)?.code).toBe('empty.rules-missing');
    expect('empty.rules-missing' in en).toBe(true);
  });

  it('a crop list provider that throws gives the profile, no cards and a reason', async () => {
    const providers: Providers = { ...fixtureProviders, context: { ...fixtureProviders.context, getCrops: () => Promise.reject(new Error('down')) } };
    const input = { field: demoFields.iowa, cropHistory: iowaHistory, priorities };
    const a = await analyzeField(input, providers);
    expect(a.rotations).toEqual([]);
    expect(analysisSchema.safeParse(a).success).toBe(true);
    expect(emptyReason(a, input)?.code).toBe('empty.crops-error');
  });

  it('drops a history crop outside the crop list and names it in the gaps', async () => {
    const history: CropYear[] = [...iowaHistory.slice(0, 6), { year: 2025, crop: 'sorghum', source: 'cropscape' }];
    const a = await run('iowa', fixtureProviders, history);
    expect(analysisSchema.safeParse(a).success).toBe(true);
    const current = a.rotations.find((r) => r.isCurrent)!;
    expect(current.years.some((y) => y.crop === 'sorghum')).toBe(false);
    expect(current.gaps.some((g) => g.code === 'gap.unknown-crop' && g.params?.crop === 'sorghum')).toBe(true);
  });

  it('returns no cards with a reason when fewer than two known history years remain', async () => {
    const input = {
      field: demoFields.iowa,
      cropHistory: [
        { year: 2024, crop: 'sorghum', source: 'farmer' as const },
        { year: 2025, crop: 'maize', source: 'farmer' as const },
      ],
      priorities,
    };
    const a = await analyzeField(input, fixtureProviders);
    expect(a.rotations).toEqual([]);
    expect(emptyReason(a, input)).toEqual({ code: 'empty.unknown-crops', params: { crops: 'sorghum' } });
  });

  it('gives an empty-analysis reason for a field outside the USA and Poland, and none for a full analysis', async () => {
    const input = { field: { ...demoFields.iowa, country: 'OTHER' as const }, cropHistory: iowaHistory, priorities };
    expect(emptyReason(await analyzeField(input, fixtureProviders), input)?.code).toBe('empty.outside-coverage');
    const full = { field: demoFields.iowa, cropHistory: iowaHistory, priorities };
    expect(emptyReason(await analyzeField(full, fixtureProviders), full)).toBeNull();
    const none = { field: demoFields.poznan, cropHistory: [], priorities };
    expect(emptyReason(await analyzeField(none, fixtureProviders), none)?.code).toBe('empty.no-history');
  });

  // #105 item 7: every card of a field totals soil health over the same indicators, so the totals compare.
  it('totals soil health over the indicators every rotation has, and names the ones left out', async () => {
    const withRules = createAnalyzeField({ rules: shippedRules });
    const a = await withRules({ field: demoFields.iowa, cropHistory: iowaHistory, priorities }, fixtureProviders);
    const current = a.rotations.find((r) => r.isCurrent)!;
    const sets = a.rotations.map((r) => Object.keys(r.indicators));
    const shared = sets[0]!.filter((id) => sets.every((s) => s.includes(id)));
    expect(shared.length).toBeGreaterThan(0);
    for (const r of a.rotations) {
      expect(r.soilHealth.basis.params?.indicators).toBe(shared.length);
      const dropped = Object.keys(r.indicators).length > shared.length;
      expect(r.gaps.some((g) => g.code === 'gap.soil-totalled-shared')).toBe(dropped);
    }
    const missing = [...codes(a)].filter((c) => !(c in en) && !c.startsWith('fx.'));
    expect(missing).toEqual([]);
    expect(current.soilHealth.basis.code === 'soil.basis.total' || current.soilHealth.basis.code === 'soil.basis.total-complete').toBe(true);
    if (current.soilHealth.basis.code === 'soil.basis.total') expect(String(current.soilHealth.basis.params?.missing)).not.toMatch(/organicMatter|pestBreak/);
  });

  describe('soil adjustments without a sourced rule are named, not shown as a measured zero', () => {
    const row = (id: string, value: unknown) => ({ id, value, unit: 'test', appliesTo: 'test', sourceTitle: 'test', sourceUrl: 'https://example.org', sourceLocator: 'test' });
    const files = Object.fromEntries(Object.entries(shippedRules.byFile).map(([name, rows]) => [`../../data/rules/${name}.json`, rows]));
    const withExtra = (rows: ReturnType<typeof row>[]) => createAnalyzeField({ rules: loadRules({ ...files, '../../data/rules/zz-test.json': rows }) });
    const leachingRows = [row('nitrogen.leachingRainMm', 200), row('nitrogen.leachingMaxLoss', 0.3), row('nitrogen.leachingBySand', { '0': 1 })];
    const humusRows = [
      row('humus.climateLimits', { meanTMaxC: 10, annualRainMm: 600 }),
      row('humus.climateFactor', { 'cool-dry': 1, 'cool-wet': 1, 'warm-dry': 1, 'warm-wet': 1 }),
      row('humus.textureBySand', { '0': 1 }),
    ];
    const evidenceCodes = (a: Analysis) => a.rotations.find((r) => r.isCurrent)!.evidence.map((e) => e.message.code);
    const gapCodes = (a: Analysis) => a.rotations.find((r) => r.isCurrent)!.gaps.map((g) => g.code);

    it('nitrogen without leaching rows: no leaching percentage, a gap names the left-out adjustment', async () => {
      const hasLeaching = shippedRules.byId.has('nitrogen.leachingRainMm') && shippedRules.byId.has('nitrogen.leachingMaxLoss');
      const a = await createAnalyzeField({ rules: shippedRules })({ field: demoFields.iowa, cropHistory: iowaHistory, priorities }, fixtureProviders);
      expect(a.rotations.find((r) => r.isCurrent)!.indicators.nitrogen).toBeDefined();
      expect(evidenceCodes(a).includes('soil.evidence.nitrogen')).toBe(hasLeaching);
      expect(evidenceCodes(a).includes('soil.evidence.nitrogen-no-leaching')).toBe(!hasLeaching);
      expect(gapCodes(a).includes('gap.leaching-not-counted')).toBe(!hasLeaching);
    });

    it('nitrogen with leaching rows keeps the leaching evidence and no gap', async () => {
      const a = await withExtra(leachingRows)({ field: demoFields.iowa, cropHistory: iowaHistory, priorities }, fixtureProviders);
      expect(evidenceCodes(a)).toContain('soil.evidence.nitrogen');
      expect(evidenceCodes(a)).not.toContain('soil.evidence.nitrogen-no-leaching');
      expect(gapCodes(a)).not.toContain('gap.leaching-not-counted');
    });

    it('organic matter without climate or texture rows says it is not adjusted, and a gap names what was left out', async () => {
      const missing = [
        ...(['humus.climateLimits', 'humus.climateFactor'].every((id) => shippedRules.byId.has(id)) ? [] : ['climate']),
        ...(shippedRules.byId.has('humus.textureBySand') ? [] : ['soil texture']),
      ];
      const a = await createAnalyzeField({ rules: shippedRules })({ field: demoFields.poznan, cropHistory: poznanHistory, priorities }, fixtureProviders);
      const current = a.rotations.find((r) => r.isCurrent)!;
      expect(current.indicators.organicMatter).toBeDefined();
      expect(evidenceCodes(a).includes('soil.evidence.organic-matter-unadjusted')).toBe(missing.length > 0);
      const gap = current.gaps.find((g) => g.code === 'gap.humus-not-adjusted');
      expect(gap !== undefined).toBe(missing.length > 0);
      if (gap) expect(gap.params?.adjustments).toBe(missing.join(' and '));
    });

    it('organic matter with climate and texture rows keeps its evidence and no gap', async () => {
      const a = await withExtra(humusRows)({ field: demoFields.poznan, cropHistory: poznanHistory, priorities }, fixtureProviders);
      expect(evidenceCodes(a)).toContain('soil.evidence.organic-matter');
      expect(gapCodes(a)).not.toContain('gap.humus-not-adjusted');
    });
  });

  it('names the crop when erosion is left out for want of a soil cover row (alfalfa residue)', async () => {
    const history: CropYear[] = [
      { year: 2023, crop: 'maize', source: 'farmer' },
      { year: 2024, crop: 'alfalfa', source: 'farmer' },
      { year: 2025, crop: 'alfalfa', source: 'farmer' },
    ];
    const a = await createAnalyzeField({ rules: shippedRules })({ field: demoFields.iowa, cropHistory: history, priorities }, fixtureProviders);
    const current = a.rotations.find((r) => r.isCurrent)!;
    const noRow = current.gaps.filter((g) => g.code === 'gap.erosion-no-row');
    if (current.indicators.erosion) {
      expect(noRow).toEqual([]);
    } else {
      expect(noRow.map((g) => g.params?.crop)).toContain('alfalfa');
      // the specific gap replaces the generic one for erosion
      expect(current.gaps.some((g) => g.code === 'gap.rule-missing' && g.params?.indicator === 'erosion')).toBe(false);
    }
    expect('gap.erosion-no-row' in en).toBe(true);
  });
});

describe('analyzeField with a money provider (income, O3-B7)', () => {
  const moneyEn = moneyMessages as Record<string, string>;
  const tables = { US: moneyUs, PL: moneyPl } as const;
  const withMoney = (money: Providers['money']): Providers => ({ ...fixtureProviders, money });
  const runGoal = (field: 'iowa' | 'poznan', providers: Providers, goal: Priorities['goal'] = 'keepSoil') =>
    analyzeField(
      { field: demoFields[field], cropHistory: field === 'iowa' ? iowaHistory : poznanHistory, priorities: { ...priorities, goal } },
      providers,
    );

  for (const field of ['iowa', 'poznan'] as const) {
    it(`${field}: every card's money and income match a replay of the provider's tables`, async () => {
      const a = await runGoal(field, withMoney(tableMoneyProvider));
      const parsed = analysisSchema.safeParse(a);
      expect(parsed.success, parsed.success ? '' : parsed.error.message).toBe(true);
      const f = demoFields[field];
      const table = tables[f.country as 'US' | 'PL'];
      const crops = await fixtureProviders.context.getCrops(f.country);
      const climate = await fixtureProviders.profile.getClimate(f);
      for (const r of a.rotations) {
        const ids = [...new Set(r.years.flatMap((y) => [y.crop, ...(y.coverCrop ? [y.coverCrop] : [])]))];
        const econ = await tableMoneyProvider.getEconomics(f, ids);
        const pay = await tableMoneyProvider.getPayments(f, r.years);
        if (econ.status !== 'ready') {
          expect(econ.status).toBe('no-data');
          const shown = econ.status === 'no-data' ? { ...econ, reason: incomeMessage(econ.reason) } : econ;
          expect(r.money).toEqual(shown);
          expect(r.income).toEqual(shown);
          if (shown.status === 'no-data') expect(r.gaps).toContainEqual(shown.reason);
          continue;
        }
        const expected = incomeEstimate(
          r.years, crops, climate, econ.data, pay.status === 'ready' ? pay.data : [], table.currency as 'USD' | 'PLN', table.campaign, shippedDrought, shippedHeatMinDays,
        );
        if (expected.status !== 'ready') {
          expect(expected.status).toBe('no-data');
          const shown = expected.status === 'no-data' ? { ...expected, reason: incomeMessage(expected.reason) } : expected;
          expect(r.money).toEqual(shown);
          expect(r.income).toEqual(shown);
          continue;
        }
        expect(r.money).toEqual({ status: 'ready', data: expected.data.estimate });
        expect(r.income.status).toBe('ready');
        if (r.income.status === 'ready') {
          expect(r.income.data.confidence).not.toBe('strong');
          expect(r.income.data.basis.code).toBe('income.basis.replay');
        }
        for (const g of expected.data.gaps) expect(r.gaps).toContainEqual(incomeMessage(g));
        expect(r.gaps.some((g) => g.code === 'gap.income-not-wired')).toBe(false);
      }
      const missing = [...codes(a)].filter((c) => !(c in en) && !(c in moneyEn) && !c.startsWith('fx.'));
      expect(missing).toEqual([]);
    });

    it(`${field}: the income goal ranks only rotations with an income, the current one included, above the soil floor`, async () => {
      const a = await runGoal(field, withMoney(tableMoneyProvider), 'income');
      const current = a.rotations.find((r) => r.isCurrent)!;
      if (current.income.status !== 'ready') {
        expect(a.shownByGoal.income).toBeUndefined();
        return;
      }
      const shown = a.shownByGoal.income!;
      expect(shown).toContain(current.id);
      for (const id of shown) {
        const r = a.rotations.find((x) => x.id === id)!;
        expect(r.income.status).toBe('ready');
        expect(r.totals.income.status).toBe('ready');
        expect(r.rankByGoal.income).toBeGreaterThan(0);
        expect(r.belowSoilFloor).toBe(false);
        // D9: the income total always includes soil health and climate resilience
        if (r.totals.income.status === 'ready') {
          expect(Number(r.totals.income.data.basis.params?.soil)).toBeGreaterThan(0);
          expect(Number(r.totals.income.data.basis.params?.climate)).toBeGreaterThan(0);
        }
      }
      for (const r of a.rotations.filter((x) => x.income.status !== 'ready')) {
        expect(r.totals.income.status).not.toBe('ready');
        expect(r.rankByGoal.income).toBeUndefined();
      }
    });
  }

  it('a money provider that throws becomes an error state on every card, never a failed analysis', async () => {
    const a = await run('iowa', withMoney({
      getEconomics: () => Promise.reject(new SourceError('Money tables test source')),
      getPayments: () => Promise.reject(new SourceError('Money tables test source')),
    }));
    expect(analysisSchema.safeParse(a).success).toBe(true);
    expect(a.rotations.length).toBeGreaterThan(0);
    expect(a.shownByGoal.keepSoil!.length).toBeGreaterThan(0);
    expect(a.shownByGoal.income).toBeUndefined();
    for (const r of a.rotations) {
      expect(r.money).toEqual({ status: 'error', source: 'Money tables test source', reason: { code: 'income.error', params: { source: 'Money tables test source' } } });
      expect(r.income).toEqual(r.money);
      expect(r.totals.income.status).toBe('error');
      expect(r.gaps).toContainEqual({ code: 'income.error', params: { source: 'Money tables test source' } });
    }
    const missing = [...codes(a)].filter((c) => !(c in en) && !c.startsWith('fx.'));
    expect(missing).toEqual([]);
  });

  it('a plain Error from the money provider names the money tables as the source', async () => {
    const a = await run('poznan', withMoney({ getEconomics: () => Promise.reject(new Error('x')), getPayments: async () => ({ status: 'ready', data: [] }) }));
    for (const r of a.rotations) expect(r.money.status === 'error' && r.money.source).toBe(MONEY_SOURCE);
  });

  it('a money provider with no data gives no-data with its reason on money, income and the gaps', async () => {
    const reason = { code: 'income.no-climate-years' };
    const a = await run('iowa', withMoney({ getEconomics: async () => ({ status: 'no-data', reason }), getPayments: async () => ({ status: 'no-data', reason }) }));
    for (const r of a.rotations) {
      expect(r.money).toEqual({ status: 'no-data', reason });
      expect(r.income).toEqual({ status: 'no-data', reason });
      expect(r.gaps).toContainEqual(reason);
    }
    expect(a.shownByGoal.income).toBeUndefined();
  });

  it('payments that throw leave the margin, with no payments and a gap naming the source', async () => {
    const a = await run('iowa', withMoney({ ...tableMoneyProvider, getPayments: () => Promise.reject(new SourceError('Payments test source')) }));
    const current = a.rotations.find((r) => r.isCurrent)!;
    expect(current.money.status).toBe('ready');
    if (current.money.status === 'ready') expect(current.money.data.payments).toEqual([]);
    expect(current.gaps).toContainEqual({ code: 'gap.payments-error', params: { source: 'Payments test source' } });
  });

  it('the fixture money provider (not loaded) keeps money not-loaded and says income is not wired', async () => {
    const a = await run('iowa');
    for (const r of a.rotations) {
      expect(r.money).toEqual({ status: 'not-loaded' });
      expect(r.income).toEqual({ status: 'no-data', reason: { code: 'income.not-wired' } });
      expect(r.gaps.some((g) => g.code === 'gap.income-not-wired')).toBe(true);
    }
  });
});
