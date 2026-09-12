# Development roadmap

Play: https://tlsnipz.github.io/Racing-Game/

**Current: Phase 8 — Car Market / Save v6. Next numbered system: Phase 9 — Heat.** Graphics & Audio I remains an open separate presentation milestone.

## Implemented

| Phase | Scope |
| --- | --- |
| 0 — Foundation | React/TypeScript/Vite, Japan-night shell and catalogs |
| 1 — Core Game | ¥50,000, three starter choices, one purchase and unique vehicle instances |
| 2 — Persistence | Autosave, versioned saves, portable KAGEHAMA1 codes and confirmed reset |
| 3 — Garage | Cards, search/sort, dossiers, active car and protected save recovery |
| 4 — Economy | Three timed jobs, one-time manual claims, yen/REP/levels and mileage |
| 5 — Interface & Tuning | Sticky HUD, separate tabs, 14 parts/eight slots, per-car ownership and derived stats |
| 6 — Racing | Eight events/four disciplines, deterministic sectors, fees/prizes, replay, records and component categories |
| 7 — City & XP | District network, four level-gated scenes/two future previews, filtered shortcuts and a small REP-based level XP bar |
| 8 — Car Market | Nine individual saved listings/six models, combined manufacturer/body/year filters, normal car acquisition, confirmed dealer sales, valuation, 12-car capacity, manual stock sourcing and v1–v5→v6 migration |

The original three starter prices, job/part/race balances, progression and race model v1 remain unchanged in Phase 8. New models add variety, not free cars. Garage supports their explicit manufacturer/body metadata; existing non-turbo tuning works on them. See [PHASE8.md](PHASE8.md) for exact stock lifecycle, values, sale safeguards and compatibility.

## Completed market browsing requirement

Manufacturer/brand, body type and inclusive year range combine, including equal years for a single year. Search, counts, purchased-listing toggle, sorting by price/year/mileage/condition and clear filters are implemented. These use explicit metadata, not model-name parsing. Ordinary tab switches retain filters; reload/import/reset use defaults. Browsing never regenerates stock or performs a trade.

Workshop categories remain implemented: intake, exhaust, ECU, tires, suspension, brakes, weight reduction and turbo, with visible buttons and dropdown. New component types need real slot/catalog support. Auction/private listings, part resale/transfers, real restoration-profit flipping and sophisticated demand/economy remain later scope.

## Open — Graphics & Audio I

A focused presentation pass is now possible on the complete job→tuning→race→acquisition loop. It remains **not done**: current car silhouettes, district schematic and replay graphics are placeholders. Scope: three consistent starter artworks, initial Japanese garage, one race setting, better animation and audio. Decide a shared asset/layer strategy before independently changeable paint/wheels/bodykits are promised. Expand that strategy to the newer market cars afterwards. This is not a conversion to freely driven 3D racing.

Numbered feature work must not silently erase this milestone. Its timing stays flexible after playtesting; do not mark it complete merely because a new screen is styled.

## Next numbered system — Phase 9: Heat

Design police pressure and underground risk/reward around the existing activities. Specify which events are illegal, how Heat is gained/reduced, thresholds, event chances or deterministic rules, warnings and exact penalties before implementation. Avoid random irreversible vehicle/save loss. Expose risks before paying entry fees; distinguish Heat from XP/REP and money. Respect the current one-job-OR-race contract and snapshots: new systems must not retrospectively alter accepted fees/prizes or confiscate a locked participant.

Potential low-risk choices, cooldown activities and capped penalties need balance analysis before release. Add a tested schema migration only for necessary persistent fields. Include UI previews, boundary tests, repeated-click/storage-failure checks and legacy fixtures. Nothing in this roadmap means Heat already exists in Phase 8.

## Later milestones

| Phase | Planned scope |
| --- | --- |
| 9 — Heat | Police pressure and underground risk/reward with explicit, bounded consequences |
| 10 — Collection | Rarity independent of performance, Collection Book, achievements and Icon cars |
| 11 — Advanced Cars | Auctions, imports, barn finds, restoration and more manufacturers; activate Outer Kagehama content |
| 12 — Empire & Automation | Businesses, garage/capacity upgrades, staff/crew, delegated routines and capped passive/offline earnings; activate Industrial District content |
| 13+ — Endgame | Legacy/Prestige, rivals, bosses, events and expanded catalog |
| Graphics expansion | Consistent new car/city/business assets with planned paint/wheel/bodykit layers |

Automation should move the player from personally earning the first yen to managing an automotive empire. Crew-dispatched recurring work remains a candidate; define eligible routines, costs, unlocks, collection and offline limits before implementing. Current jobs/races and market trades are manual. No automatic purchases or destructive decisions are implied. An earlier small automation step may be proposed if playtesting becomes repetitive, but none is committed yet.

## Cross-phase quality

Readability, mobile layout, keyboard access, balance and save recovery improve throughout. HUD XP uses existing REP; cap and grandfathered levels remain supported. Preserve all historical fixtures and race-model-v1 snapshots. Larger old garages are retained rather than truncated by the new purchase cap. Global save codes/clocks are client-controlled, not server anti-cheat. Full multi-device/screen-reader coverage exceeds Chromium automation.

Pinning dependencies and adding a reproducible lockfile remain build-hardening work; this phase keeps the inherited toolchain policy. Validate before changing libraries. Planned content has no promised dates.

## Working agreement

Inspect current repo → implement agreed scope → tests/fixtures → validate clean phase branch with unit/build/browser checks → maintain README/roadmap/changelog/save notes → publish a clear commit → verify main Pages deployment. Do not claim publication based on a commit or queued run alone. Do not force-replace another contributor's commits. No temporary preparation script/workflow belongs in the release tree. Development continues in this chat with GitHub, not a separate coding mode.
