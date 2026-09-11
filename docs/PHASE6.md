# Phase 6 — Racing and shop categories

Baseline: `77760f1fad2dc7ba0b4e5f7992dbf74a758f4f21` (Phase 5 / Save v4). This milestone adds the first playable race loop, not a real-time driving or physics game. Existing starters, part prices/effects, job rewards, durations and reputation thresholds are unchanged.

## Player flow

Garage → choose a race vehicle in **Races** → filter invitations by discipline → **RACE BRIEFING** → review the car, three opponents, entry fee and every placement's gross/net payout → **ENTER RACE** → 3-second countdown and compressed sector replay → **SETTLE RESULT**.

The Races tab is enabled after the starter purchase. Exactly one content section remains visible, the cash/level/rep HUD and navigation stay at the top, and City remains unavailable. Navigation and presentation never award money or write game state. A Races READY badge signals an unsettled finish even while another section is open. Reload returns to Garage but preserves the ongoing race and its original deadline/result.

Selection in the race board does not change the active garage vehicle. The entry briefing captures the selected vehicle ID and a build key; confirmation rejects a stale changed build. The complete race simulation is stored at acceptance before the visible entry fee or current activity changes.

## Initial invitations

Durations include the 3-second start. Yen columns are gross prizes, not profit. Reputation follows placement in the same order. Entry fees are paid once at acceptance, so a weak finish can return less than the fee.

| Event | Discipline / tier | Level | Entry ¥ | Duration | Gross prizes ¥ (1st / 2nd / 3rd / 4th) | REP (1st / 2nd / 3rd / 4th) | Km |
| --- | --- | ---: | ---: | ---: | --- | --- | ---: |
| East Ward Shakedown | Street Sprint / Rookie | 1 | 0 | 21s | 3,000 / 1,800 / 1,000 / 400 | 8 / 5 / 3 / 1 | 3 |
| Dockyard 402 | Drag / Rookie | 2 | 1,000 | 18s | 5,500 / 3,200 / 1,800 / 500 | 12 / 8 / 5 / 2 | 1 |
| Hakuro First Descent | Touge / Rookie | 2 | 1,000 | 28s | 6,500 / 3,800 / 2,000 / 500 | 14 / 9 / 5 / 2 | 5 |
| Eastline After Hours | Expressway / Rookie | 3 | 1,500 | 33s | 8,000 / 4,500 / 2,400 / 700 | 18 / 11 / 7 / 3 | 12 |
| Ward Club Circuit | Street Sprint / Club | 4 | 2,000 | 28s | 10,000 / 6,000 / 3,000 / 1,000 | 24 / 16 / 9 / 4 | 6 |
| Dockyard Redline | Drag / Club | 5 | 3,000 | 23s | 12,500 / 7,500 / 3,800 / 1,500 | 28 / 18 / 11 / 5 | 1 |
| Hakuro Switchback Club | Touge / Club | 5 | 3,000 | 33s | 14,500 / 8,500 / 4,500 / 1,500 | 32 / 20 / 12 / 6 | 7 |
| Eastline Midnight Club | Expressway / Club | 6 | 4,000 | 38s | 17,500 / 10,000 / 5,500 / 2,000 | 38 / 24 / 14 / 7 | 18 |

All numbers are provisional game balance. A fee-free Level 1 sprint remains available even at zero cash, provided the car can drive and no other activity is pending. On-foot Garage Shift remains the non-driving fallback after settling/withdrawing. Drag odometer distance includes staging/return; it is not a claim that the competitive drag is a kilometre long.

## Model v1: builds matter by sector

There is no RNG in this first model. The same build, condition, rivals and course produce the same sector times. Repeating or reloading is not a way to reroll a defeat. Players improve times through build decisions; there is no manual steering, gear input or reaction minigame yet.

The model copies derived tuning power/weight, grip, handling, braking, reliability and the accepted vehicle's engine/transmission condition. Body condition, originality, drivetrain, weather, aerodynamic drag, top speed and true turbo lag are not separately simulated in v1. Existing part trade-offs operate through the published build ratings; reliability is not wear or a random breakdown chance.

Let `E = (8000 + 20 × engineCondition) / 10000`, `T = (8000 + 20 × transmissionCondition) / 10000`. All ratings/conditions are 0–100. Factors are:

- Power = round(clamp(PS × 50, 1000, 20000) × E).
- Acceleration = round(clamp(PS / kg × 50000, 1000, 20000) × E × T).
- Lightness = round(clamp(10000000 / kg, 1000, 20000)).
- Grip, handling, braking, reliability = their respective rating × 100.

Each sector uses a weighted score, rounded once after dividing the weighted sum by 100. Its time is `round(baseTimeMs × 10000 / (4000 + score))`. Weights sum to 100:

| Profile | Weights |
| --- | --- |
| Launch | Acceleration 55, grip 30, reliability 5, power 5, handling 5 |
| Technical | Handling 35, grip 25, lightness 20, braking 15, acceleration 5 |
| Braking | Braking 50, grip 20, lightness 20, handling 10 |
| Flow | Handling 25, acceleration 30, grip 15, braking 15, lightness 15 |
| Straight | Power 40, acceleration 50, grip 5, reliability 5 |
| High-speed | Power 65, acceleration 10, handling 10, reliability 15 |

