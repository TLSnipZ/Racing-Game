# Phase 8 — Used vehicle market contract

Baseline: `c97c2f2aa6a81826039ac7caff9f48af82b1c1ea` (Phase 7 / Save v5). This milestone adds the first actual vehicle marketplace and the required manufacturer, model-year/range and body-type browsing. Save schema becomes **v6**; `KAGEHAMA1-` and the browser key stay unchanged.

## Catalog and scope

The Market tab unlocks after the normal starter purchase, with shortcuts from Garage and East Ward in City. No vehicles are gifted by migration or visiting the market. The original three starter examples/prices are unchanged. A shared, explicit model catalog adds manufacturer, body type, valid production-year range, a pristine reference valuation and market level. Existing owned instance fields remain unchanged; metadata is looked up by catalog ID rather than inferred from names.

| Model | Manufacturer | Body | Model years | Factory PS / kg | Market level | Pristine reference yen |
| --- | --- | --- | --- | --- | ---: | ---: |
| Hoshino Pico RS | Hoshino | Hatchback | 1992–1996 | 105 / 890 | 1 | 50,000 |
| Hoshino Tora 85 | Hoshino | Coupe | 1984–1987 | 118 / 970 | 1 | 75,000 |
| Akari RZ-T | Akari | Coupe | 1990–1994 | 155 / 1,180 | 1 | 110,000 |
| Akari Senda S | Akari | Sedan | 1996–1999 | 145 / 1,230 | 3 | 125,000 |
| Hoshino Pico R | Hoshino | Hatchback | 1998–2001 | 165 / 1,010 | 4 | 170,000 |
| Kazuma Estate GT | Kazuma | Wagon | 1999–2003 | 190 / 1,400 | 5 | 210,000 |

Reference valuations are **not fixed asking prices**. All prices are game balance, not real-world values. Senda/Pico R/Estate GT use the 12 existing non-turbo upgrades; the two turbo upgrades remain exclusive to RZ-T. Part IDs, prices and effects are unchanged. New grip/handling/braking/reliability baselines are respectively **54/60/55/84**, **57/67/56/82**, **55/53/57/82**. The original three baselines and race model v1 are not changed. New cars work with jobs, garage activation, tuning and racing. The sedan/wagon profiles remain simple original SVG placeholders, not the final art pass.

## Stock identity, refresh and capacity

Initial stock contains **one individual stock-configured example of each of the six models**. Each has its own advertised ID, year, odometer, engine/body/transmission condition, originality, seller and integer asking price. A model is not an instance: identical models from later batches may have different data and separate owned parts.

The version-1 generator deterministically samples by batch/model/property, not by time or browser RNG. Buyers receive independent copies of the exact advertised instance. The bought listing is removed immediately as part of the same transaction and cannot be purchased again. Buying does not auto-activate a car unless a valid legacy empty garage needs an active vehicle. Available listing IDs cannot collide with any owned vehicle; generated IDs get a deterministic suffix if they encounter a reserved historical ID.

Stock never changes on tab/filter switches, reload, autosave, offline absence or import. The player explicitly confirms **REQUEST NEW STOCK** to replace the remaining unsold offers with a new batch. The first request is available immediately. Later requests have a **5-minute cooldown** from the saved refresh timestamp. Refresh is free, does not affect owned cars/parts/cash or a pending activity and never runs automatically. Unsold old offers are discarded after confirmation. Backwards clocks and timestamp overflow reject refreshing; generation is bounded at 1,000,000. These client-clock safeguards are not anti-cheat.

The initial garage has **12 spaces**. No expansion purchase exists yet. Buying at or above 12 is blocked, but older imported larger garages are kept intact. The serializer's existing overall 1,000-vehicle safety bound remains unchanged. At least one car must remain after a sale; no normal sale strands the player without a vehicle.

## Valuation v1

Each listing stores its asking price; loading does not reprice it. The generator computes the following pristine-reference factors:

- `conditionBps = 4000 + round(average(engine, body, transmission) × 60)`.
- `mileageBps = 10000 − min(3500, floor(odometerKm / 100))`.
- `originalityBps = 9000 + round(effective build originality × 10)`.
- `yearBps = 10000 − min(1200, max(0, latestModelYear − vehicleYear) × 60)`.

Multiply the model's reference yen by all four factors divided by `10000^4` using integer/BigInt arithmetic, then round once to the nearest ¥100 (half up). A deterministic seller premium of 0–4% produces the asking price, rounded up to ¥100. No real-time supply/demand system or speculative clock-based price changes are implemented.

