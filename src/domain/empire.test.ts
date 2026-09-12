import { describe, expect, it } from 'vitest';
import { BUSINESSES, BUSINESS_STORAGE_MS, GARAGE_EXPANSIONS, businessPayout, businessStorageCap } from '../data/businesses';
import { findAdvancedOffer } from '../data/advancedCars';
import { ICON_OFFERS } from '../data/collection';
import { createNewGameState, createPlayerVehicle, purchaseStarter } from './game';
import { createEmpireState } from './empireState';
import { getEmpireQuote, performEmpireAction } from './empire';
import { getBusinessProduction, getEmpireProduction } from './empireProduction';
import { isEmpireState } from './empireValidation';
import { getGarageCapacity, getOccupiedGarageSpaces, getReservedVehicleIds } from './garageCapacity';
import { buyMarketVehicle, getBuyRequirement, refreshMarket } from './market';
import { getIconRequirement, purchaseIcon } from './collection';
import { recordCollectionProgress } from './collectionProgress';
import { getSpecialistQuoteKey, startSpecialistContract, finishSpecialistContract, cancelSpecialistContract, getBarnBuyRequirement } from './advanced';
import { startJob, claimJob } from './economy';
import { startRace, getRaceBuildKey } from './racing';
import { exportSaveCode, importSaveCode, serializeSave, deserializeSave, isGameState, SAVE_VERSION } from './persistence';
import v1 from '../../tests/fixtures/save-v1.json';
import v2 from '../../tests/fixtures/save-v2.json';
import v3 from '../../tests/fixtures/save-v3.json';
import v4 from '../../tests/fixtures/save-v4.json';
import v5 from '../../tests/fixtures/save-v5.json';
import v6 from '../../tests/fixtures/save-v6.json';
import v7 from '../../tests/fixtures/save-v7.json';
import v8 from '../../tests/fixtures/save-v8.json';
import v9 from '../../tests/fixtures/save-v9.json';
import type { EmpireAction, EmpireOrder } from './empireTypes';
import type { GameState } from './types';
const T = 1000, ID = BUSINESSES[0].id;
const rich = () => ({ ...purchaseStarter(createNewGameState(), 'pico-rs', 'first'), playerLevel: 20, reputation: 3800, cashYen: 50_000_000 });
function act(s: GameState, action: EmpireAction, id: string | null = ID, now = T) {
  return performEmpireAction(s, getEmpireQuote(s, action, id, now).order, now);
}
const owned = (id = ID) => act(rich(), 'buy', id);
const automated = (id = ID) => act(owned(id), 'manager', id);
const projection = (s: GameState, now: number, id = ID) => getBusinessProduction(s.empire.businesses.find((b) => b.id === id)!, now);
const strip = ({ empire: _empire, cashYen: _cash, ...rest }: GameState) => rest;
function fillGarage(s: GameState, size: number) {
  while (s.ownedVehicles.length < size) s.ownedVehicles.push(createPlayerVehicle('pico-rs', `extra-${s.ownedVehicles.length}`));
  return s;
}

