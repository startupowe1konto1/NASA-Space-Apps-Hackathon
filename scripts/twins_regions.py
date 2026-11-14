"""Region list of the field-twins case base: US counties and EU NUTS 2 regions with one point each.

Run from the repo root:  python -I scripts/twins_regions.py           (downloads both lists, writes the JSON)
                         python -I scripts/twins_regions.py --check   (parses the saved samples only, no network)

Regions (decided in O4-B1, see the PR text):
  US: every county of Iowa, Illinois, Nebraska, Minnesota and Indiana. Point = the county's internal point
      (INTPTLAT, INTPTLONG) from the US Census Bureau 2024 Gazetteer counties file. The Census Bureau computes it
      inside the county, near its centre.
  EU: every NUTS 2 region (NUTS 2021) of Poland, Germany, Czechia and mainland France (the overseas FRY regions are
      left out). Point = the GISCO label point of the region (NUTS_LB), which Eurostat places inside the region.
      NUTS 2021 is the version Eurostat's regional crop tables use, which O4-B2 joins on.

Writes data/twins/cases.json with features and outcome still null; scripts/twins_features.py fills the features,
scripts/twins_outcomes.py (O4-B2) the outcomes. Rerunning this script resets both.

Downloads are cached in $TWINS_CACHE (default: <system temp>/fieldshift-twins-cache), outside the repo.
"""
import datetime
import io
import json
import os
import sys
import tempfile
import time
import urllib.request
import zipfile

GAZETTEER_URL = 'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_counties_national.zip'
NUTS_URL = 'https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_LB_2021_4326_LEVL_2.geojson'
OUT = 'data/twins/cases.json'
GAZETTEER_SAMPLE = 'data/samples/twins/gazetteer_2024_counties_excerpt.txt'
NUTS_SAMPLE = 'data/samples/twins/gisco_nuts_lb_2021_levl2_excerpt.geojson'
CACHE = os.environ.get('TWINS_CACHE') or os.path.join(tempfile.gettempdir(), 'fieldshift-twins-cache')

US_STATES = ['IA', 'IL', 'NE', 'MN', 'IN']
EU_COUNTRIES = ['PL', 'DE', 'CZ', 'FR']
EU_LEFT_OUT_PREFIXES = ['FRY']  # French overseas regions (Guadeloupe, Martinique, Guyane, La Reunion, Mayotte)
COUNTRY = {'US': 'US', 'PL': 'PL'}  # contract Country type: anything else is 'OTHER'


def download(url, name):
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, name)
    if not os.path.exists(path):
        last = None
        for attempt in range(4):
            try:
                req = urllib.request.Request(url, headers={'User-Agent': 'field-shift-tool/0.1 (NASA Space Apps 2026 build script)'})
                with urllib.request.urlopen(req, timeout=120) as response:
                    data = response.read()
                with open(path + '.part', 'wb') as f:
                    f.write(data)
                os.replace(path + '.part', path)
                break
            except Exception as error:
                last = error
                time.sleep(3 + 5 * attempt)
        else:
            raise RuntimeError(f'{url}: {last}')
    with open(path, 'rb') as f:
        return f.read()


def gazetteer_text(raw_zip):
    with zipfile.ZipFile(io.BytesIO(raw_zip)) as z:
        name = next(n for n in z.namelist() if n.endswith('.txt'))
        return z.read(name).decode('utf-8').replace('\r', '')


def parse_gazetteer(text, states=US_STATES):
    """Gazetteer counties file (tab-separated, see GAZETTEER_SAMPLE) -> region rows for the listed states."""
    lines = [line for line in text.split('\n') if line.strip()]
    header = [h.strip() for h in lines[0].split('\t')]
    regions = []
    for line in lines[1:]:
        row = dict(zip(header, [c.strip() for c in line.split('\t')]))
        if row['USPS'] not in states:
            continue
        regions.append({
            'id': 'US-' + row['GEOID'],
            'name': f"{row['NAME']}, {row['USPS']}",
            'country': 'US',
            'iso2': 'US',
            'unit': 'county',
            'code': row['GEOID'],
            'centroid': {'lat': round(float(row['INTPTLAT']), 4), 'lon': round(float(row['INTPTLONG']), 4)},
        })
    return regions


