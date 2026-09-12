# Development roadmap

Play: https://tlsnipz.github.io/Racing-Game/

Current milestone: **Phase 12 — Empire & Automation**. **Save v10.** The complete starter → job → tuning → race → reward loop now includes multiple cars, individual saved dealer stock and explicit buy/sell transactions.

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
| 12 — Empire & Automation | Three businesses with one-batch staff and permanent managers, repeated production into eight-hour tills, explicit collection, Levels 1–5, garage expansions 12→18→24→36, active Industrial District and Save v10 with no retrospective income. |

Phase 8 preserves race model v1, level thresholds, original starter prices, original build ratings and all job/part/race rewards. The shared catalog adds three new models with their own ratings. See [PHASE8.md](PHASE8.md) for exact market, ownership and migration rules. Previous milestones remain documented historical contracts.

Phase 7 did not change race model v1, old saves, level thresholds, starter prices or job/part/race rewards. District browsing is not travel and does not grant money or start activities. The active job/race remains recoverable even through an unrelated or locked-district preview. See [PHASE7.md](PHASE7.md); previous contracts remain historical records of their milestones.

## Open presentation milestone — Graphics & Audio I

The first complete loop makes a focused art/audio pass possible. **This remains open, not completed by Phase 7, Phase 8, Phase 9, Phase 10, Phase 11 or Phase 12.** City, Market, Heat, Collection, Advanced Cars and Empire were implemented as numbered systems before this separate presentation milestone; the map and car profiles remain functional placeholders. No final car/garage images or audio have been silently substituted or marked done.

Scope remains three consistent starter artworks, the first Japanese garage, one race environment, improved animation and audio feedback. Define an asset/layer strategy before promising independently changeable paint, wheels and bodykits. Preserve gameplay and saves. This is a targeted pass, not conversion into freely driven 3D racing. Sequencing remains flexible; do not let further feature work silently remove it from the roadmap.

## Phase 9 — implemented risk contract

Standard races and ordinary jobs retain their original terms. Optional Level-3+ Underground stakes on the seven paid events add +50% yen/+25% REP and 12–22 Heat on entry, with a pre-announced deterministic patrol alert at projected 50/75 Heat. Resolve it by paying the shown ¥1,500/¥3,000 fine or waiting through a free 60-second Lay low pause. Fine reduction is 30 Heat; completed Lay low removes 40; legal job claims remove up to 6. No passive decay, surprise car loss, new wear, forced debt or automatic fines. At 85+ Heat, recover before a new Underground run. See [PHASE9.md](PHASE9.md).

## Phase 10 — implemented collection contract

Collection credit means ever owned, not just seen. Duplicates count once per model; sale does not remove a recorded entry or an earned badge. Eighteen achievement rewards are claimed once manually, never silently paid on load. Old saves recognise only provable criteria from retained models/counters/parts. The new shared pure transition observer records relevant before/after command state, including before destructive sales/refits. See [PHASE10.md](PHASE10.md).

The eight-model book includes two new milestone-only Icons: Tora 85 Heritage (Level 6 + starter trio, ¥180,000) and Kestrel GT (Level 8 + four completed race disciplines, ¥320,000). These are fixed, once-per-save purchases, not gifts or dealer refresh results. The six existing used-market offers, pending races/Heat, original balance and factory values stay unchanged. Rarity never multiplies performance or the valuation formula.

## Phase 11 — implemented first specialist slice

Market now separates dealer, imports, auctions and barn leads. Import a fixed Sora S for ¥180,000 over 90 seconds; participate in a disclosed-ceiling 60-second proxy auction for Crest RS with reserved maximum-bid funds, exact clearing/refund and no hidden bids; commission the ¥5,000 / 45-second Old Orchard survey and optionally recover the worn Hachi GT for ¥55,000. Each source supplies one car per save, including after sale. Full terms: [PHASE11.md](PHASE11.md).

Pending imports/auctions reserve a space across all acquisition routes. Broker work is independent of driver jobs/races, never an automatic earning chain. Level-2 Workshop restoration repairs selected condition to 100% with an explicit before/after quote, preserving tuning, mileage and originality and blocking assigned cars. Collection history, old dealer stock, accepted race/Heat contracts and all claimed rewards remain intact. The initial specialist system has three curated sources; additional lots/imports/leads and richer opponent bidding are later extensions, not already implemented.

## Phase 12 — implemented first Empire slice

Three businesses open at Levels 3/5/7: East Ward Detail, Bayline Parts Supply and Midnight Dyno Works. Buy once, manually dispatch one booking, then hire Rei/Jun/Nao to repeat bookings automatically. Operating staff are included; no recurring bills or wages. Completed profit sits in a per-business till, not cash. Individual or collect-all actions move it to the wallet exactly once after successful storage. See [PHASE12.md](PHASE12.md) for prices, upgrades and rules v1.

