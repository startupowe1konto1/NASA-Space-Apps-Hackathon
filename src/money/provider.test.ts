import { describe, expect, it } from 'vitest';
import type { CropTraits, Field } from '../contracts';
import { sourced } from '../contracts/schemas';
import { demoFields } from '../fixtures/fields';
import { createTableMoneyProvider, tableMoneyProvider, type MoneyTables } from './provider';

const ref = (locator: string, url: string) => ({ title: 'test source', url, locator });

const tables: MoneyTables = {
  US: {
    campaign: 'test campaign',
    currency: 'USD',
    economics: [
      {
        crop: 'maize', referenceYieldTPerHa: 13, pricePerT: 160, directCostsPerHa: 1200, year: 2026,
        sources: [
          ref('yield: county mean', 'https://quickstats.nass.usda.gov/results/A'),
          ref('price: marketing year', 'https://quickstats.nass.usda.gov/results/B'),
          ref('direct costs: page 3', 'https://www.extension.iastate.edu/agdm/crops/pdf/a1-20.pdf'),
        ],
      },
    ],
    payments: [],
  },
  PL: { campaign: 'test', currency: 'PLN', economics: [], payments: [] },
};

const trait = (id: string, kind: CropTraits['kind']): CropTraits => ({
  id, family: 'Poaceae', legume: false, kind, sowMonth: 4, harvestMonth: 10, sensitive: [], forage: false,
  residueCover: 'high', sources: [{ title: 't', url: 'https://example.org', locator: 'p. 1' }],
});
const crops = { US: [trait('maize', 'cash'), trait('soybean', 'cash'), trait('cereal-rye', 'cover')], PL: [] };
const provider = createTableMoneyProvider(tables, crops);
const iowa = demoFields.iowa;

describe('getEconomics', () => {
  it('returns ready with Sourced yield, price and costs when every crop has a row', async () => {
    const result = await provider.getEconomics(iowa, ['maize']);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    const [maize] = result.data;
    expect(maize!.crop).toBe('maize');
    expect(maize!.referenceYieldTPerHa).toMatchObject({ value: 13, unit: 't/ha', datasetIds: ['usda-nass-quickstats'] });
    expect(maize!.pricePerT).toMatchObject({ value: 160, unit: 'USD/t', datasetIds: ['usda-nass-quickstats'], kind: 'observation' });
    expect(maize!.directCostsPerHa).toMatchObject({ value: 1200, unit: 'USD/ha', datasetIds: ['isu-agdm-a1-20'] });
    for (const value of [maize!.referenceYieldTPerHa, maize!.pricePerT, maize!.directCostsPerHa]) {
      expect(sourced.safeParse(value).success).toBe(true);
    }
  });

  it('returns no-data naming the crop without a row', async () => {
    const result = await provider.getEconomics(iowa, ['maize', 'soybean']);
    expect(result).toEqual({ status: 'no-data', reason: { code: 'money.no-economics', params: { crop: 'soybean' } } });
  });

  it('does not ask cover crops for a yield or a price', async () => {
    const result = await provider.getEconomics(iowa, ['maize', 'cereal-rye']);
    expect(result.status).toBe('ready');
    if (result.status === 'ready') expect(result.data.map((e) => e.crop)).toEqual(['maize']);
  });

  it('returns each crop once', async () => {
    const result = await provider.getEconomics(iowa, ['maize', 'maize']);
    if (result.status === 'ready') expect(result.data).toHaveLength(1);
  });

  it('returns no-data for a field outside the USA and Poland', async () => {
    const other: Field = { ...iowa, country: 'OTHER' };
    const result = await provider.getEconomics(other, ['maize']);
    expect(result).toEqual({ status: 'no-data', reason: { code: 'money.no-tables' } });
  });
});

describe('tableMoneyProvider on the shipped tables', () => {
  it('is ready for the Iowa demo rotation, maize and soybean', async () => {
    const result = await tableMoneyProvider.getEconomics(demoFields.iowa, ['maize', 'soybean']);
    expect(result.status).toBe('ready');
  });

  it('is ready for the Poznań crops that have a yield, a price and costs', async () => {
    const result = await tableMoneyProvider.getEconomics(demoFields.poznan, ['winter-wheat', 'maize', 'potato', 'sugar-beet']);
    expect(result.status).toBe('ready');
    if (result.status === 'ready') {
      for (const e of result.data) expect(e.pricePerT.unit).toBe('PLN/t');
    }
  });

  it('names field pea as missing in Poland', async () => {
    const result = await tableMoneyProvider.getEconomics(demoFields.poznan, ['winter-wheat', 'field-pea']);
    expect(result).toEqual({ status: 'no-data', reason: { code: 'money.no-economics', params: { crop: 'field-pea' } } });
  });
});
