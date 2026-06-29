export const ROLE_SLOT_MS = 3000;

const STORY_FADE_MS = ROLE_SLOT_MS * 0.05;
const SOURCE_ON_MS = ROLE_SLOT_MS * 0.17;
const GEAR_SPIN_START_MS = ROLE_SLOT_MS * 0.5;
const BEHAVIOR_ON_MS = ROLE_SLOT_MS * 0.6;
const STORY_OFF_MS = ROLE_SLOT_MS * 0.95;
const ROLE_RESET_MS = ROLE_SLOT_MS;

// The visual contract is source → gear → behavior, then source+behavior hold together.
export const roleBoundaryTiming = {
  filterDimStartMs: SOURCE_ON_MS - STORY_FADE_MS,
  filterOnMs: SOURCE_ON_MS,
  filterOffMs: STORY_OFF_MS,
  filterResetMs: ROLE_RESET_MS,
  gearSpinStartMs: GEAR_SPIN_START_MS,
  behaviorDimStartMs: BEHAVIOR_ON_MS - STORY_FADE_MS,
  behaviorOnMs: BEHAVIOR_ON_MS,
  behaviorOffMs: STORY_OFF_MS,
  behaviorResetMs: ROLE_RESET_MS,
};

export function getRoleCycleMs(roleCount: number) {
  return ROLE_SLOT_MS * roleCount;
}

export function getSourceBeforeGearMs() {
  return roleBoundaryTiming.gearSpinStartMs - roleBoundaryTiming.filterOnMs;
}

export function getSourceBehaviorOverlapMs() {
  return roleBoundaryTiming.filterOffMs - roleBoundaryTiming.behaviorOnMs;
}
