import { ENGINE_COPY, FIGURE_CONTROLS } from './figureCopy.ts';
import type { EngineGroup } from './figureTypes.ts';
import { Chip, ChipGroup } from './FigureChips.tsx';
import styles from './Figure.module.css';

/**
 * One runtime as a chip. `state` is the source's own claim, never a guess:
 * `supported` publishes a figure here, `untested` publishes a path without one,
 * and `unsupported` publishes nothing for this platform.
 */
export type RuntimeEntry = {
  engineId: string;
  label: string;
  group: EngineGroup;
  /** Rows the same click leaves. */
  count: number;
  /** Rows the runtime covers: the printed count's denominator. */
  coverage?: number;
  /** Read out instead of the printed label + count, which would run together. */
  spoken: string;
  /** Rows this runtime holds that no general-purpose runtime holds. */
  reach?: number;
  state: 'supported' | 'unsupported' | 'untested';
};

type RuntimeStripProps = {
  /** The pressed choice: 'all' or an engine id. */
  selectedId: string;
  /** The "any runtime" chip, which is a scope rather than a runtime. */
  any: RuntimeEntry;
  entries: readonly RuntimeEntry[];
  onSelect: (engineId: string) => void;
  /** Prefix of this figure's contract hooks, e.g. `data-fit`. */
  dataAttr: string;
};

/**
 * The guide's second dimension, kept whole and out of the hardware rail: a
 * runtime is a way to run the machine, not a machine.
 *
 * WHY the strip lists only runtimes with rows behind them: a chip that promises
 * no row is a disabled button explaining an absence. The pressed runtime stays
 * even at zero, so the verdict always names the runtime it was priced on.
 *
 * WHY both groups are always drawn with their rails reserved: membership follows
 * the workload, so a strip sized by its chips would move the table on every
 * lever move. Each rail keeps the room its most crowded state needs; a group
 * with nothing to list states its absence in its note's slot.
 *
 * Motion spec: a chip entering the strip fades in over --duration-fast (110ms,
 * opacity only, --ease-enter). Nothing moves and nothing is announced: the
 * reservation already holds the box, so the fade only marks which words are new.
 * Reduced motion paints the state immediately.
 */
export function FigureRuntimeStrip({
  selectedId,
  any,
  entries,
  onSelect,
  dataAttr,
}: RuntimeStripProps) {
  const documented = entries.filter(
    (entry) =>
      entry.state !== 'unsupported' &&
      (entry.coverage ?? 0) > 0 &&
      (entry.count > 0 || entry.engineId === selectedId)
  );
  const group = (kind: EngineGroup) =>
    documented.filter((entry) => entry.group === kind);
  const specialized = group('specialized');
  // An empty group swaps its legend for the absence: the legend defines a chip
  // suffix that this state cannot draw, and a second line would restate the
  // label. The reserved rail below stays unlabelled room for the group's chips.
  const specializedEmpty = specialized.length === 0;

  return (
    <section
      className={styles.runtimes}
      aria-label={FIGURE_CONTROLS.engine}
      {...{ [`${dataAttr}-strip`]: '' }}
    >
      <ChipGroup
        label={FIGURE_CONTROLS.engine}
        kind="general"
        note={ENGINE_COPY.generalNote}
      >
        <Chip
          label={FIGURE_CONTROLS.anyRuntime}
          count={any.count}
          coverage={any.coverage}
          spoken={any.spoken}
          selected={selectedId === 'all'}
          onSelect={() => onSelect('all')}
        />
        {group('general').map((entry) => (
          <RuntimeChip
            key={entry.engineId}
            entry={entry}
            selected={selectedId === entry.engineId}
            onSelect={onSelect}
          />
        ))}
      </ChipGroup>
      <ChipGroup
        label={FIGURE_CONTROLS.specialized}
        kind="specialized"
        note={
          specializedEmpty
            ? ENGINE_COPY.emptySpecialized
            : ENGINE_COPY.specializedNote
        }
        empty={specializedEmpty}
      >
        {specialized.map((entry) => (
          <RuntimeChip
            key={entry.engineId}
            entry={entry}
            selected={selectedId === entry.engineId}
            onSelect={onSelect}
          />
        ))}
      </ChipGroup>
    </section>
  );
}

function RuntimeChip({
  entry,
  selected,
  onSelect,
}: {
  entry: RuntimeEntry;
  selected: boolean;
  onSelect: (engineId: string) => void;
}) {
  return (
    <Chip
      label={entry.label}
      count={entry.count}
      coverage={entry.coverage}
      spoken={entry.spoken}
      selected={selected}
      reach={entry.reach}
      onSelect={() => onSelect(entry.engineId)}
    />
  );
}
