#!/usr/bin/env node
/**
 * Generates website/src/generated/open-weight-fit.json from
 * open-weight-models-nov-2026.md.
 *
 * WHY: the markdown guide is the single source of truth for every number the
 * fit page shows. Hand-copying rows into TS invites silent drift, so the page's
 * dataset is derived and never edited. The extractor throws on any row it
 * cannot fully parse instead of emitting a partial fact.
 *
 * WHAT: the JSON is facts only — no copy, colour, or layout. Engine labels,
 * groups, and platform support come from the guide's own engine tables, so the
 * page can render whatever the guide publishes.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { guideTables } from "./lib/guide-tables.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const sourcePath = path.join(repo, "open-weight-models-nov-2026.md");
const outPath = path.join(
  repo,
  "website",
  "src",
  "generated",
  "open-weight-fit.json",
);

const md = fs.readFileSync(sourcePath, "utf8");
const lines = md.split("\n");

const fail = (message) => {
  throw new Error(`extract-open-weight-fit: ${message}`);
};

const { cells, plain, firstUrl, refs, tableRowsUnder, isSeparator } =
  guideTables(md, fail);

// Display names carry aliases ("Mistral Large 4 (\"Le Chonk\")") that the fit
// table omits. Strip the quoted alias so both tables join on the same key.
const modelKey = (text) => text.replace(/\s*\("[^"]*"\)/g, "").trim();

const slug = (text) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// One vocabulary for both sides of the flow. Order is canonical: it sorts any
// hand-written cell, so `image+text` and `text+image` cannot drift apart.
const MODALITIES = ["text", "image", "audio", "video"];

/** `text+image → text` reads as input channels become output channels. */
const parseModality = (cell, context) => {
  const flow = /^([a-z+]+)\s*→\s*([a-z+]+)$/.exec(plain(cell));
  if (!flow) fail(`unparsed modality "${cell}" (${context})`);
  const side = (text, label) => {
    const named = text.split("+");
    if (new Set(named).size !== named.length)
      fail(`repeated ${label} modality "${text}" (${context})`);
    for (const item of named)
      if (!MODALITIES.includes(item))
        fail(`unknown ${label} modality "${item}" (${context})`);
    return MODALITIES.filter((modality) => named.includes(modality));
  };
  const input = side(flow[1], "input");
  const output = side(flow[2], "output");
  // Every checkpoint in this catalog accepts and emits text; a card that says
  // otherwise would be a different kind of model, not a modality edit.
  if (!input.includes("text") || !output.includes("text"))
    fail(`modality flow carries no text channel (${context})`);
  return { input, output };
};

// ---------------------------------------------------------------- country tables
const COUNTRY_HEADINGS = [
  ["## United States", "United States"],
  ["## China", "China"],
  ["## France", "France"],
];

const catalog = new Map();
for (const [heading, country] of COUNTRY_HEADINGS) {
  const rows = tableRowsUnder(heading);
  if (!rows.length) fail(`no rows under "${heading}"`);
  for (const row of rows) {
    if (row.length !== 11)
      fail(`${country} row has ${row.length} cells: ${row[1]}`);
    const [
      lab,
      model,
      runtimeMemory,
      maxContext,
      speed,
      license,
      engines,
      params,
      modality,
      checkpoint,
      links,
    ] = row;
    const name = plain(model);
    const key = modelKey(name);
    if (catalog.has(key)) fail(`duplicate model "${name}"`);
    catalog.set(key, {
      id: slug(name),
      name,
      lab: plain(lab),
      country,
      runtimeMemory: plain(runtimeMemory),
      contextCap: plain(maxContext),
      speedNote: plain(speed),
      license: plain(license),
      enginesListed: plain(engines),
      params: plain(params),
      modalities: parseModality(modality, name),
      checkpoint: plain(checkpoint),
      cardUrl: firstUrl(links),
    });
  }
}

// ---------------------------------------------------------------- engine catalog
// Longest first so "TensorRT-LLM" never resolves to a shorter neighbour.
const ENGINE_MATCHERS = [
  [/TensorRT-LLM/i, "trtllm"],
  [/TokenSpeed/i, "tokenspeed"],
  [/KTransformers/i, "ktransformers"],
  [/DeepInfer/i, "deepinfer"],
  [/PulsarMLX/i, "pulsarmlx"],
  [/DwarfStar/i, "dwarfstar"],
  [/ExecuTorch/i, "executorch"],
  // Negative lookbehind: "KTransformers" is not the Transformers runtime. Without
  // it the substring adds a `transformers` join to every KTransformers row.
  [/(?<!K)Transformers/i, "transformers"],
  [/llama\.cpp/i, "llamacpp"],
  [/Ollama/i, "ollama"],
  [/SGLang/i, "sglang"],
  [/vLLM/i, "vllm"],
  [/\bMLX\b/i, "mlx"],
  [/\bATOM\b/i, "atom"],
  [/\bDocker\b/i, "docker"],
  [/Colibr/i, "colibri"],
  [/ljqinfer/i, "ljqinfer"],
  [/\bDelta\b/i, "delta"],
  [/\bPulsar\b/i, "pulsar"],
  [/\bWARP\b/i, "warp"],
  [/\bgr8\b/i, "gr8"],
];

const engineIdsIn = (text) => {
  const found = new Set();
  for (const [pattern, id] of ENGINE_MATCHERS) {
    if (pattern.test(text)) found.add(id);
  }
  return [...found];
};

