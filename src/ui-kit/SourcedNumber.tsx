import { useId, useState } from 'react';
import type { Dataset, Sourced, ValueKind } from '../contracts';
import { t } from '../app/i18n';

function formatNumber(n: number, decimals: number): string {
  const text = new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals }).format(n);
  return text === '-0' ? '0' : text;
}

/** The date part of an ISO timestamp; anything else is shown as received. */
function formatDate(iso: string): string {
  return /^\d{4}-\d{2}-\d{2}/.test(iso) ? iso.slice(0, 10) : iso;
}

// The mark differs in shape per kind, so the chip reads without colour.
const KIND_MARK: Record<ValueKind, string> = {
  observation: 'rounded-full bg-emerald-700',
  model: 'rounded-full border-2 border-zinc-700',
  derived: 'rotate-45 bg-amber-700',
};

function Row(props: { label: string; text: string }) {
  return (
    <span className="block">
      <span className="text-zinc-600">{props.label} </span>
      <span className="text-zinc-900">{props.text}</span>
    </span>
  );
}

export function SourcedNumber(props: { value: Sourced<number | string>; datasets: Dataset[]; decimals?: number }) {
  const { value: sourced, datasets, decimals = 1 } = props;
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const raw = sourced.value;
  const missing = raw === null || (typeof raw === 'number' && !Number.isFinite(raw));

  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-x-2 align-middle">
      {missing ? (
        <span className="inline-flex flex-wrap items-baseline gap-x-2">
          <span className="font-semibold text-zinc-900">{t('ui.noData')}</span>
          <span className="text-sm text-zinc-700">{sourced.missingReason || t('ui.noReason')}</span>
        </span>
      ) : (
        <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
          <span className="font-semibold tabular-nums text-zinc-900">
            {typeof raw === 'number' ? formatNumber(raw, decimals) : raw}
          </span>
          {sourced.unit ? <span className="text-sm text-zinc-700">{sourced.unit}</span> : null}
          {sourced.range ? (
            <span className="inline-flex flex-wrap items-baseline gap-x-1 text-sm text-zinc-700">
              <span>{t('ui.range.label')}</span>
              <span className="tabular-nums">
                {`${formatNumber(sourced.range.low, decimals)}–${formatNumber(sourced.range.high, decimals)}`}
              </span>
              <span>{sourced.range.basis}</span>
            </span>
          ) : null}
        </span>
      )}

      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={t('ui.source.chip', { kind: t(`ui.kind.${sourced.kind}`) })}
        onClick={() => setOpen((was) => !was)}
        className="group inline-flex min-h-[44px] items-center focus:outline-none"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-400 bg-white px-2.5 py-1 text-sm text-zinc-800 group-hover:bg-zinc-100 group-focus-visible:ring-2 group-focus-visible:ring-zinc-900 group-focus-visible:ring-offset-2 group-aria-expanded:bg-zinc-100">
          <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 ${KIND_MARK[sourced.kind]}`} />
          {t(`ui.kind.${sourced.kind}`)}
        </span>
      </button>

      {open ? (
        <span
          id={panelId}
          role="group"
          aria-label={t('ui.source.details')}
          className="block basis-full rounded-lg border border-zinc-300 bg-zinc-50 p-3 text-left text-sm font-normal"
        >
          {sourced.datasetIds.length === 0 ? <span className="block text-zinc-900">{t('ui.source.none')}</span> : null}
          {sourced.datasetIds.map((id) => {
            const dataset = datasets.find((d) => d.id === id);
            if (!dataset) {
              return (
                <span key={id} className="mb-2 block text-zinc-900">
                  {t('ui.source.unknown', { id })}
                </span>
              );
            }
            return (
              <span key={id} className="mb-2 block">
                <span className="block font-semibold text-zinc-900">{dataset.name}</span>
                <Row label={t('ui.source.provider')} text={dataset.provider} />
                <Row label={t('ui.source.resolution')} text={dataset.resolution} />
                <Row label={t('ui.source.period')} text={dataset.period} />
              </span>
            );
          })}
          <Row label={t('ui.source.retrieved')} text={formatDate(sourced.retrievedAt)} />
        </span>
      ) : null}
    </span>
  );
}
