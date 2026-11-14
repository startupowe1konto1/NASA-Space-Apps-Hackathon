# Handoff: frontend changes from the Sat 14 Nov team call

Written Sat 14 Nov 2026, about 22:40 CET, by O1 from the Fathom transcript of the team call (`context/meetings/2026-11-14-fathom-transcript.md`). The transcript is in PR #150, which is still open; until it merges, read it with `git show origin/o2/contract-fathom-transcript:context/meetings/2026-11-14-fathom-transcript.md`.

This file covers the app UI only. From about 17:19 the call is about the pitch, and a few remarks before that (animation, 3D models, the diorama) are about the pitch too; all of that is left out. Times in brackets, like (1:49), point to the transcript. The transcript is an automatic Polish transcript with misheard words, so where a remark is unclear this file says so instead of guessing.

`HANDOFF.md` (O1's state and working rules) stays as it is and still applies.

## Start here

1. Read `CLAUDE.md`, `HANDOFF.md`, `docs/SPEC.md` §7 (confidence), §12 (screens) and §13 (owner folders), `src/steps/design.md` and `docs/FRONTEND-SKILLS.md`.
2. Owners: `src/steps/` and `src/map/` are O2's folders; `src/app/`, `src/ui-kit/`, `e2e/` and `docs/` are O1's. A change outside your folders is a separate `[contract]` PR.
3. Open PRs that touch the same files: #141 (O2 review follow-ups in `src/map/` and `src/steps/`) and #143 (KIEG parcel layer, split and merge, in `src/map/`). Do not start the field-step work below until both are merged, or you will rebase into conflicts.
4. Use `ui-ux-pro-max` for the layout work and `impeccable` for the audit before a PR (repo rule).

Steps today (`src/app/App.tsx:18`): 1 goal, 2 field (`MapStep`), 3 crops, 4 priorities, 5 rotations, 6 money, 7 report.

## What the team asked for, screen by screen

### A start page before step 1 (0:48–1:21, 15:17–15:25)

The language buttons exist (in the header, `App.tsx:83`), but the app opens straight on the goal question. The team wants one simple page first: the app name, a one-sentence description, and the language choice, possibly with the region (1:13). Mateusz: "it can be simple, nothing complicated" (1:21), and the page needs a better layout. The name is not final (D13), so use the working name from `src/app/brand.ts` and keep it in one place.

### Field before goal (1:49, 15:37)

Swap steps 1 and 2: the farmer picks the place first, then the goal. This touches more than the `steps` array:

- `STEP_COUNT`, the `app.step.*` labels and the progress bar in `App.tsx`;
- the share link, which opens step 7 by number (`src/steps/report/shareLink.ts:98`, `goToStep(7)`);
- `e2e/helpers.ts` (`walkToPriorities` clicks through steps 1–4 in order) and the step tests;
- SPEC §12 and D9, which says the goal is "chosen first". Add a DECISIONS line for the new order.

Do this together with the start page, since both change the step list.

### Field step: search only, and outline the field (1:49–4:22, 6:32)

- Remove the two demo buttons (`src/map/MapStep.tsx:87–91`) and keep "find address or place". In the demo the farmer types an Iowa address (3:23). Keep `demoFields` in `src/fixtures`: tests read their values from it. `e2e/demo-fields.spec.ts` and `e2e/helpers.ts` press the demo buttons, so they must switch to the search box in the same change (or keep a test-only way in).
- After a search hit, find the field and outline its edges, then let the farmer accept it (3:57–4:22). Today a hit only moves the map (`MapStep.tsx:95`, `showPlace`); the field is added only by a tap. `addFieldAt` in `src/map/parcels/tap.ts` already returns the ULDK parcel outline in Poland and a 4 ha square elsewhere. A first version: call `addFieldAt(lat, lon)` for the search hit and show the outline with an accept button.
- Iowa has no outline source. None of the allowed sources (SPEC §15) gives US field boundaries, so an Iowa field stays a 4 ha square or a drawn outline. A new boundary source means asking a human first. Oskar doubted there is time for the outline at all (4:22).
- Places without data (2:37): Mikołaj wants a few places that work and a clear "not available yet" message everywhere else. Today the engine compares rotations only in the USA and Poland and shows `empty.outside-coverage` on step 5 (`src/engine/analyzeField.ts:245`). The prices, payments and rules cover Iowa and Wielkopolska, though, so check what a field in, say, Kansas or Podlasie shows, and whether the message should come right after the search instead of on step 5. Mikołaj also asked for a few more comparison places; that needs data, so it is an open question below.
- A country choice came up (1:49), and Fathom's summary line says "set country/region default". Where it goes is not clear from the call; see the open questions.

### Crops, step 3: no change (7:48)

Mateusz: "in step 3 we remove nothing and change nothing". The farmer confirms what was planted.

### Priorities, step 4: no change (7:48, 8:10)

The switches and filters work. Mateusz added "except what just broke with the text" (8:12): some text broke on screen during the call, and the transcript does not say where. Reproduce it on steps 3–5 for both demo places, in both languages and at phone width.

### Rotations, step 5: shorter, with less shown at once (8:16–11:54)

This step got the most comments. Wojciech: too much text at once, "a wall of text"; hide more of it so it does not all show at once; the data sources should be collapsed and open on a tap; it should read as short as the recommendations the team wrote at the last hackathon (8:16, 10:00).

The call did not say which parts to fold. A split that keeps the repo rules:

- Always visible: the rotation title, soil health and climate resilience first (D9), the goal total, the calendar strip, the gaps and local risks, and the closing support sentence. SPEC §11 makes the card end with "check the gaps and risks above", and the comment in `RotationCard.tsx` says gaps and risks are in the body, never a footnote, so do not fold them. Shorten them instead if they are long.
- Folded by default: "Why", "Evidence", "Benefits", "Twins" and the range note in `RotationCard.tsx`, and the whole `SourcesPanel` at the bottom of `RotationsStep.tsx`.
- Use a real disclosure (`<details>` or a button with `aria-expanded`). Tests that wait for text inside a folded section must open it first.

Other points on this step:

- Goal chosen twice (10:00). Wojciech: the farmer picks the main goal at the start, so why pick it again here (`GoalSwitcher`, `RotationsStep.tsx:54`). SPEC §12 lists the switcher on step 5 and says the goal is "changeable later". Removing it or turning it into one line ("Ranked for: Keep my soil, change") is a product choice; ask the user.
- The calendar strip (8:55–10:00). It is most likely the "map" they talked about: Wojciech described it as "the whole rotation with the crops plus the risk". Mateusz and Oskar were unsure it adds much, and Mikołaj said it is not for the pitch, but Wojciech wants it kept because it is simple to read. Nobody asked to remove it. Keep it.
- "Weak evidence" (10:00). Wojciech: find out why it shows up; the demo examples should not show it. Fathom's summary line says "remove 'weak evidence'", but hiding it breaks SPEC §7 and the gaps rule. The cause: when no soil indicator has a sourced rule, soil health falls back to the cover-only stand-in, which is always `weak` (`coverOnlyScore`, `src/engine/analyzeField.ts:121`). SPEC §7 defines `weak` as two or more missing inputs, so the stand-in does not match the spec. That is an engine and method question for O3 and the user, not a UI fix. Check on both demo fields whether soil health or climate resilience is the weak one. On the UI side there is one change that stays inside the spec: SPEC §7 asks for "a visible badge" and "the reason first in the gaps section", while the card today puts a large amber banner above the title (`RotationCard.tsx:53–71`). Moving the reason into the gaps section, with the badge next to the score, is allowed and makes the card shorter.
- Twins (11:54–12:22). Wojciech wanted them more visible. The team agreed not to add a twin step to the app ("it is part of the analysis"); they go into the pitch. The card keeps its twins section, folded with the rest.

### Money, step 6: still empty (16:01)

`src/steps/money/MoneyStep.tsx` is still the skeleton placeholder and shows "no data". Income already shows on each card (`IncomeSection`, #131). Mateusz said step 6 is in progress on his side and that the team will look at what it shows once everything is pushed. Ask him which branch before touching it, so the work is not done twice.

### Report, step 7: maybe a button, not a step (13:25–14:00)

The advisor report came out with the latest changes and "looks bad" (14:00). Wojciech doubts it needs its own step: it could be a button on the step before it. Nobody objected. Mateusz may have said something similar at 7:48 ("the next one can go, the report is already made in five"), but that sentence is cut. If the user confirms: drop step 7 from the progress bar, add a "Report for your advisor" button at the end of the last step that opens the print view (`ReportStep.tsx`), keep printing, point the share link (`shareLink.ts:98`) at the new place, and fix the layout. SPEC §12 lists step 7, so this needs a `[contract]` SPEC update and a DECISIONS line.

### Glossary in Polish (0:16, 13:25, 34:04): done

Merged as #151. Check it once at `?lang=pl` while testing the other changes.

## Open questions for the user

Ask these before building the part they block.

1. Country or region: a choice on the start page, on the field step, or taken from the search result? What is the default?
2. The goal switcher on step 5: remove it, or replace it with one line linking back to the goal step?
3. Step 7: confirm it becomes a button on the last step.
4. Soil quality typed in by the farmer (12:28–13:18). Oskar asked whether the tool knows the soil at a place, and if not, whether the farmer could type it in. The team was not sure and wanted to ask. The tool already reads soil: SSURGO for US points and SoilGrids elsewhere (`src/engine/analyzeField.ts:91–100`). It does not forecast yields (repo rule), so a typed soil value could only correct the soil data that the existing rules use. Fathom's summary line: "Clarify w/ team: soil-quality input and twin/forecast handling".
5. Field outline for Iowa: accept the 4 ha square and the drawing tool, or look for a boundary source (a human decides on any new source)?
6. More comparison places (2:37): which ones, and is there data for them?
7. "Weak evidence" on the demo fields: does O3 change how the soil stand-in sets its confidence, or does the team keep it and only move the banner?

## Suggested order

The deadline is Sun 15 Nov, 11:59 CET. Small, low-risk UI changes first:

1. Step 5: fold sections, fold the sources panel, move the weak-evidence reason into the gaps (O2 folder, UI only, no open question).
2. Find the text that broke on the call (step 3–5) and fix it.
3. Step 7 as a button, after the user confirms.
4. The field step: drop the demo buttons, add the field on a search hit, update e2e in the same change. After #141 and #143 merge.
5. The start page and the field-before-goal swap, together, last: they change step numbers in the app, the share link and e2e.

Each of these is its own PR with the usual gate (`git fetch && git rebase origin/main && npm run typecheck && npm run test && npm run build && npm run validate:data`). Every screen keeps its loading, offline, no-data and error states. English UI text goes through the anti-ai-writing skill, and every new key needs its Polish line in `pl.json` (the i18n parity test checks the ids). Check each change on localhost with both demo places, both languages and a phone-width window.
