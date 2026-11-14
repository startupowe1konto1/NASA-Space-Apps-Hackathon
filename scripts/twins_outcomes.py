"""Outcomes of the field-twins case base: what each region grows (crop shares) and how much (mean yields).

Run from the repo root:  python -I scripts/twins_outcomes.py           (fills `outcome` in data/twins/cases.json;
                                                                        run scripts/twins_regions.py and
                                                                        scripts/twins_features.py first)
                         python -I scripts/twins_outcomes.py --check   (parses the saved samples only, no network)

Only the `outcome` (or `outcomeMissingReason`) of each region, `meta`, `outcomeSources` and `outcomeCrops` change;
the climate features from scripts/twins_features.py are left as they are.

US counties (Iowa, Illinois, Nebraska, Minnesota, Indiana): USDA NASS Quick Stats, program SURVEY, county level,
  statistic AREA HARVESTED and YIELD, years 2019-2023. No API key: the script asks the Quick Stats web form for a
  query id (POST /uuid/encode, the call the web page makes) and downloads the CSV export of that query
  (/data/spreadsheet/<id>.csv), one request pair per state. Rows for "OTHER (COMBINED) COUNTIES" are district
  totals of counties NASS does not publish one by one; they are skipped, so such a county has no value for that
  crop and year. Data items used:
    CORN, GRAIN                 maize         BU / ACRE, 56 lb per bushel
    SOYBEANS                    soybean       BU / ACRE, 60 lb per bushel
    OATS                        oats          BU / ACRE, 32 lb per bushel
    WHEAT, WINTER               winter-wheat  BU / ACRE, 60 lb per bushel
    WHEAT, SPRING, (EXCL DURUM) spring-wheat  BU / ACRE, 60 lb per bushel (Minnesota grows spring wheat, not winter)
    HAY, ALFALFA                alfalfa       TONS / ACRE, short tons (2000 lb)
  1 lb = 0.45359237 kg, 1 short ton = 0.90718474 t, 1 acre = 0.40468564224 ha. NASS survey yields are
  observations (kind "observation"); the t/ha conversion is ours.

EU NUTS 2 regions (Poland, Germany, Czechia, France): Eurostat apro_cpnhr (crop production in national humidity by
  NUTS 2 region) through the dissemination API, AR_THS_HA (area, thousand ha) and HPRD_THS_T (harvested production,
  thousand t), years 2019-2023, one request per country. Yield = production / area for each year, then the mean of
  those years (our calculation, kind "derived"). Germany reports these crops to Eurostat for its 16 Lander (NUTS 1)
  only, so a German NUTS 2 region gets the figures of its Land, and the outcome says so in `outcomeRegion`.
  Crop codes used:
    C1111 common winter wheat and spelt  winter-wheat     C1300 barley (winter and spring)   barley
    C1500 grain maize and corn-cob-mix   maize            C1200 rye and maslin               rye
    I1111 winter rape and turnip rape    rapeseed         C1410 oats                         oats
    R2000 sugar beet                     sugar-beet       R1000 potatoes (incl. seed)        potato
    P1100 field peas                     field-pea
  Where C1111 or I1111 has no area for a region (Czechia), C1110 common wheat and spelt or I1110 rape and turnip rape
  (winter and spring together) stands in, and the crop row carries a `note` saying so.
  (C1200 is rye with winter cereal mixtures, because the rye-only code C1210 is empty at regional level.)

For both: sharePct = the crop's mean harvested area over the years with an area value, as a percent of the sum of
those means for the crops listed above in that region (not of all farmland). yieldTPerHa = the mean of the yearly
yields; nYears counts the years with a yield, nAreaYears the years with an area. A crop with no area value in any
year is left out; a crop with area but no yield keeps its share with yieldTPerHa null and yieldMissingReason.
A region with no crop at all gets outcome null and outcomeMissingReason.

Downloads are cached in $TWINS_CACHE (default: <system temp>/fieldshift-twins-cache), outside the repo.
"""
import csv
import datetime
import io
import json
import os
import sys
import tempfile
import time
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from twins_features import dump_cases, write_text  # noqa: E402  same compact one-region-per-line layout