A dealer sale pays **65% of the reference valuation**, rounded down to ¥100, plus **20% of the catalog retail price of all purchased parts belonging to that car**, also rounded down to ¥100. This includes removed/stored upgrades, not just fitted parts. Factory pieces have no separate resale payment. Asking prices exceed stock trade-in offers; a tested 100-batch sweep verifies that immediate buy→sell does not generate profit. Increasing catalog horsepower alone never inflates the reference valuation.

Selling permanently removes the selected owned instance and **all of its purchased parts**. They are not moved to a shared inventory or another car, and the dealer does not relist the sold instance. Old race receipts and records survive without requiring continued ownership of the historical car. Importing an older exported snapshot deliberately restores its older world; this is not a dealer undo function.

## Transaction safety

Commands are pure and use the existing durable-write-before-visible-state session boundary. A failed write cannot charge, pay, delete a car, consume a listing, change the active ID, reset stock or consume the refresh cooldown.

Buying rechecks starter/level/cash/capacity, current stock generation, listing presence, quoted price and unique instance identity. It deducts once, appends the car, removes the listing and updates bounded accounting/receipt data atomically. Buying is permitted during an existing activity because the purchased car is parked; the assigned vehicle/build/deadline remains unchanged.

Selling rechecks ownership, last-car protection, known valuation, assigned-job/race locks, expected full vehicle/active-selection key, quoted amount and safe-integer totals. Selling an **active car requires an explicitly selected remaining replacement** in the confirmation dialog. Selling an inactive car never changes the active ID. A car remains busy until its job/race is actually claimed/settled/cancelled, not merely until its timer ends. Another unassigned spare can be sold while an activity runs. An unfamiliar valid historical model is retained but has no invented dealer valuation.

Confirmation dialogs explain exact price or offer, target ID, condition, mileage and sale consequences. Cancel/Escape does not write. A synchronous click guard and domain stale-transaction checks prevent double confirmation. Other-browser-tab writes continue to trigger global protected-save recovery. The local-save boundary is best effort, not a distributed lock or server-authoritative anti-cheat.

## Filters, presentation and state

Manufacturer, body-type buttons, inclusive year-from/year-to fields and text search combine with AND semantics. An exact year uses the same from/to year. Sort by price, year, mileage or condition, with deterministic ID tie-breaking. Invalid/inverted year ranges show a validation message and no misleading matches. An empty result and reset control restore discoverability. Filtering only returns a copied/sorted array; it never refreshes inventory, buys, sells, changes cash or affects jobs/races.

Stock/sale mode, filter values and dialog state belong to the Market view, not the save. Ordinary tab switches retain useful market preferences; successful import/reset remounts the view and reload opens Garage with defaults. The shared cash/level/REP/XP HUD remains sticky across **seven tabs**. Market and the new dropdown labels show enough instance detail to distinguish multiple examples; no generic `market-v` prefix is used as the only short identifier.

## Save v6

`market: { stockVersion, generation, refreshedAtMs, listings, nextTransactionId, purchasedCount, soldCount, totalSpentYen, totalReceivedYen, lastTrade }` is required in v6. Available listings contain independent full vehicle snapshots. Validation checks bounded arrays, known factory models, matching IDs, uniqueness/collision prevention, allowed production years, safe integer prices/levels/timestamps, empty stock tuning and internally consistent trade counters/receipts. Missing/broken current market fields are rejected, never silently replaced with free initial stock.

Valid v1–v4 data use the unchanged earlier migrations, then v5→v6 adds one unpurchased initial stock batch with no historic trades or refresh anchor. A v5 save's entire previous field set, including tuned parts, paid/unsettled race snapshots, sector times, receipts, money, level and jobs, remains unchanged. The new fixed v5 fixture exercises a tuned Tora with a pending paid Touge race. Frozen v1–v4 fixtures remain untouched. Legacy garages larger than the new purchase capacity are not truncated.

Save export/import/reset include market stock and history. Codes still start with `KAGEHAMA1-`; that prefix versions the transport, not this schema. Import is full replacement, not a merge. No backend/cloud sync, automatic trading, auction, negotiation, vehicle repair, fuel, new damage or police risk is introduced.

## Verification and documentation

Retain the existing 322 unit and 77 browser scenarios, updating only expected new schema fields and navigation for Market. Add market valuation/generation/filter/ownership/transaction/overflow/lock tests, fixed-snapshot migrations, malformed-market protection and production-build browser coverage for buy/sale/refresh/cancel, activity continuity, new-car tuning/racing, stale tabs, storage failures, backups, capacity and 320/390/1440-pixel layouts.

Maintain README, roadmap, changelog and this contract. Compare the clean release tree against the pinned Phase 7 baseline; do not include preparation helpers or packaged dependencies. Verify the exact tree on the phase branch and main Pages workflow before reporting it live. Graphics & Audio I remains explicitly open; next numbered system is Phase 9 — Heat.
