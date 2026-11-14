"""FAO GAEZ v4 crop suitability and attainable yield at the demo field centroids (port of
context/scripts/gaez_point.py).

Run from the repo root:  python -I scripts/gaez_suitability.py           (calls the ImageServer, writes the JSON)
                         python -I scripts/gaez_suitability.py --check   (parses the saved samples only, no network)

Service: the public ArcGIS ImageServer gaez-services.fao.org/server/rest/services/res05 (5 arc-minutes, about 9 km).
The server answers 403 to Python's default User-Agent, so every call sends a curl-like one.
Per crop: one `query` finds the raster ids, then one `identify` per raster with mosaicRule = lock raster.

Rasters used, rain-fed, high input (name prefix + GAEZ crop code):
  sxHr  suitability index 0-10000, all land in the grid cell  -> suitabilityIndex (divided by 100, so 0-100)
  siHr  suitability class, all land in the grid cell          -> classCode
  ycHr  average attainable yield of current cropland, kg DW/ha -> attainableYieldKgHa
Periods: 1981-2010 (CRU TS 3.2 climate) and 2041-2070 under RCP4.5 and RCP8.5 with CO2 fertilization. GAEZ ships
an ENSEMBLE raster for some crops only; for a crop without one, the script averages the five GCM rasters
(GFDL-ESM2M, HadGEM2-ES, IPSL-CM5A-LR, MIROC-ESM-CHEM, NorESM1-M) and marks the entry "ensemble": "mean of 5 GCMs
(our calculation)". The class of such a mean comes from the legend bounds, not from a GAEZ class raster.

Suitability classes (legend of the res05 service, data/samples/gaez/res05-legend-suitability-classes.json on the
rules branch): 1 Very high (SI > 75), 2 High (> 63), 3 Good (> 50), 4 Medium (> 35), 5 Moderate (> 20),
6 Marginal (> 10), 7 Very marginal (> 0), 8 Not suitable, 9 No cultivation, 10 Water.

Writes data/precomputed/gaez.json:
  { "meta": {...}, "datasetId": "fao-gaez-v4",
    "fields": { "<fieldId>": { "centroid", "crops": { "<cropId>": ENTRY }, "future": { "2041-2070 RCP4.5": { "<cropId>": ENTRY }, ... } } } }
  ENTRY = { "gaezCrop", "period", "suitabilityIndex", "suitabilityClass", "classCode", "attainableYieldKgHa",
            "ensemble"?, "missingReason"? }
A crop of our list with no GAEZ crop (cover crops such as red clover) has every value null and a missingReason.
"""
import datetime
import io
import json
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

BASE = 'https://gaez-services.fao.org/server/rest/services/res05/ImageServer'
OUT = 'data/precomputed/gaez.json'
QUERY_SAMPLE = 'data/samples/gaez/res05-query-maize-hr-1981-2070.json'
IDENTIFY_SAMPLE = 'data/samples/gaez/res05-identify-sxHr_mze-demo-iowa.json'
SCENARIOS = ['RCP4.5', 'RCP8.5']
FUTURE = '2041-2070'
GCMS = ['GFDL-ESM2M', 'HadGEM2-ES', 'IPSL-CM5A-LR', 'MIROC-ESM-CHEM', 'NorESM1-M']

# Keep in sync with src/fixtures/fields.ts; crop lists from SPEC section 8 (ids of src/fixtures/crops.ts).
FIELDS = {
    'demo-iowa': {'lat': 42.0305, 'lon': -93.497,
                  'crops': ['maize', 'soybean', 'oats', 'winter-wheat', 'alfalfa', 'cereal-rye', 'red-clover']},
    'demo-poznan': {'lat': 52.45, 'lon': 17.1,
                    'crops': ['winter-wheat', 'winter-rapeseed', 'maize', 'spring-barley', 'rye', 'field-pea',
                              'sugar-beet', 'potato', 'white-mustard', 'phacelia']},
}

