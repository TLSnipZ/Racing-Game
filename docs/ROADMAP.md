# Development roadmap

Play: https://tlsnipz.github.io/Racing-Game/

Current milestone: **Phase 8 — Used Car Market**. **Save v6.** The complete starter → job → tuning → race → reward loop now includes multiple cars, individual saved dealer stock and explicit buy/sell transactions.

## Implemented

| Phase | Scope |
| --- | --- |
| 0 — Foundation | React/TypeScript/Vite, Japan-night shell, catalog and navigation. |
| 1 — Core Game | ¥50,000, three starter choices, one real purchase and vehicle instances. |
| 2 — Persistence | Autosave, versioned saves, KAGEHAMA1 export/import and confirmed reset. |
| 3 — Garage | Cards, search/sort, dossiers, condition, fitted parts, active vehicle and protected recovery. |
| 4 — Economy | Three timed jobs, manual claims, yen/REP/levels, assigned mileage and receipts. |
| 5 — Interface & Tuning | Sticky HUD and isolated tabs; 14 parts/8 slots, per-car ownership, fit/restore, derived stats and old-save migration. |
| 6 — Racing | Eight events/four disciplines, deterministic sectors, three rivals, fees/prizes, compressed replay, one-time settlement, records and component categories. |
| 7 — Kagehama City | Four districts with existing-level access, two future previews, explicit activity membership, filtered shortcuts, retained pending activities and a small REP-based level XP bar in the sticky HUD. |
| 8 — Used Car Market | Six models/three manufacturers/four body types; individual saved listings, combined brand/year/body/search filters, price/year/mileage/condition sorting, confirmed buy/sell, active replacement, assigned/last-car locks, 12-space purchase capacity, manual 5-minute stock refresh and Save v6 migration. |

Phase 8 preserves race model v1, level thresholds, original starter prices, original build ratings and all job/part/race rewards. The shared catalog adds three new models with their own ratings. See [PHASE8.md](PHASE8.md) for exact market, ownership and migration rules. Previous milestones remain documented historical contracts.

Phase 7 did not change race model v1, old saves, level thresholds, starter prices or job/part/race rewards. District browsing is not travel and does not grant money or start activities. The active job/race remains recoverable even through an unrelated or locked-district preview. See [PHASE7.md](PHASE7.md); previous contracts remain historical records of their milestones.

## Open presentation milestone — Graphics & Audio I

The first complete loop makes a focused art/audio pass possible. **This remains open, not completed by Phase 7 or Phase 8.** City and Market were implemented as numbered systems before this separate presentation milestone; the map and car profiles remain functional placeholders. No final car/garage images or audio have been silently substituted or marked done.

Scope remains three consistent starter artworks, the first Japanese garage, one race environment, improved animation and audio feedback. Define an asset/layer strategy before promising independently changeable paint, wheels and bodykits. Preserve gameplay and saves. This is a targeted pass, not conversion into freely driven 3D racing. Sequencing remains flexible; do not let further feature work silently remove it from the roadmap.

## Next numbered system — Phase 9: Heat

Design and implement visible police pressure and underground risk/reward. Before coding, define which activities generate Heat, limits/decay, thresholds, fees or penalties, deterministic saved events and recovery options. Existing paid race snapshots and saves must stay valid. Do not silently add vehicle loss, random catastrophic destruction or bills to ordinary jobs. Player decisions and all costs must be explicit. No police system is implemented by the Market phase.

## Market and workshop browsing — implemented

The requested **manufacturer, model-year/range and body-type filters** now combine with text search and sorting in the Market. They use explicit catalog metadata, show counts and reset states, and never buy/sell/refresh by browsing. Source stock and price snapshots persist through reload and exports. The original other two starters are normally purchasable, not gifts. The shared catalog includes three new models. Garage expansion, auctions, negotiation, parts transfers and a live supply/demand simulation are not yet included.

The Workshop component categories remain implemented: visible buttons and a synchronized dropdown cover intake, exhaust, ECU, tires, suspension, brakes, weight reduction and turbo. New car models use compatible existing parts; the two turbo upgrades remain RZ-T-only. More categories require real slot/catalog support.

## Planned, not implemented

| Phase | Scope |
| --- | --- |
| Graphics & Audio I | Targeted first car/garage/race art, animation and audio pass. Open presentation milestone. |
| 9 — Heat | Police pressure and underground risk/reward without arbitrary save destruction. |
| 10 — Collection | Rarity separate from performance, Collection Book, achievements and Icon cars. |
| 11 — Advanced Cars | Auctions, imports, barn finds, restoration and more manufacturers; activate relevant Outer Kagehama content. |
| 12 — Empire & Automation | Businesses, garage upgrades, staff/crew, delegated routines, capped passive/offline income; activate relevant Industrial District content. |
| 13+ — Endgame | Legacy/Prestige, rivals, bosses, events and catalog expansion. |
| Further graphics expansion | Apply the chosen style to later content; plan visible paint/wheel/bodykit changes through a consistent asset system. |

## Automation later

Progression should move from earning the first yen personally to managing an automotive empire. Phase 12 is the principal milestone for passive businesses and staff/managers. Crew-dispatched repeatable work is a candidate; exact eligible jobs, unlocks, costs, collection rules and limits must be designed first. Offline earnings require eligibility, deterministic catch-up, a cap and duplicate-award protection. Automatic car/part purchases or destructive decisions are not implied.

Current jobs/races remain manually accepted and settled. Tab changes are not offline time or automation. A smaller early automation step may be proposed if playtesting shows excessive repetition, but no earlier phase/date is committed.

## Cross-phase quality

Readability, accessibility, mobile layout and balance improve throughout. HUD XP is existing cumulative REP, not an extra saved currency; cap and legacy-level behavior must remain defined. Future city restrictions beyond existing level gates must be enforced in the domain, not only hidden in the UI.

Car silhouettes, the district schematic and race replay remain provisional artwork. Pinning dependencies/committing a reproducible lockfile remain build-hardening work; the inherited `latest` policy is unchanged. Preserve all historical fixtures and the model-v1 algorithm for existing race snapshots. Client clocks/codes are user-controlled; local-save validation is not server anti-cheat. Planned items are not released features or promised dates.

## Working agreement

Inspect current repository → implement agreed scope → add regression tests → validate a clean phase-branch tree with unit tests, typecheck/build and browser scenarios → maintain README/roadmap/changelog/compatibility notes → publish a clear commit → verify the main Pages deployment. Never call a deployment live merely because a commit or run exists. Do not force-replace another contributor's work. Work continues in this chat with GitHub; no separate coding mode is required.
