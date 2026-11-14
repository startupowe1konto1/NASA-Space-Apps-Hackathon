"""Climate features of the field-twins case base from NASA POWER climatology at each region's point.

Run from the repo root:  python -I scripts/twins_features.py           (fills data/twins/cases.json; run
                                                                       scripts/twins_regions.py first)
                         python -I scripts/twins_features.py --check   (parses the saved samples only, no network)

Source: NASA POWER Climatology API, community AG, one request per region point (MERRA-2 at about 0.5 x 0.625
degrees, so neighbouring counties can share a grid cell). The API serves a fixed 25-year climatology, January 2001
to December 2025; every value below is a model estimate, not a station observation.

Features (growing season = April to September; every region in the base is in the northern hemisphere):
  gsMeanTempC        mean of monthly T2M, April-September, weighted by days in the month              degrees C
  gsRainMm           sum of PRECTOTCORR (mm/day) x days in the month, April-September                  mm
  gsRootZoneWetness  mean of monthly GWETROOT, April-September, weighted by days in the month          0-1
  frostDaysPerYear   FROST_DAYS, annual value (POWER: 2 m temperature reaches the dew point and both
                     are below 0 C)                                                                    days
  yearlyMaxTempC     T2M_MAX_AVG, annual value: the year's highest 2 m temperature, averaged over
                     2001-2025. POWER has no count of hot days in this API, so this stands in for
                     "hot days". The monthly T2M_MAX of the saved sample in data/samples/power gives a
                     July mean of 35.1 C over 2001-2024 near Ames; T2M_MAX_AVG for July at Story County
                     is 34.8 C, so the value is a mean of maxima, not a mean of daily maxima.         degrees C
Soil features (SoilGrids sand, clay, organic carbon) are not in this version: ISRIC asks for at most 5 requests
per minute, which is about two hours for this base. A value POWER does not give is null with "missingReason".

Responses are cached in $TWINS_CACHE (default: <system temp>/fieldshift-twins-cache), so a rerun does not refetch.
At most one request per second.
"""
import datetime
import io
import json
import os
import sys
import tempfile
import time
import urllib.parse
import urllib.request

POWER_URL = 'https://power.larc.nasa.gov/api/temporal/climatology/point'
PARAMETERS = ['T2M', 'T2M_MAX_AVG', 'PRECTOTCORR', 'GWETROOT', 'FROST_DAYS']
CASES = 'data/twins/cases.json'
SAMPLE_US = 'data/samples/twins/power_climatology_story-county-ia.json'
SAMPLE_PL = 'data/samples/twins/power_climatology_PL41.json'
CACHE = os.environ.get('TWINS_CACHE') or os.path.join(tempfile.gettempdir(), 'fieldshift-twins-cache')
FILL = -999.0
SEASON = [('APR', 30), ('MAY', 31), ('JUN', 30), ('JUL', 31), ('AUG', 31), ('SEP', 30)]
PERIOD = '2001-2025'

FEATURES = [
    {'id': 'gsMeanTempC', 'unit': 'C', 'name': 'Growing-season mean temperature (April-September)',
     'parameter': 'T2M'},
    {'id': 'gsRainMm', 'unit': 'mm', 'name': 'Growing-season rain (April-September total)',
     'parameter': 'PRECTOTCORR'},
    {'id': 'gsRootZoneWetness', 'unit': '0-1', 'name': 'Growing-season root-zone wetness (April-September mean)',
     'parameter': 'GWETROOT'},
    {'id': 'frostDaysPerYear', 'unit': 'days', 'name': 'Frost days per year', 'parameter': 'FROST_DAYS'},
    {'id': 'yearlyMaxTempC', 'unit': 'C', 'name': 'Hottest temperature of the year, averaged over the years',
     'parameter': 'T2M_MAX_AVG', 'note': 'stands in for hot days; POWER climatology has no hot-day count'},
]


def request(url, attempts=4, timeout=60):
    last = None
    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'curl/8.5.0'})
            with urllib.request.urlopen(req, timeout=timeout) as response:
                return response.read().decode('utf-8').replace('\r', '')
        except Exception as error:
            last = error
            time.sleep(3 + 5 * attempt)
    raise RuntimeError(f'{url}: {last}')


def power_url(lat, lon):
    q = {'parameters': ','.join(PARAMETERS), 'community': 'AG', 'longitude': lon, 'latitude': lat, 'format': 'JSON'}
    return POWER_URL + '?' + urllib.parse.urlencode(q)


_last_call = [0.0]


def fetch(lat, lon):
    """Cached POWER call; waits so that live calls are at least one second apart."""
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, f'power_clim_{lat:.4f}_{lon:.4f}.json')
    if os.path.exists(path):
        return io.open(path, encoding='utf-8').read(), False
    wait = 1.0 - (time.monotonic() - _last_call[0])
    if wait > 0:
        time.sleep(wait)
    _last_call[0] = time.monotonic()
    text = request(power_url(lat, lon))
    json.loads(text)['properties']['parameter']  # only cache a usable response
    with io.open(path + '.part', 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)
    os.replace(path + '.part', path)
    return text, True


def missing(reason):
    return {'value': None, 'missingReason': reason}


