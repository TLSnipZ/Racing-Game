# Phase 12 — Empire & Automation contract

Baseline: `60f8f28ea422e2faaab4769a32b238f7afc556c6`, released Phase 11 / Save v9. This milestone adds the first three staff-run properties, optional permanent managers, bounded offline production and sequential garage expansions. Save becomes **v10**. Graphics & Audio I remains a separate open milestone; the new interface is not final vehicle/world artwork.

## Chosen scope and initial balance

| Stable ID / business | Player unlock | Acquisition | Batch duration | Net yen per Level-1 batch | Manager / one-time hire |
| --- | ---: | ---: | ---: | ---: | --- |
| ward-detail / East Ward Detail | 3 | ¥60,000 | 30s | ¥300 | Rei — Floor Manager / ¥35,000 |
| bayline-parts / Bayline Parts Supply | 5 | ¥180,000 | 45s | ¥900 | Jun — Dispatch Lead / ¥90,000 |
| midnight-dyno / Midnight Dyno Works | 7 | ¥450,000 | 60s | ¥2,100 | Nao — Workshop Lead / ¥225,000 |

Each property can be acquired once and has business Levels **1–5**. Existing personal-job output is not replaced; initial managed rates are ¥600/¥1,200/¥2,100 per minute, before business upgrades, compared with the faster existing active-work loop. These are provisional game values, not external financial recommendations. No property sale, manager dismissal, recurring rent, payroll deductions, debt, fuel or new wear exists. The output is net of fictional operating expenses.

Purchase includes operating staff but leaves production **stopped**. Without a manager, manually dispatch one batch, wait, and collect its completed profit once. The staff do not automatically begin a second booking; after collection start the next batch explicitly. A property is not free income before dispatch.

A manager is a permanently associated one-time hire for the owned business. Hiring requires it to be stopped; the preview explicitly states that confirmation **starts automatic repeat production immediately**. The manager repeats customer bookings into that property's till. The player manually transfers those earnings into spendable cash. This is automation of business bookings, **not personal-job delegation or automatic cash spending**.

## Production rules v1, storage and time

For a known property, `batchPayout = basePayout × businessLevel`. Manager ownership does not multiply this amount. Without a manager the till cap is one batch; with a manager it is `batchPayout × (8 hours / batchDuration)`. Durations divide the eight-hour period exactly. Level-1 managed caps are **¥288,000**, **¥576,000** and **¥1,008,000** respectively.

Production is derived lazily from a saved `startedAtMs` anchor and a `bankedYen` balance. A null anchor means stopped. A running anchor points at the start of the earliest uncredited batch, not at the last browser render/save. The read-only selector takes elapsed whole batches, bounds them by the storage limit, adds banked money and clamps at the till cap. It does not iterate over every offline booking or modify cash/save data. The shared display clock advances previews only.

The cap is **eight hours of output stored in total**, not eight hours granted afresh at every login. It includes online waiting and previously banked output. Once full, additional elapsed time is discarded. Reload, other game commands, export/import of the same world and view changes keep the exact anchor; they cannot reset the cap or manufacture another payout. A manager can therefore produce while the browser is closed without a server or background timer running. Merely returning does not transfer money to cash.

**Collect earnings** moves completed whole-batch money into cash and increments the separately stored lifetime collected total. For a running manager below cap, the new anchor is `now − elapsed % batchDuration`, preserving the unfinished next batch. When storage was full, the anchor becomes `now`: old excess time is discarded. A stopped property stays stopped, and collecting an unmanaged batch stops it. **Collect all earnings** applies the same logic atomically to every property; no partial transfers occur on overflow or a failed save. No amount is credited twice by the same revision/anchor.

**Pause** is explicitly confirmed: completed profit is retained in `bankedYen`, but incomplete batch time is discarded. Nothing accumulates while stopped. **Resume** starts a fresh batch. A manual batch must be collected before a second manual dispatch; buying a manager can retain a stopped completed manual balance while expanding capacity. Managed production stops accruing at full storage and resumes from collection time when running. A deliberately paused full till remains paused after collection.

## Upgrades

Upgrade from business Level L to L+1 costs `original acquisition price × L` and requires player Level `property unlock level + L`. Maximum business Level is 5. Only stopped properties can upgrade. The payout increases linearly, batch duration stays unchanged and the manager remains hired. Stored old profit is preserved as exact yen, not repriced by the new level. Upgrading does not resume a paused business: resume explicitly. Since levels only increase, an older banked balance always fits the newer capacity.

Rules v1 prices/durations/output form a persistent interpretation contract. A later balance change must version these terms or migrate anchors and banked output explicitly; do not silently recalculate past production using new numbers.

## Garage expansion and reserved capacity

| Sequential upgrade | Player Level | One-time price | Total capacity |
| --- | ---: | ---: | ---: |
| Annex Lease | 4 | ¥75,000 | 18 |
| Warehouse Bays | 6 | ¥180,000 | 24 |
| Industrial Motor Hall | 8 | ¥400,000 | 36 |

