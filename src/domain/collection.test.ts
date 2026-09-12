import { describe, expect, it } from 'vitest';
import { Buffer } from 'node:buffer';
import v7 from '../../tests/fixtures/save-v7.json';
import v1 from '../../tests/fixtures/save-v1.json';
import v2 from '../../tests/fixtures/save-v2.json';
import v3 from '../../tests/fixtures/save-v3.json';
import v4 from '../../tests/fixtures/save-v4.json';
import v5 from '../../tests/fixtures/save-v5.json';
import v6 from '../../tests/fixtures/save-v6.json';
import { ACHIEVEMENTS, findAchievement } from '../data/achievements';
import { ICON_OFFERS } from '../data/collection';
import { VEHICLE_CATALOG, USED_VEHICLE_CATALOG, findVehicleDefinition } from '../data/vehicles';
import { createNewGameState, createPlayerVehicle, purchaseStarter } from './game';
import { recordCollectionProgress, getAchievementProgress, getClaimableAchievements, getCollectedModelIds, getTotalCollectionRewards, isCollectionState, migrateCollection } from './collectionProgress';
import { claimAchievement, createIconVehicle, getIconRequirement, purchaseIcon } from './collection';
import { createBookFilters, listCollectionModels } from './collectionFilters';
import { buyMarketVehicle, sellMarketVehicle, getVehicleSaleKey, refreshMarket } from './market';
import { getVehicleValuation } from './marketValue';
import { createMarketListings, GARAGE_CAPACITY } from './marketStock';
import { getVehicleBuildStats, installPart, removePart } from './tuning';
import { startJob, claimJob, cancelJob } from './economy';
import { getRaceBuildKey, startRace, settleRace, cancelRace } from './racing';
import { startLayLow, finishLayLow, cancelLayLow } from './heat';
import { SAVE_VERSION, deserializeSave, serializeSave, importSaveCode, exportSaveCode, isGameState, loadFromStorage } from './persistence';
import type { GameState } from './types';
const initial = () => purchaseStarter(createNewGameState(), 'pico-rs', 'first');
const rich = () => ({ ...initial(), playerLevel: 8, reputation: 560, cashYen: 1000000 });
const progress = (state: GameState, id: string) => getAchievementProgress(state, findAchievement(id)!);
function buy(state: GameState, id: string) { const listing = state.market.listings.find((entry) => entry.vehicle.catalogId === id)!; return buyMarketVehicle(state, listing.id, state.market.generation, listing.askingPriceYen); }
function sell(state: GameState, id: string) { const car = state.ownedVehicles.find((v) => v.instanceId === id)!; return sellMarketVehicle(state, id, getVehicleSaleKey(car, state.activeVehicleId), getVehicleValuation(car).offerYen, id === state.activeVehicleId ? state.ownedVehicles.find((v) => v.instanceId !== id)!.instanceId : null); }
function trio() { return buy(buy(rich(), 'tora-85'), 'rz-t'); }
function finishRace(state: GameState, eventId: string) { const car = state.ownedVehicles[0]; const pending = startRace(state, eventId, car.instanceId, getRaceBuildKey(car), 1000); return settleRace(pending, pending.racing.activeRace!.runId, pending.racing.activeRace!.finishesAtMs); }
function fourCorners() { return ['east-ward-shakedown', 'dockyard-402', 'hakuro-intro', 'eastline-entry'].reduce(finishRace, rich()); }
const raw = (state: unknown, version = SAVE_VERSION) => JSON.stringify({ version, savedAt: 1000, state });

