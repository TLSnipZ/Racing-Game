export type BusinessState = {
  id: string; level: number; managerHired: boolean;
  /** Start of the not-yet-accounted-for batch; null means deliberately stopped. */
  startedAtMs: number | null;
  /** Completed, uncollected batches carried across an explicit pause/upgrade. */
  bankedYen: number;
};
export type EmpireAction = 'buy' | 'upgrade' | 'manager' | 'start' | 'pause' | 'collect' | 'collect-all' | 'expand';
export type EmpireOrder = { action: EmpireAction; businessId: string | null; revision: number; priceYen: number };
export type EmpireReceipt = { revision: number; action: EmpireAction; businessId: string | null; amountYen: number; atMs: number };
export type EmpireState = {
  version: 1; revision: number; businesses: BusinessState[]; garageExpansionLevel: number;
  totalSpentYen: number; totalCollectedYen: number; lastReceipt: EmpireReceipt | null;
};
