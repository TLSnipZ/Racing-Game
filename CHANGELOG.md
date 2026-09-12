# Changelog

## Phase 10 — Collection, achievements and Icon Cars (2026-09-12)

- Added Collection as an eighth independent tab: filterable eight-model Book, 18 achievements and two fixed-price milestone Icon offers.
- Added explicit Common/Rare/Legendary/Icon badges to model metadata, Garage and Market, without affecting performance, prices or stock frequency.
- Added persistent ever-owned model credit and latched achievements, retaining them after sales or stock restoration; duplicates count once per model and separately for garage capacity.
- Added exact-once manual yen claims and a claimable-rewards navigation badge; no automatic payout, extra XP/REP or stat boost.
- Added Tora 85 Heritage (Level 6 + original starter trio, ¥180,000) and Kestrel GT (Level 8 + all four race disciplines completed, ¥320,000) as one-time confirmed purchases. Selling an Icon does not restore its offer.
- Kept all six existing dealer model samples and the generation algorithm separate from Icons; no stock reroll or existing asking-price changes. New Icon models support compatible non-turbo tuning, races and ordinary protected dealer sale.
- Added Save v8 collection data with a genuine released-v7 fixture. Prior world fields are preserved exactly; migration recognises only provable history and never pays past rewards without a manual claim. KAGEHAMA1 remains unchanged.
- Added pure collection command observation, bounded validation, duplicate/overflow/capacity checks, sold-model history, failed-write and stale-tab regressions, and desktop/mobile/narrow Collection views.
- Updated README, roadmap and the Phase 10 contract. Graphics & Audio I remains open; Phase 11 Advanced Cars is the next numbered system.

## Phase 9 — Heat & Police (2026-09-12)

- Added a compact, labelled non-flashing driver Heat meter to the persistent HUD and recovery access through City; kept cash/level/REP/XP and seven isolated tabs.
- Preserved Standard entry and the free practice event. Added explicit Level-3+ Underground stakes for seven paid races: 50% more gross yen, 25% more REP, with integer rounding and 12–22 Heat gained once at entry. Vehicle performance and model-v1 simulation are unchanged.
- Stored versioned risk/base-prize terms at acceptance; showed projected Heat, both fine/wait options and net payouts before entry. Briefings always default to Standard.
- Added deterministic patrol alerts at projected Heat 50/75, on settlement or withdrawal. No automatic payment: choose the shown ¥1,500/¥3,000 fine and −30 Heat or a free 60-second Lay low pause and −40 Heat.
- Added saved manual Lay low, clock and double-claim guards, cancellation retaining an alert, global City alerts/readiness and zero-cash recovery. Existing legal job claims now remove up to 6 Heat while retaining their original rewards. No passive Heat decay.
- Kept one driver activity at a time, including pauses and unresolved police decisions, without blocking prior race settlement or safe browsing/trading. Switching/selling cars does not remove Heat.
- Added Save v7 migration, preserving all previous cars, parts, market stock, money, levels, paid race snapshots and job history. Existing codes/key remain unchanged. Added a frozen v6 snapshot produced by the released Phase 8 code; previous fixtures are unchanged.
- Added threshold/mode/math/recovery/validation/legacy regressions and browser tests for stakes, confirmations, zero-cash recovery, failed writes, stale tabs, portable saves and responsive HUD/City/briefing views. Updated README, roadmap and Phase 9 contract.
- No seizure, destruction, new wear, real chase physics, new vehicle catalog, automatic fines or debt. Graphics & Audio I remains open; next numbered system: Phase 10 — Collection.

## Phase 8 — Used Car Market (2026-09-12)

