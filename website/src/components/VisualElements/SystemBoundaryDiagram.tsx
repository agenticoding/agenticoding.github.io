import React from 'react';
import type { PresentationAwareProps } from '../PresentationMode/types';
import styles from './SystemBoundaryDiagram.module.css';

// Shared constants
const ARROW_GAP = 8;
const BOX_RX = 8;
const VIEWBOX_PADDING = 25;

interface ArrowDef {
  from: string;
  to: string;
  label: string;
  path: [number, number, number, number];
  labelDy?: number;
  labelDx?: number;
}

// --- Default layout (vertical, for docs) ---

const DEFAULT_BOUNDARY = { x: 140, y: 85, w: 400, h: 250 };

const DEFAULT_MODULES = [
  { id: 'webhook', label: 'webhook-handler', x: 168, y: 120, w: 155, h: 56 },
  { id: 'payment', label: 'payment', x: 385, y: 120, w: 130, h: 56 },
  { id: 'notification', label: 'notification', x: 385, y: 240, w: 130, h: 56 },
] as const;

const DEFAULT_ACTORS = [
  { id: 'stripe', label: 'Stripe', x: -22, y: 120, w: 105, h: 56 },
  { id: 'client', label: 'Client App', x: 310, y: 10, w: 120, h: 50 },
  { id: 'rabbit', label: 'RabbitMQ', x: 385, y: 362, w: 130, h: 50 },
] as const;

const DEFAULT_CONTRACTS: ArrowDef[] = [
  { from: 'webhook', to: 'payment', label: 'processEvent()', path: [323 + ARROW_GAP, 148, 385 - ARROW_GAP, 148], labelDy: -38 },
  { from: 'payment', to: 'notification', label: 'PaymentEvent', path: [450, 176 + ARROW_GAP, 450, 240 - ARROW_GAP], labelDx: -55 },
];

const DEFAULT_INPUTS: ArrowDef[] = [
  { from: 'stripe', to: 'webhook', label: 'Stripe webhook', path: [83 + ARROW_GAP, 148, 168 - ARROW_GAP, 148], labelDy: -48, labelDx: -40 },
  { from: 'client', to: 'payment', label: 'Order request', path: [375, 60 + ARROW_GAP, 438, 120 - ARROW_GAP], labelDy: -12, labelDx: 40 },
];

const DEFAULT_OUTPUTS: ArrowDef[] = [
  { from: 'webhook', to: 'stripe', label: 'Ack 200', path: [168 - ARROW_GAP, 160, 83 + ARROW_GAP, 160], labelDy: 38, labelDx: -15 },
  { from: 'notification', to: 'rabbit', label: 'Queue message', path: [450, 296 + ARROW_GAP, 450, 362 - ARROW_GAP], labelDx: -55 },
];

const DEFAULT_LEGEND_Y = 440;
const DEFAULT_LEGEND_ENTRIES = [
  { x1: 40, x2: 70, textX: 77, label: 'Contract (internal)', arrowId: 'arrow-contract', strokeVar: 'var(--visual-workflow)' },
  { x1: 210, x2: 240, textX: 247, label: 'Input (external)', arrowId: 'arrow-input', strokeVar: 'var(--visual-capability)' },
  { x1: 375, x2: 405, textX: 412, label: 'Output (external)', arrowId: 'arrow-output', strokeVar: 'var(--visual-limitation)' },
];

const DEFAULT_VIEWBOX = { x: -47, y: -15, w: 587, h: 463 };

// --- Compact layout (horizontal row, for widescreen presentations) ---
// All three internal modules in a single row:
//              Client App
//                  ↓
// Stripe ←→ webhook-handler → payment → notification → RabbitMQ

const COMPACT_BOUNDARY = { x: 145, y: 85, w: 605, h: 162 };

const COMPACT_MODULES = [
  { id: 'webhook', label: 'webhook-handler', x: 170, y: 130, w: 155, h: 72 },
  { id: 'payment', label: 'payment', x: 390, y: 130, w: 130, h: 72 },
  { id: 'notification', label: 'notification', x: 585, y: 130, w: 140, h: 72 },
] as const;

