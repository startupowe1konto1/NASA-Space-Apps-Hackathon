// Placeholder from the skeleton (O1-S1). O2 replaces it with the real map in task O2-A1; keep the path and the export name.
import { t } from '../app/i18n';
import { useAppStore } from '../app/store';
import { demoFields } from '../fixtures';

export function MapStep() {
  const fields = useAppStore((s) => s.fields);
  const selectedFieldId = useAppStore((s) => s.selectedFieldId);
  const addField = useAppStore((s) => s.addField);
  return (
    <div className="grid gap-3">
      <p className="text-slate-700">{t('map.placeholder')}</p>
      <button type="button" className="min-h-11 rounded border border-slate-300 px-4" onClick={() => addField(demoFields.iowa)}>
        {t('map.demo.iowa')}
      </button>
      <button type="button" className="min-h-11 rounded border border-slate-300 px-4" onClick={() => addField(demoFields.poznan)}>
        {t('map.demo.poznan')}
      </button>
      <ul aria-label={t('map.fields')}>
        {fields.map((f) => (
          <li key={f.id} className={f.id === selectedFieldId ? 'font-medium' : undefined}>
            {f.name}, {f.areaHa.toFixed(1)} ha
          </li>
        ))}
      </ul>
    </div>
  );
}
