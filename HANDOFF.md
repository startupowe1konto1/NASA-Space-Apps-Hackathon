# Handoff v7: O1 (integrator) at Sat 22:10, for a fresh session

Written Sat 14 Nov 2026, 19:46 CET by the O1 session and updated at 22:10 by the next O1 session (Windows laptop, repo at `C:\Users\oskar\Desktop\NASA`). Earlier handoffs are in git history. The team now puts its effort on the frontend and the pitch.

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

## Open PRs at 22:10

| PR | Owner | State |
|---|---|---|
| #141: #76 review follow-ups (Nominatim attribution, twin yields, SoilGrids wait, ULDK offline, parcel id) | O2 | ready, needs an O1 review |
| #142: [contract] D49, allow `integracja02.gugik.gov.pl` for the KIEG parcel layer | O2 | ready, needs an O1 review; a new host, so check it against SPEC §15 (GUGiK is listed) |
| #140: handoff v3 for O2 | O2 | ready, needs an O1 review |
| #143: O2-A5 parcel layer (KIEG), split and merge | O2 | draft, after #142 |

Merged since 20:20: #144 (handoff v6.1), #146, #147 and #148 (water priority, see above).

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
