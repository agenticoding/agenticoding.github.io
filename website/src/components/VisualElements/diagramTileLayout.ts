import type { CSSProperties } from 'react';

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

export const TILE_GRID = 8;
export const TILE_LAYOUT = {
  padding: TILE_GRID * 2,
  iconGap: 14,
  detailLineGap: 14,
  dividerGap: 12,
  iconSize: { desktop: 40, mobile: 32, compact: 24 },
} as const;

export const MODEL_CALL_FRAME_LAYOUT = {
  tabIconSize: TILE_GRID * 3,
  tabHeight: TILE_GRID * 4,
  tabGap: TILE_GRID,
  tabLabelCharWidth: TILE_GRID,
  tabPaddingX: TILE_GRID,
  framePaddingX: TILE_GRID * 2,
  titleFontSize: 13,
  detailFontSize: 11,
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
