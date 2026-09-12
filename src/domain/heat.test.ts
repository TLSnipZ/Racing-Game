import { Buffer } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import v6 from '../../tests/fixtures/save-v6.json';
import { JOBS } from '../data/jobs';
import { RACE_EVENTS, findRaceEvent } from '../data/races';
import { createNewGameState, createPlayerVehicle, purchaseStarter } from './game';
import { claimJob, getJobRequirement, startJob } from './economy';
import { getRaceBuildKey, getRaceRequirement, startRace, settleRace, cancelRace } from './racing';
import { getPlayerPosition } from './raceModel';
import { cancelLayLow, createHeatState, finishLayLow, payPoliceFine, startLayLow } from './heat';
import { boostedPrize, createRaceHeatContract, heatStatus, LAY_LOW_MS, policeFineForHeat, UNDERGROUND_HEAT_V1 } from './heatRules';
import { buyMarketVehicle, refreshMarket, getVehicleSaleKey, sellMarketVehicle } from './market';
import { getVehicleValuation } from './marketValue';
import { selectActiveVehicle } from './garage';
import { installPart } from './tuning';
import { deserializeSave, exportSaveCode, importSaveCode, isGameState, loadFromStorage, SAVE_CODE_PREFIX, SAVE_VERSION, serializeSave } from './persistence';
import type { GameState } from './types';
const initial = (heat = 0): GameState => {
  const state = purchaseStarter(createNewGameState(), 'pico-rs', 'pico-1');
  return { ...state, cashYen: 1000000, playerLevel: 6, reputation: 300, heat: { ...state.heat, value: heat } };
};
const race = (state = initial(), id = 'dockyard-402', now = 1000) => startRace(state, id, 'pico-1', getRaceBuildKey(state.ownedVehicles[0]), now, 'underground', state.heat.value);
const settle = (state: GameState) => settleRace(state, state.racing.activeRace!.runId, state.racing.activeRace!.finishesAtMs);
const patrol = (heat = 40) => settle(race(initial(heat)));
const pause = (state = initial(40), now = 1000) => startLayLow(state, state.heat.value, state.heat.nextCooldownId, now);
const finish = (state: GameState) => finishLayLow(state, state.heat.cooldown!.runId, state.heat.cooldown!.finishesAtMs);
const raw = (state: unknown, version = SAVE_VERSION) => JSON.stringify({ version, savedAt: 1000, state });