const engineIdIn = (text) => {
  const match = ENGINE_MATCHERS.find(([pattern]) => pattern.test(text));
  if (!match) fail(`unmapped engine name "${text}"`);
  return match[1];
};

// Engine tables: the general table publishes one column per accelerator family,
// the specialized table states hardware reach in prose. Both are authoritative.
const PLATFORM_COLUMNS = ["nvidia", "amd", "apple"];
const PLATFORM_WORDS = [
  ["nvidia", /\b(CUDA|NVIDIA|Nvidia|DGX|A100|A800|SM100|Blackwell)\b/],
  ["amd", /\b(ROCm|AMD|Instinct)\b/],
  ["apple", /\b(Metal|Apple Silicon|macOS|MPS)\b/],
];
/** The guide marks "no support" with an em dash. */
const isSupportedCell = (cell) => Boolean(cell.trim()) && cell.trim() !== "—";

const ENGINE_TABLES = [
  ["## Inference engines — Nov 2026", "general"],
  [
    "### Specialized local / consumer engines (narrow model range)",
    "specialized",
  ],
];

const engineCatalog = [];
const seenEngines = new Set();
for (const [heading, group] of ENGINE_TABLES) {
  const rows = tableRowsUnder(heading).filter((row) => row[0] !== "Engine");
  if (!rows.length) fail(`no engine rows under "${heading}"`);
  for (const row of rows) {
    // Labels drop the repo alias, e.g. "WARP (`sqliteai/warp`)".
    const label = row[0].replace(/\s*\([^)]*\)\s*$/, "").trim();
    const id = engineIdIn(label);
    if (seenEngines.has(id)) fail(`duplicate engine "${label}"`);
    const platforms =
      group === "general"
        ? PLATFORM_COLUMNS.filter((_, offset) =>
            isSupportedCell(row[4 + offset]),
          )
        : PLATFORM_WORDS.filter(([, pattern]) => pattern.test(row[2])).map(
            ([key]) => key,
          );
    if (!platforms.length) fail(`engine "${label}" has no supported platform`);
    seenEngines.add(id);
    engineCatalog.push({ id, label, group, platforms });
  }
}

// Runtimes the guide names in prose only. ExecuTorch is the measured Mac path
// for Muse Glimmer; PulsarMLX has a row in the specialized table.
const EXTRA_ENGINES = [["executorch", "ExecuTorch", "general", ["apple"]]];
for (const [id, label, group, platforms] of EXTRA_ENGINES) {
  if (seenEngines.has(id)) fail(`duplicate engine "${label}"`);
  seenEngines.add(id);
  engineCatalog.push({ id, label, group, platforms });
}

// Guard the id table against the guide: a matcher without a row (or the reverse)
// would silently drop an engine from the picker.
for (const [, id] of ENGINE_MATCHERS) {
  if (!seenEngines.has(id)) fail(`engine id "${id}" has no row in the guide`);
}

// ---------------------------------------------------------------- specialized coverage
// The specialized table names model families, not checkpoints ("Selected DeepSeek
// V4, GLM-5.x, and Qwen checkpoints"), so coverage is the guide's own range, kept
// apart from the country table's per-checkpoint Engines column.
//
// WHY exact names, not prefixes: each of these docs enumerates checkpoints, and a
// prefix silently claims the siblings the doc never lists — `Qwen` reached two
// checkpoints ds4 never names, `Kimi` reached a K3 that has no architecture. A
// name that misreads is visible; a prefix that over-matches is not. `absent`
// records a checkpoint a doc serves but this dataset has no row for, so a chip
// that covers nothing says why instead of rendering empty.
const SPECIALIZED_COVERAGE = [
  [
    "dwarfstar",
    ["DeepSeek V4.1 Flash 1017", "DeepSeek V4 Pro", "GLM-5.3", "GLM-5.3 Flash"],
  ],
  // WARP names a 552B backbone, never the 1017 revision: the join is the closest
  // checkpoint, not a claim about the exact artifact.
  ["warp", ["Kimi K3", "DeepSeek V4.1 Flash 1017", "GLM-5.3 Flash"]],
  ["gr8", ["GLM-5.3", "GLM-5.3 Flash", "DeepSeek V4.1 Flash 1017"]],
  ["delta", ["DeepSeek V4.1 Flash 1017"]],
  // The docs enumerate eleven checkpoints; only five have a row here. GLM-5.2,
  // DeepSeek V4-Flash and Kimi K2.7 have no row, and `Kimi`/`DeepSeek` prefixes
  // used to claim K3 and V4 Pro, which the docs do not serve.
  [
    "pulsar",
    [
      "Hunyuan Hy3",
      "Gemma 4 26B-A4B",
      "gpt-oss-20b",
      "Laguna S 2.1",
      "Qwen3.6-35B-A3B",
      "MiniMax M3.1 Flash",
    ],
  ],
  ["colibri", [], ["GLM-5.2"]],
  ["ljqinfer", ["GLM-5.3", "Qwen3.8-27B", "DeepSeek V4.1 Flash 1017"]],
  ["pulsarmlx", ["GLM-5.3 Flash"]],
];

const specializedIdsFor = (name) =>
  SPECIALIZED_COVERAGE.filter(([, names]) => names.includes(name)).map(
    ([id]) => id,
  );

// ---------------------------------------------------------------- hardware catalog
// Node/tray counts the guide's recipes actually use, plus the 8-GPU node default.
const DEVICES = [1, 2, 4, 8, 16, 32];

