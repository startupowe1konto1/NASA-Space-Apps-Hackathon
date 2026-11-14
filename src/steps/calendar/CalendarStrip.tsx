// Month-by-month calendar of one rotation: cover state per month and hazard marks (SPEC section 8).
// O2-B3 places one strip on each card, the current rotation's strip above the others.
import { useId, useState } from 'react';
import type { CalendarMonth, CropId, Dataset, Hazard, Sourced } from '../../contracts';
import { t } from '../../app/i18n';
import { SourcedNumber, StateBoundary } from '../../ui-kit';
import { cropName as sharedCropName } from '../shared/cropName';
import { COVER_CLASS, COVER_STATES, HAZARDS, HazardMark, isMarked, yearCount } from './marks';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const monthName = (month: number) => t(`calendar.month.${month}`);
const hazardName = (hazard: Hazard) => t(`calendar.hazard.${hazard}`);

/** Plain words for a list of hazards: "drought", "drought and heat", "drought, heat and frost". */
function hazardList(hazards: Hazard[]): string {
  const names = hazards.map((h) => hazardName(h).toLowerCase());
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} ${t('calendar.and')} ${names[names.length - 1]}`;
}

function cellLabel(month: number, cell: CalendarMonth | undefined, cropName: (id: CropId) => string, marked: Hazard[]) {
  const parts = [monthName(month)];
  if (!cell) parts.push(t('calendar.cell.missing'));
  else if (cell.cover === 'crop') parts.push(cell.crop ? cropName(cell.crop) : t('calendar.cover.crop').toLowerCase());
  else if (cell.cover === 'cover-crop')
    parts.push(cell.crop ? t('calendar.cell.cover-cropNamed', { crop: cropName(cell.crop) }) : t('calendar.cell.cover-crop'));
  else parts.push(t(`calendar.cell.${cell.cover}`));
  if (marked.length > 0) parts.push(t('calendar.cell.risk', { hazards: hazardList(marked) }));
  return parts.join(', ');
}

/**
 * The share of years as "11 of 45 years" when the value says how many years it covers, otherwise as a percentage.
 * A missing share stays missing, so SourcedNumber shows its reason.
 */
function shareForDisplay(probability: Sourced): Sourced {
  const { value, range } = probability;
  if (typeof value !== 'number' || !Number.isFinite(value)) return probability;
  const years = yearCount(probability);
  const scale = years ?? 100;
  const unit = years ? t('calendar.detail.ofYears', { n: years }) : t('calendar.detail.percent');
  return {
    ...probability,
    value: Math.round(value * scale),
    unit,
    range: range ? { ...range, low: Math.round(range.low * scale), high: Math.round(range.high * scale) } : undefined,
  };
}

function Marks(props: { hazards: Hazard[] }) {
  return (
    <span className="flex max-w-full flex-wrap items-center justify-center gap-px">
      {props.hazards.map((hazard) => (
        <span key={hazard} className="inline-flex rounded-sm bg-white p-px">
          <HazardMark hazard={hazard} />
        </span>
      ))}
    </span>
  );
}

export interface CalendarStripProps {
  /** The calendar of ONE rotation (`RotationOption.calendar`). */
  months: CalendarMonth[];
  /** Datasets for the source chips, e.g. `analysis.datasets`. */
  datasets: Dataset[];
  /** Display name of a crop id. Defaults to the shared crop names of src/steps/shared. */
  cropName?: (id: CropId) => string;
  /** Names the rotation in the caption, e.g. "your rotation". The caption always says "Crop calendar". */
  label?: string;
}

export function CalendarStrip(props: CalendarStripProps) {
  const { months, datasets, cropName = sharedCropName, label } = props;
  const [selected, setSelected] = useState<{ yearIndex: number; month: number } | null>(null);
  const detailsId = useId();

  const years = [...new Set(months.map((m) => m.yearIndex))].sort((a, b) => a - b);
  const find = (yearIndex: number, month: number) => months.find((m) => m.yearIndex === yearIndex && m.month === month);
  const markedOf = (cell: CalendarMonth | undefined) =>
    cell ? HAZARDS.filter((h) => cell.exposure.some((e) => e.hazard === h && isMarked(e.probability))) : [];

  const selectedCell = selected ? find(selected.yearIndex, selected.month) : undefined;
  const selectedMarked = markedOf(selectedCell);
  const yearNumber = (yearIndex: number) => years.indexOf(yearIndex) + 1;

  return (
    <StateBoundary state={months.length === 0 ? 'no-data' : 'ready'} reason={t('calendar.empty')}>
      <div className="text-slate-900 [print-color-adjust:exact]">
        <table className="w-full table-fixed border-separate border-spacing-0.5 text-xs">
          <caption className="mb-1 text-left text-sm font-semibold text-slate-900">
            {label ? t('calendar.captionFor', { label }) : t('calendar.caption')}
          </caption>
          <thead>
            <tr>
              <th scope="col" className="w-12 text-left font-normal text-slate-700">
                <span className="sr-only">{t('calendar.yearHeader')}</span>
              </th>
              {MONTHS.map((month) => (
                <th key={month} scope="col" className="min-w-6 font-medium text-slate-700">
                  <span aria-hidden="true">{t(`calendar.monthShort.${month}`)}</span>
                  <span className="sr-only">{monthName(month)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {years.map((yearIndex) => (
              <tr key={yearIndex}>
                <th scope="row" className="whitespace-nowrap pr-1 text-left font-medium text-slate-700">
                  {t('calendar.year', { n: yearNumber(yearIndex) })}
                </th>
                {MONTHS.map((month) => {
                  const cell = find(yearIndex, month);
                  const marked = markedOf(cell);
                  const text = cellLabel(month, cell, cropName, marked);
                  const colour = cell ? COVER_CLASS[cell.cover] : 'border border-dashed border-slate-500 bg-white';
                  const box = `flex h-10 min-w-6 w-full items-center justify-center rounded-sm ${colour}`;

                  if (marked.length === 0) {
                    return (
                      <td key={month} aria-label={text} title={text} className="p-0">
                        <span aria-hidden="true" className={box} />
                      </td>
                    );
                  }
                  const isOpen = selected?.yearIndex === yearIndex && selected.month === month;
                  return (
                    <td key={month} className="p-0">
                      <button
                        type="button"
                        aria-label={text}
                        title={text}
                        aria-expanded={isOpen}
                        aria-controls={isOpen ? detailsId : undefined}
                        onClick={() => setSelected(isOpen ? null : { yearIndex, month })}
                        className={`${box} cursor-pointer outline-none ring-offset-1 hover:brightness-110 focus-visible:ring-2 focus-visible:ring-slate-900 motion-safe:transition ${isOpen ? 'ring-2 ring-slate-900' : ''}`}
                      >
                        <Marks hazards={marked} />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {selected && selectedCell ? (
          <section
            id={detailsId}
            aria-label={t('calendar.detail.title', { month: monthName(selected.month), year: yearNumber(selected.yearIndex) })}
            className="mt-2 rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm"
          >
            <p className="font-semibold text-slate-900">{cellLabel(selected.month, selectedCell, cropName, [])}</p>
            <ul className="mt-1 space-y-1">
              {selectedCell.exposure
                .filter((e) => selectedMarked.includes(e.hazard))
                .map((e) => (
                  <li key={e.hazard} className="flex flex-wrap items-center gap-x-2">
                    <HazardMark hazard={e.hazard} size={14} />
                    <span className="text-slate-900">
                      {t('calendar.detail.hazard', { hazard: hazardName(e.hazard), month: monthName(selected.month) })}
                    </span>
                    <SourcedNumber value={shareForDisplay(e.probability)} datasets={datasets} decimals={0} />
                  </li>
                ))}
            </ul>
          </section>
        ) : months.some((m) => markedOf(m).length > 0) ? (
          <p className="mt-1 text-xs text-slate-700">{t('calendar.detail.hint')}</p>
        ) : null}

        <ul aria-label={t('calendar.legend')} className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-700">
          {COVER_STATES.map((cover) => (
            <li key={cover} className="inline-flex items-center gap-1">
              <span aria-hidden="true" className={`inline-block h-3 w-4 rounded-sm ${COVER_CLASS[cover]}`} />
              {t(`calendar.cover.${cover}`)}
            </li>
          ))}
          {HAZARDS.map((hazard) => (
            <li key={hazard} className="inline-flex items-center gap-1">
              <HazardMark hazard={hazard} size={12} />
              {hazardName(hazard)}
            </li>
          ))}
        </ul>
        <p className="mt-1 text-xs text-slate-700">{t('calendar.note')}</p>
      </div>
    </StateBoundary>
  );
}
