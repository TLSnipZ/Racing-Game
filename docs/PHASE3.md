# Phase 3 — Garage contract

Baseline: `7b468daa8bdf86beb5f90184fbe25d0f6b5792b4` (Phase 2 plus README update).

## Scope

No car, yen, job, race, repair, tuning bonus or garage-capacity limit is added. The player still acquires only one starter through normal play. Multi-car saves are supported for future acquisition systems and tested with explicit fixtures, not a hidden free-car button.

The viewed card is transient React UI state. `activeVehicleId` is durable game state. Activating a vehicle checks ownership by **instance ID**, is free, does not change per-car data and is idempotent when already active. Duplicate models remain distinct instances. Search and sort operate on a copy and do not mutate the save. Overall condition is `round((engine + body + transmission) / 3)`; originality is separate. PS/t is `round((hp * 1000 / kg) * 10) / 10`, an informational ratio rather than a race-winning prediction.

## Save migration

Storage key remains `kagehama:save`. Code prefix remains `KAGEHAMA1-` (transport version 1).

| Input | Behaviour |
| --- | --- |
| No stored save | New state with `activeVehicleId: null`. |
| v1 with no vehicles | Add `activeVehicleId: null`. |
| v1 with vehicles | Add the first owned vehicle's instance ID, preserving existing fields. |
| v2 | Require a null active ID only for an empty garage, otherwise require an owned instance ID. |
| Corrupt or unsupported version | Show recovery warning; never automatically delete/replace stored data. |

The frozen `tests/fixtures/save-v1.json` uses the original deployed Phase 2 field layout. Both stored JSON and previously exported codes are covered. Validators reject duplicate instance IDs, impossible condition ranges, invalid money and unowned active IDs. Future schema changes must extend this migration path, not simply increase the version constant.

## Session safety

The lazy initializer only reads storage. Successful load/new game is saved as v2 on mount. Commands serialize and write synchronously **before** publishing the new visible game state; exceptions become visible errors. Confirmed import/reset deliberately replace the game key but leave unrelated browser storage alone. A stale tab is detected through storage events and a pre-write value check; it must reload. This is a best-effort single-tab protection, not a cross-tab transactional lock.

Codes are encoded JSON, not encrypted or cheat-proof. No cloud account, cloud sync, offline earnings or browser-persistent storage guarantee is implied. Local backup codes remain important.

## Regression checks

`npm test`: starter balances/ownership, selectors/sorting/metrics, active command, old/new saves, Unicode codes, malformed inputs, invalid IDs, untouched corrupt data and storage errors.

`npm run build`: TypeScript plus Vite production build using `/Racing-Game/`.

`npm run test:e2e`: Chromium against the built site. Covers all three starter choices being present, purchase/reload, v1 migration, preview versus activation, active-car persistence, export/reset/import, cancelled confirmation, legacy-code import, rejected bad import, corrupt/future save preservation, failed writes, mobile overflow, desktop smoke and stale-tab protection. Browser screenshots/reports are uploaded by CI. Fixture multi-car saves are test-only.

## Documentation maintenance

Update README, `docs/ROADMAP.md` and CHANGELOG with every completed phase. Keep the live-game link visible. Distinguish code present, checks passed and deployment completed in status reports.