// [id, label, family, screen GiB, printed GB, counts?]. Printed capacity is the
// number the box carries; the screen figure is the guide's planning budget for
// it. `counts` narrows a family's fan-out to the SKUs the guide's readers
// actually pair.
const PER_DEVICE = [
  ["rtx4090", "RTX 4090", "workstation", 22, 24],
  ["rtx5090", "RTX 5090", "workstation", 30, 32, [1, 2, 4]],
  ["rtx-pro-5000", "RTX PRO 5000", "workstation", 46, 48],
  ["rtx-pro-6000", "RTX PRO 6000", "workstation", 94, 96],
  ["rtx3090", "RTX 3090", "workstation", 22, 24],
  ["rtx5060ti", "RTX 5060 Ti", "workstation", 14, 16],
  ["rtx3060", "RTX 3060", "workstation", 10, 12],
  ["spark", "DGX Spark", "spark", 107, 128],
  ["h100", "H100 80 GB", "datacenter", 70, 80],
  ["h200", "H200 141 GB", "datacenter", 125, 141],
  ["b200", "B200", "datacenter", 160, 180],
  ["gb200", "GB200", "datacenter", 160, 180],
  ["b300", "B300", "datacenter", 230, 262.5],
  ["gb300", "GB300", "datacenter", 230, 262.5],
  ["rx7900xtx", "RX 7900 XTX 24 GB", "amd", 22, 24],
  ["rx9070", "RX 9070 16 GB", "amd", 14, 16],
  ["apple-m4-32", "M4 32 GB", "apple", 24, 32],
  ["apple-m5-pro-64", "M5 Pro 64 GB", "apple", 56, 64],
  ["apple-m4-max", "M4 Max 128 GB", "apple", 115.2, 128],
  ["apple-m5-max-128", "M5 Max 128 GB", "apple", 115.2, 128],
  ["apple-m1-ultra-128", "M1 Ultra 128 GB", "apple", 115.2, 128],
  ["apple-m3-ultra-512", "M3 Ultra 512 GB", "apple", 460.8, 512],
  ["apple-m5-ultra-512", "M5 Ultra 512 GB", "apple", 460.8, 512],
];

// Node capacities the guide publishes for the B200 and B300 trays. The page
// keeps the box's label convention (a printed "24 GB" card screens at 22 GiB), so
// the per-device share is the node figure divided by its eight GPUs, in the same
// unit the rest of the catalog uses.
const NODE_CAPACITY = ["1,440 GB", "2.1 TB"];
for (const claim of NODE_CAPACITY)
  if (!md.includes(claim)) fail(`guide no longer publishes ${claim}`);

// Published specs the SKU labels and the guide's platform prose carry. Each
// literal below restates a claim in the guide, so the guards fail the build when
// the prose disappears and the catalog cannot drift from its source.
const UNIFIED_BY_FAMILY = { spark: true, apple: true };
const UNIFIED_PROSE = {
  spark: /unified-memory SKU/,
  apple: /unified pool/,
};
for (const [family, pattern] of Object.entries(UNIFIED_PROSE)) {
  if (!pattern.test(md))
    fail(`guide no longer calls "${family}" unified memory`);
}

const BANDWIDTH_GBS = { spark: 273, "apple-m4-max": 546 };
for (const [id, value] of Object.entries(BANDWIDTH_GBS)) {
  if (!md.includes(`${value} GB/s`))
    fail(`guide no longer publishes ${value} GB/s for "${id}"`);
}

const INTERCONNECT = {
  spark: "ConnectX-7",
  "apple-m5-max-128-2": "Thunderbolt 5",
  "apple-m5-ultra-512-2": "Thunderbolt 5",
};
for (const link of Object.values(INTERCONNECT)) {
  if (!md.includes(link)) fail(`guide no longer names ${link}`);
}

// The two SKUs the guide names but never sizes: the printed capacity comes from
// the vendor's product page (checked 2026-11-20), not from the guide's prose.
const VENDOR_PRINTED = { mi355x: 288, mi350x: 288 };

// The reserve the guide itself states for the machines it screens: a workstation
// card gives up 2 GiB (24→22, 32→30, 48→46, 96→94), a Mac 8 GiB up to a 64 GB
// pool and a tenth above, a Spark 21, a node 10–32.5. Where the guide screens
// nothing, this rule stands in: a small card keeps 2 GiB, a larger pool a tenth.
if (!md.includes("22/30/46/94 GiB"))
  fail("guide no longer screens the RTX cards at 22/30/46/94 GiB");
if (!md.includes("10/14/22 GiB"))
  fail("guide no longer screens the small cards at 10/14/22 GiB");
if (!md.includes("22/14 GiB"))
  fail("guide no longer screens the Radeon cards at 22/14 GiB");
if (!md.includes("24/56/115.2/460.8 GiB"))
  fail("guide no longer screens the Mac pools at 24/56/115.2/460.8 GiB");
if (!md.includes("illustrative 12 GiB system reserve"))
  fail("guide no longer names the 12 GiB system reserve");
const reserveFor = (capacity) =>
  capacity <= 32 ? 2 : Math.round(capacity * 10) / 100;

// One short caveat, only where the track cannot state the fact itself: the
// track prints capacity, reserve, and the unified flag, so a screened single
// device needs no extra words.
const AGGREGATE_CAVEAT =
  "Devices × memory is an aggregate, not a placement proof.";
const UNSIZED_CAVEAT = "The guide publishes no memory figure here.";

