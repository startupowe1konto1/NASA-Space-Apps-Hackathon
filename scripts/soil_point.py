"""Topsoil (0-30 cm) sand, clay, organic carbon and pH at the demo field centroids.

Run from the repo root:  python -I scripts/soil_point.py           (calls both services, writes the JSON)
                         python -I scripts/soil_point.py --check   (parses the saved samples only, no network)

Sources:
  US field: USDA NRCS SSURGO through Soil Data Access (SQL over HTTPS, POST to Tabular/post.rest). The map unit
            under the centroid comes from SDA_Get_Mukey_from_intersection_with_WktWgs84.
  PL field: ISRIC SoilGrids 2.0 REST point query (mean, Q0.05, Q0.95). SoilGrids is slow (3-15 s); retried gently.

Method, both sources: each value is depth-weighted over 0-30 cm (the share of each horizon or SoilGrids layer that
falls inside 0-30 cm). SSURGO: horizons of each component are depth-weighted, then components are weighted by their
share of the map unit (comppct_r); components without data drop out of the weights. low/high are the same
aggregation of the SSURGO _l and _h columns, and of SoilGrids Q0.05 and Q0.95.
Organic carbon: SSURGO gives organic matter (om, % by weight); carbon = om / 1.724 (van Bemmelen factor, as in
the NRCS Soil Survey Laboratory Methods Manual). SoilGrids soc is dg/kg; % = value / 100.

Writes data/precomputed/soil.json:
  { "meta": {...}, "fields": { "<fieldId>": { "centroid", "datasetId", "depthCm": "0-30", "mapUnit"?,
      "sandPct": {"value", "low", "high"}, "clayPct": {...}, "organicCarbonPct": {...}, "ph": {...},
      "rangeBasis": "..." } } }
A value that cannot be computed is null with a sibling "missingReason".
"""
import datetime
import io
import json
import sys
import time
import urllib.parse
import urllib.request

SDA_URL = 'https://sdmdataaccess.sc.egov.usda.gov/Tabular/post.rest'
SOILGRIDS_URL = 'https://rest.isric.org/soilgrids/v2.0/properties/query'
OUT = 'data/precomputed/soil.json'
SDA_SAMPLE = 'data/samples/ssurgo/sda_point_demo-iowa.json'
SOILGRIDS_SAMPLE = 'data/samples/soilgrids/properties_query_17.10_52.45_0-30cm.json'
TOP, BOTTOM = 0, 30
OM_TO_OC = 1.724

# Keep in sync with src/fixtures/fields.ts.
FIELDS = {
    'demo-iowa': {'lat': 42.0305, 'lon': -93.497, 'country': 'US'},
    'demo-poznan': {'lat': 52.45, 'lon': 17.1, 'country': 'PL'},
}

SDA_SQL = """SELECT mu.mukey, mu.muname, c.cokey, c.compname, c.comppct_r, c.majcompflag, h.hzname, h.hzdept_r,
 h.hzdepb_r, h.sandtotal_l, h.sandtotal_r, h.sandtotal_h, h.claytotal_l, h.claytotal_r, h.claytotal_h,
 h.om_l, h.om_r, h.om_h, h.ph1to1h2o_l, h.ph1to1h2o_r, h.ph1to1h2o_h
FROM mapunit mu INNER JOIN component c ON c.mukey = mu.mukey INNER JOIN chorizon h ON h.cokey = c.cokey
WHERE mu.mukey IN (SELECT * FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('point({lon} {lat})'))
 AND h.hzdept_r < {bottom} ORDER BY c.comppct_r DESC, h.hzdept_r"""


def request(url, data=None, attempts=4, timeout=60):
    last = None
    for attempt in range(attempts):
        try:
            headers = {'User-Agent': 'curl/8.5.0'}
            if data is not None:
                headers['Content-Type'] = 'application/json'
            req = urllib.request.Request(url, data=data, headers=headers)
            with urllib.request.urlopen(req, timeout=timeout) as response:
                return response.read().decode('utf-8').replace('\r', '')
        except Exception as error:
            last = error
            time.sleep(3 + 5 * attempt)
    raise RuntimeError(f'{url}: {last}')


