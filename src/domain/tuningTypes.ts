export const TUNING_SLOTS = ['intake', 'exhaust', 'ecu', 'tires', 'suspension', 'brakes', 'weight', 'turbo'] as const;
export type TuningSlot = typeof TUNING_SLOTS[number];
export type VehicleTuning = {
  purchasedPartIds: string[];
  installedBySlot: Partial<Record<TuningSlot, string>>;
};
export type BuildModifiers = {
  powerBps?: number;
  weightKg?: number;
  grip?: number;
  handling?: number;
  braking?: number;
  reliability?: number;
  originalityPenalty?: number;
};
export type VehicleBuildStats = {
  powerPs: number;
  weightKg: number;
  powerToWeight: number;
  grip: number;
  handling: number;
  braking: number;
  reliability: number;
  originality: number;
};