Managed storage is capped at eight hours of current-level output in total, online and offline combined; unmanaged storage holds one batch. Extra waiting after full is discarded. Reloads, saves, exports and unrelated gameplay never restart the allowance. Pausing preserves completed yen and discards unfinished batch time, explicitly disclosed. Upgrade only while stopped; past money is not multiplied. Managed repeat production does not occupy or complete driver/broker activities and gives no REP or Heat reduction.

Permanent sequential garage expansions increase 12 spaces to 18/24/36 for ¥75,000/¥180,000/¥400,000 at Levels 4/6/8. Existing specialist reservations count against the expanded capacity across all acquisition routes. No old cars or escrow are lost. Industrial District opens at Level 3 and links to Empire's Businesses/Staff/Garage subviews; XP/Heat remain in the shared sticky HUD.

## Next numbered milestone — Phase 13+: Endgame

Before implementing a reset-based Legacy/Prestige loop, define exactly what persists, what resets, entry requirements, rewards, claim rules and a confirmation/export recovery path. Accepted paid races, specialist escrow, Icon entitlements, collection history, managers and garage investments need explicit treatment. No automatic reset or unexplained loss of property is authorized merely by reaching a threshold.

Start with a bounded playable endgame goal/rival milestone and a documented progression model rather than claiming all bosses, seasonal events and an expanded catalog exist. Higher-level balance should account for capped managed profit and player-controlled business upgrades. Keep historical saved economy/race/Heat contracts stable or provide tested version migrations. More crew systems and richer businesses remain extensions. **Graphics & Audio I is still a separate open milestone and must not disappear behind the numbered systems.**

## Market and workshop browsing — implemented

The requested **manufacturer, model-year/range and body-type filters** now combine with text search and sorting in the Market. They use explicit catalog metadata, show counts and reset states, and never buy/sell/refresh by browsing. Source stock and price snapshots persist through reload and exports. The original other two starters are normally purchasable, not gifts. The shared catalog includes three new models. Garage expansion is now implemented in Empire; negotiation, separate parts transfers and a live supply/demand simulation remain later work. The first fixed specialist auction/import/barn sources and restoration are now implemented separately.

The Workshop component categories remain implemented: visible buttons and a synchronized dropdown cover intake, exhaust, ECU, tires, suspension, brakes, weight reduction and turbo. New car models use compatible existing parts; the two turbo upgrades remain RZ-T-only. More categories require real slot/catalog support.

## Planned, not implemented

| Phase | Scope |
| --- | --- |
| Graphics & Audio I | Targeted first car/garage/race art, animation and audio pass. Open presentation milestone. |
| 13+ — Endgame | Legacy/Prestige, rivals, bosses, events and catalog expansion. |
| Further graphics expansion | Apply the chosen style to later content; plan visible paint/wheel/bodykit changes through a consistent asset system. |

## Automation: implemented versus future

The first progression step from doing every task personally to owning staff-run businesses is now playable. Managers permanently assigned to the three owned businesses repeat customer bookings into capped tills. The player collects earnings manually; no automatic spending, property sales, racing, police resolution or daily bills occur. Offline catch-up is deterministic, bounded and protected against duplicate claims under normal play.

Crew-dispatched personal jobs, configurable crews, passive stat modifiers, more businesses, automatic wallet transfers and server-based economies have **not** been implemented. Current personal jobs/races and Lay low remain explicitly accepted/completed; specialist contracts also keep manual resolution. Future delegation needs separate requirements, costs, car locks and limits before it can reuse those systems. A running manager is not permission to control unrelated player activities.

## Cross-phase quality

Readability, accessibility, mobile layout and balance improve throughout. Production rules v1 keep their timing/output contract; future balance changes require versioned rules or an explicit migration, not silently multiplying already-earned money. Banked profit, current partial batches, cap overflow and clock rollback require regression tests. HUD XP is existing cumulative REP, not an extra saved currency; cap and legacy-level behavior must remain defined. Future city restrictions beyond existing level gates must be enforced in the domain, not only hidden in the UI.

Car silhouettes, the district schematic and race replay remain provisional artwork. Pinning dependencies/committing a reproducible lockfile remain build-hardening work; the inherited `latest` policy is unchanged. Preserve all historical fixtures and the model-v1 algorithm for existing race snapshots. Client clocks/codes are user-controlled; local-save validation is not server anti-cheat. Planned items are not released features or promised dates.

## Working agreement

Inspect current repository → implement agreed scope → add regression tests → validate a clean phase-branch tree with unit tests, typecheck/build and browser scenarios → maintain README/roadmap/changelog/compatibility notes → publish a clear commit → verify the main Pages deployment. Never call a deployment live merely because a commit or run exists. Do not force-replace another contributor's work. Work continues in this chat with GitHub; no separate coding mode is required.