def parse_climatology(text):
    """POWER climatology/point response (see SAMPLE_US) -> {featureId: number or {value: None, missingReason}}."""
    params = json.loads(text)['properties']['parameter']

    def season(name, how):
        months = params.get(name)
        if months is None:
            return missing(f'POWER returned no {name}')
        values = [(months.get(m), days) for m, days in SEASON]
        if any(v is None or v == FILL for v, _ in values):
            return missing(f'POWER {name} has a fill value in April-September')
        if how == 'sum':
            return sum(v * days for v, days in values)
        return sum(v * days for v, days in values) / sum(days for _, days in values)

    def annual(name):
        value = (params.get(name) or {}).get('ANN')
        if value is None or value == FILL:
            return missing(f'POWER {name} has no annual value')
        return value

    def rounded(value, digits):
        return value if isinstance(value, dict) else round(value, digits)

    return {
        'gsMeanTempC': rounded(season('T2M', 'mean'), 2),
        'gsRainMm': rounded(season('PRECTOTCORR', 'sum'), 1),
        'gsRootZoneWetness': rounded(season('GWETROOT', 'mean'), 3),
        'frostDaysPerYear': rounded(annual('FROST_DAYS'), 1),
        'yearlyMaxTempC': rounded(annual('T2M_MAX_AVG'), 2),
    }


def write_text(path, text):
    with io.open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text.rstrip('\n') + '\n')


def dump_cases(out):
    """Compact JSON with one region per line: small enough for the browser, readable in a diff."""
    head = {k: v for k, v in out.items() if k != 'regions'}
    text = json.dumps(head, ensure_ascii=False, indent=1)[:-2]
    rows = ',\n'.join('  ' + json.dumps(r, ensure_ascii=False, separators=(',', ':')) for r in out['regions'])
    return text + ',\n "regions": [\n' + rows + '\n ]\n}'


def self_check():
    us = parse_climatology(io.open(SAMPLE_US, encoding='utf-8').read())
    # sample T2M Apr-Sep: 9.77, 16.01, 21.88, 24.25, 22.87, 18.53 weighted by 30, 31, 30, 31, 31, 30 days
    t = (9.77 * 30 + 16.01 * 31 + 21.88 * 30 + 24.25 * 31 + 22.87 * 31 + 18.53 * 30) / 183
    assert us['gsMeanTempC'] == round(t, 2) == 18.92, us
    # PRECTOTCORR Apr-Sep mm/day: 2.99, 3.79, 4.26, 3.01, 3.54, 2.86
    rain = 2.99 * 30 + 3.79 * 31 + 4.26 * 30 + 3.01 * 31 + 3.54 * 31 + 2.86 * 30
    assert us['gsRainMm'] == round(rain, 1) == 623.8, us
    assert us['frostDaysPerYear'] == 145.1 and us['yearlyMaxTempC'] == 35.82, us
    assert 0 < us['gsRootZoneWetness'] < 1, us
    pl = parse_climatology(io.open(SAMPLE_PL, encoding='utf-8').read())
    assert all(isinstance(v, (int, float)) for v in pl.values()), pl
    assert pl['gsMeanTempC'] < us['gsMeanTempC'] and pl['gsRainMm'] < us['gsRainMm'], (pl, us)
    broken = json.loads(io.open(SAMPLE_US, encoding='utf-8').read())
    broken['properties']['parameter']['GWETROOT']['JUL'] = FILL
    assert parse_climatology(json.dumps(broken))['gsRootZoneWetness']['value'] is None
    print('twins_features: self-check passed')


def main():
    cases = json.loads(io.open(CASES, encoding='utf-8').read())
    regions = cases['regions']
    live = 0
    for i, r in enumerate(regions, 1):
        c = r['centroid']
        try:
            text, was_live = fetch(c['lat'], c['lon'])
            live += was_live
            r['features'] = parse_climatology(text)
        except Exception as error:  # keep the region, say why it has no features
            r['features'] = {f['id']: missing(f'POWER request failed: {error}'[:200]) for f in FEATURES}
        if i % 25 == 0 or i == len(regions):
            print(f'{i}/{len(regions)} regions, {live} live requests', flush=True)
    complete = sum(all(isinstance(v, (int, float)) for v in r['features'].values()) for r in regions)
    cases['meta'] = {
        'retrievedAt': datetime.datetime.now(datetime.timezone.utc).date().isoformat(),
        'script': 'scripts/twins_features.py',
        'sourceUrl': POWER_URL,
    }
    cases['sources'] = [s for s in cases.get('sources', []) if s['url'] != POWER_URL] + [
        {'title': f'NASA POWER Climatology API (community AG), {PERIOD} climatology, MERRA-2 based model estimates',
         'url': POWER_URL}]
    cases['features'] = [
        {**f, 'datasetId': 'nasa-power', 'period': PERIOD, 'kind': 'model estimate', 'season':
         'April-September' if f['id'].startswith('gs') else 'whole year'} for f in FEATURES]
    cases['regionsWithAllFeatures'] = complete
    write_text(CASES, dump_cases(cases))
    print('wrote', CASES, f'{complete}/{len(regions)} regions with every feature')


if __name__ == '__main__':
    if '--check' not in sys.argv:
        main()
    self_check()
