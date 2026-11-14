# Decisions

Answers to questions, collected up front so agents don't have to ask. Newest at the bottom. Format: `D<n> (time, who): question → answer`.

- D1 (Sat 11:09, O1): Which framework do we follow? → HACKATHON.md, 24 h sprint from T0, time after T+24 until the Sunday deadline is buffer.
- D2 (Sat 11:09, O1): Repo visibility? → public from T0 (needed for main protection and auto-merge on the free plan; Space Apps needs it public anyway).
- D3 (Sat 11:09, O1): Language of repo, UI and submission? → English.
- D4 (Sat 11:20, O1): Team name and deadline? → Vibecodersi; deadline Sun 15 Nov 23:59 Poznań time. The 24 h sprint still ends Sun 11:09; the rest is buffer.
- D5 (Sat 11:52, O1): Deadline correction → Sun 15 Nov 11:59 Polish time, not 23:59 (replaces D4's deadline). The 24 h plan stays: freeze and submit at T+23 (10:10), so there is no buffer after T+24.
- D6 (Sat 12:02, O1): Is Flame in Freefall dropped with group 3? → No, it stays on the shortlist (five challenges). Health Monitoring stays dropped. Research question 5 checks PSI data access.
- D7 (Sat 13:10, team): Which challenge and where are the demo fields? → Field Shift: Adapting Farms with NASA Data. Demo fields in Iowa (USA) and near Poznań (Poland). The other challenges are dropped.
- D8 (Sat 14:30, team): Does the deadline change after reading the official guide (11:59 p.m.) and the Poznań schedule (13:30 at the info desk)? → No. D5 stays: Sun 11:59, freeze and submit at 10:10. It is stricter than both.
- D9 (Sat 15:00, team): What decides the ranking of rotations? → The farmer's main goal, chosen first: keep the soil, improve the soil, or income. Default is keep the soil. Income is margin replayed over the field's 45 NASA years plus confirmed payments; there is no ranking by payments alone. A rotation more than 5 points below the current rotation's soil health is not offered. This replaces the HANDOFF rule "money must not reorder the ranking by default". Weights: SPEC section 7, open to the mentor's review.
- D10 (Sat 14:30, team): Stack and hosting? → Vite, React, TypeScript, Tailwind, Leaflet with proj4 and Geoman, Zustand, zod, Vitest, Playwright; static build on Vercel, one serverless function allowed for the CropScape proxy. No backend service.
- D11 (Sat 14:40, team): How is the work split? → O1 merger, reviewer and monitoring; O2 frontend; O3 engine; O4 data and evidence. Two streams per person with separate folders (SPEC section 13) so subagents can run in parallel. People are assigned to O1–O4 when lanes start.
- D12 (Sat 14:40, team): Are field twins and parcel split/merge in the minimum? → No, they are parallel tracks that start with the lanes and ship when ready. The contract has their empty states from the skeleton on.
- D13 (Sat 14:20, team): Project name? → Decided at the end. Until then "Field Shift tool", kept in `src/app/brand.ts` and one line of the README.
- D14 (Sat 14:50, team): Who owns the pitch? → Assigned after the skeleton is on `main`.
- D15 (Sat 15:00, team): Is "every number that decides a recommendation comes from NASA data" (HANDOFF) still the rule? → Reworded. The field's NASA record acts inside every score except the pest-cycle break; crop rules, soil surveys and prices are labelled as what they are (SPEC sections 2, 7 and 10).
