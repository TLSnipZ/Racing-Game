# Development roadmap

Play: https://tlsnipz.github.io/Racing-Game/

Current implementation milestone: **Phase 5 — Interface & Tuning**. Save v4. Next: **Phase 6 — Racing**.

## Implemented

| Phase | Scope |
| --- | --- |
| 0 — Foundation | React/TypeScript/Vite, dark Japan-inspired design, starter catalog and navigation shell. |
| 1 — Core Game | ¥50,000, level/rep foundation, one starter purchase and unique vehicle instances. |
| 2 — Persistence | Local autosave, versioned envelope, KAGEHAMA1 export/import and confirmed reset. |
| 3 — Garage | Cards, search/sort, dossiers, condition meters, active car, save recovery and browser tests. |
| 4 — Economy | Three timed jobs, one-time claims, yen/rep, levels, assigned-car mileage, cancellation and receipts. |
| 5A — Shared interface | Persistent top cash/level/rep HUD and prominent tab navigation. One visible section; hidden panels retain useful local state. Keyboard navigation, job-ready badge and global save recovery. |
| 5B — First workshop | Fourteen parts, eight slots, three brands, per-car ownership, buy-and-fit preview, free refit/stock restoration, derived stats and v1/v2/v3→v4 migration. |

5A and 5B are subdivisions of Phase 5; later phase numbers are unchanged. See [PHASE5.md](PHASE5.md) for exact part rules, balance, compatibility and verification requirements.

## Next — Phase 6: Racing

Create the first simulated race loop, using derived tuned-car stats rather than catalog horsepower alone. Target disciplines remain Touge, Drag, Street Sprint and Expressway. Specify the initial event/opponent catalog, prerequisites, fees/rewards, randomness/determinism and results before implementation. An explicit assigned vehicle/build snapshot should keep results stable, and rewards must be claimed/settled once. Avoid conflicts with delivery jobs and prevent tuning a car during a race. Do not invent fuel, wear, damage, police or loss of vehicles as hidden costs.

Integrate a real Races tab inside the existing shell; the shared HUD and saved jobs continue working. The first end-to-end goal is starter → job → parts → race → reward. Ratings introduced in Phase 5 are provisional inputs to balance, not a promise of an exact physical simulation.

Definition of done: usable on Pages; event outcomes and reward rules documented; invalid actions do not charge or pay; reload/export/import preserve in-progress state as designed; old fixtures migrate; unit/build/browser tests pass; README, roadmap, changelog and compatibility notes are current. Final scope and numbers are not locked yet.

## Planned, not implemented

| Phase | Scope |
| --- | --- |
| 6 — Racing | Simulated Touge, Drag, Street Sprint and Expressway events; discipline-specific builds. |
| Graphics & Audio I | Three starter artworks, first garage/race environment, animation and effects after a complete initial gameplay loop. Exact timing stays flexible. |
| 7 — Kagehama | City map, districts, gates and different racing scenes. |
| 8 — Car Market | Used listings, unique cars, buy/sell and value model; other starter cars become obtainable. |
| 9 — Heat | Police pressure and underground risk/reward without arbitrary save destruction. |
| 10 — Collection | Rarities distinct from performance, Collection Book, achievements and Icon cars. |
| 11 — Advanced Cars | Auctions, imports, barn finds, restoration and more manufacturers. |
| 12 — Empire & Automation | Businesses, garage upgrades, staff/crew and unlockable delegated routines; passive/offline production with defined costs, balance and caps. |
| 13+ — Endgame | Legacy/Prestige, rivals, bosses, events and catalog expansion. |
| Further graphics expansion | Apply the chosen style to new content; plan visible paint/wheel/bodykit changes before producing incompatible images. |

## Automation later

The goal is to move from earning your first yen personally to managing an automotive empire. Phase 12 is the main milestone for passive businesses and staff-managed routines. Crew-dispatched repeatable work is a candidate: eligible jobs, unlocks, costs, collection rules and limits still need design. Offline earnings require defined eligibility, deterministic catch-up, a cap and duplicate-award protection. No automatic car/part purchases or destructive decisions are implied.

Current jobs remain manual. Switching a game section does not count as going offline and does not introduce automation. A smaller earlier automation milestone can be proposed if playtesting reveals excessive repetition, but no earlier phase/date is committed.

## Cross-phase work

Final graphics/audio, repairs, part transfers/resale and engine swaps are not included in Phase 5. Vehicle silhouettes remain placeholders. Readability, accessibility, mobile layout and balance improve throughout. Full screen-reader/device coverage remains broader than the automated Chromium checks. A production lockfile and pinned dependencies remain build-hardening work; the inherited `latest` policy is unchanged in this phase. Client clock/code manipulation is not prevented by local saves.

## Working agreement

Inspect the current repository → implement agreed scope → add regression tests → validate on a phase branch → update README/roadmap/changelog/compatibility notes → commit → verify Pages deployment. Never call a deployment live just because a commit or run exists. Keep historical fixtures unchanged. Only update main after a tested tree is ready; do not force-replace someone else's commits. Work continues in this chat with GitHub; no separate coding mode is required.
