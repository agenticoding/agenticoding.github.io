import type { BenchmarkRow } from './longContextBenchmarkData';

/** The card fields needed to locate a measured row for a model card. */
export type ModelCardBenchmarkRef = {
  benchmarkId: string;
  provider: string;
  name: string;
};

/**
 * Resolve the measured benchmark row for a model card, best-effort. Cards are
 * built for models that may not have a row in the measured table (the two data
 * sets drift independently), and row ids are rebuilt from the live Arena feed.
 * So try the exact id first, then fall back to a provider-scoped name match,
 * and return null when there is genuinely no measurement. A card never crashes
 * on a missing row; callers render a neutral state instead.
 */
export function resolveBenchmarkRow(
  ref: ModelCardBenchmarkRef,
  rows: readonly BenchmarkRow[]
): BenchmarkRow | null {
  const byId = rows.find((row) => row.id === ref.benchmarkId);
  if (byId) return byId;
  const providerRows = rows.filter((row) => row.vendor === ref.provider);
  if (providerRows.length === 0) return null;
  const name = ref.name.toLowerCase();
  // Name containment handles suffix/build renames (e.g. "DeepSeek V4 Pro"
  // → "DeepSeek V4 Pro (0813)") without hardcoding the exact table id.
  return (
    providerRows.find((row) => row.model.toLowerCase().includes(name)) ??
    providerRows.find((row) => name.includes(row.model.toLowerCase())) ??
    null
  );
}