describe('Empire purchases, staff and one-batch/manual production', () => {
  it('starts empty with twelve spaces, no money or activity awards and three explicit businesses', () => {
    const s = createNewGameState(); expect(s.empire).toEqual(createEmpireState()); expect(getGarageCapacity(s)).toBe(12);
    expect(BUSINESSES).toHaveLength(3); expect(new Set(BUSINESSES.map((b) => b.id)).size).toBe(3);
    expect(getEmpireProduction(s.empire, T).totalYen).toBe(0); expect(isGameState(s)).toBe(true);
  });
  it.each(BUSINESSES)('$id buys once at its explicit price and does not start or gift a manager', (item) => {
    const s = rich(), before = structuredClone(s), next = act(s, 'buy', item.id);
    expect(s).toEqual(before); expect(next.cashYen).toBe(s.cashYen - item.priceYen);
    expect(next.empire.businesses).toEqual([{id:item.id,level:1,managerHired:false,startedAtMs:null,bankedYen:0}]);
    expect(strip(next)).toEqual(strip(s)); expect(isEmpireState(next.empire)).toBe(true);
    expect(() => act(next,'buy',item.id)).toThrow('already');
  });
  it.each(BUSINESSES)('$id has no production before dispatch and never auto-repeats a manual batch', (item) => {
    const s = owned(item.id); expect(projection(s,T+BUSINESS_STORAGE_MS,item.id).amountYen).toBe(0);
    const run = act(s,'start',item.id); const deadline = T + item.cycleMs;
    expect(projection(run,deadline-1,item.id).amountYen).toBe(0);
    expect(projection(run,deadline,item.id).amountYen).toBe(item.payoutYen);
    expect(projection(run,deadline+BUSINESS_STORAGE_MS,item.id).amountYen).toBe(item.payoutYen);
    expect(() => act(run,'start',item.id,deadline)).toThrow('already');
    expect(() => act(run,'collect',item.id,deadline-1)).toThrow('No completed');
    const collected=act(run,'collect',item.id,deadline);
    expect(collected.cashYen).toBe(run.cashYen+item.payoutYen); expect(collected.empire.businesses[0].startedAtMs).toBeNull();
    expect(projection(collected,deadline+BUSINESS_STORAGE_MS,item.id).amountYen).toBe(0);
    expect(() => act(collected,'collect',item.id,deadline)).toThrow('No completed');
  });
  it.each(BUSINESSES)('$id hires its fixed manager once and starts automation at the hire time', (item) => {
    const s=owned(item.id), next=act(s,'manager',item.id,T+900000);
    expect(next.cashYen).toBe(s.cashYen-item.managerPriceYen);
    expect(projection(next,T+900000,item.id).amountYen).toBe(0);
    expect(projection(next,T+900000+item.cycleMs*3,item.id).amountYen).toBe(item.payoutYen*3);
    expect(()=>act(next,'manager',item.id,T+900000)).toThrow('already'); expect(strip(next)).toEqual(strip(s));
  });
  it('cannot upgrade or hire over an in-progress manual batch', () => {
    const s=act(owned(),'start'); expect(()=>act(s,'upgrade')).toThrow('Pause'); expect(()=>act(s,'manager')).toThrow('pause');
  });
  it('cannot buy before choosing a starter, below the item level, or with inadequate cash', () => {
    expect(()=>act(createNewGameState(),'buy')).toThrow('starter');
    expect(()=>act({...rich(),playerLevel:2},'buy')).toThrow('Level 3');
    expect(()=>act({...rich(),cashYen:59999},'buy')).toThrow('cash');
    expect(()=>act({...rich(),cashYen:60000},'buy')).not.toThrow();
    expect(()=>act(rich(),'manager')).toThrow('Buy');
  });
  it('each upgrade preserves banked old-rate money and requires explicit resume', () => {
    let s=automated();s=act(s,'pause',ID,T+45000);expect(s.empire.businesses[0].bankedYen).toBe(300);
    const before=s.cashYen;s=act(s,'upgrade',ID,T+60000);expect(s.cashYen).toBe(before-60000);
    expect(projection(s,T+600000).amountYen).toBe(300);expect(s.empire.businesses[0].startedAtMs).toBeNull();
    s=act(s,'start',ID,T+600000);expect(projection(s,T+630000).amountYen).toBe(900);
  });
  it('upgrade level requirements and cap are explicit and all expenses reconcile', () => {
    let s=owned();expect(()=>act({...s,playerLevel:3},'upgrade')).toThrow('Level 4');
    for(let i=2;i<=5;i++) { s=act(s,'upgrade');expect(s.empire.businesses[0].level).toBe(i);expect(isEmpireState(s.empire)).toBe(true); }
    expect(s.empire.totalSpentYen).toBe(60000*(1+1+2+3+4));expect(()=>act(s,'upgrade')).toThrow('Maximum');
  });
  it('pausing retains completed batches but deliberately drops only the unfinished batch time', () => {
    let s=act(automated(),'pause',ID,T+45000);expect(projection(s,T+10000000).amountYen).toBe(300);
    s=act(s,'start',ID,T+10000000);expect(projection(s,T+10029999).amountYen).toBe(300);
    expect(projection(s,T+10030000).amountYen).toBe(600);
  });
  it('manual pause after readiness keeps the batch; paused money can be collected without restarting', () => {
    let s=act(owned(),'start');s=act(s,'pause',ID,T+30000);expect(s.empire.businesses[0].bankedYen).toBe(300);
    expect(()=>act(s,'start',ID,T+30000)).toThrow('Collect');s=act(s,'collect',ID,T+60000);expect(s.empire.businesses[0].startedAtMs).toBeNull();
  });
  it('hiring with a saved completed manual batch preserves that money, not a free extra batch',()=>{
    let s=act(owned(),'start');s=act(s,'pause',ID,T+30000);s=act(s,'manager',ID,T+90000);
    expect(projection(s,T+90000).amountYen).toBe(300);expect(projection(s,T+120000).amountYen).toBe(600);
  });
});

