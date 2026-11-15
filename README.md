# CropShifter

The name was chosen on Sun 15 Nov (`docs/DECISIONS.md` D55); it lives in `src/app/brand.ts`.

A farmer says what matters most (keep the soil, improve it, or income), marks a field and gets the three best crop rotations for that goal plus the current one. Every rotation is scored against 45 years of NASA data for that field and shows its evidence, its data gaps and the risks to check locally. The tool supports the farmer's decision and does not replace it.

NASA Space Apps Challenge 2026 (14–15 Nov 2026), theme "The Next Frontier".

| | |
|---|---|
| Team | Vibecodersi |
| Local event | Poznań, Poland |
| Challenge | [Field Shift: Adapting Farms with NASA Data](https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/) |
| App | <production URL, task O1-S2> |
| Presentation | <link> |
| Demo video | <link> |
| Space Apps project page | <link> |

## How we work

The spec is [docs/SPEC.md](docs/SPEC.md), the task plan is [docs/PLAN.md](docs/PLAN.md), decisions are in [docs/DECISIONS.md](docs/DECISIONS.md). The process, schedule and prompts are in [HACKATHON.md](HACKATHON.md). Repo rules for people and agents are in [CLAUDE.md](CLAUDE.md). What we know about the event rules is in [context/rules.md](context/rules.md). Transcripts of team calls are in [context/meetings/](context/meetings/).

## Run locally

Node 22 or newer.

```bash
npm ci
npm run dev -- --port 5171
```

Dev ports per person: O1 5171, O2 5172, O3 5173, O4 5174.

## Tests

```bash
npm run typecheck
npm run test
npm run build
npm run validate:data
```

`validate:data` checks that every rule, crop trait and money row has a source and that precomputed files carry a `meta` block. `npm run e2e` runs the Playwright tests (O1's laptop only).

## Folder map

| Folder | Owner | Contents |
|---|---|---|
| `src/contracts/` | O1 | shared types and zod schemas; change only through a `[contract]` PR |
| `src/app/` | O1 | app shell, store, provider wiring, i18n, dataset registry |
| `src/ui-kit/` | O1 | `SourcedNumber`, `StateBoundary`, `Term`, `ScoreBar`, `ConfidenceBadge` |
| `src/fixtures/` | O1 | fixture fields, crops and analyses that every lane builds against |
| `src/map/`, `src/steps/` | O2 | map and the farmer's steps |
| `src/profile/`, `src/engine/` | O3 | NASA climate profile, scoring engine |
| `scripts/`, `data/precomputed/`, `data/crops/`, `data/rules/`, `data/money/`, `data/twins/`, `src/context-data/`, `src/money/`, `src/twins/` | O4 | data preparation and the data providers |
| `context/` | all | event rules and research results |
| `data/samples/` | all | saved API response samples that parsers are tested against |
| `docs/` | O1 | spec, plan, decisions, AI usage log |