CASES = 'data/twins/cases.json'
CACHE = os.environ.get('TWINS_CACHE') or os.path.join(tempfile.gettempdir(), 'fieldshift-twins-cache')
SAMPLE_NASS = 'data/samples/twins/nass_quickstats_ia_county_excerpt.csv'
SAMPLE_EUROSTAT = 'data/samples/twins/eurostat_apro_cpnhr_pl41_de1_frb0_cz03.json'

YEARS = list(range(2019, 2024))
YEARS_LABEL = f'{YEARS[0]}–{YEARS[-1]}'

NASS_HOST = 'https://quickstats.nass.usda.gov'
NASS_STATES = ['IA', 'IL', 'NE', 'MN', 'IN']
STATE_BY_FIPS = {'19': 'IA', '17': 'IL', '31': 'NE', '27': 'MN', '18': 'IN'}
NASS_COMMODITIES = ['CORN', 'SOYBEANS', 'OATS', 'WHEAT', 'HAY']
LB = 0.45359237 / 1000  # t per lb
ACRE_HA = 0.40468564224
SHORT_TON = 0.90718474  # t
# data item prefix -> (crop id, t per yield unit); the yield unit is per acre
NASS_ITEMS = {
    'CORN, GRAIN': ('maize', 56 * LB),
    'SOYBEANS': ('soybean', 60 * LB),
    'OATS': ('oats', 32 * LB),
    'WHEAT, WINTER': ('winter-wheat', 60 * LB),
    'WHEAT, SPRING, (EXCL DURUM)': ('spring-wheat', 60 * LB),
    'HAY, ALFALFA': ('alfalfa', SHORT_TON),
}
NASS_YIELD_UNIT = {'maize': 'BU / ACRE', 'soybean': 'BU / ACRE', 'oats': 'BU / ACRE', 'winter-wheat': 'BU / ACRE',
                   'spring-wheat': 'BU / ACRE', 'alfalfa': 'TONS / ACRE'}

EUROSTAT_URL = 'https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/apro_cpnhr'
EUROSTAT_COUNTRIES = ['PL', 'DE', 'CZ', 'FR']
EUROSTAT_NUTS1_ONLY = {'DE'}  # countries whose crop rows in apro_cpnhr are at NUTS 1
EUROSTAT_CROPS = {
    'C1111': 'winter-wheat', 'C1500': 'maize', 'I1111': 'rapeseed', 'C1200': 'rye', 'C1300': 'barley',
    'R2000': 'sugar-beet', 'R1000': 'potato', 'P1100': 'field-pea', 'C1410': 'oats',
}
# used only for a region where the winter-only code has no area in any year (Czechia reports only these)
EUROSTAT_FALLBACK = {
    'C1110': ('winter-wheat', 'C1111', 'Eurostat C1110 common wheat and spelt, winter and spring together; the '
                                       'winter-only code C1111 is empty for this region'),
    'I1110': ('rapeseed', 'I1111', 'Eurostat I1110 rape and turnip rape, winter and spring together; the '
                                   'winter-only code I1111 is empty for this region'),
}

SOURCES = {
    'usda-nass-quickstats': {
        'id': 'usda-nass-quickstats',
        'title': f'USDA NASS Quick Stats, SURVEY, county level, AREA HARVESTED and YIELD, {YEARS_LABEL}',
        'url': 'https://quickstats.nass.usda.gov/',
        'kind': 'observation',
        'note': 'Yields converted from bu/acre (56, 60, 32 and 60 lb per bushel for maize, soybean, oats and '
                'wheat) and short tons/acre (alfalfa hay) to t/ha by scripts/twins_outcomes.py.',
    },
    'eurostat-apro-cpnhr': {
        'id': 'eurostat-apro-cpnhr',
        'title': f'Eurostat apro_cpnhr, crop production in national humidity by NUTS 2 region, area and '
                 f'harvested production, {YEARS_LABEL}',
        'url': 'https://ec.europa.eu/eurostat/databrowser/view/apro_cpnhr/default/table',
        'kind': 'derived',
        'note': 'Yield = harvested production / area for each year, then the mean (our calculation). Germany: '
                'figures of the NUTS 1 Land.',
    },
}


