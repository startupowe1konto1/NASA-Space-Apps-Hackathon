# Sources of the rule tables

Every row in `data/rules/*.json` names its source (`sourceTitle`, `sourceUrl`, `sourceLocator`). This file lists the sources, what was taken from each, the rows the team set itself, and the rules still missing. A mentor should review it before the Sunday freeze.

## Sources opened

| Source | URL | Used for |
|---|---|---|
| U.S. Drought Monitor, Drought Classification | https://droughtmonitor.unl.edu/About/AbouttheData/DroughtClassification.aspx | `hazards.drought.percentile` = 20: category D1 "Moderate Drought" spans the 10.01–20.00 percentile range |
| NASA POWER parameter dictionary | https://power.larc.nasa.gov/api/system/manager/parameters?community=AG&parameters=FROST_DAYS,T2M_MAX,GWETROOT&temporal=monthly | definitions of the three hazard indicators (GWETROOT, T2M_MAX, FROST_DAYS); saved in `data/samples/power/parameters-frost-tmax-gwetroot.json` |
| FAO GAEZ v4 res05 legend, "Crop Suitability Index in Classes" | https://gaez-services.fao.org/server/rest/services/res05/ImageServer/legend?f=json | class bounds (SI > 75 very high … SI > 10 marginal, SI > 0 very marginal) and the exclusion line at SI ≤ 10; saved in `data/samples/gaez/res05-legend-suitability-classes.json` |

## Rows the team set itself

These are labelled `team decision` or `team rule of thumb` and the screen says so.

| Row | Value | Basis |
|---|---|---|
| `goals.*.weights` | SPEC section 7 table | team decision D9 |
| `goals.soilFloor.points` | 5 | team decision D9 |
| `goals.shownOthers.count` | 3 | team decision D20 (a) |
| `goals.priorityDoubling.factor` | 2 | team rule of thumb, SPEC section 7 |
| `hazards.calendar.markShare` | 0.2 | team rule of thumb, SPEC section 8 |

## Missing

- Heat and frost thresholds per crop group: not in this table. Each crop row in `data/crops` carries its own sourced thresholds (task O4-A2), and the engine uses those.
- `nitrogen`, `humus`, `erosion`, `pest-break`: follow in the next O4-B0 pull request.
