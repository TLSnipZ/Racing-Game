# Phase 7 — City directory and HUD XP contract

Baseline: `76e90f001e4ff6a29368b98136cdf0cd4d41f727` (Phase 6 / Save v5). This milestone implements the next numbered system, Kagehama City, and the requested small XP bar. Graphics & Audio I remains a separate open milestone; the district network is explicitly a schematic, not final artwork.

## HUD XP

`HudLevelProgress` uses the existing `getLevelProgress(reputation, playerLevel)` selector. The same cumulative reputation earned through job claims and race settlements drives both this bar and the Jobs progression panel. There is no new XP currency, counter, gain multiplier or save field.

The bar sits below the level number and stays inside the sticky top HUD across all six tabs and scroll positions. A visible label shows remaining REP. The native progress element has an accessible name and a value description containing the target level. At the Level 20 progression cap, it is full and displays `XP · MAX`; REP may continue growing. Higher grandfathered levels are not downgraded. A legacy higher level with insufficient REP displays a clamped 0% bar and the actual remaining REP to its next threshold.

Examples: Level 1 / 4 REP → 20%, 16 REP remaining. Level 2 / 20 total REP → 0%, 40 REP remaining. Thresholds stay `10 × level × (level − 1)`. Rendering does not mutate cached levels. Only the existing reward commands change progression.

## City and access

The City tab becomes available after a starter has been purchased. The district catalog and membership are explicit data in `src/data/city.ts`, not inferred from names.

| District | Existing level gate | Races | Jobs / services |
| --- | ---: | --- | --- |
| East Ward | 1 | East Ward Shakedown; Ward Club Circuit | Garage Shift; Parts Run; Garage; Workshop |
| Dockside | 2 | Dockyard 402; Dockyard Redline | Dockside Delivery (still Level 3) |
| Hakuro Pass | 2 | Hakuro First Descent; Hakuro Switchback Club | No jobs here yet |
| Eastline Expressway | 3 | Eastline After Hours; Eastline Midnight Club | No jobs here yet |
| Industrial District | Not implemented | None | Future Phase 12 business/crew content |
| Outer Kagehama | Not implemented | None | Future Phase 11 barn finds/restoration |

District gates match the minimum existing activity levels. All previously available events/jobs remain available through their original boards. Club events keep their higher event-specific requirements. The city is a navigation directory, not a new access token layered over the existing domain. Any future stricter world gates must also be enforced by the domain commands before accepting money.

Locked and future nodes are inspectable for preview; new-activity links are disabled until their district is open. Future nodes never unlock merely from reaching maximum level. Details show flavor, entry requirements, source-catalog event fees and job payouts, existing service links and settled race records. No extra content or free vehicles are implied by preview locations.

## Navigation and filtering

Clicking a district only changes local inspection. Clicking Browse Races/Jobs opens the appropriate real tab and selects that district. City-to-Races navigation resets the discipline filter to `all`, avoiding a stale Touge filter hiding a Dockside invitation. Normal tab switches retain the selection. The tab receives keyboard focus on section shortcuts.

The race board combines district and discipline filters and provides a clear-all control for empty results. The job board filters contacts by district, with an explicit empty-state message and an All districts reset. Counts reflect the current district. Filter operations do not refresh/reroll catalogs, charge money, activate a car or enter a race.

The active race/job and latest receipt are outside the filtered offers. A result can never be hidden by browsing a different district. A City activity banner resumes the original pending activity, even while a locked/future district is being inspected or an old imported level is below the event's gate. Resume does not accept a new activity or bypass validation on settlement. Existing one-job-OR-race, timing, assigned-car locks and exact-once settlement rules remain intact.

No physical location, travel timer, entrance cost, new rental, district unlock reward or discovery payment is introduced. Garage and Workshop links open existing services. City does not award money or add mileage.

## Save compatibility

**No schema change: Save v5 and KAGEHAMA1 remain unchanged.** City access and XP are derived from existing state. District/race/job filters are presentation preferences, retained during ordinary switches but reset on reload and successful full import/reset. They are intentionally absent from exported game codes.

Existing serializers, domain gameplay commands, model-v1 racing, historical fixtures, money and level thresholds are unchanged. Valid v1–v4 data still migrate through the existing chain. Current v5 tuned cars, receipts, records, paid/unsettled race snapshots and pending jobs are neither recalculated nor paid by the new UI. No rollback/import can manufacture city rewards because no such rewards exist.

Global protected-save recovery remains outside the tabs. Browsing requires no write; gameplay still follows durable-write-before-visible-state. Unsupported/corrupt saves are never deleted automatically. Existing single-browser-tab limitations remain documented.

## Verification

Keep all previous regression suites, adapting only navigation expectations for the newly enabled City tab. Add tests for complete explicit membership, unchanged gates, future previews, combined filters, empty-state recovery, no state mutation, old-save reading and XP thresholds/cap/legacy levels.

Production-build browser checks cover all six tabs, keyboard routing, no XP advance before claims, level-up boundaries, immediate district access, matching city shortcuts, filter persistence/reset, job/race continuation while browsing, paid-result recovery despite lower imported levels, read-only browsing during storage-write failure, and 320/390/1440-pixel layouts with the sticky HUD. Review generated screenshots. Verify the final clean commit on main before reporting the site as published.