def overlap(top, bottom):
    return max(0.0, min(bottom, BOTTOM) - max(top, TOP))


def num(text):
    if text is None or str(text).strip() == '':
        return None
    return float(text)


def ranged(value, low, high, digits):
    if value is None:
        return {'value': None, 'missingReason': 'no horizon data in 0-30 cm'}
    out = {'value': round(value, digits)}
    if low is not None and high is not None:
        out['low'] = round(low, digits)
        out['high'] = round(high, digits)
    return out


def parse_sda(text):
    """SDA JSON+COLUMNNAME response (see SDA_SAMPLE) -> soil record for the field."""
    table = json.loads(text)['Table']
    header, rows = table[0], [dict(zip(table[0], r)) for r in table[1:]]
    if not rows:
        raise ValueError('SDA returned no horizons for this point')
    columns = {'sand': 'sandtotal', 'clay': 'claytotal', 'om': 'om', 'ph': 'ph1to1h2o'}
    # per component: depth-weighted mean of each column (_l, _r, _h)
    components = {}
    for r in rows:
        comp = components.setdefault(r['cokey'], {'name': r['compname'], 'pct': num(r['comppct_r']) or 0, 'sums': {}})
        w = overlap(num(r['hzdept_r']), num(r['hzdepb_r']))
        for key, col in columns.items():
            for suffix in ('_l', '_r', '_h'):
                v = num(r[col + suffix])
                if v is None or w == 0:
                    continue
                s = comp['sums'].setdefault(key + suffix, [0.0, 0.0])
                s[0] += v * w
                s[1] += w
    result = {}
    for key in columns:
        agg = {}
        for suffix in ('_l', '_r', '_h'):
            num_, den = 0.0, 0.0
            for comp in components.values():
                s = comp['sums'].get(key + suffix)
                if s and s[1] > 0 and comp['pct'] > 0:
                    num_ += (s[0] / s[1]) * comp['pct']
                    den += comp['pct']
            agg[suffix] = num_ / den if den > 0 else None
        result[key] = agg
    oc = {k: (v / OM_TO_OC if v is not None else None) for k, v in result['om'].items()}
    first = rows[0]
    return {
        'datasetId': 'usda-ssurgo',
        'depthCm': '0-30',
        'mapUnit': {'mukey': first['mukey'], 'name': first['muname'],
                    'components': [{'name': c['name'], 'pct': c['pct']} for c in components.values()]},
        'sandPct': ranged(result['sand']['_r'], result['sand']['_l'], result['sand']['_h'], 1),
        'clayPct': ranged(result['clay']['_r'], result['clay']['_l'], result['clay']['_h'], 1),
        'organicCarbonPct': ranged(oc['_r'], oc['_l'], oc['_h'], 2),
        'ph': ranged(result['ph']['_r'], result['ph']['_l'], result['ph']['_h'], 1),
        'rangeBasis': 'SSURGO low and high columns (_l, _h), aggregated like the representative value',
        'organicCarbonNote': 'SSURGO organic matter divided by 1.724',
    }


