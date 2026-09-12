import type { SpecialistView } from '../domain/advancedTypes';
import { useState } from 'react';
import { ArrowUpRight, Check, Flag, LockKeyhole, MapPin, Wrench } from 'lucide-react';
import { CITY_DISTRICTS, findDistrict, type DistrictId } from '../data/city';
import { DISCIPLINE_LABELS } from '../data/races';
import { getDistrictAccess, getDistrictJobs, getDistrictRaces, getDistrictRecords, getUnlockedDistricts } from '../domain/city';
import { getJobRequirement } from '../domain/economy';
import { getRaceRequirement } from '../domain/racing';
import type { GameState } from '../domain/types';

const yen = (value: number) => `¥${value.toLocaleString('en-US')}`;
export function City({ game, blocked, jobReady, raceReady, onRaces, onJobs, onService, onResume, onEmpire, onSpecialist }: {
  onEmpire: () => void;
  game: GameState; blocked: boolean; jobReady: boolean; raceReady: boolean;
  onRaces: (district: DistrictId) => void; onJobs: (district: DistrictId) => void;
  onSpecialist: (view: SpecialistView) => void;
  onService: (section: 'garage' | 'workshop' | 'market') => void; onResume: (section: 'jobs' | 'races') => void;
}) {
  const [selectedId, setSelectedId] = useState<DistrictId>('east-ward');
  const district = findDistrict(selectedId)!;
  const access = getDistrictAccess(game, district.id);
  const races = getDistrictRaces(district.id);
  const jobs = getDistrictJobs(district.id);
  const records = getDistrictRecords(game, district.id);
  const next = CITY_DISTRICTS.find((area) => area.minLevel !== null && area.minLevel > game.playerLevel);
  const job = game.economy.activeJob;
  const race = game.racing.activeRace;
  const cannotOpen = blocked || !access.unlocked;

  return <section className="cityPanel" aria-labelledby="city-title">
    <div className="cityHeading"><div><span className="eyebrow">KAGEHAMA BAY / DISTRICT DIRECTORY</span>
      <h2 id="city-title">Know your streets.</h2><p>One city. Different scenes. Find the place for your build.</p></div>
      <div className="cityAccessCount"><strong>{getUnlockedDistricts(game).length} / {CITY_DISTRICTS.filter((area) => area.minLevel !== null).length}</strong><span>DISTRICTS OPEN</span></div></div>
    <div className="cityIntro"><MapPin size={19} aria-hidden="true" /><p>
      {next ? `Next access: Level ${next.minLevel}. Earn reputation in jobs or races to open more of the city.` : 'Every current district is open. Club invitations keep their own level requirements.'}
      <small>This is a directory, not travel. Exploring costs nothing and never starts an activity.</small></p></div>
    {(job || race) && <aside className="cityPending" aria-label="Pending city activity">
      <div><span>{jobReady || raceReady ? 'READY TO COLLECT' : 'ACTIVITY IN PROGRESS'}</span>
        <strong>{race ? race.eventName : 'Your accepted job'}</strong><p>Your original vehicle and deadline are unchanged.</p></div>
      <button type="button" className="secondaryButton" onClick={() => onResume(race ? 'races' : 'jobs')}>
        {race ? 'OPEN CURRENT RACE' : 'OPEN CURRENT JOB'} <ArrowUpRight size={15} /></button>
    </aside>}

    <div className="cityWorkspace">
      <div className="cityMap" role="group" aria-label="City districts">
        <div className="cityMapTop"><span>DISTRICT NETWORK / SELECT TO INSPECT</span><b>N ↑</b></div>
        <div className="districtNodes">{CITY_DISTRICTS.map((area) => {
          const status = getDistrictAccess(game, area.id);
          return <button key={area.id} type="button" className={`districtNode area-${area.id} ${status.unlocked ? 'areaOpen' : 'areaLocked'}`}
            aria-label={`Inspect ${area.name}`} aria-pressed={selectedId === area.id} aria-controls="city-district-details"
            onClick={() => setSelectedId(area.id)}>
            <span className="districtNodeTop"><b>{area.number}</b>{status.unlocked ? <Check size={15} /> : <LockKeyhole size={15} />}</span>
            <strong>{area.name}</strong><span className="districtScene">{area.scene}</span>
            <small data-testid={`district-${area.id}-state`}>{area.minLevel === null ? 'PLANNED · NOT AVAILABLE' : status.unlocked ? `OPEN · LEVEL ${area.minLevel}+` : `LOCKED · LEVEL ${area.minLevel}`}</small>
          </button>;
        })}</div>
        <div className="cityMapBottom"><span>COASTAL NETWORK · SCHEMATIC, NOT FINAL ART</span><span>影浜湾 / KAGEHAMA BAY</span></div>
      </div>

      <article id="city-district-details" className="districtDetails" aria-labelledby="district-title">
        <span className="eyebrow">AREA {district.number} / {district.scene}</span>
        <h3 id="district-title">{district.name}</h3><p>{district.description}</p>
        {access.unlocked ? <div className="districtStatus"><Check size={16} /> AREA OPEN · No entrance fee</div>
          : <div className="districtGate" role="status"><LockKeyhole size={16} /><strong>{access.reason}</strong>
            {district.minLevel !== null && <><progress aria-label={`${district.name} unlock progress`} max={100} value={access.percent} />
              <small>{access.remainingRep} more REP towards Level {district.minLevel}. Individual activities can require a higher level.</small></>}
          </div>}
        {blocked && <p className="workshopWarning">Resolve the global save warning before opening new activities. Your pending result remains accessible.</p>}
        {district.future ? <p className="cityFuture">Preview only. There is nothing to buy or activate in this district yet.</p> : <>
          <dl className="districtStats"><div><dt>Race invitations</dt><dd>{races.length}</dd></div><div><dt>Job contacts</dt><dd>{jobs.length}</dd></div>
            <div><dt>Events completed</dt><dd>{records.length} / {races.length}</dd></div></dl>
          <div className="districtLinks">
            {district.id === 'industrial' && <button type="button" className="cityPrimary" disabled={cannotOpen} onClick={onEmpire}>OPEN BUSINESS DISTRICT <ArrowUpRight size={15} /></button>}
            {district.id === 'outskirts' && <button type="button" className="cityPrimary" disabled={cannotOpen} onClick={() => { if (!cannotOpen) onSpecialist('barns'); }}>EXPLORE BARN FINDS</button>}
            {district.id === 'dockside' && <button type="button" className="secondaryButton" disabled={cannotOpen} onClick={() => { if (!cannotOpen) onSpecialist('imports'); }}>OPEN IMPORT DESK</button>}
            {district.id === 'east-ward' && <button type="button" className="secondaryButton" disabled={cannotOpen} onClick={() => { if (!cannotOpen) onSpecialist('auctions'); }}>OPEN AUCTION DESK</button>}
            {races.length > 0 && <button type="button" className="cityPrimary" disabled={cannotOpen}
              onClick={() => { if (!cannotOpen) onRaces(district.id); }}><Flag size={16} /> BROWSE {district.name.toUpperCase()} RACES <ArrowUpRight size={15} /></button>}
            {jobs.length > 0 && <button type="button" className="secondaryButton" disabled={cannotOpen}
              onClick={() => { if (!cannotOpen) onJobs(district.id); }}>BROWSE {district.name.toUpperCase()} JOBS <ArrowUpRight size={15} /></button>}
            {district.services.map((service) => <button key={service} type="button" className="secondaryButton" disabled={cannotOpen}
              onClick={() => { if (!cannotOpen) onService(service); }}><Wrench size={15} /> {service === 'market' ? 'OPEN USED CAR MARKET' : service === 'workshop' ? 'OPEN MERCER WORKSHOP' : 'OPEN YOUR GARAGE'}</button>)}
          </div>
        </>}
      </article>
    </div>

    {!district.future && <div className="cityActivityDirectory" aria-label={`${district.name} activities`}>
      <div className="workshopSubheading"><h3>Inside {district.name}</h3><span>Browse here · confirm entry in the activity tab</span></div>
      <div className="cityActivityGrid">
        {district.id === 'outskirts' && <article className="cityActivityCard"><span className="eyebrow">SPECIALIST / OLD ORCHARD</span><h4>A classic under the dust.</h4><p>Level 5 survey: ¥5,000, 45 seconds. The known Hachi GT recovery then costs ¥55,000, with restoration quoted separately in Workshop.</p><small>Browsing does not start a survey. No random reload discoveries.</small></article>}
        {races.map((event) => {
          const requirement = access.reason ?? getRaceRequirement(game, event, game.activeVehicleId ?? '');
          const record = records.find((item) => item.eventId === event.id);
          return <article className="cityActivityCard" key={event.id}><span className="eyebrow">{DISCIPLINE_LABELS[event.discipline]} / {event.tier}</span>
            <h4>{event.name}</h4><p>{event.focus}</p><strong>Level {event.minLevel} · Entry {event.entryFeeYen ? yen(event.entryFeeYen) : 'FREE'}</strong>
            <small>{record ? `Personal best: P${record.bestPosition} · ${(record.bestTimeMs / 1000).toFixed(3)}s` : 'No settled result recorded yet.'}</small>
            <p className="cityActivityState">{blocked ? 'Resolve the save warning first.' : requirement ?? 'Available with your active garage car. Review all prizes in Races.'}</p></article>;
        })}
        {jobs.map((offer) => <article className="cityActivityCard" key={offer.id}><span className="eyebrow">JOB / {offer.contact}</span>
          <h4>{offer.name}</h4><p>{offer.description}</p><strong>Level {offer.minLevel} · {yen(offer.rewardYen)} + {offer.reputationReward} REP</strong>
          <small>{offer.durationMs / 1000}s · No entry fee</small>
          <p className="cityActivityState">{blocked ? 'Resolve the save warning first.' : access.reason ?? getJobRequirement(game, offer) ?? 'Available. Accept it in Jobs.'}</p></article>)}
      </div>
    </div>}
    <p className="cityFootnote">District access follows your existing level. There are no travel timers, tolls, unlock rewards or extra saves when browsing. Races and jobs still need their own confirmation and can never run together.</p>
  </section>;
}
