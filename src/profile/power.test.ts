import sample from '../../data/samples/power/point-monthly-1981-2025-ag.json';
import { SourceError } from '../contracts';
import { datasets } from './datasets';
import {
  POWER_PARAMETERS,
  daysInMonth,
  evapotranspirationMm,
  fetchPowerMonthly,
  parsePowerMonthly,
  powerMonthlyUrl,
  rainMm,
  type PowerMonth,
} from './power';

const RETRIEVED = '2026-11-14';
const clone = (): any => JSON.parse(JSON.stringify(sample));

describe('parsePowerMonthly', () => {
  it('returns 540 monthly rows (45 years x 12) from the saved sample', () => {
    const p = parsePowerMonthly(sample, RETRIEVED);
    expect(p.months).toHaveLength(540);
    expect(p.retrievedAt).toBe(RETRIEVED);
    expect(p.months[0]).toMatchObject({ year: 1981, month: 1 });
    expect(p.months[539]).toMatchObject({ year: 2025, month: 12 });
  });

  it('drops the annual key (month 13)', () => {
    const p = parsePowerMonthly(sample, RETRIEVED);
    expect(p.months.every((m) => m.month >= 1 && m.month <= 12)).toBe(true);
  });

  it('copies values for a known month', () => {
    const p = parsePowerMonthly(sample, RETRIEVED);
    expect(p.months[0]).toEqual({
      year: 1981, month: 1,
      GWETROOT: 0.42, GWETTOP: 0.42, PRECTOTCORR: 0.17, T2M_MAX: 12.4, FROST_DAYS: 28, EVPTRNS: 0.01,
    });
  });

  it('turns the fill value -999 into null', () => {
    const body = clone();
    body.properties.parameter.GWETROOT['199007'] = -999;
    body.properties.parameter.T2M_MAX['199007'] = -999.0;
    const m = parsePowerMonthly(body, RETRIEVED).months.find((r) => r.year === 1990 && r.month === 7)!;
    expect(m.GWETROOT).toBeNull();
    expect(m.T2M_MAX).toBeNull();
    expect(m.PRECTOTCORR).not.toBeNull();
  });

  it('turns the header fill_value into null when it is not -999', () => {
    const body = clone();
    body.header.fill_value = -1234;
    body.properties.parameter.EVPTRNS['200003'] = -1234;
    const m = parsePowerMonthly(body, RETRIEVED).months.find((r) => r.year === 2000 && r.month === 3)!;
    expect(m.EVPTRNS).toBeNull();
  });

  it('sorts rows by year and month whatever the key order', () => {
    const body = clone();
    const param = body.properties.parameter.GWETROOT;
    const reversed = Object.fromEntries(Object.entries(param).reverse());
    body.properties.parameter.GWETROOT = reversed;
    const months = parsePowerMonthly(body, RETRIEVED).months;
    for (let i = 1; i < months.length; i++) {
      const a = months[i - 1]!, b = months[i]!;
      expect(a.year * 100 + a.month).toBeLessThan(b.year * 100 + b.month);
    }
  });

  it('keeps raw POWER units from the parameters block', () => {
    const p = parsePowerMonthly(sample, RETRIEVED);
    expect(p.units.PRECTOTCORR).toBe('mm/day');
    expect(p.units.EVPTRNS).toBe('MJ/m^2/day');
  });

  it.each([
    ['not an object', 'nope'],
    ['null', null],
    ['no properties.parameter', { header: { fill_value: -999 } }],
    ['a missing parameter', (() => { const b = clone(); delete b.properties.parameter.EVPTRNS; return b; })()],
    ['a non-numeric value', (() => { const b = clone(); b.properties.parameter.GWETROOT['198101'] = 'x'; return b; })()],
    ['a bad date key', (() => { const b = clone(); b.properties.parameter.GWETROOT['19x101'] = 1; return b; })()],
  ])('throws SourceError on a malformed body (%s)', (_label, body) => {
    expect(() => parsePowerMonthly(body, RETRIEVED)).toThrow(SourceError);
    try { parsePowerMonthly(body, RETRIEVED); } catch (e) { expect((e as SourceError).source).toBe('NASA POWER'); }
  });
});

