import React, { useId } from 'react';

import type { PresentationAwareProps } from '@site/src/components/PresentationMode/types';
import { OperatorNode } from './ActorNodes';

const GRID = 8;
const SPACE_2 = GRID * 2;
const SPACE_3 = GRID * 3;
const SPACE_4 = GRID * 4;
const SPACE_5 = GRID * 6;
const SPACE_6 = GRID * 8;
const VW = GRID * 136;
const VH = GRID * 36;
const SMALL_W = GRID * 16;
const CARD_W = GRID * 17;
const CARD_H = GRID * 7;
const OPERATOR_SIZE = GRID * 5;
const FLOW_Y = GRID * 18;
const CARD_Y = FLOW_Y - CARD_H / 2;

const GOOD_1_X = SPACE_6;
const GOOD_2_X = GOOD_1_X + SMALL_W + SPACE_5;
const FAIL_1_X = GOOD_2_X + SMALL_W + SPACE_5;
const FAIL_2_X = FAIL_1_X + CARD_W + SPACE_6;
const FAILURE_ZONE_END_X = FAIL_2_X + CARD_W + SPACE_5;
const CHECKPOINT_X = FAILURE_ZONE_END_X + SPACE_5;
const RECOVER_X = CHECKPOINT_X + SPACE_5;
const CAPSULE = {
  x: FAIL_1_X - SPACE_2,
  y: CARD_Y - SPACE_4,
  w: FAILURE_ZONE_END_X - FAIL_1_X + SPACE_2,
  h: CARD_H + SPACE_6,
};
const CHECKPOINT_LINE_TOP = CAPSULE.y + SPACE_2;
const CHECKPOINT_LINE_BOTTOM = CAPSULE.y + CAPSULE.h - SPACE_2;
const CHECKPOINT_EMOJI_X = CHECKPOINT_X - OPERATOR_SIZE / 2;
const CHECKPOINT_EMOJI_Y = CHECKPOINT_LINE_TOP - OPERATOR_SIZE - GRID;
const CHECKPOINT_LABEL_Y = CAPSULE.y + CAPSULE.h + SPACE_3;

function Marker({ id, fill }: { id: string; fill: string }) {
  return (
    <marker
      id={id}
      viewBox="0 0 6 6"
      markerWidth="6"
      markerHeight="6"
      refX="5"
      refY="3"
      orient="auto"
    >
      <polygon points="0 0, 6 3, 0 6" fill={fill} />
    </marker>
  );
}

function NeutralStep({ x, label }: { x: number; label: string }) {
  return (
    <g>
      <rect
        x={x}
        y={CARD_Y + GRID / 2}
        width={SMALL_W}
        height={CARD_H - GRID}
        rx={GRID}
        fill="var(--surface-raised)"
        stroke="var(--border-default)"
        strokeWidth="var(--stroke-light)"
      />
      <text
        x={x + GRID * 2}
        y={FLOW_Y + 4}
        fontFamily="var(--font-mono-keyword)"
        fontSize="var(--text-xs)"
        fontWeight="700"
        fill="var(--text-muted)"
      >
        {label}
      </text>
    </g>
  );
}

function FailureStep({ x, label, detail }: { x: number; label: string; detail: string }) {
  return (
    <g>
      <rect
        x={x}
        y={CARD_Y}
        width={CARD_W}
        height={CARD_H}
        rx="3"
        fill="var(--visual-bg-error)"
        stroke="var(--visual-error)"
        strokeWidth="var(--stroke-light)"
      />
      <text
        x={x + GRID * 2}
        y={CARD_Y + GRID * 3}
        fontFamily="var(--font-display)"
        fontSize="var(--text-sm)"
        fontWeight="700"
        fill="var(--visual-error)"
      >
        {label}
      </text>
      <text
        x={x + GRID * 2}
        y={CARD_Y + GRID * 5}
        fontFamily="var(--font-mono-keyword)"
        fontSize="var(--text-xs)"
        fill="var(--text-muted)"
      >
        {detail}
      </text>
    </g>
  );
}

function RecoveredStep() {
  return (
    <g>
      <rect
        x={RECOVER_X}
        y={CARD_Y}
        width={CARD_W}
        height={CARD_H}
        rx={GRID}
        fill="var(--visual-bg-success)"
        stroke="var(--visual-success)"
        strokeWidth="var(--stroke-light)"
      />
      <text
        x={RECOVER_X + GRID * 2}
        y={CARD_Y + GRID * 3}
        fontFamily="var(--font-display)"
        fontSize="var(--text-sm)"
        fontWeight="700"
        fill="var(--visual-success)"
      >
        recovered
      </text>
      <text
        x={RECOVER_X + GRID * 2}
        y={CARD_Y + GRID * 5}
        fontFamily="var(--font-mono-keyword)"
        fontSize="var(--text-xs)"
        fill="var(--text-muted)"
      >
        reset state
      </text>
    </g>
  );
}

function connectorHandle(x1: number, x2: number) {
  const gap = Math.abs(x2 - x1);
  return Math.min(SPACE_2, Math.max(GRID, gap / 3));
}

function angularPoints(x1: number, x2: number) {
  return `${x1},${FLOW_Y} ${x1 + SPACE_2},${FLOW_Y - SPACE_2} ${x2 - SPACE_2},${FLOW_Y - SPACE_2} ${x2},${FLOW_Y}`;
}

