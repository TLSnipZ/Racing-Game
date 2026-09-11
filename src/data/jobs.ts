export type JobId = 'garage-shift' | 'parts-run' | 'dock-delivery';
export type JobDefinition = {
  id: JobId;
  name: string;
  contact: string;
  description: string;
  minLevel: number;
  durationMs: number;
  rewardYen: number;
  reputationReward: number;
  distanceKm: number;
  requiresVehicle: boolean;
};

/** Initial pre-alpha balance. Yen are whole integers, not real-world wage estimates. */
export const JOBS: readonly JobDefinition[] = [
  {
    id: 'garage-shift', name: 'Garage Shift', contact: 'MERCER GARAGE', minLevel: 1,
    description: 'Sort tools and clean the workshop. Not glamorous. Neither is being broke.',
    durationMs: 15_000, rewardYen: 1_500, reputationReward: 4, distanceKm: 0, requiresVehicle: false,
  },
  {
    id: 'parts-run', name: 'Parts Run', contact: 'EAST WARD PARTS', minLevel: 2,
    description: 'Deliver a box of parts across East Ward. The customer is waiting, not racing.',
    durationMs: 30_000, rewardYen: 3_000, reputationReward: 8, distanceKm: 6, requiresVehicle: true,
  },
  {
    id: 'dock-delivery', name: 'Dockside Delivery', contact: 'HARBOR DISPATCH', minLevel: 3,
    description: 'Take workshop supplies to the docks. Reliable deliveries earn better contacts.',
    durationMs: 45_000, rewardYen: 5_500, reputationReward: 14, distanceKm: 12, requiresVehicle: true,
  },
];

export const findJob = (id: string): JobDefinition | undefined => JOBS.find((job) => job.id === id);