- Added a seventh Market tab plus Garage and East Ward shortcuts; retained the sticky cash/level/REP/XP header and isolated views.
- Added explicit model metadata for manufacturer, production years and body type. The three original starters remain purchasable; introduced Akari Senda S sedan, Hoshino Pico R hatch and Kazuma Estate GT wagon, usable in garage/jobs/tuning/racing.
- Added six individually identified, saved stock examples per batch with year, mileage, engine/body/transmission condition, originality, seller and asking-price snapshots. Purchases preserve exact instance data and do not auto-activate over an existing active car.
- Added combinable manufacturer/body/year-range/text filters and price/year/mileage/condition sorting, counts, input validation, reset/empty states and filter preservation across ordinary tab changes.
- Added confirmed atomic purchases and dealer sales, quoted prices, per-car parts allowance, explicit active-car replacement, last-car protection and job/race-assigned-vehicle sale locks. Historical race results remain after ownership changes.
- Added 12-space purchase capacity without deleting grandfathered larger garages. Unknown historical models are retained without inventing a sale value.
- Added free, confirmed manual stock requests with a saved 5-minute cooldown after the first request. Stock never rerolls on browsing, reload, offline absence or normal save loading.
- Added integer valuation v1 from condition/mileage/year/originality; dealer trade-in is 65% of reference plus 20% of purchased-part retail. Selling transfers all car-bound parts to the dealer. Immediate stock flipping is loss-making; no real-time demand/auction model is claimed.
- Added Save v6 migration from v1–v5 with an unpurchased initial lot and empty trade history; preserved prior fields including paid race snapshots and tuned parts. Kept KAGEHAMA1, storage key, prior fixtures and race model v1 unchanged.
- Shared existing vehicle validation with market snapshot validation; added bounded IDs/stock/accounting checks and stale/double-command protection. Failed storage writes preserve vehicles, stock, cooldown and money.
- Added valuation/generation/transactions/filters/locks/overflow/migration tests and production-browser purchase/sale/refresh/backup/old-save/stale-tab/storage-failure/layout checks, retaining earlier scenarios. Updated README, roadmap and the complete Phase 8 contract.
- Graphics & Audio I remains explicitly open. Starter prices, original ratings, job rewards, part prices/effects and race balance remain unchanged. Next numbered system: Phase 9 — Heat.

## Phase 7 — Kagehama City and HUD XP (2026-09-12)

- Added a small level XP bar directly beneath the level number in the persistent top HUD. It uses existing REP progression, shows remaining REP and displays MAX at the current level cap; no second XP currency or new save field.
- Enabled City as a real section with four district scenes, level-access previews, two explicitly future locations and settled personal race records.
- Added explicit race/job district metadata and read-only city selectors. East Ward opens at Level 1, Dockside/Hakuro at Level 2 and Eastline at Level 3; individual activities retain their original higher requirements.
- Added City shortcuts to district-filtered race/job boards and Mercer services, without travelling, charging money, starting activities, changing the active car or rewarding clicks.
- Combined race district and discipline filters, with counts and empty-state reset; added job district filtering. Pending activities and receipts remain outside filtered offers and can be resumed from City.
- Preserved selected districts and filters on ordinary tab switches; reset UI preferences on reload/full import/reset. Kept existing paid/unsettled activities recoverable despite lower imported levels or unrelated district previews.
- Tightened shared-shell width and top-offset rules for the new XP row, including narrow displays and very large valid balances.
- Kept Save v5, KAGEHAMA1, all historical migrations/fixtures, race model v1 and all starter/job/part/race balance unchanged.
- Added district membership/access/filter/read-only/XP unit tests and production-browser city, level-boundary, pending-result, filtering, recovery and 320/390/1440-pixel layout checks. Retained all previous regression suites.
- Updated README, roadmap and the Phase 7 contract. Graphics & Audio I remains explicitly open; the numbered City system was implemented first. The schematic map is not final artwork. Next numbered system: Phase 8, including requested manufacturer/year/body-type vehicle-market filters.

## Phase 6 — Racing and shop categories (2026-09-12)

- Enabled a separate Races tab with eight Rookie/Club events across Street Sprint, Drag, Touge and Expressway.
- Added a deterministic sector model based on saved tuned builds, condition and fixed opponent builds; no random rerolls or real driving physics.
- Added vehicle/event selection, discipline filters and race briefings with explicit entry fees, rival grids and all placements' gross/net prizes.
- Added a 3-second countdown, compressed progress replay, final classification/gaps, player sector times, race records and gross/net career income.
- Added atomic entry, exact-once manual settlement, confirmed non-refundable withdrawal and assigned-car mileage, reputation and level advancement.
- Enforced one job OR race at a time and locked the assigned car for tuning until the activity is settled/withdrawn. Other parked cars remain editable.
- Kept active races, full simulation snapshots and deadlines intact across view switches, reload and save export/import; added a cross-section Races READY badge.
- Migrated valid Save v1–v4 data to v5 with empty racing history, preserving old cars, money, tuned parts and pending jobs; retained KAGEHAMA1 and the browser storage key.
- Added prominent component-category buttons synchronized with the workshop dropdown, with counts, selected states and UI-only filter persistence.
- Recorded the requested future vehicle-market filtering by manufacturer/brand, model year/year range and body type, with combinable filters and sorting. The market itself remains Phase 8.
- Added racing model/transaction/migration/validation tests and real-browser race/category/scroll/recovery scenarios while retaining previous regression coverage.
- Updated README, roadmap and the full Phase 6 contract. Starter, job and part balance are unchanged. Final art/audio, city, additional cars, police, wear and automation remain later milestones.

## Phase 5 — Interface & Tuning (2026-09-11)

