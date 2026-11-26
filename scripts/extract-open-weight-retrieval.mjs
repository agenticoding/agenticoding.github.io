#!/usr/bin/env node
/**
 * Generates website/src/generated/open-weight-retrieval.json from
 * open-weight-retrieval-nov-2026.md.
 *
 * WHY: the markdown guide is the single source of truth for every number the two
 * retrieval figures show. Hand-copying rows into TS invites silent drift, so the
 * figures' dataset is derived and never edited.
 *
 * WHY it reads the fit dataset: hardware and runtimes are one catalogue. A
 * retrieval model names runtimes by the ids that catalogue publishes, so the
 * three figures cannot disagree about what an engine is.
 *
 * WHAT: facts only — no copy, colour, or layout. A row the script cannot parse
 * fails the run instead of emitting a partial fact, and a `?` in the guide stays
 * null here rather than becoming a guess.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { guideTables } from "./lib/guide-tables.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const sourcePath = path.join(repo, "open-weight-retrieval-nov-2026.md");
const cataloguePath = path.join(
  repo,
  "website",
  "src",
  "generated",
  "open-weight-fit.json",
);
const classifierPath = path.join(
  repo,
  "website",
  "src",
  "generated",
  "open-weight-classifiers.json",
);
const outPath = path.join(
  repo,
  "website",
  "src",
  "generated",
  "open-weight-retrieval.json",
);

const fail = (message) => {
  throw new Error(`extract-open-weight-retrieval: ${message}`);
};

/** Each family's sink is the model's own output, never text. */
const KINDS = {
  "## Embedders": { kind: "embedding", sink: "vector" },
  // The separate listwise table has a packed workload, not a pairwise one.
  "## Rerankers": { kind: "reranking", sink: "score" },
};
const MODALITIES = ["text", "image", "audio", "video"];

const md = fs.readFileSync(sourcePath, "utf8");

if (!fs.existsSync(cataloguePath)) {
  fail("missing open-weight-fit.json: run `npm run data:open-weight-fit` first");
}
const catalogue = JSON.parse(fs.readFileSync(cataloguePath, "utf8"));
const engineIds = new Set(catalogue.engines.map((engine) => engine.id));

const { plain, firstUrl, tableRowsUnder } = guideTables(md, fail);

const slug = (text) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const COLUMNS = [
  "lab",
  "model",
  "base",
  "params",
  "weights",
  "maxInput",
  "dims",
  "score",
  "origin",
  "files",
  "license",
  "engines",
  "modality",
  "card",
];

const UNIT_GIB = { GiB: 1, GB: 1.073741824, MB: 1073.741824 };

/** `15.14 GB BF16` → a comparable size and the precision it is published at.
 * A decimal unit is converted to GiB for the figure's arithmetic, and the
 * published wording travels with it: the panel prints what the source says. */
const parseWeights = (cell, context) => {
  if (plain(cell) === "?") return null;
  const match = /^([\d.]+)\s*(GiB|GB|MB)\s+(\S+)$/.exec(plain(cell));
  if (!match) fail(`${context}: weights must name a size and a precision`);
  const [, size, unit, precision] = match;
  const gib = Number(size) / UNIT_GIB[unit];
  return {
    gib: Math.round(gib * 100) / 100,
    stated: `${size} ${unit} ${precision}`,
    precision,
  };
};

/** `32,768 config` → the number and who states it as a limit. */
const parseMaxInput = (cell, context) => {
  if (plain(cell) === "?") return null;
  const match = /^([\d,]+)\s+(served|config|card|blog|default)$/.exec(plain(cell));
  if (!match) fail(`${context}: max input must be a number and its basis`);
  const tokens = Number(match[1].replaceAll(",", ""));
  if (!Number.isFinite(tokens) || tokens <= 0)
    fail(`${context}: max input is not a number`);
  return { tokens, basis: match[2] };
};

/** `4,096 (MRL 32–4,096)` → the native width and the card's own qualifier. */
const parseDims = (cell, context) => {
  if (plain(cell) === "?") return null;
  const match = /^([\d,]+)(?:\s*\((.+)\))?$/.exec(plain(cell));
  if (!match) fail(`${context}: dims must be a width and an optional note`);
  const width = Number(match[1].replaceAll(",", ""));
  if (!Number.isFinite(width) || width <= 0)
    fail(`${context}: dims is not a number`);
  return { width, note: match[2] ?? null };
};