describe('Exact-once capped production and offline persistence',()=>{
  it.each(BUSINESSES.flatMap(item=>[1,2,3,4,5].map(level=>({item,level}))))('$item.id Level $level caps at exactly eight hours, not per reload',({item,level})=>{
    let s=owned(item.id);for(let l=1;l<level;l++)s=act(s,'upgrade',item.id);
    s=act(s,'manager',item.id);
    const cap=businessStorageCap(item,level,true);const raw=serializeSave(s,T);
    for(const gap of [BUSINESS_STORAGE_MS,BUSINESS_STORAGE_MS*10,1e12]) {
      const loaded=deserializeSave(raw).state;
      expect(projection(loaded,T+gap,item.id).amountYen).toBe(cap);
      const collected=act(loaded,'collect',item.id,T+gap);expect(collected.cashYen-s.cashYen).toBe(cap);
      expect(projection(collected,T+gap,item.id).amountYen).toBe(0);
      expect(projection(collected,T+gap+item.cycleMs-1,item.id).amountYen).toBe(0);
      expect(projection(collected,T+gap+item.cycleMs,item.id).amountYen).toBe(businessPayout(item,level));
      expect(importSaveCode(exportSaveCode(collected,T+gap)).state).toEqual(collected);
    }
    expect(serializeSave(s,T)).toBe(raw);
  });
  it('frequent claims preserve the current partial batch rather than erasing time',()=>{
    let s=automated();s=act(s,'collect',ID,T+45000);expect(s.empire.businesses[0].startedAtMs).toBe(T+30000);
    expect(projection(s,T+60000).amountYen).toBe(300);s=act(s,'collect',ID,T+60000);expect(s.empire.totalCollectedYen).toBe(600);
  });
  it('multiple small collections equal one large collection before capacity is reached',()=>{
    let small=automated();const large=small;
    for(const offset of [31000,69000,110001,175000,249000]) small=act(small,'collect',ID,T+offset);
    const bulk=act(large,'collect',ID,T+249000);
    expect(small.cashYen).toBe(bulk.cashYen);expect(small.empire.totalCollectedYen).toBe(bulk.empire.totalCollectedYen);
    expect(small.empire.businesses).toEqual(bulk.empire.businesses);
  });
  it('paused earnings count towards capacity after resume; taking a pause does not renew a full till',()=>{
    let s=act(automated(),'pause',ID,T+BUSINESS_STORAGE_MS);const cap=projection(s,T+BUSINESS_STORAGE_MS).amountYen;
    expect(()=>act(s,'start',ID,T+BUSINESS_STORAGE_MS)).toThrow('Collect');
    s=act(s,'collect',ID,T+BUSINESS_STORAGE_MS);expect(s.empire.totalCollectedYen).toBe(cap);
    expect(projection(s,T+100*BUSINESS_STORAGE_MS).amountYen).toBe(0);
  });
  it('collect all applies a single atomic payout and leaves idle and unfinished businesses alone',()=>{
    let s=rich();for(const b of BUSINESSES) {s=act(s,'buy',b.id);s=act(s,'manager',b.id);}
    const before=s.cashYen,expected=300*2+900+2100;
    s=act(s,'collect-all',null,T+60000);expect(s.cashYen-before).toBe(expected);expect(s.empire.totalCollectedYen).toBe(expected);
    expect(projection(s,T+60000,'bayline-parts').percent).toBeCloseTo(100/3);
    expect(()=>act(s,'collect-all',null,T+60000)).toThrow('No completed');
  });
  it.each([-1,NaN,Infinity,1000.5,Number.MAX_SAFE_INTEGER])('invalid clock %s cannot start, hire, collect or mutate',now=>{
    const s=owned(),before=structuredClone(s);
    for(const action of ['start','manager','collect','expand'] as const) expect(()=>act(s,action,action==='expand'?null:ID,now)).toThrow('clock');
    expect(s).toEqual(before);
  });
  it('backwards clock grants no advance or rewind and leaves recovery in other systems usable',()=>{
    const s=automated();expect(projection(s,T-1)).toMatchObject({amountYen:0,clockError:true});
    for(const action of ['collect','pause','upgrade'] as const) expect(()=>act(s,action,ID,T-1)).toThrow('backwards');
    expect(()=>startJob(s,'garage-shift',T)).not.toThrow();expect(projection(s,T+30000).amountYen).toBe(300);
  });
  it('overflow rejects the whole transfer; uncollected earnings remain claimable',()=>{
    const s={...automated(),cashYen:Number.MAX_SAFE_INTEGER-1},before=structuredClone(s);
    expect(()=>act(s,'collect',ID,T+30000)).toThrow('safe range');expect(s).toEqual(before);
    const spent={...s,cashYen:s.cashYen-1000};expect(act(spent,'collect',ID,T+30000).cashYen).toBe(spent.cashYen+300);
  });
  it('stale and duplicate free or paid actions do not replay',()=>{
    const s=rich(),q=getEmpireQuote(s,'buy',ID,T).order;const b=performEmpireAction(s,q,T);
    expect(()=>performEmpireAction(b,q,T)).toThrow('changed');
    const managed=act(b,'manager');expect(()=>act(managed,'start')).toThrow('already running');
    const claim=getEmpireQuote(managed,'collect',ID,T+30000).order;
    const paid=performEmpireAction(managed,claim,T+30000);expect(()=>performEmpireAction(paid,claim,T+30000)).toThrow('changed');
  });
  it('accepted current order prices and IDs are revalidated, including malicious action values',()=>{
    const s=owned();expect(()=>performEmpireAction(s,{...getEmpireQuote(s,'manager',ID,T).order,priceYen:0},T)).toThrow('price');
    expect(()=>act(s,'buy','fake')).toThrow('Unknown');expect(()=>act(s,'collect-all',ID,T)).toThrow('Invalid');
    expect(()=>act(s,'expand',ID,T)).toThrow('Invalid');expect(()=>act(s,'no-such-action' as EmpireAction)).toThrow('Unknown');
  });
});

