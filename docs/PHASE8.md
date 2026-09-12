# Phase 8 — Used-car market contract

Baseline: `c97c2f2aa6a81826039ac7caff9f48af82b1c1ea` (Phase 7 / Save v5). This milestone adds the first market, normal additional-car acquisition, dealer sales, saved stock and explicit vehicle metadata. The interface/HUD, old jobs, race model v1 and existing starter/part balance remain intact. Graphics & Audio I is still open.

## Scope and catalog

Market is a seventh section in the sticky navigation, available to browse after starter selection. Purchases have model-level gates. The original starter selection remains exactly three cars at unchanged prices; market listings are additional purchases, never free grants.

| Model | Manufacturer | Body | Years in stock | Layout | Factory PS / kg | Purchase level | Reference base value |
| --- | --- | --- | --- | --- | --- | ---: | ---: |
| Pico RS | Hoshino | Hatchback | 1992–1995 | FWD | 105 / 890 | 2 | ¥55,000 |
| Tora 85 | Hoshino | Coupe | 1984–1987 | RWD | 118 / 970 | 2 | ¥85,000 |
| RZ-T | Akari | Coupe | 1990–1994 | RWD Turbo | 155 / 1180 | 2 | ¥115,000 |
| Mira S | Hoshino | Sedan | 1996–1999 | RWD | 140 / 1240 | 3 | ¥150,000 |
| Nami GT | Akari | Coupe | 1998–2002 | RWD | 185 / 1190 | 5 | ¥245,000 |
| Riku Tourer | Mikado | Wagon | 1995–2000 | RWD | 170 / 1470 | 4 | ¥190,000 |

Reference values are not asking prices. These are original fictional models and provisional game balance, not real-world specifications/prices. Year/brand/body data are explicit in `src/data/vehicles.ts`, not parsed from display names. Existing saved vehicle factory fields are not rewritten to match catalog metadata.

All three added models support the existing non-turbo performance parts. RZ-T remains the only compatible turbo-upgrade model. New grip/handling/braking/reliability baselines are Mira **54/58/55/86**, Nami **61/67/59/82**, Riku **54/47/57/89**. Existing three starter ratings stay unchanged. Purchased new cars can be selected in Garage, tuned and entered into the existing model-v1 races.

## Stock lifecycle

Stock version 1 creates **nine listings per batch**: two distinct examples of each original starter and one example of each new model. Each listing stores its vehicle snapshot, unique instance/listing ID, asking price, required level, seller, demand multiplier and purchased flag. Vehicle years, mileage, engine/body/transmission condition and originality vary within defined generation ranges. Initial batch is 1; initial refresh timestamp is null and no timer/fee is invented at migration.

Generation is deterministic from batch and slot with a local seeded xorshift. It never reads `Math.random` or wall-clock time. Existing snapshots are loaded as saved; they are not regenerated or repriced when browsing, filtering, switching tabs or reloading. Buying a listing marks it purchased; it cannot be bought a second time. Selling the acquired car does not reopen its original listing or offer an immediate buyback.

**New stock requires a confirmed manual action**, Level 2, a starter, and **¥1,000**. It replaces all current listings, including unsold offers, but never touches owned cars. After refresh, a **5-minute** wall-clock cooldown applies. Expiry only enables the button; it does not refresh or charge automatically. The first refresh can be requested immediately at Level 2. A backwards/invalid device clock blocks refreshing, not existing-stock browsing or other game recovery. Batch IDs increase and stale/double refresh confirmations cannot charge twice. Stock version/batch/deadline survive export/import.

## Purchase and capacity

The purchase dialog identifies the exact instance, condition, mileage, year, price, post-purchase balance and space count. Purchase is one pure atomic command; durable storage must succeed before visible cash/garage/stock update. Unknown/stale/already-purchased offers, insufficient/invalid cash, unearned levels, duplicate owned IDs and full garages are rejected without spending.

The initial normal garage capacity is **12 cars**. Larger valid imported legacy collections are retained, not truncated; further purchases are blocked until fewer than 12 cars are owned. Capacity upgrades remain future work. Purchasing normally leaves the active vehicle unchanged. Only a valid legacy empty garage with no active ID activates its new purchase automatically. Model unlock level is only a purchase gate; selling an existing car has no retrospective level requirement.

## Dealer valuation and selling

Valuation is pure and based on the individual car. All ratios use integer basis points, with intermediate floor division; final offers round down to ¥100 with a ¥100 safety minimum.

