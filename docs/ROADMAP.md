# Development roadmap

Play: https://tlsnipz.github.io/Racing-Game/

Current implementation milestone: **Phase 4 — Economy**. Next: **Phase 5 — Tuning**.

## Implemented

| Phase | Scope |
| --- | --- |
| 0 — Foundation | React/TypeScript/Vite, dark Japan-inspired design, starter catalog and navigation shell. |
| 1 — Core Game | ¥50,000, level/rep foundation, one confirmed starter purchase, unique vehicle instances. |
| 2 — Persistence | Local autosave, versioned envelope, KAGEHAMA1 export/import and confirmed reset. |
| 3 — Garage | Owned-vehicle cards, search/sort, dossier, condition meters, fitted parts, explicit active car, v1→v2 migration, storage-failure/recovery handling and browser tests. |
| 4 — Economy | Three timed jobs with level gates, manual one-time claims, yen/rep, level progression, assigned-car mileage, cancellation, receipts, job statistics and v1/v2→v3 migration. |

Phase 4 deliberately excludes tuning, races, fuel/damage, police, additional vehicle acquisition and passive businesses. One accepted job may become ready while the page is closed; this is not automated offline production. See [PHASE4.md](PHASE4.md) for exact timers, rewards, progression and limitations.

## Next — Phase 5: Tuning

Implement the first purchasable performance parts, a compatibility-aware install flow, derived vehicle stats and explicit trade-offs. Preserve factory/catalog identity separately from modifications. Costs should give the new job income useful short-term goals without turning one starter into the only sensible choice. Define initial fictional part brands and prepare discipline-specific builds for racing. Final part counts, prices, modifiers and slot rules must be specified before implementation; no engine-swap system is promised in this first tuning pass.

Definition of done: playable on Pages; buying/installing cannot double-charge or exceed money; invalid or incompatible actions leave state unchanged; changes survive reload/export/import; legacy saves migrate; tests/build/browser checks pass; README, roadmap, changelog and migration notes are current.

## Planned, not implemented

| Phase | Scope |
| --- | --- |
| 5 — Tuning | Parts catalog, installation, stats, trade-offs and fictional part brands. |
| 6 — Racing | Simulated Touge, Drag, Street Sprint and Expressway events; discipline-specific builds. |
| Graphics & Audio I | Targeted pass after the first complete job→tuning→race loop: three starter artworks, first garage/race environment, animation and effects. Exact timing is flexible. |
| 7 — Kagehama | City map, districts, progression gates and different racing scenes. |
| 8 — Car Market | Used listings, unique examples, buy/sell, value model; other starter cars become obtainable. |
| 9 — Heat | Police pressure, risk/reward and underground events without arbitrary save destruction. |
| 10 — Collection | Rarities distinct from performance, Collection Book, achievements and Icon cars. |
| 11 — Advanced Cars | Auctions, imports, barn finds, restoration and more manufacturers. |
| 12 — Empire | Businesses, garage upgrades, staff/crew; offline production only with a defined economy/cap. |
| 13+ — Endgame | Legacy/Prestige, rivals, bosses, events and vehicle-catalog expansion. |
| Further graphics expansion | Apply the chosen visual style to later content and plan visible paint/wheel/bodykit changes rather than producing incompatible one-off images. |

## Cross-phase work

Current vehicle profiles are placeholders. Readability, accessibility, mobile layout and balance improve throughout development, not only in the final graphics pass. Pinning dependencies and committing a reproducible package lock remain build-hardening work; installs still inherit the original `latest` dependency policy. Save compatibility must be tested before every schema change. Client clock/code manipulation is not prevented by the local-save architecture. Future content numbers, balance and priorities can change; this is not a promise of dates or already-available features.

## Working agreement

For each phase: inspect current repository → implement only the agreed scope → add regression tests → run tests and build → update README/roadmap/changelog → commit → verify the Pages workflow. Do not report a deployment as live merely because a commit or workflow was created. Keep old-save fixtures and list migration behaviour explicitly. Work continues in the chat with GitHub; a separate coding mode is not required.
