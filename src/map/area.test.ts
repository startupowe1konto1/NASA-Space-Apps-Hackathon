import type { Polygon } from 'geojson';
import { demoFields } from '../fixtures';
import { areaHa } from './area';

const METRES_PER_DEGREE_LAT = 111_320;

/** Square of side `sideM` metres centred on the point, [lon, lat], counterclockwise. */
function square(lat: number, lon: number, sideM: number): Polygon {
  const halfLat = sideM / 2 / METRES_PER_DEGREE_LAT;
  const halfLon = sideM / 2 / (METRES_PER_DEGREE_LAT * Math.cos((lat * Math.PI) / 180));
  return {
    type: 'Polygon',
    coordinates: [
      [
        [lon - halfLon, lat - halfLat],
        [lon + halfLon, lat - halfLat],
        [lon + halfLon, lat + halfLat],
        [lon - halfLon, lat + halfLat],
        [lon - halfLon, lat - halfLat],
      ],
    ],
  };
}

describe('areaHa', () => {
  it('returns 1 ha for a 100 m x 100 m square at 52° N', () => {
    expect(areaHa(square(52, 17, 100))).toBeCloseTo(1, 1);
    expect(Math.abs(areaHa(square(52, 17, 100)) - 1)).toBeLessThan(0.01);
  });

  it('matches the demo fields: Iowa about 30 ha, Poznań about 8 ha', () => {
    expect(Math.abs(areaHa(demoFields.iowa.polygon) - 30) / 30).toBeLessThan(0.01);
    expect(Math.abs(areaHa(demoFields.poznan.polygon) - 8) / 8).toBeLessThan(0.01);
  });

  it('gives the same area for a clockwise ring', () => {
    const ccw = square(42, -93, 200);
    const cw: Polygon = { type: 'Polygon', coordinates: [[...ccw.coordinates[0]!].reverse()] };
    expect(areaHa(cw)).toBeCloseTo(areaHa(ccw), 6);
  });

  it('subtracts holes', () => {
    const outer = square(52, 17, 200);
    const hole = square(52, 17, 100);
    const withHole: Polygon = { type: 'Polygon', coordinates: [outer.coordinates[0]!, [...hole.coordinates[0]!].reverse()] };
    expect(Math.abs(areaHa(withHole) - 3)).toBeLessThan(0.03);
  });
});
