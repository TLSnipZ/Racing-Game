# Phase 11 — Advanced Cars contract

Baseline: `c8c9bcf2850dd18a70094eac26dc36096c2436c2`, released Phase 10 / Save v8. This milestone delivers a small playable specialist acquisition system: one fixed import, one single-player proxy auction, one paid barn-find lead and condition restoration. It does not claim an unlimited auction/discovery economy, multiplayer bidding, real logistics or final artwork. Graphics & Audio I remains open.

## Scope and deliberate limits

Keep eight main tabs. Market now separates **Used dealer / Imports / Auctions / Barn Finds**; Workshop separates **Tuning parts / Restoration**. Normal tab switches retain these views. Successful full import/reset and reload restore the default dealer/parts views. Nothing is bought or started by browsing. Collection Book links point to the correct source rather than suggesting all models appear in dealer stock.

A broker handles **one specialist contract at a time**, independently of the player's job/race/Lay low slot. This lets a delivery proceed while the player works or races, without introducing automatic job chains or passive income. The contract uses a saved deadline and a manual completion. Completion during absence only makes it ready; no automatic acquisition, refund or repetition. A global notice and Market READY badge keep pending contracts reachable from other tabs.

## Three new models and fixed sources

| Model | Manufacturer / body | Production range / offered year | Factory PS / kg | Base grip/handling/braking/reliability | Rarity / source |
| --- | --- | --- | --- | --- | --- |
| Mizuno Sora S | Mizuno / Roadster | 1991–1996 / 1994 | 130 / 970 | 57/73/55/85 | Rare / Import |
| Akari Crest RS | Akari / Sedan | 1997–2000 / 1998 | 210 / 1,380 | 59/57/60/83 | Rare / Auction |
| Hoshino Hachi GT | Hoshino / Coupe | 1972–1976 / 1974 | 112 / 1,010 | 43/57/40/73 | Legendary / Barn |

All three are RWD with naturally aspirated engines and support the existing twelve non-turbo upgrades. RZ-T-only turbo upgrades remain exclusive. The original eight models, original performance ratings, all parts/effects, race model v1 and accepted Heat terms are unchanged. Mizuno is the fourth manufacturer; Roadster is a fifth explicit body type. Rarity does not multiply power or price. The Book now has eleven entries; the original six-model dealer stock and two Icon offers remain separate and unchanged.

The eighteen existing achievements and their rewards are unchanged. The original body-type achievement still requires hatchback, coupe, sedan and wagon: a roadster does not silently substitute for one of those four goals. New specialist purchases record model history, but do not increment the used-market purchase counter or manufacture Icon purchases. Sold model credit and claimed achievement rewards remain monotonic.

### Import — Bayline Import Desk

Level 5, source `sora-import`. **¥165,000 vehicle + ¥15,000 transport = ¥180,000 paid on order**, no extra arrival fee. The offered Sora is 45,000 km, 92/90/91% engine/body/transmission and 99% originality, stock tuning. A saved **90-second** contract reserves the exact advertised car and one garage space. Manual completion delivers that car without changing the active vehicle. Cancelling before collection refunds the entire invoice and releases the reserved space; reordering is allowed. Once actually delivered, the source is permanently used, even after a later dealer sale.

### Auction — East Ward Proxy Auction

Level 6, source `crest-auction`. The offered Crest is 91,000 km, 85/80/84% condition and 94% originality, stock tuning. This is a **deterministic single-player proxy auction** with a disclosed rival maximum, not hidden RNG or a live multiplayer market.

A maximum bid is an integer multiple of **¥5,000**, from **¥190,000** to **¥1,000,000**. The full maximum is deducted into refundable escrow at acceptance and reserves one car space. The auction runs **60 seconds from the first bid**. The rival maximum is **¥220,000**; the player must exceed it by one step. A maximum of ¥225,000 or more wins for exactly **¥225,000**, refunding any unused escrow. A lower maximum, including a tie, loses and refunds **all** escrow. No auction fees or debt are invented.

During the countdown, a separately confirmed raise deducts only the difference between old and new maxima. It never extends the deadline. An accepted bid is binding and cannot be cancelled. After the deadline, settle manually to receive the car/refund; new bids are disabled. A loss permits a later retry of the same fixed lot, not rerolled opponents. A win consumes the source once per save, including after sale. No owned or paid car can be lost by refreshing a page. If an exceptionally large cash balance cannot safely accept a refund, the entire contract remains claimable; spend cash and retry rather than losing the deposit.

### Barn — Old Orchard Lead

Outer Kagehama now opens at **Level 5** with this one implemented lead; Industrial District remains a future preview. City shortcuts also connect Dockside to Imports and East Ward to Auctions. The source-level checks run in the domain, not only on City buttons.

Source `orchard-barn`: pay **¥5,000** for a **45-second** survey. The fee is clearly **non-refundable**, including on cancellation. The lead is fixed, with the eventual car and costs advertised; this is a first documented discovery chain, not a chance roll. A completed survey records discovery but grants **no owned car, collection credit, cash or REP**. Cancelling grants no discovery; another survey requires paying again. A completed survey never needs to be repurchased.