def request(url, data=None, attempts=4, timeout=180):
    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url, data=data, headers={'User-Agent': 'fieldshift-twins/1.0'})
            with urllib.request.urlopen(req, timeout=timeout) as response:
                return response.read().decode('utf-8')
        except Exception:
            if attempt == attempts - 1:
                raise
            time.sleep(2 ** attempt)


def cached(name, fetch):
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, name)
    if os.path.exists(path):
        return io.open(path, encoding='utf-8').read(), False
    text = fetch()
    with io.open(path, 'w', encoding='utf-8', newline='') as f:
        f.write(text)
    time.sleep(1)
    return text, True


# ---------- USDA NASS Quick Stats ----------

def nass_query(state):
    fields = [('source_desc', 'SURVEY'), ('agg_level_desc', 'COUNTY'), ('state_alpha', state),
              ('freq_desc', 'ANNUAL'), ('reference_period_desc', 'YEAR')]
    fields += [('commodity_desc', c) for c in NASS_COMMODITIES]
    fields += [('statisticcat_desc', s) for s in ('AREA HARVESTED', 'YIELD')]
    fields += [('year', str(y)) for y in YEARS]
    return urllib.parse.urlencode(fields)


def fetch_nass(state):
    def get():
        query_id = json.loads(request(NASS_HOST + '/uuid/encode', data=nass_query(state).encode()))
        text = request(f'{NASS_HOST}/data/spreadsheet/{query_id}.csv')
        if not text.startswith('"Program"'):
            raise ValueError(f'Quick Stats export for {state} is not a CSV: {text[:120]!r}')
        return text
    return cached(f'nass_county_{state}_{YEARS[0]}-{YEARS[-1]}.csv', get)


def nass_number(text):
    text = text.replace(',', '').strip()
    try:
        return float(text)
    except ValueError:  # (D) withheld, (Z) less than half a unit, (NA)
        return None


def parse_nass_csv(text):
    """CSV export -> {fips: {crop: {year: {'areaHa': x, 'yieldTPerHa': y}}}} for the data items in NASS_ITEMS."""
    out = {}
    for row in csv.DictReader(io.StringIO(text)):
        if row['Program'] != 'SURVEY' or row['Period'] != 'YEAR' or row['Geo Level'] != 'COUNTY':
            continue
        if not row['County ANSI'].strip():  # OTHER (COMBINED) COUNTIES: a district remainder, not one county
            continue
        item, _, stat = row['Data Item'].partition(' - ')
        if item not in NASS_ITEMS:
            continue
        crop, t_per_unit = NASS_ITEMS[item]
        if stat == 'ACRES HARVESTED':
            key, factor = 'areaHa', ACRE_HA
        elif stat == f'YIELD, MEASURED IN {NASS_YIELD_UNIT[crop]}':
            key, factor = 'yieldTPerHa', t_per_unit / ACRE_HA
        else:
            continue
        value = nass_number(row['Value'])
        year = int(row['Year'])
        if value is None or year not in YEARS:
            continue
        fips = row['State ANSI'].zfill(2) + row['County ANSI'].zfill(3)
        out.setdefault(fips, {}).setdefault(crop, {}).setdefault(year, {})[key] = value * factor
    return out


# ---------- Eurostat apro_cpnhr ----------

def eurostat_url(geos):
    fields = [('format', 'JSON'), ('lang', 'EN'), ('strucpro', 'AR_THS_HA'), ('strucpro', 'HPRD_THS_T')]
    fields += [('crops', c) for c in list(EUROSTAT_CROPS) + list(EUROSTAT_FALLBACK)]
    fields += [('geo', g) for g in geos]
    fields += [('time', str(y)) for y in YEARS]
    return EUROSTAT_URL + '?' + urllib.parse.urlencode(fields)


def fetch_eurostat(country, geos):
    return cached(f'eurostat_apro_cpnhr_{country}_{YEARS[0]}-{YEARS[-1]}.json', lambda: request(eurostat_url(geos)))


