import { describe, expect, it } from 'vitest';
import { Buffer } from 'node:buffer';
import v8 from '../../tests/fixtures/save-v8.json';
import { ADVANCED_OFFERS, findAdvancedOffer, getAuctionClearingPrice } from '../data/advancedCars';
import { VEHICLE_CATALOG, USED_VEHICLE_CATALOG, findVehicleDefinition, MANUFACTURERS, BODY_TYPES } from '../data/vehicles';
import { ICON_OFFERS } from '../data/collection';
import { PARTS, isPartCompatible } from '../data/parts';
import { startSpecialistContract, finishSpecialistContract, cancelSpecialistContract, raiseProxyBid, buyBarnVehicle,
  getSpecialistRequirement, getSpecialistQuoteKey, createIncomingVehicle, getBarnBuyRequirement } from './advanced';
import { createAdvancedState } from './advancedState';
import { isSpecialistReady } from './advancedRules';
import { createNewGameState, purchaseStarter, createPlayerVehicle } from './game';
import { restoreVehicle, getRestorationQuote, getRestorationRequirement } from './restoration';
import { getOccupiedGarageSpaces, getReservedVehicleIds } from './garageCapacity';
import { buyMarketVehicle, getBuyRequirement, refreshMarket, sellMarketVehicle, getVehicleSaleKey } from './market';
import { getVehicleValuation } from './marketValue';
import { getIconRequirement } from './collection';
import { recordCollectionProgress, getCollectedModelIds } from './collectionProgress';
import { installPart, getVehicleBuildStats } from './tuning';
import { startJob, claimJob } from './economy';
import { startRace, getRaceBuildKey } from './racing';
import { deserializeSave, exportSaveCode, importSaveCode, isGameState, SAVE_VERSION, serializeSave } from './persistence';
import type { GameState } from './types';
import type { RestorationService } from './advancedTypes';
const rich = (): GameState => ({ ...purchaseStarter(createNewGameState(), 'pico-rs', 'first'), cashYen: 2000000, playerLevel: 8, reputation: 560 });
const start = (s = rich(), id = 'sora-import', now = 1000, bid = 225000) => startSpecialistContract(s, id, getSpecialistQuoteKey(s, findAdvancedOffer(id)!), now, bid);
const finish = (s: GameState) => finishSpecialistContract(s, s.advanced.activeContract!.runId, s.advanced.activeContract!.finishesAtMs);
function buyBarn(s: GameState) { return buyBarnVehicle(s, 'orchard-barn', getSpecialistQuoteKey(s, findAdvancedOffer('orchard-barn')!)); }
const restored = (s: GameState, id = 'first', service: RestorationService = 'full') => {
  const q = getRestorationQuote(s.ownedVehicles.find((v) => v.instanceId === id)!, service);
  return restoreVehicle(s, id, service, q.key, q.costYen);
};
function sell(s: GameState, id: string) {
  const v = s.ownedVehicles.find((v) => v.instanceId === id)!;
  return sellMarketVehicle(s,id,getVehicleSaleKey(v,s.activeVehicleId),getVehicleValuation(v).offerYen,null);
}

