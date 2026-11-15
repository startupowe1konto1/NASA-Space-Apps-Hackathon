#!/bin/sh
# Regenerates pitch/deck/data/field.json from the app's providers and engine.
# Run from the repo root, with node_modules installed: sh pitch/deck/scripts/export-data.sh [parcel id]
# The exporter is a vitest file because the app's modules need Vite; vitest only picks up tests under src/ and scripts/,
# so the file is copied into src/app/ for the run and removed afterwards.
set -e
cd "$(git rev-parse --show-toplevel)"
TMP=src/app/zz-pitch-export.test.ts
trap 'rm -f "$TMP"' EXIT
cp pitch/deck/scripts/export-data.test.ts "$TMP"
PITCH_OUT="$PWD/pitch/deck/data/field.json" PITCH_PARCEL="${1:-302116_5.0015.28/1}" npx vitest run "$TMP"
echo "Wrote pitch/deck/data/field.json"
