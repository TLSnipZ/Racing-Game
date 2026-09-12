import type { PlayerVehicle } from './types';
export type MarketListing = {
  id: string; vehicle: PlayerVehicle; askYen: number; minLevel: number; seller: string;
  demandBps: number; purchased: boolean;
};
export type MarketReceipt = { id: number; kind: 'buy' | 'sell'; vehicleId: string; vehicleName: string; amountYen: number };
export type MarketState = {
  stockVersion: 1; batch: number; refreshedAtMs: number | null; nextRefreshAtMs: number;
  listings: MarketListing[]; purchases: number; sales: number; totalSpentYen: number;
  totalReceivedYen: number; nextTradeId: number; lastTrade: MarketReceipt | null;
};
