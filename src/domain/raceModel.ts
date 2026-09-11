import type { ActiveRace, RaceBuild, RaceEntrant, RaceSector, SectorProfile } from './racingTypes';

const WEIGHTS = {
  launch: { acceleration: 55, grip: 30, reliability: 5, power: 5, handling: 5 },
  technical: { handling: 35, grip: 25, lightness: 20, braking: 15, acceleration: 5 },
  braking: { braking: 50, grip: 20, lightness: 20, handling: 10 },
  flow: { handling: 25, acceleration: 30, grip: 15, braking: 15, lightness: 15 },
  straight: { power: 40, acceleration: 50, grip: 5, reliability: 5 },
  highspeed: { power: 65, acceleration: 10, handling: 10, reliability: 15 },
} satisfies Record<SectorProfile, Partial<Record<string, number>>>;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Abstract deterministic sector model v1. Frozen for existing race snapshots. No RNG or wall clock. */
export function simulateSectors(build: RaceBuild, sectors: readonly RaceSector[]): number[] {
  const engineFactor = 8000 + build.engineCondition * 20;
  const transmissionFactor = 8000 + build.transmissionCondition * 20;
  const factors: Record<string, number> = {
    power: Math.round(clamp(build.powerPs * 50, 1000, 20000) * engineFactor / 10000),
    acceleration: Math.round(clamp(build.powerPs / build.weightKg * 50000, 1000, 20000)
      * engineFactor / 10000 * transmissionFactor / 10000),
    lightness: Math.round(clamp(10000000 / build.weightKg, 1000, 20000)),
    grip: build.grip * 100, handling: build.handling * 100, braking: build.braking * 100,
    reliability: build.reliability * 100,
  };
  return sectors.map((sector) => {
    const score = Math.round(Object.entries(WEIGHTS[sector.profile]).reduce((sum, [key, weight]) => sum + factors[key] * weight, 0) / 100);
    return Math.round(sector.baseTimeMs * 10000 / (4000 + score));
  });
}

/** Stable ties retain starting-grid order. The player occupies the fourth grid position. */
export function getRaceStandings(race: Pick<ActiveRace, 'entrants'>): RaceEntrant[] {
  return race.entrants.map((entrant, grid) => ({ entrant, grid }))
    .sort((a, b) => a.entrant.totalTimeMs - b.entrant.totalTimeMs || a.grid - b.grid).map(({ entrant }) => entrant);
}
export const getPlayerPosition = (race: Pick<ActiveRace, 'entrants'>): number => getRaceStandings(race).findIndex((e) => e.id === 'player') + 1;
export function isRaceReady(race: ActiveRace | null, nowMs: number): boolean {
  return !!race && Number.isSafeInteger(nowMs) && nowMs >= race.startedAtMs && nowMs >= race.finishesAtMs;
}

/** A presentation of the saved simulation, not a reward or state mutation. Equal-length visual sectors. */
export function getRaceProgress(race: ActiveRace, nowMs: number): {
  phase: 'clock-error' | 'countdown' | 'running' | 'finished'; countdown: number;
  elapsedSimMs: number; rows: { entrant: RaceEntrant; progress: number; sectorIndex: number }[];
} {
  const valid = Number.isSafeInteger(nowMs) && nowMs >= race.startedAtMs;
  const elapsed = valid ? Math.max(0, nowMs - race.startedAtMs) : 0;
  const countdown = Math.max(0, Math.ceil((race.countdownMs - elapsed) / 1000));
  const fraction = clamp((elapsed - race.countdownMs) / race.playbackMs, 0, 1);
  const elapsedSimMs = fraction * Math.max(...race.entrants.map((e) => e.totalTimeMs));
  const rows = race.entrants.map((entrant) => {
    let remaining = elapsedSimMs;
    let sectorIndex = 0;
    while (sectorIndex < entrant.sectorTimesMs.length && remaining >= entrant.sectorTimesMs[sectorIndex]) {
      remaining -= entrant.sectorTimesMs[sectorIndex]; sectorIndex++;
    }
    const partial = sectorIndex < entrant.sectorTimesMs.length ? remaining / entrant.sectorTimesMs[sectorIndex] : 0;
    return { entrant, progress: clamp((sectorIndex + partial) / entrant.sectorTimesMs.length * 100, 0, 100),
      sectorIndex: Math.min(sectorIndex, entrant.sectorTimesMs.length - 1) };
  });
  return { phase: !valid ? 'clock-error' : countdown > 0 ? 'countdown' : fraction >= 1 ? 'finished' : 'running', countdown, elapsedSimMs, rows };
}
