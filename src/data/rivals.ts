import type { DistrictId } from './city';
import type { RaceBuild, RaceEvent, RaceSector, Rival } from '../domain/racingTypes';

export type RivalChallenge = {
  readonly crew: string;
  readonly boss: string;
  readonly district: DistrictId;
  readonly number: string;
  readonly title: string;
  readonly achievementId: string;
  readonly bonusYen: number;
  readonly qualifierId: string | null;
  readonly qualifierName: string | null;
  readonly event: RaceEvent;
};
// Curated opponent builds, not references to mutable player cars. Race model v1 stays frozen.
const build = (powerPs: number, weightKg: number, grip: number, handling: number, braking: number,
  reliability: number): RaceBuild => ({ powerPs, weightKg, grip, handling, braking, reliability,
    engineCondition: 100, transmissionCondition: 100 });
function grid(boss: string, vehicleName: string, catalogId: string, setup: RaceBuild): Rival[] {
  return [
    { name: `${boss} / CREW BOSS`, vehicleName, catalogId, build: { ...setup } },
    { name: 'Iori / Second Shift', vehicleName, catalogId, build: { ...setup, powerPs: Math.floor(setup.powerPs * .92), grip: setup.grip - 4, handling: setup.handling - 4, braking: setup.braking - 4 } },
    { name: 'Riku / Overtime', vehicleName, catalogId, build: { ...setup, powerPs: Math.floor(setup.powerPs * .86), grip: setup.grip - 7, handling: setup.handling - 7, braking: setup.braking - 7 } },
  ];
}
const sector = (name: string, profile: RaceSector['profile'], baseTimeMs: number): RaceSector => ({ name, profile, baseTimeMs });
/** Five fixed events. No resets, random boss rerolls, pink slips or seasonal deadlines. */
export const RIVAL_CHALLENGES: readonly RivalChallenge[] = [
  { number: '01', crew: 'Ironline', boss: 'Daichi', district: 'dockside', title: 'Launch Authority',
    achievementId: 'crew-ironline', bonusYen: 20_000, qualifierId: 'dockyard-club', qualifierName: 'Dockyard Redline',
    event: { id: 'rival-ironline', name: 'Ironline: Last Container', discipline: 'drag', tier: 'Boss', minLevel: 6,
      entryFeeYen: 4000, playbackMs: 30_000, distanceKm: 1,
      description: 'Daichi calls his launch control a personality. Put a gap in his character development.',
      focus: 'Launch grip and power-to-weight, then sustained pull. A stock commuter needs more than confidence.',
      sectors: [sector('Container lights', 'launch', 9000), sector('Crane-line pull', 'straight', 14000), sector('Last container', 'highspeed', 6000)],
      rivals: grid('Daichi', 'Akari RZ-T', 'rz-t', build(230, 1150, 68, 62, 63, 70)),
      prizes: [{ yen: 12000, reputation: 36 }, { yen: 6500, reputation: 22 }, { yen: 4000, reputation: 12 }, { yen: 1500, reputation: 6 }] } },
  { number: '02', crew: 'Lantern Pact', boss: 'Ayame', district: 'hakuro', title: 'Keeper of the Pass',
    achievementId: 'crew-lantern', bonusYen: 30_000, qualifierId: 'hakuro-club', qualifierName: 'Hakuro Switchback Club',
    event: { id: 'rival-lantern', name: 'Lantern Pact: No Straight Answers', discipline: 'touge', tier: 'Boss', minLevel: 8,
      entryFeeYen: 5000, playbackMs: 40_000, distanceKm: 8,
      description: 'Ayame has never met a straight road she trusted. Your horsepower graph is not an invitation.',
      focus: 'Lightness, grip, brakes and handling. A balanced lightweight can beat a bigger engine here.',
      sectors: [sector('Shrine approach', 'braking', 16000), sector('Lantern staircase', 'technical', 26000), sector('Ridge rhythm', 'flow', 16000), sector('Last switchback', 'technical', 28000)],
      rivals: grid('Ayame', 'Hoshino Tora 85 Heritage', 'tora-heritage', build(168, 885, 73, 86, 71, 78)),
      prizes: [{ yen: 15000, reputation: 40 }, { yen: 8000, reputation: 25 }, { yen: 5000, reputation: 14 }, { yen: 2000, reputation: 7 }] } },
  { number: '03', crew: 'Black Static', boss: 'Souta', district: 'east-ward', title: 'Ward Headliner',
    achievementId: 'crew-static', bonusYen: 45_000, qualifierId: 'ward-club', qualifierName: 'Ward Club Circuit',
    event: { id: 'rival-static', name: 'Black Static: Off the Air', discipline: 'sprint', tier: 'Boss', minLevel: 10,
      entryFeeYen: 6000, playbackMs: 40_000, distanceKm: 9,
      description: 'Souta broadcasts every win to the entire ward. Give his microphone a quiet evening.',
      focus: 'A complete build: acceleration, grip, braking and transitions. Restore worn mechanicals before chasing power.',
      sectors: [sector('Station signal', 'launch', 8000), sector('Ward connections', 'flow', 22000), sector('Broadcast hairpin', 'braking', 15000), sector('Dead-air straight', 'straight', 19000)],
      rivals: grid('Souta', 'Hoshino Pico R', 'pico-r', build(214, 950, 76, 86, 74, 75)),
      prizes: [{ yen: 18000, reputation: 48 }, { yen: 9500, reputation: 30 }, { yen: 6000, reputation: 18 }, { yen: 2500, reputation: 9 }] } },
  { number: '04', crew: 'Zero Meridian', boss: 'Kaede', district: 'eastline', title: 'After-Hours Authority',
    achievementId: 'crew-meridian', bonusYen: 60_000, qualifierId: 'eastline-club', qualifierName: 'Eastline Midnight Club',
    event: { id: 'rival-meridian', name: 'Zero Meridian: Last Exit', discipline: 'expressway', tier: 'Boss', minLevel: 12,
      entryFeeYen: 8000, playbackMs: 45_000, distanceKm: 24,
      description: 'Kaede measures introductions in tunnel echoes. Bring enough engine to finish the conversation.',
      focus: 'Sustained power with reliability and some handling. Peak horsepower alone is not the entire invoice.',
      sectors: [sector('Last-exit ramp', 'launch', 7000), sector('Meridian tunnel', 'highspeed', 35000), sector('Bay interchange', 'flow', 14000), sector('Dawn approach', 'highspeed', 35000)],
      rivals: grid('Kaede', 'Akari Kestrel GT', 'kestrel-gt', build(250, 1260, 75, 75, 73, 75)),
      prizes: [{ yen: 23000, reputation: 56 }, { yen: 12500, reputation: 35 }, { yen: 8000, reputation: 21 }, { yen: 3000, reputation: 10 }] } },
  { number: '05', crew: 'Midnight Council', boss: 'Shin', district: 'east-ward', title: 'Kagehama Night Champion',
    achievementId: 'crown-midnight', bonusYen: 125_000, qualifierId: null, qualifierName: null,
    event: { id: 'rival-midnight-council', name: 'Midnight Council: The Last Invoice', discipline: 'sprint', tier: 'Boss', minLevel: 14,
      entryFeeYen: 10000, playbackMs: 50_000, distanceKm: 16,
      description: 'Four crews vouched for you. Shin would prefer they had stayed quiet. One last mixed-sector test.',
      focus: 'Finale: launch, technical corners, braking and high-speed sectors. A rounded endgame build, not a compulsory Icon purchase.',
      sectors: [sector('Council launch', 'launch', 8000), sector('Backstreet signatures', 'technical', 17000), sector('The fine print', 'braking', 16000), sector('Bayline flow', 'flow', 19000), sector('Final invoice', 'highspeed', 23000)],
      rivals: grid('Shin', 'Akari Kestrel GT', 'kestrel-gt', build(280, 1250, 76, 77, 74, 73)),
      prizes: [{ yen: 30000, reputation: 72 }, { yen: 16000, reputation: 45 }, { yen: 10000, reputation: 26 }, { yen: 4000, reputation: 12 }] } },
];
export const RIVAL_EVENTS: readonly RaceEvent[] = RIVAL_CHALLENGES.map((challenge) => challenge.event);
export const findRivalChallenge = (id: string): RivalChallenge | undefined => RIVAL_CHALLENGES.find((c) => c.event.id === id);
