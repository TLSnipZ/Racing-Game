# Phase 4 — Economy and Save v3

Baseline: `54612c83b94b506ecb5433c4ab1501ec7ac5d160` (completed Phase 3).

## Player-facing loop and provisional balance

Choose one starter → accept one job → wait → manually claim → earn yen and cumulative reputation → unlock the next contact. No entry fee, randomness or automatic repeat.

| ID | Name | Minimum level | Duration | Yen | REP | Route |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| `garage-shift` | Garage Shift | 1 | 15,000 ms | 1,500 | 4 | On foot; 0 km |
| `parts-run` | Parts Run | 2 | 30,000 ms | 3,000 | 8 | Active car; 6 km |
| `dock-delivery` | Dockside Delivery | 3 | 45,000 ms | 5,500 | 14 | Active car; 12 km |

All jobs require the starter decision. Car jobs additionally require an owned active car with engine and transmission above zero. All three unchanged stock starters qualify. Workshop work remains possible without a drivable active car. No repairs, fuel, damage, speed advantage, random police incidents or tuning shop are implemented in this phase.

Threshold for Level L: `10 * L * (L - 1)`, L=1..20. Examples: L1=0, L2=20, L3=60, L4=120, L5=200, L20=3800 reputation. Cash/rep do not cap at Level 20. Level-ups award no bonus currency. Existing valid higher imported levels are never reduced. Normal game states derive their new level after every claim.

A fresh player reaches L2 after five shifts (75 seconds of work plus interactions; ¥7,500 earned). Five Parts Runs then reach L3 (another 150 seconds and ¥15,000). Thus the first three contacts open after about 3m45s of active work, excluding clicks. Jobs pay approximately ¥6,000 / ¥6,000 / ¥7,333 per minute of job time. These are pre-alpha game-balance choices, not real-world salaries. Phase 5 must balance early parts against this income.

## Command and timing contract

`startJob(state, jobId, nowMs)`, `claimJob(state, runId, nowMs)` and `cancelJob(state, runId)` are pure commands. The browser session invokes them against its latest synchronous state reference and writes the result before updating React. Failed writes do not grant progress or consume a pending reward. Repeated/stale run IDs and premature claims throw before changing state. Money, reputation, counters, timestamps and mileage use safe-integer checks; overflow fails atomically.

A job stores a monotonically increasing per-save run ID, job ID, vehicle instance, start/deadline and a reward/distance snapshot. Claim at `nowMs >= finishesAtMs` pays exactly once, then clears the job and stores its receipt. No interval awards cash. The 250 ms UI interval only paints progress and is cleaned up when its contract changes or the component unmounts. No periodic save writes are necessary: gameplay changes are explicitly persisted.

The timer is a saved wall-clock deadline. Reloading/closing the page does not restart it. Returning days later readies at most that one existing job, still requiring a manual claim. There is no queued/automatic/compound offline production. A backwards or invalid device clock cannot complete a job; the player can restore the clock or cancel. A deliberate forward clock change can shorten waiting: this is a single-player local-save game, not a server-authoritative anti-cheat system.

On acceptance a delivery is bound to the then-active vehicle. Inspecting or activating another car remains allowed; route mileage applies to the original car on claim, not the new active one. Cancellation gives no money/rep/mileage and never reuses a run ID. Selling assigned cars will need a guard when the market is implemented.

Reward/duration snapshots survive future balance changes within the validation safety bounds (positive safe rewards <=1,000,000,000; duration <=24 hours; route <=10,000 km). They are not cryptographic proof of a legitimate reward. Job-ID retirement will need a migration. Restore/export codes intentionally allow rollback to an earlier game state.

## Save schema and migrations

Storage key: **`kagehama:save`**. Transport prefix: **`KAGEHAMA1-`** (unchanged). Envelope version: **3**.

```ts
economy: {
  nextRunId: number;             // starts at 1; incremented on acceptance
  activeJob: ActiveJob | null;  // includes captured vehicle/rewards/deadline
  completedJobs: number;
  totalEarnedYen: number;        // job income only; excludes starting cash
  lastReceipt: JobReceipt | null;
}
```

- **v1 → v2 → v3:** validate historical fields, select first owned instance (or null), append empty economy.
- **v2 → v3:** retain existing active vehicle and every prior core field; append empty economy.
- **v3 → v3:** validate required economy fields and owned active/assigned IDs. Missing economy is an error, not a migration request.
- **Future/invalid versions:** keep stored bytes, block normal commands and show recovery tools. Never delete or silently reset the save.

Migration does not invent historical jobs, income, elapsed time, refunds or level changes. Reset creates a complete fresh v3 state, including zero job stats and no timer. Import validates first, includes pending-job information in its confirmation, then replaces the save atomically after a successful write. `tests/fixtures/save-v1.json` and `save-v2.json` remain fixed compatibility examples. `PHASE3.md` records the older v2 contract; this document is current.

The existing best-effort stale-tab guard is retained. It compares stored data before commands and reacts to storage events; detected conflicts block writes until reload. This does not guarantee mutual exclusion for perfectly simultaneous writes in two tabs. Use one game tab at a time. No cloud account or sync is added.

## Verification

Run `npm test`, `npm run build`, then `npm run test:e2e`. Browser tests run against the production build at `/Racing-Game/` using Playwright's clock rather than real waiting.

Coverage includes every starter's eligibility, gates, before/on/after deadline, wrong/stale IDs, duplicate claims, cancellation, snapshots, zero-cash recovery, arithmetic limits, level thresholds/cap, vehicle binding, v1/v2 migration and current-save validation. Browser regressions cover countdown/reload, no save writes on timer ticks, five-shift unlock, one-job absence, export/reset/import, failed start/claim storage writes, stale tabs, clock rollback and 390px/desktop layout. Existing garage/save scenarios remain in the suite. Tests never alter the player's live browser save; seeded multi-car states are fixtures, not gameplay rewards.

Only `main` publishes to Pages, after checks pass. README, roadmap and changelog must stay current with subsequent economy or schema changes.
