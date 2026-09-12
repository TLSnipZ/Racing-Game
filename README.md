# KAGEHAMA — Underground Car Empire

**[🎮 PLAY KAGEHAMA IN YOUR BROWSER](https://tlsnipz.github.io/Racing-Game/)**

A pre-alpha car-collection, street-racing and automotive-empire game set in a fictional Japanese coastal city.

> Modern Japan × JDM culture × touge × expressway × car collecting × tycoon.

**Current milestone: Phase 13A — Rival Crews & Bosses** · **Save schema: v10 (unchanged)** · **Next presentation milestone: Graphics & Audio I**

**Graphics & Audio I remains an open, separate presentation milestone.** The district map, car profiles and race replay are functional placeholders, not final artwork.

[Roadmap](docs/ROADMAP.md) · [Changelog](CHANGELOG.md) · [Rival chapter & saves](docs/PHASE13A.md) · [Empire](docs/PHASE12.md) · [Advanced cars](docs/PHASE11.md) · [Collection](docs/PHASE10.md) · [Heat](docs/PHASE9.md) · [Market](docs/PHASE8.md) · [City & XP](docs/PHASE7.md) · [Racing](docs/PHASE6.md) · [Tuning](docs/PHASE5.md) · [Economy](docs/PHASE4.md) · [Garage](docs/PHASE3.md) · [Build/deployment](https://github.com/TLSnipZ/Racing-Game/actions/workflows/deploy-pages.yml)

## Play now

Choose one of three inexpensive starters with **¥50,000**, earn yen and reputation, fit performance parts and test your build against three rivals. The first complete loop is **starter → job → income → tuning → race → reward**.

### New: Rival Crews & Bosses — first Endgame chapter

**Races → Rival Crews** adds five Boss challenges while **Open events** keeps the original eight. No extra root tab or prestige reset. Inspect a crew, select your car, review the invitation and all payouts, then explicitly confirm entry. City also has a **MEET RIVAL CREWS** shortcut. The first four challenges are independently gated; the finale needs them all.

| Crew / boss | Discipline | Invitation | Entry per attempt | First-win title bonus |
| --- | --- | --- | ---: | ---: |
| **Ironline / Daichi** | Drag | Level 6 + settled Dockyard Redline podium | ¥4,000 | ¥20,000 |
| **Lantern Pact / Ayame** | Touge | Level 8 + settled Hakuro Switchback Club podium | ¥5,000 | ¥30,000 |
| **Black Static / Souta** | Street Sprint | Level 10 + settled Ward Club Circuit podium | ¥6,000 | ¥45,000 |
| **Zero Meridian / Kaede** | Expressway | Level 12 + settled Eastline Midnight Club podium | ¥8,000 | ¥60,000 |
| **Midnight Council / Shin** | Mixed-sector Sprint finale | Level 14 + all four settled crew wins | ¥10,000 | ¥125,000 |

A qualifier podium is **first, second or third**; existing records count. Defeating a crew requires **first overall and SETTLE RESULT**, not merely waiting for the timer. All five use Standard stakes with no added Heat, while ordinary patrol/Lay low entry restrictions still apply. Fixed rivals mean reloading cannot reroll the result. Fees are not refunded on withdrawal, and a poor finish may pay less than entry.

Every race has normal placement prizes. The table's **title bonus is a separate, one-time, manually claimed achievement reward**, available on the crew card or in Collection. Both buttons share one claim; replays never renew it. Five new achievements bring the total to **23**, without changing the original eighteen rewards. The chapter culminates in **Kagehama Night Champion**, a title with no hidden performance multiplier. No cars, businesses, managers, money or save history are reset on completion.

The challenges use the existing tuning and condition model. Tested winning routes include a restored, tuned RZ-T for drag/expressway and Pico R for technical/sprint/finale work: **no compulsory Icon purchase or one-time specialist car**. Every boss has multiple viable model/build combinations. Build guidance and full prize tables are in each briefing.

**Save v10 remains unchanged.** Wins reuse race records and prizes reuse the existing achievement ledger; prior saves load without resetting output, escrow or activities. Business managers and specialist work continue alongside the driver's race. The full chapter contract and all four placements' rewards are in [PHASE13A.md](docs/PHASE13A.md). This is Phase **13A**, not a claim that prestige, every boss, seasons or final art are complete.

### Businesses, managers and garage expansion

**Empire** is a ninth isolated tab with **Businesses**, **Staff & Managers** and **Garage Expansion**. Industrial District opens at **Level 3** and links to these operations. Your sticky cash/level/REP/XP/Heat HUD stays available; the Empire badge flags completed earnings ready to transfer.

| Business | Player level | Purchase | L1 booking profit | One-time manager |
| --- | ---: | ---: | --- | --- |
| **East Ward Detail** | 3 | ¥60,000 | ¥300 / 30s | Rei, ¥35,000 |
| **Bayline Parts Supply** | 5 | ¥180,000 | ¥900 / 45s | Jun, ¥90,000 |
| **Midnight Dyno Works** | 7 | ¥450,000 | ¥2,100 / 60s | Nao, ¥225,000 |

Purchase a property, then **START ONE BATCH → wait → COLLECT EARNINGS**. Unmanaged staff complete only one manually dispatched booking. The business is stopped after purchase and after collecting that batch; no income exists before dispatch. Staff do not occupy your driver or specialist-broker activity slot.

**Hire the associated manager to start repeat production automatically.** Completed batches fill that business's till, while the game is open or closed. The till is **not your spendable cash**: transfer it with **COLLECT EARNINGS** or the atomic **COLLECT ALL EARNINGS** button. Managers do not collect your personal jobs, enter races, drive your cars, clear Heat or buy anything. Their quoted hire is a one-time cost; operating costs are included in the advertised net output. There are no recurring wages, rent, debt or surprise bills.

Each managed till holds **at most eight hours of its current-level production**, online and offline combined. At Level 1 the limits are ¥288,000 / ¥576,000 / ¥1,008,000. An unmanaged till holds one booking. Full storage stops further accumulation; excess absence is discarded, not saved for a second payout. Reloading, exporting and other actions never renew the allowance. Collecting before full retains unfinished batch time; collecting a full till starts the next batch from that collection time. No background save loop or automatic wallet payout is required for production.

Businesses upgrade through **Levels 1–5**. Output is base profit × business level; booking time is unchanged. The next upgrade from Level L costs purchase price × L and requires player Level (business unlock + L). **Pause before upgrading or hiring during a running manual batch.** Pausing keeps all completed earnings but discards the unfinished batch time. Upgrades preserve the exact old till balance and remain paused until you resume. Staff, manager and building ownership are permanent; no resale/dismissal is implemented.

| Sequential garage expansion | Player level | One-time price | Total spaces |
| --- | ---: | ---: | ---: |
| Annex Lease | 4 | ¥75,000 | **18** |
| Warehouse Bays | 6 | ¥180,000 | **24** |
| Industrial Motor Hall | 8 | ¥400,000 | **36** |

**Garage → EXPAND GARAGE** opens the same expansion view. Buy expansions in order from the original 12 spaces. Dealer, Icon, barn and broker purchases all use the new capacity; existing paid imports/auction reservations remain counted and protected. Larger valid historical garages are not truncated. Expanding grants no free cars and changes no current activity or escrow.

**Save v10: no reset or retrospective income.** Valid v1–v9 worlds preserve every prior field and gain an empty business ledger with the original garage capacity. Production anchors, stopped/running state, managers, till balances, collected totals and expansion level travel in `KAGEHAMA1-...` exports. Invalid current ledgers are rejected rather than reset. Device-clock rollback blocks affected production commands without discarding progress. Full rules: [PHASE12.md](docs/PHASE12.md).

### Imports, Auctions, Barn Finds and Restoration

Specialist sources remain inside Market and Workshop; Empire is the only new main tab. **Market → Imports / Auctions / Barn Finds** opens the specialist network; **Workshop → Restoration** repairs condition separately from tuning. A broker handles one saved contract at a time while your own jobs/races/Heat recovery can continue. Finish each contract manually; closing the page never auto-buys, repeats or pays it. A pending delivery or auction reserves a garage space across dealer, Icon and project purchases.

| Source | New car | Unlock | Explicit cost and duration |
| --- | --- | --- | --- |
| Imports | **Mizuno Sora S** · 130 PS roadster | Level 5 | ¥165,000 + ¥15,000 transport, paid now; 90s; full refund on cancellation before collection. |
| Auctions | **Akari Crest RS** · 210 PS sedan | Level 6 | Maximum-bid escrow from ¥190,000, ¥5,000 steps; 60s. Disclosed rival ceiling ¥220,000: a maximum ≥¥225,000 wins at ¥225,000 and refunds surplus; lower bids lose with a full refund. |
| Barn Finds | **Hoshino Hachi GT** · 112 PS classic coupe | Level 5 | ¥5,000 non-refundable survey, 45s; then a separate optional ¥55,000 recovery purchase in its advertised worn condition. |

Auction bids are binding, can be raised before the original deadline and never trigger hidden rival rolls. The barn lead is fixed, not a free refresh lottery; discovery alone is not vehicle ownership. Each of these initial sources supplies **one car per save**, including after selling it. These are three playable curated sources, not a multiplayer or unlimited auction/import system. New models use the twelve existing non-turbo parts and all existing race disciplines; no new free cars or parts are granted.

**Restoration opens at Level 2:** review and pay to restore engine, body, transmission or all three to 100%, immediately. Costs depend on the model and actual deficit and are shown before confirmation. Purchased/fitted upgrades, mileage and originality remain unchanged. An assigned race/job car stays locked until settlement/cancellation; a parked spare can be repaired. No new wear, debts or forced repair costs have been added. Barn restoration is optional and its estimate is shown separately before acquisition.

Outer Kagehama now has its first Level-5 barn lead. Dockside and East Ward link to the import and auction desks. The Collection Book now contains **11 models**, including the fourth manufacturer Mizuno and the Roadster body type. Existing six-car dealer batches, old Icon offers, the original 18 achievement rewards and all previously accepted races/Heat terms are unchanged.

**Specialist save compatibility:** the historical v8→v9 step adds only empty specialist state. Current v10 additionally retains it unchanged while introducing Empire. Export codes include pending escrow, incoming cars, deadlines, surveyed leads and consumed sources. Read [PHASE11.md](docs/PHASE11.md) for exact terms, capacity protection and restoration pricing.

### Collection Book, achievements and Icon Cars

**Collection** is a separate tab, with **Collection Book**, **Achievements** and **Icon Showroom** sections. The book lists eleven explicit models. Filter by manufacturer, rarity, ownership status and name/year search. It distinguishes **ever collected** from **currently owned**. A sold model keeps its book credit; multiple copies occupy separate garage spaces but count as one model. Merely seeing a dealer listing or rival does not collect that car.

**Common → Rare → Legendary → Icon** are collector classifications, not performance modifiers, spawn odds or price multipliers. The 118 PS Tora 85 is Legendary, while the more powerful Pico R is Rare. Badges appear in Garage, Market and Collection. The original six-model used stock generator and its asking prices are unchanged.

There are **23 achievements** (the original 18 plus five Rival Crews titles) with visible criteria and progress. Earn badges through collection, work, trading, tuning, racing and completed Lay low recovery. They stay earned after a sale or stock restoration. Each has a fixed, **manually claimed one-time yen reward**, from ¥1,000 to ¥125,000 (the original eighteen still top out at ¥12,500). The navigation badge counts claimable rewards. Viewing or reloading does not pay them; there is no extra XP, REP or passive stat bonus. Collection reward income is shown separately from job/race/dealer totals.

| One-time Icon offer | Requirements | Exact car | Purchase price |
| --- | --- | --- | ---: |
| **Hoshino Tora 85 Heritage** | Level 6 + collect all three original starter models | 1987 · 135 PS · 940 kg · RWD | ¥180,000 |
| **Akari Kestrel GT** | Level 8 + settle a race in all four disciplines | 1997 · 235 PS · 1,320 kg · RWD | ¥320,000 |

Both offers provide a stock car with **10,000 km, 95% engine/body/transmission condition and 100% originality**. Meet the goal, inspect the fixed specification, then explicitly confirm the purchase. Earning an invitation does not grant a free car; claiming its achievement yen is optional. Icons use ordinary garage capacity, can be tuned with compatible non-turbo parts and entered in races. Buying does not switch your active car or change a pending activity. They are not ordinary dealer stock or random rewards.

**Each Icon offer can be purchased only once per save, including after selling its car.** Dealer sale rules still apply; the sale preview includes all its paid parts. Book credit and achievement claims remain saved. Existing garages are not cleared to make room. These are the first playable Icon goals; final vehicle artwork remains part of Graphics & Audio I.

**Collection migration:** valid pre-v8 data first migrate to v8 without changing previous balances, cars, parts, dealer stock, Heat or activities. Collection history is seeded only from current known cars, the original starter and the player's model in the last saved race result. Achievements supported by stored counters/parts can be recognised, but **no reward is paid automatically**. Unrecorded sold-model history cannot be guessed from names or sales totals. Full rules, all rewards and compatibility: [PHASE10.md](docs/PHASE10.md).

### Heat & Police

The fixed HUD now shows **driver Heat (0–100)** alongside your existing cash/level/REP/XP. Click it to open the Heat controls in **City**. Heat does not belong to one vehicle, so swapping or selling cars does not remove it.

**Standard stakes remain unchanged.** Each race briefing defaults to Standard, preserving original prizes and adding no Heat. At Level 3, the seven paid events also offer **Underground stakes**: **+50% gross prize money and +25% REP**, rounded down, in exchange for a clearly shown Heat increase. The free East Ward Shakedown remains standard-only. Car performance, rivals, entry fee and race duration do not change.

| Heat | Attention |
| --- | --- |
| 0–24 | Clear |
| 25–49 | Noticed |
| 50–74 | Watched |
| 75–100 | Crackdown |

Heat is added **once at entry**. Underground gains range from 12 to 22 by event. If projected Heat reaches 50, the briefing announces a **¥1,500 patrol alert**; at 75 it is **¥3,000**. The alert appears when the race is settled **or withdrawn**. There is no random roll and **no automatic fine**. Choose either a separately confirmed fine (−30 Heat) or a **free 60-second Lay low pause (−40 Heat)**. Both clear the alert. The free option always remains available with zero cash. New jobs/races wait until the alert is resolved; browsing, trading and parked-car tuning remain available.

You can also lay low voluntarily between activities. Finish the saved pause manually when ready; closing the page retains its deadline but never auto-completes or repeats it. Cancelling removes no Heat and leaves any patrol alert intact. **Each claimed legal job removes up to 6 Heat**, without changing its money/REP rewards. There is no passive Heat decay or penalty on ordinary jobs. At **85+ Heat**, cool down before another Underground entry; Standard events remain accessible once any alert/pause is resolved.

The race briefing shows gross and net returns for both the free-wait and fine choices. Race career net is before police payments; total paid fines are separately shown in City. No cars are confiscated, no damage/debt is introduced and pre-update races receive no retrospective penalties. Full rules and event gains: [PHASE9.md](docs/PHASE9.md).

### The used car market

**Market** is a separate tab, available after the starter choice, with shortcuts from Garage and East Ward. Browse six individual offers, inspect the exact vehicle and confirm **BUY VEHICLE**. A purchased car joins your garage without replacing or activating over the current car. Its listing is consumed once; the displayed year, mileage, conditions and ID are kept.

| Model | Body / manufacturer | Model-year range | Factory power | Market level |
| --- | --- | --- | ---: | ---: |
| Hoshino Pico RS | Hatchback / Hoshino | 1992–1996 | 105 PS | 1 |
| Hoshino Tora 85 | Coupe / Hoshino | 1984–1987 | 118 PS | 1 |
| Akari RZ-T | Coupe / Akari | 1990–1994 | 155 PS | 1 |
| **Akari Senda S** | Sedan / Akari | 1996–1999 | 145 PS | 3 |
| **Hoshino Pico R** | Hatchback / Hoshino | 1998–2001 | 165 PS | 4 |
| **Kazuma Estate GT** | Wagon / Kazuma | 1999–2003 | 190 PS | 5 |

Combine **manufacturer, body type, exact year/year range and text search**. Sort by price, year, mileage or condition; visible counts and a reset recover empty results. Filters survive ordinary tab switches, never reroll stock and never purchase anything. New cars work with the Garage, existing non-turbo parts and all four race disciplines. RZ-T-only turbo upgrades remain RZ-T-only.

Prices depend on the specific example's condition, mileage, year and originality. They are provisional game values, not real-world prices or a live supply/demand model. The garage begins with **12 spaces** and can expand to **18, 24 and 36** through Empire. Reserved incoming cars count against every acquisition route. Larger valid old garages are kept but cannot purchase more until below their effective capacity.

**SELL A CAR** opens your owned vehicles and dealer offers. A sale includes **all purchased parts for that car**, including removed upgrades; no parts transfer to another vehicle. The dealer pays 65% of the reference valuation plus a 20% parts allowance, rounded down to ¥100. You cannot sell the last car or a vehicle assigned to an unsettled job/race. Selling the active car requires choosing its replacement explicitly. Cancellation/Escape changes nothing. Historical race records remain after selling a car.

**REQUEST NEW STOCK** is a free, confirmed replacement of the remaining unsold offers. The first request is immediately available; subsequent requests have a **5-minute cooldown**. Each batch has one different individual example of every model. Stock is saved and never refreshes by itself on reload or absence. Owned cars, cash and activities are unaffected. Details: [Phase 8 contract](docs/PHASE8.md).

### Level XP in the persistent HUD

A small **XP progress bar sits directly below the level number** in the top HUD, in all nine sections and while scrolling. The label shows the REP remaining to the next level; the accessible description gives the target level. **Reputation is your level XP**, not a second currency. Job claims and race settlements update the same progression selector used by the Jobs panel. At the current Level 20 cap the bar is full and says **MAX**; money and reputation can still increase.

For example, Level 1 with 4 REP has a 20%-filled bar and needs 16 more REP for Level 2. Level 2 begins at 20 total REP and needs another 40 REP for Level 3. Thresholds remain `10 × level × (level − 1)`. This interface change does not rebalance rewards or rewrite existing levels.

### Kagehama City

**City** opens after the starter purchase. Inspect district nodes to see their scene, access requirements, existing job/race invitations, fees, services and settled personal race records.

| District | Opens | Current activities |
| --- | --- | --- |
| East Ward | Level 1 | Sprint invitations, Garage Shift, Parts Run, your garage, Mercer Workshop and the used market |
| Dockside | Level 2 | Drag invitations; Dockside Delivery still requires Level 3 |
| Hakuro Pass | Level 2 | Touge invitations |
| Eastline Expressway | Level 3 | Expressway invitations |
| Industrial District | Level 3 | Businesses, staff/manager operations and garage expansion |
| Outer Kagehama | Level 5 | Old Orchard barn survey/recovery; restoration is available in Workshop |

Individual events keep their existing level requirements. Club invitations do not become available just because their district is open. Industrial District now opens at Level 3 for Empire operations; all six districts have implemented access.

The city is a **directory, not travel**: no tolls, timers, rewards for clicking areas or changes to the active car. District shortcuts open the real Jobs/Races tabs with the matching filter, never start or pay for an activity. The race district filter combines with discipline; a clear-filter control recovers an empty result. Job districts filter only offers. **Pending activities always stay visible**, irrespective of filters, and can also be resumed from City.

### Racing

Open **Races**, choose an owned vehicle and inspect **RACE BRIEFING** before confirming **ENTER RACE**. A 3-second countdown precedes a compressed sector replay. The finish table shows positions, simulated times and gaps; **SETTLE RESULT** saves the prize, REP, assigned-car mileage and personal record.

| Discipline | Build focus | Rookie invitation | Club invitation |
| --- | --- | --- | --- |
| Street Sprint | Acceleration, handling and braking | East Ward Shakedown | Ward Club Circuit |
| Drag | Launch grip, power-to-weight and power | Dockyard 402 | Dockyard Redline |
| Touge | Grip, handling, braking and low weight | Hakuro First Descent | Hakuro Switchback Club |
| Expressway | Power and high-speed consistency | Eastline After Hours | Eastline Midnight Club |

There are **8 events**. **East Ward Shakedown is fee-free at Level 1** after the starter choice. Other events require Levels 2–6 and charge a displayed fee. The briefing shows gross prizes and net earnings for all four positions. A poor finish can pay less than the entry fee; withdrawal does **not** refund it.

The same build, condition, rivals and course give the same times: reloading does not reroll defeat. These are abstract game ratings, **not real driving physics or a freely driven 3D game**. There are no random breakdowns, fuel costs, new wear, damage or car loss. Standard entry keeps the original terms; optional Underground stakes add the announced Heat/bonus/patrol rules above. Race model v1 and entry fees stay unchanged. See [PHASE6.md](docs/PHASE6.md).

Only **one job, race OR Lay low pause** can be pending, including a finished but unclaimed activity. The assigned car stays locked for tuning until settlement/cancellation. Another parked car can be tuned. Changing the active garage vehicle never swaps the existing race participant.

### Categorised workshop

**14 parts, 8 slots, 3 fictional brands:** Aoba Streetworks, Senka Dynamics and Kurogane Boost. Component buttons and a synchronized dropdown filter **intake, exhaust, ECU, tires, suspension, brakes, weight reduction and turbo**. Counts and selected categories stay visible.

Choose the individual vehicle to tune and review current versus proposed power, weight, power-to-weight, grip, handling, braking, reliability and originality before **BUY & INSTALL**. Parts belong to that car, not every copy of a model. One upgrade fits a slot. Swapping retains the old part; refitting owned parts and **RESTORE STOCK** are free, without refunds. Turbo upgrades fit the Akari RZ-T only. Level, cash, compatibility and activity restrictions are explicit.

Factory baselines stay separate from derived values so upgrades never compound on reload. Reliability is not current engine condition. Parts do not repair wear or increase job rewards. Separate part resale/transfers, engine swaps and final art remain later work. Condition repairs are now available in Workshop → Restoration. [PHASE5.md](docs/PHASE5.md) lists unchanged prices/effects.

### Jobs and starters

| Job | Unlock | Duration | Payment | REP | Vehicle use |
| --- | --- | ---: | ---: | ---: | --- |
| Garage Shift | Starter / Level 1 | 15s | ¥1,500 | +4 | On foot; no mileage |
| Parts Run | Level 2 | 30s | ¥3,000 | +8 | Assigned car; +6 km on claim |
| Dockside Delivery | Level 3 | 45s | ¥5,500 | +14 | Assigned car; +12 km on claim |

Jobs have no entry fee, require a manual claim and do not auto-repeat. Cancellation pays nothing. Five Garage Shifts unlock Level 2. Jobs and races share reputation/levels; there is no extra cash bonus for levelling up. All original starter/job/part/race balances are unchanged. The three new market models add their own factory build ratings.

| Starter | Layout | Base power | Price | Cash left |
| --- | --- | ---: | ---: | ---: |
| Hoshino Pico RS | FWD | 105 PS | ¥32,000 | ¥18,000 |
| Hoshino Tora 85 | RWD | 118 PS | ¥42,000 | ¥8,000 |
| Akari RZ-T | RWD Turbo | 155 PS | ¥48,000 | ¥2,000 |

You receive **one starter, not three free cars**. Additional examples of all three starter models and three new models are now bought through the Market. Each owned instance retains its own condition, mileage, factory data and tuning.

## Interface and saves

Cash, level, REP, XP progress and top navigation remain visible while scrolling. **Garage, Jobs, City, Races, Workshop, Market, Collection, Empire and Saves** are isolated sections. Arrow keys, Home and End operate the tab row; narrow screens can scroll the row horizontally. READY badges announce finished jobs/races and Lay low pauses without applying them automatically. The City ALERT badge and global notice expose pending patrol decisions. Global save warnings link to recovery tools.

District inspection, garage search/sort, market preferences and activity filters survive ordinary tab switches. City links intentionally choose the destination district and clear a conflicting race-discipline filter. Reload, successful import and reset return to Garage and default city/filter views. These view preferences are not gameplay save data.

Collection filters and subviews persist during ordinary section switches; a reload or successful full import/reset restores the default view. Importing an older code deliberately restores its older claim/offer ledger, not a merge or cloud entitlement. Reset clears collection history, reward claims and used Icon offers along with the rest of the game.

Progress autosaves in **this browser on this device**, under `kagehama:save`. Gameplay commands must write successfully **before** publishing visible changes. Tab/filter/XP rendering does not write gameplay data.

- **Export:** generate a `KAGEHAMA1-...` code in Saves, including collected models, earned/claimed achievement IDs, used Icon offers, exact market stock/refresh cooldown/trades, tuning, race records, Heat, patrol alerts and any pending activity.
- **Import:** review the confirmation before replacing the whole save, not merging it.
- **Reset:** confirmation returns to ¥50,000, Level 1 and starter selection, clearing cars, parts, jobs, races, Heat, patrol alerts, Lay low and market history and restoring the initial unpurchased stock. Export a backup first.

**Valid Save v1–v9 data migrate to v10 automatically. No reset is needed.** Earlier fields are preserved, including purchased/fitted parts, paid race snapshots, jobs and receipts, money, levels and REP. Pre-v6 saves first gain unpurchased market stock and empty trade history. V6→v7 adds only a clean Heat record: no changes to existing cars, dealer stock, pending races, money or history. Missing or malformed required market/Heat fields are rejected, not silently reset. The v9→v10 step adds an empty Empire only, preserving specialist escrow and collection claims. There are no retrospective penalties or business earnings.

Leaving the page can ready the one pending driver activity and the independent specialist contract. Managed businesses separately repeat into their bounded tills; no wallet income is transferred automatically. Its original build, rivals, prizes and deadline remain saved. Returning never auto-repeats or pays it. Importing an older code deliberately restores an older snapshot. No cloud account or server-authoritative anti-cheat exists; device clocks/codes remain user-controlled.

Unreadable/newer saves are protected, not deleted. Failed writes cannot consume money, parts or rewards. Clock rollback prevents premature completion but permits cancellation/withdrawal. Use one browser tab at a time: detected external changes block stale writes, not a distributed lock. Clearing site data/private browsing may remove progress; keep exported backups.

## Roadmap

- [x] **0 — Foundation:** React/TypeScript/Vite, midnight-Japan shell and catalog.
- [x] **1 — Core Game:** player state, starter purchase and vehicle instances.
- [x] **2 — Persistence:** autosave, portable codes and confirmed reset.
- [x] **3 — Garage:** dossiers, active car and regression tests.
- [x] **4 — Economy:** timed jobs, yen/REP, levels and mileage.
- [x] **5 — Interface & Tuning:** persistent HUD, real tabs and first workshop.
- [x] **6 — Racing:** four disciplines/eight events, replay/results/records and component categories.
- [x] **7 — Kagehama City:** district overview, access previews, filtered activity shortcuts and HUD XP.
- [ ] **Graphics & Audio I:** separate targeted presentation pass; not completed by the schematic city view.
- [x] **8 — Car Market:** six models, individual saved stock, buy/sell, 12-space capacity, explicit refresh, valuation and combined brand/year/body-type filters; Save v6.
- [x] **9 — Heat & Police:** optional Underground stakes, explicit Heat/bonus/fine terms, deterministic patrol choices, free/paid recovery and Save v7 compatibility.
- [x] **10 — Collection:** eight-model book, independent rarity badges, 18 one-time manually claimed achievements, two gated Icon purchases and Save v8 migration.
- [x] **11 — Advanced Cars:** three curated specialist sources, escrow/refunds, reserved deliveries, optional barn recovery and condition restoration; Save v9.
- [x] **12 — Empire & Automation:** three properties, manual batches, permanent managers, capped eight-hour production, manual till collection and garage expansion to 36; Save v10.
- [x] **13A — Rival Crews & Bosses:** four crew challenges, a finale, titles and shared one-time bonuses; no reset.
- [ ] **13B+ — Further Endgame:** designed Legacy/Prestige, seasonal events, more rivals and catalog expansion.

[Detailed roadmap](docs/ROADMAP.md). Business/manager automation is implemented as the first Empire slice. Personal-job delegation, crew squads, automatic racing/trading and broader business content remain extensions, not current features. README, roadmap, changelog and compatibility notes are reviewed with every phase.

## Development and verification

**Playing requires no installation.** The workflow checks feature branches and publishes `main` only after successful tests, build and browser checks. Use Node.js 24, matching CI:

```bash
npm install
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run dev
```

PowerShell: use `npm.cmd` / `npx.cmd` when script policy blocks `.ps1` shims; no policy change is required. Browser tests exercise the production build at `/Racing-Game/`; build first. CI attaches reports/screenshots. `phase/**` branches do not deploy. A local `git pull` only updates your copy. Dependency pinning/a committed lockfile remain documented build-hardening work.

## Architecture

`src/data/` contains vehicle/job/part/race catalogs and explicit model/district metadata. `src/domain/` contains pure market/gameplay commands, valuation and stock generation, read-only city selectors, progression, derived stats, model-v1 racing, versioned Heat risk and recovery, validation and migrations. `src/hooks/` owns durable session writes and the presentation clock. `src/components/` provides the shared HUD and views. Historical fixtures remain in `tests/fixtures/`; production-build regressions are in `tests/e2e/`.

## Principles

JDM culture is the heart of the setting. Fictional manufacturers create an original universe. Rarity is separate from raw performance; builds should suit different disciplines. Content is data-driven, and save compatibility/tests are core infrastructure.
