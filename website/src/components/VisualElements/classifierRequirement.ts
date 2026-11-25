/**
 * What a classifier needs to hold: the weights once, plus the cache the
 * workload keeps alive.
 *
 * WHY this is arithmetic and not money: a classifier is self-hosted, so no card
 * publishes a cost. The figure prices memory -- the one quantity every card and
 * every runtime states -- and prints no price at all.
 *
 * The assumed per-token cache is the page's one invented number, and the
 * caption states it.
 */
import type { ClassifierModel } from './classifierTypes.ts';

/**
 * Cache one state token holds, in KiB. WHY an assumption: no classifier card
 * publishes a KV shape, and the size is fixed by the base checkpoint's layers
 * and attention heads, which the card rarely lists. The value is the exact
 * shape of a 27B dense BF16 checkpoint (64 layers x 8 KV heads x 128 head_dim x
 * 2 for K and V x 2 bytes) and it rides the caption, never a bar. A smaller
 * base holds less, so this is a ceiling and the page says so.
 */
export const ASSUME_CACHE_KIB_PER_TOKEN = 256;

/**
 * Cache every decision in flight holds, in GiB.
 *
 * WHY no model: the assumed per-token shape is one ceiling for the whole table,
 * so the workload's cache is the same quantity for every row and for the panel
 * that draws it beside the levers.
 */
export const cacheGib = (
  stateTokens: number,
  decisions: number,
  kibPerToken = ASSUME_CACHE_KIB_PER_TOKEN
): number => (stateTokens * decisions * kibPerToken) / (1024 * 1024);

/**
 * Memory a row needs on the machine: the weights once, plus the cache every
 * decision in flight holds. Null when the weights are unpublished: an unstated
 * checkpoint is untested, never assumed to fit.
 */
export const needGib = (
  model: ClassifierModel,
  stateTokens: number,
  decisions: number
): number | null =>
  model.weights === null
    ? null
    : model.weights.gib + cacheGib(stateTokens, decisions);

export type ClassifierVerdict = 'fits' | 'over' | 'untested';

/**
 * Whether the checkpoint's weights alone sit inside the budget: the floor a row
 * fails on before the workload is counted. Null when no source publishes one.
 */
export const weightsFit = (
  model: ClassifierModel,
  budgetGib: number
): boolean | null =>
  model.weights === null ? null : model.weights.gib <= budgetGib;

/**
 * Whether the row sits inside the machine's budget at this workload. A card
 * that publishes no weight figure is untested here, never assumed small.
 */
export const verdictFor = (
  model: ClassifierModel,
  budgetGib: number,
  stateTokens: number,
  decisions: number
): ClassifierVerdict => {
  const need = needGib(model, stateTokens, decisions);
  return need === null ? 'untested' : need <= budgetGib ? 'fits' : 'over';
};

/**
 * Whether the state itself exceeds the published input limit. Null when no
 * source publishes a limit: an unknown cap is not a passing one.
 *
 * WHY the state alone: it is the quantity the workload lever sets and the cache
 * follows. A question's own text is a transport fact, not part of the fit.
 */
export const overInputCap = (
  model: ClassifierModel,
  stateTokens: number
): boolean | null => {
  if (model.maxInput === null) return null;
  return stateTokens > model.maxInput.tokens;
};