describe('Garage expansion and independent gameplay contracts',()=>{
  it('expands sequentially to 18, 24, 36 without touching cars or active selection',()=>{
    let s=rich();const before=strip(s);for(const e of GARAGE_EXPANSIONS){const cash=s.cashYen;s=act(s,'expand',null);expect(getGarageCapacity(s)).toBe(e.capacity);expect(s.cashYen).toBe(cash-e.priceYen);expect(strip(s)).toEqual(before);}
    expect(()=>act(s,'expand',null)).toThrow('maximum');expect(s.empire.totalSpentYen).toBe(655000);
  });
  it('does not grant lower-level or unaffordable expansions',()=>{
    expect(()=>act({...rich(),playerLevel:3},'expand',null)).toThrow('Level 4');
    expect(()=>act({...rich(),cashYen:74000},'expand',null)).toThrow('cash');
  });
  it('reserved imports survive expansion and still count in each purchase route',()=>{
    let s=fillGarage(rich(),11);const offer=findAdvancedOffer('sora-import')!;
    s=startSpecialistContract(s,offer.id,getSpecialistQuoteKey(s,offer),T);const pending=structuredClone(s.advanced),ids=getReservedVehicleIds(s);
    expect(getOccupiedGarageSpaces(s)).toBe(12);expect(getBuyRequirement(s,s.market.listings[0])).toContain('full');
    s=act(s,'expand',null);expect(s.advanced).toEqual(pending);expect(getReservedVehicleIds(s)).toEqual(ids);expect(getGarageCapacity(s)).toBe(18);
    const l=s.market.listings[0];s=buyMarketVehicle(s,l.id,s.market.generation,l.askingPriceYen);expect(s.ownedVehicles).toHaveLength(12);
    s=finishSpecialistContract(s,s.advanced.activeContract!.runId,T+90000);expect(s.ownedVehicles).toHaveLength(13);expect(getOccupiedGarageSpaces(s)).toBe(13);
  });
  it('reservation with an expanded full garage still blocks dealer, Icon and recovered barn cars',()=>{
    let s=act(fillGarage(rich(),17),'expand',null);s.collection.unlockedAchievementIds.push('starter-trio');
    const offer=findAdvancedOffer('sora-import')!;s=startSpecialistContract(s,offer.id,getSpecialistQuoteKey(s,offer),T);
    expect(getBuyRequirement(s,s.market.listings[0])).toContain('18 spaces');expect(getIconRequirement(s,ICON_OFFERS[0])).toContain('18 spaces');
    s.advanced.surveyedBarnIds=['orchard-barn'];expect(getBarnBuyRequirement(s,findAdvancedOffer('orchard-barn')!)).toContain('full');
  });
  it('expanded capacity is used for Icon purchases, not only regular dealer cars',()=>{
    let s=act(fillGarage(rich(),12),'expand',null);s.collection.unlockedAchievementIds.push('starter-trio');
    s=purchaseIcon(s,ICON_OFFERS[0].id,ICON_OFFERS[0].priceYen);expect(s.ownedVehicles).toHaveLength(13);
  });
  it('existing oversized legacy garages are never truncated when buying a smaller first expansion',()=>{
    const s=fillGarage(rich(),45);const expanded=act(s,'expand',null);expect(expanded.ownedVehicles).toHaveLength(45);
    expect(isGameState(expanded)).toBe(true);expect(getBuyRequirement(expanded,expanded.market.listings[0])).toContain('full');
  });
  it('running risky races and broker escrow survive every business action, collection and capacity change exactly',()=>{
    let s=deserializeSave(JSON.stringify(v9)).state;const before=strip(s);
    for(const [action,now] of [['buy',T+5000],['start',T+6000],['pause',T+66000],['manager',T+70000],['collect',T+100000],['pause',T+115000],['upgrade',T+120000],['start',T+130000],['expand',T+150000]] as const){
      s=act(s,action,action==='expand'?null:ID,now);expect(strip(s)).toEqual(before);expect(isGameState(s)).toBe(true);
    }
  });
  it('job income and Heat reduction remain separate; jobs never collect or reset production',()=>{
    let s=automated();const before=structuredClone(s.empire);s=startJob(s,'garage-shift',T);s=claimJob(s,s.economy.activeJob!.runId,T+15000);
    expect(s.empire).toEqual(before);expect(projection(s,T+30000).amountYen).toBe(300);
    const old=strip(s);s=act(s,'collect',ID,T+30000);expect(strip(s)).toEqual(old);
  });
  it('dealer refresh and specialist cancellation never rewind business income',()=>{
    let s=automated();const offer=findAdvancedOffer('sora-import')!;s=startSpecialistContract(s,offer.id,getSpecialistQuoteKey(s,offer),T);
    const before=s.empire;s=refreshMarket(s,s.market.generation,T);s=cancelSpecialistContract(s,s.advanced.activeContract!.runId);expect(s.empire).toEqual(before);
  });
});

