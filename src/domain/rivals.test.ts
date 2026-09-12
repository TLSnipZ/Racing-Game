import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { RIVAL_CHALLENGES, RIVAL_EVENTS, findRivalChallenge } from '../data/rivals';
import { ALL_RACE_EVENTS, RACE_EVENTS, findRaceEvent } from '../data/races';
import { findAchievement, ACHIEVEMENTS } from '../data/achievements';
import { findDistrict } from '../data/city';
import { findVehicleDefinition, VEHICLE_CATALOG } from '../data/vehicles';
import { getDistrictRaces } from './city';
import { createNewGameState, createPlayerVehicle, purchaseStarter } from './game';
import { getRivalCampaign, getRivalGoals, getRivalEntryRequirement, hasRivalWin } from './rivalProgress';
import { getRaceBuildKey, getRaceRequirement, getVehicleRaceBuild, startRace, settleRace, cancelRace } from './racing';
import { getPlayerPosition, simulateSectors } from './raceModel';
import { isRacingState, isRaceSnapshot } from './racingValidation';
import { claimAchievement } from './collection';
import { getAchievementProgress, recordCollectionProgress } from './collectionProgress';
import { getUndergroundRequirement } from './heat';
import { getVehicleValuation } from './marketValue';
import { getVehicleSaleKey, sellMarketVehicle } from './market';
import { getRestorationQuote, restoreVehicle } from './restoration';
import { installPart } from './tuning';
import { getEmpireProduction } from './empireProduction';
import { deserializeSave, serializeSave, exportSaveCode, importSaveCode, SAVE_VERSION, isGameState } from './persistence';
import { carForEvent, preparedRivalWorld, qualifiedRivalWorld, defeatedRivalWorld, raceToEnd, RIVAL_TEST_PARTS } from '../../tests/support/rivals';
import { findPart } from '../data/parts';
import v10 from '../../tests/fixtures/save-v10.json';
const first = RIVAL_CHALLENGES[0];
const initial = () => purchaseStarter(createNewGameState(), 'pico-rs', 'first');
const bonus = (s: ReturnType<typeof initial>, id = first.achievementId) => getAchievementProgress(s, findAchievement(id)!);

describe('Five explicit rival challenges without replacing the open circuit', () => {
  it('keeps all eight old open events byte-for-byte and adds five separate registry entries', () => {
    expect(RACE_EVENTS).toHaveLength(8); expect(RIVAL_EVENTS).toHaveLength(5); expect(ALL_RACE_EVENTS).toHaveLength(13);
    expect(new Set(ALL_RACE_EVENTS.map((e) => e.id)).size).toBe(13);
    expect(createHash('sha256').update(JSON.stringify(RACE_EVENTS)).digest('hex')).toBe('a53968966d4743e6c0715fd1c166a8dd3721a1963b5e3a48c2c63307573ea627');
    expect(getDistrictRaces('all')).toEqual(RACE_EVENTS);
  });
  it.each(RIVAL_CHALLENGES)('$crew has complete event, boss, source, goals and one exact reward ID', (c) => {
    expect(findRaceEvent(c.event.id)).toBe(c.event); expect(findRivalChallenge(c.event.id)).toBe(c);
    expect(c.event.tier).toBe('Boss'); expect(c.event.rivals).toHaveLength(3); expect(c.event.prizes).toHaveLength(4);
    expect(findDistrict(c.district)).toBeDefined(); expect(c.event.rivals[0].name).toContain(c.boss);
    expect(findAchievement(c.achievementId)).toMatchObject({ metric: 'rival-win', raceEventId: c.event.id, rewardYen: c.bonusYen });
    expect(c.event.rivals.every((r) => !!findVehicleDefinition(r.catalogId))).toBe(true);
    if (c.qualifierId) expect(findRaceEvent(c.qualifierId)?.discipline).toBe(c.event.discipline);
    const times = c.event.rivals.map((r) => simulateSectors(r.build,c.event.sectors).reduce((s,t)=>s+t,0));
    expect(times[0]).toBeLessThan(times[1]); expect(times[1]).toBeLessThan(times[2]);
  });
  it('adds five rewards without inventing cars, businesses or a reset world', () => {
    expect(ACHIEVEMENTS).toHaveLength(23); expect(VEHICLE_CATALOG).toHaveLength(11);
    expect(getRivalCampaign(initial())).toEqual({ defeated: 0, total: 5, title: 'Challenger', champion: false });
    expect(getRivalEntryRequirement(initial(),'unknown')).toBeNull();
  });
  it.each(RIVAL_CHALLENGES)('$crew cannot bypass level/qualifier gates through a direct domain start', (c) => {
    const s = preparedRivalWorld(); const car = carForEvent(s,c.event.id); const before = structuredClone(s);
    expect(getRivalEntryRequirement(s,c.event.id)).not.toBeNull();
    expect(() => startRace(s,c.event.id,car.instanceId,getRaceBuildKey(car),1000)).toThrow('Rival invitation');
    expect(s).toEqual(before);
  });
  it.each(RIVAL_CHALLENGES.slice(0,4))('$crew needs the corresponding club podium, not just any race or raw level', (c) => {
    const s = qualifiedRivalWorld(); const car = carForEvent(s,c.event.id);
    expect(getRivalEntryRequirement(s,c.event.id)).toBeNull();
    expect(getRivalEntryRequirement({ ...s, playerLevel: c.event.minLevel-1 },c.event.id)).toContain('Level');
    const unfinished = preparedRivalWorld(); const p = startRace(unfinished,c.qualifierId!,carForEvent(unfinished,c.qualifierId!).instanceId,getRaceBuildKey(carForEvent(unfinished,c.qualifierId!)),1000);
    expect(getRivalGoals(p,c).at(-1)?.met).toBe(false);
    // A saved fourth place is not a podium. The selector remains read-only.
    const fourth = { ...s, racing: { ...s.racing, records: s.racing.records.map((r) => r.eventId===c.qualifierId ? {...r,bestPosition:4,wins:0} : r) } };
    expect(getRivalEntryRequirement(fourth,c.event.id)).toContain('podium');
    expect(getRaceRequirement(s,c.event,car.instanceId)).toBeNull();
  });
  it('gates the finale on all four settled crew wins plus Level 14, not reward claims or cash', () => {
    const s = defeatedRivalWorld(); const final = RIVAL_CHALLENGES[4];
    expect(getRivalEntryRequirement(s,final.event.id)).toBeNull();
    expect(s.collection.claimedAchievementIds).toEqual([]);
    expect(getRivalEntryRequirement({...s,playerLevel:13},final.event.id)).toContain('Level 14');
    expect(getRivalEntryRequirement(defeatedRivalWorld(3),final.event.id)).toContain('Zero Meridian');
  });
});