def parse_nuts(text, countries=EU_COUNTRIES):
    """GISCO NUTS label points GeoJSON (see NUTS_SAMPLE) -> region rows for the listed countries."""
    regions = []
    for feature in json.loads(text)['features']:
        p = feature['properties']
        if p['LEVL_CODE'] != 2 or p['CNTR_CODE'] not in countries:
            continue
        if any(p['NUTS_ID'].startswith(prefix) for prefix in EU_LEFT_OUT_PREFIXES):
            continue
        lon, lat = feature['geometry']['coordinates'][:2]
        regions.append({
            'id': p['NUTS_ID'],
            'name': p['NAME_LATN'],
            'country': COUNTRY.get(p['CNTR_CODE'], 'OTHER'),
            'iso2': p['CNTR_CODE'],
            'unit': 'nuts2',
            'code': p['NUTS_ID'],
            'centroid': {'lat': round(lat, 4), 'lon': round(lon, 4)},
        })
    return regions


def write_text(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with io.open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text.rstrip('\n') + '\n')


def dump_cases(out):
    """Compact JSON with one region per line: small enough for the browser, readable in a diff."""
    head = {k: v for k, v in out.items() if k != 'regions'}
    text = json.dumps(head, ensure_ascii=False, indent=1)[:-2]
    rows = ',\n'.join('  ' + json.dumps(r, ensure_ascii=False, separators=(',', ':')) for r in out['regions'])
    return text + ',\n "regions": [\n' + rows + '\n ]\n}'


def count_by(regions, key):
    out = {}
    for r in regions:
        out[r[key]] = out.get(r[key], 0) + 1
    return out


def self_check():
    us = parse_gazetteer(io.open(GAZETTEER_SAMPLE, encoding='utf-8').read())
    story = next(r for r in us if r['id'] == 'US-19169')
    # sample line: IA 19169 ... Story County ... 42.037538 -93.466093
    assert story['name'] == 'Story County, IA' and story['centroid'] == {'lat': 42.0375, 'lon': -93.4661}, story
    assert all(r['iso2'] == 'US' for r in us) and not any(r['code'].startswith('01') for r in us), us
    eu = parse_nuts(io.open(NUTS_SAMPLE, encoding='utf-8').read())
    ids = {r['id']: r for r in eu}
    assert ids['PL41']['name'] == 'Wielkopolskie' and ids['PL41']['country'] == 'PL', ids['PL41']
    assert ids['DEF0']['country'] == 'OTHER' and ids['DEF0']['iso2'] == 'DE', ids['DEF0']
    assert 'FRY1' not in ids, 'overseas region must be left out'
    print('twins_regions: self-check passed')


def main():
    us = parse_gazetteer(gazetteer_text(download(GAZETTEER_URL, '2024_Gaz_counties_national.zip')))
    eu = parse_nuts(download(NUTS_URL, 'NUTS_LB_2021_4326_LEVL_2.geojson').decode('utf-8'))
    regions = us + eu
    for r in regions:
        r['features'] = None
        r['outcome'] = None
    out = {
        'meta': {
            'retrievedAt': datetime.datetime.now(datetime.timezone.utc).date().isoformat(),
            'script': 'scripts/twins_regions.py',
            'sourceUrl': GAZETTEER_URL,
        },
        'sources': [
            {'title': 'US Census Bureau, 2024 Gazetteer Files, counties (internal points)', 'url': GAZETTEER_URL},
            {'title': 'Eurostat GISCO, NUTS 2021 label points, level 2, EPSG:4326', 'url': NUTS_URL},
        ],
        'regionCount': len(regions),
        'regionCountByCountry': count_by(regions, 'iso2'),
        'features': [],
        'regions': regions,
    }
    write_text(OUT, dump_cases(out))
    print('wrote', OUT, len(regions), 'regions', out['regionCountByCountry'])


if __name__ == '__main__':
    if '--check' not in sys.argv:
        main()
    self_check()
