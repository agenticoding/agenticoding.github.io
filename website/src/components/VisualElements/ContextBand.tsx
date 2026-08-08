import { tileToneVars, voiceStyle } from './diagramTileLayout';
import type { DiagramTone } from './diagramTileLayout';

// ContextBand — the shared anatomy for context-window content bands, used by
// every diagram that renders a window as a vertical stack of regions
// (currently CompactionLineDiagram):
//   solid band  = bg-tint rect (rx 0), 1px tone stroke, 3px left accent strip,
//                 mono-spec label inside at left
//   dashed band = freed/external space ONLY: transparent fill, '4 3' dashed
//                 stroke, centered muted mono-keyword label
// Colors derive from tileToneVars(tone); explicit stroke/fill overrides exist
// for edge bands that are not a semantic tone (e.g. the verbatim recent tail).
// Shape and label are separate components because animated diagrams
// (CompactionLine) cross-fade them independently.

export interface ContextBandSpec {
  label: string;
  h: number;
  tone?: DiagramTone;
  stroke?: string;
  fill?: string;
  labelFill?: string;
  dashed?: boolean;
  note?: string; // optional italic mono-keyword second line (band must be tall enough)
  labelAlign?: 'left' | 'center'; // default: dashed → center, solid → left
}

interface ResolvedBand {
  stroke: string;
  fill: string;
  labelFill: string;
}

function resolveBand(spec: ContextBandSpec): ResolvedBand {
  const tone = spec.tone ? tileToneVars(spec.tone) : undefined;
  if (spec.dashed) {
    return {
      stroke: spec.stroke ?? tone?.stroke ?? 'var(--border-default)',
      fill: spec.fill ?? 'transparent',
      labelFill: spec.labelFill ?? 'var(--text-muted)',
    };
  }
  return {
    stroke: spec.stroke ?? tone?.stroke ?? 'var(--border-default)',
    fill: spec.fill ?? tone?.fill ?? 'transparent',
    labelFill: spec.labelFill ?? tone?.label ?? 'var(--text-muted)',
  };
}

export function ContextBandShape({ x, y, w, spec }: { x: number; y: number; w: number; spec: ContextBandSpec }) {
  const band = resolveBand(spec);
  if (spec.dashed) {
    return (
      <rect x={x} y={y} width={w} height={spec.h} rx={0} fill={band.fill} stroke={band.stroke} strokeWidth={1} strokeDasharray="4 3" />
    );
  }
  return (
    <>
      <rect x={x} y={y} width={w} height={spec.h} rx={0} fill={band.fill} stroke={band.stroke} strokeWidth={1} />
      <rect x={x} y={y} width={3} height={spec.h} rx={0} fill={band.stroke} />
    </>
  );
}

export function ContextBandLabel({ x, y, w, spec }: { x: number; y: number; w: number; spec: ContextBandSpec }) {
  const band = resolveBand(spec);
  const centered = spec.labelAlign ? spec.labelAlign === 'center' : spec.dashed === true;
  const anchor = centered ? 'middle' : undefined;
  const labelX = centered ? x + w / 2 : x + 8;
  // With a note, the label/note pair is visually centered as a unit.
  const labelY = y + spec.h / 2 + (spec.note ? -6 : 0);
  return (
    <>
      <text
        x={labelX}
        y={labelY}
        textAnchor={anchor}
        dominantBaseline="middle"
        style={spec.dashed ? voiceStyle('keyword', 8.5, 500) : voiceStyle('spec', 8.5, 600)}
        fill={band.labelFill}
      >
        {spec.label}
      </text>
      {spec.note ? (
        <text
          x={labelX}
          y={y + spec.h / 2 + 13}
          textAnchor={anchor}
          dominantBaseline="middle"
          style={voiceStyle('keyword', 9, 400)}
          fontStyle="italic"
          fill={band.labelFill}
        >
          {spec.note}
        </text>
      ) : null}
    </>
  );
}
