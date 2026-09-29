export const DIAGRAM_GRID = 8;

/** Sanctioned dense half-step (`--space-0h`) — the ONLY sub-grid value allowed in
    diagram geometry. See DESIGN_SYSTEM.md spatial system.
    Multiples of DIAGRAM_HALF (4px) are permitted at call sites for values that fall
    between SPACE tokens (e.g. DIAGRAM_GRID * 2.5 = 20). These are not named tokens
    because they are layout-specific offsets, not reusable design-system steps. */
export const DIAGRAM_HALF = DIAGRAM_GRID / 2;

/** Snap a px budget UP to the grid: the counterpart of the snap-down a rendered
    row height uses. For requirements that must never come in under their own
    derived minimum (row floors, canvas budgets). */
export function gridUp(value: number) {
  return Math.ceil(value / DIAGRAM_GRID) * DIAGRAM_GRID;
}

/** Mirror of the `--space-*` tokens in `src/css/custom.css`. SVG geometry reads its
    spacing from here; `diagramScale.test.ts` fails if this drifts from the CSS. */
export const SPACE = {
  '0': 0,
  px: 1,
  '0h': 4,
  '1': 8,
  '2': 16,
  '3': 24,
  '4': 32,
  '5': 48,
  '6': 64,
  '7': 80,
  '8': 96,
  '9': 128,
  '10': 160,
} as const;

/** Tile metrics named by role. Every value is a `--space-*` step or the half-step;
    the tile kit never introduces a raw offset. */
export const DIAGRAM_SPACE = {
  /** Inset from the tile edge to its content. */
  tilePadding: SPACE['2'],
  /** Lead icon to its text column (design system: within-component relation). */
  iconGap: SPACE['2'],
  /** Optical lift that cap-centres the lead icon on the title baseline. */
  iconLift: SPACE['0h'],
  /** Tile top edge to the title baseline for a top-hung heading. */
  titleLead: SPACE['3'],
  /** Title baseline to the first detail line for a centred heading. */
  detailLead: SPACE['3'],
  /** Title baseline to the first detail line for a top-hung heading. */
  detailGap: SPACE['2'],
  /** Title baseline to the divider rule. */
  dividerLead: SPACE['1'],
  /** Extra gap between wrapped title lines. */
  titleLineGap: SPACE['2'],
  /** Gap between wrapped detail lines. */
  detailLineGap: SPACE['2'],
  /** Stacked icon layout: icon to title cap. */
  stackIconGap: SPACE['0h'],
  /** Stacked icon layout: cap-to-baseline gap under the icon. */
  stackCap: SPACE['1'],
  /** Stacked icon layout: title baseline to first detail line. */
  stackLead: SPACE['2'],
} as const;

/** Tile type ramp — snapped to the DESIGN_SYSTEM type tokens (`--text-sm`/`--text-xs`). */
export const TILE_TYPE = {
  title: 13,
  detail: 11,
} as const;

export const DIAGRAM_STROKE = {
  thin: 1,
  default: 1.5,
  connector: 2,
} as const;

export const DIAGRAM_MARKER = {
  size: 6,
  refX: 6,
  refY: 3,
  points: '0 0, 6 3, 0 6',
} as const;

export const DIAGRAM_TOKEN_SIZE = {
  flow: 20,
  staticMobile: 18,
  /** Dense tier: two glyphs share one short flow run, so the smaller tier keeps
      them a single readable unit. Never below the 8px minimum shape dimension. */
  dense: 12,
} as const;

/** Icon tiers snapped to the `--icon-*` tokens (16 / 24 / 32 / 48). */
export const DIAGRAM_ICON_SIZE = {
  tertiary: SPACE['2'],
  secondary: SPACE['3'],
  primary: SPACE['4'],
  actor: SPACE['5'],
} as const;

export const RICH_TILE_SCALE = {
  comfortableHeight: DIAGRAM_GRID * 14,
  mobileDensityMaxHeight: DIAGRAM_GRID * 14 - DIAGRAM_HALF,
  mobileCard: { width: 236, height: DIAGRAM_GRID * 14 },
} as const;

export const WORKBENCH_SCALE = {
  chip: { width: 62, height: 28 },
  mobileRichCard: RICH_TILE_SCALE.mobileCard,
  llmSlot: {
    width: 72,
    height: DIAGRAM_GRID * 8,
    gearSize: DIAGRAM_ICON_SIZE.actor,
    topOffset: 36,
    contextOffset: 11,
    titleOffset: 58,
  },
  toolIconSize: DIAGRAM_ICON_SIZE.tertiary,
} as const;

export const PROCESS_TILE_SCALE = {
  padding: DIAGRAM_SPACE.tilePadding,
  iconGap: DIAGRAM_SPACE.iconGap,
  iconSize: DIAGRAM_ICON_SIZE.primary,
  titleFontSize: TILE_TYPE.title,
  detailFontSize: TILE_TYPE.detail,
  detailLineGap: DIAGRAM_SPACE.detailLineGap,
  stepFontSize: TILE_TYPE.detail,
  tile: { width: DIAGRAM_GRID * 24, height: DIAGRAM_GRID * 10 },
  mobileTile: { width: DIAGRAM_GRID * 28, height: DIAGRAM_GRID * 10 },
  exitTile: { width: DIAGRAM_GRID * 24, height: DIAGRAM_GRID * 8 },
  mobileExitTile: { width: DIAGRAM_GRID * 28, height: DIAGRAM_GRID * 8 },
} as const;
