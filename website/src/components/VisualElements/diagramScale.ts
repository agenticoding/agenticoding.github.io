export const DIAGRAM_GRID = 8;

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
  mobileFlow: 20,
  staticMobile: 18,
} as const;

export const DIAGRAM_ICON_SIZE = {
  tertiary: 14,
  secondary: 24,
  primary: 32,
  actor: 36,
} as const;

export const RICH_TILE_SCALE = {
  comfortableHeight: DIAGRAM_GRID * 14,
  mobileDensityMaxHeight: DIAGRAM_GRID * 14 - DIAGRAM_GRID / 2,
  mobileCard: { width: 236, height: DIAGRAM_GRID * 14 },
} as const;

export const WORKBENCH_SCALE = {
  chip: { width: 62, height: 28 },
  mobileRichCard: RICH_TILE_SCALE.mobileCard,
  llmSlot: {
    width: 64,
    height: DIAGRAM_GRID * 8,
    gearSize: DIAGRAM_ICON_SIZE.actor,
    topOffset: 36,
    contextOffset: 11,
    titleOffset: 58,
  },
  toolIconSize: DIAGRAM_ICON_SIZE.tertiary,
} as const;

export const PROCESS_TILE_SCALE = {
  padding: DIAGRAM_GRID * 2,
  iconGap: DIAGRAM_GRID,
  iconSize: DIAGRAM_ICON_SIZE.primary,
  titleFontSize: 12,
  detailFontSize: 9.5,
  detailLineGap: 12,
  stepFontSize: 10,
  shortHeight: DIAGRAM_GRID * 8,
  tile: { width: DIAGRAM_GRID * 24, height: DIAGRAM_GRID * 10 },
  mobileTile: { width: DIAGRAM_GRID * 28, height: DIAGRAM_GRID * 10 },
  exitTile: { width: DIAGRAM_GRID * 24, height: DIAGRAM_GRID * 8 },
  mobileExitTile: { width: DIAGRAM_GRID * 28, height: DIAGRAM_GRID * 8 },
} as const;
