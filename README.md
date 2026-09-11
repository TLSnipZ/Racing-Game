# KAGEHAMA — Underground Car Empire

A pre-alpha browser-based car collection, street-racing and automotive-empire game set in the fictional Japanese city of Kagehama.

> Modern Japan × JDM culture × street racing × touge × expressway × car collecting × tycoon.

## 🎮 Play the current build

**https://tlsnipz.github.io/Racing-Game/**

The live build is deployed automatically through GitHub Pages when `main` is updated.

## Current status

**Pre-Alpha — Phase 2: Persistence**

Implemented so far:

- React + TypeScript + Vite foundation
- responsive midnight-Japan visual direction
- three selectable starter cars
- real ¥50,000 new-game economy
- player level and reputation foundation
- individual owned vehicle instances
- mileage, engine/body/transmission condition and originality
- stock installed parts
- Garage v0
- versioned Save v1 envelope
- automatic browser saves via localStorage
- portable `KAGEHAMA1-...` save-code export/import
- save validation before import
- reset-savegame flow with confirmation
- automated tests for core game and persistence logic
- automatic GitHub Pages deployment

## Starter cars

| Car | Layout | Character |
| --- | --- | --- |
| Hoshino Pico RS | FWD | Lightweight, reliable, cheap to maintain |
| Hoshino Tora 85 | RWD | Touge/drift-focused old-school coupe |
| Akari RZ-T | RWD Turbo | Highest starter power, worst condition, high risk |

The two starters not chosen remain planned for later availability through the used-car market.

## Development roadmap

- [x] **Phase 0 — Foundation** — project structure, design system, navigation shell and starter catalog
- [x] **Phase 1 — Core Game** — new-game state, starter purchase, individual player vehicle and Garage v0
- [x] **Phase 2 — Persistence** — autosave, versioned saves, save-code export/import and reset savegame
- [ ] **Phase 3 — Garage** — expanded garage UI, vehicle cards/details, active vehicle management and stronger collection presentation
- [ ] **Phase 4 — Economy** — jobs, reputation, player levels and early progression
- [ ] **Phase 5 — Tuning** — performance parts, installation, stat modifiers, trade-offs and fictional tuning brands
- [ ] **Phase 6 — Racing** — Touge, Drag, Street Sprint and Expressway race simulation
- [ ] **Phase 7 — Kagehama** — city map, districts, unlocks and racing scenes
- [ ] **Phase 8 — Car Market** — used cars, individual listings, dynamic values, buying and selling
- [ ] **Phase 9 — Heat** — police pressure, risk/reward and underground events
- [ ] **Phase 10 — Collection** — rarity system, Collection Book, achievements and Icon cars
- [ ] **Phase 11 — Advanced Cars** — auctions, imports, barn finds, restoration and expanded manufacturers
- [ ] **Phase 12 — Empire** — businesses, garage upgrades, staff and crew
- [ ] **Phase 13+ — Endgame** — Legacy/Prestige, rival crews, bosses, seasonal events and a large vehicle catalog

The roadmap is iterative: completed phases stay documented here, and future phases can be refined as the game evolves.

## Save system

KAGEHAMA currently stores progress automatically in the browser. Portable saves can be exported as a code beginning with `KAGEHAMA1-` and imported on another browser/device.

Save data is versioned so future game updates can add migrations rather than intentionally invalidating older progress.

## Development

```bash
npm install
npm test
npm run build
npm run dev
```

Node.js is required for local development. The player-facing build itself runs through GitHub Pages and does not require a local installation.

## Project principles

- JDM and Japanese underground-car culture are the heart of the setting.
- Fictional manufacturers and vehicles create an original game universe rather than copying real brands 1:1.
- Rarity and collector value are separate from raw performance.
- Different builds should excel at different disciplines instead of creating one universal horsepower meta.
- New cars, parts and events should be data-driven wherever practical.
- Save compatibility and automated tests are treated as core infrastructure, not end-of-project cleanup.
