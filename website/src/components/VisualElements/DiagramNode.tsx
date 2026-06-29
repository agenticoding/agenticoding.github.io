import React from 'react';
import clsx from 'clsx';
import { EmojiImage } from './ActorNodes';
import type { EmojiAsset } from './emojiAssets';
import shared from './diagram.module.css';
import { tileToneVars, voiceStyle, type DiagramTone, type DiagramVoice } from './diagramTileLayout';

type DiagramNodeProps = {
  x: number;
  y: number;
  emoji: EmojiAsset;
  label: string;
  tone: DiagramTone;
  reached?: boolean;
  className?: string;
  labelClassName?: string;
  labelReached?: boolean;
  labelVoice?: DiagramVoice;
  labelX?: number;
  labelY?: number;
  size?: number;
};

export function DiagramNode({ x, y, emoji, label, tone, reached = true, labelReached = reached, className, labelClassName, labelVoice = 'ai', labelX, labelY, size = 40 }: DiagramNodeProps) {
  const colors = tileToneVars(tone);
  const cx = x + size / 2;
  return (
    <>
      <g className={clsx(shared.node, reached && shared.nodeIn, className)}>
        <EmojiImage asset={emoji} x={x} y={y} size={size} />
      </g>
      <text x={labelX ?? cx} y={labelY ?? y + size + 20} fill={colors.accent} textAnchor="middle" fontSize={labelVoice === 'spec' ? 9 : 10} fontWeight={500} style={voiceStyle(labelVoice, labelVoice === 'spec' ? 9 : 10, 500)} className={clsx(shared.label, labelReached && shared.labelIn, labelClassName)}>{label}</text>
    </>
  );
}
