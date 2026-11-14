// The real Leaflet + Geoman wiring in jsdom: no tiles render, but the map, layers and Geoman modes do.
import L from 'leaflet';
import { demoFields } from '../fixtures';
import { createLeafletMap, type MapController, type MapHandlers } from './leafletMap';

let container: HTMLDivElement;
let handlers: { [K in keyof MapHandlers]: ReturnType<typeof vi.fn> };
let controller: MapController;
let map: L.Map;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  handlers = {
    onClick: vi.fn(),
    onTileError: vi.fn(),
    onSelectField: vi.fn(),
    onDrawn: vi.fn(),
    onEdited: vi.fn(),
    onRemoved: vi.fn(),
  };
  const spy = vi.spyOn(L, 'map');
  controller = createLeafletMap(container, handlers as unknown as MapHandlers);
  map = spy.mock.results[0]!.value as L.Map;
  spy.mockRestore();
});

afterEach(() => {
  controller.destroy();
  container.remove();
});

const polygonsOnMap = () => {
  const found: L.Polygon[] = [];
  map.eachLayer((layer) => {
    if (layer instanceof L.Polygon) found.push(layer);
  });
  return found;
};

describe('createLeafletMap with Geoman', () => {
  it('shows only the draw polygon, edit and delete tools', () => {
    const icons = [...container.querySelectorAll('.leaflet-pm-toolbar .control-icon')]
      .filter((el) => (el.closest('.button-container') as HTMLElement | null)?.style.display !== 'none')
      .map((el) => /leaflet-pm-icon-([\w-]+)/.exec(el.className)?.[1]);
    expect(icons.sort()).toEqual(['delete', 'edit', 'polygon']);
  });

  it('reports a draw, edit or delete mode through isEditing', () => {
    expect(controller.isEditing()).toBe(false);
    map.pm.enableDraw('Polygon');
    expect(controller.isEditing()).toBe(true);
    map.pm.disableDraw();
    map.pm.enableGlobalEditMode();
    expect(controller.isEditing()).toBe(true);
    map.pm.disableGlobalEditMode();
    map.pm.enableGlobalRemovalMode();
    expect(controller.isEditing()).toBe(true);
    map.pm.disableGlobalRemovalMode();
    expect(controller.isEditing()).toBe(false);
  });

  it('hands a finished outline to onDrawn and takes the drawn layer off the map', () => {
    const drawn = L.polygon([
      [52.4, 16.9],
      [52.4, 16.91],
      [52.41, 16.91],
    ]).addTo(map);

    map.fire('pm:create', { shape: 'Polygon', layer: drawn });

    expect(handlers.onDrawn).toHaveBeenCalledWith(expect.objectContaining({ type: 'Polygon' }));
    const ring = handlers.onDrawn.mock.calls[0]![0].coordinates[0];
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    expect(map.hasLayer(drawn)).toBe(false);
  });

  it('reports an edited field outline and a removed field by id', () => {
    controller.setFields([demoFields.poznan], demoFields.poznan.id);
    const [layer] = polygonsOnMap();
    expect(layer).toBeDefined();

    layer!.fire('pm:edit', { shape: 'Polygon', layer });
    expect(handlers.onEdited).toHaveBeenCalledWith(demoFields.poznan.id, expect.objectContaining({ type: 'Polygon' }));

    layer!.fire('pm:remove', { shape: 'Polygon', layer });
    expect(handlers.onRemoved).toHaveBeenCalledWith(demoFields.poznan.id);
  });

  it('does not select a field tapped in delete mode', () => {
    controller.setFields([demoFields.poznan], null);
    const [layer] = polygonsOnMap();
    layer!.fire('click');
    expect(handlers.onSelectField).toHaveBeenCalledTimes(1);

    map.pm.enableGlobalRemovalMode();
    controller.setFields([demoFields.poznan], null);
    polygonsOnMap()[0]!.fire('click');
    expect(handlers.onSelectField).toHaveBeenCalledTimes(1);
  });

  it('turns a tap on a field into a corner of the outline being drawn, without selecting the field', () => {
    controller.setFields([demoFields.poznan], null);
    map.pm.enableDraw('Polygon');
    const field = polygonsOnMap()[0]!;
    const corner = field.getBounds().getCenter();

    field.fire('click', { latlng: corner });

    expect(handlers.onSelectField).not.toHaveBeenCalled();
    const drawing = (map.pm.Draw as unknown as { Polygon: { _layer: L.Polyline } }).Polygon._layer;
    expect(drawing.getLatLngs()).toEqual([corner]);
    map.pm.disableDraw();
  });

  it('moves the map to a found place and keeps one marker there, which a tap passes through', () => {
    const markers = () => {
      const found: L.CircleMarker[] = [];
      map.eachLayer((layer) => {
        if (layer instanceof L.CircleMarker) found.push(layer);
      });
      return found;
    };
    const { lat, lon } = demoFields.poznan.centroid;

    controller.showPlace(demoFields.iowa.centroid.lat, demoFields.iowa.centroid.lon, demoFields.iowa.name);
    controller.showPlace(lat, lon, demoFields.poznan.name);

    expect(markers()).toHaveLength(1);
    expect(markers()[0]!.getLatLng()).toEqual(L.latLng(lat, lon));
    expect(markers()[0]!.options.interactive).toBe(false);
    expect(map.getCenter().lat).toBeCloseTo(lat, 6);
    expect(map.getCenter().lng).toBeCloseTo(lon, 6);
    expect(handlers.onClick).not.toHaveBeenCalled();
  });
});
