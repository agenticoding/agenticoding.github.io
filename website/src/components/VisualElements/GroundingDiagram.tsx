import React, { useRef } from 'react';
import clsx from 'clsx';
import styles from './GroundingDiagram.module.css';
import shared from './diagram.module.css';
import { useAnimationPhase } from '../animations/ScrollDrivenFigure';
import { useActs } from '../../hooks/useActs';
import { useStrokeDraw } from '../../hooks/useStrokeDraw';
import { NotoEmoji } from './ActorNodes';
import { ARROWHEAD_POINTS_SM, arrowOpacity, CONNECTOR_STYLE } from './diagramConstants';
import { useMounted } from '../../hooks/useMounted';
import { Ghost } from './Ghost';

// Layout — ViewBox 560×240
//
// Left column (ungrounded):  balloon center (140, 56)  crying center (140, 176)
// Right column (grounded):   anchor center (420, 56)  bullseye center (420, 176)
//
// Connector: balloon bottom (140, 78) → crying top (140, 154)  [dashed, curves away]
// Connector: anchor bottom (420, 80) → bullseye top (420, 152) [solid, straight]
//
// Ghost rects: 44×44 centered on each node position, rx=12
// Emoji size: 44px, offset = -22 from center
// Column headers: y=16, result labels: y=212

const ICON = 44;
const ICON_HALF = ICON / 2;

const ACTS = [
  { id: 'columns',    threshold: 0.00 },
  { id: 'agents',     threshold: 0.10 },
  { id: 'connectors', threshold: 0.25 },
  { id: 'results',    threshold: 0.75 },
  { id: 'labels',     threshold: 0.85 },
] as const;

// Warning connector: S-curve meander then smooth angle transition into straight vertical.
// Starts at balloon bottom-right (162,78). Bezier 1 CP1=(200,100) CP2=(110,118): bows right ~161,
// crosses center, bows left ~134, exits direction (3,1) at (140,128).
// Bezier 2 CP1=(143,129) = P0+(3,1): exact G1, 1.33px max bow resolved by y=140.
// L segment (14 units) is visibly straight vertical.
const WARN_D = 'M 162,78 C 200,100 110,118 140,128 C 143,129 140,138 140,140 L 140,154';
// Success connector: straight down — anchor firmly connected to target
const SUCC_D = 'M 420,80 L 420,154';

// Ghost rect geometry: centered at (cx, cy) with 44×44 size
function ghostRect(cx: number, cy: number) {
  return { x: cx - ICON_HALF, y: cy - ICON_HALF, width: ICON, height: ICON };
}

