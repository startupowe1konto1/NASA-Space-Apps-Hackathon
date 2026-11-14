# Handoff: O2 (frontend), v3 for Cursor

Written Sat 14 Nov 2026, 20:02 CET (T+8:53). State read from `origin/main` and GitHub at 20:02. Previous version (v2, 18:45) is replaced; re-check with "Check first" before acting.

## Who and how

- **We are persona O2 (frontend)** in team Vibecodersi, NASA Space Apps 2026, challenge "Field Shift: Adapting Farms with NASA Data". Repo: `startupowe1konto1/NASA-Space-Apps-Hackathon` (private, D32). Main checkout: `C:\Users\WojciechRudnicki\Claude_code\nasa\NASA-Space-Apps-Hackathon` (do not work in it while another session uses it; keep it for `git fetch` / `gh` only).
- **The user writes Polish; answer in Polish.** Repo text, UI text, commits and PRs are English and follow the anti-ai-writing rules.
- **O2 owns `src/map/` and `src/steps/`** (SPEC §13). Any other file is a separate `[contract] …` PR reviewed by O1. Only O1 merges (D31); we set PRs to ready and stop.
- **Read before working:** repo `CLAUDE.md` (it changes during the day; re-read it), `docs/PLAN.md` (O2 section), `docs/DECISIONS.md` (esp. D12, D18, D31, D35, D45), `docs/SPEC.md` §6 (contracts), §11 (terms), §12 (screens), §15 (allowed sources).
- **This handoff file** is `HANDOFF-O2.md` at the repo root (same pattern as O1's `HANDOFF.md`). A local mirror may also sit at `C:\Users\WojciechRudnicki\Claude_code\nasa\HANDOFF-O2.md`. Worktrees live beside the main checkout under `C:\Users\WojciechRudnicki\Claude_code\nasa\wt-o2-*`.
- **Global startup ritual** (`~/.claude/CLAUDE.md`, also in Cursor User Rules): propose skills/MCP for the phase and wait for a yes. Likely fits: `superpowers:test-driven-development`, `superpowers:verification-before-completion`, `superpowers:systematic-debugging`, `ui-ux-pro-max` / `emil-design-eng` / `impeccable` for A5 UI, `anthropic-skills:anti-ai-writing`, `miodkuj` for Polish, Playwright phone checks. Skip Context7 unless a library API is unclear. Firecrawl only with an explicit yes. Magic MCP key is expired.

## Rules that bit us today (all in repo CLAUDE.md)

- **Tests never hard-code values from fixtures or data** (crop names, areas, years, fixture texts, message texts). Read them from `demoFields`, `providers.context.*`, `fixtureCrops`, `cropName()`, `t()`, the JSON files.
- **No stacked PRs.** If a PR needs another unmerged one: draft, "After #n" at the top of the body, rebase onto `main` once #n merges.
- **D35:** a PR with nothing critical is merged when CI is green on current `main`; review items go to a named follow-up (O2's is issue **#76**). Answer every review item in the PR.
- **D45:** the red `Vercel` check is not a code failure (Hobby blocks non-owner commit authors). O1 merges on green `ci` alone.
- **e2e constraints** (O1's `e2e/helpers.ts`, substring match): no BUTTON accessible name containing "Iowa demo field" / "Poznań demo field"; rotation cards keep the lists "What we do not know" and "Check locally" and no other lists; "Your rotation", "Yes, use these crops", "Saved N years of crops" (N ≥ 2) are read by e2e. e2e runs in English, so English stays the default language.
- **Zustand selectors must not return a new array/object** (`?? []` inside the selector loops forever).
- **Two PRs appending to `docs/ai-usage/O2.md` conflict.** Only one open O2 PR at a time edits it; others put the line in the PR body.
- Gate before every push: `git fetch && git rebase origin/main && npm run typecheck && npm run test && npm run build && npm run validate:data`. Commit with explicit paths (never `git add -A`), message ending `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` (in Cursor: use the attribution your tool gives, or none), PR body ending `🤖 Generated with [Claude Code](https://claude.com/claude-code)` when written by Claude Code.

## Done on main (brief)

Minimum / PLAN stream A–B for O2 is largely on `main`:

| Area | On main via |
|---|---|
| A1 map | #42 |
| A2 address search (GUGiK → miss/US → Nominatim; Census kept as parser only, no CORS in browser) | #116 |
| A3 ULDK parcels | #92 |
| A4 draw / field list | #82 |
| A4b tap-while-drawing adds a corner | #112 |
| B1–B5 (goal, crops, cards, calendar, glossary + tooltips) | #43/#77, #52/#91, #65/#80, #53, #54/#62/#93 |
| B6 income on cards | **O1 took it** (#131) — do not touch |
| B7 advisor report + share restore | **O1 took it** (#130, closed #96/#102) — do not touch |
| B8 language switch EN/PL (`src/app/i18n.ts`, header) | **#114 merged** |

**Still open O2 PR:** **#115** O2-B8 Polish UI text — ready, `ci` green, Vercel red (D45), O1 approved and is landing wording fixes in **#138**. Wait for O1; do not merge. After #115: wire `useTerm.ts` to `terms.pl.json` in a small follow-up (called out in the #115 review).

Missing AI-use rows for A4b / A2 / B8 may still be absent from `docs/ai-usage/O2.md` on `main` (file stopped at A3). Add them in the next O2 PR that touches that file (or put the lines in the PR body).

## Left from PLAN: only O2-A5

**O2-A5 is the only remaining PLAN task for O2.** Parallel track, **not** minimum (D12: parcel split/merge starts with the lane and ships when ready; D18 cut order never included A5).

From `docs/PLAN.md`:

> ### O2-A5: parcel layer, split and merge (parallel track)
>
> **Branch:** `o2/a5-parcel-edit` · **After:** O2-A3, O2-A4 · **Files:** `src/map/parcels/KiegLayer.tsx`, `src/map/parcels/splitMerge.ts`, tests
>
> - [ ] Spike, 30 minutes: show the KIEG WMS (`dzialki`, `numery_dzialek`) on a Leaflet map with a proj4leaflet EPSG:2180 CRS. If the base map needs a host outside SPEC section 15, stop and ask a human.
> - [ ] Test `split(field, line)`: a square cut by a line through its middle returns two polygons whose areas sum to the original ± 1%. Test `merge(a, b)`: two squares sharing an edge return one polygon.
> - [ ] Wire Geoman's cut tool to `split` and a "merge selected" button to `merge`; each result is a new `Field` with the parent's `parcelIds`.
>
> **Done when:** a parcel can be cut in two and two fields joined, and each resulting field can be analysed.

**How to claim:** worktree `wt-o2-a5` beside the main checkout, branch name as in PLAN (`o2/a5-parcel-edit`; short alias `o2/a5-kieg` is fine if you prefer, but keep one name), empty claim commit + draft PR. Junction `node_modules`. Dev on port **5172**.

SPEC notes: KIEG parcels render only in EPSG:2180; Geoman cut + EPSG:2180 together are unverified (risk table). Allowed hosts include GUGiK integracja / services (SPEC §15).

## Left outside PLAN (still-open O2 follow-ups)

Source of truth: issue **#76** plus review comments. **Do not redo** items already fixed on `main` (verified 20:02): #76 items 1–6 and 8; B2 plural/heading/three seasons (#91); rangeNote percentile wording (#130); draw-over-field while Geoman draw is on (#112 forwards the click); B6/B7 (O1).

### Priority 1 — do first (user-visible / review "important")

| # | Item | Source | File hint | Contract? |
|---|---|---|---|---|
| 1 | **Nominatim attribution** near results ("Search by OpenStreetMap Nominatim") | #116 → #76 | `src/map/search/SearchBox.tsx`, `messages/en.json` | no |
| 2 | **Twins section:** show each case's yield (`outcome` is `Sourced` t/ha) and call them **similar regions**, not only count + mean similarity | #97 → #76 | `src/steps/cards/RotationCard.tsx` (~144), `messages/en.json` (`twinsReady`); data shape already in `TwinEvidence.cases` | no |
| 3 | **SoilGrids loading text** while analysis waits on slow live soil (~2 min) | #98 item 13 → #76 | `src/steps/cards/RotationsStep.tsx` loading `StateBoundary` / `messages/en.json` (`steps.rotations.analysis`) | no (engine source name was O3) |

### Priority 2 — ULDK / search polish

| # | Item | Source | File hint | Contract? |
|---|---|---|---|---|
| 4 | Offline tap in Poland still uses `parcels.tap.error` ("ULDK did not answer"); should say the browser is offline | #92 → #76 | `src/map/parcels/tap.ts` (no `navigator.onLine` check today), `messages/en.json` | no |
| 5 | `id: \`parcel-${teryt}\`` — second tap on a reshaped parcel silently replaces the edited field | #92 → #76 | `src/map/parcels/uldk.ts` `parcelToField` | no (new unique id; keep `parcelIds`) |
| 6 | Tap during an in-flight parcel search can still race the status note | #92 → #76 | `src/map/parcels/ParcelSearch.tsx` (partial: tap clears search to idle; re-check) | no |
| 7 | #116 minors: after GUGiK miss loading still names GUGiK; raw browser network text; "Map moved to …" when map failed / empty `display_name`; `autoComplete="off"`; `vi.unstubAllGlobals()` in afterEach; empty-text test asserts nothing; "GUGiK" needs `<Term>` | #116 → #76 | `src/map/search/*` | no |
| 8 | Field names frozen in the creation language; "GUGiK ULDK" defined twice (`ULDK_SOURCE` and `parcels.source`) | #92 → #76 | `uldk.ts`, parcel messages | no |

### Priority 3 — report / map minors (#130) and old cards notes

| # | Item | Source | File hint | Contract? |
|---|---|---|---|---|
| 9 | Shared link's `centroid` / `areaHa` not recomputed from the polygon | #130 → #76 | restore path + `centroidOf` / `areaHa` in `src/map` | maybe small `[contract]` if restore lives only in `src/app` / report |
| 10 | Step 1 flashes before step 7 on share restore; offline shows as source error on the report; unclosed rings accepted; glossary left open when a link is pasted | #130 → #76 | `src/steps/report/*`, draw close-ring helper | restore flash may need `src/app` → `[contract]` |
| 11 | Reshape can change country while crop history stays; Delete has no undo; "Show 1 earlier years" plural; extend term grep to `terms={{…}}` | #93/#82 → #76 | `MapStep.tsx`, `FieldList`, `CropsStep` / `showEarlier`, glossary `terms.test.ts` | no |

### Blocked / not ours alone

| Item | Owner |
|---|---|
| #76 item 7: calendar "N of 45 years" needs a structured year count | **O3 + O1 `[contract]`** — strip stays "% of years" until then |
| #115 merge + #138 Polish wording | **O1** |
| B6 / B7 / rangeNote | already O1 — leave alone |

### After #115 merges

- Small PR: `useTerm.ts` reads `terms.pl.json` via `currentLang()` (English fallback).
- Calendar: capitalised hazard / crop names mid-phrase in Polish (noted in #115 review).

## Suggested next order

1. **Follow-ups PR** (P1: Nominatim attribution + twins yields/regions + SoilGrids loading text; then P2 ULDK offline + parcel id). One branch/worktree, e.g. `wt-o2-followups` / `o2/followups-76`. Claim + draft, gate, ready for O1. Log AI use there (and the missing A4b/A2/B8 lines if still absent).
2. **O2-A5** in parallel only if follow-ups are parked or another session can take them — still not minimum.
3. When #115 is on `main`: `useTerm` Polish wiring.
4. Ask the user before removing stale worktrees (list below).

## How we worked (keep doing it)

- **One git worktree per task** next to the main checkout: `C:\Users\WojciechRudnicki\Claude_code\nasa\wt-o2-<task>`, branch `o2/<id>-<topic>`, claim with an empty commit + draft PR. `node_modules` is a **junction** to the main checkout's (`cmd //c mklink //J <wt>\node_modules <main>\node_modules`); never `npm install` in a worktree. In Cursor, open the worktree folder you work on, not the main checkout.
- **Dev server:** O2 port **5172**: `npm --prefix wt-o2-<x> run dev -- --port 5172 --strictPort`. Kill any stale Vite holding 5172 before starting a new one.
- **Phone checks:** Chrome's phone emulation does not deliver taps to Leaflet; use Playwright with `devices['Pixel 7']` and `page.touchscreen.tap`. Scripts in `C:\Users\WojciechRudnicki\Claude_code\nasa\o2-tools\phone-checks\` (`cards`, `crops`, `draw`, `report`, `uldk`, `uldk-draw`, `draw-over-field`, `terms`, `gloss`, `tap` `.mjs`). Copy one into the worktree (so it finds `playwright`), run `node x.mjs <out-dir> [port]`, delete it. They use the system Chrome (`channel: 'chrome'`).
- **Lesson:** Geoman's Finish / Remove Last Vertex / Cancel bar covers part of the map next to the polygon button, and the page scrolls when you use controls below the map. Measure the map box right before each tap and keep test taps away from the top-left; otherwise a "bug" is just a tap on a Geoman control. Tapping the first corner does not close a polygon on touch; use Finish.
- **Audit:** `~/.claude/skills/impeccable/scripts/impeccable detect --json --viewport 390x844 http://localhost:5172/` or `… detect --json src/steps/<folder>`.
- **Windows gotchas:** get the time with `powershell -NoProfile -Command "Get-Date -Format 'HH:mm'"` (`TZ=… date` prints GMT here). Parallel `git fetch` from several sessions fails with "cannot lock ref"; retry. Heredocs with backticks break in Git Bash: put edit scripts in a file. Use `python -I`. WebFetch fails on the venue network; use curl.

## Worktrees on disk (ask before remove)

Present under `C:\Users\WojciechRudnicki\Claude_code\nasa\` at 20:02 (all clean):

| Worktree | Branch | Likely removable? |
|---|---|---|
| `wt-o2-a1` | `o2/a1-map` | yes (merged) |
| `wt-o2-a2` | `o2/a2-search` | yes (merged) |
| `wt-o2-a3` | `o2/a3-uldk` | yes (merged) |
| `wt-o2-a4` | `o2/a4-draw` | yes (merged) |
| `wt-o2-a4-tap` | `o2/a4b-tap-while-drawing` | yes (merged) |
| `wt-o2-b1` | `o2/b1-followups` | yes (merged) |
| `wt-o2-b2` | `o2/b2-followups` | yes (merged) |
| `wt-o2-b3` | `o2/b3-calendar-on-cards` | yes (merged) |
| `wt-o2-b4` | `o2/b4-calendar` | yes (merged) |
| `wt-o2-b5` | `o2/b5-glossary` | yes (merged) |
| `wt-o2-b5-terms-on-cards` | `o2/b5-terms-on-cards` | yes (merged) |
| `wt-o2-b7` | `o2/b7-report` | yes (O1 takeover merged) |
| `wt-o2-b8-contract` | `o2/contract-lang-switch` | yes (#114 merged) |
| `wt-o2-docs` | `o2/contract-ai-usage` | yes (merged) |
| `wt-o2-b8` | `o2/b8-pl` | **keep until #115 merges** |

Ask the user, then e.g. `git -C NASA-Space-Apps-Hackathon worktree remove ../wt-o2-a1` (and drop the local branch if unused).

## Team context

- O3/O4 engines, money, twins, live soil largely on `main`; Income goal on. Other open PRs at 20:02 are mostly O3/O4 water/Polish fixes (#119, #135, #137, #138) — not O2 unless they touch our messages.
- O1: Vercel production still incomplete (D36 / O1-S2); real phone on venue Wi-Fi needs the hosted URL. Until then localhost **5172**.
- Gates: minimum was Sat 20:10 (D17); all features Sun 00:10; freeze Sun 08:10; submit Sun 10:10; deadline Sun 11:59.

## Check first (fresh session)

Local disk layout (Windows): main checkout `C:\Users\WojciechRudnicki\Claude_code\nasa\NASA-Space-Apps-Hackathon` (fetch/`gh` only when dirty elsewhere); one worktree per task at `C:\Users\WojciechRudnicki\Claude_code\nasa\wt-o2-<task>`; phone-check scripts in `C:\Users\WojciechRudnicki\Claude_code\nasa\o2-tools\phone-checks\`. Time: `powershell -NoProfile -Command "Get-Date -Format 'HH:mm'"`.

```bash
cd /c/Users/WojciechRudnicki/Claude_code/nasa/NASA-Space-Apps-Hackathon && git fetch
# or PowerShell: Set-Location C:\Users\WojciechRudnicki\Claude_code\nasa\NASA-Space-Apps-Hackathon; git fetch
```

```bash
gh pr list --state open --search "O2 in:title"
gh pr view 115 --json state,isDraft,mergedAt,url
```

```bash
git worktree list
ls ../wt-o2-*
```

```bash
gh issue view 76 --comments
```

```bash
# Confirm follow-ups still open on main before coding
git grep -n "similar fields" origin/main -- src/steps/cards/
git grep -n "parcels.tap.error" origin/main -- src/map/parcels/
git show origin/main:src/map/search/messages/en.json
```

## Do NOT

- Start implementing A5 until the user confirms (or until follow-ups are intentionally deferred).
- Merge any PR (only O1).
- Edit `~/.claude/CLAUDE.md`.
- Work B6, B7, or redo the rangeNote / A4b / A2 features already on `main`.
