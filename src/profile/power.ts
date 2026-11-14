// NASA POWER monthly point client and parser.
// Parser written against data/samples/power/point-monthly-1981-2025-ag.json.
import { SourceError } from '../contracts';

const SOURCE = 'NASA POWER';
const START_YEAR = 1981;
const END_YEAR = 2025;
const DEFAULT_FILL = -999;
/** Latent heat of vaporisation, MJ per kg of water: 1 MJ/m^2 of latent heat ~ 1/2.45 mm of water. */
const LATENT_HEAT_MJ_PER_KG = 2.45;

export const POWER_PARAMETERS = ['GWETROOT', 'GWETTOP', 'PRECTOTCORR', 'T2M_MAX', 'FROST_DAYS', 'EVPTRNS'] as const;
export type PowerParameter = (typeof POWER_PARAMETERS)[number];

export interface PowerMonth {
  year: number;
  month: number;
  GWETROOT: number | null;    // root zone soil wetness, 0-1
  GWETTOP: number | null;     // surface soil wetness, 0-1
  PRECTOTCORR: number | null; // mm/day
  T2M_MAX: number | null;     // C
  FROST_DAYS: number | null;  // days
  EVPTRNS: number | null;     // MJ/m^2/day
}

export interface PowerMonthly {
  months: PowerMonth[];
  retrievedAt: string;
  units: Record<string, string>; // raw POWER units from the response's parameters block
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Monthly rain total in mm (PRECTOTCORR mm/day x days in the month). */
export function rainMm(m: PowerMonth): number | null {
  return m.PRECTOTCORR === null ? null : m.PRECTOTCORR * daysInMonth(m.year, m.month);
}

/** Monthly evapotranspiration in mm (EVPTRNS MJ/m^2/day / 2.45 x days in the month). */
export function evapotranspirationMm(m: PowerMonth): number | null {
  return m.EVPTRNS === null ? null : (m.EVPTRNS / LATENT_HEAT_MJ_PER_KG) * daysInMonth(m.year, m.month);
}

const round4 = (x: number): number => Math.round(x * 1e4) / 1e4;

export function powerMonthlyUrl(lat: number, lon: number): string {
  return (
    'https://power.larc.nasa.gov/api/temporal/monthly/point' +
    `?parameters=${POWER_PARAMETERS.join(',')}` +
    `&community=AG&longitude=${round4(lon)}&latitude=${round4(lat)}` +
    `&start=${START_YEAR}&end=${END_YEAR}&format=JSON`
  );
}

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

function malformed(detail: string): SourceError {
  return new SourceError(SOURCE, `NASA POWER sent an unexpected response: ${detail}`);
}

export function parsePowerMonthly(json: unknown, retrievedAt: string): PowerMonthly {
  if (!isRecord(json)) throw malformed('body is not an object');
  const properties = json.properties;
  if (!isRecord(properties) || !isRecord(properties.parameter)) throw malformed('no properties.parameter');
  const parameter = properties.parameter;

  const header = json.header;
  const fills = new Set<number>([DEFAULT_FILL]);
  if (isRecord(header) && typeof header.fill_value === 'number') fills.add(header.fill_value);

  const rows = new Map<number, PowerMonth>();
  for (const name of POWER_PARAMETERS) {
    const series = parameter[name];
    if (!isRecord(series)) throw malformed(`parameter ${name} missing`);
    for (const [key, raw] of Object.entries(series)) {
      if (!/^\d{6}$/.test(key)) throw malformed(`bad date key ${key} in ${name}`);
      const year = Number(key.slice(0, 4));
      const month = Number(key.slice(4));
      if (month === 13) continue; // annual value
      if (month < 1 || month > 12) throw malformed(`bad month in ${key}`);
      if (raw !== null && (typeof raw !== 'number' || !Number.isFinite(raw))) throw malformed(`non-numeric ${name} at ${key}`);
      const value = raw === null || fills.has(raw) ? null : raw;
      const id = year * 100 + month;
      let row = rows.get(id);
      if (!row) {
        row = { year, month, GWETROOT: null, GWETTOP: null, PRECTOTCORR: null, T2M_MAX: null, FROST_DAYS: null, EVPTRNS: null };
        rows.set(id, row);
      }
      row[name] = value;
    }
  }

  const units: Record<string, string> = {};
  if (isRecord(json.parameters)) {
    for (const [name, meta] of Object.entries(json.parameters)) {
      if (isRecord(meta) && typeof meta.units === 'string') units[name] = meta.units;
    }
  }

  const months = [...rows.entries()].sort((a, b) => a[0] - b[0]).map(([, r]) => r);
  return { months, retrievedAt, units };
}

/** YYYY-MM-DD in the user's local calendar, so the date matches the day they see. */
function localIsoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export async function fetchPowerMonthly(lat: number, lon: number, fetchImpl: typeof fetch = fetch): Promise<PowerMonthly> {
  const url = powerMonthlyUrl(lat, lon);
  let res: Response;
  try {
    res = await fetchImpl(url);
  } catch (e) {
    throw new SourceError(SOURCE, `NASA POWER could not be reached: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (!res.ok) throw new SourceError(SOURCE, `NASA POWER answered with status ${res.status}`);
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw malformed('body is not JSON');
  }
  return parsePowerMonthly(body, localIsoDate(new Date()));
}