def parse_soilgrids(text):
    """SoilGrids properties/query response (see SOILGRIDS_SAMPLE) -> soil record for the field."""
    layers = {layer['name']: layer for layer in json.loads(text)['properties']['layers']}
    # mapped units -> target units: sand, clay g/kg -> % (/10); soc dg/kg -> % (/100); phh2o pH*10 -> pH (/10)
    to_target = {'sand': 10.0, 'clay': 10.0, 'soc': 100.0, 'phh2o': 10.0}

    def weighted(name, stat):
        layer = layers.get(name)
        if layer is None:
            return None
        num_, den = 0.0, 0.0
        for d in layer['depths']:
            v = d['values'].get(stat)
            w = overlap(d['range']['top_depth'], d['range']['bottom_depth'])
            if v is None or w == 0:
                continue
            num_ += v * w
            den += w
        return num_ / den / to_target[name] if den > 0 else None

    def block(name, digits):
        return ranged(weighted(name, 'mean'), weighted(name, 'Q0.05'), weighted(name, 'Q0.95'), digits)

    return {
        'datasetId': 'isric-soilgrids',
        'depthCm': '0-30',
        'sandPct': block('sand', 1),
        'clayPct': block('clay', 1),
        'organicCarbonPct': block('soc', 2),
        'ph': block('phh2o', 1),
        'rangeBasis': 'SoilGrids 5% and 95% quantiles, depth-weighted like the mean (an approximation of the 0-30 cm interval)',
    }


def fetch_sda(c):
    sql = SDA_SQL.format(lon=c['lon'], lat=c['lat'], bottom=BOTTOM)
    body = json.dumps({'format': 'JSON+COLUMNNAME', 'query': sql}).encode('utf-8')
    return request(SDA_URL, data=body)


def fetch_soilgrids(c):
    q = [('lon', c['lon']), ('lat', c['lat'])]
    q += [('property', p) for p in ('sand', 'clay', 'soc', 'phh2o')]
    q += [('depth', d) for d in ('0-5cm', '5-15cm', '15-30cm')]
    q += [('value', v) for v in ('mean', 'Q0.05', 'Q0.95')]
    return request(SOILGRIDS_URL + '?' + urllib.parse.urlencode(q), timeout=90)


def write_text(path, text):
    with io.open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text.rstrip('\n') + '\n')


def self_check():
    iowa = parse_sda(io.open(SDA_SAMPLE, encoding='utf-8').read())
    assert iowa['mapUnit']['mukey'] and 0 < iowa['sandPct']['value'] < 100, iowa
    assert iowa['sandPct']['low'] <= iowa['sandPct']['value'] <= iowa['sandPct']['high'], iowa['sandPct']
    poz = parse_soilgrids(io.open(SOILGRIDS_SAMPLE, encoding='utf-8').read())
    # sample: sand mean 715, 726, 705 g/kg over 5, 10, 15 cm -> 71.5 %
    assert poz['sandPct']['value'] == round((715 * 5 + 726 * 10 + 705 * 15) / 30 / 10, 1), poz['sandPct']
    assert 0 < poz['organicCarbonPct']['value'] < 10 and 3 < poz['ph']['value'] < 9, poz
    print('soil_point: self-check passed')


def main():
    fields = {}
    for field_id, c in FIELDS.items():
        if c['country'] == 'US':
            text = fetch_sda(c)
            write_text(SDA_SAMPLE if field_id == 'demo-iowa' else f'data/samples/ssurgo/sda_point_{field_id}.json', text)
            record = parse_sda(text)
            source_url = SDA_URL
        else:
            text = fetch_soilgrids(c)
            write_text(SOILGRIDS_SAMPLE if field_id == 'demo-poznan' else f'data/samples/soilgrids/{field_id}.json', text)
            record = parse_soilgrids(text)
            source_url = SOILGRIDS_URL
        fields[field_id] = {'centroid': {'lat': c['lat'], 'lon': c['lon']}, **record, 'sourceUrl': source_url}
        print(field_id, {k: record[k]['value'] for k in ('sandPct', 'clayPct', 'organicCarbonPct', 'ph')})
    out = {
        'meta': {
            'retrievedAt': datetime.datetime.now(datetime.timezone.utc).date().isoformat(),
            'script': 'scripts/soil_point.py',
            'sourceUrl': SDA_URL,  # per-field sourceUrl says which service each record came from
        },
        'fields': fields,
    }
    write_text(OUT, json.dumps(out, ensure_ascii=False, indent=2))
    print('wrote', OUT)


if __name__ == '__main__':
    if '--check' not in sys.argv:
        main()
    self_check()
