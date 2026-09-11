# Development roadmap

Play: https://tlsnipz.github.io/Racing-Game/

Current implementation milestone: **Phase 6 — Racing**. Save schema: **v5**. The first starter → job → income → tuning → race → reward loop now exists.

## Implemented

| Phase | Scope |
| --- | --- |
| 0 — Foundation | React/TypeScript/Vite, dark Japan-inspired shell, starter catalog and navigation. |
| 1 — Core Game | ¥50,000, one confirmed choice among three starters and unique owned vehicles. |
| 2 — Persistence | Autosave, versioned envelope, portable KAGEHAMA1 export/import and confirmed reset. |
| 3 — Garage | Searchable/sortable vehicle cards, dossiers, condition, fitted parts, explicit active car and protected recovery. |
| 4 — Economy | Three timed jobs, manual claims, yen/rep/levels, assigned mileage, cancellation and receipts. |
| 5 — Interface & Tuning | 5A: sticky top HUD/navigation, isolated section tabs, keyboard access and job continuity. 5B: 14 parts/8 slots, per-car ownership, atomic fit/restore, derived stats, trade-offs and old-save migration. |
| 6 — Racing | Eight Rookie/Club events in four disciplines, deterministic sector simulation, three rivals, entry briefing/fees, compressed replay, one-time settlement, records and Save v5 migration. Visible workshop component-type categories. |

Current race results depend on the saved build and event, not random rerolls. One job OR race may be pending at a time. The assigned car remains locked for tuning until claim/settlement or cancellation/withdrawal. Race entry fees and gross/net prizes are explicit; a fee-free Level 1 sprint remains available. There is no vehicle loss, new wear, fuel, Heat, automation or final artwork in Phase 6. See [PHASE6.md](PHASE6.md) for the full contract; older milestone notes are historical.

## Next presentation milestone — Graphics & Audio I

After the first complete earning/tuning/racing loop, give a small representative slice its final visual direction: three consistent starter artworks, the first Japanese garage, one race environment, improved animation and audio feedback. Choose the vehicle-art/layer approach before promising independently changeable paint, wheels and bodykits. Keep gameplay/save contracts intact. This is a targeted pass, not a conversion to freely driven 3D racing and not a promise to finish every asset before city development. Exact sequencing can be refined after playtesting Phase 6.

## Next numbered system — Phase 7: Kagehama City

Implement a city overview with distinct districts, progression gates and links to their activities inside the existing shared tab shell. Resolve district membership and unlock conditions explicitly before implementation. Existing paid/active activities must remain recoverable; no silent reset or hidden entrance costs. The detailed map and new unlocks are not already in the current race board merely because its fictional events have place names.

## Planned, not implemented

| Phase | Scope |
| --- | --- |
| Graphics & Audio I | Three starter artworks, first garage/race setting, consistent presentation, animation and sound after the first full loop. |
| 7 — Kagehama | City map, districts, progression gates and their racing scenes. |
| 8 — Car Market | Individual used listings, buy/sell and value model; structured manufacturer/year/body-type metadata, category filters and sorting. Other starters become obtainable. |
| 9 — Heat | Police pressure and underground risk/reward without arbitrary save destruction. |
| 10 — Collection | Rarity separate from performance, Collection Book, achievements and Icon cars. |
| 11 — Advanced Cars | Auctions, imports, barn finds, restoration and more manufacturers. |
| 12 — Empire & Automation | Businesses, garage upgrades, staff/crew and unlockable delegated routines; passive/offline production with defined costs, balance and a cap. |
| 13+ — Endgame | Legacy/Prestige, rivals, bosses, events and catalog expansion. |
| Further graphics expansion | Apply the chosen style across later content; support visible paint/wheel/bodykit changes through a planned asset system. |

## Vehicle market filters — requested for Phase 8

The future vehicle shop must be filterable by **brand/manufacturer, model year (including a range) and vehicle/body type** such as hatchback, coupe or sedan. Use explicit catalog/listing metadata, not name-string parsing. Filters should combine, show result counts and offer a clear reset; sorting should include at least year and price. Preserve filter state across ordinary tab switches. Filtering must not buy/sell, alter a player's collection or refresh/reroll a listing. Price, drivetrain, mileage, condition and rarity are candidate additional filters where the catalog supports them. Mobile controls and keyboard access belong to the feature, not later cleanup.

The workshop's requested **component-type categorisation is implemented in Phase 6**: visible buttons and a synchronized dropdown for intake, exhaust, ECU, tires, suspension, brakes, weight reduction and turbo. Catalog counts and compatibility remain clear. Adding new component types later must extend the catalog/slot contract, not just add cosmetic headings.

## Later gameplay automation

Automation is progression, not endless manual claiming. Phase 12 is the principal milestone for passive businesses and staff/managers who handle recurring operations. Crew-dispatched repeatable work is a candidate routine; exact eligible jobs, unlocks, costs, collection rules and limits need design first. Offline earnings require eligibility, a cap, deterministic catch-up and duplicate-award protections. Automatic car purchases, tuning purchases or destructive decisions are not implied.

The goal is to move from personally earning the first yen to managing an automotive empire while keeping meaningful decisions about cars, builds, events and investments. Current jobs/races are single manually accepted and settled activities; changing sections is not going offline or unlocking automation. An earlier small automation step may be proposed if playtesting shows excessive repetition, but it has no committed phase/date.

## Cross-phase quality

Readability, accessibility, mobile layout and balance improve throughout development. Current car profiles and race presentation are placeholders for the later art pass. Pinning dependencies and committing a reproducible package lock remain build-hardening work; installs still inherit the original `latest` policy. Save compatibility must be tested before each schema change. Preserve the model-v1 race algorithm for old race snapshots when a new model arrives. Client clock/code manipulation is not prevented by a local-save architecture. Future numbers and priorities may change; planned entries are not available features or promised dates.

## Working agreement

Inspect the current repository → implement agreed scope → add regression tests → run unit tests, typecheck/build and browser scenarios → maintain README, roadmap, changelog and migration notes → publish a clear commit → verify the main Pages deployment. Feature branches are checked without deploying the game. Do not report a deployment as live merely because a commit or workflow exists. Keep frozen old-save fixtures and document migration behaviour. Work continues in this chat with GitHub; no separate coding mode is required.
