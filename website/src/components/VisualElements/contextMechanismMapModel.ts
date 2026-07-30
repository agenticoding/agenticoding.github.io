import { zoneBounds, type AttentionZone } from './contextZones.ts';

export const CONTEXT_MECHANISM_VISUAL = {
  zoneFill: {
    primacy: 'var(--surface-muted)',
    middle: 'var(--surface-muted)',
    recency: 'var(--surface-muted)',
  },
  zoneOpacity: {
    primacy: 0.35,
    middle: 0.62,
    recency: 0.35,
  },
  separatorStroke: 'var(--border-subtle)',
} as const;

export const CONTEXT_MECHANISM_LAYOUT = {
  viewWidth: 960,
  cardCount: 6,
  cardWidth: 148,
  cardGap: 8,
  cardInset: 16,
  lensHeight: 88,
  tileInset: 10,
  tileHeight: 14,
} as const;

const { viewWidth, cardCount, cardWidth, cardGap, cardInset, tileInset } =
  CONTEXT_MECHANISM_LAYOUT;

export const contextMechanismGeometry = {
  cardStart:
    (viewWidth - (cardCount * cardWidth + (cardCount - 1) * cardGap)) / 2,
  contextWidth: cardWidth - cardInset * 2,
  tileWidth: cardWidth - cardInset * 2 - tileInset * 2,
  zones: zoneBounds(CONTEXT_MECHANISM_LAYOUT.lensHeight),
} as const;

export function contextMechanismCardX(index: number) {
  return contextMechanismGeometry.cardStart + index * (cardWidth + cardGap);
}

export function contextMechanismTileY(zone: AttentionZone) {
  const band = contextMechanismGeometry.zones.find(
    (item) => item.zone === zone
  )!;
  return band.y + (band.height - CONTEXT_MECHANISM_LAYOUT.tileHeight) / 2;
}
