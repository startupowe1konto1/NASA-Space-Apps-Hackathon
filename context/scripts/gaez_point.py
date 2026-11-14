"""FAO GAEZ v4 (res05) point values via the public ArcGIS ImageServer. usage: gaez_point.py lat lon"""
import sys, json, time, urllib.parse, urllib.request
lat, lon = map(float, sys.argv[1:3])
B = "https://gaez-services.fao.org/server/rest/services/res05/ImageServer"
def get(path, **q):
    q["f"] = "json"
    req = urllib.request.Request(B + path + "?" + urllib.parse.urlencode(q), headers={"User-Agent": "curl/8.5.0"})
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.load(r)
crops = ["Wheat", "Maize", "Rapeseed", "Rye", "Soybean", "Sorghum", "Sunflower", "Pea"]
where = ("water_supply LIKE 'Rain%' AND input_level='High' AND variable IN ('Average attainable yield of current cropland','Crop suitability index in classes; all land in grid cell') "
         "AND crop IN (" + ",".join(f"'{c}'" for c in crops) + ") "
         "AND ((year='1981-2010' AND model='CRUTS32') OR (year IN ('2041-2070','2071-2100') AND model='ENSEMBLE' AND rcp IN ('RCP4.5','RCP8.5') AND c02_fertilization LIKE 'With CO2%'))")
t = time.time()
feats = get("/query", where=where, outFields="objectid,name,crop,year,rcp,variable,units,c02_fertilization", returnGeometry="false")
rows = [f["attributes"] for f in feats.get("features", [])]
print(f"{len(rows)} rasters matched ({time.time()-t:.1f}s)", feats.get("error", ""))
out = {}
for a in rows:
    r = get("/identify", geometry=json.dumps({"x": lon, "y": lat}), geometryType="esriGeometryPoint",
            mosaicRule=json.dumps({"mosaicMethod": "esriMosaicLockRaster", "lockRasterIds": [a["objectid"]]}),
            returnGeometry="false", returnCatalogItems="false")
    key = (a["crop"], a["year"] + ("" if a["rcp"] == "Historical" else " " + a["rcp"]))
    out.setdefault(key, []).append((a["name"], r.get("value"), a["units"]))
for k in sorted(out):
    print(k[0].ljust(10), k[1].ljust(20), out[k])
print(f"total {time.time()-t:.1f}s")