def parse_eurostat(text):
    """JSON-stat 2.0 -> ({geo: {eurostat crop code: {year: {'areaHa': x, 'prodT': y}}}}, {geo: label})."""
    d = json.loads(text)
    ids, sizes = d['id'], d['size']
    cats = [d['dimension'][i]['category']['index'] for i in ids]
    keys = [sorted(c, key=c.get) for c in cats]  # position -> code, per dimension
    out = {}
    for flat, value in d.get('value', {}).items():
        flat, pos = int(flat), {}
        for i in reversed(range(len(ids))):
            pos[ids[i]] = keys[i][flat % sizes[i]]
            flat //= sizes[i]
        crop = pos['crops']  # mapped to crop ids by eurostat_region_crops
        if crop not in EUROSTAT_CROPS and crop not in EUROSTAT_FALLBACK or value is None:
            continue
        key, factor = {'AR_THS_HA': ('areaHa', 1000), 'HPRD_THS_T': ('prodT', 1000)}[pos['strucpro']]
        out.setdefault(pos['geo'], {}).setdefault(crop, {}).setdefault(int(pos['time']), {})[key] = value * factor
    labels = d['dimension']['geo']['category'].get('label', {})
    return out, labels


def has_area(by_year):
    return any(v.get('areaHa', 0) > 0 for v in by_year.values())


def eurostat_region_crops(by_code):
    """{eurostat code: {year: ...}} -> ({crop id: {year: {areaHa, yieldTPerHa?}}}, {crop id: note})."""
    crops, notes = {}, {}
    for code, crop in EUROSTAT_CROPS.items():
        if code in by_code:
            crops[crop] = eurostat_years(by_code[code])
    for code, (crop, winter_code, note) in EUROSTAT_FALLBACK.items():
        if code in by_code and not has_area(by_code.get(winter_code, {})) and has_area(by_code[code]):
            crops[crop], notes[crop] = eurostat_years(by_code[code]), note
    return crops, notes


def eurostat_years(by_year):
    """{year: {areaHa, prodT}} -> {year: {areaHa, yieldTPerHa?}}: yield = production / area (our calculation)."""
    out = {}
    for year, v in by_year.items():
        row = {}
        if 'areaHa' in v:
            row['areaHa'] = v['areaHa']
            if v['areaHa'] > 0 and v.get('prodT') is not None:
                row['yieldTPerHa'] = v['prodT'] / v['areaHa']
        out[year] = row
    return out


# ---------- outcome of one region ----------

def outcome(crops, source, kind, notes=None):
    """{crop: {year: {areaHa?, yieldTPerHa?}}} -> outcome dict, or None when no crop has a positive area."""
    means = {}
    for crop, by_year in crops.items():
        areas = [v['areaHa'] for v in by_year.values() if 'areaHa' in v]
        if not areas or sum(areas) <= 0:
            continue
        yields = [v['yieldTPerHa'] for v in by_year.values() if v.get('yieldTPerHa') is not None]
        means[crop] = (sum(areas) / len(areas), yields, len(areas))
    total = sum(m[0] for m in means.values())
    if total <= 0:
        return None
    result = {}
    for crop, (area, yields, n_area) in sorted(means.items(), key=lambda kv: -kv[1][0]):
        row = {'sharePct': round(100 * area / total, 2),
               'yieldTPerHa': round(sum(yields) / len(yields), 2) if yields else None,
               'nYears': len(yields), 'nAreaYears': n_area}
        if not yields:
            row['yieldMissingReason'] = f'{source} has a harvested area but no yield or production for this ' \
                                        f'crop and region in {YEARS_LABEL}'
        if notes and crop in notes:
            row['note'] = notes[crop]
        result[crop] = row
    return {'years': YEARS_LABEL, 'source': source, 'kind': kind, 'areaHa': round(total), 'crops': result}