# crop id -> (GAEZ crop name, GAEZ file code). GAEZ has one wheat, one barley, one rye: not split by season.
GAEZ_CROPS = {
    'maize': ('Maize', 'mze'), 'soybean': ('Soybean', 'soy'), 'oats': ('Oat', 'oat'),
    'winter-wheat': ('Wheat', 'whe'), 'alfalfa': ('Alfalfa', 'alf'), 'cereal-rye': ('Rye', 'rye'),
    'winter-rapeseed': ('Rapeseed', 'rsd'), 'spring-barley': ('Barley', 'brl'), 'rye': ('Rye', 'rye'),
    'field-pea': ('Dry pea', 'pea'), 'sugar-beet': ('Sugarbeet', 'sub'), 'potato': ('White potato', 'wpo'),
}
NO_GAEZ = {'red-clover': 'red clover', 'white-mustard': 'white mustard', 'phacelia': 'phacelia'}

CLASS_LABELS = {1: 'Very high', 2: 'High', 3: 'Good', 4: 'Medium', 5: 'Moderate', 6: 'Marginal',
                7: 'Very marginal', 8: 'Not suitable', 9: 'No cultivation', 10: 'Water'}
SI_BOUNDS = [(75, 1), (63, 2), (50, 3), (35, 4), (20, 5), (10, 6), (0, 7)]


def class_from_si(si):
    """SI 0-100 -> class code by the service legend; 0 = not suitable."""
    for bound, code in SI_BOUNDS:
        if si > bound:
            return code
    return 8


def get(path, **params):
    params['f'] = 'json'
    url = BASE + path + '?' + urllib.parse.urlencode(params)
    last = None
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'field-shift-tool/0.1 (NASA Space Apps 2026 build script)'})
            with urllib.request.urlopen(req, timeout=60) as response:
                text = response.read().decode('utf-8').replace('\r', '')
            data = json.loads(text)
            if 'error' in data:
                raise RuntimeError(data['error'])
            return text, data
        except Exception as error:
            last = error
            time.sleep(2 + 3 * attempt)
    raise RuntimeError(f'{path}: {last}')


def query_rasters(gaez_name, code):
    names = ','.join(f"'{p}Hr_{code}'" for p in ('sx', 'si', 'yc'))
    where = (f"crop='{gaez_name}' AND name IN ({names}) AND ((year='1981-2010' AND model='CRUTS32') OR "
             f"(year='{FUTURE}' AND rcp IN ({','.join(repr(s) for s in SCENARIOS)})))")
    return get('/query', where=where, outFields='objectid,name,crop,year,model,rcp,variable,units,c02_fertilization',
               returnGeometry='false')


def parse_rasters(data):
    """query response -> list of {objectid, var ('sx'|'si'|'yc'), period, model} (see QUERY_SAMPLE)."""
    out = []
    for feature in data.get('features', []):
        a = feature['attributes']
        if a['year'] != '1981-2010' and not (a.get('c02_fertilization') or '').startswith('With CO2'):
            continue
        period = '1981-2010' if a['year'] == '1981-2010' else f"{a['year']} {a['rcp']}"
        out.append({'objectid': a['objectid'], 'var': a['name'][:2], 'period': period, 'model': a['model']})
    return out


def parse_identify(data):
    """identify response -> float or None (see IDENTIFY_SAMPLE)."""
    value = data.get('value')
    if value in (None, '', 'NoData'):
        return None
    return float(value)


def identify(lat, lon, objectid):
    return get('/identify', geometry=json.dumps({'x': lon, 'y': lat}), geometryType='esriGeometryPoint',
               mosaicRule=json.dumps({'mosaicMethod': 'esriMosaicLockRaster', 'lockRasterIds': [objectid]}),
               returnGeometry='false', returnCatalogItems='false')


def entry(gaez_name, period, sx, si, yc, ensemble=None):
    si_value = None if sx is None else round(sx / 100, 1)
    if si is not None:
        code = int(si)
    elif si_value is not None:
        code = class_from_si(si_value)
    else:
        code = None
    e = {
        'gaezCrop': gaez_name, 'period': period, 'suitabilityIndex': si_value,
        'suitabilityClass': CLASS_LABELS.get(code) if code is not None else None, 'classCode': code,
        'attainableYieldKgHa': None if yc is None else round(yc),
    }
    if ensemble:
        e['ensemble'] = ensemble
    missing = [k for k in ('suitabilityIndex', 'classCode', 'attainableYieldKgHa') if e[k] is None]
    if missing:
        e['missingReason'] = 'GAEZ returned no value for ' + ', '.join(missing) + ' at this grid cell'
    return e


def missing_entry(crop_id, period):
    return {'gaezCrop': None, 'period': period, 'suitabilityIndex': None, 'suitabilityClass': None,
            'classCode': None, 'attainableYieldKgHa': None,
            'missingReason': f'GAEZ v4 has no crop for {NO_GAEZ.get(crop_id, crop_id)}'}


