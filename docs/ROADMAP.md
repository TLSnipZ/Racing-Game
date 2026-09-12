# Development roadmap

Play: https://tlsnipz.github.io/Racing-Game/

Current milestone: **Phase 11 — Advanced Cars**. **Save v9.** The complete starter → job → tuning → race → reward loop now includes multiple cars, individual saved dealer stock and explicit buy/sell transactions.

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
| 9 — Heat & Police | Driver-global Heat HUD; optional Underground stakes on seven paid events, frozen bonus/Heat/fine terms, deterministic patrol decisions, legal-job recovery and free timed Lay low; Save v7 preserves every prior field. |
| 10 — Collection | Eight-model Collection Book, Common/Rare/Legendary/Icon metadata independent of performance, 18 persistent achievements with manual one-time yen rewards, two gated fixed-price Icon offers and Save v8 evidence-based migration. |
| 11 — Advanced Cars | Three curated import/auction/barn sources, paid escrow/refunds and reserved delivery slots, exact timed contracts, Level-2 condition restoration, three new models, active Outer Kagehama and Save v9 preserving all previous fields. |

Phase 8 preserves race model v1, level thresholds, original starter prices, original build ratings and all job/part/race rewards. The shared catalog adds three new models with their own ratings. See [PHASE8.md](PHASE8.md) for exact market, ownership and migration rules. Previous milestones remain documented historical contracts.

Phase 7 did not change race model v1, old saves, level thresholds, starter prices or job/part/race rewards. District browsing is not travel and does not grant money or start activities. The active job/race remains recoverable even through an unrelated or locked-district preview. See [PHASE7.md](PHASE7.md); previous contracts remain historical records of their milestones.

## Open presentation milestone — Graphics & Audio I

The first complete loop makes a focused art/audio pass possible. **This remains open, not completed by Phase 7, Phase 8, Phase 9, Phase 10 or Phase 11.** City, Market, Heat, Collection and Advanced Cars were implemented as numbered systems before this separate presentation milestone; the map and car profiles remain functional placeholders. No final car/garage images or audio have been silently substituted or marked done.

Scope remains three consistent starter artworks, the first Japanese garage, one race environment, improved animation and audio feedback. Define an asset/layer strategy before promising independently changeable paint, wheels and bodykits. Preserve gameplay and saves. This is a targeted pass, not conversion into freely driven 3D racing. Sequencing remains flexible; do not let further feature work silently remove it from the roadmap.

## Phase 9 — implemented risk contract

Standard races and ordinary jobs retain their original terms. Optional Level-3+ Underground stakes on the seven paid events add +50% yen/+25% REP and 12–22 Heat on entry, with a pre-announced deterministic patrol alert at projected 50/75 Heat. Resolve it by paying the shown ¥1,500/¥3,000 fine or waiting through a free 60-second Lay low pause. Fine reduction is 30 Heat; completed Lay low removes 40; legal job claims remove up to 6. No passive decay, surprise car loss, new wear, forced debt or automatic fines. At 85+ Heat, recover before a new Underground run. See [PHASE9.md](PHASE9.md).

## Phase 10 — implemented collection contract

Collection credit means ever owned, not just seen. Duplicates count once per model; sale does not remove a recorded entry or an earned badge. Eighteen achievement rewards are claimed once manually, never silently paid on load. Old saves recognise only provable criteria from retained models/counters/parts. The new shared pure transition observer records relevant before/after command state, including before destructive sales/refits. See [PHASE10.md](PHASE10.md).

The eight-model book includes two new milestone-only Icons: Tora 85 Heritage (Level 6 + starter trio, ¥180,000) and Kestrel GT (Level 8 + four completed race disciplines, ¥320,000). These are fixed, once-per-save purchases, not gifts or dealer refresh results. The six existing used-market offers, pending races/Heat, original balance and factory values stay unchanged. Rarity never multiplies performance or the valuation formula.

## Phase 11 — implemented first specialist slice

Market now separates dealer, imports, auctions and barn leads. Import a fixed Sora S for ¥180,000 over 90 seconds; participate in a disclosed-ceiling 60-second proxy auction for Crest RS with reserved maximum-bid funds, exact clearing/refund and no hidden bids; commission the ¥5,000 / 45-second Old Orchard survey and optionally recover the worn Hachi GT for ¥55,000. Each source supplies one car per save, including after sale. Full terms: [PHASE11.md](PHASE11.md).

