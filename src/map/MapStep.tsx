// Step 2: find the field. Demo buttons, a tap on the map, a drawn outline, and the list of fields, which works even when the map does not.
import { useEffect, useRef, useState } from 'react';
import { t } from '../app/i18n';
import { useAppStore } from '../app/store';
import type { Field } from '../contracts';
import { demoFields } from '../fixtures';
import { StateBoundary } from '../ui-kit/StateBoundary';
import { FieldList } from './draw/FieldList';
import { drawnField, reshapedField } from './draw/drawnField';
import { createLeafletMap, type MapController } from './leafletMap';
import { ParcelSearch } from './parcels/ParcelSearch';
import { addFieldAt } from './parcels/tap';
import { SearchBox } from './search/SearchBox';

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
        onClick: (lat, lon) => {
          // While drawing, editing or deleting, a tap belongs to that tool, not to the quick add.
          if (mapRef.current?.isEditing()) return;
          void addFieldAt(lat, lon); // in Poland, the ULDK parcel; elsewhere a 4 ha square
        },
        onTileError: () => setTilesFailed(true),
        onSelectField: (id) => useAppStore.getState().selectField(id),
        onDrawn: (polygon) => {
          const { fields, addField } = useAppStore.getState();
          addField(drawnField(polygon, fields)); // addField also selects it
        },
        onEdited: (id, polygon) => {
          const { fields, updateField } = useAppStore.getState();
          const field = fields.find((f) => f.id === id);
          if (field) updateField(reshapedField(field, polygon));
        },
        onRemoved: (id) => useAppStore.getState().removeField(id),
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

      <SearchBox onPick={(place) => mapRef.current?.showPlace(place.lat, place.lon, place.label)} />

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
        <p className="mt-1 text-sm text-slate-600">{t('draw.hint')}</p>
      </div>

      <ParcelSearch />

      <FieldList />
    </div>
  );
}