describe('Rival race settlement and one-time shared title bonuses', () => {
  it.each(RIVAL_CHALLENGES)('$crew is actually beatable with the existing non-Icon cars and legitimate parts', (c) => {
    const s = c.qualifierId ? qualifiedRivalWorld() : defeatedRivalWorld();
    const after = raceToEnd(s,c.event.id);
    expect(after.racing.lastResult?.position).toBe(1); expect(hasRivalWin(after,c.event.id)).toBe(true);
    expect(bonus(after,c.achievementId)).toMatchObject({ claimable:true,claimed:false });
    expect(after.cashYen).toBe(s.cashYen-c.event.entryFeeYen+c.event.prizes[0].yen);
    expect(after.reputation).toBe(s.reputation+c.event.prizes[0].reputation);
    expect(after.market).toEqual(s.market); expect(after.advanced).toEqual(s.advanced); expect(after.empire).toEqual(s.empire);
    expect(isGameState(after)).toBe(true);
    const claimed = claimAchievement(after,c.achievementId);
    expect(claimed.cashYen).toBe(after.cashYen+c.bonusYen);
    expect(claimed.racing).toEqual(after.racing); expect(claimed.reputation).toBe(after.reputation);
    expect(() => claimAchievement(claimed,c.achievementId)).toThrow('already');
    const replay = raceToEnd(claimed,c.event.id);
    expect(bonus(replay,c.achievementId)).toMatchObject({ claimed:true,claimable:false });
    expect(replay.cashYen).toBe(claimed.cashYen-c.event.entryFeeYen+c.event.prizes[0].yen);
  });
  it('does not grant a title for entry, a ready countdown, fourth place or withdrawal', () => {
    let s = qualifiedRivalWorld(); const poor = createPlayerVehicle('pico-rs','slow-car'); s = {...s,ownedVehicles:[...s.ownedVehicles,poor]};
    const running = startRace(s,first.event.id,poor.instanceId,getRaceBuildKey(poor),1000);
    expect(getPlayerPosition(running.racing.activeRace!)).toBe(4); expect(bonus(running).unlocked).toBe(false);
    const withdrawn = cancelRace(running,running.racing.activeRace!.runId); expect(bonus(withdrawn).unlocked).toBe(false);
    const lost = settleRace(running,running.racing.activeRace!.runId,running.racing.activeRace!.finishesAtMs);
    expect(bonus(lost).unlocked).toBe(false); expect(() => claimAchievement(lost,first.achievementId)).toThrow('not earned');
    const won = raceToEnd(lost,first.event.id); expect(bonus(won).unlocked).toBe(true);
  });
  it('keeps accepted race/escrow/business timestamps, parts and active ID unchanged on bonus claims', () => {
    let s = raceToEnd(qualifiedRivalWorld(),first.event.id);
    const fixture = deserializeSave(JSON.stringify(v10)).state;
    s = {...s,empire:fixture.empire,advanced:fixture.advanced};
    const car=carForEvent(s,'ward-club'); s = startRace(s,'ward-club',car.instanceId,getRaceBuildKey(car),1_000_000);
    const before=structuredClone(s); const after=claimAchievement(s,first.achievementId);
    expect(after.empire).toEqual(before.empire); expect(after.advanced).toEqual(before.advanced); expect(after.racing).toEqual(before.racing);
    expect(after.ownedVehicles).toEqual(before.ownedVehicles); expect(after.activeVehicleId).toBe(before.activeVehicleId);
  });
  it('reloading the paid boss preserves its exact build/rivals/deadline and does not unlock a bonus', () => {
    const s=qualifiedRivalWorld();const car=carForEvent(s,first.event.id);const pending=startRace(s,first.event.id,car.instanceId,getRaceBuildKey(car),1000);
    const imported=importSaveCode(exportSaveCode(pending,2000)).state;expect(imported).toEqual(pending);expect(bonus(imported).unlocked).toBe(false);
    const race=imported.racing.activeRace!;expect(()=>settleRace(imported,race.runId,race.finishesAtMs-1)).toThrow('not finished');
    expect(()=>settleRace(imported,race.runId,999)).toThrow('backwards');
    const done=settleRace(imported,race.runId,race.finishesAtMs);expect(()=>settleRace(done,race.runId,race.finishesAtMs)).toThrow('no longer');
    expect(serializeSave(imported,2000)).toBe(serializeSave(pending,2000));
  });
  it('cannot add Underground modifiers to any boss through a direct command', () => {
    const s=defeatedRivalWorld(); for(const c of RIVAL_CHALLENGES){const car=carForEvent(s,c.event.id);
      expect(getUndergroundRequirement(s,c.event,'underground')).toContain('Standard');
      expect(()=>startRace(s,c.event.id,car.instanceId,getRaceBuildKey(car),1000,'underground',0)).toThrow('Standard'); }
  });
  it('blocks stale build quotes, sold vehicles and insufficient entry cash without progress', () => {
    const s=qualifiedRivalWorld(),car=carForEvent(s,first.event.id),before=structuredClone(s);
    expect(()=>startRace(s,first.event.id,car.instanceId,'stale',1000)).toThrow('build changed');
    expect(()=>startRace(s,first.event.id,'missing',getRaceBuildKey(car),1000)).toThrow('own');
    expect(()=>startRace({...s,cashYen:0},first.event.id,car.instanceId,getRaceBuildKey(car),1000)).toThrow('cash'); expect(s).toEqual(before);
  });
  it('protects the assigned car from restoration/tuning until a boss is settled, while parked spares remain editable', () => {
    const s=qualifiedRivalWorld(),car=carForEvent(s,first.event.id); const running=startRace(s,first.event.id,car.instanceId,getRaceBuildKey(car),1000);
    expect(()=>installPart(running,car.instanceId,'aoba-panel-filter','senka-cold-air')).toThrow('assigned');
    const quote=getRestorationQuote(car,'engine'); expect(()=>restoreVehicle(running,car.instanceId,'engine',quote.key,quote.costYen)).toThrow('assigned');
    const spare=running.ownedVehicles.find((v)=>v.instanceId!==car.instanceId)!;
    const edited=installPart(running,spare.instanceId,'aoba-panel-filter','senka-cold-air'); expect(edited.racing).toEqual(running.racing);
  });
  it('earned titles and claimed prizes survive selling their winning car and later losses', () => {
    let s=raceToEnd(qualifiedRivalWorld(),first.event.id);s=claimAchievement(s,first.achievementId);
    const car=carForEvent(s,first.event.id); const other=s.ownedVehicles.find((v)=>v.instanceId!==car.instanceId)!;
    s=sellMarketVehicle(s,car.instanceId,getVehicleSaleKey(car,s.activeVehicleId),getVehicleValuation(car).offerYen,other.instanceId);
    expect(hasRivalWin(s,first.event.id)).toBe(true); expect(bonus(s)).toMatchObject({claimed:true,unlocked:true});
    expect(getRivalCampaign(s).title).toBe(first.title); expect(importSaveCode(exportSaveCode(s)).state).toEqual(s);
  });
  it('bonus cash overflow cannot consume the earned entitlement', () => {
    const s={...raceToEnd(qualifiedRivalWorld(),first.event.id),cashYen:Number.MAX_SAFE_INTEGER}; const before=structuredClone(s);
    expect(()=>claimAchievement(s,first.achievementId)).toThrow('safe cash'); expect(s).toEqual(before);expect(bonus(s).claimable).toBe(true);
  });
});