Pending imports/auctions reserve a space across all acquisition routes. Broker work is independent of driver jobs/races, never an automatic earning chain. Level-2 Workshop restoration repairs selected condition to 100% with an explicit before/after quote, preserving tuning, mileage and originality and blocking assigned cars. Collection history, old dealer stock, accepted race/Heat contracts and all claimed rewards remain intact. The initial specialist system has three curated sources; additional lots/imports/leads and richer opponent bidding are later extensions, not already implemented.

## Next numbered system — Phase 12: Empire & Automation

Design the first businesses, expandable garage and delegated routines. Define purchase costs, unlocks, upgrade returns, manager prerequisites, manual versus automatic collection, offline cap and exact-once accrual before adding passive earnings. Specialist escrow and reserved delivery spaces must survive a garage-capacity expansion. Ongoing driver and broker activities must not be replaced, repriced or completed by unrelated business commands.

Start with a small playable business/manager loop, not a claim that all crew/endgame systems already exist. Save migration must preserve current cars, condition repairs, specialist contracts, sources, achievement claims, market stock and Heat snapshots. Balance active racing/work against passive returns. Readability, mobile navigation and the open Graphics & Audio I milestone remain part of the plan.

## Market and workshop browsing — implemented

The requested **manufacturer, model-year/range and body-type filters** now combine with text search and sorting in the Market. They use explicit catalog metadata, show counts and reset states, and never buy/sell/refresh by browsing. Source stock and price snapshots persist through reload and exports. The original other two starters are normally purchasable, not gifts. The shared catalog includes three new models. Garage expansion, negotiation, separate parts transfers and a live supply/demand simulation are not yet included. The first fixed specialist auction/import/barn sources and restoration are now implemented separately.

The Workshop component categories remain implemented: visible buttons and a synchronized dropdown cover intake, exhaust, ECU, tires, suspension, brakes, weight reduction and turbo. New car models use compatible existing parts; the two turbo upgrades remain RZ-T-only. More categories require real slot/catalog support.

## Planned, not implemented

| Phase | Scope |
| --- | --- |
| Graphics & Audio I | Targeted first car/garage/race art, animation and audio pass. Open presentation milestone. |
| 12 — Empire & Automation | Businesses, garage upgrades, staff/crew, delegated routines, capped passive/offline income; activate relevant Industrial District content. |
| 13+ — Endgame | Legacy/Prestige, rivals, bosses, events and catalog expansion. |
| Further graphics expansion | Apply the chosen style to later content; plan visible paint/wheel/bodykit changes through a consistent asset system. |

## Automation later

Progression should move from earning the first yen personally to managing an automotive empire. Phase 12 is the principal milestone for passive businesses and staff/managers. Crew-dispatched repeatable work is a candidate; exact eligible jobs, unlocks, costs, collection rules and limits must be designed first. Offline earnings require eligibility, deterministic catch-up, a cap and duplicate-award protection. Automatic car/part purchases or destructive decisions are not implied.

Current jobs/races remain manually accepted and settled. Lay low is also manually started/completed and is recovery, not production automation. Tab changes are not offline time or automation. A smaller early automation step may be proposed if playtesting shows excessive repetition, but no earlier phase/date is committed.

## Cross-phase quality

Readability, accessibility, mobile layout and balance improve throughout. HUD XP is existing cumulative REP, not an extra saved currency; cap and legacy-level behavior must remain defined. Future city restrictions beyond existing level gates must be enforced in the domain, not only hidden in the UI.

Car silhouettes, the district schematic and race replay remain provisional artwork. Pinning dependencies/committing a reproducible lockfile remain build-hardening work; the inherited `latest` policy is unchanged. Preserve all historical fixtures and the model-v1 algorithm for existing race snapshots. Client clocks/codes are user-controlled; local-save validation is not server anti-cheat. Planned items are not released features or promised dates.

## Working agreement

Inspect current repository → implement agreed scope → add regression tests → validate a clean phase-branch tree with unit tests, typecheck/build and browser scenarios → maintain README/roadmap/changelog/compatibility notes → publish a clear commit → verify the main Pages deployment. Never call a deployment live merely because a commit or run exists. Do not force-replace another contributor's work. Work continues in this chat with GitHub; no separate coding mode is required.
