import { VEHICLE_CATALOG, type ManufacturerId } from '../data/vehicles';
import { getCollectedModelIds } from './collectionProgress';
import type { CollectionStatus, Rarity } from './collectionTypes';
import type { GameState } from './types';
export type BookFilters = { query: string; rarity: Rarity | 'all'; manufacturer: ManufacturerId | 'all'; status: CollectionStatus };
export const createBookFilters = (): BookFilters => ({ query: '', rarity: 'all', manufacturer: 'all', status: 'all' });
export function listCollectionModels(state: GameState, filters: BookFilters) {
  const collected = getCollectedModelIds(state);
  const owned = new Set(state.ownedVehicles.map((car) => car.catalogId));
  const query = filters.query.trim().toLowerCase();
  return VEHICLE_CATALOG.filter((model) => (filters.rarity === 'all' || model.rarity === filters.rarity)
    && (filters.manufacturer === 'all' || model.manufacturer === filters.manufacturer)
    && (filters.status === 'all' || (filters.status === 'owned' ? owned.has(model.id)
      : filters.status === 'collected' ? collected.includes(model.id) : !collected.includes(model.id)))
    && `${model.name} ${model.id} ${model.years.join(' ')}`.toLowerCase().includes(query));
}
