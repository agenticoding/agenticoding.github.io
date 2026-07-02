import React from 'react';
import {
  codeGlyphStrokeWidth,
  compressedOverlayInset,
  insetBox,
  minDimension,
  salientStrokeWidth,
  scaledInset,
  supportsDashedOverlay,
  tokenStrokeWidth,
  type TokenBox,
} from './TokenUnitGeometry';

export type TokenUnitTone =
  | 'neutral'
  | 'indigo'
  | 'violet'
  | 'cyan'
  | 'magenta'
  | 'warning';

export type TokenUnitModality =
  | 'text'
  | 'image'
  | 'audio'
  | 'video'
  | 'code'
  | 'generic';

export type TokenUnitSignal = 'ordinary' | 'salient' | 'compressed';

type TokenUnitProps = Required<Pick<TokenBox, 'x' | 'y'>> &
  Partial<Pick<TokenBox, 'width' | 'height'>> & {
    tone?: TokenUnitTone;
    modality?: TokenUnitModality;
    signal?: TokenUnitSignal;
    className?: string;
  };

type ShapeProps = TokenBox;

type SignalStyle = {
  strokeWidth: number;
};

const unitVar = (tone: TokenUnitTone, kind: 'fg' | 'bg') =>
  `var(--visual${kind === 'bg' ? '-bg' : ''}-${tone})`;

const pointList = (points: Array<[number, number]>) =>
  points.map(([px, py]) => `${px},${py}`).join(' ');

const visibleBox = (box: TokenBox) => insetBox(box, scaledInset(box));

function tokenSignalStyle(box: TokenBox, signal: TokenUnitSignal): SignalStyle {
  if (signal === 'salient') return { strokeWidth: salientStrokeWidth(box) };
  if (signal === 'compressed')
    return { strokeWidth: tokenStrokeWidth(box, 1.35) };
  return { strokeWidth: tokenStrokeWidth(box, 1.6) };
}

function TextUnit(props: ShapeProps) {
  return <rect {...visibleBox(props)} rx={0} />;
}

function ImageUnit(props: ShapeProps) {
  const box = visibleBox(props);
  const radius = minDimension(box) / 2;
  return (
    <circle
      cx={box.x + box.width / 2}
      cy={box.y + box.height / 2}
      r={radius}
    />
  );
}

function AudioUnit(props: ShapeProps) {
  const box = visibleBox(props);
  const width = Math.min(box.width, Math.max(4, box.width * 0.44));
  return (
    <rect
      x={box.x + (box.width - width) / 2}
      y={box.y}
      width={width}
      height={box.height}
      rx={width / 2}
    />
  );
}

function VideoUnit(props: ShapeProps) {
  const box = visibleBox(props);
  return (
    <polygon
      points={pointList([
        [box.x, box.y],
        [box.x + box.width, box.y + box.height / 2],
        [box.x, box.y + box.height],
      ])}
    />
  );
}

function CodeUnit(props: ShapeProps) {
  const box = visibleBox(props);
  const left = box.x + box.width * 0.16;
  const midX = box.x + box.width * 0.44;
  const cursorStart = box.x + box.width * 0.52;
  const cursorEnd = box.x + box.width * 0.84;
  const top = box.y + box.height * 0.3;
  const midY = box.y + box.height * 0.5;
  const bottom = box.y + box.height * 0.7;
  return (
    <g
      fill="none"
      strokeLinecap="round"
      strokeWidth={codeGlyphStrokeWidth()}
    >
      <path d={`M ${left} ${top} L ${midX} ${midY} L ${left} ${bottom}`} />
      <path d={`M ${cursorStart} ${bottom} H ${cursorEnd}`} />
    </g>
  );
}

function GenericUnit(props: ShapeProps) {
  const box = visibleBox(props);
  const cut = Math.min(box.width, box.height) * 0.2;
  return (
    <polygon
      points={pointList([
        [box.x + cut, box.y],
        [box.x + box.width - cut, box.y],
        [box.x + box.width, box.y + cut],
        [box.x + box.width, box.y + box.height - cut],
        [box.x + box.width - cut, box.y + box.height],
        [box.x + cut, box.y + box.height],
        [box.x, box.y + box.height - cut],
        [box.x, box.y + cut],
      ])}
    />
  );
}

function SalientCore({ x, y, width, height, fg }: ShapeProps & { fg: string }) {
  const coreSize = Math.max(1.6, minDimension({ x, y, width, height }) * 0.34);
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

function CompressedOverlay(props: ShapeProps) {
  const box = insetBox(props, compressedOverlayInset(props));
  const strokeDasharray = supportsDashedOverlay(props) ? '3 2' : undefined;
  return (
    <path
      d={`M ${box.x} ${box.y + box.height} L ${box.x + box.width} ${box.y}`}
      fill="none"
      strokeDasharray={strokeDasharray}
      opacity="0.72"
    />
  );
}

function showsCompressedOverlay(
  signal: TokenUnitSignal,
  modality: TokenUnitModality
) {
  return signal === 'compressed' && !['audio', 'video', 'code'].includes(modality);
}

const SHAPES = {
  text: TextUnit,
  image: ImageUnit,
  audio: AudioUnit,
  video: VideoUnit,
  code: CodeUnit,
  generic: GenericUnit,
} as const satisfies Record<
  TokenUnitModality,
  (props: ShapeProps) => React.ReactNode
>;

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
  const box = { x, y, width, height };
  const { strokeWidth } = tokenSignalStyle(box, signal);

  return (
    <g
      className={className}
      aria-hidden="true"
      fill={bg}
      stroke={fg}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    >
      <Shape {...box} />
      {showsCompressedOverlay(signal, modality) ? (
        <CompressedOverlay {...box} />
      ) : null}
      {signal === 'salient' && modality !== 'code' ? (
        <SalientCore {...box} fg={fg} />
      ) : null}
    </g>
  );
}
