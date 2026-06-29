import React, { type CSSProperties } from 'react';
import clsx from 'clsx';

import {
  TokenUnit,
  type TokenUnitModality,
  type TokenUnitSignal,
  type TokenUnitTone,
} from './TokenUnit';
import styles from './AnimatedTokenFlow.module.css';

export type AnimatedTokenFlowSpec = {
  delay: string;
  modality: TokenUnitModality;
  signal: TokenUnitSignal;
};

type TokenSequence = readonly {
  modality: TokenUnitModality;
  signal?: TokenUnitSignal;
}[];

type FlowVariant = 'input' | 'gear' | 'output' | 'verticalInput' | 'verticalOutput' | 'direct' | 'burstOutput' | 'burstVerticalInput' | 'burstVerticalOutput';

type MotionStyle = CSSProperties & {
  '--delay': string;
  '--travel-x'?: string;
  '--fade-x'?: string;
  '--travel-y'?: string;
  '--fade-y'?: string;
  '--flow-duration'?: string;
};

type AnimatedTokenFlowProps = {
  x: number;
  y: number;
  tokens: readonly AnimatedTokenFlowSpec[];
  variant: FlowVariant;
  size?: number;
  tone?: TokenUnitTone;
  travelX?: number;
  travelY?: number;
  durationMs?: number;
  className?: string;
};

const VARIANT_CLASS: Record<FlowVariant, string> = {
  input: styles.inputTokenFlow,
  gear: styles.gearTokenFlow,
  output: styles.outputTokenFlow,
  verticalInput: styles.verticalInputTokenFlow,
  verticalOutput: styles.verticalOutputTokenFlow,
  direct: styles.directTokenFlow,
  burstOutput: styles.burstOutputTokenFlow,
  burstVerticalInput: styles.burstVerticalInputTokenFlow,
  burstVerticalOutput: styles.burstVerticalOutputTokenFlow,
};

export function tokenFlowSpecs(
  tokens: TokenSequence,
  startDelayMs: number,
  stepMs: number,
): AnimatedTokenFlowSpec[] {
  return tokens.map(({ modality, signal = 'ordinary' }, index) => ({
    delay: `${startDelayMs + index * stepMs}ms`,
    modality,
    signal,
  }));
}

function motionStyle(delay: string, travelX = 126, travelY = 0, durationMs?: number): MotionStyle {
  return {
    '--delay': delay,
    '--travel-x': `${travelX}px`,
    '--fade-x': `${travelX + Math.sign(travelX || 1) * 14}px`,
    '--travel-y': `${travelY}px`,
    '--fade-y': `${travelY + Math.sign(travelY || 1) * 14}px`,
    ...(durationMs ? { '--flow-duration': `${durationMs}ms` } : {}),
  };
}

export function AnimatedTokenFlow({
  x,
  y,
  tokens,
  variant,
  size = 20,
  tone = 'violet',
  travelX,
  travelY,
  durationMs,
  className,
}: AnimatedTokenFlowProps) {
  return (
    <>
      {tokens.map(({ delay, modality, signal }) => (
        <g
          key={`${delay}-${modality}-${signal}`}
          className={clsx(styles.tokenFlow, VARIANT_CLASS[variant], className)}
          style={motionStyle(delay, travelX, travelY, durationMs)}
          aria-hidden="true"
        >
          <TokenUnit
            x={x}
            y={y}
            width={size}
            height={size}
            tone={tone}
            modality={modality}
            signal={signal}
          />
        </g>
      ))}
    </>
  );
}