def crop_values(lat, lon, crop_id, pool, save_samples=False):
    gaez_name, code = GAEZ_CROPS[crop_id]
    text, data = query_rasters(gaez_name, code)
    if save_samples and crop_id == 'maize':
        write_text(QUERY_SAMPLE, text)
    rasters = parse_rasters(data)
    values = list(pool.map(lambda r: identify(lat, lon, r['objectid']), rasters))
    if save_samples and crop_id == 'maize':
        first = next(i for i, r in enumerate(rasters) if r['var'] == 'sx' and r['period'] == '1981-2010')
        write_text(IDENTIFY_SAMPLE, values[first][0])
    table = {}  # (period, model) -> {var: value}
    for r, (_, d) in zip(rasters, values):
        table.setdefault((r['period'], r['model']), {})[r['var']] = parse_identify(d)
    result = {}
    hist = table.get(('1981-2010', 'CRUTS32'), {})
    result['1981-2010'] = entry(gaez_name, '1981-2010', hist.get('sx'), hist.get('si'), hist.get('yc'))
    for scenario in SCENARIOS:
        period = f'{FUTURE} {scenario}'
        ens = table.get((period, 'ENSEMBLE'))
        if ens and ens.get('sx') is not None:
            result[period] = entry(gaez_name, period, ens.get('sx'), ens.get('si'), ens.get('yc'), 'GAEZ ENSEMBLE')
            continue
        runs = [table[(period, g)] for g in GCMS if (period, g) in table]

        def mean(var):
            vals = [r[var] for r in runs if r.get(var) is not None]
            return sum(vals) / len(vals) if len(vals) == len(GCMS) else None

        result[period] = entry(gaez_name, period, mean('sx'), None, mean('yc'),
                               f'mean of {len(GCMS)} GCMs (our calculation)')
    return result


def write_text(path, text):
    with io.open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text.rstrip('\n') + '\n')


def self_check():
    rasters = parse_rasters(json.loads(io.open(QUERY_SAMPLE, encoding='utf-8').read()))
    assert any(r['var'] == 'sx' and r['period'] == '1981-2010' for r in rasters), rasters[:3]
    value = parse_identify(json.loads(io.open(IDENTIFY_SAMPLE, encoding='utf-8').read()))
    assert value is None or 0 <= value <= 10000, value
    assert class_from_si(80) == 1 and class_from_si(55) == 3 and class_from_si(0) == 8
    e = entry('Maize', '1981-2010', 6000, 3, 9000.4)
    assert e['suitabilityIndex'] == 60.0 and e['suitabilityClass'] == 'Good' and e['attainableYieldKgHa'] == 9000
    print('gaez_suitability: self-check passed')


def main():
    fields = {}
    with ThreadPoolExecutor(6) as pool:
        for field_id, f in FIELDS.items():
            crops, future = {}, {f'{FUTURE} {s}': {} for s in SCENARIOS}
            for crop_id in f['crops']:
                if crop_id not in GAEZ_CROPS:
                    crops[crop_id] = missing_entry(crop_id, '1981-2010')
                    for period in future:
                        future[period][crop_id] = missing_entry(crop_id, period)
                    continue
                values = crop_values(f['lat'], f['lon'], crop_id, pool, save_samples=field_id == 'demo-iowa')
                crops[crop_id] = values['1981-2010']
                for period in future:
                    future[period][crop_id] = values[period]
                print(field_id, crop_id, {p: (v['classCode'], v['suitabilityIndex'], v['attainableYieldKgHa'])
                                          for p, v in values.items()})
            fields[field_id] = {'centroid': {'lat': f['lat'], 'lon': f['lon']}, 'crops': crops, 'future': future}
    out = {
        'meta': {
            'retrievedAt': datetime.datetime.now(datetime.timezone.utc).date().isoformat(),
            'script': 'scripts/gaez_suitability.py',
            'sourceUrl': BASE,
        },
        'datasetId': 'fao-gaez-v4',
        'variant': 'rain-fed, high input, with CO2 fertilization (future)',
        'fields': fields,
    }
    write_text(OUT, json.dumps(out, ensure_ascii=False, indent=2))
    print('wrote', OUT)


if __name__ == '__main__':
    if '--check' not in sys.argv:
        main()
    self_check()
