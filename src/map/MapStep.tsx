// Step 2: find the field. Demo buttons, a tap on the map, and the list of fields, which works even when the map does not.
// List entries are plain text on purpose: a button named "Iowa demo field, 30.0 ha" would clash with the demo button in e2e role queries.
import { useEffect, useRef, useState } from 'react';
import { t } from '../app/i18n';
import { useAppStore } from '../app/store';
import type { Field } from '../contracts';
import { demoFields } from '../fixtures';
import { StateBoundary } from '../ui-kit/StateBoundary';
import { createLeafletMap, type MapController } from './leafletMap';
import { pointToField } from './pointToField';

const BUTTON =
  'min-h-11 rounded-lg border border-slate-300 bg-white px-4 text-base font-medium text-slate-900 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 active:bg-slate-100';

export function MapStep() {
  const fields = useAppStore((s) => s.fields);
  const selectedFieldId = useAppStore((s) => s.selectedFieldId);
  const addField = useAppStore((s) => s.addField);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapController | null>(null);
  const [tilesFailed, setTilesFailed] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    try {
      mapRef.current = createLeafletMap(container, {
        // Read the store at call time, so the handlers never hold a stale action.
        onClick: (lat, lon) => useAppStore.getState().addField(pointToField(lat, lon)),
        onTileError: () => setTilesFailed(true),
        onSelectField: (id) => useAppStore.getState().selectField(id),
      });
    } catch {
      setMapFailed(true);
    }
    return () => {
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    mapRef.current?.setFields(fields, selectedFieldId);
  }, [fields, selectedFieldId]);

  // Fly only when the selection changes, not on every redraw of the list.
  useEffect(() => {
    const field = useAppStore.getState().fields.find((f) => f.id === selectedFieldId);
    if (field) mapRef.current?.flyTo(field);
  }, [selectedFieldId]);

  // A second tap on the same demo button does not change the selection, so fly here as well.
  const pickDemo = (field: Field) => {
    addField(field);
    mapRef.current?.flyTo(field);
  };

  const retryTiles = () => {
    setTilesFailed(false);
    mapRef.current?.retryTiles();
  };

  return (
    <div className="grid gap-4">
      <p className="text-base text-slate-700">{t('map.intro')}</p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button type="button" className={BUTTON} onClick={() => pickDemo(demoFields.iowa)}>
          {t('map.demo.iowa')}
        </button>
        <button type="button" className={BUTTON} onClick={() => pickDemo(demoFields.poznan)}>
          {t('map.demo.poznan')}
        </button>
      </div>

      {tilesFailed ? (
        <StateBoundary state="error" source={t('map.tiles.source')} reason={t('map.tiles.reason')} onRetry={retryTiles}>
          {null}
        </StateBoundary>
      ) : null}
      {mapFailed ? (
        <StateBoundary state="error" source={t('map.source')} reason={t('map.tiles.reason')}>
          {null}
        </StateBoundary>
      ) : null}

      <div>
        <div
          ref={containerRef}
          role="application"
          aria-label={t('map.label')}
          className="h-[55vh] min-h-64 w-full overflow-hidden rounded-lg border border-slate-300 bg-slate-100 md:h-[60vh]"
        />
        <p className="mt-2 text-sm text-slate-600">{t('map.hint')}</p>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">{t('map.fields')}</h2>
        {fields.length === 0 ? (
          <p className="mt-1 text-slate-700">{t('map.fields.empty')}</p>
        ) : null}
        <ul aria-label={t('map.fields')} className="mt-2 grid gap-2">
          {fields.map((f) => {
            const selected = f.id === selectedFieldId;
            return (
              <li
                key={f.id}
                aria-current={selected ? 'true' : undefined}
                className={`rounded-lg border px-4 py-3 text-base ${
                  selected ? 'border-emerald-700 bg-emerald-50 font-medium text-emerald-950' : 'border-slate-300 bg-white text-slate-900'
                }`}
              >
                {t('map.fields.item', { name: f.name, area: f.areaHa.toFixed(1) })}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
