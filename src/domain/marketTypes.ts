import type { PlayerVehicle } from './types';
import type { BodyType, ManufacturerId } from '../data/vehicles';

export type MarketListing = {
  id: string;
  vehicle: PlayerVehicle;
  askingPriceYen: number;
  minLevel: number;
  seller: string;
};
export type MarketTrade = {
  transactionId: number;
  kind: 'buy' | 'sell';
  vehicleId: string;
  vehicleName: string;
  amountYen: number;
};
export type MarketState = {
  stockVersion: 1;
  generation: number;
  refreshedAtMs: number | null;
  listings: MarketListing[];
  nextTransactionId: number;
  purchasedCount: number;
  soldCount: number;
  totalSpentYen: number;
  totalReceivedYen: number;
  lastTrade: MarketTrade | null;
};
export type MarketSort = 'price-asc' | 'price-desc' | 'year-desc' | 'year-asc' | 'mileage' | 'condition';
export type MarketFilters = {
  query: string;
  manufacturer: ManufacturerId | 'all';
  bodyType: BodyType | 'all';
  yearFrom: string;
  yearTo: string;
  sort: MarketSort;
};