describe('Model history and four non-mechanical rarity tiers', () => {
  it('has eleven unique models, four rarity tiers, exactly six dealer models and two separate Icons', () => {
    expect(VEHICLE_CATALOG).toHaveLength(11); expect(new Set(VEHICLE_CATALOG.map((m) => m.id)).size).toBe(11);
    expect(USED_VEHICLE_CATALOG).toHaveLength(6); expect(ICON_OFFERS).toHaveLength(2);
    expect(new Set(VEHICLE_CATALOG.map((m) => m.rarity)).size).toBe(4);
    expect(findVehicleDefinition('tora-85')!.hp).toBeLessThan(findVehicleDefinition('pico-r')!.hp);
    expect(findVehicleDefinition('tora-85')!.rarity).toBe('legendary');
  });
  it('a fresh game has no discoveries, no achievements, no gifts and the original six-offer lot', () => {
    const state = createNewGameState(); expect(getCollectedModelIds(state)).toEqual([]);
    expect(getClaimableAchievements(state)).toEqual([]); expect(state.cashYen).toBe(50000);
    expect(state.market.listings).toHaveLength(6); expect(state.ownedVehicles).toHaveLength(0);
  });
  it('a starter records only its model and badge, without paying the pending achievement reward', () => {
    const state = initial(); expect(state.cashYen).toBe(18000); expect(state.reputation).toBe(0);
    expect(state.collection.collectedModelIds).toEqual(['pico-rs']); expect(state.collection.unlockedAchievementIds).toEqual(['first-ride']);
    expect(state.collection.claimedAchievementIds).toEqual([]); expect(recordCollectionProgress(state)).toBe(state);
  });
  it('failed purchases never record a model, unlock a goal, mutate the source or use an offer', () => {
    const state = initial(); const before = structuredClone(state);
    expect(() => buy(state, 'rz-t')).toThrow('cash'); expect(state).toEqual(before);
  });
  it('counts duplicate instances in the garage but only one model in the book', () => {
    const state = buy(rich(), 'pico-rs'); expect(state.ownedVehicles).toHaveLength(2);
    expect(state.collection.collectedModelIds).toEqual(['pico-rs']); expect(progress(state, 'starter-trio').value).toBe(1);
  });
  it('sale retains model history, earned goals and claimed rewards', () => {
    let state = trio(); state = claimAchievement(state, 'starter-trio'); const before = state.collection;
    state = sell(state, state.ownedVehicles[1].instanceId); state = sell(state, state.ownedVehicles[1].instanceId);
    expect(state.ownedVehicles).toHaveLength(1); expect(state.collection.collectedModelIds).toEqual(before.collectedModelIds);
    expect(progress(state, 'starter-trio')).toMatchObject({ unlocked: true, claimed: true, value: 3 });
  });
  it('viewing stock and rival grids never counts the rival models as owned', () => {
    const raced = finishRace(rich(), 'east-ward-shakedown'); expect(raced.collection.collectedModelIds).toEqual(['pico-rs']);
    const next = refreshMarket(raced, raced.market.generation, 100000); expect(next.collection.collectedModelIds).toEqual(['pico-rs']);
  });
  it('captures a known currently-owned model before a destructive sale even in an incomplete imported ledger', () => {
    const state = rich(); state.ownedVehicles.push(createPlayerVehicle('tora-85', 'imported-tora'));
    const after = sell(state, 'imported-tora'); expect(after.collection.collectedModelIds).toContain('tora-85');
    expect(state.collection.collectedModelIds).not.toContain('tora-85');
  });
  it('book filters combine without modifying the game and distinguish sold from current ownership', () => {
    let state = trio(); state = sell(state, state.ownedVehicles.find((c) => c.catalogId === 'tora-85')!.instanceId);
    const before = serializeSave(state, 1000);
    expect(listCollectionModels(state, { ...createBookFilters(), manufacturer: 'hoshino', rarity: 'legendary', status: 'collected' }).map((m) => m.id)).toEqual(['tora-85']);
    expect(listCollectionModels(state, { ...createBookFilters(), status: 'owned' })).toHaveLength(2);
    expect(listCollectionModels(state, { ...createBookFilters(), status: 'missing' })).toHaveLength(8);
    expect(listCollectionModels(state, { ...createBookFilters(), query: 'does not exist' })).toEqual([]);
    expect(serializeSave(state, 1000)).toBe(before);
  });
  it('keeps the exact released stock samples after extending the catalog; Icons never enter ordinary batches', () => {
    expect(createMarketListings(1, v7.state.ownedVehicles.map((c) => c.instanceId))).toEqual(v7.state.market.listings);
    for (let generation = 0; generation < 50; generation++) {
      const stock = createMarketListings(generation); expect(stock).toHaveLength(6);
      expect(stock.every((l) => findVehicleDefinition(l.vehicle.catalogId)!.acquisition === 'used-market')).toBe(true);
    }
  });
});