/** `70.58 MMTEB v2` → the number and the benchmark that produced it. */
const parseScore = (cell, context) => {
  if (plain(cell) === "?") return null;
  const match = /^([\d.]+)\s+(.+)$/.exec(plain(cell));
  if (!match) fail(`${context}: score must name a number and its benchmark`);
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0)
    fail(`${context}: score is not a number`);
  return { value, benchmark: match[2] };
};

/** `text → vector`: input channels become a vector or a score, not text. */
const parseModality = (cell, sink, context) => {
  const [inputs, output] = plain(cell)
    .split("→")
    .map((part) => part.trim());
  if (!inputs || !output) fail(`${context}: modality needs an arrow`);
  if (output !== sink)
    fail(`${context}: output must be "${sink}" for this family`);
  const channels = inputs
    .split("+")
    .map((name) => name.trim())
    .filter(Boolean);
  for (const channel of channels)
    if (!MODALITIES.includes(channel))
      fail(`${context}: unknown channel "${channel}"`);
  return {
    inputs: MODALITIES.filter((name) => channels.includes(name)),
    output: sink,
  };
};

const models = [];
for (const [heading, { kind, sink }] of Object.entries(KINDS)) {
  for (const row of tableRowsUnder(heading)) {
    const cell = (name) => row[COLUMNS.indexOf(name)];
    if (row.length !== COLUMNS.length)
      fail(`${plain(cell("model"))}: expected ${COLUMNS.length} cells`);
    const name = plain(cell("model"));
    const context = name;

    const engines = plain(cell("engines"))
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (!engines.length) fail(`${context}: names no engine`);
    for (const id of engines)
      if (!engineIds.has(id))
        fail(`${context}: "${id}" is not in the runtime catalogue`);

    models.push({
      id: slug(name),
      name,
      lab: plain(cell("lab")),
      kind,
      base: plain(cell("base")),
      params: plain(cell("params")),
      weights: parseWeights(cell("weights"), context),
      maxInput: parseMaxInput(cell("maxInput"), context),
      dims: parseDims(cell("dims"), context),
      score: parseScore(cell("score"), context),
      country: plain(cell("origin")) === "?" ? null : plain(cell("origin")),
      files: plain(cell("files")),
      filesUrl: firstUrl(cell("files")),
      license: plain(cell("license")),
      engineIds: engines,
      modalities: parseModality(cell("modality"), sink, context),
      sourceUrl: firstUrl(cell("card")),
    });
  }
}

if (!models.length) fail("no retrieval models");

// An id is the figure's row key, so it must be unique across all three
// datasets: two figures on one page never share a key.
const taken = new Set(catalogue.models.map((model) => model.id));
if (fs.existsSync(classifierPath)) {
  const classifiers = JSON.parse(fs.readFileSync(classifierPath, "utf8"));
  for (const model of classifiers.models) taken.add(model.id);
}
for (const model of models) {
  if (taken.has(model.id))
    fail(`id "${model.id}" collides with another dataset`);
  taken.add(model.id);
  if (!model.sourceUrl) fail(`${model.name}: no model card`);
}

const checked = /Sources checked through \*\*([\d-]+)\*\*/.exec(md);
if (!checked) fail("the guide states no checked-through date");

const dataset = {
  meta: {
    guide: path.basename(sourcePath),
    sourceUrl: `https://github.com/agenticoding/agenticoding.github.io/blob/main/${path.basename(sourcePath)}`,
    checkedThrough: checked[1],
    kinds: Object.values(KINDS).map(({ kind }) => kind),
  },
  models,
};

fs.writeFileSync(outPath, `${JSON.stringify(dataset, null, 2)}\n`);
const count = (kind) => models.filter((model) => model.kind === kind).length;
console.log(
  `wrote ${path.relative(repo, outPath)}: ${count("embedding")} embedders, ${count("reranking")} rerankers, ${models.filter((model) => model.weights === null).length} without a published weight size`,
);
