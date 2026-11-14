"""Mean slope (percent) over each demo field polygon from NASADEM (1 arc-second, about 30 m) on Microsoft
Planetary Computer.

Run from the repo root:  python -I scripts/nasadem_slope.py           (needs numpy and rasterio; writes the JSON)
                         python -I scripts/nasadem_slope.py --check   (parses the saved STAC sample, tests the slope
                                                                       maths on a synthetic plane; numpy only)

Steps per field:
 1. STAC search (planetarycomputer.microsoft.com/api/stac/v1/search, collection "nasadem") for the tile under the
    centroid. Response sample: data/samples/nasadem/stac_search_demo-iowa.json.
 2. Anonymous SAS token for the collection (planetarycomputer.microsoft.com/api/sas/v1/token/nasadem). The token is
    appended to the blob URL in memory only; it is never written to a file or printed.
 3. Read a window around the polygon from the Cloud-Optimized GeoTIFF with rasterio (HTTP range requests).
 4. Take the pixels whose centres fall inside the field polygon. Distances in metres from degrees with 111,320 m
    per degree of latitude and 111,320 x cos(lat) per degree of longitude (spherical, under 1% off here).
 5. meanSlopePct = gradient of the least-squares plane through those pixels, 100 x sqrt(a^2 + b^2) for
    z = a*x + b*y + c. pixelMeanSlopePct = mean of per-pixel slopes from numpy.gradient (central differences).

Why the plane: NASADEM elevations are whole metres with about 2 m of noise on flat land (residualStdM). On the
demo fields that noise alone gives per-pixel slopes of 4-5 %, while the SSURGO map unit of the Iowa field says
0-2 % slopes. The plane averages the noise out and gives the field's overall slope; pixelMeanSlopePct is kept
for comparison and is an upper bound on flat fields.

Writes data/precomputed/slope.json:
  { "meta": {...}, "datasetId": "nasadem", "method": "...",
    "fields": { "<fieldId>": { "centroid", "meanSlopePct", "pixelMeanSlopePct", "residualStdM", "pixelCount",
                               "tile" } } }
meanSlopePct is null with "missingReason" when the tile cannot be read.
"""
import datetime
import io
import json
import math
import sys
import time
import urllib.parse
import urllib.request

STAC_SEARCH = 'https://planetarycomputer.microsoft.com/api/stac/v1/search'
SAS_TOKEN = 'https://planetarycomputer.microsoft.com/api/sas/v1/token/nasadem'
OUT = 'data/precomputed/slope.json'
STAC_SAMPLE = 'data/samples/nasadem/stac_search_demo-iowa.json'
M_PER_DEG = 111_320.0


def rectangle(lat, lon, width_m, height_m):
    """Same rectangle as src/fixtures/fields.ts (GeoJSON ring, [lon, lat])."""
    half_lat = height_m / 2 / M_PER_DEG
    half_lon = width_m / 2 / (M_PER_DEG * math.cos(math.radians(lat)))
    r = lambda n: round(n * 1e6) / 1e6
    w, e, s, n = r(lon - half_lon), r(lon + half_lon), r(lat - half_lat), r(lat + half_lat)
    return [[w, s], [e, s], [e, n], [w, n], [w, s]]


# Keep in sync with src/fixtures/fields.ts.
FIELDS = {
    'demo-iowa': {'lat': 42.0305, 'lon': -93.497, 'ring': rectangle(42.0305, -93.497, 600, 400)},
    'demo-poznan': {'lat': 52.45, 'lon': 17.1, 'ring': rectangle(52.45, 17.1, 400, 200)},
}


def request(url, data=None, attempts=4):
    last = None
    for attempt in range(attempts):
        try:
            headers = {'User-Agent': 'field-shift-tool/0.1 (NASA Space Apps 2026 build script)'}
            if data is not None:
                headers['Content-Type'] = 'application/json'
            with urllib.request.urlopen(urllib.request.Request(url, data=data, headers=headers), timeout=60) as r:
                return r.read().decode('utf-8').replace('\r', '')
        except Exception as error:
            last = error
            time.sleep(2 + 3 * attempt)
    raise RuntimeError(f'{url.split("?")[0]}: {last}')


def parse_stac(text):
    """STAC search response (see STAC_SAMPLE) -> (item id, elevation COG URL) of the first item."""
    features = json.loads(text)['features']
    if not features:
        raise ValueError('no NASADEM tile for this point')
    return features[0]['id'], features[0]['assets']['elevation']['href']


def point_in_ring(x, y, ring):
    inside = False
    for (x1, y1), (x2, y2) in zip(ring, ring[1:]):
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            inside = not inside
    return inside


