// The only file that talks to Leaflet. MapStep stays testable in jsdom by mocking this module.
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import './draw/draw.css';
import type { Polygon } from 'geojson';
import type { Field } from '../contracts';

export interface MapHandlers {
  onClick(lat: number, lon: number): void;
  onTileError(): void;
  onSelectField(id: string): void;
  /** A new outline finished in draw mode. The drawn layer is already gone; the field comes back through setFields. */
  onDrawn(polygon: Polygon): void;
  /** A field's outline changed in edit mode. */
  onEdited(id: string, polygon: Polygon): void;
  /** A field was tapped in delete mode. */
  onRemoved(id: string): void;
}

export interface MapController {
  setFields(fields: Field[], selectedId: string | null): void;
  flyTo(field: Field): void;
  retryTiles(): void;
  destroy(): void;
  /** True while a Geoman draw, edit or delete mode is on, so a map tap must not add a point field. */
  isEditing(): boolean;
  /** Moves the map to a place found by the address search and marks it. One marker at a time. */
  showPlace(lat: number, lon: number, label: string): void;
}

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const START_VIEW: L.LatLngTuple = [46, -40]; // between the USA and Poland
const START_ZOOM = 2;
const PLACE_ZOOM = 16; // close enough to see field edges and tap the right one

const toLatLngs = (field: Field): L.LatLngTuple[][] =>
  field.polygon.coordinates.map((ring) => ring.map(([lon = 0, lat = 0]) => [lat, lon] as L.LatLngTuple));

/** GeoJSON outline of a Leaflet polygon ([lon, lat], closed rings), or null for any other shape. */
function polygonOf(layer: L.Layer): Polygon | null {
  if (!(layer instanceof L.Polygon)) return null;
  const geometry = layer.toGeoJSON(7).geometry;
  return geometry.type === 'Polygon' ? geometry : null;
}

// Only the three tools a farmer needs: outline, move corners, delete. Everything else is off.
const TOOLBAR: L.PM.ToolbarOptions = {
  position: 'topleft',
  drawPolygon: true,
  editMode: true,
  removalMode: true,
  drawMarker: false,
  drawCircleMarker: false,
  drawPolyline: false,
  drawRectangle: false,
  drawCircle: false,
  drawText: false,
  dragMode: false,
  cutPolygon: false,
  rotateMode: false,
};

export function createLeafletMap(container: HTMLElement, handlers: MapHandlers): MapController {
  const map = L.map(container, { center: START_VIEW, zoom: START_ZOOM, worldCopyJump: true });
  const tiles = L.tileLayer(TILE_URL, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(map);
  const fieldLayer = L.layerGroup().addTo(map);
  const placeLayer = L.layerGroup().addTo(map);

  tiles.on('tileerror', () => handlers.onTileError());

  map.pm.addControls(TOOLBAR);
  // Geoman keeps the finished shape on the map. Drop it: the store owns fields and setFields draws them.
  map.on('pm:create', (e) => {
    const polygon = polygonOf(e.layer);
    e.layer.remove();
    if (polygon) handlers.onDrawn(polygon);
  });
  const isEditing = () =>
    map.pm.globalDrawModeEnabled() || map.pm.globalEditModeEnabled() || map.pm.globalRemovalModeEnabled();
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
          .on('click', (e: L.LeafletMouseEvent) => {
            // While drawing, a tap on a field is a corner of the new outline. The field stops the click from reaching
            // the map, so hand it on: Geoman adds the corner there. Selecting the field would fly the map away mid-draw.
            if (map.pm.globalDrawModeEnabled()) {
              map.fire('click', e);
              return;
            }
            // In delete mode the same tap removes the field; selecting it first would only flicker.
            if (!map.pm.globalRemovalModeEnabled()) handlers.onSelectField(field.id);
          })
          .on('pm:edit', (e) => {
            const polygon = polygonOf(e.layer);
            if (polygon) handlers.onEdited(field.id, polygon);
          })
          .on('pm:remove', () => handlers.onRemoved(field.id))
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
    isEditing,
    showPlace(lat, lon, label) {
      placeLayer.clearLayers();
      // Not interactive: a tap on the marker still reaches the map, so it adds a field or a corner there.
      L.circleMarker([lat, lon], { radius: 9, color: '#b45309', weight: 3, fillColor: '#fbbf24', fillOpacity: 0.9, interactive: false })
        .bindTooltip(label, { permanent: false, direction: 'top' })
        .addTo(placeLayer);
      const size = map.getSize();
      if (size.x === 0 || size.y === 0) map.setView([lat, lon], PLACE_ZOOM, { animate: false });
      else map.flyTo([lat, lon], PLACE_ZOOM, { duration: 1.2 });
    },
  };
}
