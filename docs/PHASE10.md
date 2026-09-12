# Phase 10 — Collection contract

Baseline: `8972ee465c6f33e823557139c61763456f60a0cb`, released Phase 9 / Save v7. Chosen scope: eight-model Collection Book, independent rarity classification, eighteen achievements with manually claimed yen and two fixed-price milestone Icon offers. This is not the final artwork/audio pass.

## Model credit, rarity and migration evidence

**Collected = ever owned**, not simply listed in a catalog, dealer or rival grid. All eight models are visible in the Book with manufacturer, body, model-year range, factory power, acquisition route and collection/current-ownership status. Manufacturer, rarity, status and name/year search combine with AND semantics. Reset restores all entries. Filters never change inventory, money or progress.

Copies of one model count once towards collection goals and once each towards garage capacity / the simultaneous six-car achievement. The model's discovery and already earned achievements persist after sale. The book explicitly distinguishes collected-but-no-longer-owned cars. Rarity is static collector metadata, not a power modifier, valuation multiplier, spawn probability or paid loot system.

| Model | Rarity | Acquisition |
| --- | --- | --- |
| Hoshino Pico RS | Common | Original starter / used market |
| Hoshino Tora 85 | Legendary | Original starter / used market |
| Akari RZ-T | Rare | Original starter / used market |
| Akari Senda S | Common | Used market |
| Hoshino Pico R | Rare | Used market |
| Kazuma Estate GT | Rare | Used market |
| Hoshino Tora 85 Heritage | Icon | One-time Heritage offer |
| Akari Kestrel GT | Icon | One-time Kestrel offer |

For example, a Legendary 118 PS Tora is not automatically faster than a Rare 165 PS Pico R. The original factory data and tuning/racing model remain unchanged. `USED_VEHICLE_CATALOG` explicitly separates the released six-model stock generator from the two new Icon definitions; existing stock is never rewritten or repriced. The released v7 fixture's saved lot is compared with the unchanged generation samples.

On v1–v7 migration, the collection is seeded only from currently owned known models, the originally selected starter and the **player** model in the last saved race result. Rival entries, dealer listings, vehicle names and aggregate sale counts cannot prove a sold model. Unknown valid historical models remain in the garage but outside the known book. No fake discovery dates are generated. Missing historical sold cars or a former build overwritten before this update cannot be reconstructed; future normal commands preserve this history.

## Achievements and rewards

Relevant pure gameplay commands observe qualifying state immediately before and after the successful transition. This records a model/build before a destructive sale or stock restoration and new goals after acquisition/claims/settlement. Observation is immutable and idempotent: it only updates the collection ledger. Read-only browsing and timer rendering never observe/write, pay or award XP. A command that throws, or whose eventual storage write fails, does not publish the ledger update.

Each badge latches once earned. Its current condition may subsequently disappear, but a claimed reward never becomes available again during normal play. The native progress bar shows goal completion, not a second XP currency. Claims require an earned badge and sufficient safe-integer headroom for the fixed reward. Each cash reward is manual and exact-once. No REP, level increment, passive modifier or automatic car is awarded. Collection reward income is derived separately from claimed IDs, not mixed into historical job/race/dealer totals.

| ID / name | Requirement | Reward |
| --- | --- | ---: |
| first-ride / Financially Questionable | Purchase a starter | ¥1,000 |
| starter-trio / Three Bad Decisions | Ever collect all three original starter models | ¥6,000 |
| original-six / The Starter Pack Was a Lie | Ever collect all six used-market models | ¥10,000 |
| full-house / Parking Is a Personality | Own six cars simultaneously; duplicates count | ¥8,000 |
| all-shapes / Practicality, Allegedly | Ever collect hatchback, coupe, sedan and wagon | ¥5,000 |
| first-icon / Not Just a Poster | Collect an Icon model | ¥10,000 |
| five-jobs / Will Work for Wheels | Claim five completed jobs | ¥2,500 |
| night-shift / Overtime, Overtake | Claim 25 jobs | ¥5,000 |
| first-purchase / Just Browsing | Buy a used-market car | ¥2,000 |
| first-sale / It Had to Go | Complete one dealer sale | ¥1,000 |
| first-part / Rent Can Wait | Own a purchased tuning part | ¥1,000 |
| four-slots / Built, Not Budgeted | Fit four upgrade slots on one car | ¥4,000 |
| first-race / The Start of Something Expensive | Settle one race | ¥1,500 |
| three-podiums / Podium Parking | Settle three podium finishes | ¥4,000 |
| first-win / Actually, It Runs | Settle one win | ¥3,000 |
| four-corners / Four Corners of Midnight | Settle a race in each discipline, any finish position | ¥7,500 |
| ten-wins / Local Problem | Settle ten wins | ¥12,500 |
| lay-low / Touch Grass, Not Guardrails | Finish, not cancel, a Lay low pause | ¥2,000 |

Existing saved counts, known ownership, currently retained paid/fitted parts and the last completed Lay low receipt can qualify old players. **Migration never pays these rewards**: it adds earned IDs and leaves all claimed IDs empty. Before the update there were no collection reward claims to restore. A pending/ready timer is not a completion; race withdrawal, job cancellation and cancelled Lay low are not qualifying finishes. No achievement encourages paying a mandatory police fine or losing a car.