After manual survey completion, a separate optional **¥55,000 recovery/purchase** delivers a 1974 Hachi GT with 246,000 km, 35/28/32% condition and 86% originality. The recovery price includes the car and transport, **not restoration**. Before both payments, show the optional full-restoration estimate. The survey reserves no space and can complete with a full garage; the discovered purchase remains available until the player has money and room. The recovery itself checks capacity, saves the exact vehicle and consumes the source once. The project is not falsely presented as already restored. All its conditions are positive, so it can be used at its existing low-condition performance; repair remains a separate choice.

## Reservations and transaction rules

Paid imports and **all pending auction bids** reserve one garage space until resolved, even when the countdown is ready or the bid is currently losing. Dealer purchases, Icon purchases and recovered-project purchases all count this reservation against the existing twelve-space purchase limit. Surviving oversized legacy garages are never truncated; they simply cannot reserve/buy additional cars while full. The underlying 1,000-vehicle serializer safety bound remains unchanged.

Incoming IDs are chosen deterministically against parked cars, current dealer lots and reserved IDs. Dealer refresh and Icon acquisition also avoid reserved IDs. Quote identity includes the new car and source terms; stale quotes cannot silently buy a different example. Incoming cars are not selectable, raceable or sellable before delivery. Deliveries preserve the active car; a valid legacy empty garage gets its first active ID as in the existing market recovery rule.

Buying, bidding, raising, cancelling, completing and restoration are pure commands behind the existing **durable write before visible state** boundary. Failure cannot debit money, lose escrow, mutate a race, grant discovery, change the active car or clear a pending contract. Duplicate/old IDs and stale bid/vehicle/quote values reject replay. Trade and specialist accounting are separate. Use one browser tab at a time: existing stale-tab detection remains best effort, not a distributed lock or server anti-cheat.

## Restoration — explicit paid condition services

Available from **Level 2** in Workshop. Choose an owned vehicle and an Engine rebuild, Body restoration, Transmission rebuild or Full restoration. Review exact before/after percentages and invoice, then explicitly **PAY & RESTORE**. Service is immediate, not another timed contract. Selected condition fields become **100%**. All purchased/fitted parts, factory hp/weight, name, year, active ID, odometer, originality and existing collection credit remain unchanged. A full restoration is the sum of the three component quotes; already-perfect components cost zero.

Version 1 pricing uses each model's pristine reference valuation, not an inflated tuned-horsepower value. For each selected field:

- deficit in thousandths of a percentage point: `ceil((100 − condition) × 1000)`;
- engine rate 60 basis points, body rate 40, transmission rate 50, **per percentage point**;
- multiply reference yen × deficit × rate / 10,000,000 with integer/BigInt arithmetic;
- round upward to ¥100 and apply a ¥500 minimum for a genuinely damaged component.

A vehicle with a pending delivery job or race cannot be restored until that activity is claimed/settled/cancelled, even if its timer is already ready. A different parked car can be repaired, including during broker work or Heat recovery. Quotes capture the full target car and service, so stale condition/parts/mileage cannot be overwritten. Unknown valid historical models are retained without a guessed service price. No new wear, fuel use, parts sale, engine swap, forced repair or originality restoration is introduced. Better engine/transmission condition affects **future** races through the existing model, never recalculates an accepted snapshot. Immediate acquisition/repair/resale is tested not to generate profit at these first fixed sources.

## Save v9

Required `advanced` state: version 1, next action ID, optional active contract, surveyed barn IDs, acquired source IDs, total paid/refunded yen, restoration count/spend and the last specialist receipt. Accepted contracts keep run ID, kind/source, original start/end, paid amount, refundable escrow and the exact incoming vehicle (null for surveys). All arrays, identifiers, amounts, snapshots and receipt IDs are bounded/validated; owned/listed/reserved ID collisions are rejected. Acquired sources require corresponding persisted collection credit, which survives sale. Current missing/malformed data is rejected, never reset to renew a source or refund.

Valid v1–v8 saves migrate through their original chain, then add **only empty specialist state**. Every old v8 field remains identical, including collection/claim/Icon ledgers, dealer stock, tuning, cash, levels, jobs, accepted Underground races, Heat alerts and Lay low deadlines. The frozen v8 regression world is emitted through the released game commands/serializer with a deterministic test balance and a paid Underground race. All earlier fixtures remain byte-for-byte untouched. A mislabeled old save cannot silently discard a nonempty specialist ledger.

`KAGEHAMA1-` and `kagehama:save` do not change. Full import/reset includes escrow, contracts, discovery and one-time sources, not a partial merge or undo. Importing an older code deliberately restores its older world. No cloud sync or protection against intentionally edited client saves is claimed.

## Verification and next scope

Retain all previous regression scenarios, adapting only new schema fields, increased Book/catalog counts and the now-implemented Outer Kagehama gate. Add import cancellation/exact delivery, proxy bid/raise/win/loss/refund, survey/optional recovery, capacity across all acquisition routes, condition quotes, assigned-car protection, failed/stale/duplicate writes, clock rollback/overflow, exact old-save equality, source history and full code round-trips. Exercise actual browser controls, simultaneous driver/broker work, production build, keyboard reachability and 320/390/1440px layouts including fallback fonts. Review screenshots before publishing the clean tested tree.

Update README, roadmap and changelog with the release. **Next numbered system: Phase 12 — Empire & Automation.** Garage expansions, businesses, managers, repeatable delegated work and capped offline production are not secretly implemented by this phase. More specialist offers, competitive bidding and additional discovery locations remain extensions, not claims about the initial three-source slice. Final art/audio remains open.
