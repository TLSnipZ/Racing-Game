# Phase 13A — Rival Crews & Bosses

Baseline: `ad95122ba573256a2556aef1b03971df9be218a6`, released Phase 12 / Save v10. This is the **first bounded Endgame chapter**, not completion of every Phase 13+ idea. Four crew challenges and a finale add progression without a prestige reset, lost cars, expiring seasons or new property requirements. Graphics & Audio I remains open.

## Invitations and payouts

The existing nine root tabs stay. **Races → Open events / Rival Crews** separates the eight original invitations from five new Boss events. Both boards use the same chosen race car, active-race slot, briefing, deterministic model-v1 simulation, replay, settlement, mileage and record systems. A City shortcut opens the crew board; existing district shortcuts intentionally restore Open events with the matching filter.

| Crew / boss | Discipline | Player level and invitation | Entry each attempt | Race prize for first | Separate one-time title bonus |
| --- | --- | --- | ---: | ---: | ---: |
| Ironline / Daichi | Drag | Level 6 + a settled podium in Dockyard Redline | ¥4,000 | ¥12,000 | ¥20,000 |
| Lantern Pact / Ayame | Touge | Level 8 + a settled podium in Hakuro Switchback Club | ¥5,000 | ¥15,000 | ¥30,000 |
| Black Static / Souta | Street Sprint | Level 10 + a settled podium in Ward Club Circuit | ¥6,000 | ¥18,000 | ¥45,000 |
| Zero Meridian / Kaede | Expressway | Level 12 + a settled podium in Eastline Midnight Club | ¥8,000 | ¥23,000 | ¥60,000 |
| Midnight Council / Shin | Mixed-sector Sprint finale | Level 14 + all four settled crew wins | ¥10,000 | ¥30,000 | ¥125,000 |

A **podium is first, second or third** in the exact named Club qualifier. Merely starting or finishing the timer is not a settled result. Existing qualifying records count; nobody must repeat a proved podium after this update. The first four crews can be challenged in any order once each level/qualifier pair is met. The finale requires all four wins, not their cash claims. Buttons allow free inspection of locked terms and provide the real Club briefing as a shortcut; the shared **domain entry command** enforces the requirements again.

Each boss leads a three-car crew grid. A defeat means **first place overall**, not simply beating an associate. The existing stable grid-order tie rule applies: equal times do not give the fourth-starting player first place. Enemies use fixed copied builds; viewing, reloading and retrying do not reroll them. All five use **Standard stakes only**, with no additional Heat or patrol debt. Existing patrol or Lay low restrictions still block a new race; these challenges are not a police bypass. The original seven Underground-enabled events remain unchanged.

All four placements' gross prizes and net after entry are shown before confirmation. A poor finish can lose money relative to the fee. Withdrawal never refunds the entry fee, awards a win or earns the title bonus. Replay remains available for the ordinary posted race prizes, never another title bonus.

| Event ID | Playback + countdown | Settled distance | Gross yen, places 1–4 | REP, places 1–4 |
| --- | ---: | ---: | --- | --- |
| rival-ironline | 33s | 1 km | 12,000 / 6,500 / 4,000 / 1,500 | 36 / 22 / 12 / 6 |
| rival-lantern | 43s | 8 km | 15,000 / 8,000 / 5,000 / 2,000 | 40 / 25 / 14 / 7 |
| rival-static | 43s | 9 km | 18,000 / 9,500 / 6,000 / 2,500 | 48 / 30 / 18 / 9 |
| rival-meridian | 48s | 24 km | 23,000 / 12,500 / 8,000 / 3,000 | 56 / 35 / 21 / 10 |
| rival-midnight-council | 53s | 16 km | 30,000 / 16,000 / 10,000 / 4,000 | 72 / 45 / 26 / 12 |

## Titles, rewards and non-destructive progression

Five stable achievements extend the existing catalog from **18 to 23**, with category **Rival Crews**. The original eighteen IDs, goals and payouts are unchanged. New IDs are `crew-ironline`, `crew-lantern`, `crew-static`, `crew-meridian`, `crown-midnight`.

The titles are **Launch Authority**, **Keeper of the Pass**, **Ward Headliner**, **After-Hours Authority** and **Kagehama Night Champion**. The board displays the highest-numbered completed challenge's title, rather than inventing a second player level or a mutable title inventory. The five-step campaign progress derives from recorded wins. A title is recognition, not a car-stat modifier, business multiplier or new unlock currency.

