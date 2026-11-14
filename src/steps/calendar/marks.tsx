// Hazard marks, cover swatches and the small number helpers of the calendar strip.
import type { CoverState, Hazard, Sourced } from '../../contracts';
import hazardRules from '../../../data/rules/hazards.json';

export const HAZARDS: Hazard[] = ['drought', 'heat', 'frost'];
export const COVER_STATES: CoverState[] = ['crop', 'cover-crop', 'residue', 'bare'];

// Bare soil carries a hatch as well as its colour, so it reads in black-and-white print and without colour vision.
export const COVER_CLASS: Record<CoverState, string> = {
  crop: 'bg-emerald-600',
  'cover-crop': 'bg-lime-500',
  residue: 'bg-yellow-700',
  bare: 'bg-stone-300 bg-[repeating-linear-gradient(135deg,theme(colors.stone.500)_0_2px,transparent_2px_6px)]',
};

const HAZARD_COLOUR: Record<Hazard, string> = {
  drought: 'text-amber-700',
  heat: 'text-red-700',
  frost: 'text-blue-700',
};

/** One shape per hazard (drop with a slash, sun, snowflake), so the marks differ without colour. */
export function HazardMark(props: { hazard: Hazard; size?: number }) {
  const { hazard, size = 10 } = props;
  return (
    <svg
      aria-hidden="true"
      data-testid={`mark-${hazard}`}
      viewBox="0 0 12 12"
      width={size}
      height={size}
      className={`shrink-0 ${HAZARD_COLOUR[hazard]}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {hazard === 'drought' ? (
        <>
          <path d="M6 1.5 C6 1.5 2.5 5.5 2.5 7.7 a3.5 3.5 0 0 0 7 0 C9.5 5.5 6 1.5 6 1.5 Z" fill="currentColor" stroke="none" />
          <path d="M1.5 10.5 L10.5 1.5" stroke="white" strokeWidth={2.5} />
          <path d="M1.5 10.5 L10.5 1.5" />
        </>
      ) : hazard === 'heat' ? (
        <>
          <circle cx="6" cy="6" r="2.2" fill="currentColor" />
          <path d="M6 0.8v1.4M6 9.8v1.4M0.8 6h1.4M9.8 6h1.4M2.3 2.3l1 1M8.7 8.7l1 1M2.3 9.7l1-1M8.7 3.3l1-1" />
        </>
      ) : (
        <path d="M6 0.8v10.4M1.5 3.4l9 5.2M1.5 8.6l9-5.2M4.6 1.6 6 3l1.4-1.4M4.6 10.4 6 9l1.4 1.4" />
      )}
    </svg>
  );
}

/** Share of years above which a sensitive month gets a hazard mark (`hazards.calendar.markShare`), or null if absent. */
export const markShare: number | null = (() => {
  const row = (hazardRules as { id: string; value: unknown }[]).find((r) => r.id === 'hazards.calendar.markShare');
  return row && typeof row.value === 'number' ? row.value : null;
})();

/**
 * True when an exposure earns a mark. A missing share is marked too: the hazard cannot be ruled out, and tapping the
 * mark shows why the number is missing.
 */
export function isMarked(probability: Sourced, threshold: number | null = markShare): boolean {
  const value = probability.value;
  if (typeof value !== 'number' || !Number.isFinite(value)) return true;
  return threshold === null || value > threshold;
}

/**
 * How many years a share of years covers, read only from what the value says about itself: "45 years" or a
 * "1981–2025" span in the basis of its range. Null when it does not say, so the caller shows a percentage instead.
 */
export function yearCount(probability: Sourced): number | null {
  const basis = probability.range?.basis;
  if (!basis) return null;
  const counted = /(\d+)\s+years/.exec(basis);
  if (counted) return Number(counted[1]);
  const span = /(\d{4})\s*[–-]\s*(\d{4})/.exec(basis);
  if (span) {
    const years = Number(span[2]) - Number(span[1]) + 1;
    return years > 0 ? years : null;
  }
  return null;
}
