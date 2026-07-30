// Single source of truth for attention-zone geometry across every
// context-engineering figure. Zones are fractional — the U-shape curve gives
// high attention to both edges and a valley in the middle — so primacy and
// recency are narrower than the middle. Never reintroduce equal thirds.

export type AttentionZone = 'primacy' | 'middle' | 'recency';

export const ZONE_FRACTIONS = {
  primacyEnd: 0.25,
  recencyStart: 0.75,
} as const;

export type ZoneBounds = {
  zone: AttentionZone;
  y: number;
  height: number;
};

export function zoneBounds(height: number): readonly ZoneBounds[] {
  const primacyEnd = height * ZONE_FRACTIONS.primacyEnd;
  const recencyStart = height * ZONE_FRACTIONS.recencyStart;
  return [
    { zone: 'primacy', y: 0, height: primacyEnd },
    { zone: 'middle', y: primacyEnd, height: recencyStart - primacyEnd },
    { zone: 'recency', y: recencyStart, height: height - recencyStart },
  ];
}

// Content-relative variant: same fractions, but bands span an arbitrary
// vertical extent (first content tile -> last content tile) instead of the
// full frame. Returned y values are absolute offsets in the caller's
// coordinate space (`top` is where the primacy band starts).
export function zoneBoundsInExtent(
  top: number,
  height: number
): readonly ZoneBounds[] {
  return zoneBounds(height).map((band) => ({ ...band, y: band.y + top }));
}

export function zoneAtOffset(offset: number, height: number): AttentionZone {
  if (offset < height * ZONE_FRACTIONS.primacyEnd) return 'primacy';
  if (offset < height * ZONE_FRACTIONS.recencyStart) return 'middle';
  return 'recency';
}

// Band fill per zone — U-shape grammar shared with the attention curve and
// pressure diagram: edges read as high-attention (cyan tint), middle is the
// valley (muted).
export const ZONE_BAND_FILLS: Record<AttentionZone, string> = {
  primacy: 'var(--visual-bg-cyan)',
  middle: 'var(--surface-muted)',
  recency: 'var(--visual-bg-cyan)',
};

// Soft zone transitions (user directive): attention doesn't cliff at the
// 25%/75% boundaries, so bands CROSS-FADE around them — two stacked alpha
// fades, never hue interpolation, which would mix a muddy third color
// between e.g. the cyan edges and a warning middle. Each zone's core stays
// its flat color; the blend is one existing color dissolving into the next
// over the shared surface. Half-width of a blend, as a span fraction.
export const ZONE_BLEND = 0.06;

// Blend boundaries as span fractions: primacy fades across [a, b], the
// middle owns [b, c], recency fades in across [c, d].
export function zoneBlendOffsets(): {
  a: number;
  b: number;
  c: number;
  d: number;
} {
  const p = ZONE_FRACTIONS.primacyEnd;
  const r = ZONE_FRACTIONS.recencyStart;
  const w = Math.min(ZONE_BLEND, p / 2, (1 - r) / 2);
  return { a: p - w, b: p + w, c: r - w, d: r + w };
}

// Zero-alpha twin of a fill — color-mix accepts var()/color-mix colors, so
// color→twin interpolation is a pure alpha fade with zero hue shift.
function transparentTwin(fill: string): string {
  return `color-mix(in srgb, ${fill} 0%, transparent)`;
}

const pct = (fraction: number) => `${Math.round(fraction * 1000) / 10}%`;

// Full CSS background for a zone span: the edges layer (primacy + recency
// fading across the boundaries) stacked over the middle layer (visible only
// between the blends). First layer paints on top.
export function zoneGradient(
  fills: readonly [primacy: string, middle: string, recency: string]
): string {
  const [primacy, middle, recency] = fills;
  const { a, b, c, d } = zoneBlendOffsets();
  const edges = `linear-gradient(to bottom, ${primacy} 0%, ${primacy} ${pct(a)}, ${transparentTwin(primacy)} ${pct(b)}, ${transparentTwin(recency)} ${pct(c)}, ${recency} ${pct(d)}, ${recency} 100%)`;
  const mid = `linear-gradient(to bottom, ${transparentTwin(middle)} 0%, ${transparentTwin(middle)} ${pct(a)}, ${middle} ${pct(b)}, ${middle} ${pct(c)}, ${transparentTwin(middle)} ${pct(d)}, ${transparentTwin(middle)} 100%)`;
  return `${edges}, ${mid}`;
}

// Canonical zone labels + tones. Zone names are neutral wayfinding — the
// warning tone is reserved for the middle, the attention valley.
export const ZONE_LABELS: Record<AttentionZone, string> = {
  primacy: 'PRIMACY',
  middle: 'MIDDLE',
  recency: 'RECENCY',
};

export const ZONE_LABEL_FILLS: Record<AttentionZone, string> = {
  primacy: 'var(--text-muted)',
  middle: 'var(--visual-warning)',
  recency: 'var(--text-muted)',
};
