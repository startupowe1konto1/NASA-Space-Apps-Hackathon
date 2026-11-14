// Step 4: what else matters on this field, and crops the farmer will not grow (SPEC section 12).
import { useCallback, useEffect, useState, type ComponentType } from 'react';
import { t } from '../../app/i18n';
import { providers } from '../../app/providers';
import { selectedField, useAppStore } from '../../app/store';
import type { CropId, CropTraits, PriorityId } from '../../contracts';
import { SourceError } from '../../contracts';
import { StateBoundary } from '../../ui-kit';
import { IconCheck, IconErosion, IconForage, IconNitrogen, IconOrganicMatter, IconWater } from '../icons';
import { cropName } from '../shared/cropName';

const switches: { id: PriorityId; Icon: ComponentType<{ size?: number }> }[] = [
  { id: 'water', Icon: IconWater },
  { id: 'forage', Icon: IconForage },
  { id: 'nitrogen', Icon: IconNitrogen },
  { id: 'erosion', Icon: IconErosion },
  { id: 'organicMatter', Icon: IconOrganicMatter },
];

type CropsState =
  | { status: 'no-field' }
  | { status: 'loading' }
  | { status: 'ready'; crops: CropTraits[] }
  | { status: 'error'; source: string; reason: string };

export function PrioritiesStep() {
  const priorities = useAppStore((s) => s.priorities);
  const setPriorities = useAppStore((s) => s.setPriorities);
  const field = useAppStore(selectedField);

  const toggle = (id: PriorityId) =>
    setPriorities({
      ...priorities,
      on: priorities.on.includes(id) ? priorities.on.filter((p) => p !== id) : [...priorities.on, id],
    });

  const toggleCrop = (id: CropId) =>
    setPriorities({
      ...priorities,
      excludedCrops: priorities.excludedCrops.includes(id)
        ? priorities.excludedCrops.filter((c) => c !== id)
        : [...priorities.excludedCrops, id],
    });

  return (
    <div className="grid gap-6">
      <fieldset className="grid gap-3">
        <legend className="mb-1 text-lg font-semibold text-slate-900">{t('steps.priorities.intro')}</legend>
        <p className="text-base text-slate-700">{t('steps.priorities.soilAlways')}</p>
        {switches.map(({ id, Icon }) => {
          const on = priorities.on.includes(id);
          const hintId = `priority-${id}-hint`;
          const titleId = `priority-${id}-title`;
          return (
            <label
              key={id}
              className={`flex min-h-[64px] cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-colors duration-150 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-emerald-600/40 ${
                on ? 'border-emerald-700 bg-emerald-50' : 'border-slate-300 bg-white hover:border-slate-500'
              }`}
            >
              <span className={`shrink-0 ${on ? 'text-emerald-800' : 'text-slate-700'}`}>
                <Icon size={28} />
              </span>
              <span className="grid flex-1 gap-0.5">
                <span id={titleId} className="text-lg font-semibold text-slate-900">
                  {t(`steps.priorities.${id}`)}
                </span>
                <span id={hintId} className="text-base leading-snug text-slate-700">
                  {t(`steps.priorities.${id}.hint`)}
                </span>
              </span>
              <input
                type="checkbox"
                className="peer sr-only"
                checked={on}
                aria-labelledby={titleId}
                aria-describedby={hintId}
                onChange={() => toggle(id)}
              />
              <span
                aria-hidden="true"
                className={`relative h-8 w-14 shrink-0 rounded-full transition-colors duration-150 ${on ? 'bg-emerald-700' : 'bg-slate-400'}`}
              >
                <span
                  className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform duration-150 motion-reduce:transition-none ${
                    on ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </span>
            </label>
          );
        })}
      </fieldset>

      <ExcludedCrops
        country={field?.country}
        hasField={field !== undefined}
        excluded={priorities.excludedCrops}
        onToggle={toggleCrop}
      />
    </div>
  );
}

function ExcludedCrops(props: {
  country: 'US' | 'PL' | 'OTHER' | undefined;
  hasField: boolean;
  excluded: CropId[];
  onToggle: (id: CropId) => void;
}) {
  const { country, hasField, excluded, onToggle } = props;
  const [state, setState] = useState<CropsState>({ status: hasField ? 'loading' : 'no-field' });
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));

  const load = useCallback(() => {
    if (!hasField || !country) {
      setState({ status: 'no-field' });
      return () => undefined;
    }
    let live = true;
    setState({ status: 'loading' });
    providers.context
      .getCrops(country)
      .then((crops) => live && setState({ status: 'ready', crops }))
      .catch((error: unknown) => {
        if (!live) return;
        const source = error instanceof SourceError ? error.source : t('steps.priorities.exclude.source');
        setState({ status: 'error', source, reason: error instanceof Error ? error.message : String(error) });
      });
    return () => {
      live = false;
    };
  }, [country, hasField]);

  useEffect(() => load(), [load]);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const boundary =
    state.status === 'loading' && !online
      ? 'offline'
      : state.status === 'loading'
        ? 'loading'
        : state.status === 'error'
          ? 'error'
          : state.status === 'no-field' || state.crops.length === 0
            ? 'no-data'
            : 'ready';

  const reason =
    state.status === 'no-field'
      ? t('steps.priorities.exclude.noField')
      : state.status === 'ready' && state.crops.length === 0
        ? t('steps.priorities.exclude.otherCountry')
        : state.status === 'error'
          ? state.reason
          : undefined;

  return (
    <fieldset className="grid gap-3">
      <legend className="mb-1 text-lg font-semibold text-slate-900">
        {t('steps.priorities.exclude.title')}
        {excluded.length > 0 ? (
          <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-sm font-medium text-slate-800">
            {t('steps.priorities.exclude.count', { n: excluded.length })}
          </span>
        ) : null}
      </legend>
      <p className="text-base text-slate-700">{t('steps.priorities.exclude.hint')}</p>
      <StateBoundary
        state={boundary}
        source={state.status === 'error' ? state.source : t('steps.priorities.exclude.source')}
        reason={reason}
        onRetry={load}
      >
        {state.status === 'ready' ? (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {state.crops.map((crop) => {
              const out = excluded.includes(crop.id);
              return (
                <li key={crop.id}>
                  <label
                    className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border-2 px-3 py-2 transition-colors duration-150 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-emerald-600/40 ${
                      out ? 'border-slate-700 bg-slate-100 text-slate-600' : 'border-slate-300 bg-white text-slate-900 hover:border-slate-500'
                    }`}
                  >
                    <input type="checkbox" className="sr-only" checked={out} onChange={() => onToggle(crop.id)} />
                    <span
                      aria-hidden="true"
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 ${
                        out ? 'border-slate-700 bg-slate-700 text-white' : 'border-slate-500 bg-white'
                      }`}
                    >
                      {out ? <IconCheck size={16} strokeWidth={3} /> : null}
                    </span>
                    <span className={`text-base font-medium ${out ? 'line-through' : ''}`}>{cropName(crop.id)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        ) : null}
      </StateBoundary>
    </fieldset>
  );
}
