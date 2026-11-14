# Field Shift: team discussion notes

Sat 14 Nov, around 13:30 CET. From a voice discussion in the team, summarised. Input for the spec.

## Decisions

1. **Soil health is the core.** The main question the tool answers: which rotation keeps and improves soil quality on this field, given the data we have, for the USA and for Poland. Optimisation comes second.
2. **Money is an add-on, not the product.** Subsidies, costs and revenues are shown, but the tool must not turn into a price or subsidy comparison site. The team was explicit about avoiding that.
3. **Recommendations are not random.** Proposed rotations are built from:
   - the field's crop history,
   - the subsidies the farmer can get,
   - costs and revenues at current prices (for example fertilizer prices) and the expected profit of each crop,
   - and first of all, the effect on soil health and the field's climate risk from NASA data.

## Accessibility ideas (to rank in the spec)

| Idea | Team view |
|---|---|
| Local languages | wanted |
| Access through WhatsApp or Telegram | wanted, to check feasibility |
| Offline mode | possible, not key for this challenge |
| Pictures instead of text for people who read poorly | wanted |
| Sonification: data turned into sound | most advanced option; idea from Mikołaj |

One idea in the discussion was rejected as something "everyone does"; the transcript does not make clear which one. To confirm with the team.

## Decisions after the discussion (14:00)

- Show the **3 best rotations plus the current one** for comparison. The engine may score more; the screen shows these four.
- **WhatsApp/Telegram is an add-on:** the simplest version, a bot that sends back a link to the field report. A full chat through the bot only after T+8, if at all.
- **Sonification** (for example 45 years of soil moisture as sound, droughts heard as silence) is a pitch differentiator, built only if time is left.

## Concept and farmer journey (14:15)

Concept in one sentence: the farmer marks a field and gets the 3 best rotations plus the current one, ranked first on soil health and climate resilience from 45 years of NASA data, each with evidence, risks and data gaps, and only then the money; the same app works in the USA and in Poland.

Farmer steps:

1. **Find the field:** by address (GUGiK geocoder in Poland, Census in the USA, Nominatim elsewhere), by parcel number (ULDK, Poland) or by clicking the map.
2. **Boundaries:** the Polish parcel layer (KIEG) is shown on the map; the farmer can split a parcel, merge parcels or redraw the outline. Each part gets its own history and recommendations.
3. **Crops:** if data exists (USA, CropScape), the app asks "corn in 2025, soy in 2024, correct?" and the farmer confirms or corrects. If not (most of Poland), the farmer picks the last 2–3 crops from an icon list. The farmer's answer overrides satellite data.
4. **Priorities:** soil health is always on; the farmer adds water, forage, income and constraints.
5. **Rotations:** 3 best plus the current one, each card with why, evidence, benefits, gaps and risks.
6. **Money (add-on):** payments (eco-schemes and GAEC 7 in Poland, NRCS practices in the USA), costs and revenue. Does not change the ranking by default.
7. **Decision:** report for the farm advisor; optional bot that sends the report link.

Analysis engine (runs in the background, the farmer sees only results):

- **Field profile:** droughts, heat, frost, soil moisture, bare-soil periods and slope from NASA data.
- **Field twins:** places and years with similar climate and soil, what was grown there and how it did (county or regional yields, NDVI from NASA satellites). Twins are evidence inside the rotation cards, not a separate screen. Based on the established climate-analogue method (for example CCAFS Climate Analogues); what is new is adding soil, the crops actually grown and their results. Optional future view with NASA NEX-GDDP-CMIP6 projections (available without login on Planetary Computer and AWS).
- **Soil health score:** nitrogen, organic matter, erosion, pest-cycle break. Highest weight.

## Does the challenge require AI?

No. The Field Shift text mentions SI (Space Apps' term for AI) in the background as an opportunity and, in the "Potential Considerations" (marked "may, but are not required to"), suggests comparing SI or statistical approaches. Our twin search is such a pattern-finding method. A plain-language explanation on each card, written only from the numbers on screen, is optional. Any AI use must be disclosed in the submission.

## Open questions for the spec
- What "soil health" score we can compute from the data and defend (nitrogen, organic matter, erosion, structure, pest-cycle break).
- Which prices and payment rates we can source for 2026 in time.
