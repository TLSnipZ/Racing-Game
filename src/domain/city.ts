import { CITY_DISTRICTS, findDistrict, JOB_DISTRICTS, RACE_DISTRICTS, type DistrictFilter, type DistrictId } from '../data/city';
import { JOBS } from '../data/jobs';
import { RACE_EVENTS } from '../data/races';
import { reputationForLevel } from './progression';
import type { RaceDiscipline } from './racingTypes';
import type { GameState } from './types';

type CityPlayer = Pick<GameState, 'selectedStarterId' | 'playerLevel' | 'reputation'>;
export function getDistrictAccess(game: CityPlayer, districtId: string) {
  const district = findDistrict(districtId);
  if (!district) return { unlocked: false, reason: 'Unknown district.', remainingRep: 0, percent: 0 };
  if (district.minLevel === null) return { unlocked: false, reason: district.future ?? 'Future district.', remainingRep: 0, percent: 0 };
  if (game.selectedStarterId === null) return { unlocked: false, reason: 'Choose your starter first.', remainingRep: 0, percent: 0 };
  if (game.playerLevel >= district.minLevel) return { unlocked: true, reason: null, remainingRep: 0, percent: 100 };
  const target = reputationForLevel(district.minLevel);
  const remainingRep = Math.max(0, target - game.reputation);
  return { unlocked: false, reason: `Requires Level ${district.minLevel}.`, remainingRep,
    percent: target === 0 ? 0 : Math.max(0, Math.min(100, game.reputation / target * 100)) };
}
export function getUnlockedDistricts(game: CityPlayer) {
  return CITY_DISTRICTS.filter((district) => getDistrictAccess(game, district.id).unlocked);
}
export function getDistrictRaces(district: DistrictFilter, discipline: RaceDiscipline | 'all' = 'all') {
  return RACE_EVENTS.filter((event) => (district === 'all' || RACE_DISTRICTS[event.id] === district)
    && (discipline === 'all' || event.discipline === discipline));
}
export function getDistrictJobs(district: DistrictFilter) {
  return JOBS.filter((job) => district === 'all' || JOB_DISTRICTS[job.id] === district);
}
export function getDistrictRecords(game: GameState, district: DistrictId) {
  return game.racing.records.filter((record) => RACE_DISTRICTS[record.eventId] === district);
}
