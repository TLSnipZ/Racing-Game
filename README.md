# KAGEHAMA — Underground Car Empire

**[🎮 PLAY KAGEHAMA IN YOUR BROWSER](https://tlsnipz.github.io/Racing-Game/)**

A pre-alpha car-collection, street-racing and automotive-empire game set in the fictional Japanese city of Kagehama.

> Modern Japan × JDM culture × touge × expressway × car collecting × tycoon.

**Current milestone: Phase 5 — Interface & Tuning** · **Save schema: v4** · **Next: Phase 6 — Racing**

[Roadmap](docs/ROADMAP.md) · [Changelog](CHANGELOG.md) · [Interface, tuning and save contract](docs/PHASE5.md) · [Economy milestone](docs/PHASE4.md) · [Garage milestone](docs/PHASE3.md) · [Build and deployment](https://github.com/TLSnipZ/Racing-Game/actions/workflows/deploy-pages.yml)

## Play now

Choose one of three inexpensive starters with **¥50,000**, earn money and reputation from jobs, and build your car with compatible performance parts. Purchases create an individual vehicle with mileage, engine/body/transmission condition, original factory data and its own tuning inventory.

### A proper game interface

A compact **cash / level / reputation HUD stays at the top**, together with the navigation, while you scroll. Garage, Jobs, Workshop and Saves are separate in-game sections: clicking a tab changes the visible panel instead of scrolling through one long page. City and Races remain visibly unavailable.

Jobs keep their original deadlines in every section. A **READY** badge on Jobs appears when a reward can be claimed; it does not claim automatically. Garage inspection, search and sorting survive tab switches. Arrow keys, Home and End operate the tab row. On narrow screens, the navigation row can scroll horizontally while the HUD stays visible. Save warnings are global and link to recovery tools. A reload starts in Garage; the selected UI tab is not part of your game save.

### First tuning workshop

**14 parts, 8 slots and 3 fictional brands:** Aoba Streetworks, Senka Dynamics and Kurogane Boost. Intake, exhaust, ECU, tires, suspension, brakes, weight reduction and turbo upgrades offer different build choices.

Select the **vehicle to tune**, filter the catalog and open a part's preview. Review current versus proposed power, weight, power-to-weight, grip, handling, braking, reliability and originality before confirming **BUY & INSTALL**.

- Parts are purchased **for that individual car**, not globally unlocked. Identical cars have separate inventories.
- Only one upgrade fits each slot. Replacing one retains the old part; refitting owned parts is free.
- **RESTORE STOCK** removes an upgrade without a refund. Factory pieces are kept, so restoration is reversible.
- Turbo upgrades currently fit the **Akari RZ-T only**. Level/compatibility/cash requirements are visible before purchase.
- A car assigned to a delivery cannot be modified until that job is claimed or cancelled. Another parked car can still be tuned; an on-foot Garage Shift does not lock any car.

Power and weight shown in Garage are derived build values; the saved factory baseline is never repeatedly overwritten by upgrades. Ratings are a first game-balance model, **not a physics simulation or race prediction**. Reliability is not current engine condition. Parts do not repair wear or increase job rewards. Final art, engine swaps, part selling/transfers, repair costs, damage and racing are not included yet. The [Phase 5 contract](docs/PHASE5.md) lists all prices and effects.

### First contacts

| Job | Unlock | Duration | Payment | Reputation | Vehicle use |
| --- | --- | ---: | ---: | ---: | --- |
| Garage Shift | Starter chosen / Level 1 | 15 seconds | ¥1,500 | +4 REP | On foot; no mileage |
| Parts Run | Level 2 | 30 seconds | ¥3,000 | +8 REP | Assigned car; +6 km on claim |
| Dockside Delivery | Level 3 | 45 seconds | ¥5,500 | +14 REP | Assigned car; +12 km on claim |

One accepted job at a time. Claims are manual; no entry fees, auto-repeat, fuel charges, random failure, damage or Heat. Cancelling after confirmation pays nothing. Reputation thresholds are **0 / 20 / 60 / 120 / 200 / ...** (`10 × level × (level − 1)`), with a current progression cap of Level 20. Five Garage Shifts unlock Level 2. No extra level-up cash bonus. Starter prices and job balance are unchanged in Phase 5.

### Starter cars

| Car | Layout | Base power | Price | Cash remaining | Character |
| --- | --- | ---: | ---: | ---: | --- |
| Hoshino Pico RS | FWD | 105 PS | ¥32,000 | ¥18,000 | Lightweight, reliable, inexpensive |
| Hoshino Tora 85 | RWD | 118 PS | ¥42,000 | ¥8,000 | Old-school touge/drift potential |
| Akari RZ-T | RWD Turbo | 155 PS | ¥48,000 | ¥2,000 | Highest starter power, worn condition |

The game grants **one starter, not three free cars**. Additional acquisition is planned for Phase 8. Vehicle silhouettes remain placeholders, not final artwork. The initial meaningful loop is now starter → job → income → tuning. Racing is next.

## Saves, export/import and reset

Progress autosaves in **this browser on this device**, under `kagehama:save`. Purchases, fitting/restoration, activation, job acceptance/claim/cancellation, import and reset write successfully **before** changing visible progress. Tab changes and countdown rendering do not write game data.

- **Export:** generate a `KAGEHAMA1-...` code in Saves, including tuning inventory and a pending job.
- **Import:** inspect the confirmation summary before replacing the entire current save.
- **Reset:** confirmation returns to ¥50,000, Level 1, no cars/parts/jobs and the starter selection. Export first to retain a backup.

**Valid Save v1, v2 and v3 data migrate automatically to v4. No reset is needed.** V1 gains its first car as active; v1/v2 gain the empty job record introduced in Phase 4. All old cars gain empty per-car tuning data. Existing factory strings/stats, money, levels, reputation, active car and v3 job records/deadlines/receipts are preserved. The transport prefix intentionally remains `KAGEHAMA1-`.

Closing the page can ready the **one accepted job**, never an auto-repeat chain. Old export codes are snapshots: importing one restores that old state. No account, cloud synchronisation or server-authoritative anti-cheat exists.

Unreadable/newer saves are not silently deleted. Warnings block normal writes until resolved. Failed writes do not consume money, parts or rewards. A backwards device-clock jump blocks premature job claims. Use one browser tab at a time; external changes block stale writes when detected, but this is not a distributed lock. Clearing site data or private browsing can remove progress; keep exported backups.

## Roadmap

- [x] **0 — Foundation:** React/TypeScript/Vite, midnight-Japan design and catalog.
- [x] **1 — Core Game:** player state, starter purchase and vehicle instances.
- [x] **2 — Persistence:** autosave, portable codes and confirmed reset.
- [x] **3 — Garage:** cards, dossiers, active car and regression tests.
- [x] **4 — Economy:** timed jobs, yen/rep, level gates and mileage.
- [x] **5 — Interface & Tuning:** persistent top HUD, separate tabs, first parts workshop and Save v4 migration.
- [ ] **6 — Racing:** Touge, Drag, Street Sprint and Expressway simulation.
- [ ] **Graphics & Audio I:** targeted pass after the first complete job→tuning→race loop.
- [ ] **7 — Kagehama:** city map, districts and unlocks.
- [ ] **8 — Car Market:** used listings, buy/sell and value model.
- [ ] **9 — Heat:** police pressure and underground risk/reward.
- [ ] **10 — Collection:** rarities, Collection Book, achievements and Icon cars.
- [ ] **11 — Advanced Cars:** auctions, imports, barn finds and restoration.
- [ ] **12 — Empire & Automation:** businesses, staff/crew, delegated routines and capped offline production.
- [ ] **13+ — Endgame:** Legacy/Prestige, rivals, bosses, events and catalog expansion.

Automation is later progression, not part of this workshop: businesses and staff will handle repetitive operations. Exact crew routines, unlocks, costs and offline limits still need design. Graphics expand alongside content after the first art pass. See the [detailed roadmap](docs/ROADMAP.md). README, roadmap, changelog and compatibility notes are reviewed with every feature change.

## Development and verification

**Playing requires no installation.** The workflow checks feature branches and only publishes `main` after successful tests/build/browser checks.

Use Node.js 24, matching CI:

```bash
npm install
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run dev
```

On PowerShell use `npm.cmd` / `npx.cmd` when script policy blocks `.ps1` shims; no policy change is needed. `npm test` runs domain tests. Browser tests run the built site at `/Racing-Game/`; build first. CI attaches Chromium reports and screenshots. `phase/**` branches do not deploy. A local `git pull` only synchronises your own copy.

## Architecture

`src/data/` holds vehicle/job/part catalogs. `src/domain/` holds pure commands, derived build stats, validation, codec and migrations. `src/hooks/` owns the durable session boundary and presentation clock. `src/components/` contains the sticky shell and section views. Historical fixtures live in `tests/fixtures/`; browser regressions in `tests/e2e/`.

## Project principles

JDM and Japanese underground-car culture are the heart of the setting. Fictional manufacturers create an original universe. Rarity/collector value should stay distinct from raw performance. Content should be data-driven, different builds should suit different disciplines, and compatibility/tests are core infrastructure.