describe('Achievements and exact-once manual reward claims', () => {
  it('defines 18 unique bounded fixed prizes with visible criteria', () => {
    expect(ACHIEVEMENTS).toHaveLength(18); expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(18);
    for (const item of ACHIEVEMENTS) { expect(item.requirement.length).toBeGreaterThan(10); expect(item.target).toBeGreaterThan(0); expect(Number.isSafeInteger(item.rewardYen)).toBe(true); }
  });
  it.each(ACHIEVEMENTS)('$id historical badge remains earned even after its live criterion goes away', (item) => {
    const state = initial(); state.collection.unlockedAchievementIds.push(...(item.id === 'first-ride' ? [] : [item.id]));
    expect(progress(state, item.id)).toMatchObject({ unlocked: true, claimable: true, percent: 100 });
    const after = claimAchievement(state, item.id); expect(after.cashYen).toBe(state.cashYen + item.rewardYen);
    expect(after.reputation).toBe(state.reputation); expect(after.racing).toBe(state.racing); expect(after.economy).toBe(state.economy);
    expect(progress(after, item.id).claimed).toBe(true); expect(() => claimAchievement(after, item.id)).toThrow('already');
  });
  it.each(['unknown', '', 'first-win'])('rejects unavailable reward %s without mutation', (id) => {
    const state = initial(); const before = structuredClone(state); expect(() => claimAchievement(state, id)).toThrow(); expect(state).toEqual(before);
  });
  it('overflowing claims cannot spend the reward or consume its ID', () => {
    const state = { ...initial(), cashYen: Number.MAX_SAFE_INTEGER }; const before = structuredClone(state);
    expect(() => claimAchievement(state, 'first-ride')).toThrow('safe cash'); expect(state).toEqual(before);
  });
  it('does not count ready or cancelled jobs, and stamps the fifth claim without automatic extra cash', () => {
    let state = initial();
    for (let i=0;i<4;i++) { state = startJob(state,'garage-shift',1000); state = claimJob(state,state.economy.activeJob!.runId,16000); }
    const pending = startJob(state,'garage-shift',20000); expect(progress(pending,'five-jobs').unlocked).toBe(false);
    const cancelled = cancelJob(pending,pending.economy.activeJob!.runId); expect(progress(cancelled,'five-jobs').unlocked).toBe(false);
    const after = claimJob(pending,pending.economy.activeJob!.runId,35000); expect(progress(after,'five-jobs').claimable).toBe(true);
    expect(after.cashYen).toBe(pending.cashYen + 1500);
  });
  it('records four fitted slots, retains it after stock restoration and sale, and never stacks repeat rewards', () => {
    let state = rich();
    for (const id of ['aoba-panel-filter','aoba-catback','aoba-balanced-ecu','aoba-street-tires']) state = installPart(state,'first',id,null);
    expect(progress(state,'four-slots').unlocked).toBe(true);
    state = removePart(state,'first','intake','aoba-panel-filter'); expect(progress(state,'four-slots').unlocked).toBe(true);
    state = claimAchievement(state,'four-slots'); state = installPart(state,'first','aoba-panel-filter',null);
    expect(() => claimAchievement(state,'four-slots')).toThrow('already');
  });
  it('four discipline finishes unlock the invitation regardless of finishing position; withdrawing does not count', () => {
    const state = fourCorners(); expect(progress(state,'four-corners').value).toBe(4); expect(isGameState(state)).toBe(true);
    const pending = startRace(rich(),'east-ward-shakedown','first',getRaceBuildKey(rich().ownedVehicles[0]),1000);
    expect(progress(cancelRace(pending,1),'first-race').unlocked).toBe(false);
  });
  it('a completed Lay low unlocks its badge but ready/cancelled pauses do not', () => {
    const state = { ...rich(), heat: { ...rich().heat, value: 40 } };
    const pending = startLayLow(state,40,1,1000); expect(progress(pending,'lay-low').unlocked).toBe(false);
    expect(progress(cancelLayLow(pending,1),'lay-low').unlocked).toBe(false);
    const next = finishLayLow(pending,1,61000); expect(progress(next,'lay-low').claimable).toBe(true);
    expect(next.cashYen).toBe(state.cashYen);
  });
  it('claiming during a job, risky race, police alert or Lay low leaves every activity snapshot intact', () => {
    const basic = rich(); const job = startJob(basic,'garage-shift',1000);
    const risky = startRace({ ...basic, heat: { ...basic.heat, value: 40 } },'dockyard-402','first',getRaceBuildKey(basic.ownedVehicles[0]),1000,'underground',40);
    const alert = cancelRace(risky,1); const pause = startLayLow(alert,alert.heat.value,1,10000);
    for (const state of [job,risky,alert,pause]) {
      const next = claimAchievement(state,'first-ride'); expect(next.heat).toEqual(state.heat); expect(next.economy).toEqual(state.economy);
      expect(next.racing).toEqual(state.racing); expect(next.market).toEqual(state.market); expect(isGameState(next)).toBe(true);
    }
  });
});