describe('Catalog and save compatibility', () => {
  it('loads the actual Phase-12 v10 fixture byte-exactly without re-anchoring running managers or modifying paid activities', () => {
    const s=deserializeSave(JSON.stringify(v10)).state; expect(s).toEqual(v10.state);expect(SAVE_VERSION).toBe(10);
    const before=serializeSave(s,v10.savedAt);const output=getEmpireProduction(s.empire,160000);
    for(const c of RIVAL_CHALLENGES){getRivalGoals(s,c);getRivalEntryRequirement(s,c.event.id);bonus(s,c.achievementId);}
    expect(getRivalCampaign(s).defeated).toBe(0);expect(serializeSave(s,v10.savedAt)).toBe(before);
    expect(getEmpireProduction(s.empire,160000)).toEqual(output);expect(recordCollectionProgress(s)).toEqual(s);
  });
  it('accepts a full 13-event history and preserves its first-victory title claims', () => {
    let s=defeatedRivalWorld(5); for(const e of RACE_EVENTS.filter((e)=>e.tier==='Rookie'))s=raceToEnd(s,e.id);
    expect(s.racing.records).toHaveLength(13);expect(isRacingState(s.racing,s.ownedVehicles)).toBe(true);
    for(const c of RIVAL_CHALLENGES)s=claimAchievement(s,c.achievementId);
    expect(getRivalCampaign(s)).toMatchObject({defeated:5,champion:true,title:'Kagehama Night Champion'});
    expect(importSaveCode(exportSaveCode(s)).state).toEqual(s);
  });
  it('rejects unknown events, mathematically altered snapshots and malformed duplicate claims', () => {
    const s=qualifiedRivalWorld(),car=carForEvent(s,first.event.id); const pending=startRace(s,first.event.id,car.instanceId,getRaceBuildKey(car),1000);
    const race=structuredClone(pending.racing.activeRace!);expect(isRaceSnapshot(race)).toBe(true);
    race.eventId='rival-forged';expect(isRaceSnapshot(race)).toBe(false);race.eventId=first.event.id;race.entrants[0].totalTimeMs--;expect(isRaceSnapshot(race)).toBe(false);
    const dup=raceToEnd(s,first.event.id);dup.collection.claimedAchievementIds=[first.achievementId,first.achievementId];expect(isGameState(dup)).toBe(false);
  });
  it('does not reconstruct boss victories from pre-existing ordinary-race wins or new-game timers', () => {
    const s=qualifiedRivalWorld();expect(s.racing.wins).toBeGreaterThan(0);expect(getRivalCampaign(s).defeated).toBe(0);
    expect(RIVAL_CHALLENGES.every((c)=>!bonus(s,c.achievementId).unlocked)).toBe(true);
  });
  it('does not make rare cars universally faster: multiple purchasable builds win and different disciplines favour different models', () => {
    const rows=VEHICLE_CATALOG.map((m)=>{const car={...createPlayerVehicle('pico-rs',m.id),catalogId:m.id,name:m.name,hp:m.hp,weightKg:m.weightKg,engineCondition:100,transmissionCondition:100};
      for(const id of RIVAL_TEST_PARTS){const p=findPart(id)!;if(p.compatibleCatalogIds.includes(m.id)){car.tuning.purchasedPartIds.push(id);car.tuning.installedBySlot[p.slot]=id;}}
      return {model:m.id,wins:RIVAL_CHALLENGES.map((c)=>simulateSectors(getVehicleRaceBuild(car),c.event.sectors).reduce((a,b)=>a+b,0)<simulateSectors(c.event.rivals[0].build,c.event.sectors).reduce((a,b)=>a+b,0))};});
    for(let i=0;i<5;i++)expect(rows.filter((r)=>r.wins[i]).length).toBeGreaterThanOrEqual(2);
    expect(rows.find((r)=>r.model==='rz-t')!.wins[0]).toBe(true);expect(rows.find((r)=>r.model==='rz-t')!.wins[1]).toBe(false);
    expect(rows.find((r)=>r.model==='pico-r')!.wins[1]).toBe(true);expect(rows.find((r)=>r.model==='pico-r')!.wins[4]).toBe(true);
    expect(rows.find((r)=>r.model==='kestrel-gt')!.wins[1]).toBe(false);
  });
});
