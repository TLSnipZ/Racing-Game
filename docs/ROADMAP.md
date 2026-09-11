# Development roadmap

Play: https://tlsnipz.github.io/Racing-Game/

Current implementation milestone: **Phase 3 — Garage**. Next: **Phase 4 — Economy**.

## Implemented

| Phase | Scope |
| --- | --- |
| 0 — Foundation | React/TypeScript/Vite, dark Japan-inspired design, starter catalog and navigation shell. |
| 1 — Core Game | ¥50,000, level/rep foundation, one confirmed starter purchase, unique vehicle instances. |
| 2 — Persistence | Local autosave, versioned envelope, KAGEHAMA1 export/import and confirmed reset. |
| 3 — Garage | Owned-vehicle cards, search/sort, profile/dossier, condition meters, fitted parts, explicit active car, v1→v2 migration, storage-failure/recovery handling and browser tests. |

## Next — Phase 4: Economy

Implement small starter jobs, yen rewards, reputation and early level progression. Jobs must create a repeatable first gameplay loop without changing starter prices or silently invalidating saves. Actions need clear prerequisites, results, repeat/abuse protections appropriate to the chosen timing model, pure domain commands and tests. Final reward amounts and timing are not yet locked.

Definition of done: playable on Pages; state survives reload/export/import; invalid actions do not award money; tests/build pass; README, roadmap, changelog and migration notes are current.

## Planned, not implemented

| Phase | Scope |
| --- | --- |
| 5 — Tuning | Parts catalog, installation, stats, trade-offs and fictional part brands. |
| 6 — Racing | Simulated Touge, Drag, Street Sprint and Expressway events; discipline-specific builds. |
| 7 — Kagehama | City map, districts, progression gates and different racing scenes. |
| 8 — Car Market | Used listings, unique examples, buy/sell, value model; other starter cars become obtainable. |
| 9 — Heat | Police pressure, risk/reward and underground events without arbitrary save destruction. |
| 10 — Collection | Rarities distinct from performance, Collection Book, achievements and Icon cars. |
| 11 — Advanced Cars | Auctions, imports, barn finds, restoration and more manufacturers. |
| 12 — Empire | Businesses, garage upgrades, staff/crew; offline production only with a defined economy/cap. |
| 13+ — Endgame | Legacy/Prestige, rivals, bosses, events and vehicle-catalog expansion. |

## Cross-phase work

Final consistent vehicle/garage artwork is a later content pass. Current profiles are placeholders. Pinning dependencies and committing a reproducible package lock remain build-hardening work; current installs inherit the original `latest` dependency policy. Save compatibility must be tested before every schema change. Future content numbers, balance and priorities can change; this document is not a promise of dates or already-available features.

## Working agreement

For each phase: inspect current repository → implement only the agreed scope → add regression tests → run tests and build → update README/roadmap/changelog → commit → verify the Pages workflow. Do not report a deployment as live just because a commit or workflow was created. Keep old-save fixtures and list migration behaviour explicitly. Work continues in the chat with GitHub; a separate coding mode is not required.
