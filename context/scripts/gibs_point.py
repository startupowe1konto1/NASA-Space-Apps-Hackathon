"""Read a SMAP value at a point from a GIBS WMS image + GIBS colormap (no login).
usage: gibs_point.py <colormap.xml> <layer> <lat> <lon> <date> [<date>...]"""
import sys, re, io, time, urllib.request
from PIL import Image
cm_path, layer, lat, lon, *dates = sys.argv[1:]
lat, lon = float(lat), float(lon)
cm = {}
for m in re.finditer(r'<ColorMapEntry rgb="(\d+),(\d+),(\d+)"[^>]*value="([^"]+)"', open(cm_path).read()):
    cm[tuple(map(int, m.group(1, 2, 3)))] = m.group(4)
d = 0.05  # small bbox around the point, 11x11 px
for date in dates:
    url = ("https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1"
           f"&LAYERS={layer}&SRS=EPSG:4326&BBOX={lon-d},{lat-d},{lon+d},{lat+d}&WIDTH=11&HEIGHT=11&FORMAT=image/png&TIME={date}&STYLES=")
    t = time.time()
    raw = urllib.request.urlopen(url, timeout=30).read()
    im = Image.open(io.BytesIO(raw)).convert("RGBA")
    r, g, b, a = im.getpixel((5, 5))
    val = cm.get((r, g, b), "?") if a else "no data (transparent)"
    if val != "?" and a:
        lo, hi = (re.findall(r"[-\d.]+", val) + ["inf"])[:2]
        val = f"{(float(lo)+float(hi))/2:.3f} m3/m3 (bin {val})"
    print(f"{date}\t{val}\t{time.time()-t:.2f}s")
