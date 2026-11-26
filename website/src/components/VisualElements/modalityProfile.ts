/**
 * The channels a checkpoint takes and emits. One vocabulary for the guide's
 * Modality column, the generated dataset, and every figure that draws a flow.
 *
 * WHY not `TokenUnitModality`: `code` and `generic` are token kinds, not
 * channels a device captures. A modality flow that could carry them would let a
 * model claim "code input".
 */
import type { TokenExample } from './TokenTypeIllustration';
import type { TokenUnitModality, TokenUnitSignal } from './TokenUnit';

/** Canonical order: cells sort hand-written rows, so `image+text` cannot drift. */
export const MODEL_MODALITIES = ['text', 'image', 'audio', 'video'] as const;

export type ModelModality = (typeof MODEL_MODALITIES)[number];

/**
 * What a flow ends in: a channel a device receives, or the value a model that
 * emits no text returns. A sink is never an input channel — a card cannot be fed
 * a label, a vector, or a score any more than it can be fed a decision.
 *
 * WHY three: the guide draws three such models. A classifier returns a `label`,
 * an embedder a `vector`, a reranker a `score`.
 */
export type ModalitySink = 'label' | 'vector' | 'score';

export type ModalityOutput = ModelModality | ModalitySink;

/** The flows' sinks, in the order the guide meets them. */
export const MODALITY_SINKS = ['label', 'vector', 'score'] as const;

/** Narrowing for the drawing: a sink is a box, a channel is a token. */
export const isSink = (value: ModalityOutput): value is ModalitySink =>
  (MODALITY_SINKS as readonly string[]).includes(value);

/** A checkpoint's documented channels: a chat model's output is a channel. */
export type ModalityProfile = {
  input: readonly ModelModality[];
  output: readonly ModelModality[];
};

/** What any figure draws: the same flow, whose sink may be a returned value. */
export type FlowProfile = {
  input: readonly ModelModality[];
  output: readonly ModalityOutput[];
};

/** Keeps the book's signal convention: video is compressed, code is salient. */
export const modalitySignal = (modality: TokenUnitModality): TokenUnitSignal =>
  modality === 'code'
    ? 'salient'
    : modality === 'video'
      ? 'compressed'
      : 'ordinary';

export const modalityTokens = (
  modalities: readonly TokenUnitModality[]
): readonly TokenExample[] =>
  modalities.map((modality) => ({
    modality,
    signal: modalitySignal(modality),
    label: modality === 'code' ? 'call' : modality,
  }));

const joinWords = (modalities: readonly ModalityOutput[]): string => {
  const words = [...modalities];
  const joined =
    words.length <= 1
      ? words.join('')
      : words.length === 2
        ? `${words[0]} and ${words[1]}`
        : // The book's prose takes the serial comma: `text, image, and audio`.
          `${words.slice(0, -1).join(', ')}, and ${words.at(-1)}`;
  // Sentence case: the first channel opens the phrase, the rest stay channels.
  return joined ? joined[0].toUpperCase() + joined.slice(1) : joined;
};

/** The one word form of a flow, for an aria label and a detail row. */
export const modalitySentence = (profile: FlowProfile): string =>
  `${joinWords(profile.input)} input; ${joinWords(profile.output).toLowerCase()} output`;

/** Machine form for the table's own contract: `in:text+image;out:text`. */
export const modalityFlowCode = (profile: FlowProfile): string =>
  `in:${profile.input.join('+')};out:${profile.output.join('+')}`;
