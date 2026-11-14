// The farmer's fields: pick the one to analyse, rename it, delete it. Works with keyboard and touch, and without the map.
// Only one button per row, named just "Delete": e2e finds the demo button by a substring of its name, so no other button
// may carry a field name. The row text reaches screen readers through aria-describedby instead.
import { useEffect, useId, useState, type KeyboardEvent } from 'react';
import { t } from '../../app/i18n';
import { useAppStore } from '../../app/store';
import type { Field } from '../../contracts';

const BUTTON =
  'min-h-11 shrink-0 rounded-lg border border-slate-300 bg-white px-4 text-base font-medium text-slate-900 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 active:bg-slate-100';
const INPUT =
  'min-h-11 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600';

export function FieldList() {
  const fields = useAppStore((s) => s.fields);
  const selectedFieldId = useAppStore((s) => s.selectedFieldId);
  const groupName = useId();

  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900">{t('map.fields')}</h2>
      {fields.length === 0 ? <p className="mt-1 text-slate-700">{t('map.fields.empty')}</p> : null}
      <fieldset className="mt-2">
        <legend className="sr-only">{t('draw.fields.select')}</legend>
        <ul aria-label={t('map.fields')} className="grid gap-2">
          {fields.map((f) => (
            <FieldRow key={f.id} field={f} selected={f.id === selectedFieldId} groupName={groupName} />
          ))}
        </ul>
      </fieldset>
    </section>
  );
}

function FieldRow({ field, selected, groupName }: { field: Field; selected: boolean; groupName: string }) {
  const selectField = useAppStore((s) => s.selectField);
  const removeField = useAppStore((s) => s.removeField);
  const base = useId();
  const pickId = `${base}-pick`;
  const rowId = `${base}-row`;
  const nameId = `${base}-name`;

  return (
    <li
      aria-current={selected ? 'true' : undefined}
      className={`rounded-lg border px-4 py-3 text-base ${
        selected ? 'border-emerald-700 bg-emerald-50 text-emerald-950' : 'border-slate-300 bg-white text-slate-900'
      }`}
    >
      <div className="flex items-center gap-3">
        <input
          type="radio"
          id={pickId}
          name={groupName}
          checked={selected}
          onChange={() => selectField(field.id)}
          className="h-6 w-6 shrink-0 accent-emerald-700"
        />
        <label htmlFor={pickId} id={rowId} className={`flex min-h-11 flex-1 items-center ${selected ? 'font-medium' : ''}`}>
          {t('map.fields.item', { name: field.name, area: field.areaHa.toFixed(1) })}
        </label>
      </div>
      <div className="mt-2 flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor={nameId} className="block text-sm text-slate-600">
            {t('draw.fields.name')}
          </label>
          <NameInput id={nameId} field={field} />
        </div>
        <button type="button" className={BUTTON} aria-describedby={rowId} onClick={() => removeField(field.id)}>
          {t('draw.fields.delete')}
        </button>
      </div>
    </li>
  );
}

/** Saves on Enter or when focus leaves, so the analysis is not reset on every key. A blank name keeps the old one. */
function NameInput({ id, field }: { id: string; field: Field }) {
  const updateField = useAppStore((s) => s.updateField);
  const [draft, setDraft] = useState(field.name);

  useEffect(() => setDraft(field.name), [field.name]);

  const commit = () => {
    const name = draft.trim();
    if (name === '' || name === field.name) {
      setDraft(field.name);
      return;
    }
    // Read the field at commit time: the outline may have been edited on the map since this row rendered.
    const current = useAppStore.getState().fields.find((f) => f.id === field.id) ?? field;
    updateField({ ...current, name });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') setDraft(field.name);
  };

  return (
    <input
      id={id}
      type="text"
      className={INPUT}
      value={draft}
      autoComplete="off"
      enterKeyHint="done"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={onKeyDown}
    />
  );
}
