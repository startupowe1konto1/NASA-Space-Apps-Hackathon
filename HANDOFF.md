# Handoff v8: O1 (integrator) at Sat 22:30, for a fresh session

Written Sat 14 Nov 2026, 19:46 CET by the O1 session and updated at 22:30 by the next O1 session (Windows laptop, repo at `C:\Users\oskar\Desktop\NASA`). Earlier handoffs are in git history. The team now puts its effort on the frontend and the pitch.

## Start here

1. Read `CLAUDE.md`, `docs/PLAN.md`, `docs/DECISIONS.md` (D1–D51; D49 is held for O2's #142), then this file.
2. Get the time with `TZ=Europe/Warsaw date` (in Git Bash on Windows that prints GMT; `TZ=CET-1 date` gives Warsaw time). The user writes Polish; repo files, UI and submission are English.
3. Recreate the hourly e2e on `main` (it lives only in the session that made it): a cron at :13 that makes a detached worktree `../ws-o1-e2e` at `origin/main`, runs `npm ci --silent`, `npx vitest run` and the Playwright tests, removes the worktree, reports one line, and posts on issue #1 after two red runs in a row. Run Playwright on its own port (5179) with a config next to `playwright.config.ts` that spreads it and overrides `use.baseURL` and `webServer` (`npm run dev -- --port 5179 --strictPort`), so the O1 dev server on 5171 keeps running. Skip e2e if 5179 is busy.

## Done: the water priority (Sat 21:40–22:10)

#135, #119 and #137 were taken over by O1, merged as #146, #147 and #148, and closed as replaced. Their lane branches are deleted.
- #146: `data/rules/water.json` plus `data/samples/rules/fao-paper24-table20.txt`. The FAO PDF is a scan; the excerpt is its OCR text from `pdftotext -raw`, where each line is one table row. The low-class row keeps one `sourceUrl` and names Paper 24 in its locator, like other rows with two sources.
- #147: O3's water score with its review fix (range contains the value, crop row before class row, evidence names the rows used). D50: the user kept "season rain ≥ max(need, evapotranspiration)". With per-crop rows the Poznań demo (Keep my soil, water on) ranks field pea → rye → winter rapeseed first, water 63.9; potato rotations score 0.
- #148: red clover N credit (D51). Iowa "Keep my soil" keeps its top three; "Improve my soil" options 2 and 3 become red clover rotations.
- The card shows no water score of its own, only the water evidence (mean season rain and evapotranspiration). The score moves cards through the total.

## Done: Polish glossary and ui-kit, e2e fix (Sat 22:10–22:30)

- #151: the glossary page and the `<Term>` pop-ups follow the UI language (`useTerm.ts` reads `terms.pl.json` with English as the per-term fallback; `GlossaryPage` builds and sorts its list on render). Two Polish entries broke the glossary's own rules and were shortened; the rules now run on Polish too. The five Polish sentences with a term inside read correctly with the nominative label.
- #152: `src/ui-kit/messages/pl.json` (28 strings: "Słabe dowody", "Źródło: szacunek modelowy", "Spróbuj ponownie", the term button "Co znaczy „…”?").
- #153: the hourly e2e went red (5 of 6) after #145, because Vite's dependency scan crawled `pitch/farm-stills/render-src/scene.html`, which imports `three`, and React then broke in the dev server. `vite.config.ts` now sets `optimizeDeps: { entries: ['index.html'] }`. CI did not catch it: it runs `vite build` and no e2e.

## Open: step 6 "Money" is still the skeleton placeholder (checked Sat 22:30)

The user asked whether and when step 6 gets its screen. Nobody is building it.
- `src/steps/money/MoneyStep.tsx` is the O1-S1 placeholder: a `StateBoundary` in `no-data` with `steps.money.notLoaded` ("Prices and payment rates are not loaded yet." / "Ceny i stawki dopłat nie są jeszcze wczytane."). That text is now wrong: the money tables are wired (`providers.money = tableMoneyProvider`, `moneyAvailable = true` in `src/app/providers.ts`), and the income section works on every card in step 5 (#131, `src/steps/cards/IncomeSection.tsx`).
- What it should show: SPEC §12, step 6 "Money": margins and payments per rotation with their conditions, dated, below the cards. SPEC §5 "After the minimum", item 1: money detail (payment conditions, costs, revenue per crop). PLAN task O2-B6 covered the income on the cards and this section; only the card part shipped.
- No branch or PR for it (remote heads checked at 22:25). In the team call (transcript in #150, about 16:01) a teammate said step 6 is blank and "it goes with me", but nothing is on GitHub. Ask the user who owns it before starting, so two people do not build it.
- Data each rotation already carries: `RotationOption.money: AsyncResult<MoneyEstimate>` (`marginPerHa` as a `Sourced` mean with the 10th–90th percentile years as its range, `currency`, `payments[]` with `programme`, `amountPerHa`, `condition`, `confirmed`, and `campaign`) and `income: AsyncResult<Score>`.
- A first version needs no contract change: one block per rotation, in the order of the cards for the chosen goal, reusing `IncomeSection` (margin in a bad, average and good year; payments with their condition; unconfirmed rates greyed with "rate not confirmed for 2026"), the campaign line with the price dates, and the "replay of past years at today's prices, not a forecast" sentence (CLAUDE.md). Every number through `<SourcedNumber>`; `StateBoundary` states for loading, no data and source error; EN and PL text; replace `steps.money.notLoaded`.
- "Costs and revenue per crop" is not in `MoneyEstimate`; that part needs a `[contract]` PR and engine work (O3), so leave it for a second version unless the user wants it now.
- `src/steps/` is O2's folder. If the user gives it to O1, do it on an `o1/` branch like #151, TDD, then the full gate and a look at `?lang=pl`.

## How O1 works now (approved by the user)

- Only O1 merges (D31). Before a merge: integration gate on current `main` in a detached worktree (`../ws-o1-int`): merge the PRs, `npm ci`, typecheck, `npx vitest run`, build, `validate:data`, `npx playwright test`; then `gh pr merge <n> --squash --match-head-commit <sha>`.
- **Ignore the red "Vercel" check (D45).** Vercel's Hobby plan blocks every commit not authored by the owner account. Merge on the `ci` check. Hosting is solved at the end; localhost (5171) is the test target until then.
- Reviews run as read-only subagents (prompt P5), grouped by lane. Approval comment: `Review: approved @<sha7>`. Open review items go to a follow-up issue for the same owner (#76 O2, #79 O4, #98 income, #105 data audit).
- **The user allowed O1 to fix, take over and merge small changes on its own** when it has the data (review follow-ups, decision records, stalled lane work). Since Sat 22:30 this is the default: small review fixes in a lane's PR are done by O1, not sent back to the lane. Take over on a new O1 branch with the original commits; never push to someone else's branch. Ask the user only for product or method choices: formulas, scales, rules, data sources, anything that changes what the demo shows, and privacy calls.
- Lane sessions (O2, O3, O4) run in claude.ai project threads, not on this computer, so O1 cannot message them. Write the instructions on the PR or issue and give the user a copy-paste prompt for each lane.
- Merged PR branches are deleted by GitHub. Delete the branches of PRs closed as replaced.

## Where we are

- **Income goal is on** (#132). All "before #89" items of #98 are merged: calibration (#100, #129), income scale 0–100 across candidates (D44), cover-crop costs (#121, #118), rapeseed Ky, the income section on the card (#131). D46: the Poznań potato is priced on the 88% table share only; potato still leads the Income goal at Poznań, which matches the WODR sheet (its own surplus is about 26 100 PLN/ha).
- **Drought and heat** (#113): drought against the same calendar month (D42), heat as at least 3 hot days from NASA POWER daily `T2M_MAX` (D43). Issue #105 items 1–3 are closed; items 5–8 are in #124 and #119.
- **Done in this session:** #92 ULDK parcels, #116 address search, #106/#97/#125 twins, #130 (O1 took over #96/#102: the advisor report and share link, now validated against the contract). The hourly e2e is green.

## Open PRs at 22:30

O1 reviewed every O2 PR (comments at 22:18–22:20); none had new commits by 22:30. At 22:30 the user told O1 to make small fixes itself, so O1 takes over #142, #141 and #143 in that order (comment on each PR first).

| PR | Owner | State |
|---|---|---|
| #142: [contract] D49, allow `integracja02.gugik.gov.pl` for the KIEG parcel layer | O2 | changes needed: D49 should say integracja alternates between 01 and 02 and 01 is the broken one; put D49 between D48 and D50. Merge first. |
| #141: #76 review follow-ups (Nominatim attribution, twin yields, SoilGrids wait, ULDK offline, parcel id) | O2 | changes needed: the "live from SoilGrids" loading note is false on the demo (context is precomputed); the twins similarity % is not a `<SourcedNumber>`. Merge before #143. |
| #143: O2-A5 parcel layer (KIEG), split and merge | O2 | changes needed: the layer is empty at zoom 14–16 (KIEG parcels draw from about 17); rebase after #141 and #142. |
| #140: handoff v3 for O2 | O2 | stale; close it or write a v4 without the `useTerm` task (#151 did it). |
| #150: [contract] Fathom transcript of the team call | O2 | the user decides: it has team members' full names and a public link to the recording, which would go public with the repo (D32). |

Merged since 20:20: #144 (handoff v6.1), #146, #147, #148 (water priority), #149 (handoff v7), #145 (pitch farm stills, CC BY credit in its README), #151, #152, #153 (see above).

## Deferred feature (start when the usage limit resets)

**Grain for food or for feed** (the user's request, Sat 19:40). The farmer picks, per cereal, whether it is sold for food (milling) or feed, and the income uses the matching price.
- Scope: Poland only. Wheat and rye have milling and feed prices in the MRiRW ZSRIR weekly bulletin we already cite; barley is priced as feed today (malting barley is a separate price). Iowa maize and soybean have no such split.
- Default: as today (wheat and rye for food, barley for feed), so nothing changes unless the farmer switches.
- Pieces: contract (a per-crop use in the priorities, also carried in the share link), data (O4: a second price row per cereal with source and period), engine (O3: pick the price by use), UI (a toggle next to the crop or in the priorities step).
- Plan: one O1 session does all four in one PR, because three lanes would mean three review rounds. Ask the user before starting if the pitch work still has priority.

## Follow-ups that do not block the demo

- Polish UI (#76): numbers keep English separators under `?lang=pl` (`SourcedNumber`); calendar names capitalised mid-phrase. The glossary and the ui-kit labels are done (#151, #152).
- O2 (#76): twin yields and "similar regions" on the card; the SoilGrids loading text; Nominatim attribution near the search results; report minors (centroid and area from the link, step 1 flash, offline on the report); income card rows wrap at 400 px; GAEC 7 shows 0 PLN/ha under payments.
- O3: a gap for the cover-crop seed and herbicide cost left out (D34; needs a contract signal); the 1.25 calibration guard should be a DECISIONS line or a rule row; PLAN line 396 and SPEC §7 describe the old income formula.
- O4 (#79): twins labels as message codes; a GAEZ Table 7-4 excerpt for the alfalfa ×10 unit; white mustard has no erosion row, so Poznań cards show no erosion.
- O1: a live CropScape check through `api/cropscape.ts` once hosting exists. #145 minors: link the CC BY licence and the kit page in `pitch/farm-stills/README.md` and on the slide credit.

## Decisions still open (ask the user)

- Hosting at the end (D45): O2 commits as the owner account, or the repo goes public (D32; run TruffleHog first), or Vercel Pro. The pitch QR code, the Safari/iPhone check and the CropScape proxy need it.
- Pitch owner (D14): script, at most seven slides, a 30-second demo video. The team call (#150) planned a deck v1: title, the farmer's problem, the engine, the app demo, a NASA data slide, then a Polish version. Only the farm stills (#145) are in the repo.
- Who builds step 6 "Money" (see above).
- Iowa demo: check the soil weights with a mentor before the pitch.
