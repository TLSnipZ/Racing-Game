# KAGEHAMA — Underground Car Empire

**[🎮 PLAY KAGEHAMA IN YOUR BROWSER](https://tlsnipz.github.io/Racing-Game/)**

A pre-alpha car-collection, street-racing and automotive-empire browser game set in a fictional Japanese coastal city.

> Japan at midnight × JDM culture × touge × expressway × collecting × tycoon.

**Current milestone: Phase 8 — Car Market** · **Save: v6** · **Next numbered system: Phase 9 — Heat**

[Roadmap](docs/ROADMAP.md) · [Changelog](CHANGELOG.md) · [Market contract](docs/PHASE8.md) · [City/XP](docs/PHASE7.md) · [Racing](docs/PHASE6.md) · [Tuning](docs/PHASE5.md) · [Economy](docs/PHASE4.md) · [Build & deployment](https://github.com/TLSnipZ/Racing-Game/actions/workflows/deploy-pages.yml)

## Play now

**Choose a starter → earn money/REP → tune → race → collect rewards → buy another car.** Start with ¥50,000 and one confirmed purchase from the original three starter cars. Your collection now grows through normal market purchases, not free vehicle grants.

### New: the used-car market

Open **Market** in the top navigation. Each batch has **nine individual offers from six models**, with their own years, mileage, conditions, originality, sellers and prices. The stock includes the two starter models you did not choose.

| Model | Brand | Body type | Listing years | Buy from |
| --- | --- | --- | --- | --- |
| Pico RS | Hoshino | Hatchback | 1992–1995 | Level 2 |
| Tora 85 | Hoshino | Coupe | 1984–1987 | Level 2 |
| RZ-T | Akari | Coupe | 1990–1994 | Level 2 |
| Mira S | Hoshino | Sedan | 1996–1999 | Level 3 |
| Riku Tourer | Mikado | Wagon | 1995–2000 | Level 4 |
| Nami GT | Akari | Coupe | 1998–2002 | Level 5 |

**Filter by manufacturer, body type and year range together.** Set both years equal for an exact year. Search by model/listing/seller and sort by price, year, mileage or condition. Counts, include-purchased toggle and clear filters help recover empty searches. Ordinary section switches keep these choices.

Use **INSPECT & BUY** to review the exact vehicle, cost, remaining cash and garage space. Confirming adds that individual car and deducts its price once. It does not switch your existing active ride. Activate it in Garage, select it in Workshop, or choose it for a race. All new models support existing non-turbo parts; turbo upgrades remain RZ-T-only.

The initial garage supports **12 cars**. Bigger valid legacy imports are kept intact but cannot buy more until below capacity. In **SELL CARS**, review the dealer offer before confirming. The car and all its purchased parts leave together, including stored replacements. The dealer credits 20% of part catalog costs, not their full purchase price. Selling your active car names the replacement in advance. **You cannot sell your last car or a car assigned to an unsettled job/race.** Old settled records remain.

Prices vary with condition, mileage, model year and originality; asking prices also include a small listing-demand factor. The dealer spread makes immediate buy/sell a loss. These are provisional game values, not real-world pricing. No restoration-profit loop, buyback, auction or automatic trading is implemented yet.

**Stock never rerolls on reload.** New listings require a confirmed ¥1,000 sourcing fee at Level 2, followed by a 5-minute cooldown. This replaces unsold offers but never your owned cars. Cooldown expiry only enables the button, not an automatic refresh. The [market contract](docs/PHASE8.md) defines all valuation, capacity and save rules.

### Racing

**Races → select vehicle → RACE BRIEFING → ENTER RACE.** Eight events span Rookie and Club tiers in **Street Sprint, Drag, Touge and Expressway**, each against three rivals. **East Ward Shakedown is free at Level 1** after starter selection. Other events require Levels 2–6 and show fees plus gross/net prizes for every placement before entry.

After a 3-second countdown, the compressed replay shows participant progress. **SETTLE RESULT** collects the prize/REP, updates the assigned car's mileage and saves personal records. A poor paid finish may earn less than the fee; withdrawal does not refund it.

The same build, condition, course and rivals produce the same times. Different sectors emphasize power, weight, grip, brakes or handling. These are abstract game ratings, not realistic driving physics, steering or 3D driving. No random breakdowns, fuel costs, new wear, police or vehicle loss are introduced. Race model v1 and old snapshots are unchanged by Phase 8.

Only **one job OR race** can be pending, including completed activities waiting to be claimed. Its assigned car stays locked for tuning/sale until settlement or cancellation. Trading/tuning another parked car does not alter the running activity.

### City, HUD and garage

Cash, level, REP and a small **XP bar below the level number** remain visible with the top navigation while scrolling. **REP is level XP**, not a separate currency. The bar shows remaining REP and MAX at the current Level 20 cap; REP/money can continue growing.

**Garage, Jobs, City, Races, Workshop, Market and Saves** are separate in-game tabs. Arrow keys/Home/End operate navigation; narrow screens can scroll the tab row. READY badges indicate claimable jobs/races without automatic payout. Save recovery remains global.

City is a free district directory, not travel. East Ward opens at Level 1, Dockside/Hakuro at 2 and Eastline at 3. Individual activities keep their higher gates. City shortcuts filter race/job boards without entering them; pending activities stay reachable under any filter. Industrial District and Outer Kagehama are clearly future previews.

Garage has individual vehicle dossiers, condition, factory data, current build stats, search/sort and explicit active-car selection. Inspecting does not activate a car. Manufacturer/body metadata now covers the expanded collection. Current vehicle silhouettes, city schematic and race graphics are **placeholders**. **Graphics & Audio I is still an open presentation milestone**, not completed by the market.

### Workshop

**14 parts / eight slots / three fictional brands:** Aoba Streetworks, Senka Dynamics and Kurogane Boost. Visible component buttons and a synchronized dropdown filter intake, exhaust, ECU, tires, suspension, brakes, weight reduction and turbo.

Choose the individual car, review current versus proposed values, then **BUY & INSTALL**. Ownership is per car; only one upgrade fits a slot. Replacements are kept, refitting owned parts is free, and **RESTORE STOCK** is free without a refund. The saved factory baseline stays separate, preventing reload from compounding upgrades. Reliability is not engine condition; parts do not repair wear or increase job income. Prices/effects of existing parts remain unchanged; [Phase 5](docs/PHASE5.md) documents them.

### First jobs and starters

| Job | Level | Time | Yen / REP | Vehicle use |
| --- | ---: | ---: | --- | --- |
| Garage Shift | 1 + starter | 15s | ¥1,500 / +4 | On foot |
| Parts Run | 2 | 30s | ¥3,000 / +8 | Assigned car; +6 km on claim |
| Dockside Delivery | 3 | 45s | ¥5,500 / +14 | Assigned car; +12 km on claim |

Job acceptance is free; claims are manual and no auto-repeat exists. Five Garage Shifts unlock Level 2. Reputation thresholds remain `10 × level × (level − 1)`; no extra level-up cash bonus.

| Original starter | Layout | PS | Price | Cash left |
| --- | --- | ---: | ---: | ---: |
| Hoshino Pico RS | FWD | 105 | ¥32,000 | ¥18,000 |
| Hoshino Tora 85 | RWD | 118 | ¥42,000 | ¥8,000 |
| Akari RZ-T | RWD Turbo | 155 | ¥48,000 | ¥2,000 |

Original starter selection, job rewards, part prices and race balance are unchanged. The broader market offers separately priced used examples.

## Saves

**Valid v1–v5 saves migrate automatically to v6. No reset needed.** V5 gains only initial marketplace data; old cars, tuned parts, money, levels/REP, job receipts and paid/unsettled race snapshots remain intact. No free owned cars, past trades, payments or cooldown are invented. Earlier migrations remain supported.

Progress autosaves in **this browser/device** under `kagehama:save`. Gameplay writes must succeed before visible progress changes. Browsing, filters and timer rendering do not write gameplay state.

**Export** a `KAGEHAMA1-...` code in Saves to retain the whole collection, tuning, stock, trade history, refresh deadline, records and pending activity. **Import** replaces the entire snapshot after confirmation, not merges. **Reset** returns to ¥50,000 and starter choice, clearing vehicles, parts, activities and market history. Export before selling a treasured car or resetting.

Old codes remain snapshots: importing one restores old progress. Cooldown expiry and time away never auto-repeat jobs/races or change stock. Unreadable/newer saves are protected, not deleted. Failed writes retain cash/cars/stock and rewards. Detected external tab changes block stale writes, but this is not a distributed lock; use one browser tab at a time. There is no cloud account or server anti-cheat. Clocks/codes are player-controlled, and clearing site data/private browsing can remove local progress.

## Roadmap

| Phase | Status / scope |
| --- | --- |
| 0–2 | Complete: foundation, core starter game and persistence |
| 3 | Complete: collection/garage and active vehicle |
| 4 | Complete: jobs, income and progression |
| 5 | Complete: persistent tabs/HUD and tuning |
| 6 | Complete: four disciplines/eight events and component categories |
| 7 | Complete: city districts, activity filters and HUD XP |
| 8 | Complete: individual used cars, purchase/sale, valuation, combined filters and Save v6 |
| Graphics & Audio I | Open: targeted first car/garage/race art, animation and sound |
| 9 | Planned: Heat, police pressure and risk/reward |
| 10 | Planned: Collection Book, rarities, achievements and Icon cars |
| 11 | Planned: auctions, imports, barn finds and restoration |
| 12 | Planned: businesses, staff/crew, capacity upgrades and capped automation/offline earnings |
| 13+ | Planned: Legacy/Prestige, rivals, bosses, events and catalog expansion |

[Detailed roadmap](docs/ROADMAP.md). Automation remains later progression, with rules and limits defined before implementation. README, roadmap, changelog and save notes are maintained with each phase.

## Development

**Playing requires no installation.** CI checks feature branches; only a successful main build deploys Pages. Node.js 24 matches CI:

```bash
npm install
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run dev
```

PowerShell may use `npm.cmd` / `npx.cmd` without changing execution policy. Browser tests use the production build at `/Racing-Game/`. CI attaches reports/screenshots. Local `git pull` only syncs your copy. Dependency pinning/a committed lockfile remain separate build-hardening work.

`src/data/` holds explicit catalogs/metadata. `src/domain/` holds pure commands, market snapshots/valuation, progression, racing model, validation and migrations. `src/hooks/` owns durable saves and clocks. `src/components/` contains section views. Frozen old-save fixtures are under `tests/fixtures/`; browser regressions under `tests/e2e/`.

JDM culture and fictional manufacturers define the setting. Rarity stays separate from speed. Data-driven content, build variety, compatibility and tests are core project principles.
