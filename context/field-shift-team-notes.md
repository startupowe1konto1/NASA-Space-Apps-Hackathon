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

## Open questions for the spec
- What "soil health" score we can compute from the data and defend (nitrogen, organic matter, erosion, structure, pest-cycle break).
- Which prices and payment rates we can source for 2026 in time.