The existing pure collection observer records the corresponding achievement **after successful race settlement**, without paying it. **Claim title bonus** on the crew board and **Claim** in Collection address the exact same achievement ID and same claim command. Paying through one view disables the other; claiming, selling the winning car, reloading, restoring stock or losing a replay never renews a reward. Total first-title rewards are ¥280,000, kept in Collection reward accounting, not added to historical race income. These bonus claims add no REP or mileage.

Defeating the Council displays chapter completion. It does **not** clear cash, cars, parts, Heat, managers, business output, garage expansions, dealer stock, specialist sources or Icon offers. No cars are automatically won or removed. Additional crew functionality, seasons, catalog expansion and any Legacy/Prestige restart remain later milestones, with explicit reset/preservation and export/confirmation contracts required first.

## Balance and attainable builds

This is provisional game balance. The eight open events, all original cars/parts, race model v1 and production rules v1 are byte/behavior preserved. New bosses use explicit ratings, not rarity multipliers. Their repeated prizes do not replace the fastest active income route or scale passive earnings. Entry and first-win bonuses are separate, so nobody should mistake a one-time bonus for a repeatable profit rate.

The test matrix uses **currently obtainable models and compatible parts only**, with 100% mechanical condition. Every boss has at least two winning model/build combinations. A restored, fully equipped RZ-T wins Ironline and Zero Meridian but loses the technical Lantern run. A fully equipped Pico R can win Lantern, Black Static and the Council. The first five fights can therefore be completed with the original turbo starter plus a used-market hatch: neither an Icon offer nor a once-only specialist source is compulsory. Conversely, a fully equipped Kestrel wins fast events but does not automatically beat Lantern's technical setup. The tests generate purchases, fitments, condition repairs and results through existing domain commands after setting an explicit test-only level/budget; production never grants that budget or bypass.

## Save compatibility: v10 unchanged

**No new state fields are necessary. Save v10, `KAGEHAMA1-` and `kagehama:save` remain unchanged.** Crew wins reuse `racing.records`, and manual title payouts reuse `collection.unlockedAchievementIds` / `claimedAchievementIds`. All existing migrations remain untouched. A frozen genuine released-v10 fixture includes running managers, partially collected income, an expansion, a paid import and a paid Underground race; reading it after this update preserves every field exactly.

The known race registry now contains thirteen events. Open-event lists and district browsing deliberately retain their original eight. Validation accepts bounded records/snapshots for the five new IDs and still rejects unknown IDs, altered simulation times and malformed claims. The original race snapshot model and all saved entrants, timing, fees, bonuses and Heat liabilities are unchanged. No current build recalculates an accepted race based on a repaired car or new catalog rival.

This is an additive content expansion, not an entitlement service. An older deployed app that lacks the new event/achievement IDs may reject a save which already contains them; update that app rather than resetting or deleting its protected save. Deliberately importing an older code restores its older world, as before. Local clocks and edited client codes are user-controlled; this is not server-authoritative anti-cheat.

A finished or imported pending boss remains settleable even when the player's level later falls below its entry gate; entry requirements never trap already-paid results. One driver still means one job OR race OR Lay low. Brokers and businesses can continue independently. Source escrow, capacity reservations, business anchors and till balances are preserved through entry, withdrawal, settlement and title claims. Durable storage succeeds before any visible debit or reward; failed/stale/duplicate commands retain the original state. Cash overflow cannot consume the achievement reward or unfinished result.

## UI and verification

The board has text-labelled invitation goals, completion status, crew/boss identity, build guidance, explicit money terms, personal bests and clear claimed/claimable buttons. The chosen car and board remain during ordinary root-tab changes. Successful import/reset/reload defaults to Open events; pending races remain outside the board filters, with the existing READY badge. Cash, level, XP and Heat remain sticky. Locked previews, native dialogs, keyboard operation, narrow-screen layout and fallback fonts are tested. There are no final boss portraits, cinematic roads or sound effects implied by these UI panels.

Keep prior suites, adjusting only the total achievement count. New regressions cover full registry history, exact old-event hash, each entry gate, all five beatable fights, settled-versus-ready status, one-time shared claims, losses/withdrawal, replay, no-Icon completion, stale/duplicate/overflow commands, v10 round-trip/field equality, storage failure, paid-result recovery at lower levels, ongoing broker/manager independence and 320/390/1440px views. Browser verification runs on the phase branch before publishing; main deployment must also succeed before reporting live.