describe('Save v10, migration and malformed empire protection',()=>{
  it('preserves EVERY released-v9 field and adds only an empty empire, with no retrospective revenue',()=>{
    const before=JSON.stringify(v9);const next=deserializeSave(before);const {empire,...old}=next.state;
    expect(old).toEqual(v9.state);expect(empire).toEqual(createEmpireState());expect(next.version).toBe(10);expect(next.savedAt).toBe(v9.savedAt);
    expect(JSON.stringify(v9)).toBe(before);expect(next.state.advanced.activeContract).not.toBeNull();expect(next.state.racing.activeRace?.heatRisk).toBeDefined();
  });
  it.each([v1,v2,v3,v4,v5,v6,v7,v8,v9])('genuine v$version saves gain no businesses, cash or changed old top-level counters',fixture=>{
    const next=deserializeSave(JSON.stringify(fixture)).state;expect(next.empire).toEqual(createEmpireState());
    expect(next.cashYen).toBe(fixture.state.cashYen);expect(next.playerLevel).toBe(fixture.state.playerLevel);
    expect(next.reputation).toBe(fixture.state.reputation);expect(next.ownedVehicles.map(v=>v.instanceId)).toEqual(fixture.state.ownedVehicles.map(v=>v.instanceId));
  });
  it('portable saves preserve managed anchors, manual paused tills, expansions and claimed income over repeated imports',()=>{
    let s=act(automated(),'collect',ID,T+31000);s=act(s,'expand',null,T+40000);s=act(s,'buy','bayline-parts',T+40000);s=act(s,'start','bayline-parts',T+40000);
    const before=structuredClone(s);for(let i=0;i<20;i++)s=importSaveCode(exportSaveCode(s,T+60000)).state;expect(s).toEqual(before);
    expect(projection(s,T+60000).amountYen).toBe(300);expect(SAVE_VERSION).toBe(10);
  });
  it.each([undefined,null,{}, {version:2}, {...createEmpireState(),businesses:undefined}, {...createEmpireState(),garageExpansionLevel:4},
    {...createEmpireState(),totalCollectedYen:1},{...createEmpireState(),revision:-1},{...createEmpireState(),businesses:[{id:'fake'}]}])('rejects missing or malformed current empire instead of resetting it: %j',empire=>{
    expect(isEmpireState(empire)).toBe(false);expect(()=>deserializeSave(JSON.stringify({version:SAVE_VERSION,savedAt:T,state:{...rich(),empire}}))).toThrow();
  });
  it.each([{level:0},{level:6},{level:1.5},{managerHired:'true'},{startedAtMs:NaN},{startedAtMs:-1},{startedAtMs:1000.5},{bankedYen:1},{bankedYen:-300},{bankedYen:300000000}])('rejects malformed owned business %j',patch=>{
    const s=owned();Object.assign(s.empire.businesses[0],patch);expect(isEmpireState(s.empire)).toBe(false);
  });
  it('rejects duplicate ownership, forged expenses and future receipt IDs',()=>{
    const s=owned();s.empire.businesses.push(structuredClone(s.empire.businesses[0]));expect(isEmpireState(s.empire)).toBe(false);
    const wrong=owned();wrong.empire.totalSpentYen=0;expect(isEmpireState(wrong.empire)).toBe(false);
    const receipt=owned();receipt.empire.lastReceipt!.revision++;expect(isEmpireState(receipt.empire)).toBe(false);
  });
  it('cannot hide a nonempty empire under an old save version to reset repeat claims',()=>{
    const s=automated();expect(()=>deserializeSave(JSON.stringify({version:9,savedAt:T,state:s}))).toThrow('empire ledger');
  });
  it('reset returns to empty businesses and twelve slots without clearing known schema rules',()=>{
    const s=createNewGameState();expect(s.empire).toEqual(createEmpireState());expect(getGarageCapacity(s)).toBe(12);expect(isGameState(s)).toBe(true);
  });
});
