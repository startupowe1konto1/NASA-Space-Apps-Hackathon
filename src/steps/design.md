# Visual direction (O2-B1)

Who uses it: a farmer on a phone, standing in a field. Bright sun, maybe gloves, one free hand, a few minutes. The farm advisor later reads the same screens on a laptop or on paper.

Written Sat 14 Nov 2026 after a `ui-ux-pro-max` pass. Its generated design system suggested a dark OLED style and a luxury serif; both are wrong for a screen read in sunlight, so we kept only its agriculture palette idea (field green with a harvest-gold accent) and its touch and contrast rules.

## Rules

1. **Light theme only.** Dark text on white reads best in sunlight. No dark mode before Sunday.
2. **Contrast 4.5:1 or more for all text,** 7:1 for body text where we can. Never `slate-400` or lighter for text.
3. **Touch targets at least 44 px,** 64–72 px for the main choices on a step. At least 8 px between targets.
4. **Icon and colour before text, never instead of it.** Every icon sits next to its label. Colour never carries meaning alone: a state also has a word, a pattern or a mark.
5. **One main action per screen,** in the footer ("Next"). Choices on a step are big cards, not small controls.
6. **Motion is short and optional:** colour and transform only, 150 ms, and off under `prefers-reduced-motion`.

## Colours (Tailwind defaults, so no theme change is needed)

The skeleton already uses emerald and slate, so the steps use the same scale. No `[contract]` PR to `tailwind.config.ts` was needed.

| Role | Class | Hex | Use |
|---|---|---|---|
| Primary | `emerald-700` | #047857 | chosen card border, switch on, main button |
| Primary tint | `emerald-50` | #ECFDF5 | chosen card background |
| Text | `slate-900` | #0F172A | headings, labels |
| Text, secondary | `slate-700` | #334155 | hints, explanations (9.6:1 on white) |
| Lines | `slate-300` / `slate-500` hover | | card borders |
| Notice | `amber-50` bg, `amber-900` text | | "not loaded yet", "check locally" |
| Error | `amber-700` border | | source errors (from `<StateBoundary>`) |

Reserved for later steps (calendar strip, cards): drought `amber-700`, heat `red-700`, frost `blue-700`; bare soil `stone-500` with a hatch pattern; living crop `emerald-600`; cover crop `lime-500`; residue `yellow-700`. Each hazard also gets its own mark so the strip works in black and white print.

## Type

System font stack (Tailwind `font-sans`). No web font, so nothing loads from a host outside SPEC section 15 and the first screen paints at once on a weak signal.

| Use | Class |
|---|---|
| Step question | `text-2xl font-semibold` |
| Card title, switch label | `text-lg font-semibold` |
| Body, hints | `text-base` (16 px, never smaller for something the farmer must read) |
| Badges, counts | `text-sm font-medium` |

## Icons

`src/steps/icons.tsx`: line icons drawn for this project, 24 × 24 grid, 2 px stroke, round caps, `currentColor`, `aria-hidden`. No icon package, so no new dependency. Crop icons for O2-B2 go in the same file in the same style.

## Components used on the steps

- **Choice card** (goal step): full-width button, `role="radio"`, icon in a 48 px circle, title and one-line hint. Chosen: emerald border and tint, white icon on emerald.
- **Switch row** (priorities): label wrapping a visually hidden checkbox, title and hint, switch drawn at the end. The input is labelled by the title only, the hint is its description.
- **Tick list** (excluded crops): two columns from 640 px, one column on phones; a ticked crop is struck through.
- **States:** every list that loads goes through `<StateBoundary>` (loading, offline, no data, source error with retry).
