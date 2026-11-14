// Rotation calendar: which crop or cover is on the field in each month of the rotation cycle.
// Convention: a rotation year is the harvest year. A winter crop (harvestMonth < sowMonth) listed in year i
// is sown in year i-1 and harvested in year i. The cycle wraps, so the last year is followed by the first.
import type { CalendarMonth, CoverState, CropId, CropTraits, RotationOption } from '../contracts';

export type CalendarCell = Omit<CalendarMonth, 'exposure'>;

export function cropById(crops: CropTraits[], id: CropId): CropTraits {
  const crop = crops.find((c) => c.id === id);
  if (!crop) throw new Error(`calendar: no crop traits for '${id}'`);
  return crop;
}

const isWinterCrop = (crop: CropTraits) => crop.harvestMonth < crop.sowMonth;

/**
 * True when `next` can be sown after `prev` is harvested. A spring crop is sown the calendar year after `prev`'s
 * harvest, so it always fits. A winter crop is sown in the same calendar year as `prev`'s harvest, so its sowing
 * month must not come before that harvest month (sowing in the harvest month itself is allowed).
 */
export function canFollow(prev: CropTraits, next: CropTraits): boolean {
  if (!isWinterCrop(next)) return true;
  return next.sowMonth >= prev.harvestMonth;
}

const residueState = (crop: CropTraits): CoverState => (crop.residueCover === 'low' ? 'bare' : 'residue');

/** Months of the rotation cycle with the cover state of each, and the count of bare months per cycle. */
export function buildCalendar(
  years: RotationOption['years'],
  crops: CropTraits[],
): { months: CalendarCell[]; bareMonths: number } {
  const n = years.length;
  const size = n * 12;
  const wrap = (t: number) => ((t % size) + size) % size;
  const cells: (CalendarCell | undefined)[] = new Array(size).fill(undefined);
  const mains = years.map((y) => cropById(crops, y.crop));

  // 1. main crops
  const harvestIndex: number[] = [];
  mains.forEach((crop, i) => {
    const end = i * 12 + crop.harvestMonth - 1;
    const start = isWinterCrop(crop) ? (i - 1) * 12 + crop.sowMonth - 1 : i * 12 + crop.sowMonth - 1;
    for (let t = start; t <= end; t++) {
      cells[wrap(t)] = { yearIndex: Math.floor(wrap(t) / 12), month: (wrap(t) % 12) + 1, crop: crop.id, cover: 'crop' };
    }
    harvestIndex[i] = wrap(end);
  });

  // 2. the gap after each harvest, until the next crop is in the ground
  mains.forEach((crop, i) => {
    const gap: number[] = [];
    for (let k = 1; k < size; k++) {
      const t = wrap((harvestIndex[i] ?? 0) + k);
      if (cells[t]) break;
      gap.push(t);
    }
    const coverId = years[i]?.coverCrop;
    const cover = coverId ? cropById(crops, coverId) : undefined;
    let coverStart = gap.length;
    let coverEnd = -1;
    if (cover && gap.length > 0) {
      const sowAt = gap.findIndex((t) => (t % 12) + 1 === cover.sowMonth);
      coverStart = sowAt === -1 ? 0 : sowAt;
      const endAt = gap.findIndex((t, k) => k >= coverStart && (t % 12) + 1 === cover.harvestMonth);
      coverEnd = endAt === -1 ? gap.length - 1 : endAt;
    }
    gap.forEach((t, k) => {
      const base = { yearIndex: Math.floor(t / 12), month: (t % 12) + 1 };
      if (cover && k >= coverStart && k <= coverEnd) cells[t] = { ...base, crop: cover.id, cover: 'cover-crop' };
      else if (cover && k > coverEnd) cells[t] = { ...base, cover: residueState(cover) };
      else cells[t] = { ...base, cover: residueState(crop) };
    });
  });

  const months = cells.map((cell, t) => cell ?? { yearIndex: Math.floor(t / 12), month: (t % 12) + 1, cover: 'bare' as const });
  return { months, bareMonths: months.filter((m) => m.cover === 'bare').length };
}
