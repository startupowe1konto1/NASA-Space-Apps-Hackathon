# Handoff v2.1: frontend changes after the Sat 14 Nov team call

v2.1 (Sat 23:10 CET): owners per step, and the user's answers on the Iowa outline and the share link.

v1 (#155, Sat 22:30) was written from the Fathom transcript of the team call. This v2 (Sat 22:40 CET) adds the user's decisions, written after the call, step by step; where they differ from the transcript, the decisions win. The transcript is `context/meetings/2026-11-14-fathom-transcript.md` (merged in #160, which replaced #150). Times in brackets, like (1:49), point to it.

This file covers the app UI only; the pitch part of the call is left out. `HANDOFF.md` (O1's state and working rules) still applies. Its v8 (#154) has the full analysis of step 6.

## Start here

1. Read `CLAUDE.md`, `HANDOFF.md`, `docs/SPEC.md` §7 (confidence), §12 (screens) and §13 (owner folders), `src/steps/design.md` and `docs/FRONTEND-SKILLS.md`.
2. Owners: `src/steps/` and `src/map/` are O2's folders; `src/app/`, `src/ui-kit/`, `e2e/` and `docs/` are O1's; `src/engine/` is O3's. A change outside your folders is a separate `[contract]` PR.
3. The #76 review follow-ups (#157) and the KIEG parcel layer with split and merge (#159, replacing #143) are on `main`. They changed `RotationCard.tsx`, `RotationsStep.tsx` and `MapStep.tsx`, so rebase any older branch first.
4. Use `ui-ux-pro-max` for the layout work and `impeccable` for the audit before a PR (repo rule).

## The new flow (user's decision)

| Now | After |
|---|---|
| (none) | start page: app name and a short description of what the app does; not a numbered step |
| 1 Goal | 2 Goal |
| 2 Field | 1 Field |
| 3 Crops | 3 Crops, no change |
| 4 Priorities | 4 Priorities, better text layout |
| 5 Rotations | 5 Rotations, shorter, folded, no goal switcher |
| 6 Money | 6 Money, needs a working preview |
| 7 Report | removed |

Owners (the user, Sat 23:10): O1 builds the start page, steps 1–4 and the removal of step 7, following `docs/superpowers/plans/2026-11-14-o1-steps-0-4.md`. O3 and O4 build steps 5 and 6.

The swap, the start page and the removal of step 7 all change the step list, so do them in one PR. It touches:

- the `steps` array (`src/app/App.tsx:18`), `STEP_COUNT` in `src/app/store.ts`, the `app.step.*` labels and the progress bar;
- the share link, which opens step 7 by number (`src/steps/report/shareLink.ts:98`, `goToStep(7)`);
- `e2e/helpers.ts`: `walkToPriorities` picks the goal first, then the field;
- SPEC §12 (step table) and D9 ("the farmer's main goal, chosen first"): a `[contract]` PR with a DECISIONS line for the new order and for dropping step 7.

## Per step

### Start page (new)

User: before step 1, a screen with the app name and a short description of what the app does. Take the name from `src/app/brand.ts` (D13: the final name comes at the end, so keep it in one place). The language buttons stay in the header (`App.tsx:83`). On the call the team also asked for a better layout and "nothing complicated" (1:21).

### Step 1, field (was step 2)

User: remove the two demo tiles, Iowa and Poznań (`src/map/MapStep.tsx:118–125`). In the pitch animation, someone types the address of an Iowa field and the app outlines that field along its edges.

- Keep `demoFields` in `src/fixtures`: tests read their values from it. `e2e/demo-fields.spec.ts` and `e2e/helpers.ts` press the demo buttons, so switch them to the search box in the same PR.
- Today a search hit only moves the map (`MapStep.tsx:127`, `showPlace`); a field is added only on the map itself (a tap, the parcel layer or drawing). `addFieldAt` in `src/map/parcels/tap.ts` returns the ULDK parcel outline in Poland and a 4 ha square anywhere else. First change: call `addFieldAt(lat, lon)` for the search hit, show the outline, and let the farmer accept it.
- Iowa: none of the allowed sources (SPEC §15) gives US field boundaries. The user's answer: tracing the field by hand is fine, but in the animation the search must fit the field by itself. So a search hit (or a tap) within 1 km of the Iowa demo field takes the demo field's stored outline; anywhere else in the US it is still the 4 ha square to redraw.

### Step 2, goal (was step 1)

No change to the screen, only its place in the flow.

### Step 3, crops

User: OK as it is.

### Step 4, priorities

User: improve how the text on this step is shown. On the call some text broke on screen around this step (8:12, "except what just broke with the text"); the transcript does not say what. Open `PrioritiesStep.tsx` on both demo places, in both languages and at phone width, find what wraps or overflows, and fix the layout of the switch labels and their one-line explanations.

### Step 5, rotations

User's decisions:

- Hide more: fold most of the card and the data sources. No wall of text.
- Keep the meaning of everything. Fold, do not delete.
- Remove the goal choice from this step, because the farmer picks the goal at the start.
- Simple, shorter recommendations.
- Look into "weak evidence" (analysis below).

How, inside the repo rules:

- Always visible on a card: the rotation title, soil health and climate resilience first (D9), the goal total, the calendar strip, gaps and local risks, and the support sentence. SPEC §11 makes the card end with "check the gaps and risks above", so gaps and risks stay unfolded; shorten them instead.
- Folded by default: "Why", "Evidence", "Benefits", "Twins" and the range note (`RotationCard.tsx`), and the whole `SourcesPanel` (`RotationsStep.tsx:80`). Use `<details>` or a button with `aria-expanded`. Tests that wait for text inside a folded section must open it first.
- Goal switcher: remove `<GoalSwitcher>` (`RotationsStep.tsx:60`) and the second sentence of `steps.rotations.intro` ("Tap a goal to reorder them."). Keep the `goalNoData` notice: it still says when the chosen goal has no data and the cards fall back to "Keep my soil". The farmer changes the goal by going back to step 2. SPEC §12 lists the switcher on step 5, so it goes into the same `[contract]` SPEC update.
- Shorter recommendations: the texts come from engine message codes in `src/engine/messages/en.json` and `pl.json` (O3's folder). On the card, show the first "Why" line and fold the rest. Shortening the texts themselves is a separate `[contract]` PR, and every Polish line changes with its English one.

#### "Weak evidence": what causes it

The user's screenshot shows an Iowa card (Option 1, Alfalfa → Oats → Oats): an amber "Read this first" banner above the title, "Low confidence in the soil health score: two or more of its inputs or rules are missing", and a second "Weak evidence" badge under the soil health bar, whose basis reads "Weighted mean of 3 soil health indicators. Not scored: organic matter."

- Organic matter is never scored for Iowa. The engine reads the humus rows for Poland only (`src/engine/rules.ts:229`, `if (country === 'PL')`), although each humus row in `data/rules/humus.json` says "for a field outside Poland they are a borrowed value".
- The soil health total takes its weakest indicator's confidence and drops one more level when an indicator is missing (`src/engine/soilHealth.ts:443`; the rule is in the comment at line 46). An indicator is one level down when its rule has one value and no range (several Iowa rows do, for example the red clover N credit and the soybean pest-break row) or when an input is missing. In the screenshot at least one indicator is one level down, and the missing organic matter adds the second level: `weak`. This is the engine working as designed, not a UI bug, so most Iowa cards will show it until the rules change.
- The screenshot is Iowa. Check the Poznań cards too.

Two separate fixes:

1. UI, inside the spec (O2, can start now): SPEC §7 asks for "a visible badge" and "the reason first in the gaps section". The card shows the badge twice and adds a banner above the title (`RotationCard.tsx:53–71`). Drop the banner, keep the badge next to the score, and put the reason first in the gaps. The card gets shorter and still says it.
2. Engine (O3, the user decides): score organic matter for Iowa with the borrowed Polish coefficients and a gap line that says so. That removes the missing indicator, so the Iowa total would be at most one level down. See open question 2.

### Step 6, money

User: the step stays, and the backend has to be fixed so that it shows a preview. Today `src/steps/money/MoneyStep.tsx` is the skeleton placeholder with the out-of-date text "Prices and payment rates are not loaded yet". The O1 analysis in `HANDOFF.md` v8 (#154) found that each rotation already carries its money data (`RotationOption.money`, `income`), so a first version can reuse `IncomeSection` without a contract change. Costs and revenue per crop are not in the contract yet. The user gave steps 5 and 6 to O3 and O4 (Sat 23:10); they agree between them who takes which.

### Step 7, report

User: remove it, and the share link with it (Sat 23:10). O1 does this in the same PR as the new flow; `src/steps/report/` goes away, and an old `#s=` link just opens the start page.

## Open question for the user

"Weak evidence" in Iowa: should O3 use the borrowed Polish humus coefficients for US fields, or should Iowa stay at `weak` with only the UI change?

From the call, but not in the user's decisions, so nobody builds them unless the user asks: a country or region choice (1:49), a typed-in soil quality (12:28–13:18; the app already reads SSURGO in the US and SoilGrids elsewhere, and it does not forecast yields), more comparison places, and a "not available yet" message right after the search for places without data (2:37; today it shows only on step 5, `empty.outside-coverage`).

## Order

The deadline is Sun 15 Nov, 11:59 CET.

O1, in this order (the plan has the tests):

1. O1-F1: the new flow in one PR: start page, field and goal swapped, step 7 and the share link removed, SPEC §12 and DECISIONS updated, e2e updated.
2. O1-F2: step 1: drop the demo tiles, add the field on a search hit (the Iowa demo outline near the demo field), switch e2e to the search box.
3. O1-F3: step 4: the text layout.

O3 and O4: step 5 (fold the sections and the sources, remove the goal switcher, drop the weak-evidence banner) and step 6. Step 5 touches `RotationsStep.tsx` and `RotationCard.tsx`, which O1-F1 does not, so the two can run at the same time; rebase after O1-F1 merges, because the step numbers change.

Each item is its own PR with the gate (`git fetch && git rebase origin/main && npm run typecheck && npm run test && npm run build && npm run validate:data`). Every screen keeps its loading, offline, no-data and error states. English UI text goes through the anti-ai-writing skill, and every new key gets its Polish line in `pl.json` (the i18n parity test checks the ids). Check each change on localhost with both demo places, both languages and a phone-width window.