describe('Version 1 advanced sources and immutable catalog', () => {
  it('adds three explicit sources, a fourth maker and a roadster without changing six-car dealer stock or two Icons', () => {
    expect(VEHICLE_CATALOG).toHaveLength(11); expect(USED_VEHICLE_CATALOG).toHaveLength(6); expect(ICON_OFFERS).toHaveLength(2);
    expect(MANUFACTURERS.mizuno).toBe('Mizuno'); expect(BODY_TYPES.roadster).toBe('Roadster');
    expect(ADVANCED_OFFERS.map((o) => o.kind)).toEqual(['import','auction','survey']);
    for (const o of ADVANCED_OFFERS) { const m = findVehicleDefinition(o.catalogId)!; expect(m.marketLevel).toBe(o.minLevel); expect(o.year).toBeGreaterThanOrEqual(m.years[0]); expect(o.year).toBeLessThanOrEqual(m.years[1]); }
  });
  it.each(ADVANCED_OFFERS)('$catalogId has factory stats, all non-turbo parts and no unsupported turbo retrofit', (o) => {
    const v = createIncomingVehicle(rich(),o); const m = findVehicleDefinition(o.catalogId)!;
    expect(v.hp).toBe(m.hp); expect(getVehicleBuildStats(v).powerPs).toBe(m.hp);
    expect(PARTS.filter((p) => isPartCompatible(p,v.catalogId))).toHaveLength(12);
    expect(PARTS.filter((p) => p.slot==='turbo').every((p) => !isPartCompatible(p,v.catalogId))).toBe(true);
  });
  it('browsing contracts, gates and project quotes never mutates or records ownership', () => {
    const s = rich(); const before = serializeSave(s,1000);
    for (const o of ADVANCED_OFFERS) { getSpecialistQuoteKey(s,o); getSpecialistRequirement(s,o,225000); getBarnBuyRequirement(s,o); getRestorationQuote(createIncomingVehicle(s,o),'full'); }
    expect(serializeSave(s,1000)).toBe(before); expect(getCollectedModelIds(s)).toEqual(['pico-rs']);
  });
  it('keeps the genuine released used lot and all exact accepted race timings unchanged', () => {
    const s = deserializeSave(JSON.stringify(v8)).state;
    expect(s.market).toEqual(v8.state.market); expect(s.racing).toEqual(v8.state.racing);
    expect(start(s).racing).toEqual(s.racing); expect(finish(start(s)).market).toEqual(s.market);
  });
});
describe('Contracts, money and exact-once delivery', () => {
  it.each(ADVANCED_OFFERS)('rejects a pre-starter or low-level $id without mutation', (o) => {
    for (const s of [createNewGameState(),{...rich(),playerLevel:1}]) {
      const before = structuredClone(s); expect(() => start(s,o.id)).toThrow(); expect(s).toEqual(before);
    }
  });
  it.each(ADVANCED_OFFERS)('charges the quoted $id once, keeps old state immutable and saves original deadline', (o) => {
    const s = rich(), pending = start(s,o.id);
    expect(pending.cashYen).toBe(s.cashYen - (o.kind === 'import' ? 180000 : o.kind==='auction' ?225000 :5000));
    expect(s.advanced).toEqual(createAdvancedState()); expect(pending.advanced.activeContract!.finishesAtMs).toBe(1000+o.durationMs);
    expect(() => start(pending,o.id)).toThrow('existing'); expect(isGameState(pending)).toBe(true);
    expect(importSaveCode(exportSaveCode(pending)).state).toEqual(pending);
  });
  it('a paid import grants the exact copied car only on completion, never auto-activates, and cannot be collected twice', () => {
    const s = start(), c = s.advanced.activeContract!;
    expect(s.ownedVehicles).toHaveLength(1); expect(getCollectedModelIds(s)).not.toContain('sora-s');
    const done = finish(s); expect(done.ownedVehicles.at(-1)).toEqual(c.vehicle); expect(done.ownedVehicles.at(-1)).not.toBe(c.vehicle);
    expect(done.cashYen).toBe(s.cashYen); expect(done.activeVehicleId).toBe('first'); expect(getCollectedModelIds(done)).toContain('sora-s');
    expect(done.advanced.acquiredOfferIds).toEqual(['sora-import']); expect(() => finishSpecialistContract(done,c.runId,100000)).toThrow('no longer');
    expect(isGameState(done)).toBe(true); expect(s.advanced.activeContract).toEqual(c);
  });
  it('import cancellation refunds the full invoice, releases the reservation and allows a genuinely new order', () => {
    const s = start(); const after = cancelSpecialistContract(s,s.advanced.activeContract!.runId);
    expect(after.cashYen).toBe(2000000); expect(getReservedVehicleIds(after)).toEqual([]); expect(after.ownedVehicles).toHaveLength(1);
    expect(after.advanced.totalPaidYen).toBe(180000); expect(after.advanced.totalRefundedYen).toBe(180000);
    expect(start(after).advanced.activeContract!.runId).toBeGreaterThan(s.advanced.activeContract!.runId);
  });
  it('a fully paid car is not lost just because the user closes the page for months', () => {
    const s = start(); const loaded = importSaveCode(exportSaveCode(s,9000000000000)).state;
    expect(loaded).toEqual(s); expect(isSpecialistReady(loaded.advanced.activeContract,9000000000000)).toBe(true);
    expect(finishSpecialistContract(loaded,1,9000000000000).ownedVehicles).toHaveLength(2);
  });
  it.each([-1,0.5,NaN,Infinity,Number.MAX_SAFE_INTEGER])('invalid/overflowing start clock %s cannot charge', (now) => {
    const s = rich(); expect(() => start(s,'sora-import',now)).toThrow(); expect(s.cashYen).toBe(2000000);
  });
  it.each([-1,0.5,NaN,Infinity,0,1000,89999])('early or invalid completion %s keeps the paid contract', (now) => {
    const s = start(); expect(() => finishSpecialistContract(s,1,now)).toThrow(); expect(s.advanced.activeContract).not.toBeNull();
  });
  it('stale price/identity quotes cannot silently accept a changed contract', () => {
    const s = rich(), o = findAdvancedOffer('sora-import')!, key=getSpecialistQuoteKey(s,o);
    const changed = restored(s); expect(() => startSpecialistContract(changed,o.id,key,1000)).toThrow('quote changed');
    const collision = structuredClone(s); collision.ownedVehicles.push({...s.ownedVehicles[0],instanceId:'specialist-v1:sora-import'});
    expect(() => startSpecialistContract(collision,o.id,key,1000)).toThrow('quote changed');
    expect(start(collision).advanced.activeContract!.vehicle!.instanceId).toBe('specialist-v1:sora-import:1');
  });
  it('insufficient funds and overflowing accounting throw before any money or car changes', () => {
    expect(() => start({...rich(),cashYen:0})).toThrow('cash');
    const s=start(); const huge={...s,cashYen:Number.MAX_SAFE_INTEGER};
    expect(() => cancelSpecialistContract(huge,1)).toThrow('safe range'); expect(huge.advanced.activeContract).not.toBeNull();
  });
  it.each(ADVANCED_OFFERS)('$id remains consumed after sale, with collection history intact', (o) => {
    let done=finish(start(rich(),o.id)); if(o.kind==='survey')done=buyBarn(done);
    done=sell(done,done.ownedVehicles.at(-1)!.instanceId);
    expect(getCollectedModelIds(done)).toContain(o.catalogId); expect(done.advanced.acquiredOfferIds).toContain(o.id);
    expect(() => o.kind==='survey'?buyBarn(done):start(done,o.id)).toThrow(); expect(isGameState(done)).toBe(true);
  });
});
describe('Single-player proxy auction escrow', () => {
  it.each([[190000,false,190000],[220000,false,220000],[225000,true,0],[300000,true,75000],[1000000,true,775000]] as const)('maximum %s clears fairly, win=%s, refund=%s', (bid,win,refund) => {
    const before = rich(); const s=start(before,'crest-auction',1000,bid); const done=finish(s);
    expect(done.cashYen).toBe(before.cashYen-(win?225000:0)); expect(done.advanced.lastReceipt!.refundedYen).toBe(refund);
    expect(done.advanced.lastReceipt!.kind).toBe(win?'won':'lost'); expect(done.ownedVehicles.length).toBe(win?2:1);
    expect(isGameState(done)).toBe(true); if(!win)expect(start(done,'crest-auction').advanced.activeContract).not.toBeNull();
  });
  it('raises only by the extra escrow and retains the original auction deadline', () => {
    const s=start(rich(),'crest-auction',1000,190000);
    const raised=raiseProxyBid(s,1,190000,300000,21000);
    expect(raised.cashYen).toBe(1700000); expect(raised.advanced.activeContract!.finishesAtMs).toBe(61000);
    expect(raised.advanced.totalPaidYen).toBe(300000); expect(finish(raised).cashYen).toBe(1775000);
    expect(() => raiseProxyBid(raised,1,190000,300000,22000)).toThrow('changed');
  });
  it.each([0,189999,190001,225000.5,1005000,NaN,Infinity])('rejects invalid maximum %s without reserving money', (bid) => expect(() => start(rich(),'crest-auction',1000,bid)).toThrow());
  it.each([0,61000,90000])('does not allow changing bids after close or a backwards clock at %s', (now) => expect(() => raiseProxyBid(start(rich(),'crest-auction',1000,190000),1,190000,225000,now)).toThrow('clock'));
  it('bids are binding, ties lose, and the reserved lot is not a current owned car', () => {
    const s=start(rich(),'crest-auction',1000,220000); expect(() => cancelSpecialistContract(s,1)).toThrow('binding');
    expect(getCollectedModelIds(s)).not.toContain('crest-rs'); expect(s.ownedVehicles.some(v=>v.instanceId===s.advanced.activeContract!.vehicle!.instanceId)).toBe(false);
    expect(getAuctionClearingPrice(findAdvancedOffer('crest-auction')!)).toBe(225000);
  });
  it('an auction refund that would overflow is kept, then can be retried after spending', () => {
    const s={...start(rich(),'crest-auction',1000,190000),cashYen:Number.MAX_SAFE_INTEGER};
    expect(()=>finish(s)).toThrow('safe range'); expect(finish({...s,cashYen:0}).cashYen).toBe(190000);
  });
});
describe('Barn discovery, recovery and capacity reservations', () => {
  it('a survey reveals one fixed opportunity, not ownership, a reward or a second free survey', () => {
    const done=finish(start(rich(),'orchard-barn'));
    expect(done.advanced.surveyedBarnIds).toEqual(['orchard-barn']); expect(done.cashYen).toBe(1995000);
    expect(done.ownedVehicles).toHaveLength(1); expect(getCollectedModelIds(done)).not.toContain('hachi-gt'); expect(getReservedVehicleIds(done)).toEqual([]);
    expect(()=>start(done,'orchard-barn')).toThrow('survey is complete');
    const bought=buyBarn(done); expect(bought.cashYen).toBe(1940000); expect(bought.ownedVehicles.at(-1)!.engineCondition).toBe(35);
    expect(getCollectedModelIds(bought)).toContain('hachi-gt'); expect(()=>buyBarn(bought)).toThrow('already');
  });
  it('cancelled survey keeps the disclosed fee and does not grant discovery', () => {
    const s=start(rich(),'orchard-barn'); const after=cancelSpecialistContract(s,1);
    expect(after.cashYen).toBe(1995000); expect(after.advanced.surveyedBarnIds).toEqual([]);
    expect(()=>buyBarn(after)).toThrow('survey'); expect(start(after,'orchard-barn').cashYen).toBe(1990000);
  });
  it('survey can finish with no free space; the project waits safely until acquisition is possible', () => {
    const s=rich(); while(s.ownedVehicles.length<12)s.ownedVehicles.push(createPlayerVehicle('pico-rs',`copy-${s.ownedVehicles.length}`));
    const done=finish(start(s,'orchard-barn')); expect(()=>buyBarn(done)).toThrow('full');
    expect(buyBarn(sell(done,'copy-11')).ownedVehicles).toHaveLength(12);
  });
  it('an incoming car reserves the last slot across dealer, Icon and barn purchases', () => {
    let s=rich(); while(s.ownedVehicles.length<11)s.ownedVehicles.push(createPlayerVehicle('pico-rs',`copy-${s.ownedVehicles.length}`));
    s=finish(start(s,'orchard-barn')); s.collection.unlockedAchievementIds.push('starter-trio');
    const pending=start(s); expect(getOccupiedGarageSpaces(pending)).toBe(12);
    const listing=pending.market.listings[0]; expect(getBuyRequirement(pending,listing)).toContain('full');
    expect(()=>buyMarketVehicle(pending,listing.id,0,listing.askingPriceYen)).toThrow('full');
    expect(getIconRequirement(pending,ICON_OFFERS[0])).toContain('full'); expect(()=>buyBarn(pending)).toThrow('full');
    expect(finish(pending).ownedVehicles).toHaveLength(12);
  });
  it('old oversized garages are not truncated, and cannot start an incoming purchase', () => {
    const s=rich(); while(s.ownedVehicles.length<15)s.ownedVehicles.push(createPlayerVehicle('pico-rs',`copy-${s.ownedVehicles.length}`));
    expect(importSaveCode(exportSaveCode(s)).state.ownedVehicles).toHaveLength(15); expect(()=>start(s)).toThrow('full');
  });
  it('refreshing dealer stock keeps the accepted import identity reserved and stock-independent', () => {
    const s=start(); const refreshed=refreshMarket(s,0,2000); expect(refreshed.advanced).toEqual(s.advanced);
    expect(refreshed.market.listings.every(l=>l.vehicle.instanceId!==s.advanced.activeContract!.vehicle!.instanceId)).toBe(true);
    expect(finish(refreshed).ownedVehicles.at(-1)).toEqual(s.advanced.activeContract!.vehicle);
  });
});
describe('Restoration preserves tuning, money safety and activity snapshots', () => {
  it.each(['engine','body','transmission','full'] as const)('%s restores exactly the selected condition fields and charges the quote once', (service) => {
    let s=rich(); s=installPart(s,'first','aoba-panel-filter',null); const before=structuredClone(s), q=getRestorationQuote(s.ownedVehicles[0],service);
    const done=restoreVehicle(s,'first',service,q.key,q.costYen);
    for(const field of ['engineCondition','bodyCondition','transmissionCondition'] as const) expect(done.ownedVehicles[0][field]).toBe(q.changes.some(c=>c.field===field)?100:before.ownedVehicles[0][field]);
    const {engineCondition:_e,bodyCondition:_b,transmissionCondition:_t,...other}=done.ownedVehicles[0];
    const {engineCondition:_e0,bodyCondition:_b0,transmissionCondition:_t0,...old}=before.ownedVehicles[0];
    expect(other).toEqual(old); expect(done.cashYen).toBe(s.cashYen-q.costYen); expect(done.advanced.restorationCount).toBe(1);
    expect(done.advanced.restorationSpentYen).toBe(q.costYen); expect(s).toEqual(before); expect(isGameState(done)).toBe(true);
    expect(()=>restoreVehicle(done,'first',service,q.key,q.costYen)).toThrow('changed'); expect(getRestorationRequirement(done,done.ownedVehicles[0],service)).toContain('Already');
  });
  it('a full repair costs the sum of individual repairs, with fixed ¥100 rounding and a minimum per damaged service', () => {
    const s=rich(),v=s.ownedVehicles[0],full=getRestorationQuote(v,'full');
    expect(full.costYen).toBe(['engine','body','transmission'].reduce((n,k)=>n+getRestorationQuote(v,k as RestorationService).costYen,0));
    const almost={...v,engineCondition:99.99999}; expect(getRestorationQuote(almost,'engine').costYen).toBe(500);
    expect(getRestorationQuote({...v,engineCondition:100},'engine').costYen).toBe(0);
  });
  it.each(['job','race'] as const)('%s-assigned car cannot be restored, even when its timer is ready; a parked spare can', (kind) => {
    let s=rich(); s.ownedVehicles.push(createPlayerVehicle('tora-85','spare'));
    s=kind==='job'?startJob(s,'parts-run',1000):startRace(s,'dockyard-402','first',getRaceBuildKey(s.ownedVehicles[0]),1000);
    expect(()=>restored(s)).toThrow('assigned'); const done=restored(s,'spare');
    expect(done.racing).toEqual(s.racing); expect(done.economy).toEqual(s.economy); expect(done.heat).toEqual(s.heat);
  });
  it('broker work can run alongside jobs and restores parked cars without paying or cancelling the driver activity', () => {
    let s=startJob(rich(),'garage-shift',1000); const pending=start(s); const repair=restored(pending);
    expect(repair.economy).toEqual(s.economy); expect(repair.advanced.activeContract).toEqual(pending.advanced.activeContract);
    const paid=claimJob(repair,1,16000); expect(paid.advanced).toEqual(repair.advanced); expect(finish(paid).economy).toEqual(paid.economy);
  });
  it.each([{playerLevel:1},{cashYen:0}])('rejects unavailable restoration %j without spending', (patch) => expect(()=>restored({...rich(),...patch})).toThrow());
  it('quotes reject unknown models/services, missing ownership and stale car/price changes', () => {
    const s=rich(),q=getRestorationQuote(s.ownedVehicles[0],'engine');
    expect(()=>restoreVehicle(s,'ghost','engine',q.key,q.costYen)).toThrow('no longer');
    expect(()=>restoreVehicle(s,'first','engine',q.key,q.costYen+100)).toThrow('changed');
    expect(()=>getRestorationQuote(s.ownedVehicles[0],'bad' as RestorationService)).toThrow('Unknown');
    expect(()=>getRestorationQuote({...s.ownedVehicles[0],catalogId:'historical'},'full')).toThrow('historical');
  });
  it.each(ADVANCED_OFFERS)('$id cannot produce instant profit by acquiring, restoring and selling', (o) => {
    let s=finish(start(rich(),o.id)); if(o.kind==='survey')s=buyBarn(s);
    const car=s.ownedVehicles.at(-1)!; const unmodifiedOffer=getVehicleValuation(car).offerYen;
    expect(unmodifiedOffer).toBeLessThan(s.advanced.totalPaidYen-s.advanced.totalRefundedYen);
    const repaired=restored(s,car.instanceId); const sold=sell(repaired,car.instanceId); expect(sold.cashYen).toBeLessThan(2000000);
  });
});
describe('Save v9 schema and frozen v8 compatibility', () => {
  it('preserves EVERY released-v8 field and claimed reward while adding only empty specialist state', () => {
    const before=JSON.stringify(v8),next=deserializeSave(before); const {advanced,...old}=next.state;
    expect(next.version).toBe(9); expect(SAVE_VERSION).toBe(9); expect(next.savedAt).toBe(v8.savedAt);
    expect(old).toEqual(v8.state); expect(advanced).toEqual(createAdvancedState()); expect(JSON.stringify(v8)).toBe(before);
    expect(importSaveCode('KAGEHAMA1-'+Buffer.from(before).toString('base64url')).state).toEqual(next.state);
  });
  it.each([undefined,null,{}, {version:2}, {...createAdvancedState(),activeContract:undefined}, {...createAdvancedState(),surveyedBarnIds:['fake']}, {...createAdvancedState(),totalPaidYen:-1}])('rejects broken current specialist data without resetting it: %j', (advanced) => {
    expect(isGameState({...rich(),advanced})).toBe(false);
    expect(()=>deserializeSave(JSON.stringify({version:9,savedAt:1000,state:{...rich(),advanced}}))).toThrow('invalid');
  });
  it.each([{version:2},{runId:2},{offerId:'unknown'},{kind:'survey'},{finishesAtMs:90000},{escrowYen:1},{paidYen:170000},{vehicle:null}])('rejects altered accepted contract %j', (patch) => {
    const s=start(); s.advanced.activeContract={...s.advanced.activeContract!,...patch} as typeof s.advanced.activeContract;
    expect(isGameState(s)).toBe(false);
  });
  it('rejects colliding incoming identity, altered delivery condition and invented acquired-source credit', () => {
    let s=start(); s.advanced.activeContract!.vehicle!.instanceId='first'; expect(isGameState(s)).toBe(false);
    s=start(); s.advanced.activeContract!.vehicle!.engineCondition++; expect(isGameState(s)).toBe(false);
    s=start(); s.advanced.acquiredOfferIds=['crest-auction']; expect(isGameState(s)).toBe(false);
  });
  it('old version labels cannot silently discard new escrow or acquire the same source twice', () => {
    expect(()=>deserializeSave(JSON.stringify({version:8,savedAt:1000,state:start()}))).toThrow('Legacy');
  });
  it('repeated code round-trips retain imports, raised bids, discoveries and completed/claimed collection ledgers', () => {
    const states=[start(),raiseProxyBid(start(rich(),'crest-auction',1000,190000),1,190000,300000,2000),finish(start(rich(),'orchard-barn')),buyBarn(finish(start(rich(),'orchard-barn'))),restored(finish(start()))];
    for(const s of states){let next=s;for(let i=0;i<8;i++)next=importSaveCode(exportSaveCode(next)).state;expect(next).toEqual(s);expect(isGameState(next)).toBe(true);}
  });
});
