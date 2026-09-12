/** Test worlds use a stated high-level starting balance; every acquisition/tune/result uses real commands. */
import { createNewGameState, purchaseStarter } from '../../src/domain/game';
import { buyMarketVehicle } from '../../src/domain/market';
import { installPart } from '../../src/domain/tuning';
import { getRestorationQuote, restoreVehicle } from '../../src/domain/restoration';
import { getRaceBuildKey, startRace, settleRace } from '../../src/domain/racing';
import { RIVAL_CHALLENGES } from '../../src/data/rivals';
import { findPart } from '../../src/data/parts';
import type { GameState } from '../../src/domain/types';
export const RIVAL_TEST_PARTS = ['senka-cold-air', 'aoba-catback', 'kurogane-attack-ecu', 'senka-semi-slicks', 'senka-track-coils', 'senka-light-brakes', 'senka-lightweight-kit', 'kurogane-big-turbo'];
export function preparedRivalWorld(): GameState {
  let state = { ...purchaseStarter(createNewGameState(), 'rz-t', 'rival-test-rzt'), cashYen: 2_000_000, playerLevel: 20, reputation: 3800 };
  const lot = state.market.listings.find((lot) => lot.vehicle.catalogId === 'pico-r')!;
  state = buyMarketVehicle(state, lot.id, state.market.generation, lot.askingPriceYen);
  for (const id of state.ownedVehicles.map((car) => car.instanceId)) {
    const car = state.ownedVehicles.find((car) => car.instanceId === id)!;
    const quote = getRestorationQuote(car, 'full');
    state = restoreVehicle(state, id, 'full', quote.key, quote.costYen);
    for (const partId of RIVAL_TEST_PARTS) {
      const part = findPart(partId)!;
      if (part.compatibleCatalogIds.includes(car.catalogId)) state = installPart(state, id, partId, null);
    }
  }
  return state;
}
export function carForEvent(state: GameState, eventId: string) {
  return state.ownedVehicles.find((car) => car.catalogId === (['dockyard-club', 'eastline-club', 'rival-ironline', 'rival-meridian'].includes(eventId) ? 'rz-t' : 'pico-r'))!;
}
export function raceToEnd(state: GameState, eventId: string, vehicleId = carForEvent(state, eventId).instanceId, now = 1000) {
  const car = state.ownedVehicles.find((car) => car.instanceId === vehicleId)!;
  const started = startRace(state, eventId, vehicleId, getRaceBuildKey(car), now);
  const race = started.racing.activeRace!;
  return settleRace(started, race.runId, race.finishesAtMs);
}
export function qualifiedRivalWorld(): GameState {
  return RIVAL_CHALLENGES.filter((c) => c.qualifierId).reduce((state, challenge) => raceToEnd(state, challenge.qualifierId!), preparedRivalWorld());
}
export function defeatedRivalWorld(count = 4): GameState {
  return RIVAL_CHALLENGES.slice(0, count).reduce((state, c) => raceToEnd(state, c.event.id), qualifiedRivalWorld());
}