// Accelerator families, in picker order. `vendor` is the platform key the
// engine tables use, so support checks need no per-engine hardware table.
const FAMILIES = [
  ["workstation", "Workstation", "nvidia"],
  ["spark", "DGX Spark", "nvidia"],
  ["datacenter", "NVIDIA node", "nvidia"],
  ["amd", "AMD", "amd"],
  ["apple", "Apple Silicon", "apple"],
];

// ---------------------------------------------------------------- host memory
// The accelerator budget is not the whole machine: a streamed layout holds its
// floor in system RAM, so only a published system-memory figure can test it.
const toGib = (text, context) => {
  const match = /^([\d.]+)\s*(TiB|TB|GiB|GB)$/.exec(text.trim());
  if (!match) fail(`unparsed memory "${text}" (${context})`);
  const factor = { TiB: 1024, GiB: 1, TB: 1e12 / 2 ** 30, GB: 1e9 / 2 ** 30 };
  return Math.round(Number(match[1]) * factor[match[2]] * 10) / 10;
};

const SKU_TO_DEVICE = {
  "RTX 4090": "rtx4090",
  "RTX 5090": "rtx5090",
  "RTX PRO 5000": "rtx-pro-5000",
  "RTX PRO 6000": "rtx-pro-6000",
  Spark: "spark",
  H100: "h100",
  H200: "h200",
  B200: "b200",
  GB200: "gb200",
  B300: "b300",
  GB300: "gb300",
};

const HOST_HEADING = "### System memory for screened server targets";
const hostRows = tableRowsUnder(HOST_HEADING);
if (!hostRows.length) fail("host-memory table is empty");
const HOST_GIB = new Map();
for (const row of hostRows) {
  if (row.length !== 3)
    fail(`host-memory row has ${row.length} cells: ${row[0]}`);
  const [targetCell, memoryCell, sourceCell] = row;
  const baseId = SKU_TO_DEVICE[plain(targetCell)];
  if (!baseId) fail(`host-memory target "${plain(targetCell)}" is not a SKU`);
  if (!firstUrl(sourceCell))
    fail(`host-memory row "${targetCell}" has no source`);
  HOST_GIB.set(baseId, toGib(memoryCell.split(",")[0], targetCell));
}

/** A multi-device id ends with its own count; base ids keep their own digits. */
const baseIdFor = (id, devices) =>
  devices > 1 && id.endsWith(`-${devices}`)
    ? id.slice(0, -(String(devices).length + 1))
    : id;

/** System memory for a target: the published figure times its trays. */
const hostGibFor = (id, devices) => {
  const base = baseIdFor(id, devices);
  const tray = HOST_GIB.get(base);
  if (tray === undefined) return null;
  return tray * Math.max(1, Math.ceil(devices / 8));
};

// Single factory: every spec field is derived per SKU, so no entry can ship with
// a field forgotten. The reserve is what the machine keeps for itself: exactly
// what the guide's own screen figure gives up, else the platform's rule.
const hardwareEntry = (row) => {
  const unified = UNIFIED_BY_FAMILY[row.family] ?? false;
  const base = baseIdFor(row.id, row.devices);
  return {
    ...row,
    unified,
    reserveGib:
      row.screenGib === null
        ? reserveFor(row.nominalGib)
        : Math.round((row.nominalGib - row.screenGib) * 10) / 10,
    bandwidthGBs: BANDWIDTH_GBS[row.id] ?? BANDWIDTH_GBS[base] ?? null,
    interconnect: INTERCONNECT[row.id] ?? INTERCONNECT[base] ?? null,
    hostGib: hostGibFor(row.id, row.devices),
  };
};

// Multi-device counts the guide's recipes use. Spark clusters are documented at
// one, two, and four boxes; a workstation fans out only where PER_DEVICE says so.
const DEVICE_COUNTS = { datacenter: DEVICES, spark: [1, 2, 4] };

const hardware = [];
for (const row of PER_DEVICE) {
  const [id, label, family, screen, nominal] = row;
  const counts = row[5] ?? DEVICE_COUNTS[family] ?? [1];
  for (const devices of counts) {
    hardware.push(
      hardwareEntry({
        id: devices === 1 ? id : `${id}-${devices}`,
        label: devices === 1 ? label : `${devices}× ${label}`,
        family,
        devices,
        screenGib: screen * devices,
        nominalGib: nominal * devices,
        caveat: devices > 1 ? AGGREGATE_CAVEAT : null,
      }),
    );
  }
}

// Runs the guide reports but does not screen: measured evidence only.
const EVIDENCE_ONLY = [
  ["mi355x", "MI355X", "amd"],
  ["mi350x", "MI350X", "amd"],
];
const seenFamilies = new Set(FAMILIES.map(([id]) => id));

for (const [id, label, family] of EVIDENCE_ONLY) {
  hardware.push(
    hardwareEntry({
      id,
      label,
      family,
      devices: 1,
      screenGib: null,
      nominalGib: VENDOR_PRINTED[id] ?? 0,
      caveat: UNSIZED_CAVEAT,
    }),
  );
}

// Two-Mac paths the guide documents: DwarfStar RDMA and Meta's MLX/JACCL run.
// Each Mac keeps its own pool and its own reserve, so the pair screens at twice
// the single machine's budget and carries the aggregate caveat.
for (const base of ["apple-m5-max-128", "apple-m5-ultra-512"]) {
  const single = hardware.find((entry) => entry.id === base);
  if (!single || single.screenGib === null)
    fail(`no screened single-device target for "${base}"`);
  hardware.push(
    hardwareEntry({
      id: `${base}-2`,
      label: `2× ${single.label}`,
      family: "apple",
      devices: 2,
      screenGib: single.screenGib * 2,
      nominalGib: single.nominalGib * 2,
      caveat: AGGREGATE_CAVEAT,
    }),
  );
}

