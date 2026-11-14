// The only file that talks to Leaflet. MapStep stays testable in jsdom by mocking this module.
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Field } from '../contracts';

export interface MapHandlers {
  onClick(lat: number, lon: number): void;
  onTileError(): void;
  onSelectField(id: string): void;
}

export interface MapController {
  setFields(fields: Field[], selectedId: string | null): void;
  flyTo(field: Field): void;
  retryTiles(): void;
  destroy(): void;
}

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const START_VIEW: L.LatLngTuple = [46, -40]; // between the USA and Poland
const START_ZOOM = 2;

const toLatLngs = (field: Field): L.LatLngTuple[][] =>
  field.polygon.coordinates.map((ring) => ring.map(([lon = 0, lat = 0]) => [lat, lon] as L.LatLngTuple));

export function createLeafletMap(container: HTMLElement, handlers: MapHandlers): MapController {
  const map = L.map(container, { center: START_VIEW, zoom: START_ZOOM, worldCopyJump: true });
  const tiles = L.tileLayer(TILE_URL, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(map);
  const fieldLayer = L.layerGroup().addTo(map);

  tiles.on('tileerror', () => handlers.onTileError());
  map.on('click', (e: L.LeafletMouseEvent) => handlers.onClick(e.latlng.lat, L.Util.wrapNum(e.latlng.lng, [-180, 180], true)));

  return {
    setFields(fields, selectedId) {
      fieldLayer.clearLayers();
      for (const field of fields) {
        const selected = field.id === selectedId;
        L.polygon(toLatLngs(field), {
          color: selected ? '#047857' : '#475569',
          weight: selected ? 3 : 2,
          fillOpacity: selected ? 0.25 : 0.1,
          bubblingMouseEvents: false, // a tap on a field selects it instead of adding a new one
        })
          .on('click', () => handlers.onSelectField(field.id))
          .addTo(fieldLayer);
      }
    },
    flyTo(field) {
      const bounds = L.latLngBounds(toLatLngs(field)[0] ?? []);
      if (!bounds.isValid()) return;
      const size = map.getSize();
      // A hidden or zero-size map cannot animate; jump instead.
      if (size.x === 0 || size.y === 0) map.fitBounds(bounds, { animate: false });
      else map.flyToBounds(bounds, { padding: [24, 24], maxZoom: 17, duration: 1.2 });
    },
    retryTiles() {
      tiles.redraw();
    },
    destroy() {
      map.remove();
    },
  };
}