## Icon Showroom offers

| Offer | Gate | Fixed vehicle | Price / reference valuation |
| --- | --- | --- | --- |
| heritage-commission | Level 6 and earned starter-trio | Hoshino Tora 85 Heritage, 1987, 1.6L NA I4, RWD, 135 PS / 940 kg | ¥180,000 / ¥240,000 |
| kestrel-commission | Level 8 and earned four-corners | Akari Kestrel GT, 1997, 3.0L NA I6, RWD, 235 PS / 1,320 kg | ¥320,000 / ¥400,000 |

Both are **10,000 km, 95% engine/body/transmission, 100% originality, stock tuning**. Factory grip/handling/braking/reliability are **57/72/57/86** for Heritage and **62/61/62/84** for Kestrel. Both use the twelve existing non-turbo upgrades; the two RZ-T turbo upgrades remain incompatible. The original models and all existing parts/effects are unchanged.

The achievement's yen reward need not be claimed to earn an invitation. The goal and level are both required; money and one free slot under the existing twelve-car purchase cap are checked at confirmation. Valid older garages above capacity are kept, not truncated. No free cars or extra garage slots are granted. Icon purchases are separate from used-market trade counts/receipts and never reprice or replace dealer stock.

Offers are fixed and **purchasable once each per save**, even after the car is sold. Display the complete specification, price, cash remaining, instance ID and the non-renewable-offer consequence before confirming. A stale quote, repeated offer, inadequate level/goal/cash/capacity or failed storage write cannot consume the offer. Instance IDs have deterministic collision handling against parked cars and current listings without altering old vehicles. Buying keeps the selected active vehicle and all pending activity snapshots; a valid legacy empty garage receives an active ID as with market recovery.

Icons can be driven/tuned/sold through the ordinary systems. Assigned-job/race and last-car sale locks still apply. A sale includes all that car's purchased parts and does not restore its Icon offer. Book credit survives. The dealer valuation remains version 1, and initial trade-in plus the first-Icon achievement reward is tested to remain below the acquisition price. Icons are goals, not an immediate buy/sell reward farm.

## Save v8 and transaction boundary

`collection: { collectedModelIds, unlockedAchievementIds, claimedAchievementIds, purchasedIconIds }` is required in v8. Arrays are bounded, duplicate-free and restricted to known stable IDs. Claimed achievements must be earned. A used Icon offer requires its qualifying badge and its model's collection credit. A pre-starter world cannot contain collection claims or invented history. Earned IDs describe historical evidence, so they are not revoked or re-evaluated away when cars/parts are sold.

The v7-to-v8 migration preserves **every previous field** including exact dealer stock, quotes, bought cars, parts, cash, levels, Heat, patrol/cooldown, paid Underground risk contracts, race snapshots/results and job receipts. Older versions use their existing migrations first. `tests/fixtures/save-v7.json` was generated with the actual released code and includes a dealer purchase, stock refresh, tuned car, completed jobs/race and pending paid Underground race. All previous fixtures remain byte-for-byte unchanged. `KAGEHAMA1-` and `kagehama:save` remain unchanged.

Missing or malformed v8 collection data is rejected, not silently replaced to enable repeat claims. Import replaces the entire world, including the claimed/offer ledger; it is not a merge or server entitlement. Importing an older exported code deliberately rolls back its snapshot. There is no cloud save, server-authoritative anti-cheat or protection against a user intentionally editing client codes.

Commands remain pure; the shared session writes durably before publishing visible progress. Reward/Icon actions use the same stale-tab and failed-write handling as existing purchases. No fine, reward, Icon, discovery or history entry is applied when the write fails. UI synchronous guards also prevent repeated confirmation in a single render. Claiming or buying a parked Icon may happen during a job/race/patrol/pause, but never pauses, pays, clears or replaces that activity. Browsing is always read-only.

## Interface, verification and remaining work

Collection is an eighth isolated top-level panel; inner sections are ordinary accessible button groups, not competing main tabs. Cash, level, REP, XP and Heat remain sticky. Book and achievement filters plus inner section choice survive ordinary tab switches, but successful import/reset and reload return to default views. The root tab badge counts available manual claims. Rarity uses text as well as colour. Native progress bars, visible empty/reset states, keyboard navigation and narrow-screen cards/dialogs are included.

Retain the previous 517 unit and 127 browser scenarios. Update only current-schema expectations and the new tab in historical tests; compare every pre-existing field exactly. Add tests for history, rarity separation, all achievement reward IDs, exact-once claims, partial/failed commands, overflow, retained badges after sales/refits, both Icon gates/ownership/sales/tuning/racing, actual old-save migration, malformed ledgers, storage errors, stale tabs, active Heat/job/race continuity and 320/390/1440-pixel Book/Achievement/Icon layouts. Verify the final clean tree and Pages deployment before calling it live.

No new auction, barn-find search, repair/restoration, automation, prestige, random loot, final art or audio is implied by this milestone. Graphics & Audio I remains an open presentation pass. Phase 11 is the next numbered advanced-car system.
