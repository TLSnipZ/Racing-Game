# KAGEHAMA — Underground Car Empire

**[🎮 PLAY KAGEHAMA IN YOUR BROWSER](https://tlsnipz.github.io/Racing-Game/)**

A pre-alpha car-collection, street-racing and automotive-empire game set in a fictional Japanese coastal city.

> Modern Japan × JDM culture × touge × expressway × car collecting × tycoon.

**Current milestone: Phase 7 — Kagehama City & HUD XP** · **Save schema: v5 (unchanged)** · **Next numbered system: Phase 8 — Car Market**

**Graphics & Audio I remains an open, separate presentation milestone.** Phase 7 implements the next numbered system first; its district network is a functional schematic, not final illustrated city/car artwork.

[Roadmap](docs/ROADMAP.md) · [Changelog](CHANGELOG.md) · [City & XP contract](docs/PHASE7.md) · [Racing](docs/PHASE6.md) · [Tuning](docs/PHASE5.md) · [Economy](docs/PHASE4.md) · [Garage](docs/PHASE3.md) · [Build/deployment](https://github.com/TLSnipZ/Racing-Game/actions/workflows/deploy-pages.yml)

## Play now

Choose one of three inexpensive starters with **¥50,000**, earn yen and reputation, fit performance parts and test your build against three rivals. The first complete loop is **starter → job → income → tuning → race → reward**.

### New: level XP in the persistent HUD

A small **XP progress bar sits directly below the level number** in the top HUD, in all six sections and while scrolling. The label shows the REP remaining to the next level; the accessible description gives the target level. **Reputation is your level XP**, not a second currency. Job claims and race settlements update the same progression selector used by the Jobs panel. At the current Level 20 cap the bar is full and says **MAX**; money and reputation can still increase.

For example, Level 1 with 4 REP has a 20%-filled bar and needs 16 more REP for Level 2. Level 2 begins at 20 total REP and needs another 40 REP for Level 3. Thresholds remain `10 × level × (level − 1)`. This interface change does not rebalance rewards or rewrite existing levels.

### New: Kagehama City

**City** opens after the starter purchase. Inspect district nodes to see their scene, access requirements, existing job/race invitations, fees, services and settled personal race records.

| District | Opens | Current activities |
| --- | --- | --- |
| East Ward | Level 1 | Sprint invitations, Garage Shift, Parts Run, your garage and Mercer Workshop |
| Dockside | Level 2 | Drag invitations; Dockside Delivery still requires Level 3 |
| Hakuro Pass | Level 2 | Touge invitations |
| Eastline Expressway | Level 3 | Expressway invitations |
| Industrial District | Future preview only | Business/crew locations planned for Phase 12 |
| Outer Kagehama | Future preview only | Barn finds/restoration planned for Phase 11 |

Individual events keep their existing level requirements. Club invitations do not become available just because their district is open. The two future districts remain previews even at maximum level.

The city is a **directory, not travel**: no tolls, timers, rewards for clicking areas or changes to the active car. District shortcuts open the real Jobs/Races tabs with the matching filter, never start or pay for an activity. The race district filter combines with discipline; a clear-filter control recovers an empty result. Job districts filter only offers. **Pending activities always stay visible**, irrespective of filters, and can also be resumed from City.

### Racing

Open **Races**, choose an owned vehicle and inspect **RACE BRIEFING** before confirming **ENTER RACE**. A 3-second countdown precedes a compressed sector replay. The finish table shows positions, simulated times and gaps; **SETTLE RESULT** saves the prize, REP, assigned-car mileage and personal record.

| Discipline | Build focus | Rookie invitation | Club invitation |
| --- | --- | --- | --- |
| Street Sprint | Acceleration, handling and braking | East Ward Shakedown | Ward Club Circuit |
| Drag | Launch grip, power-to-weight and power | Dockyard 402 | Dockyard Redline |
| Touge | Grip, handling, braking and low weight | Hakuro First Descent | Hakuro Switchback Club |
| Expressway | Power and high-speed consistency | Eastline After Hours | Eastline Midnight Club |

There are **8 events**. **East Ward Shakedown is fee-free at Level 1** after the starter choice. Other events require Levels 2–6 and charge a displayed fee. The briefing shows gross prizes and net earnings for all four positions. A poor finish can pay less than the entry fee; withdrawal does **not** refund it.

The same build, condition, rivals and course give the same times: reloading does not reroll defeat. These are abstract game ratings, **not real driving physics or a freely driven 3D game**. There are no random breakdowns, fuel costs, new wear, damage, police or car loss. Race model v1, fees and rewards are unchanged in Phase 7. See [PHASE6.md](docs/PHASE6.md).

Only **one job OR race** can be pending, including a finished but unclaimed activity. The assigned car stays locked for tuning until settlement/cancellation. Another parked car can be tuned. Changing the active garage vehicle never swaps the existing race participant.

### Categorised workshop

**14 parts, 8 slots, 3 fictional brands:** Aoba Streetworks, Senka Dynamics and Kurogane Boost. Component buttons and a synchronized dropdown filter **intake, exhaust, ECU, tires, suspension, brakes, weight reduction and turbo**. Counts and selected categories stay visible.

Choose the individual vehicle to tune and review current versus proposed power, weight, power-to-weight, grip, handling, braking, reliability and originality before **BUY & INSTALL**. Parts belong to that car, not every copy of a model. One upgrade fits a slot. Swapping retains the old part; refitting owned parts and **RESTORE STOCK** are free, without refunds. Turbo upgrades fit the Akari RZ-T only. Level, cash, compatibility and activity restrictions are explicit.

Factory baselines stay separate from derived values so upgrades never compound on reload. Reliability is not current engine condition. Parts do not repair wear or increase job rewards. Resale/transfers, engine swaps, repairs and final art remain later work. [PHASE5.md](docs/PHASE5.md) lists unchanged prices/effects.

### Jobs and starters

| Job | Unlock | Duration | Payment | REP | Vehicle use |
| --- | --- | ---: | ---: | ---: | --- |
| Garage Shift | Starter / Level 1 | 15s | ¥1,500 | +4 | On foot; no mileage |
| Parts Run | Level 2 | 30s | ¥3,000 | +8 | Assigned car; +6 km on claim |
| Dockside Delivery | Level 3 | 45s | ¥5,500 | +14 | Assigned car; +12 km on claim |

Jobs have no entry fee, require a manual claim and do not auto-repeat. Cancellation pays nothing. Five Garage Shifts unlock Level 2. Jobs and races share reputation/levels; there is no extra cash bonus for levelling up. All existing starter/job/part balances are unchanged.

| Starter | Layout | Base power | Price | Cash left |
| --- | --- | ---: | ---: | ---: |
| Hoshino Pico RS | FWD | 105 PS | ¥32,000 | ¥18,000 |
| Hoshino Tora 85 | RWD | 118 PS | ¥42,000 | ¥8,000 |
| Akari RZ-T | RWD Turbo | 155 PS | ¥48,000 | ¥2,000 |

You receive **one starter, not three free cars**. Owned instances retain their own condition, mileage, factory data and tuning. Additional-car acquisition remains Phase 8; its shop must filter by **manufacturer/brand, model year/year range and body type**, with combined filters and sorting. The market is not implemented yet.

## Interface and saves

Cash, level, REP, XP progress and top navigation remain visible while scrolling. **Garage, Jobs, City, Races, Workshop and Saves** are isolated sections. Arrow keys, Home and End operate the tab row; narrow screens can scroll the row horizontally. READY badges announce finished jobs/races without paying them automatically. Global save warnings link to recovery tools.

District inspection, garage search/sort and activity filters survive ordinary tab switches. City links intentionally choose the destination district and clear a conflicting race-discipline filter. Reload, successful import and reset return to Garage and default city/filter views. These view preferences are not gameplay save data.

Progress autosaves in **this browser on this device**, under `kagehama:save`. Gameplay commands must write successfully **before** publishing visible changes. Tab/filter/XP rendering does not write gameplay data.

- **Export:** generate a `KAGEHAMA1-...` code in Saves, including tuning, race records and any pending activity.
- **Import:** review the confirmation before replacing the whole save, not merging it.
- **Reset:** confirmation returns to ¥50,000, Level 1 and starter selection, clearing cars, parts, jobs and races. Export a backup first.

**Save v5 is unchanged; no reset or new migration is needed for Phase 7.** Valid v1–v4 saves still migrate through the tested existing chain. Cars, tuning, cash, REP, levels, job receipts and race snapshots remain intact. No city unlock rewards or second XP balance are invented.

Leaving the page readies at most the one pending activity. Its original build, rivals, prizes and deadline remain saved. Returning never auto-repeats or pays it. Importing an older code deliberately restores an older snapshot. No cloud account or server-authoritative anti-cheat exists; device clocks/codes remain user-controlled.

Unreadable/newer saves are protected, not deleted. Failed writes cannot consume money, parts or rewards. Clock rollback prevents premature completion but permits cancellation/withdrawal. Use one browser tab at a time: detected external changes block stale writes, not a distributed lock. Clearing site data/private browsing may remove progress; keep exported backups.

## Roadmap

- [x] **0 — Foundation:** React/TypeScript/Vite, midnight-Japan shell and catalog.
- [x] **1 — Core Game:** player state, starter purchase and vehicle instances.
- [x] **2 — Persistence:** autosave, portable codes and confirmed reset.
- [x] **3 — Garage:** dossiers, active car and regression tests.
- [x] **4 — Economy:** timed jobs, yen/REP, levels and mileage.
- [x] **5 — Interface & Tuning:** persistent HUD, real tabs and first workshop.
- [x] **6 — Racing:** four disciplines/eight events, replay/results/records and component categories.
- [x] **7 — Kagehama City:** district overview, access previews, filtered activity shortcuts and HUD XP.
- [ ] **Graphics & Audio I:** separate targeted presentation pass; not completed by the schematic city view.
- [ ] **8 — Car Market:** used listings, buying/selling, values and brand/year/body-type filters.
- [ ] **9 — Heat:** police pressure and underground risk/reward.
- [ ] **10 — Collection:** rarities, Collection Book, achievements and Icon cars.
- [ ] **11 — Advanced Cars:** auctions, imports, barn finds and restoration.
- [ ] **12 — Empire & Automation:** businesses, staff/crew, delegated routines and capped offline production.
- [ ] **13+ — Endgame:** Legacy/Prestige, rivals, bosses, events and catalog expansion.

[Detailed roadmap](docs/ROADMAP.md). Automation remains later progression, with exact routines/costs/caps designed before implementation. README, roadmap, changelog and compatibility notes are reviewed with every phase.

## Development and verification

**Playing requires no installation.** The workflow checks feature branches and publishes `main` only after successful tests, build and browser checks. Use Node.js 24, matching CI:

```bash
npm install
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run dev
```

PowerShell: use `npm.cmd` / `npx.cmd` when script policy blocks `.ps1` shims; no policy change is required. Browser tests exercise the production build at `/Racing-Game/`; build first. CI attaches reports/screenshots. `phase/**` branches do not deploy. A local `git pull` only updates your copy. Dependency pinning/a committed lockfile remain documented build-hardening work.

## Architecture

`src/data/` contains vehicle/job/part/race catalogs and explicit district metadata. `src/domain/` contains pure commands, read-only city selectors, progression, derived stats, model-v1 racing, validation and migrations. `src/hooks/` owns durable session writes and the presentation clock. `src/components/` provides the shared HUD and views. Historical fixtures remain in `tests/fixtures/`; production-build regressions are in `tests/e2e/`.

## Principles

JDM culture is the heart of the setting. Fictional manufacturers create an original universe. Rarity is separate from raw performance; builds should suit different disciplines. Content is data-driven, and save compatibility/tests are core infrastructure.
