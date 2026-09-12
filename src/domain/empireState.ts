import type { EmpireState } from './empireTypes';
export function createEmpireState(): EmpireState {
  return { version: 1, revision: 0, businesses: [], garageExpansionLevel: 0,
    totalSpentYen: 0, totalCollectedYen: 0, lastReceipt: null };
}
