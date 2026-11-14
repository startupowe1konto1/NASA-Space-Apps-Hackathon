# Handoff for O4 (data), with two questions for O3: why every Poznań card says "weak"

Written Sun 15 Nov 2026, 00:25 CET by the O2 session, at the pitch owner's request. `HANDOFF-frontend.md` ("Weak evidence": what causes it) explains the Iowa case and ends with "Check the Poznań cards too". This file is that check. It changes no code and no data.

## In one paragraph

On the field the pitch uses, every rotation card carries `weak` confidence on its soil health score. That is the engine's rule working as written, not a fault. The label goes away only when rule rows are added to `data/rules/` (O4) and the organic matter score reads the field's soil class and the ranges it already has (O3): it is mostly data work with sources, not a bug fix. Adding one row is not enough; the table in "What would change it" says what has to land together. If it does not land before the freeze, the label stays and the team explains it.

## The field and how to see it

- Parcel `302116_5.0015.28/1`, Uzarzewo near Poznań, 22.0 ha. Crop history entered by hand: winter wheat, winter rapeseed, winter wheat, winter rapeseed, winter wheat (2022–2026). Goal: Keep my soil.
- In the app: step "Field", parcel number search, then the crop years, then the rotations screen. The reason is the first line of each card's gaps: "Low confidence in the soil health score: two or more of its inputs or rules are missing."
- The numbers below come from `analyzeField` with the app's providers on `main` at `0f6cd85`, run on Sun 15 Nov, 00:10.

## What each card gets

The four cards shown for the soil goal:

| Card | Nitrogen | Organic matter | Pest break | Erosion | Total |
|---|---|---|---|---|---|
| Field pea → winter wheat → potato + phacelia | 33, weak, one-value rule | not scored | 100, strong | not scored | 75, weak |
| Field pea → winter wheat → winter rapeseed + phacelia | 33, weak, one-value rule | not scored | 67, strong | not scored | 58, weak |
| Field pea → field pea → rye | 67, weak, one-value rule | 83, weak, one-value rule | 33, strong | not scored | 61, weak |
| Winter rapeseed → winter wheat (the farmer's own) | 0, moderate, rule with a range | 50, weak, one-value rule | 50, strong | not scored | 33, weak |

The rule (`src/engine/soilHealth.ts`, comment at line 46): an indicator starts at strong, drops one level when a rule it uses has one value and no range, and one level for each missing input. The total takes its weakest indicator and drops one more level when an indicator is missing.

So on this field the total is `weak` twice over: at least one indicator is already `weak`, and erosion is missing on every card.

## Why each indicator is where it is

1. **Erosion, not scored on any card.** The cards' own gap lines name the crops: no soil cover value (C factor) for field pea, for winter rapeseed, for phacelia. `data/rules/erosion.json` has rows for maize, soybean, small grain, potato, sugar beet and meadow. This is the O4 item already in `HANDOFF.md` ("Erosion C factor rows are missing for white mustard, field pea, phacelia and winter rapeseed").
2. **Organic matter, not scored on the two cards with phacelia.** The gap line: "No sourced rule covers every crop in it yet." `data/rules/humus.json` has a coefficient for every main crop here (potato, winter wheat, winter rapeseed, field pea, rye) and none for phacelia as a catch crop.
3. **Organic matter, `weak` where it is scored.** Two gap lines explain it: "Organic matter uses the coefficients for medium soil. Your soil class may differ." and "Organic matter is not adjusted for climate and soil texture. No sourced rule yet." The basis reads "rule of thumb", although `humus.json` has the `humus.vdlufa.*` rows with a low and a high value.
4. **Nitrogen, `weak` on the three cards with field pea.** `nitrogen.credit.field-pea.pl` is one value (25) with no range. The farmer's own rotation has no legume and is `moderate`.

## What would change it

| # | Add or change | Owner | Effect on these cards |
|---|---|---|---|
| 1 | Erosion rows for field pea, winter rapeseed and phacelia (C factor or soil loss ratio by crop stage, like the existing `erosion.slr.*` rows) | O4 | Erosion is scored. Alone it changes no label: the totals still have a `weak` indicator. |
| 2 | A humus row for phacelia grown as a catch crop (the source table behind `humus.vdlufa.winterCatchCrops` may cover it; check the document, do not assume) | O4 | Organic matter is scored on the two phacelia cards. |
| 3 | A low and a high value for `nitrogen.credit.field-pea.pl`, if the source gives a range | O4 | Nitrogen on the pea cards moves up one level. |
| 4 | Soil class for the humus coefficients from the field's own sand and clay share, instead of "medium" for everyone (this field: sand 71.4%, clay 10%, from SoilGrids) | O3 | Removes the "medium soil" gap and one level on organic matter. |
| 5 | Use the `humus.vdlufa.*` low and high as the range of the organic matter score, if that is what they are for | O3 | Organic matter stops being "rule of thumb". |

A card leaves `weak` only when it has no missing indicator and no `weak` indicator. Read against the rule as written, the farmer's own rotation needs rows 1, 4 and 5, and the pea cards need rows 1 to 5; O3 should confirm, because the second question below is still open. Row 1 on its own is worth doing for the content (erosion on the Poznań cards), not for the label.

## Two questions for O3

1. `erosion.slr.smallGrain.conventional` says in `appliesTo`: "winter small grain (winter-wheat, rye, winter-rapeseed as nearest)". The engine still reports no C factor for winter rapeseed. Either the engine should read that row for rapeseed, or the row's text promises something the data does not back. Which one?
2. Nitrogen on the pea cards is two levels down, and one value without a range explains one level. What is the second?

## Rules for the rows (from `CLAUDE.md`)

- Every row has a source: title, URL and locator, copied from the opened document, with the excerpt saved under `data/samples/rules/`. No value from memory, no value "close enough".
- A crop the source does not cover stays a gap. Borrowing the nearest crop's row is a method choice: ask the pitch owner and record a D-line, as D53 did for the wheat Ky.
- `npm run validate:data` must pass. New rows go in an ordinary PR in `data/rules/` (O4's folder), reviewed by O1.
- Any source outside SPEC §15 needs a person's yes first.

## What this means for the pitch

- The deck (`pitch/SPEC.md`, slide 4) shows the uncertainty as a range on the bar and does not print the word. The app screenshots on slide 6 will show the label as the app shows it.
- The answer for the jury, if rows 1–5 are not in: the tool says how sure it is and names what it did not check; the challenge asks for exactly that.
- If any of this lands before the freeze (Sun 08:10), tell the pitch owner: `sh pitch/deck/scripts/export-data.sh` has to be rerun and the screenshots retaken.
