import { RESTORATION_SERVICES } from '../data/advancedCars';
import { findVehicleDefinition } from '../data/vehicles';
import { recordSpecialistAction, safeAdvancedAdd } from './advanced';
import { isAdvancedLinked, isAdvancedState } from './advancedValidation';
import { withCollectionProgress } from './collectionProgress';
import { isVehicleBusy } from './tuning';
import { isPlayerVehicle } from './vehicleValidation';
import type { RestorationService } from './advancedTypes';
import type { GameState, PlayerVehicle } from './types';

export function getRestorationQuote(car: PlayerVehicle, service: RestorationService) {
  const model = findVehicleDefinition(car.catalogId);
  if (!model || !isPlayerVehicle(car)) throw new Error('This historical car has no supported restoration quote.');
  const items = RESTORATION_SERVICES.filter((item) => service === 'full' || item.id === service);
  if (items.length === 0) throw new Error('Unknown restoration service.');
  const changes = items.map((item) => {
    const current = car[item.field];
    const deficitMilli = Math.ceil((100 - current) * 1000);
    const numerator = BigInt(model.referenceYen) * BigInt(deficitMilli) * BigInt(item.rateBps);
    const roundedHundreds = (numerator + 999999999n) / 1000000000n;
    const costYen = deficitMilli === 0 ? 0 : Math.max(500, Number(roundedHundreds * 100n));
    return { field: item.field, name: item.name, before: current, after: 100, costYen };
  });
  return { key: JSON.stringify([car, service]), service, vehicleId: car.instanceId, changes,
    costYen: changes.reduce((sum, item) => safeAdvancedAdd(sum, item.costYen), 0) };
}
export function getRestorationRequirement(state: GameState, car: PlayerVehicle, service: RestorationService): string | null {
  if (state.selectedStarterId === null) return 'Choose your starter first.';
  if (state.playerLevel < 2) return 'Requires Level 2.';
  if (!state.ownedVehicles.some((v) => v.instanceId === car.instanceId)) return 'This vehicle is no longer owned.';
  if (isVehicleBusy(state, car.instanceId)) return 'This car is assigned to a job or race. Claim, settle or cancel it before restoration.';
  try {
    const quote = getRestorationQuote(car, service);
    if (quote.costYen === 0) return 'Already at 100% condition for this service.';
    if (!Number.isSafeInteger(state.cashYen) || state.cashYen < quote.costYen) return 'Not enough valid cash.';
  } catch (error) { return error instanceof Error ? error.message : 'Restoration quote unavailable.'; }
  return null;
}
export const restoreVehicle = withCollectionProgress(function (state: GameState, id: string, service: RestorationService, expectedKey: string, expectedCost: number): GameState {
  if (!isAdvancedState(state.advanced) || !isAdvancedLinked(state.advanced, state)) throw new Error('Specialist data is invalid.');
  const car = state.ownedVehicles.find((v) => v.instanceId === id);
  if (!car) throw new Error('This vehicle is no longer owned.');
  const quote = getRestorationQuote(car, service);
  if (quote.key !== expectedKey || quote.costYen !== expectedCost) throw new Error('The car or restoration quote changed. Review it again.');
  const reason = getRestorationRequirement(state, car, service);
  if (reason) throw new Error(reason);
  const restored = { ...car };
  for (const change of quote.changes) restored[change.field] = change.after;
  return recordSpecialistAction({ ...state, cashYen: state.cashYen - quote.costYen,
    ownedVehicles: state.ownedVehicles.map((v) => v.instanceId === id ? restored : v),
    advanced: { ...state.advanced, restorationCount: safeAdvancedAdd(state.advanced.restorationCount, 1),
      restorationSpentYen: safeAdvancedAdd(state.advanced.restorationSpentYen, quote.costYen) } },
    { kind: 'restored', offerId: null, vehicleId: id, chargedYen: quote.costYen, refundedYen: 0 });
});