The baseline stays 12 spaces. Expansions are permanent, sequential and have no refund/downgrade or recurring rent. All acquisition commands use the same derived capacity selector: ordinary dealer purchases, Icons, imports, auction reservations and barn recovery. A paid import or **any pending auction** continues to reserve a slot, including when ready or currently losing. An expansion does not replace, clear or reprice specialist contracts/escrow or change which car is active. Larger valid old garages are retained, not truncated, and can expand normally but cannot buy/reserve until below effective capacity. The serializer's overall 1,000-vehicle safety bound is unchanged.

## Transactions and isolation

Every Empire command revalidates state, starter ownership, action/target, expected revision, quoted price, level/cash requirements, stopped/running state and safe-integer totals. A synchronous UI guard supplements the pure domain revision guard. Revision increments for successful Empire commands only; stale/double quotes fail. A configuration action changing a different property invalidates the old preview too, rather than silently executing terms from an outdated view.

All writes use the existing **durable-write-before-visible-state** boundary. A failed write cannot debit property/manager/expansion costs, reset an anchor, drop till money or pay income. Overflow in cash or collected/spent/revision totals rejects the entire command; spend some cash and retry when relevant. No partial collect-all award. Read-only rendering, filters and navigation do not write or advance ledgers.

Clock values must be nonnegative safe integers with at least eight hours of arithmetic headroom. A time earlier than a running property's saved anchor blocks its production-changing commands and collect-all while retaining banked money and the original anchor. Restore the clock; jobs/races/broker settlement retain their own existing clock rules. No receipt is silently discarded to recover. No claim of server-authoritative anti-cheat is made: local clocks and portable codes remain user-controlled, and an older imported code deliberately restores its older world.

Business income adds **no REP, level, Heat reduction, mileage or Collection reward claims**. The driver's job/race/Lay low and the independent specialist contract remain exactly unchanged. Buying, pausing, collecting or expanding during one of those activities neither finishes nor replaces it. Trading/repairing unrelated cars preserves all business anchors. There is no shared car assignment to the business staff in this first slice.

## UI and world

**Empire** is the ninth isolated root tab after the normal starter purchase, with **Businesses / Staff & Managers / Garage Expansion** inner button groups. The Industrial District becomes inspectable/open at Level 3 and links to business operations; Garage has a direct expansion shortcut. Other systems retain their existing tabs, component categories and filters. XP/Cash/Heat stay in the persistent HUD, and a CASH badge flags completed, collectible business output without transferring it.

The dashboard distinguishes till balances from cash, theoretical automated rate from capped/paused operation, and owned versus managed businesses. Individual cards show current level, whole-batch profit, cycle progress, storage capacity, upgrade/hire conditions and current status. Money/configuration actions use explicit native dialogs. Pause warns about lost unfinished time. All new content remains keyboard accessible with narrow-screen wrapping; preference for reduced motion is respected. Subview selection survives ordinary tab switches and resets after full import/reset/reload.

## Save v10 compatibility

Current saves require:

`empire: { version: 1, revision, businesses, garageExpansionLevel, totalSpentYen, totalCollectedYen, lastReceipt }`

Each business has `{ id, level, managerHired, startedAtMs, bankedYen }`. The receipt records revision, action, target, amount and time. Validate known/unique bounded business IDs, levels, booleans, nullable valid anchors, banked denominations/caps, sequential expansion range, exact aggregate spending implied by owned upgrades/hired managers and valid current receipts/counters. An unmanaged banked batch cannot simultaneously run a duplicate batch. A pre-starter world requires an empty Empire. Missing/malformed current fields are rejected, not recreated to renew claims.

Valid v1–v9 worlds follow their existing migrations, then v9→v10 adds **only `createEmpireState()`**: no free assets, managers, expansion, production timestamps, retrospective cash or new debt. Every prior field remains identical, including restored/tuned cars, exact dealer stock/quotes, collected model and claimed achievement/Icon IDs, specialist sources/escrow/reservations, active driver races/Underground terms, Heat/patrol/pause, cash and reputation. The fixed `tests/fixtures/save-v9.json` was generated using the actual released Phase-11 commands/serializer and retains a paid import and an Underground race. Older fixtures stay byte-for-byte unchanged.

The existing `KAGEHAMA1-` transport and `kagehama:save` key remain unchanged. Full export includes running/paused state, banked output, historical collected money and capacity. Import replaces the whole world and its clocks, not merges claims; reset clears Empire together with the previous systems only after confirmation. Current protected-save and stale-tab behavior remain: use one browser tab, not a claimed distributed synchronization protocol.

## Verification and next scope

Retain prior regression scenarios, updating only the current schema expectation and newly implemented Industrial District access. Add unit tests for all property/manager/upgrade/expansion paths, exact boundaries, partial-batch preservation, cap saturation over long absences, duplicate/stale/failed actions, before/after pause and upgrades, large safe integers, exact v9 migration, malformed current ledgers and capacity with paid reservations. Exercise production-browser controls, clocks, till/cash separation, nine tabs/subviews, exported worlds, storage failure, stale browser tabs, reserved imports, legacy equality and 320/390/1440-pixel plus blocked-font views.

Maintain README, roadmap, changelog and this contract; verify the clean phase-branch tree and main Pages deployment before announcing release. **Graphics & Audio I remains open.** The next numbered milestone is **Phase 13+ — Endgame**. Crew squad configuration, personal-job/race delegation, automatic wallet collection/purchases, additional businesses, prestige resets and final art/audio are not implicitly delivered by this first manager loop.
