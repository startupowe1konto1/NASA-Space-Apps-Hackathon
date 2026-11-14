// MoneyProvider on the money tables in data/money (task O4-A4). Tables only: the engine replays the yields over the
// field's climate record (src/engine/income.ts). Nothing here is estimated: a crop without a sourced yield, price and
// direct costs gives `no-data` naming that crop.
import type { AsyncResult, CropEconomics, CropId, CropTraits, Field, MoneyProvider, Sourced, SourceRef, ValueKind } from '../contracts';
import type { moneyFile } from '../contracts/schemas';
import type { z } from 'zod';
import cropsPl from '../../data/crops/pl.json';
import cropsUs from '../../data/crops/us-ia.json';
import moneyPl from '../../data/money/pl.json';
import moneyUs from '../../data/money/us-ia.json';
import { RETRIEVED_AT, datasetIdForSource } from './datasets';
import { paymentsFor } from './payments';

export type MoneyFile = z.infer<typeof moneyFile>;
export interface MoneyTables { US: MoneyFile; PL: MoneyFile }
export interface CropTables { US: CropTraits[]; PL: CropTraits[] }

/**
 * Each source locator in data/money starts with the value it backs ('yield:', 'price:' or 'direct costs:'), so every
 * value gets the dataset it came from. The yield is a mean over years (our calculation from official statistics), the
 * price is an official statistic, the direct costs come from an extension service budget (an estimate).
 */
const ROLES = {
  yield: { prefix: 'yield:', kind: 'derived' as ValueKind },
  price: { prefix: 'price:', kind: 'observation' as ValueKind },
  costs: { prefix: 'direct costs:', kind: 'model' as ValueKind },
};

function value(sources: SourceRef[], role: keyof typeof ROLES, amount: number, unit: string): Sourced {
  const { prefix, kind } = ROLES[role];
  const ids = sources.filter((s) => s.locator.startsWith(prefix)).map((s) => datasetIdForSource(s.url));
  const datasetIds = [...new Set(ids.filter((id): id is string => !!id))];
  if (datasetIds.length === 0) throw new Error(`money: no registered dataset for the ${role} source`);
  return { value: amount, unit, datasetIds, kind, retrievedAt: RETRIEVED_AT };
}

const NO_TABLES: AsyncResult<never> = { status: 'no-data', reason: { code: 'money.no-tables' } };

export function createTableMoneyProvider(tables: MoneyTables, crops: CropTables): MoneyProvider {
  return {
    async getEconomics(field: Field, requested: CropId[]): Promise<AsyncResult<CropEconomics[]>> {
      if (field.country === 'OTHER') return NO_TABLES;
      const table = tables[field.country];
      // Cover crops are not sold, so they need no yield or price (the engine counts main crops only).
      const cover = new Set(crops[field.country].filter((c) => c.kind === 'cover').map((c) => c.id));
      const out: CropEconomics[] = [];
      for (const crop of [...new Set(requested)]) {
        if (cover.has(crop)) continue;
        const row = table.economics.find((r) => r.crop === crop);
        if (!row) return { status: 'no-data', reason: { code: 'money.no-economics', params: { crop } } };
        out.push({
          crop,
          referenceYieldTPerHa: value(row.sources, 'yield', row.referenceYieldTPerHa, 't/ha'),
          pricePerT: value(row.sources, 'price', row.pricePerT, `${table.currency}/t`),
          directCostsPerHa: value(row.sources, 'costs', row.directCostsPerHa, `${table.currency}/ha`),
        });
      }
      return { status: 'ready', data: out };
    },

    async getPayments(field, rotation) {
      if (field.country === 'OTHER') return NO_TABLES;
      return { status: 'ready', data: paymentsFor(tables[field.country], rotation, crops[field.country]) };
    },
  };
}

export const tableMoneyProvider: MoneyProvider = createTableMoneyProvider(
  { US: moneyUs as MoneyFile, PL: moneyPl as MoneyFile },
  { US: cropsUs as CropTraits[], PL: cropsPl as CropTraits[] },
);