for (const entry of hardware) {
  if (!seenFamilies.has(entry.family))
    fail(`hardware family "${entry.family}"`);
  // A track with no width and no reserve would draw a slider that measures nothing.
  if (!(entry.nominalGib > 0)) fail(`hardware "${entry.id}" has no capacity`);
  if (!(entry.reserveGib > 0 && entry.reserveGib < entry.nominalGib))
    fail(`hardware "${entry.id}" reserves nothing`);
}

const RECIPE_HOST_ENGINES = [
  ["recipes.vllm.ai", "vllm"],
  ["github.com/vllm-project", "vllm"],
  ["docs.sglang.io", "sglang"],
  ["github.com/sgl-project", "sglang"],
];

const engineIdFromRecipeHost = (url) => {
  if (!url) return undefined;
  return RECIPE_HOST_ENGINES.find(([host]) => url.includes(host))?.[1];
};

// ---------------------------------------------------------------- fit table
const FIT_HEADING = "## Hardware fit — 64K to native maximum";
const fitRows = tableRowsUnder(FIT_HEADING);
if (!fitRows.length) fail("fit table is empty");

const parseGiB = (text, context) => {
  const match = /^([\d,.]+)\s*(\+)?/.exec(text.trim());
  if (!match) fail(`no GiB number in "${text}" (${context})`);
  return {
    gib: Number(match[1].replace(/,/g, "")),
    subtotal: Boolean(match[2]),
  };
};

const parseTokens = (text, context) => {
  const k = /^([\d.]+)\s*K$/.exec(text.trim());
  if (k) return Math.round(Number(k[1]) * 1024);
  const m = /^([\d.]+)\s*M$/.exec(text.trim());
  if (m) return Math.round(Number(m[1]) * 1024 * 1024);
  const digits = /^([\d,]+)$/.exec(text.trim());
  if (digits) return Number(digits[1].replace(/,/g, ""));
  fail(`no context tokens in "${text}" (${context})`);
};

// The guide suffixes a candidate with its evidence word. The page is a
// calculator, so the suffix only marks where a candidate ends and never travels.
const parseCandidates = (text, context) =>
  text.split("→").map((step) => {
    const cleaned = step.replace(/\([^)]*\)/g, "").trim();
    const match = /^(?:(\d+)×)?\s*(.+?)\s+(est|cfg|validated|check)$/.exec(
      cleaned,
    );
    if (!match) fail(`unparsed candidate "${cleaned}" (${context})`);
    const deviceId = SKU_TO_DEVICE[match[2]];
    if (!deviceId) fail(`unknown device "${match[2]}" (${context})`);
    return { deviceId, devices: Number(match[1] ?? 1) };
  });

const models = [];
for (const row of fitRows) {
  if (row.length !== 4) fail(`fit row has ${row.length} cells: ${row[0]}`);
  const [modelCell, need64kCell, nativeCell, candidatesCell] = row;
  const [rawName, ...pathParts] = plain(modelCell).split(" · ");
  const name = rawName.trim();
  const entry = catalog.get(modelKey(name));
  if (!entry) fail(`fit row "${name}" has no country-table row`);
  const pathLabel = pathParts.join(" · ").trim();
  if (!pathLabel) fail(`fit row "${name}" has no reference path`);

  // A few paths name only the quant ("Blackwell NVFP4 + DSpark"). The cited
  // recipe host then carries the engine, so read it from there instead of
  // guessing.
  const { cardUrl, ...facts } = entry;
  const sourceUrl = firstUrl(modelCell) ?? cardUrl;
  const pathEngineId =
    engineIdsIn(pathLabel)[0] ?? engineIdFromRecipeHost(sourceUrl);
  if (!pathEngineId) fail(`no engine in path "${pathLabel}"`);

  const [nativeContext, nativeGiBText] = nativeCell.split(" · ");
  if (!nativeGiBText) fail(`native cell unparsed: "${nativeCell}" (${name})`);

  // One home per fact: the country table's cell wins, coverage adds the rest.
  const engineIds = engineIdsIn(entry.enginesListed);

  models.push({
    ...facts,
    sourceUrl,
    pathLabel,
    pathEngineId,
    engineIds,
    specializedIds: specializedIdsFor(name).filter(
      (id) => !engineIds.includes(id),
    ),
    // Streamed layouts and runtime configurations are parsed after this loop:
    // both join on the model name.
    layouts: [],
    configs: [],
    need64k: parseGiB(need64kCell, name),
    needNative: parseGiB(nativeGiBText, name),
    nativeContext: nativeContext.trim(),
    nativeTokens: parseTokens(nativeContext, name),
    candidates: parseCandidates(candidatesCell, name),
  });
}

const missing = [...catalog.keys()].filter(
  (key) => !models.some((model) => modelKey(model.name) === key),
);
if (missing.length) fail(`models without a fit row: ${missing.join(", ")}`);

// Guard the coverage table: an unknown engine, or a name that is not a
// checkpoint, would silently narrow a runtime's chip to the wrong models. An
// `absent` name that becomes a checkpoint must fail too, so a runtime can never
// stay declared-uncovered after its row lands.
for (const [engineId, names, absent = []] of SPECIALIZED_COVERAGE) {
  if (!seenEngines.has(engineId)) fail(`coverage names engine "${engineId}"`);
  for (const name of names)
    if (!models.some((model) => model.name === name))
      fail(`coverage names "${name}", which is not a checkpoint`);
  for (const name of absent)
    if (models.some((model) => model.name === name))
      fail(`"${name}" is now a checkpoint: give ${engineId} its coverage`);
}

