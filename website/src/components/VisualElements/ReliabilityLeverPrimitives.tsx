import React from 'react';

export const G = 8;
export const FONT = {
  heading: 'var(--font-display)',
  body: 'var(--font-body)',
  mono: 'var(--font-mono-keyword)',
  human: 'var(--font-mono-human)',
};

export function svgStyle(compact: boolean, width: number) {
  return { display: 'block', maxWidth: compact ? '95%' : `${width}px`, margin: '0 auto' };
}

export function Marker({ id, tone }: { id: string; tone: string }) {
  return (
    <marker id={id} viewBox="0 0 6 6" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
      <polygon points="0 0, 6 3, 0 6" fill={tone} />
    </marker>
  );
}

export function TextLine({ x, y, children, tone = 'var(--text-body)', size = 'var(--text-xs)', weight = 500, family = FONT.body, anchor = 'start', halo = false }: {
  x: number; y: number; children: React.ReactNode; tone?: string; size?: string; weight?: number | string; family?: string; anchor?: 'start' | 'middle' | 'end'; halo?: boolean;
}) {
  return <text x={x} y={y} textAnchor={anchor} fontFamily={family} fontSize={size} fontWeight={weight} fill={tone} paintOrder={halo ? 'stroke' : undefined} stroke={halo ? 'var(--surface-page)' : undefined} strokeWidth={halo ? 'var(--stroke-heavy)' : undefined} strokeLinecap={halo ? 'round' : undefined} strokeLinejoin={halo ? 'round' : undefined}>{children}</text>;
}

export function Card({ x, y, w, h, title, lines, tone = 'var(--visual-neutral)', fill = 'var(--surface-raised)' }: {
  x: number; y: number; w: number; h: number; title: string; lines: string[]; tone?: string; fill?: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={0} fill={fill} stroke="var(--border-default)" />
      <line x1={x + G * 2} y1={y + G * 3} x2={x + G * 2} y2={y + h - G * 3} stroke={tone} strokeWidth="var(--stroke-heavy)" />
      <TextLine x={x + G * 4} y={y + G * 4} tone="var(--text-heading)" size="var(--text-sm)" weight={700} family={FONT.heading}>{title}</TextLine>
      {lines.map((line, i) => <TextLine key={line} x={x + G * 4} y={y + G * (7 + i * 2.5)}>{line}</TextLine>)}
    </g>
  );
}

export function Step({ x, y, w, label, detail, tone = 'var(--visual-neutral)', fill = 'var(--surface-raised)', angular: _angular = false }: {
  x: number; y: number; w: number; label: string; detail?: string; tone?: string; fill?: string; angular?: boolean;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={G * 7} rx={0} fill={fill} stroke={tone} strokeWidth="var(--stroke-light)" />
      <TextLine x={x + G * 2} y={y + G * 3} tone={tone} size="var(--text-sm)" weight={700} family={FONT.heading}>{label}</TextLine>
      {detail && <TextLine x={x + G * 2} y={y + G * 5.3} tone="var(--text-muted)" family={FONT.mono}>{detail}</TextLine>}
    </g>
  );
}

export function Arrow({ x1, y1, x2, y2, tone, markerId, angular = false }: {
  x1: number; y1: number; x2: number; y2: number; tone: string; markerId: string; angular?: boolean;
}) {
  const markerEnd = `url(#${markerId})`;
  if (angular) return <polyline points={`${x1},${y1} ${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`} fill="none" stroke={tone} strokeWidth="var(--stroke-heavy)" strokeLinejoin="miter" markerEnd={markerEnd} />;
  const dx = Math.min(G * 6, Math.abs(x2 - x1) / 3);
  return <path d={`M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`} fill="none" stroke={tone} strokeWidth="var(--stroke-default)" strokeLinecap="round" markerEnd={markerEnd} />;
}

export function Noise({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g opacity="0.82">
      <rect x={x} y={y} width={G * 18} height={G * 6} rx={0} fill="var(--surface-muted)" stroke="var(--border-default)" strokeDasharray="4 4" />
      <TextLine x={x + G * 2} y={y + G * 3.5} tone="var(--text-muted)" family={FONT.mono}>{label}</TextLine>
    </g>
  );
}
