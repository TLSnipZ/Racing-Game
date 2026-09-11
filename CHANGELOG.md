# Changelog

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
