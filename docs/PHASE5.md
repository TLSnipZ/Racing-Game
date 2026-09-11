# Phase 5 — Interface & Tuning contract

Baseline: `c95f300fde3cb9100e22cf77f8d0c290848653ca` (Phase 4 / Save v3, plus agreed Phase 5 plan). This milestone implements 5A and 5B together. Existing starter prices, job durations/rewards and level thresholds are unchanged.

## 5A: shared shell

The header is sticky at `top: 0` and contains a compact brand, full cash/level/rep HUD and tab row. Garage, Jobs, Workshop and Saves have separate `tabpanel` containers. Inactive panels use the native `hidden` attribute plus a scoped display guard; they have no layout or keyboard/accessibility presence. Keeping them mounted preserves inspection/search/filter/forms across ordinary switches. A successful reset/import resets local garage/workshop view state and returns to Garage. Reload opens Garage; navigation is UI state and not stored in the game schema.

The session and one presentation clock live above all views. A tab switch does not save, restart a timer, activate a car, charge money, claim a job or reload the application. A Jobs READY badge announces a claimable contract without paying it. Save warnings remain outside the panels, with access to Saves even before choosing a starter. City/Races are disabled until implemented.

Tabs use selected-state semantics, roving tab index and Left/Right/Home/End keyboard operation, skipping disabled entries. The navigation row may scroll horizontally on a narrow display. A ResizeObserver measures header height for focus/scroll offsets. Modal part previews use a native dialog with Escape/Cancel and focus restoration. See the [WAI tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) and [React state preservation](https://react.dev/learn/preserving-and-resetting-state) for the underlying interface patterns. Automated Chromium checks do not replace testing every assistive-technology/device combination.

## 5B: economy and ownership decisions

Each individual vehicle has `tuning: { purchasedPartIds: string[], installedBySlot: Partial<Record<TuningSlot, string>> }`. Purchase and installation are one atomic command. Each slot has at most one fitted upgrade. Ownership is per vehicle, including duplicate models; no cross-car sharing, selling or transfer yet. Swapping retains the removed part. Removing to stock is free and pays no refund. Reinstalling an already-purchased part is free, with compatibility and level requirements still enforced.

The confirmation preview identifies the target vehicle and captures the expected currently installed part in that slot. Stale/double commands are rejected. Insufficient/invalid money, unearned levels, unknown/incompatible parts and unowned targets do not change state. Storage must succeed before the new build/balance is published. The UI uses the same requirement function as the domain command.

A delivery-assigned vehicle is locked until its contract is claimed/cancelled, even after the deadline or after a different car is activated. An unrelated parked vehicle remains available. An on-foot Garage Shift locks no vehicle. Job payouts/deadlines/mileage snapshots are unaffected by tuning.

## Initial catalog and balance

All parts fit the three starters unless noted. Prices are provisional game balance, not real-world prices. First parts cost about four short Garage Shifts; early earnings now have spending goals without locking out the worn turbo starter.

| Part / brand | Slot | Level | Yen | Exact modifiers |
| --- | --- | ---: | ---: | --- |
| Panel Filter / Aoba | Intake | 1 | 6,000 | Power +5%; originality −1 |
| Cold-Air Intake / Senka | Intake | 4 | 16,000 | Power +9%; weight −2 kg; reliability −1; originality −2 |
| Street Cat-Back / Aoba | Exhaust | 2 | 9,500 | Power +8%; weight −3 kg; reliability −1; originality −3 |
| Balanced ECU / Aoba | ECU | 2 | 8,000 | Power +6%; reliability +2; originality −1 |
| Attack ECU / Kurogane | ECU | 3 | 17,000 | Power +14%; reliability −6; originality −2 |
| Street Sport Tires / Aoba | Tires | 1 | 6,500 | Grip +8; handling +2; braking +2; originality −1 |
| Track Semi-Slicks / Senka | Tires | 4 | 22,000 | Grip +17; handling +5; reliability −3; originality −2 |
| Street Coilovers / Aoba | Suspension | 2 | 12,000 | Handling +9; grip +2; reliability −2; originality −3 |
| Track Coilovers / Senka | Suspension | 4 | 26,000 | Handling +16; grip +5; reliability −5; originality −5 |
| Sport Brake Kit / Aoba | Brakes | 2 | 10,500 | Braking +12; weight +4 kg; originality −2 |
| Lightweight Brake Kit / Senka | Brakes | 3 | 18,000 | Braking +17; weight −5 kg; originality −3 |
| Lightweight Interior Kit / Senka | Weight | 3 | 13,500 | Weight −65 kg; reliability −2; originality −8 |
| Response Turbo / Kurogane | Turbo, RZ-T only | 3 | 23,000 | Power +22%; weight +8 kg; handling −1; reliability −7; originality −5 |
| Big-Frame Turbo / Kurogane | Turbo, RZ-T only | 5 | 42,000 | Power +40%; weight +15 kg; handling −5; reliability −14; originality −8 |

Power percentages from distinct slots add as basis points, then multiply the saved baseline; round to integer PS once (half up). Weight deltas add to the saved baseline, with a 250 kg safety floor. Ratings and effective originality clamp to 0–100. Positive/negative preview changes include text/numbers, not only colours.

Initial grip/handling/braking/reliability baselines: Pico **48/62/45/88**, Tora **50/66/47/78**, RZ-T **51/52/49/68**; unknown legacy catalogs fall back to **50/50/50/70** and have no compatible purchasable parts in this initial catalog. Power and weight still come from saved factory fields. One Panel Filter changes the Pico from 105 to **110 PS**, not by mutating its `hp` baseline. Intake+cat-back yields **119 PS**. Repeated reloads/refits do not compound bonuses.

These are abstract build ratings. Reliability is not engine wear. No damage, repairs, fuel, weather, race physics, Heat, final art or engine swaps are introduced. Restoring kept factory parts also restores the corresponding originality penalties; no irreversible bodywork is modelled yet.

## Save v4 compatibility

The browser key remains `kagehama:save` and the transport prefix remains `KAGEHAMA1-`. V4 requires tuning data on every owned car. Missing/invalid v4 fields are rejected, not silently treated as older saves. Unknown part IDs, incompatible inventory, duplicate ownership, invalid slots and fitted parts not owned by that car are rejected.

V1→v2 retains the first car as active; v1/v2→v3 adds an empty economy; v3→v4 adds a fresh empty tuning record to each car. Previous balances, levels, reputation, factory stats/parts, conditions, originality, vehicle IDs/mileage, active choice and v3 jobs/receipts remain intact. No fictional retrospective purchases, income or job payouts are awarded. The frozen v3 fixture contains a pending Parts Run and five prior shifts to verify the complete contract.

Export/import/reset include tuning and pending jobs. An import is still a full snapshot replacement, not a merge. Unreadable/future saves remain protected; failed writes never consume money or a previous build. Normal stale-tab protection remains best-effort, not a distributed lock or anti-cheat boundary.

## Verification gate

Retain previous garage/economy/persistence regressions, adapted to click real tabs. Add part-catalog/command/preview/stacking/ownership/migration tests. Browser checks cover one visible panel, keyboard tabs, retained inspection/search, sticky desktop/mobile HUD, a job completing in another section, buy/cancel/refit/stock restore, wrong-car/level/cash restrictions, pending-delivery locks, failed writes, full tuned export/reset/import, old saves, duplicate clicks and stale tabs. Review screenshots before publication. Only a verified main Pages deployment is reported as live.
