// Placeholder from the skeleton (O1-S1). O2 replaces it in task O2-B2; keep the file path and the export name.
import { useEffect, useState } from 'react';
import { t } from '../../app/i18n';
import { providers } from '../../app/providers';
import { selectedField, useAppStore } from '../../app/store';
import type { AsyncResult, CropYear } from '../../contracts';

export function CropsStep() {
  const field = useAppStore(selectedField);
  const history = useAppStore((s) => (field ? s.cropHistory[field.id] : undefined));
  const setCropHistory = useAppStore((s) => s.setCropHistory);
  const [proposed, setProposed] = useState<AsyncResult<CropYear[]>>({ status: 'not-loaded' });

  useEffect(() => {
    if (!field) return;
    let cancelled = false;
    providers.context.getCropHistory(field).then((result) => {
      if (!cancelled) setProposed(result);
    });
    return () => {
      cancelled = true;
    };
  }, [field]);

  if (!field) return <p>{t('steps.crops.noField')}</p>;

  const fallback: CropYear[] = [
    { year: 2025, crop: 'winter-wheat', source: 'farmer' },
    { year: 2024, crop: 'winter-rapeseed', source: 'farmer' },
    { year: 2023, crop: 'winter-wheat', source: 'farmer' },
  ];
  const offer = proposed.status === 'ready' ? proposed.data : fallback;

  return (
    <div className="grid gap-3">
      <p className="text-slate-700">
        {proposed.status === 'ready' ? t('steps.crops.proposed') : t('steps.crops.placeholder')}
      </p>
      <ul>
        {offer.map((y) => (
          <li key={y.year}>
            {y.year}: {y.crop}
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="min-h-11 rounded border border-slate-300 px-4"
        onClick={() => setCropHistory(field.id, offer)}
      >
        {t('steps.crops.confirm')}
      </button>
      {history && history.length > 0 ? <p role="status">{t('steps.crops.saved', { n: history.length })}</p> : null}
    </div>
  );
}