def main():
    cases = json.loads(io.open(CASES, encoding='utf-8').read())
    regions = cases['regions']
    live = 0

    us = {}
    nass_failed = {}
    for state in NASS_STATES:
        try:
            text, was_live = fetch_nass(state)
            live += was_live
            us.update(parse_nass_csv(text))
        except Exception as error:
            nass_failed[state] = f'Quick Stats request failed: {error}'[:200]

    eu, eu_labels, eu_failed = {}, {}, {}
    for country in EUROSTAT_COUNTRIES:
        geos = sorted({r['code'] for r in regions if r['unit'] == 'nuts2' and r['iso2'] == country})
        if country in EUROSTAT_NUTS1_ONLY:
            geos = sorted({g[:3] for g in geos}) + geos
        try:
            text, was_live = fetch_eurostat(country, geos)
            live += was_live
            data, labels = parse_eurostat(text)
            eu.update(data)
            eu_labels.update(labels)
        except Exception as error:
            eu_failed[country] = f'Eurostat request failed: {error}'[:200]

    for r in regions:
        r.pop('outcomeMissingReason', None)
        if r['unit'] == 'county':
            state = STATE_BY_FIPS.get(r['code'][:2])
            if state in nass_failed:
                r['outcome'], r['outcomeMissingReason'] = None, nass_failed[state]
                continue
            o = outcome(us.get(r['code'], {}), 'usda-nass-quickstats', 'observation')
            reason = (f'NASS Quick Stats publishes no county survey area for maize, soybean, oats, wheat or alfalfa '
                      f'here in {YEARS_LABEL} (the county is inside "other counties" or has none of these crops)')
        else:
            country = r['iso2']
            if country in eu_failed:
                r['outcome'], r['outcomeMissingReason'] = None, eu_failed[country]
                continue
            geo = r['code'][:3] if country in EUROSTAT_NUTS1_ONLY else r['code']
            crops, notes = eurostat_region_crops(eu.get(geo, {}))
            o = outcome(crops, 'eurostat-apro-cpnhr', 'derived', notes)
            if o is not None and geo != r['code']:
                o['outcomeRegion'] = {'code': geo, 'name': eu_labels.get(geo, geo), 'level': 'nuts1',
                                      'note': 'Eurostat apro_cpnhr has these crops for Germany by Land (NUTS 1) only'}
            reason = f'Eurostat apro_cpnhr has no area for the listed crops in {geo} for {YEARS_LABEL}'
        r['outcome'] = o
        if o is None:
            r['outcomeMissingReason'] = reason

    with_outcome = [r for r in regions if r['outcome']]
    by_country = {}
    for r in with_outcome:
        by_country[r['iso2']] = by_country.get(r['iso2'], 0) + 1
    cases['meta'] = {
        'retrievedAt': datetime.datetime.now(datetime.timezone.utc).date().isoformat(),
        'script': 'scripts/twins_features.py, scripts/twins_outcomes.py',
        'sourceUrl': cases['meta']['sourceUrl'],
    }
    cases['outcomeSources'] = list(SOURCES.values())
    cases['outcomeCrops'] = {
        'usda-nass-quickstats': {item: crop for item, (crop, _) in NASS_ITEMS.items()},
        'eurostat-apro-cpnhr': {**EUROSTAT_CROPS, **{c: f[0] for c, f in EUROSTAT_FALLBACK.items()}},
    }
    cases['regionsWithOutcome'] = len(with_outcome)
    cases['regionsWithOutcomeByCountry'] = by_country
    write_text(CASES, dump_cases(cases))
    print(f'{live} live requests; wrote {CASES}: {len(with_outcome)}/{len(regions)} regions with an outcome',
          by_country, 'failed:', nass_failed or eu_failed or 'none')