// ---------------------------------------------------------------- streamed layouts
// A streamed layout is a second, non-resident path for one checkpoint on one
// runtime. Its figure is the memory that layout holds, never a resident fit, so
// it carries its own context, storage tier, and the source's decode rate.
const STREAMED_HEADING = "### Streamed layouts — host RAM and SSD";
const streamedRows = tableRowsUnder(STREAMED_HEADING);
if (!streamedRows.length) fail("streamed-layouts table is empty");
const supportsEngine = (model, engineId) =>
  model.engineIds.includes(engineId) || model.specializedIds.includes(engineId);
const parseDevices = (text, context) => {
  const value = Number(text.trim());
  if (!Number.isInteger(value) || value < 1)
    fail(`no device count in "${text}" (${context})`);
  return value;
};
const parseOptionalTokens = (text, context) =>
  text === "—" ? null : parseTokens(text, context);
/** The configuration table's header states GiB, so a bare number is GiB. */
const toHeld = (text, context) =>
  /^[\d.]+$/.test(text.trim()) ? Number(text) : toGib(text, context);
for (const row of streamedRows) {
  if (row.length !== 9) fail(`streamed row has ${row.length} cells: ${row[0]}`);
  const [
    engineCell,
    modelCell,
    layoutCell,
    devicesCell,
    holdsCell,
    capCell,
    storageCell,
    speedCell,
    sourceCell,
  ] = row;
  const engineId = engineIdIn(plain(engineCell));
  if (!seenEngines.has(engineId))
    fail(`streamed layout names engine "${engineId}" with no guide row`);
  const name = plain(modelCell);
  const model = models.find((entry) => entry.name === name);
  if (!model) fail(`streamed layout names unknown model "${name}"`);
  // The chip counts what the runtime serves, so a layout for a model the
  // runtime does not serve would put a row behind an absent chip.
  if (!supportsEngine(model, engineId))
    fail(`streamed layout pairs "${name}" with a runtime that serves it not`);
  if (model.layouts.some((layout) => layout.engineId === engineId))
    fail(`two streamed layouts for "${name}" on "${engineId}"`);
  const [heldText, contextText] = holdsCell.split(" · ");
  if (!contextText) fail(`streamed holds cell unparsed: "${holdsCell}"`);
  const sourceUrl = firstUrl(sourceCell);
  if (!sourceUrl) fail(`streamed layout for "${name}" has no source`);
  model.layouts.push({
    engineId,
    label: plain(layoutCell),
    devices: parseDevices(devicesCell, name),
    // Held memory is totalled across the row's devices; the label carries a
    // per-rank figure when the source states one.
    gib: toGib(heldText, name),
    testedTokens: parseOptionalTokens(contextText, name),
    capTokens: parseOptionalTokens(capCell, name),
    diskGib: storageCell === "—" ? null : toGib(storageCell, name),
    speed: speedCell === "—" ? null : plain(speedCell),
    sourceUrl,
  });
}

// ---------------------------------------------------------------- runtime configurations
// The engine-lever table records the remaining per-runtime footprints: resident
// layouts, quant presets, and caps. The calculator prices one path per model, so
// these rows are cited alternatives, not a second fit table.
const CONFIG_HEADING = "### Where the engine changes the fit";
const configRows = tableRowsUnder(CONFIG_HEADING);
if (!configRows.length) fail("engine-configuration table is empty");
for (const row of configRows) {
  if (row.length !== 9)
    fail(`configuration row has ${row.length} cells: ${row[0]}`);
  const [
    modelCell,
    runtimeCell,
    configCell,
    devicesCell,
    holdsCell,
    capCell,
    speedCell,
    noteCell,
    sourceCell,
  ] = row;
  const name = plain(modelCell);
  const model = models.find((entry) => entry.name === name);
  if (!model) fail(`configuration names unknown model "${name}"`);
  const engineId = engineIdIn(plain(runtimeCell));
  if (!seenEngines.has(engineId))
    fail(`configuration names engine "${engineId}" with no guide row`);
  if (!supportsEngine(model, engineId))
    fail(`configuration pairs "${name}" with a runtime that serves it not`);
  const label = plain(configCell);
  if (!label) fail(`configuration for "${name}" has no label`);
  if (
    model.configs.some(
      (config) => config.engineId === engineId && config.label === label,
    )
  )
    fail(`duplicate configuration "${label}" for "${name}" on "${engineId}"`);
  const gib =
    holdsCell === "—" ? null : toHeld(holdsCell.split(" · ")[0], name);
  const capTokens = parseOptionalTokens(capCell, name);
  const speed = speedCell === "—" ? null : plain(speedCell);
  // A row of em dashes is prose. Keep the table a facts table.
  if (gib === null && capTokens === null && !/\d/.test(speed ?? ""))
    fail(`configuration "${label}" for "${name}" states no number`);
  const sourceUrl = firstUrl(sourceCell);
  if (!sourceUrl) fail(`configuration "${label}" for "${name}" has no source`);
  model.configs.push({
    engineId,
    label,
    devices: parseDevices(devicesCell, name),
    gib,
    testedTokens: null,
    capTokens,
    diskGib: null,
    speed,
    note: plain(noteCell) || null,
    sourceUrl,
  });
}

