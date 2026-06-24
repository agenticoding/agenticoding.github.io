import React, { useRef } from 'react';
import clsx from 'clsx';
import styles from './OperatorCycleDiagram.module.css';
import shared from './diagram.module.css';
import { useAnimationPhase } from '../animations/ScrollDrivenFigure';
import { useActs } from '../../hooks/useActs';
import { useStrokeDraw } from '../../hooks/useStrokeDraw';
import { EmojiImage } from './ActorNodes';
import { EMOJI, type EmojiAsset } from './emojiAssets';
import { ARROWHEAD_POINTS, arrowOpacity, CONNECTOR_STYLE } from './diagramConstants';
import { useMounted } from '../../hooks/useMounted';

// Layout — ViewBox 560×280
//
// Research: center (160,  64)   Plan:     center (400,  64)
// Validate: center (160, 216)   Execute:  center (400, 216)
//
// Cycle direction (clockwise): Research → Plan → Execute → Validate → Research
// Node radius: R = 22px  |  Horizontal gap: 240px  |  Vertical gap: 152px  (~1.58:1)
//
// Connector endpoints (at circle edges, R from center):
//   Research right (182,64)   Plan left     (378,64)
//   Plan bottom   (400,86)    Execute top   (400,194)
//   Execute left  (378,216)   Validate right(182,216)
//   Validate top  (160,194)   Research bottom(160,86)
//
// Nodes render without background circles — icons are 36×36 (ICON_HALF = 18)
// All four phases use viewBox="0 0 128 128"

const R = 22;

const ICON_HALF = 18;

const NODE_EMOJI: Record<string, EmojiAsset> = {
  research: EMOJI.microscope,
  plan:     EMOJI.documentTabs,
  execute:  EMOJI.agent,
  validate: EMOJI.ruler,
};

const NODES = [
  {
    id: 'research',
    label: 'Research',
    cx: 160, cy: 64,
    labelAbove: true,
    color: 'var(--visual-indigo)',
    bgColor: 'var(--visual-bg-indigo)',
    description: 'Ground agents in codebase patterns and domain knowledge before acting',
  },
  {
    id: 'plan',
    label: 'Plan',
    cx: 400, cy: 64,
    labelAbove: true,
    color: 'var(--visual-cyan)',
    bgColor: 'var(--visual-bg-cyan)',
    description: 'Design changes strategically — explore when uncertain, be directive when clear',
  },
  {
    id: 'execute',
    label: 'Execute',
    cx: 400, cy: 216,
    labelAbove: false,
    color: 'var(--visual-magenta)',
    bgColor: 'var(--visual-bg-magenta)',
    description: 'Run agents supervised or autonomous based on trust and task criticality',
  },
  {
    id: 'validate',
    label: 'Validate',
    cx: 160, cy: 216,
    labelAbove: false,
    color: 'var(--visual-warning)',
    bgColor: 'var(--visual-bg-warning)',
    description: 'Verify against your mental model, then iterate or regenerate',
  },
] as const;

// Connector paths — straight lines for clear directed segments
const FWD_CONNECTORS = [
  { d: `M 182,64 L 378,64` },    // top:    R → P
  { d: `M 400,86 L 400,194` },   // right:  P → E
  { d: `M 378,216 L 182,216` },  // bottom: E → V
] as const;

const RETURN_D = `M 160,194 L 160,86`; // left: V → R

const ACTS = [
  { id: 'nodes',   threshold: 0.00 },
  { id: 'forward', threshold: 0.15 },
  { id: 'return',  threshold: 0.45 },
  { id: 'settle',  threshold: 0.65 },
] as const;

const FWD_STAGGER = 0.04;

// ── Component ──────────────────────────────────────────────────────────────

