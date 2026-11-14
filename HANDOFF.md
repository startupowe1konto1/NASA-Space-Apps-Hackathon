# Handoff v4: O1 (integrator) at Sat 18:15, for a fresh session

Written Sat 14 Nov 2026, 18:15 CET (T+7:06) by the O1 session, so O1 can continue in a new Claude Code session with less context. `main` is at `c0235bd`. Earlier handoffs are in git history.

## Start here

1. Read `CLAUDE.md` (repo rules, including the merge rules for a private repo), `docs/PLAN.md` (task table, R8–R10), `docs/DECISIONS.md` (D1–D41), then this file.
2. Get the time with `TZ=Europe/Warsaw date`. The user writes Polish; repo files, UI and submission are English.
3. Recreate the hourly e2e on `main` (it lived only in the old session): a cron at :13 every hour that makes a detached worktree `../ws-o1-e2e` at `origin/main`, runs `npm ci --silent`, `npx vitest run`, `npx playwright test` (port 5171, system Chrome; skip if the port is busy), removes the worktree, reports in one line, and posts on issue #1 after two red runs in a row.

## Where we are

- **Gates:** 18:10 review gate met: the real engine runs on live NASA POWER, four cards per demo field with calendar strips, source chips, glossary tooltips; e2e 6/6 (Iowa, Poznań crop-tile path, card checks for both, offline, NASA POWER blocked). Next: 20:10 minimum, 21:10 first pitch run on production, Sun 00:10 all features, 08:10 feature freeze, 10:10 repo freeze and submission.
- **Minimum left:** O1-S2 deploy (deferred by D36; Vercel needed before 21:10 for the pitch QR code, the CropScape proxy and the Safari/iPhone check), O2-A2 address search (first to cut, D18), O2-A3 ULDK parcels (#92 ready, not reviewed).
- **Income goal is off on purpose** (D39): `moneyAvailable` stays false until #98's "before #89" items land (calibration in #100, cover-crop costs, margins and the "not a forecast" line on the cards). Polish price level rule: D40.
- **Repo is private** (D32). GitHub does not enforce the merge rules; O1 does.

## How O1 works (what the user approved)

- Only O1 merges (D31). Before a merge: `gh pr checks <n> --watch --fail-fast`, branch up to date with main or tested merged locally (`git worktree add --detach ../ws-o1-int origin/main`, merge the PRs, `npm ci`, typecheck, `npx vitest run`, build, `validate:data`, `npx playwright test`), then `gh pr merge <n> --squash --match-head-commit <sha>`. Never merge on a red check.
- D35: merge when the review finds nothing critical; open review items go to a named follow-up issue for the same owner. Reviews run as read-only subagents (prompt P5), grouped by lane, tested on current main.
- Never push to someone else's branch. If a lane does not rebase for an hour and the work blocks the demo, ask the user, then take it over on a new O1 branch with the original commits (authorship kept), as done for #58/#59 in #90.
- O1's own PRs are merged only after the user says so in chat. Lane decisions the user makes go to `docs/DECISIONS.md` in a small O1 PR.
- Post a short status on issue #1 (team board) after each batch of merges.

## Open PRs at 18:15

| PR | Owner | State |
|---|---|---|
| #92 O2-A3 ULDK parcels | O2 | ready, not reviewed (minimum task) |
| #96 O2-B7 advisor report, #102 [contract] report link restore | O2 | #96 ready, #102 draft; review together |
| #97 [contract] providers.twins → caseBaseTwinsProvider | O4 | ready; merge after #106 (twins dedupe, own region, yields, lazy-load of the 385 KB cases.json) |
| #106 O4-B3 (2) twins follow-ups, #107 O4-A4 (4) money years | O4 | drafts |
| #104 O4-A4 (3) money tests read data | O4 | ready, not reviewed |
| #100 O3-B7b income calibration | O3 | ready, not reviewed (needed before #89) |
| #89 [contract] moneyAvailable = true | O3 | draft, waits for D39 |

## Open issues

- **#76 (O2):** card follow-ups. **Before the demo:** the sentence "The range under each score is a percentile range" is wrong for soil health (`RotationCard.tsx:87`, `en.json:60`). Also drawing inside an existing field does not work (`leafletMap.ts:90`).
- **#79 (O4):** money years (#107), twins items (#106).
- **#98 (O3, O4, O2):** income goal; item 5 has exact instructions for cover-crop costs (provider change plus 70.17 USD/ha from R9).
- **#105:** data audit of the real engine on both demo fields (new, not read by O1 yet).
- **#1:** team board.

## Decisions still open (ask the user)

- **Pitch owner (D14)**: script, at most seven slides, 30-second demo video. Nobody has it; the pitch lane should have started at 15:10.
- **Iowa demo result:** the current maize/soybean rotation ranks last of 215 under "Keep my soil"; check the soil weights with the team or a mentor before the pitch.
- Who connects Vercel (O1-S2), and when.
- At submission: whether the repo link must be public (D32; run TruffleHog again first).

## Research sessions

R8 (#66), R9 (#75) and R10 (#67) are merged; their sessions can be archived. Their notes are in `context/research/`.