describe('units in the saved sample', () => {
  // The conversions in rainMm and evapotranspirationMm assume these exact units.
  it('PRECTOTCORR is mm/day and EVPTRNS is MJ/m^2/day', () => {
    expect(sample.parameters.PRECTOTCORR.units).toBe('mm/day');
    expect(sample.parameters.EVPTRNS.units).toBe('MJ/m^2/day');
  });
});

describe('conversions', () => {
  it('daysInMonth handles leap years', () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2023, 2)).toBe(28);
    expect(daysInMonth(1900, 2)).toBe(28);
    expect(daysInMonth(2000, 2)).toBe(29);
    expect(daysInMonth(1981, 1)).toBe(31);
    expect(daysInMonth(1981, 4)).toBe(30);
  });

  it('rainMm and evapotranspirationMm convert a sample row', () => {
    const months = parsePowerMonthly(sample, RETRIEVED).months;
    const jul = months.find((m) => m.year === 1981 && m.month === 7)!;
    const pr = sample.properties.parameter.PRECTOTCORR['198107'];
    const et = sample.properties.parameter.EVPTRNS['198107'];
    expect(rainMm(jul)).toBeCloseTo(pr * 31, 6);
    expect(evapotranspirationMm(jul)).toBeCloseTo((et / 2.45) * 31, 6);
    const jan = months[0]!; // PRECTOTCORR 0.17 mm/day, EVPTRNS 0.01 MJ/m^2/day
    expect(rainMm(jan)).toBeCloseTo(5.27, 6);
    expect(evapotranspirationMm(jan)).toBeCloseTo((0.01 / 2.45) * 31, 6);
  });

  it('uses 29 days for February of a leap year', () => {
    const m: PowerMonth = { year: 2024, month: 2, GWETROOT: null, GWETTOP: null, PRECTOTCORR: 1, T2M_MAX: null, FROST_DAYS: null, EVPTRNS: 2.45 };
    expect(rainMm(m)).toBe(29);
    expect(evapotranspirationMm(m)).toBeCloseTo(29, 9);
  });

  it('keeps null as null', () => {
    const m: PowerMonth = { year: 2024, month: 2, GWETROOT: null, GWETTOP: null, PRECTOTCORR: null, T2M_MAX: null, FROST_DAYS: null, EVPTRNS: null };
    expect(rainMm(m)).toBeNull();
    expect(evapotranspirationMm(m)).toBeNull();
  });
});

describe('powerMonthlyUrl', () => {
  it('builds the AG monthly point URL for 1981-2025', () => {
    expect(powerMonthlyUrl(42.0, -93.6)).toBe(
      'https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=GWETROOT,GWETTOP,PRECTOTCORR,T2M_MAX,FROST_DAYS,EVPTRNS&community=AG&longitude=-93.6&latitude=42&start=1981&end=2025&format=JSON',
    );
    expect(POWER_PARAMETERS).toEqual(['GWETROOT', 'GWETTOP', 'PRECTOTCORR', 'T2M_MAX', 'FROST_DAYS', 'EVPTRNS']);
  });

  it('rounds coordinates to 4 decimals', () => {
    const url = new URL(powerMonthlyUrl(52.123456789, 21.000049));
    expect(url.searchParams.get('latitude')).toBe('52.1235');
    expect(url.searchParams.get('longitude')).toBe('21');
    expect(url.searchParams.get('community')).toBe('AG');
    expect(url.searchParams.get('start')).toBe('1981');
    expect(url.searchParams.get('end')).toBe('2025');
  });
});