describe('Milestone Icon purchases', () => {
  it.each(ICON_OFFERS)('buys the exact $id car once with no active swap or dealer-stock change', (offer) => {
    const state = offer.id === 'heritage-commission' ? trio() : fourCorners(); const before = structuredClone(state);
    expect(getIconRequirement(state,offer)).toBeNull(); const expected = createIconVehicle(state,offer);
    const after = purchaseIcon(state,offer.id,offer.priceYen);
    expect(after.ownedVehicles.at(-1)).toEqual(expected); expect(after.cashYen).toBe(state.cashYen-offer.priceYen);
    expect(after.activeVehicleId).toBe(state.activeVehicleId); expect(after.market).toEqual(state.market);
    expect(after.collection.purchasedIconIds).toEqual([offer.id]); expect(after.collection.collectedModelIds).toContain(offer.catalogId);
    expect(after.collection.claimedAchievementIds).toEqual([]); expect(isGameState(after)).toBe(true); expect(state).toEqual(before);
    expect(() => purchaseIcon(after,offer.id,offer.priceYen)).toThrow('already');
  });
  it.each(ICON_OFFERS)('$id can be tuned, raced, exported and sold without recreating its one-time offer', (offer) => {
    let state = purchaseIcon(offer.id === 'heritage-commission' ? trio() : fourCorners(),offer.id,offer.priceYen);
    const id = state.ownedVehicles.at(-1)!.instanceId; const price = getVehicleValuation(state.ownedVehicles.at(-1)!).offerYen;
    expect(price + findAchievement('first-icon')!.rewardYen).toBeLessThan(offer.priceYen);
    state = installPart(state,id,'aoba-panel-filter',null); expect(getVehicleBuildStats(state.ownedVehicles.at(-1)!).powerPs).toBeGreaterThan(findVehicleDefinition(offer.catalogId)!.hp);
    expect(() => installPart(state,id,'kurogane-big-turbo',null)).toThrow('compatible');
    state = startRace(state,'east-ward-shakedown',id,getRaceBuildKey(state.ownedVehicles.at(-1)!),1000);
    expect(() => sell(state,id)).toThrow('assigned');
    state = settleRace(state,state.racing.activeRace!.runId,state.racing.activeRace!.finishesAtMs);
    state = sell(state,id); expect(state.collection.collectedModelIds).toContain(offer.catalogId);
    expect(() => purchaseIcon(state,offer.id,offer.priceYen)).toThrow('already'); expect(importSaveCode(exportSaveCode(state)).state).toEqual(state);
  });
  it.each([
    ['starter', () => createNewGameState(), 'starter'],
    ['level', () => ({ ...trio(), playerLevel: 5 }), 'Level 6'],
    ['goal', () => rich(), 'Three Bad Decisions'],
    ['cash', () => ({ ...trio(), cashYen: 179999 }), 'cash'],
    ['full garage', () => { const s=trio(); while(s.ownedVehicles.length<GARAGE_CAPACITY)s.ownedVehicles.push(createPlayerVehicle('pico-rs',`extra-${s.ownedVehicles.length}`)); return s; }, 'Garage full'],
  ] as const)('blocks unmet %s requirement and preserves the offer', (_name,make,message) => {
    const state=make(); const before=structuredClone(state); expect(()=>purchaseIcon(state,'heritage-commission',180000)).toThrow(message); expect(state).toEqual(before);
  });
  it('rejects unknown offers and stale quotes', () => {
    const state=trio(); expect(()=>purchaseIcon(state,'unknown',0)).toThrow('Unknown'); expect(()=>purchaseIcon(state,'heritage-commission',1)).toThrow('changed');
  });
  it('handles a reserved historical instance ID without overwriting the parked car', () => {
    const state=trio(); state.ownedVehicles[0].instanceId='icon-v1:heritage-commission'; state.activeVehicleId=state.ownedVehicles[0].instanceId;
    const next=purchaseIcon(state,'heritage-commission',180000); expect(next.ownedVehicles.at(-1)!.instanceId).toBe('icon-v1:heritage-commission:1'); expect(next.ownedVehicles[0]).toEqual(state.ownedVehicles[0]);
  });
  it('spares larger valid legacy garages, blocking only new acquisitions', () => {
    const state=trio(); while(state.ownedVehicles.length<13)state.ownedVehicles.push(createPlayerVehicle('pico-rs',`extra-${state.ownedVehicles.length}`));
    expect(isGameState(state)).toBe(true); expect(()=>purchaseIcon(state,'heritage-commission',180000)).toThrow('Garage full'); expect(state.ownedVehicles).toHaveLength(13);
  });
});

