// Datasets behind the money tables (data/money). Picked up by src/app/datasets.ts.
import type { Dataset } from '../contracts';

/** The day the numbers in data/money were copied from their sources (task O4-A4). */
export const RETRIEVED_AT = '2026-11-14';

export const datasets: Dataset[] = [
  {
    id: 'usda-nass-quickstats', name: 'USDA NASS Quick Stats: Story County yields and Iowa prices received', provider: 'USDA NASS',
    url: 'https://quickstats.nass.usda.gov/', nasa: false, resolution: 'county (yield), state (price)', period: 'yields 2021–2025, price 2025 marketing year',
    kind: 'observation',
  },
  {
    id: 'isu-agdm-a1-20', name: 'Estimated Costs of Crop Production in Iowa – 2026 (Ag Decision Maker A1-20)', provider: 'Iowa State University Extension',
    url: 'https://www.extension.iastate.edu/agdm/crops/html/a1-20.html', nasa: false, resolution: 'Iowa, typical farm budget', period: '2026',
    kind: 'model',
  },
  {
    id: 'nrcs-payment-schedule-ia', name: 'NRCS EQIP payment schedule, Iowa, Story County', provider: 'USDA NRCS',
    url: 'https://www.nrcs.usda.gov/getting-assistance/payment-schedules', nasa: false, resolution: 'county', period: 'schedule served on 14 Nov 2026, fiscal year not stated',
    kind: 'observation',
  },
  {
    id: 'eurostat-apro-cpnhr', name: 'Eurostat crop production by NUTS 2 region (apro_cpnhr), Wielkopolskie', provider: 'Eurostat',
    url: 'https://ec.europa.eu/eurostat/databrowser/view/apro_cpnhr/default/table', nasa: false, resolution: 'NUTS 2 region (PL41)', period: '2020–2024',
    kind: 'observation',
  },
  {
    id: 'eurostat-apri-ap-crpouta', name: 'Eurostat selling prices of crop products (apri_ap_crpouta), Poland', provider: 'Eurostat',
    url: 'https://ec.europa.eu/eurostat/databrowser/view/apri_ap_crpouta/default/table', nasa: false, resolution: 'country', period: '2024',
    kind: 'observation',
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
    id: 'pl-dziennik-ustaw', name: 'Dziennik Ustaw: eco-scheme rates and conditions, GAEC norms', provider: 'Polish Ministry of Agriculture (via Sejm ELI)',
    url: 'https://api.sejm.gov.pl/eli/acts/DU', nasa: false, resolution: 'Poland', period: '2025 rates; rules in force in 2026',
    kind: 'observation',
  },
];

/** Which dataset a source URL in data/money belongs to. */
const SOURCE_PREFIXES: { prefix: string; id: string }[] = [
  { prefix: 'https://quickstats.nass.usda.gov/', id: 'usda-nass-quickstats' },
  { prefix: 'https://www.extension.iastate.edu/agdm/', id: 'isu-agdm-a1-20' },
  { prefix: 'https://www.nrcs.usda.gov/getting-assistance/payment-schedules', id: 'nrcs-payment-schedule-ia' },
  { prefix: 'https://ec.europa.eu/eurostat/databrowser/view/apro_cpnhr/', id: 'eurostat-apro-cpnhr' },
  { prefix: 'https://ec.europa.eu/eurostat/databrowser/view/apri_ap_crpouta/', id: 'eurostat-apri-ap-crpouta' },
  { prefix: 'https://stat.gov.pl/', id: 'gus-ceny-produktow-rolnych' },
  { prefix: 'https://www.wodr.poznan.pl/', id: 'wodr-poznan-kalkulacje' },
  { prefix: 'https://api.sejm.gov.pl/eli/acts/DU/', id: 'pl-dziennik-ustaw' },
];

export function datasetIdForSource(url: string): string | undefined {
  return SOURCE_PREFIXES.find((s) => url.startsWith(s.prefix))?.id;
}
