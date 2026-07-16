import React from 'react';

import { EmojiImage } from './ActorNodes';
import { EMOJI, type EmojiAsset } from './emojiAssets';
import styles from './SpeedAccuracyTradeoff.module.css';

const LABEL_STYLE = { fontFamily: 'var(--font-body)' };
const HEADING_STYLE = { fontFamily: 'var(--font-display)' };

type Layout = {
  width: number;
  height: number;
  railStart: number;
  railEnd: number;
  railY: number;
  positionX: number;
  cueStep: number;
  poleWidth: number;
  leftPoleX: number;
  rightPoleX: number;
  throughputDetail: string;
  accuracyDetail: string;
};

const DESKTOP: Layout = {
  width: 792,
  height: 272,
  railStart: 64,
  railEnd: 728,
  railY: 184,
  positionX: 396,
  cueStep: 83,
  poleWidth: 248,
  leftPoleX: 64,
  rightPoleX: 480,
  throughputDetail: 'faster decisions · more variation',
  accuracyDetail: 'more time · stronger evidence',
};

const MOBILE: Layout = {
  width: 320,
  height: 280,
  railStart: 24,
  railEnd: 296,
  railY: 176,
  positionX: 160,
  cueStep: 34,
  poleWidth: 112,
  leftPoleX: 24,
  rightPoleX: 184,
  throughputDetail: 'faster · variation',
  accuracyDetail: 'more time · evidence',
};

export default function SpeedAccuracyTradeoff() {
  return (
    <div className={styles.container}>
      <TradeoffDiagram className={styles.desktop} layout={DESKTOP} />
      <TradeoffDiagram className={styles.mobile} layout={MOBILE} />
    </div>
  );
}

function TradeoffDiagram({
  className,
  layout,
}: {
  className: string;
  layout: Layout;
}) {
  return (
    <svg
      className={className}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      role="img"
      aria-label="A continuous calibration rail runs from the throughput pole, with faster decisions and more accepted variation, to the accuracy pole, with more time per decision and stronger evidence. A marker shows that each claim is positioned somewhere between those extremes."
    >
      <Pole
        x={layout.leftPoleX}
        width={layout.poleWidth}
        title="THROUGHPUT"
        detail={layout.throughputDetail}
        icon={EMOJI.stopwatch}
      />
      <Pole
        x={layout.rightPoleX}
        width={layout.poleWidth}
        title="ACCURACY"
        detail={layout.accuracyDetail}
        icon={EMOJI.accurate}
      />
      <CalibrationRail layout={layout} />
    </svg>
  );
}

function Pole({
  x,
  width,
  title,
  detail,
  icon,
}: {
  x: number;
  width: number;
  title: string;
  detail: string;
  icon: EmojiAsset;
}) {
  const textX = x + width / 2;
  return (
    <g>
      <rect
        x={x}
        y="16"
        width={width}
        height="112"
        fill="var(--surface-raised)"
        stroke="var(--border-default)"
      />
      <EmojiImage asset={icon} x={textX - 12} y={26} size={24} />
      <text
        x={textX}
        y="72"
        textAnchor="middle"
        style={HEADING_STYLE}
        fontSize="var(--text-sm)"
        fontWeight="700"
        fill="var(--text-heading)"
      >
        {title}
      </text>
      <text
        x={textX}
        y="96"
        textAnchor="middle"
        style={LABEL_STYLE}
        fontSize="var(--text-xs)"
        fill="var(--text-body)"
      >
        {detail}
      </text>
    </g>
  );
}

function CalibrationRail({ layout }: { layout: Layout }) {
  const ticks = Array.from(
    { length: 9 },
    (_, index) =>
      layout.railStart + ((layout.railEnd - layout.railStart) * index) / 8
  );
  return (
    <g>
      <text
        x={(layout.railStart + layout.railEnd) / 2}
        y={layout.railY - 24}
        textAnchor="middle"
        style={LABEL_STYLE}
        fontSize="var(--text-xs)"
        fill="var(--text-muted)"
      >
        CONTINUOUS CALIBRATION · ACCURACY / TIME
      </text>
      <line
        x1={layout.railStart}
        y1={layout.railY}
        x2={layout.railEnd}
        y2={layout.railY}
        stroke="var(--visual-neutral)"
        strokeWidth="var(--stroke-heavy)"
        strokeLinecap="square"
      />
      {ticks.map((x) => (
        <line
          key={x}
          x1={x}
          y1={layout.railY - 8}
          x2={x}
          y2={layout.railY + 8}
          stroke="var(--visual-neutral)"
          strokeWidth="var(--stroke-light)"
        />
      ))}
      <PositionCue layout={layout} />
    </g>
  );
}

function PositionCue({ layout }: { layout: Layout }) {
  const labelY = layout.railY + 56;
  return (
    <g
      className={styles.positionCue}
      style={{ '--cue-step': `${layout.cueStep}px` } as React.CSSProperties}
    >
      <line
        x1={layout.positionX}
        y1={layout.railY + 12}
        x2={layout.positionX}
        y2={labelY - 20}
        stroke="var(--visual-warning)"
        strokeWidth="var(--stroke-light)"
      />
      <polygon
        points={`${layout.positionX},${layout.railY - 10} ${layout.positionX + 10},${layout.railY} ${layout.positionX},${layout.railY + 10} ${layout.positionX - 10},${layout.railY}`}
        fill="var(--surface-page)"
        stroke="var(--visual-warning)"
        strokeWidth="var(--stroke-medium)"
      />
      <text
        x={layout.positionX}
        y={labelY}
        textAnchor="middle"
        style={HEADING_STYLE}
        fontSize="var(--text-xs)"
        fontWeight="700"
        fill="var(--visual-warning)"
      >
        SET YOUR PRECISION
      </text>
    </g>
  );
}