describe('Heat rules and explicit Underground contracts', () => {
  it('starts clean without debt, pending police, cooldowns or retrospective income', () => {
    expect(createNewGameState().heat).toEqual(createHeatState()); expect(isGameState(createNewGameState())).toBe(true);
  });
  it.each([[0,'CLEAR'],[24,'CLEAR'],[25,'NOTICED'],[49,'NOTICED'],[50,'WATCHED'],[74,'WATCHED'],[75,'CRACKDOWN'],[100,'CRACKDOWN']] as const)('labels Heat %s as %s', (value, label) => expect(heatStatus(value)).toBe(label));
  it.each([[0,0],[49,0],[50,1500],[74,1500],[75,3000],[100,3000]])('announces the exact citation at projected Heat %s', (heat, fine) => expect(policeFineForHeat(heat)).toBe(fine));
  it.each(RACE_EVENTS)('standard $id keeps its original entire race snapshot and rewards with no Heat', (event) => {
    const before = initial(90); const running = startRace(before, event.id, 'pico-1', getRaceBuildKey(before.ownedVehicles[0]), 1000);
    expect(running.heat).toEqual(before.heat); expect(running.racing.activeRace).not.toHaveProperty('heatRisk');
    expect(running.racing.activeRace!.prizes).toEqual(event.prizes); expect(settle(running).heat).toEqual(before.heat);
  });
  it.each(Object.entries(UNDERGROUND_HEAT_V1))('freezes $0 heat, bonuses and unchanged build/time inputs', (id, gain) => {
    const before = initial(); const snapshot = structuredClone(before); const event = findRaceEvent(id)!;
    const standard = startRace(before, id, 'pico-1', getRaceBuildKey(before.ownedVehicles[0]), 1000);
    const underground = race(before, id); const saved = underground.racing.activeRace!;
    expect(underground.heat.value).toBe(gain); expect(underground.cashYen).toBe(standard.cashYen);
    expect(saved.prizes).toEqual(event.prizes.map(boostedPrize)); expect(saved.heatRisk!.basePrizes).toEqual(event.prizes);
    expect(saved.entrants).toEqual(standard.racing.activeRace!.entrants); expect(saved.finishesAtMs).toBe(standard.racing.activeRace!.finishesAtMs);
    expect(before).toEqual(snapshot); expect(isGameState(underground)).toBe(true); expect(isGameState(settle(underground))).toBe(true);
  });
  it('does not share mutable base prize/contract objects with a catalog or other runs', () => {
    const a = race(); const b = race(); a.racing.activeRace!.heatRisk!.basePrizes[0].yen++;
    expect(b.racing.activeRace!.heatRisk!.basePrizes).toEqual(findRaceEvent('dockyard-402')!.prizes);
  });
  it('blocks bonus farming of the free practice and preserves its original fee-free safety net', () => {
    expect(() => race(initial(), 'east-ward-shakedown')).toThrow('free practice');
    expect(getRaceRequirement(initial(100), RACE_EVENTS[0], 'pico-1')).toBeNull();
  });
  it.each([1,2])('requires Level 3 for Underground, not for preexisting accessible events at level %s', (level) => {
    const state = { ...initial(), playerLevel: level }; expect(() => race(state)).toThrow(/Level/);
  });
  it.each([85,99,100])('blocks Underground at Heat %s but not standard races or legitimate work', (heat) => {
    const state = initial(heat); expect(() => race(state)).toThrow('85');
    expect(getRaceRequirement(state, RACE_EVENTS[1], 'pico-1')).toBeNull(); expect(getJobRequirement(state, JOBS[0])).toBeNull();
  });
  it('caps the accepted entry at 100 without losing the announced fine', () => {
    const running = race(initial(84), 'eastline-club'); expect(running.heat.value).toBe(100);
    expect(running.racing.activeRace!.heatRisk!.policeFineYen).toBe(3000); expect(isGameState(running)).toBe(true);
  });
  it.each([-1, 1.1, NaN, Infinity, 101])('rejects invalid current Heat %s without charging', (value) => {
    const state = initial(value); const before = structuredClone(state); expect(() => race(state)).toThrow(); expect(state).toEqual(before);
  });
  it('rejects unknown modes, stale/missing Heat quotes and duplicate entries', () => {
    const state = initial(); const key = getRaceBuildKey(state.ownedVehicles[0]);
    expect(() => startRace(state, 'dockyard-402', 'pico-1', key, 1000, 'other' as never)).toThrow('mode');
    for (const quote of [undefined, 2]) expect(() => startRace(state, 'dockyard-402', 'pico-1', key, 1000, 'underground', quote)).toThrow('Heat changed');
    expect(() => race(race())).toThrow('current race');
  });
});

