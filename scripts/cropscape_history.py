"""Crop history of the Iowa demo field from USDA CropScape (Cropland Data Layer), 2016-2025.

Run from the repo root:  python -I scripts/cropscape_history.py            (calls CropScape, writes the JSON)
                         python -I scripts/cropscape_history.py --check    (parses the saved sample only, no network)

Writes data/precomputed/cropscape.json:
  { "meta": { "retrievedAt", "script", "sourceUrl" },
    "datasetId": "usda-cropscape",
    "fields": { "demo-iowa": { "centroid": {"lat", "lon"}, "x5070", "y5070",
                               "years": [ { "year", "crop", "cdlCode", "cdlName", "source": "cropscape" } ] } } }
`crop` is a crop id of src/fixtures/crops.ts, or null when the CDL class maps to no crop of our list
(then `missingReason` says which class it was). One GetCDLValue call per year at the field centroid.

CropScape wants x/y in EPSG:5070 (NAD83 / Conus Albers). The projection is done here with the Albers equal-area
conic formulas (Snyder 1987, eq. 3-12, 14-3 to 14-6), GRS80 ellipsoid; WGS84 lon/lat is taken as NAD83 (about
1 m apart in Iowa, far below the 30 m CDL pixel).

Network notes: nassgeodata.gmu.edu sends a chain that ends at "emSign Root CA - G1". If Python cannot verify it,
point SSL_CERT_FILE at a bundle that has that root (for example the certifi bundle). Calls run one at a time:
parallel calls hung on this server during testing.
"""
import datetime
import io
import json
import math
import re
import sys
import time
import urllib.request

ENDPOINT = 'https://nassgeodata.gmu.edu/axis2/services/CDLService/GetCDLValue'
OUT = 'data/precomputed/cropscape.json'
SAMPLE = 'data/samples/cropscape/getcdlvalue_2025_demo-iowa.xml'
YEARS = range(2016, 2026)

# Keep in sync with src/fixtures/fields.ts (only the US field has a CDL history).
FIELDS = {'demo-iowa': {'lat': 42.0305, 'lon': -93.497}}

# CDL class code -> crop id of src/fixtures/crops.ts (US list). Codes from the CDL legend
# (https://www.nass.usda.gov/Research_and_Science/Cropland/metadata/metadata_ia25.htm, "Attribute Accuracy" table).
CDL_TO_CROP = {
    1: 'maize',         # Corn
    5: 'soybean',       # Soybeans
    24: 'winter-wheat', # Winter Wheat
    28: 'oats',         # Oats
    36: 'alfalfa',      # Alfalfa
}


def to_epsg5070(lat, lon):
    """WGS84 degrees -> EPSG:5070 metres (Albers, lat0 23, lat1 29.5, lat2 45.5, lon0 -96, GRS80)."""
    a = 6378137.0
    f = 1 / 298.257222101
    e2 = 2 * f - f * f
    e = math.sqrt(e2)
    lat0, lat1, lat2, lon0 = (math.radians(v) for v in (23.0, 29.5, 45.5, -96.0))

    def q(phi):
        s = math.sin(phi)
        return (1 - e2) * (s / (1 - e2 * s * s) - (1 / (2 * e)) * math.log((1 - e * s) / (1 + e * s)))

    def m(phi):
        s = math.sin(phi)
        return math.cos(phi) / math.sqrt(1 - e2 * s * s)

    n = (m(lat1) ** 2 - m(lat2) ** 2) / (q(lat2) - q(lat1))
    c = m(lat1) ** 2 + n * q(lat1)
    rho0 = a * math.sqrt(c - n * q(lat0)) / n
    rho = a * math.sqrt(c - n * q(math.radians(lat))) / n
    theta = n * (math.radians(lon) - lon0)
    return rho * math.sin(theta), rho0 - rho * math.cos(theta)


def parse_cdl_value(text):
    """Parse the GetCDLValue XML body (see SAMPLE) into (code, name)."""
    text = text.replace('\r', '')
    match = re.search(r'value:\s*(\d+),\s*category:\s*"([^"]*)"', text)
    if not match:
        raise ValueError('no CDL value in response: ' + text[:200])
    return int(match.group(1)), match.group(2)


def fetch(url, attempts=4):
    last = None
    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'field-shift-tool/0.1 (NASA Space Apps 2026 build script)'})
            with urllib.request.urlopen(req, timeout=30) as response:
                return response.read().decode('utf-8')
        except Exception as error:  # network hiccups: retry gently
            last = error
            time.sleep(2 + 3 * attempt)
    raise RuntimeError(f'{url}: {last}')


def year_row(year, code, name):
    crop = CDL_TO_CROP.get(code)
    row = {'year': year, 'crop': crop, 'cdlCode': code, 'cdlName': name, 'source': 'cropscape'}
    if crop is None:
        row['missingReason'] = f'CDL class {code} "{name}" is not a crop of the US list'
    return row


def self_check():
    code, name = parse_cdl_value(io.open(SAMPLE, encoding='utf-8').read())
    assert (code, name) == (5, 'Soybeans'), (code, name)
    x, y = to_epsg5070(42.03, -93.63)
    assert abs(x - 194867.1) < 1 and abs(y - 2116698.2) < 1, (x, y)  # checked against CropScape's own echo
    assert year_row(2020, 1, 'Corn')['crop'] == 'maize'
    assert year_row(2020, 141, 'Deciduous Forest')['crop'] is None
    print('cropscape_history: self-check passed')


def main():
    fields = {}
    for field_id, c in FIELDS.items():
        x, y = to_epsg5070(c['lat'], c['lon'])
        years = []
        for year in YEARS:
            url = f'{ENDPOINT}?year={year}&x={x:.1f}&y={y:.1f}'
            body = fetch(url)
            if year == YEARS[-1] and field_id == 'demo-iowa':
                with io.open(SAMPLE, 'w', encoding='utf-8', newline='\n') as f:
                    f.write(body.replace('\r', '').rstrip('\n') + '\n')
            code, name = parse_cdl_value(body)
            years.append(year_row(year, code, name))
            print(field_id, year, code, name)
        fields[field_id] = {'centroid': c, 'x5070': round(x, 1), 'y5070': round(y, 1), 'years': years}
    out = {
        'meta': {
            'retrievedAt': datetime.datetime.now(datetime.timezone.utc).date().isoformat(),
            'script': 'scripts/cropscape_history.py',
            'sourceUrl': ENDPOINT,
        },
        'datasetId': 'usda-cropscape',
        'fields': fields,
    }
    with io.open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print('wrote', OUT)


if __name__ == '__main__':
    if '--check' in sys.argv:
        self_check()
    else:
        main()
        self_check()
