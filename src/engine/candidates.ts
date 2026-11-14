// Candidate rotations for one field (SPEC section 8, "Generating candidates").
// Order of the output: the current rotation, its one-step variants, then rotations of 2 to 5 years enumerated from
// the crop list (shorter first), then those enumerated rotations with one cover crop added. Capped at MAX_CANDIDATES.
// Conventions follow calendar.ts: a rotation year is the harvest year, a winter crop is sown the year before, and the
// cycle wraps so the last year is followed by the first.
import type { CropId, CropTraits, CropYear, Priorities, RotationOption } from '../contracts';
import { canFollow } from './calendar';

export const MAX_CANDIDATES = 300;
const MIN_ENUMERATED_YEARS = 2;
const MAX_ENUMERATED_YEARS = 5;
const SMALL_GRAIN_LATEST_HARVEST = 8;

type Years = RotationOption['years'];
type Year = Years[number];

/** The repeating cycle in the crop history, or the history as entered (sorted by year) when nothing repeats. */
export function currentRotation(history: CropYear[]): Years {
  const sorted = [...history].sort((a, b) => a.year - b.year);
  const n = sorted.length;
  const toYear = (h: CropYear): Year => (h.coverCrop ? { crop: h.crop, coverCrop: h.coverCrop } : { crop: h.crop });
  // A cycle counts once at least two years repeat it, so a 7-year history can show a 4-year rotation.
  for (let L = 1; n - L >= 2; L++) {
    // the cycle is found on main crops; cover crops of the last cycle are carried over as they are
    if (sorted.every((h, i) => i + L >= n || h.crop === sorted[i + L]?.crop)) return sorted.slice(n - L).map(toYear);
  }
  return sorted.map(toYear);
}

const isWinter = (c: CropTraits) => c.harvestMonth < c.sowMonth;

/**
 * A cover crop fits between `prev` and `next` when it is sown in or after the month `prev` is harvested and is
 * ended no later than the month `next` is sown. A winter cover cannot sit before a winter crop (that crop is sown
 * in the autumn the cover would occupy).
 */
function coverFits(prev: CropTraits, cover: CropTraits, next: CropTraits): boolean {
  if (cover.sowMonth < prev.harvestMonth) return false;
  if (isWinter(next)) return !isWinter(cover) && cover.harvestMonth <= next.sowMonth;
  return !isWinter(cover) || cover.harvestMonth <= next.sowMonth;
}

const serialize = (y: Year) => `${y.crop}+${y.coverCrop ?? ''}`;

/** Smallest rotation of the serialized cycle, so [maize, soybean] and [soybean, maize] share one key. */
function canonicalKey(years: Years): string {
  const parts = years.map(serialize);
  let best: string | undefined;
  for (let s = 0; s < parts.length; s++) {
    const k = [...parts.slice(s), ...parts.slice(0, s)].join('|');
    if (best === undefined || k < best) best = k;
  }
  return best ?? '';
}

/** True when the cycle is a shorter cycle repeated, e.g. [maize, soybean, maize, soybean]. */
function hasShorterPeriod(ids: CropId[]): boolean {
  const n = ids.length;
  for (let L = 1; L < n; L++) {
    if (n % L === 0 && ids.every((id, i) => id === ids[(i + L) % n])) return true;
  }
  return false;
}

