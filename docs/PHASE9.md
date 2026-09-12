# Phase 9 — Heat & Police contract

Baseline: `35f8b8f13b0c6ac3459bea215c81608684f57cb0` / released Phase 8 / Save v6. This is a deterministic game-risk layer, not real policing, pursuit physics or final artwork. Graphics & Audio I remains open.

## Balance selected before implementation

Heat is a **player-global integer from 0 to 100**. Changing, purchasing or selling a vehicle never clears it. Status thresholds are Clear 0–24, Noticed 25–49, Watched 50–74 and Crackdown 75–100. These labels are not star-based car-loss thresholds.

Existing **Standard stakes** are unchanged: the eight event fees, normal prizes, rivals, race model v1, times and eligibility remain the baseline. Standard entry generates no new Heat or patrol alert. A saved pre-update paid race keeps its exact snapshot, not a retrospectively added liability.

An explicitly selected **Underground stakes** option requires Level 3 (as well as the event's own level) and is offered only for the seven paid events. East Ward Shakedown stays fee-free, standard-only practice. Each briefing defaults to Standard; selecting Underground never starts or charges for the event.

| Event | Heat gained on entry |
| --- | ---: |
| Dockyard 402 | 12 |
| Hakuro First Descent | 14 |
| Eastline After Hours | 18 |
| Ward Club Circuit | 16 |
| Dockyard Redline | 16 |
| Hakuro Switchback Club | 18 |
| Eastline Midnight Club | 22 |

Underground **gross yen prizes increase by 50%**, REP by **25%**, each rounded down independently to a whole unit. The entry fee, race physics, three rivals and duration do not change. The increased prizes for all four placements are shown before confirmation. Changing stakes is not a change to the car's performance. Low placements may still make a loss.

Heat is applied once at durable entry, clamped at 100. Entry is rejected if current Heat is 85 or higher; Standard stakes and legal jobs are still available unless an alert/pause is pending. The briefing uses a stale-Heat guard, as well as the existing vehicle build key. Withdrawing keeps both Heat and the pre-announced liability; it cannot farm cancellation to avoid consequences.

## Deterministic patrol alerts, not hidden RNG

The projected Heat at entry determines the consequences of that run:

| Projected Heat | On settlement OR withdrawal |
| --- | --- |
| Below 50 | No patrol alert |
| 50–74 | Alert: choose a ¥1,500 fine OR a free 60-second Lay low pause |
| 75–100 | Alert: choose a ¥3,000 fine OR a free 60-second Lay low pause |

There is **no automatic fine**. A race still pays its saved gross reward exactly once at settlement. A pending alert prevents a new job/race, but never blocks settlement/withdrawal of its original activity. Browsing, trading and parked-car tuning remain usable. The alert is an abstract attention-resolution event, not a random arrest or an in-world escape instruction.

**Pay fine:** separate confirmation, exact shown yen charge, −30 Heat (minimum zero), clears the alert and records the payment. Insufficient cash disables this option without creating debt. Race career net is labelled **NET BEFORE POLICE**; lifetime paid fines are separately visible in Heat controls.

**Lay low:** no currency charge or reward, one saved 60-second pause, −40 Heat (minimum zero) and alert clearance on manual completion. It works at zero cash. The alert stays present while the pause runs. Cancel gives no reduction and retains any alert; it remains usable after a backwards clock jump. Paying a fine while the same pause is pending is disallowed; finish/cancel first. Old alerts and cooldown IDs cannot be resolved twice.

## Recovery and time

A voluntary Lay low uses the same duration/reduction when Heat is above zero and no job/race is pending. Only one job, race or Lay low can run. A finished but unclaimed activity still occupies that slot. Trading does not occupy this slot and does not affect the paused driver's attention or deadlines.

Every existing **legal job claim removes up to 6 Heat**, together with its original money/REP/mileage payout. No charge or new police risk is imposed on ordinary jobs. No Heat reduction happens at job acceptance, cancellation or simply when the timer becomes ready.

There is **no passive wall-clock Heat decay** in this milestone. A saved pause can become ready while the page is closed, but never completes/repeats itself. The shared presentation clock renders readiness only, without modifying saves. Reject invalid/fractional/overflowed times and early completion; offer cancellation after clock rollback. At most one pending reduction can be claimed after an absence. Local device clocks and exported codes are user-controlled; validation is not server-authoritative anti-cheat.

## Interface

The sticky HUD retains cash, level, REP and XP and adds a compact, non-flashing Heat meter under the game mark. Clicking it opens the Heat controls at the top of **City**, not an eighth unorganised navigation item. The meter includes a text status, so colour is not the only signal.

The Races briefing presents explicit radio options, projected Heat, both police choices and a table of gross prizes, net after entry with free waiting, and net if the fine is paid. No penalty is hidden behind confirmation. Accepted Underground races display their saved terms; the result indicates that the bonus is already included, not a second claim.

A global notice and City badge expose a pending patrol/pause from any other section. City contains the full choices, timing, previous resolution and cumulative fine payments. Jobs explain their Heat reduction. Save import previews and reset warnings include Heat, patrol and pause data. Existing market/component categories, seven real tabs, XP, active-vehicle rules and global save recovery remain available.

## Save v7 and validation

`heat: { value, nextCooldownId, cooldown, pendingStop, totalFinesPaidYen, lastResolution }` is required in v7. Valid v1–v6 data migrate through the existing chain, then gain a clean Heat record. **No reset, new car, repricing, fee, retrospective Heat or race recalculation.** `KAGEHAMA1-` and `kagehama:save` are unchanged. The added frozen v6 fixture was produced by the released Phase 8 code with a dealer purchase, stock refresh, tuned original car and a still-pending paid race. Older fixtures remain byte-for-byte unchanged.

An optional `ActiveRace.heatRisk` freezes version-1 Heat terms and base prizes at Underground entry. Standard/legacy snapshots omit it entirely. The snapshot, resulting boosted prizes and police fine are mathematically validated. Retain rules v1 for historical snapshots; any future tuning of accepted-risk terms must add a new version or migration, not silently reinterpret them.

Validate Heat bounds, required fields, original pause deadline/duration, exact reductions, fine units and receipt math, pending alert/run association and cross-system exclusion. A pending risky race's accepted Heat must match current Heat. V7 missing/malformed Heat is rejected, not reset. Pre-v7 data cannot carry new risk contracts under an old version label. Pending/withdrawn alerts, paid resolutions and cooldowns survive full export/import. Import replaces the world, not merges it.

All commands reuse the durable-write-before-visible-state boundary. Failed storage writes cannot deduct a fee/fine, add Heat, apply a reduction, discard an alert or claim a reward. Stale browser tabs are blocked when detected; the existing single-tab recommendation still applies. UI synchronous guards complement domain validation for duplicate confirmations.

## Not included

No vehicle seizure, destruction, new wear, random bankruptcy, mandatory fine, debt, real chase controls, offline automatic earning, cloud saving, automatic event chains or new vehicle/part catalog. Heat is optional extra risk on eligible race entries, not a surprise rebalance of all activities. Graphics and audio remain a separate open milestone.

## Verification

Retain all prior regression suites, adapting only expectations for the additional Heat field/schema and explanatory labels. Cover each risk event/threshold; standard terms; invalid inputs; bonuses; cancellation liability; exact-once payment/recovery; zero-cash path; legal job recovery; activity exclusion; trading; clock safety; all legacy fields; malformed current data; and repeated portable-save round trips.

Browser regressions cover actual radios/briefings, advertised amounts, global recovery access, default Standard stakes, low-level and 85+ gates, failed writes for entry/fine/pause/completion, stale tabs, alert/pause exports, frozen v6 migration and 320/390/1440-pixel layouts. Review screenshots before publishing the same clean tested tree. README, roadmap and changelog are maintained with this contract.