const COMPACT_ACTORS = [
  { id: 'stripe', label: 'Stripe', x: 0, y: 130, w: 105, h: 72 },
  { id: 'client', label: 'Client App', x: 390, y: 5, w: 130, h: 65 },
  { id: 'rabbit', label: 'RabbitMQ', x: 790, y: 130, w: 130, h: 72 },
] as const;

const COMPACT_CONTRACTS: ArrowDef[] = [
  { from: 'webhook', to: 'payment', label: 'processEvent()', path: [325 + ARROW_GAP, 166, 390 - ARROW_GAP, 166], labelDy: -45 },
  { from: 'payment', to: 'notification', label: 'PaymentEvent', path: [520 + ARROW_GAP, 166, 585 - ARROW_GAP, 166], labelDy: -45 },
];

const COMPACT_INPUTS: ArrowDef[] = [
  { from: 'stripe', to: 'webhook', label: 'Stripe webhook', path: [105 + ARROW_GAP, 156, 170 - ARROW_GAP, 156], labelDy: -36 },
  { from: 'client', to: 'payment', label: 'Order request', path: [455, 70 + ARROW_GAP, 455, 130 - ARROW_GAP], labelDx: 80 },
];

const COMPACT_OUTPUTS: ArrowDef[] = [
  { from: 'webhook', to: 'stripe', label: 'Ack 200', path: [170 - ARROW_GAP, 176, 105 + ARROW_GAP, 176], labelDy: 35 },
  { from: 'notification', to: 'rabbit', label: 'Queue message', path: [725 + ARROW_GAP, 166, 790 - ARROW_GAP, 166], labelDy: -45 },
];

const COMPACT_LEGEND_Y = 272;
const COMPACT_LEGEND_ENTRIES = [
  { x1: 240, x2: 270, textX: 277, label: 'Contract (internal)', arrowId: 'arrow-contract', strokeVar: 'var(--visual-workflow)' },
  { x1: 420, x2: 450, textX: 457, label: 'Input (external)', arrowId: 'arrow-input', strokeVar: 'var(--visual-capability)' },
  { x1: 600, x2: 630, textX: 637, label: 'Output (external)', arrowId: 'arrow-output', strokeVar: 'var(--visual-limitation)' },
];

const COMPACT_VIEWBOX = { x: -25, y: -20, w: 970, h: 300 };

// Animation delays (shared)
const DELAY_BOUNDARY = 0;
const DELAY_MODULES = 0.15;
const DELAY_ACTORS = 0.3;
const DELAY_ARROWS = 0.5;
const DELAY_LEGEND = 0.7;

