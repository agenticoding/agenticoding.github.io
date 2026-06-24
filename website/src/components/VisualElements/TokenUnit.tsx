import React from 'react';

export type TokenUnitTone =
  | 'neutral'
  | 'indigo'
  | 'violet'
  | 'cyan'
  | 'magenta';

export type TokenUnitModality =
  | 'text'
  | 'image'
  | 'audio'
  | 'video'
  | 'code'
  | 'generic';

export type TokenUnitSignal = 'ordinary' | 'salient' | 'compressed';

type TokenUnitProps = {
  x: number;
  y: number;
  width?: number;
  height?: number;
  tone?: TokenUnitTone;
  modality?: TokenUnitModality;
  signal?: TokenUnitSignal;
  className?: string;
};

type ShapeProps = Required<Pick<TokenUnitProps, 'x' | 'y' | 'width' | 'height'>> & {
  fg: string;
  bg: string;
  strokeWidth: number;
};

const unitVar = (tone: TokenUnitTone, kind: 'fg' | 'bg') =>
  `var(--visual${kind === 'bg' ? '-bg' : ''}-${tone})`;

const SIGNAL_STROKE: Record<TokenUnitSignal, number> = {
  ordinary: 1.6,
  salient: 3,
  compressed: 1.4,
};

const SIGNAL_SHRINK: Record<TokenUnitSignal, number> = {
  ordinary: 0,
  salient: 0,
  compressed: 3,
};

const inset = ({ x, y, width, height }: ShapeProps) => ({
  x: x + 1,
  y: y + 1,
  width: width - 2,
  height: height - 2,
});

const signalBox = (
  { x, y, width, height }: Required<Pick<TokenUnitProps, 'x' | 'y' | 'width' | 'height'>>,
  signal: TokenUnitSignal,
) => {
  const shrink = SIGNAL_SHRINK[signal];
  return { x: x + shrink, y: y + shrink, width: width - shrink * 2, height: height - shrink * 2 };
};

function TextUnit(props: ShapeProps) {
  const box = inset(props);
  return <rect {...box} rx={0} />;
}

function ImageUnit(props: ShapeProps) {
  const box = inset(props);
  const midX = box.x + box.width / 2;
  const midY = box.y + box.height / 2;
  return (
    <>
      <rect {...box} rx={0} />
      <path
        d={`M ${midX} ${box.y + 2} V ${box.y + box.height - 2} M ${box.x + 2} ${midY} H ${box.x + box.width - 2}`}
        fill="none"
      />
    </>
  );
}

function AudioUnit({ x, y, width, height }: ShapeProps) {
  const w = Math.max(7, width * 0.46);
  return <rect x={x + (width - w) / 2} y={y + 1} width={w} height={height - 2} rx={0} />;
}

function VideoUnit({ x, y, width, height }: ShapeProps) {
  const h = Math.max(10, height * 0.58);
  return <rect x={x + 1} y={y + (height - h) / 2} width={width - 2} height={h} rx={0} />;
}

function CodeUnit({ x, y, width, height }: ShapeProps) {
  const cut = Math.min(width, height) * 0.24;
  return <path d={`M ${x + 1} ${y + 1} H ${x + width - cut} L ${x + width - 1} ${y + cut} V ${y + height - 1} H ${x + 1} Z`} />;
}

function GenericUnit(props: ShapeProps) {
  const box = inset(props);
  return <rect {...box} rx={0} />;
}

function SalientCore({ x, y, width, height, fg }: ShapeProps) {
  const coreSize = Math.min(width, height) * 0.42;
  return (
    <rect
      x={x + (width - coreSize) / 2}
      y={y + (height - coreSize) / 2}
      width={coreSize}
      height={coreSize}
      rx={0}
      fill={fg}
      stroke="none"
      opacity="0.22"
    />
  );
}

const SHAPES = {
  text: TextUnit,
  image: ImageUnit,
  audio: AudioUnit,
  video: VideoUnit,
  code: CodeUnit,
  generic: GenericUnit,
} as const satisfies Record<TokenUnitModality, (props: ShapeProps) => React.ReactNode>;

export function TokenUnit({
  x,
  y,
  width = 24,
  height = 24,
  tone = 'indigo',
  modality = 'text',
  signal = 'ordinary',
  className,
}: TokenUnitProps) {
  const fg = unitVar(tone, 'fg');
  const bg = unitVar(tone, 'bg');
  const Shape = SHAPES[modality];
  const box = signalBox({ x, y, width, height }, signal);
  const shapeProps = { ...box, fg, bg, strokeWidth: SIGNAL_STROKE[signal] };

  return (
    <g
      className={className}
      aria-hidden="true"
      fill={bg}
      stroke={fg}
      strokeWidth={shapeProps.strokeWidth}
      strokeDasharray={signal === 'compressed' ? '3 2' : undefined}
      strokeLinejoin="round"
    >
      <Shape {...shapeProps} />
      {signal === 'salient' ? <SalientCore {...shapeProps} /> : null}
    </g>
  );
}
