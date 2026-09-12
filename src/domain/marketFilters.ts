import { findVehicleDefinition } from '../data/vehicles';
import type { MarketFilters, MarketListing } from './marketTypes';

export function createMarketFilters(): MarketFilters {
  return { query: '', manufacturer: 'all', bodyType: 'all', yearFrom: '', yearTo: '', sort: 'price-asc' };
}
export function getMarketFilterError(filters: MarketFilters): string | null {
  for (const year of [filters.yearFrom, filters.yearTo]) {
    if (year !== '' && (!/^\d{4}$/.test(year) || Number(year) < 1900 || Number(year) > 2100)) return 'Enter a four-digit year from 1900 to 2100, or leave it empty.';
  }
  if (filters.yearFrom && filters.yearTo && Number(filters.yearFrom) > Number(filters.yearTo)) return 'The earliest year cannot be after the latest year.';
  return null;
}
export function filterMarketListings(listings: readonly MarketListing[], filters: MarketFilters): MarketListing[] {
  if (getMarketFilterError(filters)) return [];
  const query = filters.query.trim().toLowerCase();
  const found = listings.filter((entry) => {
    const model = findVehicleDefinition(entry.vehicle.catalogId);
    return !!model && (filters.manufacturer === 'all' || model.manufacturer === filters.manufacturer)
      && (filters.bodyType === 'all' || model.bodyType === filters.bodyType)
      && (!filters.yearFrom || entry.vehicle.year >= Number(filters.yearFrom))
      && (!filters.yearTo || entry.vehicle.year <= Number(filters.yearTo))
      && (!query || `${entry.vehicle.name} ${entry.seller} ${entry.id}`.toLowerCase().includes(query));
  });
  const condition = (entry: MarketListing) => entry.vehicle.engineCondition + entry.vehicle.bodyCondition + entry.vehicle.transmissionCondition;
  return found.sort((a, b) => {
    let order = 0;
    switch (filters.sort) {
      case 'price-asc': order = a.askingPriceYen - b.askingPriceYen; break;
      case 'price-desc': order = b.askingPriceYen - a.askingPriceYen; break;
      case 'year-asc': order = a.vehicle.year - b.vehicle.year; break;
      case 'year-desc': order = b.vehicle.year - a.vehicle.year; break;
      case 'mileage': order = a.vehicle.odometerKm - b.vehicle.odometerKm; break;
      case 'condition': order = condition(b) - condition(a); break;
    }
    return order || a.id.localeCompare(b.id, 'en');
  });
}