export default function SystemBoundaryDiagram({ compact = false }: PresentationAwareProps = {}) {
  const boundary = compact ? COMPACT_BOUNDARY : DEFAULT_BOUNDARY;
  const modules = compact ? COMPACT_MODULES : DEFAULT_MODULES;
  const actors = compact ? COMPACT_ACTORS : DEFAULT_ACTORS;
  const contracts = compact ? COMPACT_CONTRACTS : DEFAULT_CONTRACTS;
  const inputs = compact ? COMPACT_INPUTS : DEFAULT_INPUTS;
  const outputs = compact ? COMPACT_OUTPUTS : DEFAULT_OUTPUTS;
  const legendY = compact ? COMPACT_LEGEND_Y : DEFAULT_LEGEND_Y;
  const legendEntries = compact ? COMPACT_LEGEND_ENTRIES : DEFAULT_LEGEND_ENTRIES;
  const viewBox = compact ? COMPACT_VIEWBOX : DEFAULT_VIEWBOX;

  // Smaller markers for the wider compact viewBox
  const mW = compact ? 6 : 8;
  const mH = compact ? 6 : 8;
  const mRefX = compact ? 5 : 6;
  const mRefY = compact ? 3 : 3;
  const mPoly = compact ? '0 0, 6 3, 0 6' : '0 0, 8 3, 0 6';

  return (
    <div
      className={`${styles.container} ${compact ? styles.compact : ''}`}
      role="img"
      aria-label="System boundary diagram: External actors (Stripe, Client App, RabbitMQ) connect to internal modules (webhook-handler, payment, notification) through input and output interfaces. Internal modules communicate via contracts."
    >
      <svg
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className={styles.svg}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <marker id="arrow-contract" markerWidth={mW} markerHeight={mH} refX={mRefX} refY={mRefY} orient="auto" className={styles.contractMarker}>
            <polygon points={mPoly} />
          </marker>
          <marker id="arrow-input" markerWidth={mW} markerHeight={mH} refX={mRefX} refY={mRefY} orient="auto" className={styles.inputMarker}>
            <polygon points={mPoly} />
          </marker>
          <marker id="arrow-output" markerWidth={mW} markerHeight={mH} refX={mRefX} refY={mRefY} orient="auto" className={styles.outputMarker}>
            <polygon points={mPoly} />
          </marker>
        </defs>

        {/* System boundary */}
        <g className={styles.animGroup} style={{ animationDelay: `${DELAY_BOUNDARY}s` }}>
          <rect
            x={boundary.x} y={boundary.y}
            width={boundary.w} height={boundary.h}
            rx={BOX_RX}
            className={styles.boundary}
          />
          <text x={boundary.x + 10} y={boundary.y + boundary.h - 8} className={styles.boundaryLabel}>
            System Boundary
          </text>
        </g>

        {/* Internal modules */}
        {modules.map((m, i) => (
          <g key={m.id} className={styles.animGroup} style={{ animationDelay: `${DELAY_MODULES + i * 0.08}s` }}>
            <rect x={m.x} y={m.y} width={m.w} height={m.h} rx={BOX_RX} className={styles.moduleBox} />
            <text x={m.x + m.w / 2} y={m.y + m.h / 2 + 6} textAnchor="middle" className={styles.moduleLabel}>
              {m.label}
            </text>
          </g>
        ))}

        {/* External actors */}
        {actors.map((a, i) => (
          <g key={a.id} className={styles.animGroup} style={{ animationDelay: `${DELAY_ACTORS + i * 0.08}s` }}>
            <rect x={a.x} y={a.y} width={a.w} height={a.h} rx={BOX_RX} className={styles.actorBox} />
            <text x={a.x + a.w / 2} y={a.y + a.h / 2 + 6} textAnchor="middle" className={styles.actorLabel}>
              {a.label}
            </text>
          </g>
        ))}

        {/* Arrows — rendered with label halo (paint-order in CSS) */}
        {[
          { arrows: contracts, cls: styles.contractArrow, marker: 'arrow-contract', delayBase: DELAY_ARROWS },
          { arrows: inputs, cls: styles.inputArrow, marker: 'arrow-input', delayBase: DELAY_ARROWS + 0.16 },
          { arrows: outputs, cls: styles.outputArrow, marker: 'arrow-output', delayBase: DELAY_ARROWS + 0.32 },
        ].map(({ arrows, cls, marker, delayBase }) =>
          arrows.map((a, i) => {
            const [x1, y1, x2, y2] = a.path;
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;
            const lx = mx + (a.labelDx ?? 0);
            const ly = my + (a.labelDy ?? -8);
            return (
              <g key={`${marker}-${i}`} className={styles.animGroup} style={{ animationDelay: `${delayBase + i * 0.08}s` }}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} className={cls} markerEnd={`url(#${marker})`} />
                <text x={lx} y={ly} textAnchor="middle" className={styles.arrowLabel}>{a.label}</text>
              </g>
            );
          })
        )}

        {/* Legend */}
        <g className={styles.animGroup} style={{ animationDelay: `${DELAY_LEGEND}s` }}>
          {legendEntries.map((entry, i) => (
            <g key={`legend-${i}`}>
              <line x1={entry.x1} y1={legendY} x2={entry.x2} y2={legendY} stroke={entry.strokeVar} className={styles.legendLine} markerEnd={`url(#${entry.arrowId})`} />
              <text x={entry.textX} y={legendY + 4} className={styles.legendLabel}>{entry.label}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
