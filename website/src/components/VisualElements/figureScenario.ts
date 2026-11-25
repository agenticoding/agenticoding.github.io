/**
 * A figure's machine: hardware, device count, runtime, and the budget the reader
 * gives inference. One store per figure, both seeded from `DEFAULT_MACHINE`.
 *
 * WHY not one store across figures: the fit figure sits above the classifier in
 * one document flow, and its table draws one row per fitting model (0-16 rows,
 * 581-1428 px). A shared machine meant a click in either rail resized that
 * table and pushed the other figure by up to 521 px, out from under the reader
 * (measured 1440, 2026-11-24). Two stores keep each figure's top where the
 * reader left it; the default machine is the one fact they still share.
 *
 * WHY a module store instead of props: the figures live in separate sections of
 * the page. Threading state through MDX would wrap prose in a component and
 * re-render it on every chip click; a subscription keeps the prose static.
 *
 * WHY not URL state: the page is prerendered, so a query-string read would
 * hydrate into a different first paint.
 */
import { useSyncExternalStore } from 'react';

import { FAMILIES, hardwareIdFor, hardwareOfFamily } from './figureCatalog.ts';
import type { MachineChoice } from './figureTypes.ts';

export type Store<T> = {
  use: () => T;
  /** Reads the current value without subscribing: an event handler's view. */
  get: () => T;
  update: (patch: Partial<T>) => void;
};

/** A module store over one immutable snapshot. */
export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  // Identity is stable until the next update, which is what the store contract
  // needs: a fresh object on every read would re-render forever.
  const snapshot = () => state;
  const serverSnapshot = () => initial;
  return {
    use: () => useSyncExternalStore(subscribe, snapshot, serverSnapshot),
    get: snapshot,
    update: (patch) => {
      state = { ...state, ...patch };
      for (const listener of listeners) listener();
    },
  };
}

export type MachineScenarioState = {
  baseId: string;
  devices: number;
  engineId: string;
  /** Memory the reader set; null follows the machine's own ceiling. */
  budgetGib: number | null;
};

/** Starting point derives from the dataset: first family, its first SKU. */
const FIRST_SKU =
  hardwareOfFamily(FAMILIES[0].id).find((entry) => entry.devices === 1)?.id ??
  '';

export const DEFAULT_MACHINE: MachineScenarioState = {
  baseId: FIRST_SKU,
  devices: 1,
  engineId: 'all',
  budgetGib: null,
};

export const machineScenario =
  createStore<MachineScenarioState>(DEFAULT_MACHINE);

/** The classifier's own machine: same default, its own clicks. */
export const decisionMachineScenario =
  createStore<MachineScenarioState>(DEFAULT_MACHINE);

/** Drops the keys a patch omits, so an absent value never erases a set one. */
const compact = <T extends object>(patch: Partial<T>): Partial<T> =>
  Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined)
  ) as Partial<T>;

/**
 * Applies a machine choice to one figure's store. A new box brings its own
 * ceiling, so the reader's last budget must not trail onto a smaller machine;
 * the runtime is not a box, so naming one leaves the budget where the reader
 * put it.
 */
export function selectMachine(
  store: Store<MachineScenarioState>,
  patch: Partial<MachineScenarioState>
) {
  const newBox = 'baseId' in patch || 'devices' in patch;
  store.update({
    ...(newBox ? { budgetGib: null } : {}),
    ...compact(patch),
  });
}

/**
 * The pin a new list can still hold, or null when it cannot.
 *
 * WHY: an open card answers one question. When a setting stops listing its row,
 * a surviving pin would spring the card open again as soon as a later press
 * brings the row back — a panel the reader never asked for. Both figures apply
 * this one rule, so a table changes the same way whatever the input was.
 */
export function pinAfter<TRow>(
  rows: readonly TRow[],
  id: string | null,
  idOf: (row: TRow) => string
): string | null {
  if (id === null) return null;
  return rows.some((row) => idOf(row) === id) ? id : null;
}

/** The machine as a figure's resolver reads it: the workload is the figure's. */
export const machineSelection = (
  machine: MachineScenarioState
): MachineChoice => ({
  hardwareId: hardwareIdFor(machine.baseId, machine.devices),
  engineId: machine.engineId,
  budgetGib: machine.budgetGib ?? undefined,
});
