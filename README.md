# KAGEHAMA — Underground Car Empire

**[🎮 PLAY KAGEHAMA IN YOUR BROWSER](https://tlsnipz.github.io/Racing-Game/)**

A pre-alpha car-collection, street-racing and automotive-empire game set in the fictional Japanese city of Kagehama.

> Modern Japan × JDM culture × touge × expressway × car collecting × tycoon.

**Current milestone: Phase 4 — Economy** · **Save schema: v3** · **Next: Phase 5 — Interface & Tuning**

[Roadmap](docs/ROADMAP.md) · [Changelog](CHANGELOG.md) · [Economy and save contract](docs/PHASE4.md) · [Garage milestone](docs/PHASE3.md) · [Build and deployment](https://github.com/TLSnipZ/Racing-Game/actions/workflows/deploy-pages.yml)

## What you can play now

Start with **¥50,000**, inspect three inexpensive cars and confirm one starter purchase. The price is deducted and your own vehicle instance is created. Your garage includes searchable/sortable cards, a dossier, engine/body/transmission condition, originality, fitted parts and a saved **active vehicle**. Inspecting a different car does not activate it or cost money.

**Phase 4 adds a repeatable earning loop:** accept a job, wait for its short timer, claim yen and reputation, unlock better jobs, and save towards the upcoming tuning shop. The **Jobs** navigation link takes you to the job board. A single accepted contract is saved immediately, including its deadline and assigned car. Reloading never restarts the timer or duplicates the reward.

### First contacts

| Job | Unlock | Duration | Payment | Reputation | Vehicle use |
| --- | --- | ---: | ---: | ---: | --- |
| Garage Shift | Starter chosen / Level 1 | 15 seconds | ¥1,500 | +4 REP | Workshop work on foot; no mileage |
| Parts Run | Level 2 | 30 seconds | ¥3,000 | +8 REP | Active car; +6 km when claimed |
| Dockside Delivery | Level 3 | 45 seconds | ¥5,500 | +14 REP | Active car; +12 km when claimed |

Only **one job at a time**. Payment requires a manual claim after the deadline; there are no entry fees, auto-repeat chains, random failures, fuel bills, damage or Heat yet. All three stock starters can do delivery work. Workshop shifts remain available when a car cannot drive. Cancelling after confirmation pays nothing and adds no mileage.

Reputation is cumulative. Level thresholds are **0 / 20 / 60 / 120 / 200 / ...**, using `10 × level × (level − 1)`, with a Phase 4 progression cap of **Level 20**. Reputation and money can continue increasing at the cap. Five Garage Shifts unlock Level 2. There is no extra level-up cash bonus. The initial balance is provisional, not a real-world wage simulation.

### Starter cars

| Car | Layout | Power | Price | Cash remaining | Character |
| --- | --- | ---: | ---: | ---: | --- |
| Hoshino Pico RS | FWD | 105 PS | ¥32,000 | ¥18,000 | Lightweight, reliable, inexpensive |
| Hoshino Tora 85 | RWD | 118 PS | ¥42,000 | ¥8,000 | Old-school touge/drift potential |
| Akari RZ-T | RWD Turbo | 155 PS | ¥48,000 | ¥2,000 | Highest starter power, worn condition |

The initial game grants **one** starter, not three free cars. Additional-car acquisition arrives with the market in Phase 8. Vehicle profiles remain placeholder silhouettes. City, racing and workshop functionality are not implemented yet. Phase 5 introduces spending on performance parts; for now you can earn and save.

## Next milestone — Interface & Tuning (planned)

Phase 5 now includes the requested interface reorganisation alongside tuning:

- **5A — Shared interface:** replace the bottom scroll-link bar with prominent top navigation and real in-game sections. Only the selected section is shown. A compact cash/level/reputation HUD and navigation stay visible while scrolling, in every section, on desktop and mobile.
- **5B — Workshop:** add compatible performance parts, purchasing/installation, derived vehicle stats and clear trade-offs in a dedicated Workshop section.

Changing sections must not pause or restart accepted jobs, change the active car, lose progress or reload the whole game. Job-ready indicators and save warnings remain accessible across sections. City and Races remain marked unavailable until implemented. This is a planned change, not functionality already released in Phase 4. The [roadmap](docs/ROADMAP.md) records acceptance tests and compatibility requirements.

Later automation is planned primarily with **Phase 12 — Empire & Automation**: passive businesses and staff-managed routines, with explicitly capped offline production. Crew-dispatched repeated work is a candidate mechanic; exact unlocks/costs/limits are not fixed. Current jobs remain manual, and the Phase 5 interface change does not itself introduce automation.

## Saves, export/import and reset

Progress is stored automatically in **this browser on this device** under `kagehama:save`. Purchases, car activation, job acceptance/claim/cancellation, confirmed imports and resets write immediately before the visible state changes. No account or cloud synchronisation is implemented.

- **Export:** generate a portable `KAGEHAMA1-...` code for backup or another device, including a pending job.
- **Import:** review the confirmation summary before replacing the entire current save, including its job.
- **Reset:** confirmation returns to ¥50,000, Level 1, zero reputation/jobs and the three starter choices. Export first to keep a way back.

**Save v1 and v2 data migrate automatically to v3.** V1 gains its first car as the active vehicle; v2 keeps its existing active choice. Migration adds an empty job record without changing prior cash, reputation, level, cars or parts, and without inventing historical income. The code prefix stays `KAGEHAMA1-`: it versions the transport, not the internal save schema.

Closing the page can make the **one accepted job** ready by the next visit. It still needs a manual claim. It does not generate repeated jobs or business/offline income. Previously exported codes are snapshots: deliberately importing an older code restores that older state, including any older unclaimed contract.

Malformed or newer unsupported saves are **not automatically deleted**. Recovery warnings block normal writes until resolved. Failed writes do not award money, consume pending rewards or silently apply imports/resets. A backwards device-clock jump blocks early claims and offers cancellation. Timing and save validation prevent ordinary invalid/repeated actions, **not deliberate cheating**: clocks and export codes are client-controlled. Use one tab at a time; detected external changes block stale writes, but this is not a distributed lock. Clearing site data or using private browsing can remove progress; keep exported backups.

## Development roadmap

- [x] **Phase 0 — Foundation:** React/TypeScript/Vite, midnight-Japan design and starter catalog.
- [x] **Phase 1 — Core Game:** player state, starter purchase and individual vehicle instances.
- [x] **Phase 2 — Persistence:** autosave, portable codes, validation and confirmed reset.
- [x] **Phase 3 — Garage:** vehicle cards/details, active-vehicle management and browser regression tests.
- [x] **Phase 4 — Economy:** timed jobs, yen/rep rewards, level gates, receipts, mileage and v1/v2→v3 migration.
- [ ] **Phase 5 — Interface & Tuning:** prominent top navigation, real section tabs, persistent cash/level/rep HUD, parts, installation, modifiers, trade-offs and tuning brands.
- [ ] **Phase 6 — Racing:** Touge, Drag, Street Sprint and Expressway simulation.
- [ ] **Graphics & Audio I:** targeted art/audio pass after a complete job→tuning→race loop; exact scheduling remains flexible.
- [ ] **Phase 7 — Kagehama:** city map, districts and unlocks.
- [ ] **Phase 8 — Car Market:** used cars, individual listings, buying/selling and dynamic values.
- [ ] **Phase 9 — Heat:** police pressure and underground risk/reward.
- [ ] **Phase 10 — Collection:** rarities, Collection Book, achievements and Icon cars.
- [ ] **Phase 11 — Advanced Cars:** auctions, imports, barn finds and restoration.
- [ ] **Phase 12 — Empire & Automation:** businesses, garage upgrades, staff/crew, delegated routines and capped offline production.
- [ ] **Phase 13+ — Endgame:** Legacy/Prestige, rival crews, bosses, events and expanded catalog.

The [detailed roadmap](docs/ROADMAP.md) separates working features from future plans. README, roadmap, changelog and save-compatibility notes are reviewed with every feature change. Graphics will expand alongside later content after the initial art pass.

## Development and verification

**Playing requires no installation. Use the live link above.** Local development is optional; the workflow runs tests/builds and publishes `main` only after successful checks.

Use Node.js 24, matching CI:

```bash
npm install
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run dev
```

On Windows PowerShell, use `npm.cmd` / `npx.cmd` when script policy blocks `npm.ps1`. No policy change is required just to use those command shims.

`npm test` runs domain tests. `npm run test:e2e` exercises the built site at `/Racing-Game/`, including timed jobs via Playwright's controlled clock; build first. CI installs browser dependencies and attaches reports/screenshots. `phase/**` branches run checks without publishing; only `main` deploys. A local `git pull` updates local files only and is not required to publish changes already committed on GitHub.

## Architecture

- `src/data/` — vehicle and job catalogs.
- `src/domain/` — pure game/garage/economy commands, progression, validation, save codec and migrations.
- `src/hooks/` — browser storage/session boundary; durable writes before publishing state.
- `src/components/` — garage, job board, placeholder profiles and save tools; timers only update presentation.
- `tests/fixtures/` — fixed v1/v2 save data for compatibility checks.
- `tests/e2e/` — production-build browser regression tests.

## Project principles

JDM and Japanese underground-car culture are the heart of the setting. Fictional manufacturers create an original universe, not real brands with swapped logos. Rarity/collector value should stay separate from raw performance; different builds should excel at different disciplines. Content should be data-driven, and save compatibility and tests are core infrastructure rather than end-of-project cleanup.
