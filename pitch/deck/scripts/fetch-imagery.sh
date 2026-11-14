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

# Europe frame: a fixed box that fills the whole 1920 x 1080 frame of the `europe` rest view in
# src/scene.js. The view has to show every twin place and the field in the strip between the text block
# (top left) and the table (right), at about 1.9 km per screen pixel, so the camera sees roughly
# 3700 x 2100 km, more at the top edge because the view is tilted. A box of only the twin places plus a margin leaves black edges in that frame.
# Equal degrees per pixel (EPSG:4326): 70 deg x 30 deg -> 3584 x 1536 px.
EU_BBOX="36,-20,66,50"
EU_W=3584
EU_H=1536
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

# 3. Europe frame: Blue Marble, no TIME. Check the box above against VIEW.europe in src/scene.js.
fetch assets/img/europe-wide.jpg \
  "LAYERS=BlueMarble_ShadedRelief_Bathymetry&BBOX=$EU_BBOX&WIDTH=$EU_W&HEIGHT=$EU_H&FORMAT=image/jpeg"

echo "done"