export default function GroundingDiagram() {
  const phase = useAnimationPhase();
  const mounted = useMounted();
  const { wasReached } = useActs(ACTS, phase);

  const warnRef = useRef<SVGPathElement>(null);
  const tWarn = useStrokeDraw(warnRef, phase, 0.25, 0.73);
  const succRef = useRef<SVGPathElement>(null);
  const tSucc = useStrokeDraw(succRef, phase, 0.25, 0.73);

  const columnsReached    = mounted && wasReached('columns');
  const agentsReached     = mounted && wasReached('agents');
  const connectorsReached = mounted && wasReached('connectors');
  const resultsReached    = mounted && wasReached('results');
  const labelsReached     = mounted && wasReached('labels');

  return (
    <svg
      viewBox="0 0 560 240"
      width="100%"
      height="auto"
      role="img"
      aria-label="Ungrounded agent (balloon) hallucinates; grounded agent (plug) responds accurately."
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', maxWidth: '560px', margin: '0 auto' }}
    >
      {/* Column headers */}
      <text
        x={140} y={16}
        className={clsx(styles.columnHeader, columnsReached && styles.columnHeaderIn)}
        fill="var(--text-muted)"
        textAnchor="middle"
        fontSize={11}
        fontWeight={500}
      >
        UNGROUNDED
      </text>
      <text
        x={420} y={16}
        className={clsx(styles.columnHeader, columnsReached && styles.columnHeaderIn)}
        style={columnsReached ? { transitionDelay: '80ms' } : undefined}
        fill="var(--text-muted)"
        textAnchor="middle"
        fontSize={11}
        fontWeight={500}
      >
        GROUNDED
      </text>

      {/* Ghost placeholders — top row */}
      <Ghost
        {...ghostRect(140, 56)}
        fill="var(--visual-bg-warning)" stroke="var(--visual-warning)"
        mounted={mounted} reached={agentsReached}
      />
      <Ghost
        {...ghostRect(420, 56)}
        fill="var(--visual-bg-success)" stroke="var(--visual-success)"
        mounted={mounted} reached={agentsReached}
      />

      {/* Ghost placeholders — bottom row */}
      <Ghost
        {...ghostRect(140, 176)}
        fill="var(--visual-bg-warning)" stroke="var(--visual-warning)"
        mounted={mounted} reached={resultsReached}
      />
      <Ghost
        {...ghostRect(420, 176)}
        fill="var(--visual-bg-success)" stroke="var(--visual-success)"
        mounted={mounted} reached={resultsReached}
      />

      {/* Warning connector — snake S-curve, stroke-draw reveal */}
      <path
        ref={warnRef}
        className={clsx(shared.connector, connectorsReached && shared.connectorDrawing)}
        d={WARN_D}
        {...CONNECTOR_STYLE}
      />

      {/* Success connector — solid, straight down */}
      <path
        ref={succRef}
        className={clsx(shared.connector, connectorsReached && shared.connectorDrawing)}
        d={SUCC_D}
        {...CONNECTOR_STYLE}
      />

      {/* Arrowheads — neutral */}
      {/* Warning: arrives vertically → tip points down (rotate 90) */}
      <g transform="translate(140,154) rotate(90)" style={{ opacity: arrowOpacity(tWarn) }}>
        <polygon points={ARROWHEAD_POINTS_SM} fill="var(--text-muted)" />
      </g>
      {/* Success: arrives vertically → tip points down (rotate 90) */}
      <g transform="translate(420,154) rotate(90)" style={{ opacity: arrowOpacity(tSucc) }}>
        <polygon points={ARROWHEAD_POINTS_SM} fill="var(--text-muted)" />
      </g>

      {/* Top row: 🎈 balloon + 🔌 plug — always rendered, toggled by emojiNodeIn */}
      <g className={clsx(styles.emojiNode, agentsReached && styles.emojiNodeIn)}>
        <NotoEmoji codepoint="1f388" x={140 - ICON_HALF} y={56 - ICON_HALF} size={ICON} />
      </g>
      <g className={clsx(styles.emojiNode, agentsReached && styles.emojiNodeIn)} style={agentsReached ? { transitionDelay: '80ms' } : undefined}>
        <NotoEmoji codepoint="1f50c" x={420 - ICON_HALF} y={56 - ICON_HALF} size={ICON} />
      </g>

      {/* Bottom row: 😭 crying face + 🎯 bullseye — always rendered, toggled by emojiNodeIn */}
      <g className={clsx(styles.emojiNode, resultsReached && styles.emojiNodeIn)}>
        <NotoEmoji codepoint="1f62d" x={140 - ICON_HALF} y={176 - ICON_HALF} size={ICON} />
      </g>
      <g className={clsx(styles.emojiNode, resultsReached && styles.emojiNodeIn)} style={resultsReached ? { transitionDelay: '80ms' } : undefined}>
        <NotoEmoji codepoint="1f3af" x={420 - ICON_HALF} y={176 - ICON_HALF} size={ICON} />
      </g>

      {/* Result labels — neutral; distinction conveyed by emojis and connector style */}
      <text
        x={140} y={224}
        className={clsx(styles.resultLabel, labelsReached && styles.resultLabelIn)}
        fill="var(--text-muted)"
        textAnchor="middle"
        fontSize={11}
        fontWeight={500}
      >
        Hallucinated
      </text>
      <text
        x={420} y={224}
        className={clsx(styles.resultLabel, labelsReached && styles.resultLabelIn)}
        fill="var(--text-muted)"
        textAnchor="middle"
        fontSize={11}
        fontWeight={500}
        style={labelsReached ? { transitionDelay: '80ms' } : undefined}
      >
        Accurate
      </text>
    </svg>
  );
}
