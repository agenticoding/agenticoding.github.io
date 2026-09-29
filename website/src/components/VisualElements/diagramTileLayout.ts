import type { CSSProperties } from 'react';
import {
  DIAGRAM_GRID,
  DIAGRAM_SPACE,
  TILE_TYPE,
} from './diagramScale.ts';

export type DiagramTone =
  | 'context'
  | 'model'
  | 'system'
  | 'warning'
  | 'success'
  | 'decision'
  | 'neutral'
  | 'indigo'
  | 'violet'
  | 'cyan'
  | 'magenta';
export type DiagramVoice = 'display' | 'human' | 'ai' | 'spec' | 'keyword';

export const TILE_LAYOUT = {
  padding: DIAGRAM_SPACE.tilePadding,
} as const;

export const MODEL_CALL_FRAME_LAYOUT = {
  tabIconSize: DIAGRAM_GRID * 3,
  tabHeight: DIAGRAM_GRID * 4,
  tabGap: DIAGRAM_GRID,
  tabLabelCharWidth: DIAGRAM_GRID,
  tabPaddingX: DIAGRAM_GRID,
  framePaddingX: DIAGRAM_GRID * 2,
  titleFontSize: TILE_TYPE.title,
  detailFontSize: TILE_TYPE.detail,
} as const;

const TONE_ALIASES: Record<DiagramTone, string> = {
  context: 'indigo',
  model: 'violet',
  system: 'cyan',
  warning: 'warning',
  success: 'success',
  decision: 'violet',
  neutral: 'neutral',
  indigo: 'indigo',
  violet: 'violet',
  cyan: 'cyan',
  magenta: 'magenta',
};

export function tileToneVars(tone: DiagramTone) {
  const visual = TONE_ALIASES[tone];
  const neutral = visual === 'neutral';
  const stroke = neutral ? 'var(--border-default)' : `var(--visual-${visual})`;
  return {
    accent: neutral ? 'var(--text-muted)' : stroke,
    fill: neutral ? 'var(--surface-raised)' : `var(--visual-bg-${visual})`,
    label: neutral ? 'var(--text-muted)' : stroke,
    muted: 'var(--text-muted)',
    stroke,
    text: neutral ? 'var(--text-muted)' : stroke,
    title: 'var(--text-heading)',
  };
}

export function voiceStyle(
  voice: DiagramVoice,
  fontSize: number,
  fontWeight: number | string
): CSSProperties {
  return {
    fontFamily: `var(--font-${voiceFamily(voice)})`,
    fontSize,
    fontWeight,
    fontFeatureSettings: 'var(--font-mono-features)',
  };
}

function voiceFamily(voice: DiagramVoice) {
  if (voice === 'display') return 'display';
  if (voice === 'keyword') return 'mono-keyword';
  return `mono-${voice}`;
}

export function wrapSvgText(
  text: string,
  maxWidth: number,
  fontSize: number,
  maxLines: number
) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = words.reduce<string[]>(
    (acc, word) => addWord(acc, word, maxWidth, fontSize),
    []
  );
  return clampLines(lines, maxLines);
}

function addWord(
  lines: string[],
  word: string,
  maxWidth: number,
  fontSize: number
) {
  const next = [...lines];
  const index = next.length - 1;
  const candidate = next[index] ? `${next[index]} ${word}` : word;
  if (estimateSvgTextWidth(candidate, fontSize) <= maxWidth) {
    next[index < 0 ? 0 : index] = candidate;
    return next;
  }

  return [...next, ...splitLongWord(word, maxWidth, fontSize)];
}

function splitLongWord(word: string, maxWidth: number, fontSize: number) {
  const charactersPerLine = Math.max(
    1,
    Math.floor(maxWidth / (fontSize * 0.6))
  );
  const chunks: string[] = [];
  for (let index = 0; index < word.length; index += charactersPerLine) {
    chunks.push(word.slice(index, index + charactersPerLine));
  }
  return chunks;
}

function clampLines(lines: string[], maxLines: number) {
  if (lines.length <= maxLines) return lines;
  return [...lines.slice(0, maxLines - 1), lines.slice(maxLines - 1).join(' ')];
}

function estimateSvgTextWidth(text: string, fontSize: number) {
  return text.length * fontSize * 0.6;
}
