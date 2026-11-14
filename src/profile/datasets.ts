// Datasets the profile module reads. Ids match src/fixtures/datasets.ts.
import type { Dataset } from '../contracts';

export const datasets: Dataset[] = [
  {
    id: 'nasa-power-monthly',
    name: 'NASA POWER monthly agroclimatology',
    provider: 'NASA Langley Research Center (LaRC)',
    url: 'https://power.larc.nasa.gov/',
    nasa: true,
    resolution: 'about 50 km',
    period: '1981–2025',
    kind: 'model',
  },
];
