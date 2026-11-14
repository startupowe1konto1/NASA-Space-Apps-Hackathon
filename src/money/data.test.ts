import { describe, expect, it } from 'vitest';
import { moneyFile } from '../contracts/schemas';
import pl from '../../data/money/pl.json';
import usIa from '../../data/money/us-ia.json';
import { datasetIdForSource, datasets } from './datasets';
import { PAYMENT_IDS } from './payments';
import en from './messages/en.json';

const files = { 'us-ia.json': usIa, 'pl.json': pl };

describe.each(Object.entries(files))('data/money/%s', (_name, file) => {
  it('matches the moneyFile schema', () => {
    expect(moneyFile.safeParse(file).success).toBe(true);
  });

  it('has one source each for the yield, the price and the direct costs of every crop', () => {
    for (const row of file.economics) {
      for (const role of ['yield:', 'price:', 'direct costs:']) {
        expect(row.sources.filter((s) => s.locator.startsWith(role)), `${row.crop} ${role}`).toHaveLength(1);
      }
    }
  });

  it('maps every source to a registered dataset', () => {
    const ids = new Set(datasets.map((d) => d.id));
    const refs = [...file.economics.flatMap((r) => r.sources), ...file.payments.flatMap((p) => p.sources)];
    for (const ref of refs) expect(ids.has(datasetIdForSource(ref.url) ?? ''), ref.url).toBe(true);
  });

  it('has a qualifying rule for every payment row', () => {
    for (const p of file.payments) expect(PAYMENT_IDS).toContain(p.id);
  });

  it('has an English text for every payment condition', () => {
    for (const p of file.payments) expect(en).toHaveProperty([p.condition]);
  });
});

describe('src/money/datasets', () => {
  it('registers only datasets that a row in data/money cites', () => {
    const refs = Object.values(files).flatMap((f) => [...f.economics.flatMap((r) => r.sources), ...f.payments.flatMap((p) => p.sources)]);
    const used = new Set(refs.map((r) => datasetIdForSource(r.url)));
    for (const d of datasets) expect(used.has(d.id), d.id).toBe(true);
  });
});
