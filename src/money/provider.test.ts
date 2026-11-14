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
  it('is ready for the Iowa crops with a yield, a price and costs: maize, soybean, oats and alfalfa', async () => {
    const result = await tableMoneyProvider.getEconomics(demoFields.iowa, ['maize', 'soybean', 'oats', 'alfalfa']);
    expect(result.status).toBe('ready');
    if (result.status === 'ready') {
      const oats = result.data.find((e) => e.crop === 'oats')!;
      expect(oats.referenceYieldTPerHa.value).toBeCloseTo(2.963, 3);
      expect(oats.pricePerT).toMatchObject({ unit: 'USD/t', datasetIds: ['usda-nass-quickstats'] });
    }
  });

  it('names winter wheat as missing in Iowa', async () => {
    const result = await tableMoneyProvider.getEconomics(demoFields.iowa, ['maize', 'winter-wheat']);
    expect(result).toEqual({ status: 'no-data', reason: { code: 'money.no-economics', params: { crop: 'winter-wheat' } } });
  });

  it('is ready for every Poznań crop that R8 sourced', async () => {
    const crops = ['winter-wheat', 'maize', 'winter-rapeseed', 'spring-barley', 'rye', 'field-pea', 'sugar-beet', 'potato'];
    const result = await tableMoneyProvider.getEconomics(demoFields.poznan, crops);
    expect(result.status).toBe('ready');
    if (result.status === 'ready') {
      expect(result.data.map((e) => e.crop)).toEqual(crops);
      for (const e of result.data) {
        expect(e.pricePerT.unit).toBe('PLN/t');
        expect(e.referenceYieldTPerHa.datasetIds).toEqual(['gus-produkcja-upraw']);
      }
    }
  });

  it('names oats as missing in Poland', async () => {
    const result = await tableMoneyProvider.getEconomics(demoFields.poznan, ['winter-wheat', 'oats']);
    expect(result).toEqual({ status: 'no-data', reason: { code: 'money.no-economics', params: { crop: 'oats' } } });
  });
});