function Arrow({ x1, x2, tone, markerId, angular = false }: {
  x1: number;
  x2: number;
  tone: string;
  markerId: string;
  angular?: boolean;
}) {
  const handle = connectorHandle(x1, x2);
  const markerEnd = `url(#${markerId})`;

  return angular ? (
    <polyline
      points={angularPoints(x1, x2)}
      fill="none"
      stroke={tone}
      strokeWidth="var(--stroke-heavy)"
      strokeLinecap="square"
      strokeLinejoin="miter"
      markerEnd={markerEnd}
    />
  ) : (
    <path
      d={`M ${x1} ${FLOW_Y} C ${x1 + handle} ${FLOW_Y}, ${x2 - handle} ${FLOW_Y}, ${x2} ${FLOW_Y}`}
      fill="none"
      stroke={tone}
      strokeWidth="var(--stroke-default)"
      strokeLinecap="round"
      markerEnd={markerEnd}
    />
  );
}

export default function FailureStickinessChain({
  compact = false,
}: PresentationAwareProps = {}) {
  const uid = useId().replace(/:/g, '');
  const neutralMarker = `stickiness-neutral-${uid}`;
  const errorMarker = `stickiness-error-${uid}`;
  const successMarker = `stickiness-success-${uid}`;

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      width="100%"
      height="auto"
      role="img"
      aria-label="Failure stickiness diagram: two good steps complete normally, then a wrong import causes step n to fail. With high S, the bad premise carries forward and step n plus one also fails. A human checkpoint operator interrupts the red propagation chain, then execution resumes in a green recovered state."
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', maxWidth: compact ? '95%' : `${VW}px`, margin: '0 auto' }}
    >
      <defs>
        <Marker id={neutralMarker} fill="var(--visual-neutral)" />
        <Marker id={errorMarker} fill="var(--visual-error)" />
        <Marker id={successMarker} fill="var(--visual-success)" />
      </defs>

      <rect
        x={GRID}
        y={GRID}
        width={VW - GRID * 2}
        height={VH - GRID * 2}
        rx={GRID * 2}
        fill="var(--surface-page)"
        stroke="var(--border-subtle)"
      />

      <text
        x={GOOD_1_X}
        y={CAPSULE.y + GRID * 3}
        fontFamily="var(--font-mono-keyword)"
        fontSize="var(--text-xs)"
        fontWeight="700"
        fill="var(--text-muted)"
      >
        normal chain
      </text>

      <rect
        x={CAPSULE.x}
        y={CAPSULE.y}
        width={CAPSULE.w}
        height={CAPSULE.h}
        rx={GRID * 2}
        fill="var(--visual-bg-error)"
        stroke="var(--visual-error)"
        strokeWidth="var(--stroke-fine)"
        strokeDasharray="5 5"
      />
      <text
        x={CAPSULE.x + GRID * 2}
        y={CAPSULE.y + GRID * 3}
        fontFamily="var(--font-mono-keyword)"
        fontSize="var(--text-xs)"
        fontWeight="700"
        fill="var(--visual-error)"
      >
        HIGH S: failure state persists
      </text>

      <NeutralStep x={GOOD_1_X} label="step n-2 ok" />
      <NeutralStep x={GOOD_2_X} label="step n-1 ok" />
      <FailureStep x={FAIL_1_X} label="step n fails" detail="wrong import" />
      <FailureStep x={FAIL_2_X} label="step n+1 fails" detail="wrong API" />

      <Arrow x1={GOOD_1_X + SMALL_W} x2={GOOD_2_X} tone="var(--visual-neutral)" markerId={neutralMarker} />
      <Arrow x1={GOOD_2_X + SMALL_W} x2={FAIL_1_X} tone="var(--visual-neutral)" markerId={neutralMarker} />
      <Arrow x1={FAIL_1_X + CARD_W} x2={FAIL_2_X} tone="var(--visual-error)" markerId={errorMarker} angular />

      <text
        x={(FAIL_1_X + CARD_W + FAIL_2_X) / 2}
        y={CARD_Y + CARD_H + GRID * 3}
        textAnchor="middle"
        fontFamily="var(--font-mono-keyword)"
        fontSize="var(--text-xs)"
        fill="var(--visual-error)"
        paintOrder="stroke"
        stroke="var(--surface-page)"
        strokeWidth="var(--stroke-heavy)"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        bad premise carries forward
      </text>

      <line
        x1={FAIL_2_X + CARD_W}
        y1={FLOW_Y}
        x2={CHECKPOINT_X}
        y2={FLOW_Y}
        stroke="var(--visual-error)"
        strokeWidth="var(--stroke-heavy)"
        strokeLinecap="square"
      />

      <line
        x1={CHECKPOINT_X}
        y1={CHECKPOINT_LINE_TOP}
        x2={CHECKPOINT_X}
        y2={CHECKPOINT_LINE_BOTTOM}
        stroke="var(--visual-warning)"
        strokeWidth="var(--stroke-accent)"
        strokeLinecap="square"
      />
      <OperatorNode x={CHECKPOINT_EMOJI_X} y={CHECKPOINT_EMOJI_Y} size={OPERATOR_SIZE} />
      <text
        x={CHECKPOINT_X}
        y={CHECKPOINT_LABEL_Y}
        textAnchor="middle"
        fontFamily="var(--font-mono-human)"
        fontSize="var(--text-xs)"
        fontWeight="700"
        fill="var(--visual-warning)"
      >
        human checkpoint
      </text>

      <Arrow x1={CHECKPOINT_X} x2={RECOVER_X} tone="var(--visual-success)" markerId={successMarker} />
      <RecoveredStep />
    </svg>
  );
}