export function generateCandidates(current: Years, crops: CropTraits[], priorities: Priorities): Years[] {
  const excluded = new Set(priorities.excludedCrops);
  const byId = new Map(crops.map((c) => [c.id, c]));
  const allowed = crops.filter((c) => !excluded.has(c.id));
  const mains = allowed.filter((c) => c.kind === 'cash' || c.kind === 'perennial');
  const covers = allowed.filter((c) => c.kind === 'cover');
  const smallGrains = mains.filter(
    (c) => c.kind === 'cash' && c.family === 'Poaceae' && c.harvestMonth <= SMALL_GRAIN_LATEST_HARVEST,
  );
  const legumes = mains.filter((c) => c.legume);

  const traits = (years: Years): CropTraits[] | undefined => {
    const list = years.map((y) => byId.get(y.crop));
    return list.every((c): c is CropTraits => c !== undefined) ? list : undefined;
  };

  /** Every filter of SPEC section 8; unknown crops fail because their traits cannot be checked. */
  const passes = (years: Years): boolean => {
    if (years.length === 0) return false;
    const t = traits(years);
    if (!t) return false;
    return years.every((y, i) => {
      const prev = t[i]!;
      const next = t[(i + 1) % t.length]!;
      if (excluded.has(y.crop) || prev.kind === 'cover' || !canFollow(prev, next)) return false;
      if (y.coverCrop === undefined) return true;
      const cover = byId.get(y.coverCrop);
      return cover !== undefined && cover.kind === 'cover' && !excluded.has(cover.id) && coverFits(prev, cover, next);
    });
  };

  /** Drops a cover crop that no longer fits after a neighbour changed, instead of dropping the whole variant. */
  const dropUnfitCovers = (years: Years): Years => {
    const t = traits(years);
    if (!t) return years;
    return years.map((y, i) => {
      if (y.coverCrop === undefined) return y;
      const cover = byId.get(y.coverCrop);
      if (cover && coverFits(t[i]!, cover, t[(i + 1) % t.length]!)) return y;
      return { crop: y.crop };
    });
  };

  const out: Years[] = [];
  const seen = new Set<string>();
  const add = (years: Years, checked = false): boolean => {
    if (out.length >= MAX_CANDIDATES) return false;
    const k = canonicalKey(years);
    if (seen.has(k) || (!checked && !passes(years))) return true;
    seen.add(k);
    out.push(years);
    return true;
  };

  // 1. the current rotation, as the farmer runs it
  if (current.length > 0) add(current, true);

  // 2. one-step variants
  const withCover = (years: Years): Years[] => {
    const t = traits(years);
    if (!t) return [];
    const result: Years[] = [];
    years.forEach((y, i) => {
      if (y.coverCrop !== undefined) return;
      for (const cover of covers) {
        if (!coverFits(t[i]!, cover, t[(i + 1) % t.length]!)) continue;
        result.push(years.map((z, j) => (j === i ? { crop: z.crop, coverCrop: cover.id } : z)));
      }
    });
    return result;
  };
  const insertions = (years: Years, options: CropTraits[]): Years[] =>
    years.flatMap((_, i) =>
      options.map((c) => dropUnfitCovers([...years.slice(0, i), { crop: c.id }, ...years.slice(i)])),
    );
  const replacements = (years: Years): Years[] =>
    years.flatMap((y, i) =>
      mains
        .filter((c) => c.id !== y.crop)
        .map((c) => dropUnfitCovers(years.map((z, j) => (j === i ? { ...z, crop: c.id } : z)))),
    );

  if (current.length > 0) {
    const variants = [
      ...withCover(current),
      ...insertions(current, smallGrains),
      ...insertions(current, legumes),
      ...replacements(current),
    ];
    for (const v of variants) add(v);
  }

  // 3. rotations of 2 to 5 years from cash and perennial crops, shorter first, in crop-list order
  const enumerated: Years[] = [];
  outer: for (let n = MIN_ENUMERATED_YEARS; n <= MAX_ENUMERATED_YEARS; n++) {
    const idx = new Array<number>(n).fill(0);
    while (mains.length > 0) {
      const ids = idx.map((i) => mains[i]!.id);
      // only the smallest rotation of each cycle; the rest are the same rotation started elsewhere
      if (!hasShorterPeriod(ids)) {
        const years: Years = ids.map((crop) => ({ crop }));
        if (canonicalKey(years) === ids.map((id) => `${id}+`).join('|') && passes(years)) {
          if (!seen.has(canonicalKey(years))) enumerated.push(years);
          if (!add(years, true)) break outer;
        }
      }
      let p = n - 1;
      while (p >= 0 && idx[p] === mains.length - 1) idx[p--] = 0;
      if (p < 0) break;
      idx[p]!++;
    }
  }

  // 4. the enumerated rotations with one cover crop added, while the cap leaves room
  for (const years of enumerated) {
    for (const v of withCover(years)) if (!add(v)) return out;
  }
  return out;
}
