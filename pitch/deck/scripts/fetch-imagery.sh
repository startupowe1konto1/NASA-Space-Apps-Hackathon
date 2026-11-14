#!/bin/sh
# Fetches the NASA GIBS imagery used by the pitch deck (Poznan field).
# Run from pitch/deck:  sh scripts/fetch-imagery.sh
# Source: https://gibs.earthdata.nasa.gov (WMS, EPSG:4326). BBOX order is south,west,north,east.
set -eu

if [ ! -f data/field.json ]; then
  echo "run from pitch/deck (data/field.json not found)" >&2
  exit 1
fi

WMS="https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&STYLES=&CRS=EPSG:4326"

# Region box for the Europe frame: every twin place and the field centroid,
# plus a 250 km margin on every side. 1 deg lat = 111 km; 1 deg lon = 111 km * cos(lat),
# with cos taken at the southern latitude of the box so the lon margin is never too small.
# Long side = 2048 px, the other side proportional.
EUROPE=$(node -e '
const f = require("./data/field.json");
const pts = f.twins.cases.map(c => c.place).concat([f.field.centroid]);
const MARGIN_KM = 250;
let s = Math.min(...pts.map(p => p.lat)), n = Math.max(...pts.map(p => p.lat));
let w = Math.min(...pts.map(p => p.lon)), e = Math.max(...pts.map(p => p.lon));
const dLat = MARGIN_KM / 111;
s -= dLat; n += dLat;
const dLon = MARGIN_KM / (111 * Math.cos(s * Math.PI / 180));
w -= dLon; e += dLon;
const latSpan = n - s, lonSpan = e - w;
let width, height;
if (lonSpan >= latSpan) { width = 2048; height = Math.round(2048 * latSpan / lonSpan); }
else { height = 2048; width = Math.round(2048 * lonSpan / latSpan); }
const r = (x) => x.toFixed(4);
console.log([r(s), r(w), r(n), r(e), width, height].join(" "));
')
set -- $EUROPE
EU_BBOX="$1,$2,$3,$4"
EU_W=$5
EU_H=$6
echo "europe box (S,W,N,E): $EU_BBOX  size: ${EU_W}x${EU_H}"

fetch() {
  # $1 output file, $2 query string (LAYERS/TIME/BBOX/WIDTH/HEIGHT/FORMAT)
  echo "fetching $1"
  curl -fsS -o "$1" "$WMS&$2"
}

# 1. Local view: HLS Sentinel-2/Landsat 30 m, 13.3 km box at native resolution (30 m per pixel).
fetch assets/img/poznan-local.png \
  "LAYERS=HLS_S30_Nadir_BRDF_Adjusted_Reflectance&TIME=2025-06-13&BBOX=52.3995,17.0205,52.5190,17.2166&WIDTH=444&HEIGHT=444&FORMAT=image/png"

# 2. Regional view: MODIS Terra true colour, 445 km box.
# Date 2025-03-20: 2025-06-13 had about a third cloud on the right side of the frame.
fetch assets/img/poznan-region.jpg \
  "LAYERS=MODIS_Terra_CorrectedReflectance_TrueColor&TIME=2025-03-20&BBOX=50.4593,13.8378,54.4593,20.3992&WIDTH=2048&HEIGHT=2048&FORMAT=image/jpeg"

# 3. Europe frame: Blue Marble, no TIME.
fetch assets/img/europe-wide.jpg \
  "LAYERS=BlueMarble_ShadedRelief_Bathymetry&BBOX=$EU_BBOX&WIDTH=$EU_W&HEIGHT=$EU_H&FORMAT=image/jpeg"

echo "done"
