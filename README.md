# KAGEHAMA — Underground Car Empire

**[🎮 PLAY KAGEHAMA IN YOUR BROWSER](https://tlsnipz.github.io/Racing-Game/)**

A pre-alpha car-collection, street-racing and automotive-empire game set in the fictional Japanese city of Kagehama.

> Modern Japan × JDM culture × touge × expressway × car collecting × tycoon.

**Current milestone: Phase 3 — Garage** · **Save schema: v2** · **Next: Phase 4 — Economy**

[Roadmap](docs/ROADMAP.md) · [Changelog](CHANGELOG.md) · [Garage and save compatibility](docs/PHASE3.md) · [Build and deployment](https://github.com/TLSnipZ/Racing-Game/actions/workflows/deploy-pages.yml)

## What you can play now

Start with **¥50,000**, inspect three inexpensive cars and confirm one starter purchase. The purchase deducts the real price and creates your own vehicle instance. Your garage shows its mileage, engine/body/transmission condition, originality and fitted parts.

Phase 3 adds an owned-car collection, searchable/sortable vehicle cards, a detailed dossier, condition meters and an explicit **active vehicle**. Looking at a card does not change the active car or charge money. The active selection is saved and included in export codes.

The initial game still grants **one** starter, not three free cars. The garage supports multiple owned instances, but normal additional-car acquisition arrives with the market in Phase 8. Vehicle profiles are original placeholder silhouettes, not final artwork. City, races and workshop are visibly marked as future systems.

### Starter cars

| Car | Layout | Power | Price | Cash remaining | Character |
| --- | --- | ---: | ---: | ---: | --- |
| Hoshino Pico RS | FWD | 105 PS | ¥32,000 | ¥18,000 | Lightweight, reliable, inexpensive |
| Hoshino Tora 85 | RWD | 118 PS | ¥42,000 | ¥8,000 | Old-school touge/drift potential |
| Akari RZ-T | RWD Turbo | 155 PS | ¥48,000 | ¥2,000 | Highest starter power, worn condition |

The other two starters are planned for the used-car market later. Driving performance, repairs and running costs are not simulated yet.

## Saves, export/import and reset

Progress is stored automatically in **this browser on this device** under `kagehama:save`. Purchases, active-car changes, confirmed imports and resets write the resulting state immediately. No account or cloud synchronisation is implemented.

- **Export:** generate a portable `KAGEHAMA1-...` code and copy it as a backup.
- **Import:** paste a code, inspect the confirmation summary, then approve replacement.
- **Reset:** confirmation returns the game to ¥50,000 and the starter choice. Export first to keep a way back.

Existing **Save v1** browser data and Phase 2 export codes migrate to **Save v2**, retaining the original game fields and making the first owned car active. The `KAGEHAMA1-` prefix describes the transport format; it intentionally stays unchanged even though the internal schema is now v2.

Malformed or newer unsupported saves are **not automatically deleted**. The game shows a recovery warning and blocks normal save writes until the player resolves it. Failed storage writes do not silently apply purchases, activation, import or reset. Keep an exported backup: clearing browser site data or using private browsing can remove local progress. Use one game tab at a time; a detected change from another tab pauses local changes until reload. This is not a cloud-sync or distributed-lock system.

## Development roadmap

- [x] **Phase 0 — Foundation:** React/TypeScript/Vite, midnight-Japan design and starter catalog.
- [x] **Phase 1 — Core Game:** player state, starter purchase and individual vehicle instances.
- [x] **Phase 2 — Persistence:** autosave, portable codes, validation and confirmed reset.
- [x] **Phase 3 — Garage:** vehicle cards/details, active-vehicle management, save migration and browser regression tests.
- [ ] **Phase 4 — Economy:** jobs, reputation, player levels and early progression.
- [ ] **Phase 5 — Tuning:** parts, installation, modifiers, trade-offs and tuning brands.
- [ ] **Phase 6 — Racing:** Touge, Drag, Street Sprint and Expressway simulation.
- [ ] **Phase 7 — Kagehama:** city map, districts and unlocks.
- [ ] **Phase 8 — Car Market:** used cars, individual listings, buying/selling and dynamic values.
- [ ] **Phase 9 — Heat:** police pressure and underground risk/reward.
- [ ] **Phase 10 — Collection:** rarities, Collection Book, achievements and Icon cars.
- [ ] **Phase 11 — Advanced Cars:** auctions, imports, barn finds and restoration.
- [ ] **Phase 12 — Empire:** businesses, garage upgrades, staff and crew.
- [ ] **Phase 13+ — Endgame:** Legacy/Prestige, rival crews, bosses, events and expanded catalog.

The [detailed roadmap](docs/ROADMAP.md) separates implemented features from future plans. Roadmap status, README, changelog and save-compatibility notes must be reviewed with each feature change.

## Development and verification

**Playing does not require installing anything. Use the live link above.** Local development is optional; the GitHub workflow runs tests/builds and publishes `main` to Pages only after successful checks.

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

`npm test` runs domain tests. `npm run test:e2e` runs Chromium browser tests against the built site at `/Racing-Game/`; run the build first. CI also installs browser system dependencies. `phase/**` branches are checked without publishing a site; only `main` deploys. Browser reports are attached to workflow runs. A local `git pull` updates local files only and is not needed to publish changes already committed on GitHub.

## Architecture

- `src/data/` — vehicle catalog.
- `src/domain/` — pure game/garage commands, validation, save codec and migrations.
- `src/hooks/` — browser storage/session boundary; no storage side effects inside React state updaters.
- `src/components/` — garage, placeholder profiles and save tools.
- `tests/fixtures/` — fixed old-save data for compatibility checks.
- `tests/e2e/` — production-build browser regression tests.

## Project principles

JDM and Japanese underground-car culture are the heart of the setting. Fictional manufacturers create an original universe, not real brands with swapped logos. Rarity/collector value should stay separate from raw performance; different builds should excel at different disciplines. New content should be data-driven where practical, and save compatibility and tests are core infrastructure rather than end-of-project cleanup.
