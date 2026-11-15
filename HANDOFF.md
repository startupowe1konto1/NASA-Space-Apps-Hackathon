# Handoff v10: O1 (integrator) at Sat 23:30, for a fresh session

Written Sat 14 Nov 2026, 19:46 CET by the O1 session and updated at 23:30 by the next O1 session (Windows laptop, repo at `C:\Users\oskar\Desktop\NASA`). Earlier handoffs are in git history. The team now puts its effort on the frontend and the pitch.

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

## Open: red e2e on step 6 (hourly run, Sun 10:17, main `01a1611`)

The user asked to note it and check it later. The hourly e2e had 2 of 9 failing, both the new step 6 check in `e2e/demo-fields.spec.ts:20` ("step 6 shows a money row for every rotation of step 5, in the same order"), on the Iowa and the Poznań demo:
- `getByRole('figure').getByRole('group').filter({ hasText: 'Your rotation' })` expected 1, received 4.
- Likely cause, not checked in the code: every row group of the chart contains the text "Your rotation" somewhere (the reference line label or a heading), so `hasText` matches all four rows. If so, the fix is a narrower selector in the test (the row's own title), not a change in the data; if the chart really marks every row as the current rotation, it is a UI bug.
- vitest was green (995). Main has moved since (#194 step 6 "Switch or stay?", #195 the name CropShifter, #196), so run `npx playwright test` on current `main` first: it may already pass or fail differently.
- The hourly job does not post on #1 until a second red run in a row.

## Step 6 "Money": build plan ready, backend data incomplete (Sat 23:30)

The full build plan, with the chart spec, the data mapping, the states, the EN/PL texts, the tests and a copy-paste prompt for the lane, is `docs/superpowers/plans/2026-11-14-step-6-money.md`. The user gave steps 5 and 6 to O3 and O4 (`HANDOFF-frontend.md`).
- What step 6 will show: every rotation of step 5, in the same order (`analysis.shownByGoal`), on one shared axis: the average-year margin per hectare as a dot, the bad-to-good-year range as a bar, the current rotation in grey with a dashed reference line at its average, payments and campaign dates in a disclosure per rotation, and the reason where a rotation has no money data. Plain HTML and CSS like `ScoreBar`, no new dependency.
- Engine and contract: ready. Each rotation carries `money: AsyncResult<MoneyEstimate>`; `MoneyStep.tsx` is still the placeholder with the wrong "not loaded yet" text.
- **Data: complete for the demo** (Sun 00:05): B1 Iowa winter wheat row (#167) and B2 borrowed wheat Ky for oats, rye and spring barley (#170, D53) are merged, so every rotation step 5 shows has money on both demo fields. The frontend can build step 6 now.
- "Costs and revenue per crop" (SPEC §5) is not in `MoneyEstimate`; it stays for a later version with a `[contract]` PR.

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

## Open PRs at 22:50: none

O1 took over the O2 PRs after its reviews (the user's decision, Sat 22:30) and merged them with the review fixes:
- #156 (from #142): `integracja02.gugik.gov.pl` in SPEC §15 and D49, corrected (integracja01 is the broken server) and placed between D48 and D50.
- #157 (from #141): the #76 follow-ups. The step 5 "live from SoilGrids" note shows only when `liveSoilData` in `src/app/providers.ts` is true (false while soil is precomputed); the twins similarity is a `<SourcedNumber>`; "Regions like yours", column "Similarity". Left in #76: the Years column at 400 px, a second field when the same parcel is searched twice, #92 and #116 leftovers, the mean similarity inside the `twinsReady` sentence.
- #159 (from #143): the KIEG parcel layer with split and merge, tiles from zoom 17 (KIEG draws nothing below), the join checkbox as one message. Left: splitMerge rounding comment, demo parcel id hard-coded in `splitMerge.test.ts`, the AI log line in `docs/ai-usage/O2.md`, a glossary term for KIEG.
- #160 (from #150): the team call transcript in `context/meetings/`, without the Fathom link and the speakers' surnames (the user's decision). The old text stays in the closed #150's history; the Fathom share link should be turned off in Fathom.
- #140 (O2 handoff v3) was closed as superseded; its branch `o2/h9-handoff` is still on GitHub and has a team member's full name in local paths, so delete it before the repo goes public.

Merged since 20:20: #144, #146–#149, #145, #151–#160 (#155 and #158 are `HANDOFF-frontend.md` from another O1 session).

## Deferred feature (start when the usage limit resets)

**Grain for food or for feed** (the user's request, Sat 19:40). The farmer picks, per cereal, whether it is sold for food (milling) or feed, and the income uses the matching price.
- Scope: Poland only. Wheat and rye have milling and feed prices in the MRiRW ZSRIR weekly bulletin we already cite; barley is priced as feed today (malting barley is a separate price). Iowa maize and soybean have no such split.
- Default: as today (wheat and rye for food, barley for feed), so nothing changes unless the farmer switches.
- Pieces: contract (a per-crop use in the priorities, also carried in the share link), data (O4: a second price row per cereal with source and period), engine (O3: pick the price by use), UI (a toggle next to the crop or in the priorities step).
- Plan: one O1 session does all four in one PR, because three lanes would mean three review rounds. Ask the user before starting if the pitch work still has priority.

## Later, not now (the user's call, Sat 22:48): SMAP recent soil moisture

Not needed for the demo: no score, card or ranking uses it. Do it only after step 6 and the frontend changes, if time is left.
- What exists: `src/profile/smap.ts` (O3-A3, #41, 27 tests) reads SMAP L4 root-zone soil moisture (9 km, from April 2015) from the NASA GIBS WMS: one pixel per date, its colour mapped through the GIBS colormap, sampled on day 1 and 15, returned as monthly means (`Sourced`, kind `model`). Nothing imports it.
- What is missing: a `[contract]` PR for a SMAP series on `ClimateProfile`, the `ProfileProvider` call, fixtures, and one row or a small chart in the step 5 field summary (EN/PL, loading and error states).
- Cost: live for any field is about 280 GIBS requests per analysis (139 months x 2 days), so loading gets tens of seconds slower; about 3–4 h of work. The cheaper version, about 1–1.5 h: compute the series once for the two demo fields into `data/precomputed/` and show it in the field summary.
- Why it might still be worth it: a second NASA product, from a satellite mission, next to NASA POWER, for the "NASA data" slide and as a check on the POWER drought years.

## Follow-ups that do not block the demo

- Polish UI (#76): numbers keep English separators under `?lang=pl` (`SourcedNumber`); calendar names capitalised mid-phrase. The glossary and the ui-kit labels are done (#151, #152).
- O2 (#76, still open): report minors (centroid and area from the link, step 1 flash, offline on the report); income card rows wrap at 400 px; GAEC 7 shows 0 PLN/ha under payments; "N of 45 years" in the calendar needs a contract year count; drawing an outline over the demo field (Geoman gets no taps, `leafletMap.ts` `bubblingMouseEvents`); the leftovers listed in #157. Twin yields, "Regions like yours", the SoilGrids note and the Nominatim credit are done (#157).
- O3: a gap for the cover-crop seed and herbicide cost left out (D34; needs a contract signal); the 1.25 calibration guard should be a DECISIONS line or a rule row; PLAN line 396 and SPEC §7 describe the old income formula. From #105 (closed): with 2–4 crops the 10th–90th percentile resilience range is often 0–100, which says little; how to narrow it is a method choice for the user. The engine's own messages have no `pl.json`, so card reasons and evidence stay English under `?lang=pl`.
- O4 (from #79, closed): a saved excerpt of the GAEZ v4 Model Documentation, Table 7-4 and its footnote, for the units `scripts/gaez_suitability.py` uses (alfalfa in 10 kg DW/ha, sugar beet in kg sugar/ha); it needs that PDF downloaded, so ask the user first. Erosion C factor rows are missing for white mustard, field pea, phacelia and winter rapeseed, so cards with those crops show erosion as not scored (an honest gap, but it weakens the Poznań cards); sources must be found and opened (USDA Agriculture Handbook 537 has small grain and meadow, not these crops).
- O1: a live CropScape check through `api/cropscape.ts` once hosting exists. #145 minors: link the CC BY licence and the kit page in `pitch/farm-stills/README.md` and on the slide credit.

## Decisions still open (ask the user)

- Hosting at the end (D45): O2 commits as the owner account, or the repo goes public (D32; run TruffleHog first), or Vercel Pro. The pitch QR code, the Safari/iPhone check and the CropScape proxy need it.
- Pitch owner (D14): script, at most seven slides, a 30-second demo video. The team call (#150) planned a deck v1: title, the farmer's problem, the engine, the app demo, a NASA data slide, then a Polish version. Only the farm stills (#145) are in the repo.
- Iowa demo: check the soil weights with a mentor before the pitch.
