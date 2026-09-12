import { BriefcaseBusiness, Check, Clock3, LockKeyhole, Route, TrendingUp } from 'lucide-react';
import { DistrictFilter } from './DistrictFilter';
import type { DistrictFilter as CityFilter } from '../data/city';
import { getDistrictJobs } from '../domain/city';
import { findJob, JOBS } from '../data/jobs';
import { getJobRequirement } from '../domain/economy';
import { getLevelProgress, LEVEL_CAP } from '../domain/progression';
import { getActiveVehicle } from '../domain/garage';
import type { GameState } from '../domain/types';
const yen = (value: number) => `¥${value.toLocaleString('en-US')}`;
const time = (ms: number) => { const seconds = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`; };
export function Jobs({ game, now, blocked, onStart, onClaim, onCancel, districtFilter, onDistrictFilter }: {
  districtFilter: CityFilter; onDistrictFilter: (value: CityFilter) => void;
  game: GameState; now: number; blocked: boolean; onStart: (id: string) => boolean;
  onClaim: (id: number) => boolean; onCancel: (id: number) => boolean;
}) {
  const { activeJob: active, lastReceipt: receipt } = game.economy;
  const validClock = Number.isSafeInteger(now) && now >= 0 && (!active || now >= active.startedAtMs);
  const ready = !!active && validClock && now >= active.finishesAtMs;
  const progress = active && validClock ? Math.min(100, Math.max(0, (now - active.startedAtMs) / (active.finishesAtMs - active.startedAtMs) * 100)) : 0;
  const level = getLevelProgress(game.reputation, game.playerLevel);
  const assigned = game.ownedVehicles.find((vehicle) => vehicle.instanceId === active?.vehicleId);
  const nextUnlock = JOBS.find((job) => job.minLevel > game.playerLevel);
  function cancel() { if (active && window.confirm('Cancel this job?\n\nNo reward or mileage will be awarded. You can accept another job afterwards.')) onCancel(active.runId); }
  return <section id="jobs" className="jobsPanel" aria-labelledby="jobs-title">
    <div className="jobsHeading"><div><span className="eyebrow">EAST WARD / FIRST CONTACTS</span><h2 id="jobs-title">Earn your place.</h2></div><p>Honest work. Questionable cars.<br />One job at a time. No entry fees.</p></div>
    <div className="progressionPanel"><div className="levelEmblem"><TrendingUp size={20} /><span>LEVEL <strong data-testid="job-level">{game.playerLevel}</strong></span></div>
      <div className="repProgress"><div><strong>{game.reputation.toLocaleString('en-US')} REP</strong><span>{level.nextLevel === null ? `Level ${LEVEL_CAP} progression cap reached` : `${level.remainingRep} REP to Level ${level.nextLevel}`}</span></div>
        <progress aria-label="Reputation to next level" max={100} value={level.percent} /><p>{nextUnlock ? `Next contact: ${nextUnlock.name} at Level ${nextUnlock.minLevel}.` : 'All current jobs unlocked. Your next build is waiting in Workshop.'}</p></div>
      <div className="jobTotals"><span>COMPLETED <strong data-testid="jobs-completed">{game.economy.completedJobs}</strong></span><span>JOB EARNINGS <strong>{yen(game.economy.totalEarnedYen)}</strong></span></div>
    </div>
    {active && <article className={`activeJob ${ready ? 'jobReady' : ''}`} aria-label="Current job">
      <div className="activeJobHeading"><div><span className="eyebrow">CONTRACT #{active.runId} / {ready ? 'READY TO CLAIM' : 'IN PROGRESS'}</span><h3>{findJob(active.jobId)?.name}</h3>
        <p>{assigned ? `Assigned vehicle: ${assigned.name} · ${active.distanceKm} km on completion` : 'Workshop shift · your car stays parked'}</p></div>
        <strong className="jobClock" data-testid="job-countdown">{!validClock ? 'CLOCK ERROR' : ready ? 'READY' : time(active.finishesAtMs - now)}</strong></div>
      <progress aria-label="Current job progress" value={progress} max={100} />
      <div className="jobActions"><span className="jobPayout">{yen(active.rewardYen)} <small>+ {active.reputationReward} REP</small></span><div>
        <button type="button" className="secondaryButton" disabled={blocked} onClick={cancel}>CANCEL JOB</button>
        <button type="button" className="claimButton" disabled={blocked || !ready} onClick={() => onClaim(active.runId)}><Check size={16} /> CLAIM REWARD</button></div></div>
      {!validClock ? <p role="alert">Device clock moved backwards or is invalid. Restore it or cancel this job.</p> : <p className="jobNote">{ready ? 'Your reward is waiting. It is only paid when you claim it.' : 'You can switch tabs or close the page. This one contract will wait for you; jobs never auto-repeat.'}</p>}
    </article>}
    {receipt && !active && <div className="jobReceipt" role="status" data-testid="job-receipt"><Check size={18} /><div><strong>{findJob(receipt.jobId)?.name} complete · {yen(receipt.rewardYen)} + {receipt.reputationReward} REP</strong>
      <p>{receipt.levelAfter > receipt.levelBefore ? `LEVEL UP! Level ${receipt.levelAfter}. Check the new contacts below.` : 'Payment saved. Ready for another contract.'}</p></div></div>}
    <DistrictFilter kind="Job" value={districtFilter} onChange={onDistrictFilter} />
    <div className="jobGrid">{getDistrictJobs(districtFilter).map((job) => {
      const requirement = getJobRequirement(game, job); const locked = game.playerLevel < job.minLevel;
      return <article key={job.id} className={`jobCard ${locked ? 'jobLocked' : ''}`} aria-label={`${job.name} offer`}>
        <div className="jobCardTop"><span>{job.contact}</span>{locked ? <LockKeyhole size={18} /> : <BriefcaseBusiness size={18} />}</div><h3>{job.name}</h3><p>{job.description}</p>
        <dl className="jobOfferStats"><div><dt><Clock3 size={14} /> DURATION</dt><dd>{job.durationMs / 1000}s</dd></div><div><dt>PAYMENT</dt><dd>{yen(job.rewardYen)}</dd></div><div><dt>REPUTATION</dt><dd>+{job.reputationReward}</dd></div></dl>
        <div className="jobRoute"><Route size={14} /><span>{job.requiresVehicle ? `${job.distanceKm} km · ${getActiveVehicle(game)?.name ?? 'Active car required'}` : 'On foot · no wear or fuel costs'}</span></div>
        <p id={`requirement-${job.id}`} className="jobRequirement">{blocked ? 'Resolve the save warning first.' : requirement ?? `Level ${job.minLevel} · Available now`}</p>
        <button type="button" className="startJobButton" aria-label={`Start ${job.name}`} aria-describedby={`requirement-${job.id}`} disabled={blocked || !!requirement} onClick={() => onStart(job.id)}>{locked ? `UNLOCK AT LEVEL ${job.minLevel}` : 'ACCEPT JOB'}</button>
      </article>;
    })}</div>
    {getDistrictJobs(districtFilter).length === 0 && <p className="districtEmpty" role="status">No job contacts in this district yet. Select All job districts to see current offers.</p>}
    <p className="heatFootnote">Each claimed legal job removes up to 6 Heat. No police fine is added to these jobs.</p>
    <p className="jobNote">All three starters can do delivery work. Jobs add mileage, not damage, fuel bills or Heat. Spend your earnings on performance parts in Workshop.</p>
  </section>;
}
