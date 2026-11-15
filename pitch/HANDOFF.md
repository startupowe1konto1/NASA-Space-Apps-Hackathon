# Pitch deck: handoff for a fresh session

Written Sun 15 Nov 2026, about 01:45 CET, by the lead session of the deck, at the pitch owner's request. Read `CLAUDE.md`, then this file, then `pitch/SPEC.md` and `pitch/PLAN.md` where something here points to them. This file wins where they differ: it records the pitch owner's later decisions.

## Where things are

- Branch `o2/contract-pitch-deck`, worktree `/Users/wojciechrudnicki/Code_projects/NASA-wt-o2-pitch`. Work there, or in a new worktree cut from this branch. Never in the main folder.
- Deck: `pitch/deck/` (static page, own `package.json`). Install: `cd pitch/deck && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci`.
- Serve without caching (Python's server makes the browser keep old modules): `python3 -I pitch/deck/scripts/serve-nocache.py 8767 <abs path to pitch/deck>`, then `http://127.0.0.1:8767/`. `#<slide>.<step>` opens a step; `?print=1#n.0` shows a slide's final state.
- Screenshot check (own system Chrome per run, so parallel tasks don't collide): `node scripts/shoot.mjs "<url>" out.png [waitMs] [w] [h] [keys] [keyGapMs]` from `pitch/deck`. It prints console messages and `errors: N`. Look at every image.
- PDF: `npm run pdf` (fails while the app screenshots are missing), `npm run pdf -- --allow-missing` for a rehearsal PDF. Video: `npm run record`. Outputs go to `pitch/out/` and `pitch/deck/assets/stills/`; they are not committed.
- Data: `sh pitch/deck/scripts/export-data.sh` from the repo root writes `pitch/deck/data/field.json` from the app's engine. The branch must contain the current `main` first (`git merge origin/main`).

## Rules from the pitch owner (newer than SPEC)

1. **One key press plays a whole slide, on every slide.** `src/stage.js` plays a slide's steps in a row; a press during the sequence jumps to its end. No slide takes one press per step any more (`manual: true` is still supported, unused). Check with `node scripts/walk.mjs <outDir>` from `pitch/deck`.
5. **Seven slides, seven PDF pages** (owner, Sun 15 Nov ~09:50): orbit, Mariusz, data, regions, app 1 (screenshots 01 and 02), app 2 (screenshots 03 and 04, then the judgment sentence), close.
6. **The engine slide is parked**, not deleted: `SHOW_ENGINE_SLIDE` in `src/constants.js` (false). true puts "replay on the field" back as slide 4 and makes the deck 8 slides. Slides are listed by name in `stage.js`; styles and scripts find a slide by `data-name`, so numbers may shift safely.
7. **Slide titles 2 to 6 are the owner's wording** (Sun 15 Nov ~10:00). The slide files are the source for on-screen text; the titles and steps in `SPEC.md` describe the earlier deck.
8. If a change seems not to show in the owner's browser, it is the browser's module cache: Cmd+Shift+R, or serve on a new port.
2. **Slides must be very simple.** Three minutes in total; one idea per slide.
3. Slide 1 is approved. Slide 5 (similar regions) is approved ("top"). Slide 7 (zoom out to orbit) is approved.
4. Every number on a slide comes from `field.json`; the deck throws if a table and the data disagree. Keep it that way.

## State per slide

| Slide | State |
|---|---|
| 1 Orbit | Approved. |
| 2 Mariusz | Reworked to the owner's order: the descent lands on the parcel, then title, facts and notebook together, then the `2027 ?` row. Not yet seen by the owner after the change. |
| 3 Data | Reworked: lower camera (`data` view in `scene.js`), five sheets 140 m apart so they don't overlap, each label at the height of its layer. The owner said the first try was too spread; the current one is tighter. Not yet seen by the owner after that. |
| 4 Engine | **Open, the owner has not decided.** The deck still runs the first version (`src/slides/04-engine.js`, commit `2c26b23`: year ribbon plus four rotation rows with bars and whiskers). The owner rejected it as too complex. See "Slide 4" below. |
| 5 Regions | Approved. Should play in one press (dots and table after the rise) through the stage change; check it live once. |
| 6 The tool | Frame, cross-fade of four app screenshots, closing lines. Screenshots missing until P8 (shows "Screenshot pending"). |
| 7 Close | Approved. Sources table built from `field.json`; GUGiK added from `field.source` (commit `2ff70d2`). |

## Slide 4: what was tried, what is open

- **Rejected:** the first version (four rows, whiskers, playhead, reordering) and a simpler two-row version (`pitch/deck/prototype/slide4-options/two-rows-rejected.png`). The owner: too much data, does not explain how the tool works.
- **Drafted, not decided:** "Replay on the field" (`prototype/slide4-options/replay-on-the-field.js`, screenshots `-mid.png` and `-final.png` next to it). A year counter runs 1981 to 2025, the field shows each year's crop of the rotation and turns red in drought years; first Mariusz's rotation, then the best one, each ending in its two scores. It needs `scene.fieldTint`, which is already in `src/scene.js`. To try it: copy the file over `src/slides/04-engine.js`.
- **Other concepts offered, not built:** "Two fields side by side" (two copies of the parcel, Mariusz's rotation and the best one, replayed together, scores above each) and "Sieve" (a cloud of small tiles, each a possible rotation, passes a 45-year filter; three green ones and Mariusz's grey one remain). The sieve must not imply a number of candidates: the export does not contain it.
- Constraints for any version: no per-year result of a rotation (the export has none); soil health and climate resilience first; "forecast" only as "not a forecast"; numbers from `field.json`. Current values: Mariusz 27 soil / 77 climate, best for the soil goal 58 / 69, 9 drought years in 45.

## To do

1. **Slide 4**, once the owner picks a concept.
2. **Check slides 2, 3 and 5 live** with one press each, from the previous slide (`shoot.mjs` with `ArrowRight`). In zsh, do not loop over `"a b c"` strings with `set -- $spec`: zsh does not split them, and the test silently opens slide 1.
3. **P8, app screenshots** for slide 6, after the owner says the app's UI is frozen: `scripts/shoot-app.mjs` (spec in `PLAN.md` P8), four PNGs in `assets/app/`. Then check that the shrunken screenshot on step 5 of slide 6 is readable.
4. **Rerun the export** before the freeze (`main` keeps changing; the last run was `main` at `030ad74`). The slides read every number from `field.json`, so nothing else needs updating.
5. **P12 final checks** (list in `PLAN.md`): numbers on the stills equal `field.json`; `grep -rin forecast pitch/deck/src` shows only "not a forecast"; no NASA logo; slide 1 names team, members, challenge; PDF has 7 pages; `~/.local/bin/trufflehog git file://. --no-update` is clean.
6. **Final PDF and video.** The descent hold in `record.mjs` is 6.5 s; check that the recording does not swallow a key after the descent.
7. **PR `[contract] Pitch deck`** from this branch to `main`, only after the owner says yes. The branch contains merges of `main` and of the task branches; rebase or squash as O1 prefers.
8. **People (P13):** a timed run-through of the talk (target 2:50 to 3:05), the deck once on the pitch laptop on a second screen, upload the PDF, open its link in a private window.

## Decisions for the owner

| # | Question | Default if nobody decides |
|---|---|---|
| a | Slide 4 concept: replay on the field, two fields, sieve, or something else. | Keep the current slide 4. |
| b | The satellite on slides 1 and 7 covers part of Europe and grazes the "Built with AI assistance" line on 7. Move it? | Leave it. |
| c | Slide 6: keep the line "Two things are on every card." above "What we do not know / Check locally"? | Keep it. |
| d | Project name (D13). The deck reads `PROJECT_NAME` in `pitch/deck/src/constants.js` ("Field Shift tool" today). | "Field Shift tool". |
| e | Is the app hosted? Its URL goes into `APP_URL` in `constants.js` (slide 7 then prints the link). | No link. |
| f | The PDF is 13.8 MB (PNG pages). Make it about 3 MB with JPEG pages? | Leave it. |
| g | GUGiK ULDK in the app's dataset registry (`HANDOFF-O2-gugik-uldk-dataset.md`, merged in #185; not implemented). It is O2's lane. A session card was offered. After it lands, add `gugik-uldk` to the export's used ids and rerun: slide 3 then says 14 datasets. | The deck names GUGiK anyway; the count stays 13. |

## How the work was run

- One lead session owns the shared files (`index.html`, `src/stage.js`, `src/scene.js`, `src/tokens.css`, `src/constants.js`, `src/crops.js`) and merges task branches into `o2/contract-pitch-deck`. Tasks ran as subagents in their own worktrees (`../NASA-wt-pitch-p1` … `p11`, all merged; safe to remove with `git worktree remove`).
- Commit after each finished task; no PR until the owner says yes; answer the owner in Polish, write repo and slide text in English.
- The owner's global rules apply: English text through the anti-ai-writing check. The repo is English only; there are no speaker notes in it.
