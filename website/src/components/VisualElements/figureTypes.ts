/**
 * The machine vocabulary both figures share: what a deployment target is, what
 * runs on it, and how a memory budget is bounded.
 *
 * WHY one module: two figures answer different questions about the same
 * machine. A target drawn in one rail and tested in another table must be one
 * type, or the two pages can disagree about what a machine is.
 *
 * Hand-written, like the dataset's typed view: a schema change stays a visible
 * edit and the generated artifact stays facts-only.
 */

export type EngineGroup = 'general' | 'specialized';

/** Accelerator vendor, the key the guide's engine tables publish support under. */
export type PlatformVendor = 'nvidia' | 'amd' | 'apple';

export type HardwareFamily =
  | 'workstation'
  | 'spark'
  | 'datacenter'
  | 'amd'
  | 'apple';

/** Picker order and vendor belong to the data; the UI maps over them. */
export type FamilyTarget = {
  id: HardwareFamily;
  label: string;
  vendor: PlatformVendor;
};

export type EngineTarget = {
  id: string;
  label: string;
  group: EngineGroup;
  /** Vendors the guide documents for this engine. Never inferred from hardware. */
  platforms: readonly PlatformVendor[];
};

export type HardwareTarget = {
  id: string;
  label: string;
  family: HardwareFamily;
  devices: number;
  /**
   * Residency budget for one deployment (per-device screen budget × devices).
   * Null when the guide publishes no screen budget — those targets only show
   * documented recipes, never a computed fit.
   */
  screenGib: number | null;
  /** Printed capacity for one deployment: the memory the machine bought. */
  nominalGib: number;
  /**
   * Memory the machine keeps for itself: the printed capacity less what the
   * guide screens at. Where the guide screens nothing, the platform's own
   * reserve rule stands in (unified memory shares more than a card does).
   */
  reserveGib: number;
  /**
   * Memory the accelerators share with the OS. The usable pool is then smaller
   * than the printed capacity for reasons the tier cannot fix.
   */
  unified: boolean;
  /** Memory bandwidth in GB/s; null when the guide publishes none for this SKU. */
  bandwidthGBs: number | null;
  /** Published link for multi-device placement; null when the guide names none. */
  interconnect: string | null;
  /**
   * System memory the vendor publishes for this target, in GiB. Null where no
   * source states it: a streamed layout needs a host tier the page can only
   * test when the machine's own figure exists.
   */
  hostGib: number | null;
  caveat: string;
};

/** A count per machine choice: the fits the same click leaves. A figure's own
 * resolver fills it, so a rail never promises a number its table does not print. */
export type RailCounts = {
  families: readonly {
    family: { id: HardwareFamily; label: string };
    fits: number;
  }[];
  devices: readonly { target: HardwareTarget; fits: number }[];
  deviceCounts: readonly { devices: number; fits: number }[];
};

/** Which machine and runtime a figure is set to. The workload is the figure's. */
export type MachineChoice = {
  hardwareId: string;
  /** 'all' keeps every checkpoint; an engine id filters to what it can serve. */
  engineId: string;
  /** Memory the reader gives inference, in GiB. Absent means the machine's own. */
  budgetGib?: number;
};

/**
 * The machine's memory split into the parts a budget cannot spend: the smallest
 * deployment that can serve the workload must fit, cache included, and the OS
 * keeps its share. Everything between the two ends is the reader's to set.
 */
export type MemoryBounds = {
  /** Memory the machine has: the track's full width. */
  trackGib: number;
  /** Memory the machine keeps for itself; the thumb never enters this area. */
  reserveGib: number;
  /** Widest budget the machine allows, snapped to the slider's step. */
  maxGib: number;
  /** Narrowest budget the slider allows: the floor of the need, snapped up. */
  minGib: number;
  /** The lightest deployment's memory, cache included. */
  floorGib: number;
  /** Marks the slider moves by: fine on a card, coarse on a node. */
  stepGib: number;
  /** The workload needs more than the machine can give, so the floor is moot. */
  outgrown: boolean;
  /** The need exceeds the ceiling, so the range is empty and there is no budget
   * to set: the panel shows supply against demand instead. */
  overfull: boolean;
};
