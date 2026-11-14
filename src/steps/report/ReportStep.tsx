// Placeholder from the skeleton (O1-S1). O2 replaces it in task O2-B7; keep the file path and the export name.
import { t } from '../../app/i18n';
import { selectedField, useAppStore } from '../../app/store';

export function ReportStep() {
  const field = useAppStore(selectedField);
  const goal = useAppStore((s) => s.goal);
  return (
    <div className="grid gap-2">
      <p className="font-medium">{t('app.support')}</p>
      <p>{t('steps.report.placeholder', { field: field?.name ?? '?', goal: t(`steps.goal.${goal}`) })}</p>
    </div>
  );
}