- Replaced bottom scroll anchors with prominent top section tabs and a sticky cash/level/reputation HUD.
- Separated Garage, Jobs, Workshop and Saves; kept search/inspection state across tab switches, added keyboard tab navigation, global recovery access and a Jobs READY badge.
- Kept game session and presentation clock above the panels so changing sections neither pauses jobs nor mutates saved progress.
- Added 14 parts across 8 slots and three fictional brands, with compatibility/level/cash gates and a current-versus-preview confirmation dialog.
- Added per-vehicle purchased-part ownership, one upgrade per slot, retained swapped parts, free refit and free stock restoration without refunds.
- Added derived power/weight and build ratings, kept factory fields separate, and updated Garage display/sorting/fitted parts to reflect the current build.
- Blocked tuning on delivery-assigned cars until claim/cancel without blocking other vehicles or on-foot shifts.
- Added Save v4 migration from v1/v2/v3, preserving old fields and pending jobs; retained browser key and KAGEHAMA1 transport format.
- Retained previous regression scenarios and added tuning, migration, true-tab, sticky-header, keyboard, storage-failure and mobile/desktop browser checks.
- Updated README, roadmap and Phase 5 contract. Starter/job balances, final artwork, racing and later automation are unchanged or still future work.

## Planning update — Phase 5 scope (2026-09-11)

- Expanded the next milestone to **Interface & Tuning**: first a prominent top navigation, real separate content sections and a persistent cash/level/rep HUD (5A), then the first performance-parts workshop (5B).
- Recorded acceptance requirements for job continuity across section changes, mobile/keyboard access, global save warnings and save compatibility.
- Clarified later progression automation under Phase 12: passive businesses, staff-managed routines and capped offline production; specific repeatable crew jobs remain to be designed.
- Documentation only: updated README and roadmap. Live gameplay remains Phase 4 / Save v3; no gameplay, UI, balance or save-format changes in this planning update.

## Phase 4 — Economy (2026-09-11)

- Added Garage Shift, Parts Run and Dockside Delivery with short timers, level gates, clear requirements and integer yen/rep rewards.
- Added one-job acceptance, explicit one-time claim, confirmed cancellation, accepted-car mileage, payment receipts and lifetime job-income/completion counters.
- Added cumulative-reputation level progression (initial cap 20), progress display and new contact unlocks.
- Persisted contract deadline/reward/car snapshots; reload or absence readies at most one manually claimable job, never an auto-repeat chain.
- Reused durable-write-before-state transactions and stale-tab protection for job commands. Invalid/stale/early actions and safe-integer overflow cannot award money.
- Added Save v3 migration from v1/v2, preserving old cars/cash/rep/levels, active vehicle, storage key and KAGEHAMA1 transport prefix.
- Added a fixed v2 compatibility fixture, economy/serialization regressions and controlled-clock browser scenarios; retained garage tests.
- Updated README, roadmap, save documentation and the optional post-racing art/audio milestone. Final graphics remain later work.
- Kept starter prices and vehicle catalog unchanged. Tuning, racing, fuel/damage, Heat, markets and passive businesses are not part of Phase 4.

## Phase 3 — Garage (2026-09-11)

- Added owned-vehicle cards, search and sorting, detailed dossiers, condition meters and fitted-parts presentation.
- Added original placeholder hatch/coupe/turbo profiles; final vehicle art remains planned.
- Added explicit saved active-vehicle selection, separate from merely inspecting a car.
- Migrated Save v1 to v2 without changing the KAGEHAMA1 export prefix or browser storage key.
- Stopped automatic deletion of unreadable/unsupported saves; surfaced storage failures and stale-tab conflicts.
- Made purchase/activation/import/reset apply only after a successful storage write.
- Added migration/invariant unit tests and Chromium production-build regression tests, including mobile checks.
- Added documentation maintenance rules, a detailed roadmap, save-compatibility notes and this changelog.
- Kept starter balances/catalog unchanged. Additional acquisition, jobs, tuning and racing are still future phases.

## Phase 2 — Persistence (2026-09-11)

Autosave in localStorage, Save v1 envelope, portable KAGEHAMA1 codes, validated/confirmed import and confirmed reset. Commit `0599e926664ccb05637a333c1633f3bdcf563891`.

## Phase 1 — Core Game (2026-09-11)

Real starter purchase, ¥50,000 new game, level/rep foundation, individual vehicle data and Garage v0. Commit `9f198dbcb9f0545bb177c83867dba495097c0697`. Follow-up commits added Vite client types and GitHub Pages deployment.

## Phase 0 — Foundation (2026-09-11)

Initial React/TypeScript/Vite shell, midnight-Japan look and data-driven starter selection. Commit `8458a1ac8662e05d45f3ef23387b8cd52e2def2a`.
