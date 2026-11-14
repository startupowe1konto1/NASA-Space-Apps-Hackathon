# Handoff v6: O1 (integrator) at Sat 20:20, for a fresh session

Written Sat 14 Nov 2026, 19:46 CET and updated at 20:20 by the O1 session. `main` is at `189e5ed` (#138). Earlier handoffs are in git history. The team now puts its effort on the frontend and the pitch.

## Start here

1. Read `CLAUDE.md`, `docs/PLAN.md`, `docs/DECISIONS.md` (D1–D46), then this file.
2. Get the time with `TZ=Europe/Warsaw date`. The user writes Polish; repo files, UI and submission are English.
3. Recreate the hourly e2e on `main` (it lives only in the session that made it): a cron at :13 that makes a detached worktree `../ws-o1-e2e` at `origin/main`, runs `npm ci --silent`, `npx vitest run`, `npx playwright test` (port 5171, system Chrome; skip if the port is busy), removes the worktree, reports one line, and posts on issue #1 after two red runs in a row.

## First task for the new session: take over and fix the water priority (#135, #137, #119)

The user asked O1 to fix these itself in a new session. The lanes do not touch them now. Take over on O1 branches with the original commits (authorship kept), close the originals as replaced, delete their branches. Reviews with exact findings are the latest O1 comments on each PR.

1. **#135 (O4, `data/rules/water.json`, 14 rows: 11 per crop, 3 per class 417/579/925 mm).** This is the file to keep. Missing: a saved excerpt of FAO Irrigation and Drainage Paper 24, Table 20 (rye 300–450 mm, rapeseed 300–600 mm) under `data/samples/rules/`, cited by the rye, winter-rapeseed and low-class rows; also put Paper 24 in the low-class `sourceUrl`. Open the PDF, copy the lines, never from memory. Merge first.
2. **#137 (O3 for O4).** Drop its water part (`data/rules/water.json`, `data/samples/rules/fao-tm3-table14.txt`, the FAO row in `data/rules/SOURCES.md`); keep only the red clover N credit `nitrogen.credit.red-clover.us-ia` = 50 (ISU 2021, quotes p. 7 and p. 9 in `isu-rye-red-clover-2021.txt`). Effect: Iowa keep-soil cards change (red-clover rotations replace cereal-rye ones). Tell the user before merging; it changes the demo.
3. **#119 (O3, water score in `src/engine/priorityScores.ts`, `rules.ts`, `analyzeField.ts`).**
   - Critical: the value is the pooled share of covered years but low/high are per-year percentiles, so value > high (Poznań 4.5 [0–0], Iowa 1.1 [0–0]) and the `analysis` schema fails with water on (`schemas.ts:47`). Clamp the range to contain the value (as `resilience.ts` does) and add a test that parses the analysis schema with water on.
   - `waterNeedOf` in `rules.ts`: read `water.needMm.<cropId>` first, fall back to the class row (alfalfa is held to 925 mm today).
   - `rules.test.ts:62` fails once `water.json` is on main: build it on rules with `water.needMm.*` stripped.
   - Evidence `ruleIds` (`analyzeField.ts:330`): only the rows the card used.
   - **Method question for the user, ask before finishing:** the rule "season rain ≥ max(need, ET)" is almost never met at Poznań (rain about 400–510 mm, ET 480–600 mm), so water scores 4–9 on every card and does not separate rotations. Options: compare rain with the crop need only, or score the shortfall in mm (smaller shortfall = better). Record the answer as a D-line.
   - Gate after each step: integration worktree, typecheck, vitest, build, validate:data, e2e. Then check the Iowa and Poznań cards with water on (values, order) and report them to the user.
4. Merge order: #135 → #119 → #137 (red clover after the user's OK).

## Second task: the glossary in Polish (user request, Sat 21:31)

Under `?lang=pl` the glossary page ("Słowniczek") and every `<Term>` pop-up still show English. The Polish text exists: `src/steps/glossary/terms.pl.json` has all 13 terms (#115, #138), and `i18n-parity.test.ts` checks that its ids match `terms.en.json`. Nothing reads it, because `useTerm.ts` imports only `terms.en.json`.

1. `useTerm.ts`: pick the table by `currentLang()` from `src/app/i18n.ts`, fall back to English per term the way `textFor` does, and keep the strict throw on an unknown id in tests.
2. `GlossaryPage.tsx`: `entries` is built once at module load (line 6), so it never sees a language switch. Build it on render, re-render on `useLang`, and sort with the current language (`localeCompare(…, lang)`), so Polish labels sort Polish-style.
3. `TermText.tsx` drops the label as-is into a sentence. A Polish label is in the nominative ("strefa korzeniowa"), so read every Polish sentence with a term placeholder on screen. Where the case is wrong, rephrase the sentence in `pl.json` instead of adding case forms.
4. Tests first: `term()` returns the Polish label under `pl`; `GlossaryPage` waits for a Polish label after `setLang('pl')`, and for the English one after switching back.
5. Gate as above, then open the glossary and one rotation card at `localhost:5171/?lang=pl` and show the user.

`src/steps/` is O2's folder. This is a small change with the data in hand, so O1 does it on an `o1/` branch. It also closes the "glossary terms still English" item of #76.

## How O1 works now (approved by the user)

- Only O1 merges (D31). Before a merge: integration gate on current `main` in a detached worktree (`../ws-o1-int`): merge the PRs, `npm ci`, typecheck, `npx vitest run`, build, `validate:data`, `npx playwright test`; then `gh pr merge <n> --squash --match-head-commit <sha>`.
- **Ignore the red "Vercel" check (D45).** Vercel's Hobby plan blocks every commit not authored by the owner account. Merge on the `ci` check. Hosting is solved at the end; localhost (5171) is the test target until then.
- Reviews run as read-only subagents (prompt P5), grouped by lane. Approval comment: `Review: approved @<sha7>`. Open review items go to a follow-up issue for the same owner (#76 O2, #79 O4, #98 income, #105 data audit).
- **The user allowed O1 to fix, take over and merge small changes on its own** when it has the data (review follow-ups, decision records, stalled lane work). Take over on a new O1 branch with the original commits; never push to someone else's branch. Ask the user only for product or method choices: formulas, scales, rules, data sources, anything that changes what the demo shows.
- Lane sessions (O2, O3, O4) run in claude.ai project threads, not on this computer, so O1 cannot message them. Write the instructions on the PR or issue and give the user a copy-paste prompt for each lane.
- Merged PR branches are deleted by GitHub. Delete the branches of PRs closed as replaced.

## Where we are

- **Income goal is on** (#132). All "before #89" items of #98 are merged: calibration (#100, #129), income scale 0–100 across candidates (D44), cover-crop costs (#121, #118), rapeseed Ky, the income section on the card (#131). D46: the Poznań potato is priced on the 88% table share only; potato still leads the Income goal at Poznań, which matches the WODR sheet (its own surplus is about 26 100 PLN/ha).
- **Drought and heat** (#113): drought against the same calendar month (D42), heat as at least 3 hot days from NASA POWER daily `T2M_MAX` (D43). Issue #105 items 1–3 are closed; items 5–8 are in #124 and #119.
- **Done in this session:** #92 ULDK parcels, #116 address search, #106/#97/#125 twins, #130 (O1 took over #96/#102: the advisor report and share link, now validated against the contract). The hourly e2e is green.

## Open PRs at 20:20

| PR | Owner | State |
|---|---|---|
| #135, #137, #119: water priority and data | O4, O3 | taken over by O1, see the first task above |

Merged since 19:46: #124 (erosion, comparable soil totals), #114 (EN/PL switch), #115 (Polish text) and #138 (O1's Polish text fixes), D47 and D48 (#136).

## Deferred feature (start when the usage limit resets)

**Grain for food or for feed** (the user's request, Sat 19:40). The farmer picks, per cereal, whether it is sold for food (milling) or feed, and the income uses the matching price.
- Scope: Poland only. Wheat and rye have milling and feed prices in the MRiRW ZSRIR weekly bulletin we already cite; barley is priced as feed today (malting barley is a separate price). Iowa maize and soybean have no such split.
- Default: as today (wheat and rye for food, barley for feed), so nothing changes unless the farmer switches.
- Pieces: contract (a per-crop use in the priorities, also carried in the share link), data (O4: a second price row per cereal with source and period), engine (O3: pick the price by use), UI (a toggle next to the crop or in the priorities step).
- Plan: one O1 session does all four in one PR, because three lanes would mean three review rounds. Ask the user before starting if the pitch work still has priority.

## Follow-ups that do not block the demo

- Polish UI (#76): glossary terms still English inside Polish sentences (`useTerm.ts`; now the second task above), numbers keep English separators under `?lang=pl` (`SourcedNumber`), some labels untranslated ("our calculation", "Weak evidence"), calendar names capitalised mid-phrase.
- O2 (#76): twin yields and "similar regions" on the card; the SoilGrids loading text; Nominatim attribution near the search results; report minors (centroid and area from the link, step 1 flash, offline on the report); income card rows wrap at 400 px; GAEC 7 shows 0 PLN/ha under payments.
- O3: a gap for the cover-crop seed and herbicide cost left out (D34; needs a contract signal); the 1.25 calibration guard should be a DECISIONS line or a rule row; PLAN line 396 and SPEC §7 describe the old income formula.
- O4 (#79): twins labels as message codes; a GAEZ Table 7-4 excerpt for the alfalfa ×10 unit; white mustard has no erosion row, so Poznań cards show no erosion.
- O1: a DECISIONS line for US addresses going to Nominatim instead of Census (Census sends no CORS header, #116); a live CropScape check through `api/cropscape.ts` once hosting exists.

## Decisions still open (ask the user)

- Hosting at the end (D45): O2 commits as the owner account, or the repo goes public (D32; run TruffleHog first), or Vercel Pro. The pitch QR code, the Safari/iPhone check and the CropScape proxy need it.
- Pitch owner (D14): script, at most seven slides, a 30-second demo video.
- Iowa demo: check the soil weights with a mentor before the pitch.
