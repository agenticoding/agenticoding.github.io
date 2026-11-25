import { FIGURE_CONTROLS, chipSpoken } from './figureCopy.ts';
import { baseHardwareId, defaultBudget, formatGib } from './figureCatalog.ts';
import type {
  HardwareFamily,
  HardwareTarget,
  RailCounts,
} from './figureTypes.ts';
import { Chip, ChipGroup } from './FigureChips.tsx';
import styles from './Figure.module.css';

export type MachineRailProps = {
  hardwareTarget: HardwareTarget;
  rail: RailCounts;
  onFamily: (family: HardwareFamily) => void;
  onBase: (baseId: string) => void;
  onDevices: (devices: number) => void;
};

/** The machine's own choices: vendor family, SKU, and how many of it. */
export function FigureMachineRail({
  hardwareTarget,
  rail,
  onFamily,
  onBase,
  onDevices,
}: MachineRailProps) {
  const baseId = baseHardwareId(hardwareTarget);

  return (
    <div className={styles.controls}>
      <ChipGroup label={FIGURE_CONTROLS.hardware}>
        {rail.families.map(({ family, fits }) => (
          <Chip
            key={family.id}
            label={family.label}
            count={fits}
            spoken={chipSpoken(family.label, fits)}
            selected={family.id === hardwareTarget.family}
            onSelect={() => onFamily(family.id)}
          />
        ))}
      </ChipGroup>

      <div className={styles.deviceRow}>
        <ChipGroup label={FIGURE_CONTROLS.device}>
          {rail.devices.map(({ target, fits }) => (
            <Chip
              key={target.id}
              label={target.label}
              count={fits}
              spoken={chipSpoken(target.label, fits)}
              selected={target.id === baseId}
              reason={`${formatGib(defaultBudget(target))} GiB budget`}
              onSelect={() => onBase(target.id)}
            />
          ))}
        </ChipGroup>
        {rail.deviceCounts.length > 1 ? (
          <ChipGroup label={FIGURE_CONTROLS.devices}>
            {rail.deviceCounts.map(({ devices, fits }) => (
              <Chip
                key={devices}
                label={`${devices}×`}
                count={fits}
                spoken={chipSpoken(`${devices}×`, fits)}
                selected={devices === hardwareTarget.devices}
                onSelect={() => onDevices(devices)}
              />
            ))}
          </ChipGroup>
        ) : null}
      </div>
    </div>
  );
}