describe('Save v8 and historical evidence', () => {
  it('preserves EVERY v7 field, including risk, market and deadlines, with no retrospective payout', () => {
    const before=JSON.stringify(v7); const next=deserializeSave(before); const {collection,advanced:_advanced,...old}=next.state;
    expect(next.version).toBe(9); expect(next.savedAt).toBe(v7.savedAt); expect(old).toEqual(v7.state); expect(JSON.stringify(v7)).toBe(before);
    expect(collection.collectedModelIds).toEqual(['tora-85','pico-rs']); expect(collection.unlockedAchievementIds).toEqual(expect.arrayContaining(['first-ride','five-jobs','night-shift','first-part','first-race','first-purchase']));
    expect(collection.claimedAchievementIds).toEqual([]); expect(collection.purchasedIconIds).toEqual([]);
    expect(importSaveCode('KAGEHAMA1-'+Buffer.from(before).toString('base64url')).state).toEqual(next.state);
  });
  it.each([v1,v2,v3,v4,v5,v6,v7])('migration of genuine v$version preserves all previous evidence, never guesses sold models or pays money', (fixture) => {
    const next=deserializeSave(JSON.stringify(fixture)).state;
    expect(next.cashYen).toBe(fixture.state.cashYen); expect(next.collection.claimedAchievementIds).toEqual([]); expect(next.collection.purchasedIconIds).toEqual([]);
    const playerIds=[...fixture.state.ownedVehicles.map(c=>c.catalogId), fixture.state.selectedStarterId];
    const historicalRacing = (fixture.state as { racing?: GameState['racing'] }).racing;
    if(historicalRacing?.lastResult) playerIds.push(historicalRacing.lastResult.race.entrants[3].catalogId);
    expect([...next.collection.collectedModelIds].sort()).toEqual([...new Set(playerIds)].sort());
  });
  it('does not guess a sold model from a vehicle name or from a number of market sales', () => {
    const state=rich(); const car=buy(state,'senda-s').ownedVehicles.at(-1)!;
    const history=sell(buy(state,'senda-s'),car.instanceId); const {collection:_collection,...old}=history;
    const migrated=migrateCollection(old); expect(migrated.collection.collectedModelIds).not.toContain('senda-s');
    expect(progress({ ...migrated, advanced: state.advanced },'first-sale').unlocked).toBe(true);
  });
  it('unknown historical models are kept without an invented rarity or dealer offer', () => {
    const old=structuredClone(v7); old.state.ownedVehicles[1].catalogId='unknown-historical';
    const next=deserializeSave(JSON.stringify(old)).state; expect(next.ownedVehicles[1].catalogId).toBe('unknown-historical'); expect(next.collection.collectedModelIds).not.toContain('unknown-historical');
  });
  it('roundtrips latched badges, claims, sold discoveries and Icon purchases without duplicate rewards', () => {
    let state=purchaseIcon(trio(),'heritage-commission',180000); state=claimAchievement(state,'first-icon'); state=sell(state,state.ownedVehicles.at(-1)!.instanceId);
    let copy=state;for(let i=0;i<12;i++)copy=importSaveCode(exportSaveCode(copy)).state;
    expect(copy).toEqual(state); expect(getTotalCollectionRewards(copy)).toBe(10000); expect(()=>claimAchievement(copy,'first-icon')).toThrow('already');
  });
  it.each([undefined,null,{}, { collectedModelIds: [], unlockedAchievementIds: [], claimedAchievementIds: [] },
    { collectedModelIds: ['ghost'], unlockedAchievementIds: [], claimedAchievementIds: [], purchasedIconIds: [] },
    { collectedModelIds: ['pico-rs','pico-rs'], unlockedAchievementIds: [], claimedAchievementIds: [], purchasedIconIds: [] },
    { collectedModelIds: [], unlockedAchievementIds: ['fake'], claimedAchievementIds: [], purchasedIconIds: [] },
    { collectedModelIds: [], unlockedAchievementIds: [], claimedAchievementIds: ['first-ride'], purchasedIconIds: [] },
    { collectedModelIds: [], unlockedAchievementIds: [], claimedAchievementIds: [], purchasedIconIds: ['heritage-commission'] },
    { collectedModelIds: [], unlockedAchievementIds: ['first-ride'], claimedAchievementIds: ['first-ride','first-ride'], purchasedIconIds: [] },
  ])('rejects malformed current collection data instead of resetting it: %j', (collection) => {
    expect(isCollectionState(collection)).toBe(false); const source=raw({...initial(),collection}); expect(()=>deserializeSave(source)).toThrow();
    const store={getItem:()=>source}; expect(()=>loadFromStorage(store)).toThrow(); expect(store.getItem()).toBe(source);
  });
  it('fresh reset clears histories and offer use but does not give free Icons or achievements', () => {
    const state=createNewGameState(); expect(Object.values(state.collection).every(ids=>ids.length===0)).toBe(true); expect(isGameState(state)).toBe(true);
  });
  it('rejects achievements on a pre-starter new-game state', () => {
    const state=createNewGameState(); state.collection.unlockedAchievementIds=['first-ride']; expect(isGameState(state)).toBe(false);
  });
});