describe('Patrol choices, recoverable outcomes and exact-once effects', () => {
  it('issues the announced patrol on settlement, pays gross prizes once and never deducts a fine automatically', () => {
    const pending = race(initial(40)); const r = pending.racing.activeRace!; const prize = r.prizes[getPlayerPosition(r)-1];
    const paid = settle(pending); expect(paid.cashYen).toBe(pending.cashYen+prize.yen); expect(paid.heat.value).toBe(52);
    expect(paid.heat.pendingStop).toMatchObject({ raceRunId:r.runId, eventId:r.eventId, heatAtEntry:52, fineYen:1500 });
    expect(paid.heat.totalFinesPaidYen).toBe(0); expect(() => settleRace(paid, r.runId, r.finishesAtMs)).toThrow('no longer');
    expect(isGameState(paid)).toBe(true);
  });
  it('withdrawal cannot erase entry Heat or avoid the announced patrol alert', () => {
    const pending = race(initial(65)); const after = cancelRace(pending, pending.racing.activeRace!.runId);
    expect(after.heat.value).toBe(77); expect(after.heat.pendingStop?.fineYen).toBe(3000);
    expect(after.cashYen).toBe(pending.cashYen); expect(after.reputation).toBe(pending.reputation); expect(isGameState(after)).toBe(true);
    expect(() => cancelRace(after, 1)).toThrow();
  });
  it.each([40,65])('pays only the confirmed fee and reduces Heat at starting attention %s', (attention) => {
    const state = patrol(attention); const stop = state.heat.pendingStop!; const after = payPoliceFine(state, stop.raceRunId, stop.fineYen);
    expect(after.cashYen).toBe(state.cashYen-stop.fineYen); expect(after.heat.value).toBe(state.heat.value-30);
    expect(after.heat.pendingStop).toBeNull(); expect(after.heat.totalFinesPaidYen).toBe(stop.fineYen);
    expect(after.ownedVehicles).toEqual(state.ownedVehicles); expect(after.racing).toEqual(state.racing); expect(isGameState(after)).toBe(true);
    expect(() => payPoliceFine(after, stop.raceRunId, stop.fineYen)).toThrow('resolved');
  });
  it('blocks stale quotes, wrong alert IDs and cash overflow without effects', () => {
    const state = patrol(); const stop = state.heat.pendingStop!;
    expect(() => payPoliceFine(state, 99, stop.fineYen)).toThrow(); expect(() => payPoliceFine(state, stop.raceRunId, 0)).toThrow();
    const huge = { ...state, heat: { ...state.heat, totalFinesPaidYen: Number.MAX_SAFE_INTEGER - Number.MAX_SAFE_INTEGER%1500 } };
    // Preserve a real prior receipt while testing total arithmetic overflow.
    huge.heat.lastResolution = payPoliceFine(state,stop.raceRunId,stop.fineYen).heat.lastResolution;
    expect(() => payPoliceFine(huge,stop.raceRunId,stop.fineYen)).toThrow('safe range');
  });
  it('always permits the free path with zero cash, then unblocks work and normal races', () => {
    const state = { ...patrol(65), cashYen: 0 }; const stop = state.heat.pendingStop!;
    expect(() => payPoliceFine(state,stop.raceRunId,stop.fineYen)).toThrow('free');
    const waiting = pause(state); expect(waiting.heat.pendingStop).toEqual(stop);
    const cleared = finish(waiting); expect(cleared.heat.pendingStop).toBeNull(); expect(cleared.heat.value).toBe(37);
    expect(cleared.cashYen).toBe(0); expect(cleared.reputation).toBe(state.reputation); expect(isGameState(cleared)).toBe(true);
    expect(getJobRequirement(cleared, JOBS[0])).toBeNull(); expect(getRaceRequirement(cleared,RACE_EVENTS[0],'pico-1')).toBeNull();
  });
  it('blocks jobs/races during unresolved patrol and pause without blocking old settlement', () => {
    for (const state of [patrol(), pause(), pause(patrol())]) {
      expect(() => startJob(state,'garage-shift',1000)).toThrow(); expect(() => race(state)).toThrow();
      expect(() => startRace(state,RACE_EVENTS[0].id,'pico-1',getRaceBuildKey(state.ownedVehicles[0]),1000)).toThrow();
    }
    expect(() => settle(race(initial(65)))).not.toThrow();
  });
  it.each(JOBS)('legitimate $id cools Heat once on claim and never changes its payout', (job) => {
    const running = startJob(initial(5),job.id,1000); expect(running.heat.value).toBe(5);
    const after = claimJob(running,running.economy.activeJob!.runId,running.economy.activeJob!.finishesAtMs);
    expect(after.heat.value).toBe(0); expect(after.cashYen).toBe(running.cashYen+job.rewardYen);
    expect(() => claimJob(after,1,100000)).toThrow(); expect(isGameState(after)).toBe(true);
  });
  it('does not reset Heat through active vehicle changes, trading, part changes or stock requests', () => {
    let state = initial(40); const listing = state.market.listings[0]; state = buyMarketVehicle(state,listing.id,0,listing.askingPriceYen);
    state = selectActiveVehicle(state,listing.id); state = installPart(state,listing.id,'aoba-panel-filter',null);
    const car = state.ownedVehicles.find((v)=>v.instanceId==='pico-1')!;
    state = sellMarketVehicle(state,car.instanceId,getVehicleSaleKey(car,state.activeVehicleId),getVehicleValuation(car).offerYen,null);
    state = refreshMarket(state,0,1000); expect(state.heat.value).toBe(40); expect(isGameState(state)).toBe(true);
  });
});

