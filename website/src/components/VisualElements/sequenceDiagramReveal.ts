const ROW_BAND_START = 0.35;
const ROW_BAND_END = 0.95;

export function getSequenceRowThreshold(rowIndex: number, rowCount: number): number {
  if (rowCount <= 1) return ROW_BAND_START;
  const rowStep = (ROW_BAND_END - ROW_BAND_START) / (rowCount - 1);
  return ROW_BAND_START + rowIndex * rowStep;
}

export function getSequenceRowReached(
  mounted: boolean,
  phase: number,
  rowIndex: number,
  rowCount: number,
): boolean {
  return mounted && phase >= getSequenceRowThreshold(rowIndex, rowCount);
}

/**
 * Semantic alias for getSequenceRowReached - communicates that this is about
 * ghost placeholder visibility. Currently identical implementation, but the
 * distinct name makes the intent clear in SequenceDiagram.tsx where it's used
 * to control ghost class toggling.
 */
export function getSequenceMessageGhostReached(
  mounted: boolean,
  phase: number,
  rowIndex: number,
  rowCount: number,
): boolean {
  return getSequenceRowReached(mounted, phase, rowIndex, rowCount);
}

export const sequenceDiagramReveal = {
  rowBandStart: ROW_BAND_START,
  rowBandEnd: ROW_BAND_END,
} as const;
