// Datasets behind the money tables (data/money). Picked up by src/app/datasets.ts.
import type { Dataset } from '../contracts';

/** The day the numbers in data/money were copied from their sources (task O4-A4). */
export const RETRIEVED_AT = '2026-11-14';

export const datasets: Dataset[] = [
  {
    id: 'usda-nass-quickstats', name: 'USDA NASS Quick Stats: Story County and Iowa yields, Iowa prices received', provider: 'USDA NASS',
    url: 'https://quickstats.nass.usda.gov/', nasa: false,
    resolution: 'county (maize and soybean yields), state (oat and alfalfa yields, prices)', period: 'yields 2021–2025, prices 2025 marketing year',
    kind: 'observation',
  },
  {
    id: 'isu-agdm-a1-20', name: 'Estimated Costs of Crop Production in Iowa – 2026 (Ag Decision Maker A1-20)', provider: 'Iowa State University Extension',
    url: 'https://www.extension.iastate.edu/agdm/crops/html/a1-20.html', nasa: false, resolution: 'Iowa, typical farm budget', period: '2026',
    kind: 'model',
  },
  {
    id: 'nrcs-ia-fy2026-booklet', name: 'Iowa Financial Assistance Program Scenario Booklet FY2026 (practices 340 and 328)', provider: 'USDA NRCS Iowa',
    url: 'https://www.nrcs.usda.gov/sites/default/files/2026-04/FY26%20FA%20Program%20Scenario%20Booklet_April%2028%202026.pdf', nasa: false,
    resolution: 'Iowa', period: 'fiscal year 2026 (Oct 2025 to Sep 2026), booklet of 28 Apr 2026',
    kind: 'observation',
  },
  {
    id: 'gus-produkcja-upraw', name: 'GUS crop production (Produkcja upraw rolnych i ogrodniczych), Wielkopolskie yields', provider: 'Statistics Poland (GUS)',
    url: 'https://stat.gov.pl/obszary-tematyczne/rolnictwo-lesnictwo/uprawy-rolne-i-ogrodnicze/', nasa: false, resolution: 'voivodeship (Wielkopolskie)',
    period: '2021–2025 (field pea 2023–2025)', kind: 'observation',
  },
  {
    id: 'mrirw-zsrir', name: 'ZSRIR weekly grain and oilseed purchase prices', provider: 'Polish Ministry of Agriculture (MRiRW)',
    url: 'https://zsrir.minrol.gov.pl/', nasa: false, resolution: 'north-west macroregion (grain), Poland (rapeseed)', period: 'week 45/2026 (2–8 Nov 2026)',
    kind: 'observation',
  },
  {
    id: 'gus-skup-i-ceny-2025', name: 'GUS procurement prices of agricultural products in 2025', provider: 'Statistics Poland (GUS)',
    url: 'https://publikacje.new.stat.gov.pl/portal-publikacje/skup-i-ceny-produktow-rolnych-w-2025-r', nasa: false,
    resolution: 'voivodeship (sugar beet), Poland (field pea)', period: '2025 yearly average', kind: 'observation',
  },
  {
    id: 'gus-ceny-produktow-rolnych', name: 'GUS agricultural product prices, September 2026', provider: 'Statistics Poland (GUS)',
    url: 'https://stat.gov.pl/obszary-tematyczne/ceny-handel/ceny/', nasa: false, resolution: 'voivodeship', period: 'September 2026',
    kind: 'observation',
  },
  {
    id: 'wodr-poznan-kalkulacje', name: 'WODR Poznań crop budgets (kalkulacje rolnicze), February 2026', provider: 'Wielkopolski Ośrodek Doradztwa Rolniczego',
    url: 'https://www.wodr.poznan.pl/doradztwo/ekonomika', nasa: false, resolution: 'Wielkopolska, model farm budget', period: '2026',
    kind: 'model',
  },
  {
    id: 'pl-eco-scheme-2026', name: 'Estimated 2026 eco-scheme rates (MRiRW) and 2026 practice pages (ARiMR)', provider: 'Polish Ministry of Agriculture and ARiMR',
    url: 'https://www.gov.pl/web/rolnictwo/zaliczki-doplat-dla-rolnikow-juz-od-8-wrzesnia', nasa: false, resolution: 'Poland',
    period: '2026 estimates for advance payments (19 Aug 2026)', kind: 'observation',
  },
  {
    id: 'pl-dziennik-ustaw', name: 'Dziennik Ustaw: eco-scheme rates and conditions, GAEC norms', provider: 'Polish Ministry of Agriculture (via Sejm ELI)',
    url: 'https://api.sejm.gov.pl/eli/acts/DU', nasa: false, resolution: 'Poland', period: '2025 rates; rules in force in 2026',
    kind: 'observation',
  },
];

/** Which dataset a source URL in data/money belongs to. The first matching prefix wins, so specific prefixes come first. */
const SOURCE_PREFIXES: { prefix: string; id: string }[] = [
  { prefix: 'https://quickstats.nass.usda.gov/', id: 'usda-nass-quickstats' },
  { prefix: 'https://www.extension.iastate.edu/agdm/', id: 'isu-agdm-a1-20' },
  { prefix: 'https://www.nrcs.usda.gov/sites/default/files/2026-04/FY26%20FA%20Program%20Scenario%20Booklet', id: 'nrcs-ia-fy2026-booklet' },
  { prefix: 'https://stat.gov.pl/obszary-tematyczne/rolnictwo-lesnictwo/uprawy-rolne-i-ogrodnicze/', id: 'gus-produkcja-upraw' },
  { prefix: 'https://stat.gov.pl/', id: 'gus-ceny-produktow-rolnych' },
  { prefix: 'https://zsrir.minrol.gov.pl/', id: 'mrirw-zsrir' },
  { prefix: 'https://publikacje.new.stat.gov.pl/', id: 'gus-skup-i-ceny-2025' },
  { prefix: 'https://www.wodr.poznan.pl/', id: 'wodr-poznan-kalkulacje' },
  { prefix: 'https://www.gov.pl/web/rolnictwo/', id: 'pl-eco-scheme-2026' },
  { prefix: 'https://www.gov.pl/web/arimr/', id: 'pl-eco-scheme-2026' },
  { prefix: 'https://api.sejm.gov.pl/eli/acts/DU/', id: 'pl-dziennik-ustaw' },
];

export function datasetIdForSource(url: string): string | undefined {
  return SOURCE_PREFIXES.find((s) => url.startsWith(s.prefix))?.id;
}
