import { RIVAL_EVENTS } from './rivals';
import type { RaceBuild, RaceDiscipline, RaceEvent, RacePrize, RaceSector, Rival } from '../domain/racingTypes';

export const DISCIPLINE_LABELS: Record<RaceDiscipline, string> = {
  sprint: 'Street Sprint', drag: 'Drag', touge: 'Touge', expressway: 'Expressway',
};
const build = (powerPs: number, weightKg: number, grip: number, handling: number, braking: number,
  reliability: number, condition: number): RaceBuild => ({ powerPs, weightKg, grip, handling, braking,
    reliability, engineCondition: condition, transmissionCondition: condition });
const ROOKIES: readonly Rival[] = [
  { name: 'Kei / Night Clerk', vehicleName: 'Hoshino Pico RS', catalogId: 'pico-rs', build: build(108, 920, 51, 61, 49, 86, 85) },
  { name: 'Nori / Side Street', vehicleName: 'Hoshino Tora 85', catalogId: 'tora-85', build: build(120, 980, 50, 64, 48, 76, 80) },
  { name: 'Mako / Loose Change', vehicleName: 'Akari RZ-T', catalogId: 'rz-t', build: build(150, 1190, 48, 50, 48, 65, 70) },
];
const CLUB: readonly Rival[] = [
  { name: 'Sora / Apex Habit', vehicleName: 'Hoshino Tora 85', catalogId: 'tora-85', build: build(155, 910, 68, 78, 63, 78, 92) },
  { name: 'Ren / Afterburn', vehicleName: 'Akari RZ-T', catalogId: 'rz-t', build: build(200, 1210, 60, 58, 59, 62, 86) },
  { name: 'Yui / Late Braker', vehicleName: 'Hoshino Pico RS', catalogId: 'pico-rs', build: build(142, 940, 73, 84, 68, 81, 91) },
];
const COURSES: Record<RaceDiscipline, readonly RaceSector[]> = {
  sprint: [
    { name: 'Station launch', profile: 'launch', baseTimeMs: 5000 },
    { name: 'Side-street rhythm', profile: 'flow', baseTimeMs: 18000 },
    { name: 'Warehouse hairpin', profile: 'braking', baseTimeMs: 9000 },
    { name: 'Last straight', profile: 'straight', baseTimeMs: 15000 },
  ],
  drag: [
    { name: 'Reaction & traction', profile: 'launch', baseTimeMs: 7000 },
    { name: 'Pull through the gears', profile: 'straight', baseTimeMs: 9000 },
    { name: 'Finish-line charge', profile: 'highspeed', baseTimeMs: 5000 },
  ],
  touge: [
    { name: 'Trail-braking entry', profile: 'braking', baseTimeMs: 10000 },
    { name: 'Lantern hairpins', profile: 'technical', baseTimeMs: 22000 },
    { name: 'Ridge transitions', profile: 'flow', baseTimeMs: 14000 },
    { name: 'Final switchbacks', profile: 'technical', baseTimeMs: 22000 },
  ],
  expressway: [
    { name: 'On-ramp launch', profile: 'launch', baseTimeMs: 5000 },
    { name: 'Eastline straight', profile: 'highspeed', baseTimeMs: 28000 },
    { name: 'Interchange sweep', profile: 'flow', baseTimeMs: 9000 },
    { name: 'Bay tunnel', profile: 'highspeed', baseTimeMs: 28000 },
  ],
};
const FOCUS: Record<RaceDiscipline, string> = {
  sprint: 'Acceleration, handling and braking. Bring a balanced build.',
  drag: 'Launch grip, power-to-weight and power. Three sectors, one straight fight.',
  touge: 'Handling, grip, braking and low weight. Horsepower alone will not win.',
  expressway: 'Power, acceleration and high-speed consistency. Big turbos have a home here.',
};
const prizes = (yen: number[], reputation: number[]): RacePrize[] => yen.map((value, i) => ({ yen: value, reputation: reputation[i] }));
function event(id: string, name: string, discipline: RaceDiscipline, tier: 'Rookie' | 'Club', minLevel: number,
  entryFeeYen: number, playbackSeconds: number, distanceKm: number, yen: number[], rep: number[], description: string): RaceEvent {
  return { id, name, discipline, tier, minLevel, entryFeeYen, playbackMs: playbackSeconds * 1000, distanceKm,
    prizes: prizes(yen, rep), description, focus: FOCUS[discipline], sectors: COURSES[discipline], rivals: tier === 'Rookie' ? ROOKIES : CLUB };
}
/** Provisional game balance, not real street-racing routes or physical lap predictions. */
export const RACE_EVENTS: readonly RaceEvent[] = [
  event('east-ward-shakedown', 'East Ward Shakedown', 'sprint', 'Rookie', 1, 0, 18, 3,
    [3000, 1800, 1000, 400], [8, 5, 3, 1], 'Your first invitation. No entry fee, no excuses. A place to learn what your car can do.'),
  event('dockyard-402', 'Dockyard 402', 'drag', 'Rookie', 2, 1000, 15, 1,
    [5500, 3200, 1800, 500], [12, 8, 5, 2], 'A short dockside drag. One kilometre of odometer use includes staging and the return lane.'),
  event('hakuro-intro', 'Hakuro First Descent', 'touge', 'Rookie', 2, 1000, 25, 5,
    [6500, 3800, 2000, 500], [14, 9, 5, 2], 'The pass rewards tidy lines and late braking. The lightest car is not here by accident.'),
  event('eastline-entry', 'Eastline After Hours', 'expressway', 'Rookie', 3, 1500, 30, 12,
    [8000, 4500, 2400, 700], [18, 11, 7, 3], 'Long straights, tunnel lights and an invitation to finally use that turbo.'),
  event('ward-club', 'Ward Club Circuit', 'sprint', 'Club', 4, 2000, 25, 6,
    [10000, 6000, 3000, 1000], [24, 16, 9, 4], 'The local regulars have stopped bringing stock cars. Match the whole build, not just the engine.'),
  event('dockyard-club', 'Dockyard Redline', 'drag', 'Club', 5, 3000, 20, 1,
    [12500, 7500, 3800, 1500], [28, 18, 11, 5], 'The quick lane. Launch grip still matters when everyone brings more power.'),
  event('hakuro-club', 'Hakuro Switchback Club', 'touge', 'Club', 5, 3000, 30, 7,
    [14500, 8500, 4500, 1500], [32, 20, 12, 6], 'A technical run against the late-braking regulars. A grip build can humble a bigger turbo.'),
  event('eastline-club', 'Eastline Midnight Club', 'expressway', 'Club', 6, 4000, 35, 18,
    [17500, 10000, 5500, 2000], [38, 24, 14, 7], 'The longest run on the first event board. Bring sustained power and enough balance to use it.'),
];
/** Validation and lookup include the separate Rival board; open-event browsing stays at eight. */
export const ALL_RACE_EVENTS: readonly RaceEvent[] = [...RACE_EVENTS, ...RIVAL_EVENTS];
export const findRaceEvent = (id: string): RaceEvent | undefined => ALL_RACE_EVENTS.find((race) => race.id === id);