1. `condition = round((engine + body + transmission) / 3)`.
2. Condition factor: `3500 + condition × 65` basis points.
3. Mileage factor: `10000 − min(3500, floor(km / 10000) × 100)`.
4. Originality factor: `9000 + round(effectiveBuildOriginality × 10)`.
5. Model-year factor: `10000 − min(1500, max(0, model.yearTo − car.year) × 150)`.
6. Multiply the model base value by those four factors to obtain the reference value.

An asking price applies a per-listing **95–105% demand multiplier** to the stock reference value, then rounds down to ¥100. It is frozen in the listing. A dealer bid is **65% of the current reference value plus 20% of the original catalog cost of every purchased part** for that vehicle. This includes stored replacements as well as fitted upgrades; each part is credited once. Active upgrades' originality effects influence the current reference value. Removing/refitting parts never duplicates ownership credit. There is no refund of full upgrade prices.

The spread intentionally makes an immediate unmodified buy/sell a loss; this phase supplies vehicle acquisition/disposal, not a guaranteed money-printing flip. Restoring or materially improving cars for profit remains future design. Dealer quotes do not fluctuate with time or stock refresh. An unfamiliar legacy model without valuation metadata has no sale quote and remains in the garage.

The sale dialog identifies the instance, offer and parts that will leave. Selling removes exactly that car and all its per-car purchased parts, credits once, and preserves previously settled race/job histories. **The last owned car cannot be sold.** A vehicle assigned to a pending job or race cannot be sold, even after its timer finishes; settle/claim/cancel first. Other parked cars may be bought/sold while an activity is pending without changing its participant, build, deadline or prize snapshot.

Selling the active car explicitly selects the first remaining owned vehicle in stable garage order. The confirmation names that replacement. The sale key includes the quoted vehicle, active ID and garage IDs; stale build/mileage/garage changes require a new review. No buyback exists. Imports still restore full older snapshots, not isolated cars.

## Browsing and interface

Manufacturer, body type, inclusive year range and search combine; equal from/to years select a single year. Invalid/reversed bounds produce a message and no misleading matches. Sort by price (both directions), year (both directions), mileage or condition. Include-purchased toggle, counts and clear/reset controls are provided. Filtering does not write gameplay state or alter inventory.

Ordinary tab changes retain Buy/Sell mode, filters and sorting. Reload and successful full import/reset start default views. Garage uses the shared model metadata for names/descriptions and dossier body/manufacturer labels, with a shortcut to Market. HUD cash/level/REP/XP and existing READY badges stay visible. The initial car profiles remain placeholders, not final body-specific artwork. Real tabs and modal confirmations retain keyboard focus behavior and narrow-screen usability.

## Save v6

`LegacyGameStateV5` freezes the former game shape. **Valid v1–v5 saves migrate to v6** through the existing migration chain; v5 only gains an initial market record and stock. All old cars, individual tuning inventories, balances, levels, REP, pending jobs, receipts, paid race snapshots and records are preserved. No market purchase, reward or elapsed cooldown is invented. The previous racing migration applies only through v4, so a v5 race is not reset by the new version check.

The browser key stays `kagehama:save`; export transport stays `KAGEHAMA1-`. Market stock, purchased flags, counters, last transaction and refresh deadline are included. Missing/invalid v6 market state is rejected, not silently recreated. Listing/counter/receipt bounds and identities are validated before accepting import. The source v1–v4 fixtures remain unchanged; a frozen v5 tuned-car/pending-job fixture and pending paid-race migration regressions are included.

Market actions reuse the existing durable-write-before-visible-state session and stale-browser-tab protection. Failed writes retain cash, cars, offers and cooldown for safe retry. Reset clears market history and recreates initial stock along with the normal new-game state, only after confirmation. Local codes and clocks remain user-controlled: validation is structural safety, not server-authoritative anti-cheat or distributed locking.

## Verification gate

Keep prior regression suites, adding only required current-schema expectations. Test all models and filters, independent instances, complete purchase/sale flows, stale/double actions, money/counter overflow, capacity and old over-cap saves, last-car/busy-car safeguards, active replacement, valuation monotonicity and negative instant flips over 100 batches, explicit refresh/cooldown/rollback, source snapshot stability and old-save compatibility. Browser tests cover cards, actual filter controls, keyboard tabs, purchase/cancel/sale, failed storage writes, pending activities, old saves, export/reset/import, stale tabs and desktop/390px/320px previews with sticky XP. Review screenshots and verify the final main Pages deployment before calling it live.
