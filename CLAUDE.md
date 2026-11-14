# Repo rules (read before every change)

Project: Field Shift tool (working name, final name at the end, D13) · Team: Vibecodersi · Challenge: Field Shift: Adapting Farms with NASA Data · NASA Space Apps Challenge 2026.
T0 = Sat 14 Nov 2026, 11:09 CET. Deadline = Sun 15 Nov 2026, 11:59 CET (Polish time). Process and prompts: HACKATHON.md. Event rules: context/rules.md.

- Spec: docs/SPEC.md. Current plan: docs/PLAN.md (a newer version wins). Decisions: docs/DECISIONS.md.
- You work on one task from the plan (ID, e.g. O2-A1). PR title starts with the ID.
- You write only in your person's folders (SPEC §13). Any other file: a separate small PR titled `[contract] ...`, reviewed by O1.
- Shared types only from `src/contracts/`. A new dependency only through a [contract] PR.
- Each session works in its own git worktree, never in the main folder while another session runs there.
- Dev server port: O1 5171, O2 5172, O3 5173, O4 5174. e2e tests only on O1's laptop.
- Never: push to main, `--force` without `--with-lease`, `gh pr merge --admin`, `git add -A`, push to someone else's branch.
- Secrets only in .env (local) and hosting variables set via CLI. Never in code, logs, PRs, chat.
- Data only from the allowed sources listed in SPEC §15 (NASA POWER, GIBS, Planetary Computer, FAO GAEZ, USDA CropScape, QuickStats and Soil Data Access, SoilGrids, GUGiK, US Census, Nominatim, OpenStreetMap tiles, Eurostat). Any other server = ask a human.
- Generated files (`data/precomputed/`, `data/twins/`, `docs/tasks.json`) are regenerated with their script after a conflict, never merged by hand.
- API parsers are written against a saved sample in data/samples/, not from memory.
- TDD: test → red → code → green. UI tests wait for specific text (waitFor), not just the element.
- Before a PR: git fetch && git rebase origin/main && npm run typecheck && npm run test && npm run build && npm run validate:data.
- Every screen has states: loading, offline, no data, source error. Never an empty screen.
- English UI text and docs go through the anti-ai-writing skill.
- Every person logs AI use in docs/ai-usage/O<n>.md (Space Apps requires an AI usage description in the submission).
- Answer in chat. A file in the repo is an extra, not a replacement for the answer.
- Get the time with `TZ=Europe/Warsaw date`, don't guess.
- Branch names: `o<n>/<id>-<topic>`. Claim a task with an empty commit and a draft PR right away (HACKATHON.md §9).

## Skills to use

- Spec: `superpowers:brainstorming`. Plan: `superpowers:writing-plans`. Bugs: `superpowers:systematic-debugging`. Before "done": `superpowers:verification-before-completion`.
- Library APIs: query Context7 before writing code against a library.
- UI: `ui-ux-pro-max`; audit pass with `impeccable`.
- Secrets scan before making the repo public: `trufflehog git file://. --no-update`.

## Topic-specific content rules

- A number from the analysis reaches the screen only as a `Sourced` value through `<SourcedNumber>`: dataset, native resolution, period, retrieval date, and "observed", "model estimate" or "our calculation". NASA POWER and SMAP L4 are model estimates; say so.
- Missing data is `value: null` with a reason. Never fill a gap with a default or an invented value.
- Every rule, crop trait, price and payment rate has a source (title, URL, locator) copied from the opened document, not from memory. `npm run validate:data` rejects rows without one.
- Every rotation card has gaps and risks for local review in its body, and the sentence that the tool supports the farmer's judgment and does not replace it.
- Soil health and climate resilience are shown first on every card, whatever the goal. No ranking by payments alone (D9).
- The income figure is a replay of past years at today's prices. Never call it a forecast and never promise a yield.
- The engine returns message codes; text lives in `src/<module>/messages/en.json`. Explain every technical term through `<Term>` and the glossary.
- No NASA logos in generated content.