describe('fetchPowerMonthly', () => {
  it('fetches the URL and parses the body', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(sample), { status: 200 }));
    const p = await fetchPowerMonthly(42.0, -93.6, fetchImpl as unknown as typeof fetch);
    expect(fetchImpl).toHaveBeenCalledWith(powerMonthlyUrl(42.0, -93.6), expect.objectContaining({ signal: expect.anything() }));
    expect(p.months).toHaveLength(540);
    expect(p.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('throws SourceError("NASA POWER") on a 500', async () => {
    const fetchImpl = vi.fn(async () => new Response('oops', { status: 500 }));
    const err = await fetchPowerMonthly(42.0, -93.6, fetchImpl as unknown as typeof fetch).catch((e) => e);
    expect(err).toBeInstanceOf(SourceError);
    expect(err.source).toBe('NASA POWER');
  });

  it('throws SourceError("NASA POWER") on a network failure', async () => {
    const fetchImpl = vi.fn(async () => { throw new TypeError('Failed to fetch'); });
    const err = await fetchPowerMonthly(42.0, -93.6, fetchImpl as unknown as typeof fetch).catch((e) => e);
    expect(err).toBeInstanceOf(SourceError);
    expect(err.source).toBe('NASA POWER');
  });

  it('throws SourceError("NASA POWER") on a body that is not JSON', async () => {
    const fetchImpl = vi.fn(async () => new Response('<html>', { status: 200 }));
    const err = await fetchPowerMonthly(42.0, -93.6, fetchImpl as unknown as typeof fetch).catch((e) => e);
    expect(err).toBeInstanceOf(SourceError);
    expect(err.source).toBe('NASA POWER');
  });
});

describe('review fixes', () => {
  it('keeps the full 1981-2025 grid: a month missing from every parameter is a row of nulls', () => {
    const body = clone();
    for (const name of POWER_PARAMETERS) delete body.properties.parameter[name]['200007'];
    const p = parsePowerMonthly(body, RETRIEVED);
    expect(p.months).toHaveLength(540);
    const m = p.months.find((r) => r.year === 2000 && r.month === 7)!;
    expect(POWER_PARAMETERS.every((name) => m[name] === null)).toBe(true);
  });

  it('ignores years outside 1981-2025', () => {
    const body = clone();
    for (const name of POWER_PARAMETERS) body.properties.parameter[name]['198001'] = 1;
    expect(parsePowerMonthly(body, RETRIEVED).months).toHaveLength(540);
  });

  it('throws SourceError when the units are not the ones the conversions assume', () => {
    const body = clone();
    body.parameters.PRECTOTCORR.units = 'mm/hour';
    expect(() => parsePowerMonthly(body, RETRIEVED)).toThrow(SourceError);
    const body2 = clone();
    body2.parameters.EVPTRNS.units = 'W/m^2';
    expect(() => parsePowerMonthly(body2, RETRIEVED)).toThrow(SourceError);
  });

  it('puts the first POWER message into the error when the body has no data', async () => {
    const body = { messages: ['The POWER API is down for maintenance'], header: {} };
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(body), { status: 200 }));
    const err = await fetchPowerMonthly(42.0, -93.6, fetchImpl as unknown as typeof fetch).catch((e) => e);
    expect(err).toBeInstanceOf(SourceError);
    expect(err.message).toContain('down for maintenance');
  });

  it('maps a timeout to SourceError', async () => {
    const fetchImpl = vi.fn(async () => { throw new DOMException('The operation timed out.', 'TimeoutError'); });
    const err = await fetchPowerMonthly(42.0, -93.6, fetchImpl as unknown as typeof fetch).catch((e) => e);
    expect(err).toBeInstanceOf(SourceError);
    expect(err.message).toMatch(/did not answer within/);
  });
});

describe('datasets', () => {
  it('lists NASA POWER monthly as a NASA model dataset', () => {
    expect(datasets).toContainEqual(expect.objectContaining({
      id: 'nasa-power-monthly', nasa: true, resolution: 'about 50 km', period: '1981–2025', kind: 'model',
    }));
  });
});
