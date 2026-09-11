# KAGEHAMA — Underground Car Empire

**[🎮 PLAY KAGEHAMA IN YOUR BROWSER](https://tlsnipz.github.io/Racing-Game/)**

A pre-alpha car-collection, street-racing and automotive-empire game set in a fictional Japanese coastal city.

> Modern Japan × JDM culture × touge × expressway × car collecting × tycoon.

**Current milestone: Phase 6 — Racing** · **Save schema: v5** · **Next presentation pass: Graphics & Audio I** · **Next numbered system: Phase 7 — City**

[Roadmap](docs/ROADMAP.md) · [Changelog](CHANGELOG.md) · [Racing and save contract](docs/PHASE6.md) · [Tuning](docs/PHASE5.md) · [Economy](docs/PHASE4.md) · [Garage](docs/PHASE3.md) · [Build/deployment](https://github.com/TLSnipZ/Racing-Game/actions/workflows/deploy-pages.yml)

## Play now

Choose one of three inexpensive starters with **¥50,000**, earn yen and reputation from jobs, fit compatible performance parts, then test the build against three rivals. The first complete loop is now **starter → job → income → tuning → race → reward**.

### Racing is open

Open **Races**, select your owned vehicle, filter by discipline, and inspect **RACE BRIEFING** before **ENTER RACE**. After a 3-second start, a compressed sector replay shows each entrant's progress. The finish table shows positions, simulated times and gaps; **SETTLE RESULT** saves the prize, reputation, assigned-car mileage and your personal record.

| Discipline | Build focus | Rookie invitation | Club invitation |
| --- | --- | --- | --- |
| Street Sprint | Acceleration, handling and braking | East Ward Shakedown | Ward Club Circuit |
| Drag | Launch grip, power-to-weight and power | Dockyard 402 | Dockyard Redline |
| Touge | Grip, handling, braking and low weight | Hakuro First Descent | Hakuro Switchback Club |
| Expressway | Power and high-speed consistency | Eastline After Hours | Eastline Midnight Club |

There are **8 events** across Rookie and Club tiers. **East Ward Shakedown has no entry fee and opens at Level 1 after the starter choice.** Other events unlock at Levels 2–6 and charge an explicitly shown fee. All four placements' gross prizes and net earnings are visible before confirmation. A poor paid-race finish can pay less than its entry fee; withdrawing does **not** refund it.

The race model is deterministic: the same build, condition, rivals and course give the same times. Reloading cannot reroll a defeat. Different sectors weight the build differently, so extra power is not a substitute for grip/brakes everywhere. These are abstract game ratings and benchmark times, **not real driving physics**. No steering, gear changes, reaction minigame or 3D driving is implemented. There are no random breakdowns, fuel bills, new wear, damage, police or car loss in this first racing pass.

Only **one job OR race** may be pending. A finished activity still needs a manual claim/settlement. The car assigned to a race or delivery stays locked for tuning until that activity is settled or cancelled. Another parked car can be tuned; changing the active garage car cannot swap the existing race participant. The [Phase 6 contract](docs/PHASE6.md) documents every fee, prize, timer and model rule.

### Persistent interface

The **cash / level / reputation HUD and top navigation stay visible while scrolling**. Garage, Jobs, Races, Workshop and Saves are separate in-game sections, not links down a single long page. City is still unavailable.

Jobs and races retain their saved deadlines across tab switches. Their **READY** badge signals an available result without paying it automatically. Garage inspection, search and sorting, plus shop/race filters, survive ordinary section switches. Arrow keys, Home and End operate the tab row; on narrow screens navigation can scroll horizontally. Global save warnings link to recovery tools. Reload opens Garage; the chosen interface tab is not gameplay save data.

### Categorised tuning workshop

**14 parts, 8 slots, 3 fictional brands:** Aoba Streetworks, Senka Dynamics and Kurogane Boost. Visible **component-type buttons** and a synchronized dropdown filter **intake, exhaust, ECU, tires, suspension, brakes, weight reduction and turbo**. Counts and the selected category are shown. Filtering is free and does not alter a build.

Select the individual vehicle to tune and review current versus proposed power, weight, power-to-weight, grip, handling, braking, reliability and originality before **BUY & INSTALL**. Parts belong to that vehicle, not all copies of a model. Only one upgrade fits a slot; replacing one retains the old part. Refitting owned parts and **RESTORE STOCK** are free, without refunds. Turbo upgrades currently fit the Akari RZ-T only. Level, money, compatibility and assigned-activity restrictions are visible.

Factory baselines remain separate from derived build values, preventing bonuses from compounding on reload. Reliability is not current engine condition; parts do not repair wear or increase job rewards. Part resale/transfers, engine swaps, repair services and final art are still later work. See [PHASE5.md](docs/PHASE5.md) for the unchanged part catalog and effects.

### First contacts

| Job | Unlock | Duration | Payment | Reputation | Vehicle use |
| --- | --- | ---: | ---: | ---: | --- |
| Garage Shift | Starter chosen / Level 1 | 15 seconds | ¥1,500 | +4 REP | On foot; no mileage |
| Parts Run | Level 2 | 30 seconds | ¥3,000 | +8 REP | Assigned car; +6 km on claim |
| Dockside Delivery | Level 3 | 45 seconds | ¥5,500 | +14 REP | Assigned car; +12 km on claim |

Job acceptance is free, rewards are manually claimed, and cancellation pays nothing. No auto-repeat is implemented. Reputation thresholds remain **0 / 20 / 60 / 120 / 200 / ...** (`10 × level × (level − 1)`), with a current progression cap of Level 20; money/reputation can continue growing. Five Garage Shifts unlock Level 2. Races use the same level system; there is no extra level-up cash bonus. Starter prices, jobs and part balance are unchanged in Phase 6.

### Starter cars

| Car | Layout | Base power | Price | Cash remaining | Character |
| --- | --- | ---: | ---: | ---: | --- |
| Hoshino Pico RS | FWD | 105 PS | ¥32,000 | ¥18,000 | Lightweight, reliable, inexpensive |
| Hoshino Tora 85 | RWD | 118 PS | ¥42,000 | ¥8,000 | Old-school touge/drift potential |
| Akari RZ-T | RWD Turbo | 155 PS | ¥48,000 | ¥2,000 | Highest starter power, worn condition |

You receive **one starter, not three free cars**. Each owned instance keeps its own mileage, condition, factory data and tuning inventory. The market and normal additional-car acquisition remain Phase 8. Its requested filters will include **manufacturer/brand, model year/year range and body type**, with combinable filters and sorting; they are documented plans, not a live vehicle shop. Current silhouettes and replay graphics are placeholders for the later art pass.

## Saves, export/import and reset

Progress autosaves in **this browser on this device** under `kagehama:save`. Purchases, fitting/restoration, activation, job commands, race entry/settlement/withdrawal, import and reset require a successful storage write **before** changing visible progress. Tab/filter changes and countdown rendering do not write gameplay data.

- **Export:** generate a `KAGEHAMA1-...` code in Saves, including tuning, race records and any pending activity.
- **Import:** inspect the confirmation summary before replacing the entire current save, not merging it.
- **Reset:** confirmed reset returns to ¥50,000, Level 1 and the starter choice, clearing cars, parts, jobs and racing. Export first to keep a backup.

**Valid Save v1–v4 data migrate automatically to v5. No reset is needed.** Earlier migrations preserve active-car/economy/tuning contracts. V4 gains only an empty racing record; existing vehicles, purchased/fitted parts, cash, reputation, levels and pending jobs/receipts stay intact. The `KAGEHAMA1-` prefix still versions the transport, not the internal save schema.

Race entry stores the complete build/rivals/sector-times/prizes/deadline snapshot, so leaving, reloading or exporting does not recalculate or pay it. Returning after the deadline makes one pending activity ready, never an automatic chain. Deliberately importing an older code restores its older state. No cloud account or server-authoritative anti-cheat exists; device clocks/codes are user-controlled.

Unreadable/newer saves are protected rather than deleted. Failed writes cannot consume money, parts or rewards; a failed race settlement leaves its pending result for retry. Backwards clock jumps block premature completion and permit explicit cancellation/withdrawal. Use one browser tab at a time: detected external changes prevent stale writes, but this is not a distributed lock. Clearing site data or private browsing can remove local progress; keep exported backups.

## Roadmap

- [x] **0 — Foundation:** React/TypeScript/Vite, midnight-Japan design and catalog.
- [x] **1 — Core Game:** player state, starter purchase and vehicle instances.
- [x] **2 — Persistence:** autosave, portable codes and confirmed reset.
- [x] **3 — Garage:** cards, dossiers, active car and regression tests.
- [x] **4 — Economy:** timed jobs, yen/rep, level gates and mileage.
- [x] **5 — Interface & Tuning:** persistent HUD, real section tabs, first workshop and Save v4 migration.
- [x] **6 — Racing:** four disciplines/eight events, deterministic replay, fees/results/records, component categories and Save v5 migration.
- [ ] **Graphics & Audio I:** targeted art/audio pass for the first complete loop; sequencing stays flexible after playtesting.
- [ ] **7 — Kagehama:** city map, districts and unlocks.
- [ ] **8 — Car Market:** used listings, buy/sell, values and filters by brand/year/body type.
- [ ] **9 — Heat:** police pressure and underground risk/reward.
- [ ] **10 — Collection:** rarities, Collection Book, achievements and Icon cars.
- [ ] **11 — Advanced Cars:** auctions, imports, barn finds and restoration.
- [ ] **12 — Empire & Automation:** businesses, staff/crew, delegated routines and capped offline production.
- [ ] **13+ — Endgame:** Legacy/Prestige, rivals, bosses, events and catalog expansion.

Automation is later progression: businesses and staff should handle repetitive operations. Exact routines, unlocks, costs and offline limits need design first. Graphics expand alongside content after the first art pass. See the [detailed roadmap](docs/ROADMAP.md). README, roadmap, changelog and compatibility notes are reviewed with every feature change.

## Development and verification

**Playing requires no installation.** The workflow checks feature branches and only publishes `main` after successful tests, build and browser checks. Use Node.js 24, matching CI:

```bash
npm install
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run dev
```

On PowerShell use `npm.cmd` / `npx.cmd` when script policy blocks `.ps1` shims; no policy change is required. Browser tests run the built site at `/Racing-Game/`; build first. CI attaches Chromium reports and screenshots. `phase/**` branches do not deploy. A local `git pull` only synchronises your copy. Dependency pinning and a committed lockfile remain documented build-hardening work.

## Architecture

`src/data/` holds vehicle/job/part/race catalogs. `src/domain/` holds pure commands, derived stats, the versioned sector model, snapshot validation, codec and migrations. `src/hooks/` owns durable session writes and the shared presentation clock. `src/components/` contains the sticky shell and separate views. Frozen old-save fixtures are in `tests/fixtures/`; production-build browser regressions are in `tests/e2e/`.

## Project principles

JDM and Japanese underground-car culture are the heart of the setting. Fictional manufacturers create an original universe. Rarity/collector value should remain distinct from performance. Content is data-driven, builds should suit different disciplines, and compatibility/tests are core infrastructure.