Sprint combines launch/flow/braking/straight; Drag uses launch/straight/high-speed; Touge uses braking/technical/flow/technical; Expressway uses launch/high-speed/flow/high-speed. Opponents use the same model. Rookie and Club grids have fixed, explicitly catalogued builds, not hidden bonuses. An exact tie retains grid order; the player is the fourth grid entry.

Simulation times are fictional benchmark values. The replay fits the slowest finisher into the event's playback duration and maps each sector to an equal visual distance. It does not represent real physical speed, lap length or frame-by-frame car motion. Reduced-motion preferences avoid extra transitions. Screenshots and controlled-clock browser tests cover the presentation.

The model-v1 function is part of the save compatibility contract: keep it stable for existing snapshots when a future model is introduced. Validators recompute v1 sector times to reject inconsistent snapshots rather than trusting arbitrary saved rankings.

## Transactions, locks and accounting

There is **one player job OR race at a time**. A finished-but-unclaimed activity is still pending. Entry cannot bypass a pending job; job acceptance cannot bypass a pending race. The driver has not unlocked crew automation.

Acceptance copies event name/discipline, sectors, prizes, rivals, player build, vehicle ID, run ID and timestamps into `activeRace`. It deducts only the entry fee, increments the sequence and tracks fees paid. It does not yet award money, reputation, mileage or a race record. The durable session boundary writes first, then updates visible state.

The assigned car cannot be tuned or restored to stock until settlement/withdrawal, including after the replay has finished. Another parked car can still be tuned. Changing the active garage car does not change the race's participant, simulation or mileage recipient.

Settlement names the current run ID, checks the clock/deadline and validates the saved snapshot. Gross prize, reputation, level advancement, assigned-car mileage, completion/win/podium counts, per-event best time/best place and the last full receipt are one saved state change. Level-up follows the existing cumulative reputation thresholds and never downgrades a valid legacy level. Stale/duplicate claims cannot award a second prize within the current save. Pure commands use safe-integer checks and do not mutate inputs.

Withdrawal requires confirmation in the UI and names the current run. It **does not refund the entry fee** or award prize/rep/mileage/records. It increments the cancelled count and remains available after a backwards clock jump. There is no police, damage, fuel, wear, forced car sale or vehicle loss.

Career income shows gross prizes and net income (all prizes minus all paid fees, including pending and withdrawn entries). Best times are stored separately from the latest finish. A free sprint supplies an entry point; jobs remain a predictable way to fund upgrades or recover from paid-race losses.

## Save v5

Browser key: `kagehama:save`. Export transport: `KAGEHAMA1-...` unchanged. Frozen historical state types now include Save v4. Valid v1/v2/v3 data take the existing migrations; v4 retains its exact per-car purchased/fitted inventory. Every valid old save receives an **empty racing record**, without imaginary past race winnings, entry fees, records or time.

Current v5 requires `racing`; missing v5 fields are rejected rather than silently downgraded. Active builds are bounded, entrants/prizes/sectors are length-limited, times are checked against model v1, counters and per-event records are reconciled, and a live job plus live race is rejected. An active race must refer to an owned car. Last-result snapshots may outlive a car in future market phases.

Export/import include pending races and the last receipt. Import replaces the whole snapshot; intentionally importing an older code rolls progress back and is not prevented. Loading a completed timer does not settle it or repeat races. The device clock and local saves are user-controlled, so this is validation and best-effort stale-tab protection, **not server-authoritative anti-cheat**. Do not treat the raw code as trusted multiplayer data.

Malformed/newer saves remain protected and are never automatically deleted. Failed entry writes consume no cash; failed settlement writes leave the pending result intact for retry. Reset returns to the original starter choice and clears racing alongside the rest of the state. Export a backup first.

## Shop categorisation

Workshop now has visible **component-type buttons** and the existing category dropdown, sharing one filter state. Categories: all, intake, exhaust, ECU, tires, suspension, brakes, weight reduction, turbo. Counts and selection state are visible; compatibility still applies per target vehicle. Category changes are UI-only, keep their state across ordinary section switches, and never buy/fit anything. On narrow displays the category row scrolls internally without widening the page.

The vehicle market remains Phase 8, not part of this release. Its planned filters include **manufacturer/brand, model year/year range and body type** (for example hatchback, coupe and sedan), with combinable filters, reset, result counts and sorting. Store these as structured catalog/listing fields instead of guessing them from names. Price, drivetrain, condition and mileage are useful additional candidate filters. Browsing/filtering must not reroll listings, spend money or change owned vehicles. See the roadmap.

## Verification

Retain all prior game/economy/garage/tuning/persistence regression coverage. Add race catalog/model/balance/entry/settlement/withdrawal/overflow/activity-lock tests, malformed snapshot checks and a fixed v4 tuned-save fixture with a pending Parts Run. Browser scenarios cover real navigation, fees, exact-once payout, countdown/reload/absence, cross-section READY, concurrent-activity rejection, assigned-car locks, failed writes, export/reset/import, stale tabs, keyboard access and desktop/mobile layouts. Review screenshots and only report the release as live after the main Pages deployment succeeds.
