// Introduces the bracketed vector glyph — the same icon EmbeddingIndexDiagram
// reuses for the model's output — at the first mention of "vector". One word in,
// one vector out, so the reader has the vocabulary before the pipeline figure.

import React, { useId } from 'react';
import { ArrowMarker } from './diagramGeometry';
import { DIAGRAM_STROKE } from './diagramScale';
import { VectorGlyph } from './VectorGlyph';
import { VISUALLY_HIDDEN } from './visuallyHidden';

/** The example word the chapter's similarity story is built on. */
const WORD = 'cat';
const GLYPH_SIZE = 30;

const LAYOUT = {
  width: 240,
  height: 74,
  wordX: 32,
  glyphX: 158,
  glyphY: 17,
  arrow: { x1: 58, x2: 146, y: 32 },
  ellipsisX: 194,
  baseline: 37,
  labelY: 68,
} as const;

const ARIA_LABEL =
  'A word is encoded by an embedding model into a vector: an arrow turns the word "cat" into a bracketed column of numbers, shown as the same vector glyph the pipeline figure uses.';

type VectorGlyphIllustrationProps = {
  /** Spoken explanation the audiobook extractor reads statically; rendered only
   * as the visually-hidden figcaption. */
  narration?: string;
};

export default function VectorGlyphIllustration({
  narration,
}: VectorGlyphIllustrationProps) {
  const markerId = `vector-intro-arrow-${useId().replace(/:/g, '')}`;
  const glyphCentre = LAYOUT.glyphX + GLYPH_SIZE / 2;
  return (
    // data-audio-figure marks the DOM order the player maps figure anchors to; it
    // must sit on the one figure the extractor emits for this component. margin: 0
    // keeps the global figure spacing from moving this small inline illustration.
    <figure data-audio-figure="" style={{ margin: 0 }}>
      <svg
        viewBox={`0 0 ${LAYOUT.width} ${LAYOUT.height}`}
        width="100%"
        style={{
          maxWidth: LAYOUT.width,
          margin: '0.5rem auto',
          display: 'block',
        }}
        role="img"
        aria-label={ARIA_LABEL}
      >
        <defs>
          <ArrowMarker id={markerId} fill="var(--visual-indigo)" refX={0} />
        </defs>
        <text
          x={LAYOUT.wordX}
          y={LAYOUT.baseline}
          textAnchor="middle"
          fontFamily="var(--font-mono-keyword)"
          fontSize="13"
          fill="var(--text-heading)"
        >
          &quot;{WORD}&quot;
        </text>
        <line
          x1={LAYOUT.arrow.x1}
          y1={LAYOUT.arrow.y}
          x2={LAYOUT.arrow.x2}
          y2={LAYOUT.arrow.y}
          stroke="var(--visual-indigo)"
          strokeWidth={DIAGRAM_STROKE.default}
          markerEnd={`url(#${markerId})`}
        />
        <VectorGlyph x={LAYOUT.glyphX} y={LAYOUT.glyphY} size={GLYPH_SIZE} />
        <text
          x={LAYOUT.ellipsisX}
          y={LAYOUT.baseline}
          fontFamily="var(--font-mono-keyword)"
          fontSize="13"
          fill="var(--text-muted)"
        >
          …
        </text>
        <IllustrationLabel x={LAYOUT.wordX} y={LAYOUT.labelY}>
          text
        </IllustrationLabel>
        <IllustrationLabel x={glyphCentre} y={LAYOUT.labelY}>
          vector
        </IllustrationLabel>
      </svg>
      <figcaption style={VISUALLY_HIDDEN}>{narration ?? ARIA_LABEL}</figcaption>
    </figure>
  );
}

function IllustrationLabel({
  x,
  y,
  children,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontFamily="var(--font-mono-spec)"
      fontSize="9"
      fill="var(--text-muted)"
    >
      {children}
    </text>
  );
}
