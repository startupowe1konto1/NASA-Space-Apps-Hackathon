# Handoff for O2 (map): register GUGiK ULDK as a dataset

Written Sun 15 Nov 2026, 01:05 CET by the pitch-deck lead session, at the pitch owner's request. It changes no code.

## In one paragraph

Every Polish field gets its outline from GUGiK ULDK (`src/map/parcels/uldk.ts`), but no `datasets.ts` lists that service. So the app has no source entry for it, the References list that SPEC §16 generates from the registry leaves it out, and the pitch deck counts 13 datasets for its field without it. The fix is one entry in a new file, `src/map/datasets.ts`. `src/map/` is O2's folder (SPEC §13), so this is a normal O2 PR, not a `[contract]` one.

## Why it is missing

- `src/app/datasets.ts` builds the registry from every `src/*/datasets.ts` it finds (an `import.meta.glob`), plus the fixtures. `src/map/` has no `datasets.ts`, so nothing from the map module is in the registry.
- The outline is not a `Sourced` value in the analysis, so no `datasetIds` point at ULDK either. All that is left is the field's `source` text, which the pitch export shows as `GUGiK ULDK (land register parcel)`.

## What to do

1. Add `src/map/datasets.ts` that exports `datasets: Dataset[]` (type from `src/contracts/`) with one entry. Suggested values; copy the name and URL from the opened GUGiK page, as CLAUDE.md requires:

   | Field | Value |
   |---|---|
   | `id` | `gugik-uldk` |
   | `name` | `ULDK land register parcels` |
   | `provider` | `GUGiK` |
   | `url` | `https://uldk.gugik.gov.pl/` (the URL `uldk.ts` already calls) |
   | `nasa` | `false` |
   | `resolution` | `parcel` |
   | `period` | `current register` |
   | `kind` | `observation` |

2. Test first: the registry from `src/app/datasets.ts` contains `gugik-uldk`. Read the entry from the module; do not hard-code the registry's size, because other PRs change it.
3. Optional, only if it stays small: give the parcel outline on the field step a source entry with `datasetIds: ['gugik-uldk']`, like other sourced values. If it needs a contract change, leave it and say so in the PR.
4. Before the PR, run the CLAUDE.md gate: `git fetch && git rebase origin/main && npm run typecheck && npm run test && npm run build && npm run validate:data`.

## Effect on the pitch deck

- Once this is on `main`, the pitch lead adds `gugik-uldk` to the export's list of datasets used whenever `field.source` names ULDK (`pitch/deck/scripts/export-data.test.ts`, branch `o2/contract-pitch-deck`) and reruns the export. Slide 3 then says 14 datasets, and slide 7 lists GUGiK from the registry.
- If it does not land before the deck freeze (08:10), nothing breaks. Since commit `2ff70d2`, slide 7 names GUGiK from `field.source` and skips that line once the registry has the entry.

## Open question for O1

The map uses other outside services too: OpenStreetMap tiles, Nominatim, the US Census geocoder and the GUGiK KIEG parcel map. None of them gives a number to the analysis, and none is in the registry. Whether they belong in the References list (SPEC §16) is O1's call; this handoff covers ULDK only, because it is the one that shapes the field.