export default function OperatorCycleDiagram() {
  const phase = useAnimationPhase();
  const mounted = useMounted();
  const { wasReached } = useActs(ACTS, phase);

  // Refs for connector paths
  const fwdRef0   = useRef<SVGPathElement>(null);
  const fwdRef1   = useRef<SVGPathElement>(null);
  const fwdRef2   = useRef<SVGPathElement>(null);
  const fwdRefs   = [fwdRef0, fwdRef1, fwdRef2];
  const returnRef = useRef<SVGPathElement>(null);

  // useStrokeDraw handles both init (dasharray/offset) and phase-driven drawing
  // Each fwd connector starts FWD_STAGGER later but ends at the same phase (0.40)
  const t0  = useStrokeDraw(fwdRef0,   phase, 0.15,                 0.40);
  const t1  = useStrokeDraw(fwdRef1,   phase, 0.15 + FWD_STAGGER,   0.40);
  const t2  = useStrokeDraw(fwdRef2,   phase, 0.15 + 2*FWD_STAGGER, 0.40);
  const tRet = useStrokeDraw(returnRef, phase, 0.45,                 0.62);

  const nodesReached   = mounted && wasReached('nodes');
  const forwardReached = mounted && wasReached('forward');
  const returnReached  = mounted && wasReached('return');
  const settleReached  = mounted && wasReached('settle');

  return (
    <div>
      {/* SVG Diagram */}
      <svg
        viewBox="0 0 560 280"
        width="100%"
        height="auto"
        role="img"
        aria-label="The operator cycle: Research → Plan → Execute → Validate, then iterate."
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', maxWidth: '560px', margin: '0 auto' }}
      >
        {/* Forward connectors — top, right, bottom — staggered draw on `forward` act */}
        {FWD_CONNECTORS.map((conn, i) => (
          <path
            key={i}
            ref={fwdRefs[i]}
            className={clsx(shared.connector, forwardReached && shared.connectorDrawing)}
            d={conn.d}
            {...CONNECTOR_STYLE}
          />
        ))}

        {/* Return connector — Validate → Research — draws on `return` act */}
        <path
          ref={returnRef}
          className={clsx(shared.connector, returnReached && shared.connectorDrawing)}
          d={RETURN_D}
          {...CONNECTOR_STYLE}
        />

        {/* Standalone arrowheads — opacity driven by useStrokeDraw t values */}
        {/* R→P: tip at (378,64), pointing right (rotate 0°) */}
        <g transform="translate(378,64) rotate(0)" style={{ opacity: arrowOpacity(t0) }}>
          <polygon points={ARROWHEAD_POINTS} fill="var(--text-muted)" />
        </g>
        {/* P→E: tip at (400,194), pointing down (rotate 90°) */}
        <g transform="translate(400,194) rotate(90)" style={{ opacity: arrowOpacity(t1) }}>
          <polygon points={ARROWHEAD_POINTS} fill="var(--text-muted)" />
        </g>
        {/* E→V: tip at (182,216), pointing left (rotate 180°) */}
        <g transform="translate(182,216) rotate(180)" style={{ opacity: arrowOpacity(t2) }}>
          <polygon points={ARROWHEAD_POINTS} fill="var(--text-muted)" />
        </g>
        {/* V→R: tip at (160,86), pointing up (rotate 270°) */}
        <g transform="translate(160,86) rotate(270)" style={{ opacity: arrowOpacity(tRet) }}>
          <polygon points={ARROWHEAD_POINTS} fill="var(--text-muted)" />
        </g>

        {/* Phase nodes — staggered entrance on `nodes` act */}
        {NODES.map((node, i) => (
          <g
            key={node.id}
            className={clsx(styles.phaseNode, nodesReached && shared.actEntered)}
            style={nodesReached ? { animationDelay: `${i * 80}ms` } : undefined}
          >
            <EmojiImage asset={NODE_EMOJI[node.id]} x={node.cx - ICON_HALF} y={node.cy - ICON_HALF} size={ICON_HALF * 2} />
            {/* Phase label — above top-row nodes, below bottom-row nodes */}
            <text
              x={node.cx} y={node.labelAbove ? node.cy - R - 8 : node.cy + R + 14}
              fill={node.color}
              textAnchor="middle"
              fontSize={11}
              fontWeight={500}
              style={{
                fontFamily: 'var(--font-mono)',
                fontFeatureSettings: 'var(--font-mono-features)',
              }}
            >
              {node.label}
            </text>
          </g>
        ))}

        {/* Center "iterate" label — appears on `settle` act */}
        <text
          x={280} y={140}
          className={clsx(styles.cycleLabel, settleReached && shared.actEntered)}
          fill="var(--text-muted)"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={11}
          fontWeight={400}
          style={{
            fontFamily: 'var(--font-mono-keyword)',
            fontFeatureSettings: 'var(--font-mono-features)',
          }}
        >
          iterate
        </text>


      </svg>

      {/* Description grid — fades in with nodes */}
      <div className={clsx(styles.descGrid, nodesReached && styles.descVisible)}>
        {NODES.map((node) => (
          <div key={node.id} className={styles.descCell}>
            <span
              className={styles.descLabel}
              style={{ color: node.color }}
            >
              {node.label}
            </span>
            <span className={styles.descText}>{node.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
