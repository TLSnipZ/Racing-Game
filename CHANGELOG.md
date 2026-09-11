# Changelog

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