// ---------------------------------------------------------------- MTP / drafter weights
// A speculative component that loads with the weights: built-in MTP layers, a
// separate drafter, or a resident co-model such as Engram. The page's toggle
// switches these on and off, so the data records what the guide publishes: the
// component kind, its stated size, and whether the fit figures already count
// it. Anything else would make the toggle invent a number.
const MTP_HEADING = "### MTP and drafter weights";
const mtpRows = tableRowsUnder(MTP_HEADING);

const MTP_KINDS = new Map([
  ["MTP", "mtp"],
  ["drafter", "drafter"],
  ["Engram", "engram"],
]);

const parseResidentSize = (text, context) => {
  if (text === "—") return { gib: null, estimate: false };
  const match = /^~?([\d.]+)\s*(GiB|GB)\s*(est)?$/.exec(text.trim());
  if (!match) fail(`unparsed resident size "${text}" (${context})`);
  const gib =
    match[2] === "GiB" ? Number(match[1]) : toGib(`${match[1]} GB`, context);
  return { gib, estimate: Boolean(match[3]) };
};

for (const row of mtpRows) {
  if (row.length !== 7) fail(`MTP row has ${row.length} cells: ${row[0]}`);
  const [
    modelCell,
    componentCell,
    paramsCell,
    sizeCell,
    includedCell,
    noteCell,
    sourceCell,
  ] = row;
  const name = plain(modelCell);
  const model = models.find((entry) => entry.name === name);
  if (!model) fail(`MTP row names unknown model "${name}"`);
  if (model.mtp) fail(`two MTP rows for "${name}"`);
  const kind = MTP_KINDS.get(plain(componentCell));
  if (!kind) fail(`unknown MTP component "${componentCell}"`);
  const includedWord = plain(includedCell);
  if (includedWord !== "yes" && includedWord !== "no")
    fail(`MTP row for "${name}" must state yes or no, got "${includedCell}"`);
  const { gib, estimate } = parseResidentSize(sizeCell, name);
  const sourceUrl = firstUrl(sourceCell);
  if (!sourceUrl) fail(`MTP row for "${name}" has no source`);
  model.mtp = {
    kind,
    params: paramsCell === "—" ? null : plain(paramsCell),
    gib,
    estimate,
    includedInFit: includedWord === "yes",
    resident: kind !== "engram",
    note: noteCell === "—" ? null : plain(noteCell),
    sourceUrl,
  };
}

// ---------------------------------------------------------------- measured runs
// Only pairs the guide measures. Never extrapolated to other hardware.
const RUNS = [
  ["gpt-oss-20b", "rtx4090", "225.22 ± 0.10 out · llama.cpp MXFP4 GGUF tg128"],
  ["gpt-oss-20b", "rx9070", "132.4 out · Ollama MXFP4, RX 9070 family"],
  [
    "Qwen3.8-27B",
    "rtx4090",
    "95.5 out with MTP / 47.7 without · Ollama Q4_K_M",
  ],
  [
    "Gemma 4 26B-A4B",
    "rtx3090",
    "119 / 82 / 64 out at 4K / 128K / 256K · llama.cpp Q4",
  ],
  [
    "Gemma 4 31B",
    "rtx3090",
    "34 / 31 / 30 out at 4K / 32K / ~45K · llama.cpp Q4",
  ],
  [
    "Muse Glimmer 30B",
    "rtx5090",
    "74.9 → 233.4 out/user, c1, without → with DFlash",
  ],
  [
    "Laguna XS 2.1",
    "apple-m5-max-128",
    "95.4 → 76.7 out/user at 1K → 32K prompts, oMLX 8-bit",
  ],
  ["Laguna S 2.1", "spark", "15 prose / 22–24 code out · vLLM NVFP4 + DFlash"],
  [
    "Ripple-65B-Preview",
    "spark",
    "19.5 out/user c1; 48 aggregate out c4 · SGLang NVFP4",
  ],
  ["GLM-5.3 Flash", "spark", "17.72 out/user c1 · UD-Q2_K_XL via gr8"],
  [
    "GLM-5.3 Flash",
    "h200-4",
    "12,026.62 aggregate out · SGLang + DFlash2, 99.9% shared prefix",
  ],
  ["Inkling 2 Small", "gb200-4", "~630 out/user at c1 · NVFP4 + DSpark"],
  [
    "Inkling 2 Small",
    "gb200-8",
    "~1,070 out/GPU at 100 out/user, ~84 sessions",
  ],
  ["Kimi K3", "gb300-32", "331.18 out/GPU · TokenSpeed NVFP4, c576"],
  [
    "Kimi K3.1 Pro",
    "gb300-16",
    "375.9 p90 out/user at c1 · synthetic speculation acceptance",
  ],
  ["Mistral Large 4", "b300-8", "~260 out/user · SGLang FP8 + DSpark"],
  ["Mistral Large 4", "gb300-4", "~264 out/user · SGLang NVFP4 + DSpark"],
  ["Ling 3.1 Flash", "h200-8", "269.2 out · SGLang FP8 + NEXTN, batch 1"],
  ["Ling 3.1 Flash", "gb300-4", "175.3 out · SGLang FP8 + NEXTN, batch 1"],
  [
    "Muse Spark Open",
    "gb300-4",
    "~300 out/user at c1; ~8,100 aggregate out at c256",
  ],
];

const modelIds = new Set(models.map((model) => model.id));
const hardwareIds = new Set(hardware.map((entry) => entry.id));

