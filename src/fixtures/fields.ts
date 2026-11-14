// Two demo fields. Stand-ins until the map module returns real polygons.
import type { Polygon } from 'geojson';
import type { Field } from '../contracts';

const METRES_PER_DEGREE = 111_320;

/** Axis-aligned rectangle around a centre point. GeoJSON, WGS84, [lon, lat], closed ring, counterclockwise. */
function rectangle(lat: number, lon: number, widthM: number, heightM: number): Polygon {
  const halfLat = heightM / 2 / METRES_PER_DEGREE;
  const halfLon = widthM / 2 / (METRES_PER_DEGREE * Math.cos((lat * Math.PI) / 180));
  const round = (n: number) => Math.round(n * 1e6) / 1e6;
  const west = round(lon - halfLon);
  const east = round(lon + halfLon);
  const south = round(lat - halfLat);
  const north = round(lat + halfLat);
  return {
    type: 'Polygon',
    coordinates: [
      [
        [west, south],
        [east, south],
        [east, north],
        [west, north],
        [west, south],
      ],
    ],
  };
}

export const demoFields: { iowa: Field; poznan: Field } = {
  iowa: {
    id: 'demo-iowa',
    name: 'Iowa demo field',
    country: 'US',
    polygon: rectangle(42.03, -93.63, 750, 400), // 750 m x 400 m = 30 ha
    centroid: { lat: 42.03, lon: -93.63 },
    areaHa: 30,
  },
  poznan: {
    id: 'demo-poznan',
    name: 'Poznań demo field',
    country: 'PL',
    polygon: rectangle(52.45, 17.1, 400, 200), // 400 m x 200 m = 8 ha
    centroid: { lat: 52.45, lon: 17.1 },
    areaHa: 8,
    parcelIds: ['302116_5.0008.428/1'],
  },
};