def self_check():
    us = parse_nass_csv(io.open(SAMPLE_NASS, encoding='utf-8').read())
    assert set(us) == {'19169'}, us.keys()  # OTHER COUNTIES rows skipped, corn silage ignored
    story = us['19169']
    assert set(story) == {'maize', 'soybean', 'oats'}, story.keys()
    o = outcome(story, 'usda-nass-quickstats', 'observation')
    # Story County, IA, corn for grain 2019-2023: 189.3, 148.4, 201.2, 207.1, 211.4 bu/acre at 56 lb per bushel
    corn_t = (189.3 + 148.4 + 201.2 + 207.1 + 211.4) / 5 * 56 * 0.45359237 / 1000 / 0.40468564224
    assert o['crops']['maize']['yieldTPerHa'] == round(corn_t, 2) == 12.02, o['crops']['maize']
    assert o['crops']['maize']['nYears'] == 5 and o['crops']['oats']['nYears'] == 1, o
    # soybean 50, 52.2, 63.6, 60, 64.1 bu/acre at 60 lb; oats 2023 only, 106.3 bu/acre at 32 lb
    assert o['crops']['soybean']['yieldTPerHa'] == 3.90 and o['crops']['oats']['yieldTPerHa'] == 3.81, o
    # acres harvested, corn 166,700 152,200 140,000 156,100 150,600 (mean 153,120); soybean 103,300 104,100
    # 127,000 110,700 117,200 (mean 112,460); oats 320 in 2023 only
    assert o['crops']['maize']['sharePct'] == round(100 * 153120 / (153120 + 112460 + 320), 2) == 57.59, o
    assert o['crops']['soybean']['sharePct'] == 42.29 and o['crops']['oats']['sharePct'] == 0.12, o
    assert o['areaHa'] == round(265900 * 0.40468564224) == 107606, o
    assert list(o['crops']) == ['maize', 'soybean', 'oats'], o  # largest share first

    eu, labels = parse_eurostat(io.open(SAMPLE_EUROSTAT, encoding='utf-8').read())
    assert labels['DE1'] == 'Baden-W\u00fcrttemberg', labels
    pl, notes = eurostat_region_crops(eu['PL41'])
    assert notes == {}, notes  # PL41 has C1111 and I1111, so C1110 and I1110 are not used
    assert 'field-pea' not in pl, pl.keys()  # Eurostat has no field pea for PL41
    # PL41 common winter wheat 2019-2023, production / area in thousand t / thousand ha
    w = [876.59 / 203.17, 1227.33 / 220.22, 1191.35 / 219.40, 1330.13 / 237.28, 1330.08 / 230.43]
    assert round(pl['winter-wheat'][2019]['yieldTPerHa'], 4) == round(w[0], 4) == 4.3146, pl['winter-wheat']
    o = outcome(pl, 'eurostat-apro-cpnhr', 'derived')
    assert o['crops']['winter-wheat']['yieldTPerHa'] == round(sum(w) / 5, 2) == 5.34, o['crops']['winter-wheat']
    # rye and maslin: area 185.12, 177.74, 149.61, 134.37, 147.36 thousand ha; total of the 8 crops 912,288 ha
    assert o['crops']['rye']['sharePct'] == round(100 * 158840 / 912288, 2) == 17.41, o['crops']['rye']
    assert o['areaHa'] == 912288, o
    assert abs(sum(c['sharePct'] for c in o['crops'].values()) - 100) < 0.05, o
    assert o['kind'] == 'derived' and o['years'] == '2019\u20132023', o
    # CZ03 has no C1111 or I1111, so common wheat C1110 and rape I1110 stand in, with a note on the crop row
    cz, notes = eurostat_region_crops(eu['CZ03'])
    assert set(notes) == {'winter-wheat', 'rapeseed'}, notes
    w = [805.98 / 138.84, 838.82 / 134.65, 819.66 / 132.94, 870.16 / 144.23, 851.73 / 139.81]
    o = outcome(cz, 'eurostat-apro-cpnhr', 'derived', notes)
    assert o['crops']['winter-wheat']['yieldTPerHa'] == round(sum(w) / 5, 2) == 6.07, o['crops']['winter-wheat']
    assert 'C1110' in o['crops']['winter-wheat']['note'] and 'note' not in o['crops']['barley'], o
    assert outcome({}, 'eurostat-apro-cpnhr', 'derived') is None
    gap = outcome({'maize': {2020: {'areaHa': 10.0}}}, 'x', 'derived')['crops']['maize']
    assert gap['yieldTPerHa'] is None and gap['yieldMissingReason'], gap
    assert gap['nYears'] == 0 and gap['nAreaYears'] == 1 and gap['sharePct'] == 100, gap
    print('twins_outcomes: self-check passed')


if __name__ == '__main__':
    if '--check' not in sys.argv:
        main()
    self_check()