describe('Lay low timing, cancellation and legacy safety', () => {
  it.each([1,39,40,100])('reduces Heat %s only on manual completion, never below zero', (heat) => {
    const state=initial(heat), waiting=pause(state); const copy=structuredClone(waiting);
    expect(waiting.heat.value).toBe(heat); expect(()=>finishLayLow(waiting,1,60999)).toThrow('not finished');
    const after=finish(waiting); expect(after.heat.value).toBe(Math.max(0,heat-40)); expect(waiting).toEqual(copy);
    expect(after.cashYen).toBe(state.cashYen); expect(after.ownedVehicles).toEqual(state.ownedVehicles); expect(isGameState(after)).toBe(true);
    expect(()=>finishLayLow(after,1,100000)).toThrow('no longer');
  });
  it.each([-1, NaN, Infinity, 0.5, Number.MAX_SAFE_INTEGER])('rejects invalid/overflowed start time %s', (time) => expect(()=>pause(initial(40),time)).toThrow());
  it('rejects clock rollback, wrong IDs, duplicate or stale starts and idle pauses at Heat 0',()=>{
    const state=pause(); expect(()=>finishLayLow(state,1,0)).toThrow('backwards'); expect(()=>finishLayLow(state,9,100000)).toThrow();
    expect(()=>pause(state)).toThrow('already'); expect(()=>pause(initial(0))).toThrow('clear');
    expect(()=>startLayLow(initial(40),39,1,1000)).toThrow('changed'); expect(()=>startLayLow(initial(40),40,9,1000)).toThrow('changed');
    expect(()=>startLayLow({...initial(40),heat:{...createHeatState(),value:40,nextCooldownId:Number.MAX_SAFE_INTEGER}},40,Number.MAX_SAFE_INTEGER,1000)).toThrow();
  });
  it('cannot overlap a job or race, including a finished but unclaimed one',()=>{
    expect(()=>pause(startJob(initial(40),'garage-shift',0),100000)).toThrow('current');
    expect(()=>pause(race(initial(40)),100000)).toThrow('current');
  });
  it('cancel gives no reduction and preserves the patrol, including after clock rollback or a finished timer',()=>{
    const state=pause(patrol()); const after=cancelLayLow(state,1);
    expect(after.heat.pendingStop).toEqual(state.heat.pendingStop); expect(after.heat.value).toBe(state.heat.value);
    expect(after.heat.cooldown).toBeNull(); expect(isGameState(after)).toBe(true); expect(()=>cancelLayLow(after,1)).toThrow();
    expect(()=>payPoliceFine(state,1,1500)).toThrow('cancel');
  });
  it('migrates a genuinely frozen released v6 save preserving EVERY prior field including dealer stock and paid race',()=>{
    const before=JSON.stringify(v6); const result=deserializeSave(before); const {heat,collection,advanced:_advanced,...old}=result.state;
    expect(result.version).toBe(SAVE_VERSION); expect(collection.claimedAchievementIds).toEqual([]); expect(result.savedAt).toBe(v6.savedAt); expect(old).toEqual(v6.state); expect(heat).toEqual(createHeatState());
    expect(JSON.stringify(v6)).toBe(before); const paid=settleRace(result.state,result.state.racing.activeRace!.runId,result.state.racing.activeRace!.finishesAtMs);
    expect(paid.heat).toEqual(createHeatState()); expect(paid.market).toEqual(v6.state.market);
    expect(importSaveCode(SAVE_CODE_PREFIX+Buffer.from(before).toString('base64url')).state).toEqual(result.state);
  });
  it('round-trips risk, withdrawn alerts, paid fines, unclaimed pauses and cleared pauses with no replays or automatic writes',()=>{
    const incident=patrol(); const stopped=cancelRace(race(initial(40)),1);
    const states=[race(),race(initial(40)),incident,stopped,pause(incident),finish(pause(incident)),payPoliceFine(incident,1,1500)];
    for(const state of states){let copy=state;for(let i=0;i<8;i++)copy=importSaveCode(exportSaveCode(copy,9000000000)).state;expect(copy).toEqual(state);}
  });
  it.each([undefined,null,{}, { ...createHeatState(),value:-1 }, { ...createHeatState(),value:101 }, { ...createHeatState(),value:0.5 },
    { ...createHeatState(),cooldown:{} }, { ...createHeatState(),pendingStop:{} }, { ...createHeatState(),lastResolution:{} }, { ...createHeatState(),totalFinesPaidYen:1 }])('rejects malformed v7 Heat without resetting saved data %j',(heat)=>{
    const source=raw({...initial(),heat});expect(()=>deserializeSave(source)).toThrow();const store={getItem:()=>source};expect(()=>loadFromStorage(store)).toThrow();expect(store.getItem()).toBe(source);
  });
  it.each(['heatBefore','heatGain','heatAfter','policeFineYen','basePrizes','rulesVersion'])('rejects invalid risk math in %s',key=>{
    const state=race(initial(40)); (state.racing.activeRace!.heatRisk as unknown as Record<string,unknown>)[key]=key==='basePrizes'?[]:-1;
    expect(isGameState(state)).toBe(false);
  });
  it.each(['finishesAtMs','heatBefore','heatAfter','runId','policeRunId'])('rejects altered pause %s',key=>{
    const state=pause(patrol());(state.heat.cooldown as unknown as Record<string,unknown>)[key]=-1;expect(isGameState(state)).toBe(false);
  });
  it('rejects mismatched Heat, invented alert identities and overlapping saved activities',()=>{
    const running=race(initial(40));running.heat.value++;expect(isGameState(running)).toBe(false);
    const a=patrol();a.heat.pendingStop!.raceRunId=99;expect(isGameState(a)).toBe(false);
    const b=pause(initial(40));b.economy=startJob(initial(),'garage-shift',1000).economy;expect(isGameState(b)).toBe(false);
    expect(isGameState({...createNewGameState(),heat:initial(1).heat})).toBe(false);
  });
});
