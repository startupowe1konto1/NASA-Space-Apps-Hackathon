// Placeholder from the skeleton (O1-S1). O2 replaces it in task O2-B1; keep the file path and the export name.
import { t } from '../../app/i18n';
import { useAppStore } from '../../app/store';
import type { PriorityId } from '../../contracts';

const all: PriorityId[] = ['water', 'forage', 'nitrogen', 'erosion', 'organicMatter'];

export function PrioritiesStep() {
  const priorities = useAppStore((s) => s.priorities);
  const setPriorities = useAppStore((s) => s.setPriorities);
  const toggle = (id: PriorityId) =>
    setPriorities({
      ...priorities,
      on: priorities.on.includes(id) ? priorities.on.filter((p) => p !== id) : [...priorities.on, id],
    });
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-slate-700">{t('steps.priorities.intro')}</legend>
      {all.map((id) => (
        <label key={id} className="flex min-h-11 items-center gap-3 rounded border border-slate-300 px-4">
          <input type="checkbox" checked={priorities.on.includes(id)} onChange={() => toggle(id)} />
          {t(`steps.priorities.${id}`)}
        </label>
      ))}
    </fieldset>
  );
}
