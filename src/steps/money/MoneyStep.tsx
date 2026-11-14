// Placeholder from the skeleton (O1-S1). O2 replaces it in task O2-B6; keep the file path and the export name.
import { t } from '../../app/i18n';
import { StateBoundary } from '../../ui-kit';

export function MoneyStep() {
  return (
    <StateBoundary state="no-data" reason={t('steps.money.notLoaded')}>
      {null}
    </StateBoundary>
  );
}