// ---------------------------------------------------------------- batching points
// Operating points where the guide measured more than one conversation. Each
// value is a published figure; the missing side of the pair is derived on the
// page, so the same run is never typed twice. `approx` follows the guide's `~`.
const BATCHING = [
  [
    "Ripple-65B-Preview",
    "spark",
    [
      [1, 19.5, null, false],
      [4, null, 48, false],
    ],
  ],
  [
    "Muse Spark Open",
    "gb300-4",
    [
      [1, 300, null, true],
      [256, null, 8100, true],
    ],
  ],
  ["Inkling 2 Small", "gb200-8", [[84, 100, null, true]]],
];

const batching = BATCHING.flatMap(([name, hardwareId, points]) => {
  const found = catalog.get(modelKey(name));
  if (!found) fail(`batching run references unknown model "${name}"`);
  if (!hardwareIds.has(hardwareId))
    fail(`batching run references unknown hardware "${hardwareId}"`);
  return points.map(([concurrency, perUserOut, aggregateOut, approx]) => ({
    modelId: found.id,
    hardwareId,
    concurrency,
    perUserOut,
    aggregateOut,
    approx,
  }));
});
const throughput = RUNS.map(([name, hardwareId, text]) => {
  const found = catalog.get(modelKey(name));
  if (!found) fail(`run references unknown model "${name}"`);
  if (!hardwareIds.has(hardwareId))
    fail(`run references unknown hardware "${hardwareId}"`);
  return { modelId: found.id, hardwareId, text };
});

// ---------------------------------------------------------------- platform notes
// Layouts the guide documents for accelerators it does not screen.
const PLATFORM = [
  [
    "Kimi K3.1 Pro",
    "amd",
    "SGLang AMD Instinct cookbook: a separate deployment path, not a B300-only model",
    "https://docs.sglang.io/cookbook/autoregressive/Moonshotai/Kimi-K3.1-Pro.md",
  ],
  [
    "Inkling-Small",
    "amd",
    "A separate MXFP4 AMD path verifies 1M context",
    refs.get("inkling-amd"),
  ],
  [
    "gpt-oss-20b",
    "amd",
    "132.4 out · Ollama MXFP4 on the RX 9070 family",
    "https://llm-bench.io/benchmarks/cmutrpe0700wf01oxbqfnpyn3",
  ],
  [
    "Laguna XS 2.1",
    "apple",
    "95.4 → 76.7 out/user at 1K → 32K prompts, oMLX 8-bit on an M5 Max 128 GB",
    "https://huggingface.co/mlx-community/Laguna-XS-2.1-8bit/blob/main/README.md#L22-L33",
  ],
  [
    "Muse Glimmer 30B",
    "apple",
    "M4 Max ExecuTorch: 23.7 → 37.8 out/user",
    refs.get("glimmer-card"),
  ],
  [
    "Muse Spark Open",
    "apple",
    "512 GB M3 Ultra: llama.cpp Q2_K 18 out/user, MLX oQ3e 21; two 512 GB M5 Ultra Mac Studios via MLX/JACCL",
    refs.get("muse-mac"),
  ],
  [
    "GLM-5.3 Flash",
    "apple",
    "PulsarMLX paged experts: ~2.6–4.2 out on a 128 GB M1 Ultra with a 181.9 GB artifact",
    "https://github.com/MahdiHedhli/PulsarMLX/blob/HEAD/README.md#L67-L88",
  ],
];

const platform = PLATFORM.map(([name, family, text, sourceUrl]) => {
  const found = catalog.get(modelKey(name));
  if (!found) fail(`platform note references unknown model "${name}"`);
  if (!sourceUrl) fail(`platform note for "${name}" has no source`);
  return { modelId: found.id, family, text, sourceUrl };
});

for (const modelId of [...throughput, ...platform].map(
  (item) => item.modelId,
)) {
  if (!modelIds.has(modelId)) fail(`unknown model id "${modelId}"`);
}

// ---------------------------------------------------------------- emit
// The sources-checked date is quoted on the page, so read it from the guide.
const checkedThrough = /Sources checked through \*\*([\d-]{10})\*\*/.exec(
  md,
)?.[1];
if (!checkedThrough) fail('no "Sources checked through" date');

// Query axis of the ladder. The guide's anchors are 64K and each native cap;
// the intermediate stops are the lengths operators actually buy.
const CONTEXT_STOPS = [65_536, 131_072, 262_144, 524_288, 1_048_576];

const dataset = {
  meta: {
    guide: path.basename(sourcePath),
    sourceUrl: `https://github.com/agenticoding/agenticoding.github.io/blob/main/${path.basename(sourcePath)}`,
    checkedThrough,
    contextStops: CONTEXT_STOPS,
  },
  families: FAMILIES.map(([id, label, vendor]) => ({ id, label, vendor })),
  engines: engineCatalog,
  hardware,
  models,
  throughput,
  batching,
  platformNotes: platform,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(dataset, null, 2)}\n`);
// Keep the generated file inside the repo's formatting contract, so
// `npm run format:check` passes straight after a regeneration.
execFileSync("npx", ["prettier", "--write", outPath], { stdio: "ignore" });
console.log(
  `wrote ${path.relative(repo, outPath)}: ${models.length} models, ${hardware.length} hardware targets, ${engineCatalog.length} engines, ${throughput.length} measured runs, ${batching.length} batching points, ${platform.length} platform paths, ${models.reduce((total, model) => total + model.layouts.length, 0)} streamed layouts, ${models.reduce((total, model) => total + model.configs.length, 0)} configurations`,
);
