# Development roadmap

Play: https://tlsnipz.github.io/Racing-Game/

Current implementation milestone: **Phase 4 — Economy**. Next: **Phase 5 — Interface & Tuning**.

## Implemented

| Phase | Scope |
| --- | --- |
| 0 — Foundation | React/TypeScript/Vite, dark Japan-inspired design, starter catalog and navigation shell. |
| 1 — Core Game | ¥50,000, level/rep foundation, one confirmed starter purchase, unique vehicle instances. |
| 2 — Persistence | Local autosave, versioned envelope, KAGEHAMA1 export/import and confirmed reset. |
| 3 — Garage | Owned-vehicle cards, search/sort, dossier, condition meters, fitted parts, explicit active car, v1→v2 migration, storage-failure/recovery handling and browser tests. |
| 4 — Economy | Three timed jobs with level gates, manual one-time claims, yen/rep, level progression, assigned-car mileage, cancellation, receipts, job statistics and v1/v2→v3 migration. |

Phase 4 deliberately excludes tuning, races, fuel/damage, police, additional vehicle acquisition and passive businesses. One accepted job may become ready while the page is closed; this is not automated offline production. See [PHASE4.md](PHASE4.md) for exact timers, rewards, progression and limitations.

## Next — Phase 5: Interface & Tuning

The next milestone includes the requested navigation/HUD redesign alongside the first tuning system. Implement the shared interface first (5A), then the workshop (5B). These are subdivisions of Phase 5, not a renumbering of later phases. All items below are planned, not already present in the live Phase 4 build.

### 5A — Persistent HUD and real section tabs

- Replace the bottom anchor-link navigation with a more prominent navigation bar at the top, directly below a compact global HUD. Use readable labels/icons, clear selected styling and visible disabled states for unimplemented sections.
- Keep cash, player level and reputation visible at the top while scrolling and in every section. The top navigation also remains available. Use an opaque/readable background and sufficient content offset; do not cover controls or let a large logo consume the mobile viewport.
- Show one actual content section at a time: Garage, Jobs, Workshop and Saves as they become available. City and Races stay clearly unavailable until their scheduled implementation. Selecting Jobs must replace the garage panel, not scroll down a single long page. This means in-game tabs, not opening additional browser tabs.
- Keep the game session, storage boundary and job deadlines outside the section views. Changing views must not reset or pause a job, restart its timer, award/lose rewards, alter the active vehicle, charge money or reload the whole application. Return to the same pending contract with its original deadline.
- Show a small ready-to-claim indicator on Jobs when appropriate, without automatic claiming. Save/storage errors remain visible globally, with access to the recovery and save-management tools from any section, including before starter selection.
- Preserve useful local view state such as garage inspection/search where practical. Implement keyboard-accessible navigation, selected-state semantics and logical focus handling. Inactive panels must not remain interactable beneath the visible section.
- Keep the layout usable on desktop and mobile. Narrow screens may scroll the navigation row horizontally, but cash/level/rep must remain visible and the whole page must not overflow horizontally.

### 5B — First performance-parts workshop

Implement the first purchasable performance parts, a compatibility-aware install flow, derived vehicle stats and explicit trade-offs. Preserve factory/catalog identity separately from modifications. Costs should give the new job income useful short-term goals without turning one starter into the only sensible choice. Define initial fictional part brands and prepare discipline-specific builds for racing. The workshop uses its own section inside the new shared interface.

Final part counts, prices, modifiers and slot rules must be specified before implementation; no engine-swap system is promised in this first tuning pass. Automation and final vehicle artwork are not added merely by this interface change.

### Acceptance and compatibility

Playable on Pages; only the selected section is shown; HUD/navigation remain visible during desktop/mobile scrolling; keyboard navigation works; an accepted job can finish while another section is open and can be claimed exactly once after returning. Tab switches must preserve cash, active car and pending-job data. Buying/installing cannot double-charge or exceed available money; invalid or incompatible actions leave state unchanged. Changes survive reload/export/import and legacy saves migrate. Navigation alone does not require resetting progress or changing the save schema; add a tested migration if new tuning data changes that schema. Update browser tests to navigate via real tabs instead of relying on all panels being present simultaneously. Tests/build/browser checks must pass and README, roadmap, changelog and migration notes must be current before release.

## Planned, not implemented

| Phase | Scope |
| --- | --- |
| 5 — Interface & Tuning | 5A: prominent top navigation, separate section tabs and persistent cash/level/rep HUD. 5B: parts catalog, installation, derived stats, trade-offs and fictional part brands. |
| 6 — Racing | Simulated Touge, Drag, Street Sprint and Expressway events; discipline-specific builds. |
| Graphics & Audio I | Targeted pass after the first complete job→tuning→race loop: three starter artworks, first garage/race environment, animation and effects. Exact timing is flexible. |
| 7 — Kagehama | City map, districts, progression gates and different racing scenes. |
| 8 — Car Market | Used listings, unique examples, buy/sell, value model; other starter cars become obtainable. |
| 9 — Heat | Police pressure, risk/reward and underground events without arbitrary save destruction. |
| 10 — Collection | Rarities distinct from performance, Collection Book, achievements and Icon cars. |
| 11 — Advanced Cars | Auctions, imports, barn finds, restoration and more manufacturers. |
| 12 — Empire & Automation | Businesses, garage upgrades, staff/crew and unlockable delegated routines; passive/offline production only with defined costs, balance and a cap. |
| 13+ — Endgame | Legacy/Prestige, rivals, bosses, events and vehicle-catalog expansion. |
| Further graphics expansion | Apply the chosen visual style to later content and plan visible paint/wheel/bodykit changes rather than producing incompatible one-off images. |

## Later gameplay automation

Automation belongs to progression, not endless manual job claiming. Phase 12 is the main milestone for businesses with passive income and staff/managers who handle recurring operations. Crew-dispatched repeatable work is a candidate routine; its exact eligible jobs, unlocks, costs, collection rules and limits must be designed before implementation. Offline earnings need explicit eligibility, a cap, deterministic catch-up and duplicate-award protections. No automatic car purchases, tuning purchases or destructive decisions are implied.

The goal is to move from personally earning the first yen to managing an automotive empire while retaining meaningful choices about cars, builds, events and investments. The live Phase 4 job system still allows one manually accepted and claimed contract. Changing an in-game tab will not mean the player went offline or unlocked automation. A smaller automation milestone may be proposed earlier if playtesting shows excessive repetitive work, but no earlier date or phase is committed yet.

## Cross-phase work

Current vehicle profiles are placeholders. Readability, accessibility, mobile layout and balance improve throughout development, not only in the final graphics pass. Pinning dependencies and committing a reproducible package lock remain build-hardening work; installs still inherit the original `latest` dependency policy. Save compatibility must be tested before every schema change. Client clock/code manipulation is not prevented by the local-save architecture. Future content numbers, balance and priorities can change; this is not a promise of dates or already-available features.

## Working agreement

For each phase: inspect current repository → implement only the agreed scope → add regression tests → run tests and build → update README/roadmap/changelog → commit → verify the Pages workflow. Do not report a deployment as live merely because a commit or workflow was created. Keep old-save fixtures and list migration behaviour explicitly. Work continues in the chat with GitHub; a separate coding mode is not required.
