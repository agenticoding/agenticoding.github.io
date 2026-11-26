/**
 * What an embedder or a reranker needs to hold: the weights once, plus the
 * working set the workload has in flight.
 *
 * WHY this is arithmetic and not money: these models are self-hosted, so no card
 * publishes a cost. The figures price memory -- the one quantity every card and
 * every runtime states -- and print no price at all.
 *
 * WHY one module for two families: the arithmetic is the same. An embedder reads
 * one text per pass and a reranker reads one pair per pass; neither keeps state
 * between requests, so the second term is a working set, never a cache.
 */
import type { RetrievalModel } from './retrievalTypes.ts';

/**
 * Working set one token in flight holds, in KiB. WHY an assumption: no card
 * publishes activation memory. The value is one 4096-wide layer's residual and
 * feed-forward buffers at BF16 (residual 4096 x 2 x 2 bytes, feed-forward
 * 12288 x 2 x 2 bytes, less the buffers a fused kernel reuses). It is a ceiling
 * for a smaller base and a floor for a runtime that materialises attention
 * scores, so it rides the caption and never a row.
 */
export const ASSUME_WORKING_SET_KIB_PER_TOKEN = 32;

/**
 * What every item in flight holds, in GiB.
 *
 * WHY the product: each pass reads its own tokens and keeps nothing after it.
 * Tokens per item is the reader's lever, items in flight is the batch, and the
 * per-token cost is one ceiling for the whole table.
 */
export const workingSetGib = (
  tokensPerItem: number,
  itemsInFlight: number,
  kibPerToken = ASSUME_WORKING_SET_KIB_PER_TOKEN
): number => (tokensPerItem * itemsInFlight * kibPerToken) / (1024 * 1024);

/**
 * Memory a row needs on the machine: the weights once, plus what the workload
 * holds. Null when the weights are unpublished: an unstated checkpoint is
 * untested, never assumed to fit.
 */
export const needGib = (
  model: RetrievalModel,
  tokensPerItem: number,
  itemsInFlight: number
): number | null =>
  model.weights === null
    ? null
    : model.weights.gib + workingSetGib(tokensPerItem, itemsInFlight);

/**
 * `outOfRange` is a fit failure of its own: a 512-token reranker cannot read a
 * 2048-token pair at any batch size, so the row cannot serve the workload even
 * when its weights fit with room to spare.
 */
export type RetrievalVerdict = 'fits' | 'over' | 'untested' | 'outOfRange';

/** Whether a text or pair of this length exceeds the published input limit.
 * An unknown cap is not a failing one: the row stays testable. */
export const exceedsInputCap = (
  model: RetrievalModel,
  tokensPerItem: number
): boolean =>
  model.maxInput === null ? false : tokensPerItem > model.maxInput.tokens;

/**
 * Whether the row sits inside the machine's budget at this workload. A card that
 * publishes no weight figure is untested here, never assumed small; a card that
 * cannot read the workload is out of range, whatever the budget.
 */
export const verdictFor = (
  model: RetrievalModel,
  budgetGib: number,
  tokensPerItem: number,
  itemsInFlight: number
): RetrievalVerdict => {
  const need = needGib(model, tokensPerItem, itemsInFlight);
  if (need === null) return 'untested';
  if (exceedsInputCap(model, tokensPerItem)) return 'outOfRange';
  return need <= budgetGib ? 'fits' : 'over';
};
