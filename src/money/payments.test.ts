import { describe, expect, it } from 'vitest';
import type { MoneyEstimate, RotationOption } from '../contracts';
import { sourced } from '../contracts/schemas';
import { demoFields } from '../fixtures/fields';
import { gaec7 } from './payments';
import { tableMoneyProvider } from './provider';

type Years = RotationOption['years'];
type Payments = MoneyEstimate['payments'];

async function payments(field: typeof demoFields.iowa, years: Years): Promise<Payments> {
  const result = await tableMoneyProvider.getPayments(field, years);
  if (result.status !== 'ready') throw new Error(`expected ready, got ${result.status}`);
  return result.data;
}
const byCode = (list: Payments, code: string) => list.find((p) => p.condition.code === code);

describe('getPayments, Iowa', () => {
  const iowa = demoFields.iowa;

  it('a rotation with a cover crop qualifies for practice 340, labelled as unconfirmed', async () => {
    const list = await payments(iowa, [{ crop: 'maize', coverCrop: 'cereal-rye' }, { crop: 'soybean', coverCrop: 'cereal-rye' }]);
    const cover = byCode(list, 'money.condition.us-340');
    expect(cover).toBeDefined();
    expect(cover!.confirmed).toBe(false);
    expect(cover!.amountPerHa.value).toBeCloseTo(184.71, 2);
    expect(cover!.amountPerHa.unit).toBe('USD/ha per year');
  });

  it('a rotation without a cover crop does not get the cover crop payment', async () => {
    const list = await payments(iowa, [{ crop: 'maize' }, { crop: 'soybean' }]);
    expect(byCode(list, 'money.condition.us-340')).toBeUndefined();
  });

  it('a cover crop in half of the years earns half the rate per year of the rotation', async () => {
    const list = await payments(iowa, [{ crop: 'maize', coverCrop: 'cereal-rye' }, { crop: 'soybean' }]);
    const cover = byCode(list, 'money.condition.us-340')!;
    expect(cover.amountPerHa.value).toBeCloseTo(184.71 / 2, 1);
    expect(cover.amountPerHa.kind).toBe('derived');
  });

  it('practice 328 needs at least two different main crops', async () => {
    expect(byCode(await payments(iowa, [{ crop: 'maize' }, { crop: 'soybean' }]), 'money.condition.us-328')).toBeDefined();
    expect(byCode(await payments(iowa, [{ crop: 'maize' }]), 'money.condition.us-328')).toBeUndefined();
  });

  it('every amount is a valid Sourced value', async () => {
    const list = await payments(iowa, [{ crop: 'maize', coverCrop: 'cereal-rye' }, { crop: 'soybean' }]);
    for (const p of list) expect(sourced.safeParse(p.amountPerHa).success).toBe(true);
  });
});

describe('getPayments, Poland', () => {
  const poznan = demoFields.poznan;

  it('a rotation with a cover crop qualifies for the eco-scheme cover crop points', async () => {
    const list = await payments(poznan, [{ crop: 'winter-wheat', coverCrop: 'phacelia' }, { crop: 'sugar-beet' }]);
    const cover = byCode(list, 'money.condition.pl-cover-crop');
    expect(cover).toBeDefined();
    expect(cover!.amountPerHa.value).toBeCloseTo(218.8, 2);
    expect(cover!.confirmed).toBe(false);
  });

  it('a rotation without a cover crop does not', async () => {
    const list = await payments(poznan, [{ crop: 'winter-wheat' }, { crop: 'sugar-beet' }]);
    expect(byCode(list, 'money.condition.pl-cover-crop')).toBeUndefined();
  });

  it('the diverse crop structure needs three crops and a legume from the official list', async () => {
    const diverse = await payments(poznan, [{ crop: 'winter-wheat' }, { crop: 'field-pea' }, { crop: 'sugar-beet' }, { crop: 'maize' }]);
    expect(byCode(diverse, 'money.condition.pl-crop-diversity')).toBeDefined();
    const noLegume = await payments(poznan, [{ crop: 'winter-wheat' }, { crop: 'maize' }, { crop: 'sugar-beet' }, { crop: 'winter-wheat' }]);
    expect(byCode(noLegume, 'money.condition.pl-crop-diversity')).toBeUndefined();
  });

  it('the diverse crop structure allows beet and potato on at most 30% of the years', async () => {
    const list = await payments(poznan, [{ crop: 'winter-wheat' }, { crop: 'field-pea' }, { crop: 'sugar-beet' }]);
    expect(byCode(list, 'money.condition.pl-crop-diversity')).toBeUndefined();
  });

  it('straw points are paid in the years with a grain crop only', async () => {
    const list = await payments(poznan, [{ crop: 'winter-wheat' }, { crop: 'sugar-beet' }]);
    expect(byCode(list, 'money.condition.pl-straw')!.amountPerHa.value).toBeCloseTo(43.76, 2);
  });

  it('always reports the GAEC 7 rotation rule, with no money of its own', async () => {
    const list = await payments(poznan, [{ crop: 'winter-wheat' }, { crop: 'sugar-beet' }]);
    const rule = byCode(list, 'money.condition.pl-gaec7-pass');
    expect(rule).toBeDefined();
    expect(rule!.amountPerHa.value).toBe(0);
  });

  it('GAEC 7 fails a rotation that keeps one crop for more than 3 years', async () => {
    const years: Years = [
      { crop: 'winter-wheat' }, { crop: 'winter-wheat' }, { crop: 'winter-wheat' }, { crop: 'winter-wheat' }, { crop: 'sugar-beet' },
    ];
    const rule = byCode(await payments(poznan, years), 'money.condition.pl-gaec7-fail');
    expect(rule).toBeDefined();
    expect(rule!.condition.params).toEqual({ crop: 'winter-wheat', years: 4 });
  });

  it('returns no-data for a field outside the USA and Poland', async () => {
    const result = await tableMoneyProvider.getPayments({ ...poznan, country: 'OTHER' }, [{ crop: 'maize' }]);
    expect(result.status).toBe('no-data');
  });
});

describe('gaec7', () => {
  const legume = new Set(['field-pea']);
  const check = (years: Years) => gaec7(years, (crop) => legume.has(crop));

  it('passes three years of one crop', () => {
    expect(check([{ crop: 'maize' }, { crop: 'maize' }, { crop: 'maize' }, { crop: 'potato' }])).toEqual({ pass: true });
  });

  it('counts the run across the end of the cycle', () => {
    expect(check([{ crop: 'maize' }, { crop: 'maize' }, { crop: 'potato' }, { crop: 'maize' }, { crop: 'maize' }])).toEqual({
      pass: false, crop: 'maize', years: 4,
    });
  });

  it('fails a one-crop rotation, which never changes', () => {
    expect(check([{ crop: 'maize' }])).toEqual({ pass: false, crop: 'maize', years: 'every' });
  });

  it('a cover crop after the main crop meets the rule (§ 5 ust. 2)', () => {
    expect(check([{ crop: 'maize', coverCrop: 'phacelia' }])).toEqual({ pass: true });
  });

  it('does not apply to legumes (§ 5 ust. 3)', () => {
    expect(check([{ crop: 'field-pea' }])).toEqual({ pass: true });
  });
});
