/**
 * Fetches current Context Arena (contextarena.ai) long-context measurements
 * and diffs them against website/src/components/VisualElements/longContextBenchmarkData.ts.
 *
 * Usage: node scripts/fetch-context-arena.js
 *
 * The arena is a SvelteKit SPA backed by a JSON API; needle-summary returns
 * every model's per-bin pointwise scores and overall AUC metrics in one call.
 * Bin keys are the bin's upper bound ("8192"…"1048576") — the same doubling
 * grid as INDEPENDENT_BINS in the data file.
 *
 * Output per mapped row: a paste-ready `scores:` array, the `auc1m` value,
 * and a drift report (old → new) so prose that embeds numbers can be
 * reconciled after a refresh.
 */
import { benchmarkRows } from "../website/src/components/VisualElements/longContextBenchmarkData.ts";

const API = "https://contextarena.ai/api/needle-summary?needles=8";

// Row id → [arena model_slug, reasoning_mode]. Modes match each row's `mode`
// field; arena slugs follow OpenRouter naming.
const ROW_MAP = {
  "muse-spark-12": ["meta/muse-spark-1.2", "medium"],
  "gemini-37-flash": ["google/gemini-3.7-flash", "high"],
  "gpt-56-sol": ["openai/gpt-5.6-sol", "max"],
  "gpt-55": ["openai/gpt-5.5", "medium"],
  "gpt-56-terra": ["openai/gpt-5.6-terra", "max"],
  "gpt-56-luna": ["openai/gpt-5.6-luna", "max"],
  "opus-46": ["anthropic/claude-opus-4.6", "high"],
  "sonnet-5": ["anthropic/claude-sonnet-5", "max"],
  "haiku-45": ["anthropic/claude-haiku-4.5", "enabled"],
  "grok-4-6": ["x-ai/grok-4.6", "xhigh"],
  "opus-5": ["anthropic/claude-opus-5", "max"],
  "glm-5-3": ["z-ai/glm-5.3", "high"],
  "glm-53-flash": ["z-ai/glm-5.3-flash", "high"],
  "deepseek-v4-pro-0813": ["deepseek/deepseek-v4-pro-0813", "high"],
  "deepseek-v4-flash-0731": ["deepseek/deepseek-v4-flash-0731", "high"],
  "qwen-38-max": ["qwen/qwen3.8-max", "xhigh"],
  "gemini-31-pro": ["google/gemini-3.1-pro-preview", "high"],
  "kimi-k3": ["moonshotai/kimi-k3", "max"],
  "minimax-m3": ["minimax/minimax-m3", "enabled"],
  "mistral-medium-3-5": ["mistralai/mistral-medium-3.5", "high"],
  "opus-47": ["anthropic/claude-opus-4.7", "medium"],
  "laguna-s-2-1": ["poolside/laguna-s-2.1", "enabled"],
  "laguna-xs-2-1": ["poolside/laguna-xs-2.1", "enabled"],
  "grok-4-20": ["x-ai/grok-4.20", "enabled"],
};

const BINS = [8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576];

function round1(score, label) {
  if (
    typeof score !== "number" ||
    !Number.isFinite(score) ||
    score < 0 ||
    score > 1
  )
    throw new Error(
      `Expected ${label} as a 0–1 score; received ${String(score)}`,
    );
  return Math.round(score * 1000) / 10;
}

function metric(entry, bin) {
  const value = entry.bin_metrics?.[String(bin)]?.avg_score;
  return value == null ? null : round1(value, `${entry.model_slug} ${bin}`);
}

function auc(entry) {
  return round1(entry.overall_metrics?.auc_1m, `${entry.model_slug} AUC @1M`);
}

const response = await fetch(API);
if (!response.ok) throw new Error(`Arena API ${response.status}`);
const { models } = await response.json();
if (!Array.isArray(models))
  throw new Error("Arena API response is missing models[]");

const findEntry = (slug, mode) =>
  models.find(
    (m) => m.model_slug === slug && String(m.reasoning_mode) === mode,
  );

let hasDrift = false;
let hasErrors = false;
for (const [id, [slug, mode]] of Object.entries(ROW_MAP)) {
  const entry = findEntry(slug, mode);
  const row = benchmarkRows.find((r) => r.id === id);
  if (!row) {
    hasErrors = true;
    console.log(`✗ ${id}: mapping has no matching shipped row`);
  }
  if (!entry) {
    hasErrors = true;
    console.log(`✗ ${id} (${slug} / ${mode}): NOT FOUND on arena`);
    continue;
  }
  const scores = BINS.map((bin) => metric(entry, bin));
  const auc1m = auc(entry);
  const header = `${id} (${slug} / ${mode})`;
  console.log(`\n${row ? "·" : "+"} ${header}`);
  console.log(
    `  scores: [${scores.map((s) => (s === null ? "null" : s)).join(", ")}]`,
  );
  console.log(`  auc1m: ${auc1m}`);
  if (row) {
    const drift = scores
      .map((fresh, i) => {
        const current = row.points.find((p) => p.tokens === BINS[i]);
        const old = current ? current.score : null;
        return old !== fresh ? `    ${BINS[i]}: ${old} → ${fresh}` : null;
      })
      .filter(Boolean);
    if (row.auc1m !== auc1m) {
      drift.push(`    auc1m: ${row.auc1m} → ${auc1m}`);
    }
    if (drift.length) {
      hasDrift = true;
      console.log(`  DRIFT:\n${drift.join("\n")}`);
    } else {
      console.log("  (no drift)");
    }
  }
}
const mappedIds = new Set(Object.keys(ROW_MAP));
const unmappedRows = benchmarkRows.filter((row) => !mappedIds.has(row.id));
if (unmappedRows.length) {
  hasErrors = true;
  console.log(
    `✗ Unmapped shipped rows: ${unmappedRows.map((row) => row.id).join(", ")}`,
  );
}
if (hasErrors) {
  console.error("\nRefresh failed — fix missing Context Arena mappings.");
  process.exitCode = 1;
} else {
  console.log(
    hasDrift ? "\nDrift detected — reconcile prose numbers." : "\nNo drift.",
  );
}