def slope_stats(elev, lon0, lat0, dlon, dlat, ring):
    """elev: 2-D numpy array, row 0 at the north; (lon0, lat0) = centre of pixel [0, 0]; dlon > 0, dlat > 0 (deg).
    Returns {planeSlopePct, pixelMeanSlopePct, residualStdM, pixelCount} over pixel centres inside ring, or None."""
    import numpy as np

    lat_mid = lat0 - dlat * elev.shape[0] / 2
    m_lat = M_PER_DEG
    m_lon = M_PER_DEG * math.cos(math.radians(lat_mid))
    elev = elev.astype('float64')
    gy, gx = np.gradient(elev, dlat * m_lat, dlon * m_lon)
    pixel_slope = 100.0 * np.sqrt(gx ** 2 + gy ** 2)
    rows, coords, z, local = range(elev.shape[0]), [], [], []
    for i in rows:
        for j in range(elev.shape[1]):
            lon, lat = lon0 + j * dlon, lat0 - i * dlat
            if point_in_ring(lon, lat, ring):
                coords.append([(lon - lon0) * m_lon, (lat - lat0) * m_lat, 1.0])
                z.append(elev[i, j])
                if 0 < i < elev.shape[0] - 1 and 0 < j < elev.shape[1] - 1:
                    local.append(pixel_slope[i, j])
    if len(z) < 3:
        return None
    a = np.array(coords)
    zs = np.array(z)
    coef = np.linalg.lstsq(a, zs, rcond=None)[0]
    return {
        'planeSlopePct': float(100.0 * math.hypot(coef[0], coef[1])),
        'pixelMeanSlopePct': float(np.mean(local)) if local else None,
        'residualStdM': float(np.std(zs - a @ coef)),
        'pixelCount': len(z),
    }


def field_slope(field_id, f, save_sample):
    import rasterio
    from rasterio.windows import from_bounds

    body = json.dumps({'collections': ['nasadem'], 'limit': 1,
                       'intersects': {'type': 'Point', 'coordinates': [f['lon'], f['lat']]}}).encode('utf-8')
    text = request(STAC_SEARCH, data=body)
    if save_sample:
        write_text(STAC_SAMPLE, json.dumps(json.loads(text), indent=2))
    item_id, href = parse_stac(text)
    token = json.loads(request(SAS_TOKEN))['token']
    xs = [p[0] for p in f['ring']]
    ys = [p[1] for p in f['ring']]
    with rasterio.open(href + '?' + token) as src:
        a, e = src.transform.a, -src.transform.e
        win = from_bounds(min(xs) - 3 * a, min(ys) - 3 * e, max(xs) + 3 * a, max(ys) + 3 * e, src.transform)
        win = win.round_offsets().round_lengths()
        elev = src.read(1, window=win)
        t = src.window_transform(win)
        nodata = src.nodata
    if nodata is not None and (elev == nodata).any():
        return {'meanSlopePct': None, 'missingReason': 'NASADEM has no-data pixels in the field window',
                'tile': item_id}
    stats = slope_stats(elev, t.c + t.a / 2, t.f + t.e / 2, t.a, -t.e, f['ring'])
    if stats is None:
        return {'meanSlopePct': None, 'missingReason': 'fewer than 3 NASADEM pixels inside the polygon',
                'tile': item_id}
    return {'meanSlopePct': round(stats['planeSlopePct'], 2),
            'pixelMeanSlopePct': round(stats['pixelMeanSlopePct'], 2) if stats['pixelMeanSlopePct'] else None,
            'residualStdM': round(stats['residualStdM'], 2), 'pixelCount': stats['pixelCount'], 'tile': item_id}


def write_text(path, text):
    with io.open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text.rstrip('\n') + '\n')


def self_check():
    import numpy as np

    item_id, href = parse_stac(io.open(STAC_SAMPLE, encoding='utf-8').read())
    assert item_id.startswith('NASADEM_HGT_') and href.endswith('.tif'), (item_id, href)
    # synthetic plane rising 2 m per 100 m to the east at the Iowa latitude -> 2 %
    lat0, lon0, d = 42.04, -93.51, 1 / 3600
    dx = d * M_PER_DEG * math.cos(math.radians(lat0 - d * 30))
    elev = np.fromfunction(lambda i, j: 300 + 0.02 * dx * j, (60, 60))
    stats = slope_stats(elev, lon0, lat0, d, d, rectangle(42.03, -93.497, 600, 400))
    assert stats['pixelCount'] > 0 and abs(stats['planeSlopePct'] - 2.0) < 0.01, stats
    assert abs(stats['pixelMeanSlopePct'] - 2.0) < 0.01 and stats['residualStdM'] < 1e-6, stats
    print('nasadem_slope: self-check passed')


def main():
    fields = {}
    for field_id, f in FIELDS.items():
        try:
            record = field_slope(field_id, f, save_sample=field_id == 'demo-iowa')
        except Exception as error:  # keep the other field; the gap is visible in the file
            record = {'meanSlopePct': None, 'missingReason': f'NASADEM read failed: {type(error).__name__}'}
        fields[field_id] = {'centroid': {'lat': f['lat'], 'lon': f['lon']}, **record}
        print(field_id, record)
    out = {
        'meta': {
            'retrievedAt': datetime.datetime.now(datetime.timezone.utc).date().isoformat(),
            'script': 'scripts/nasadem_slope.py',
            'sourceUrl': 'https://planetarycomputer.microsoft.com/dataset/nasadem',
        },
        'datasetId': 'nasadem',
        'method': 'meanSlopePct = slope of the least-squares plane through the NASADEM pixels inside the polygon',
        'fields': fields,
    }
    write_text(OUT, json.dumps(out, ensure_ascii=False, indent=2))
    print('wrote', OUT)


if __name__ == '__main__':
    if '--check' not in sys.argv:
        main()
    self_check()
