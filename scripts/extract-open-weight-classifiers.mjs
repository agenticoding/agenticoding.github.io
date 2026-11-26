#!/usr/bin/env node
/**
 * Generates website/src/generated/open-weight-classifiers.json from
 * open-weight-classifiers-nov-2026.md.
 *
 * WHY: the markdown guide is the single source of truth for every number the
 * decision-model figure shows. Hand-copying rows into TS invites silent drift,
 * so the figure's dataset is derived and never edited.
 *
 * WHY it reads the fit dataset: the hardware and runtime catalogue is one
 * record. A classifier names runtimes by the ids that catalogue already
 * publishes, so the two figures cannot disagree about what an engine is.
 *
 * WHAT: facts only — no copy, colour, or layout. A row the script cannot parse
 * fails the run instead of emitting a partial fact, and a `?` in the guide
 * stays null here rather than becoming a guess.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { guideTables } from "./lib/guide-tables.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const sourcePath = path.join(repo, "open-weight-classifiers-nov-2026.md");
const cataloguePath = path.join(
  repo,
  "website",
  "src",
  "generated",
  "open-weight-fit.json",
);
const outPath = path.join(
  repo,
  "website",
  "src",
  "generated",
  "open-weight-classifiers.json",
);

const fail = (message) => {
  throw new Error(`extract-open-weight-classifiers: ${message}`);
};

const PROTOCOLS = new Set(["joint", "per-question"]);
const MODALITIES = ["text", "image", "audio", "video"];

const md = fs.readFileSync(sourcePath, "utf8");

if (!fs.existsSync(cataloguePath)) {
  fail(
    "missing open-weight-fit.json: run `npm run data:open-weight-fit` first",
  );
}
const catalogue = JSON.parse(fs.readFileSync(cataloguePath, "utf8"));
const engineIds = new Set(catalogue.engines.map((engine) => engine.id));

const { lines, plain, firstUrl, tableRowsUnder } = guideTables(md, fail);

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
  "protocol",
  "params",
  "weights",
  "maxInput",
  "origin",
  "files",
  "license",
  "engines",
  "modality",
  "card",
];

/** `50.35 GiB BF16` → a comparable size and the precision it is published at.
 * A decimal `GB` is converted to `GiB` for the figure's arithmetic, and the
 * published wording travels with it: the table prints what the source says. */
const parseWeights = (cell, context) => {
  if (plain(cell) === "?") return null;
  const match = /^([\d.]+)\s*(GiB|GB)\s+(\S+(?: backbone \+ \S+ head)?)$/.exec(
    plain(cell),
  );
  if (!match) fail(`${context}: weights must name a size and a precision`);
  const [, size, unit, precision] = match;
  const gib = unit === "GiB" ? Number(size) : Number(size) / 1.073741824;
  return {
    gib: Math.round(gib * 100) / 100,
    stated: `${size} ${unit} ${precision}`,
    precision,
  };
};

/** `65,536 served` → the number and who states it as a limit. */
const parseMaxInput = (cell, context) => {
  if (plain(cell) === "?") return null;
  const match = /^([\d,]+)\s+(served|config|reference)$/.exec(plain(cell));
  if (!match) fail(`${context}: max input must be a number and its basis`);
  const tokens = Number(match[1].replaceAll(",", ""));
  if (!Number.isFinite(tokens) || tokens <= 0)
    fail(`${context}: max input is not a number`);
  return { tokens, basis: match[2] };
};

/**
 * `United States` → the country the lab publishes. `?` stays null: a classifier
 * is self-hosted, so a hosted price would say nothing about running it, and no
 * rate is extracted at all.
 */
const parseOrigin = (cell) => (plain(cell) === "?" ? null : plain(cell));

/** `text+image+video → label`: input channels become a decision, not text. */
const parseModality = (cell, context) => {
  const [inputs, output] = plain(cell)
    .split("→")
    .map((part) => part.trim());
  if (!inputs || !output) fail(`${context}: modality needs an arrow`);
  if (output !== "label") fail(`${context}: output must be "label"`);
  const channels = inputs
    .split("+")
    .map((name) => name.trim())
    .filter(Boolean);
  for (const channel of channels)
    if (!MODALITIES.includes(channel))
      fail(`${context}: unknown channel "${channel}"`);
  return {
    inputs: MODALITIES.filter((name) => channels.includes(name)),
    output,
  };
};

const models = tableRowsUnder("## Classifiers").map((row) => {
  const cell = (name) => row[COLUMNS.indexOf(name)];
  if (row.length !== COLUMNS.length)
    fail(`${plain(cell("model"))}: expected ${COLUMNS.length} cells`);
  const name = plain(cell("model"));
  const context = name;

  const protocol = plain(cell("protocol"));
  if (!PROTOCOLS.has(protocol)) fail(`${context}: unknown protocol`);

  const engines = plain(cell("engines"))
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (!engines.length) fail(`${context}: names no engine`);
  for (const id of engines)
    if (!engineIds.has(id))
      fail(`${context}: "${id}" is not in the runtime catalogue`);

  return {
    id: slug(name),
    name,
    lab: plain(cell("lab")),
    base: plain(cell("base")),
    protocol,
    params: plain(cell("params")),
    weights: parseWeights(cell("weights"), context),
    maxInput: parseMaxInput(cell("maxInput"), context),
    country: parseOrigin(cell("origin")),
    files: plain(cell("files")),
    filesUrl: firstUrl(cell("files")),
    license: plain(cell("license")),
    engineIds: engines,
    modalities: parseModality(cell("modality"), context),
    sourceUrl: firstUrl(cell("card")),
  };
});

if (!models.length) fail("no classifiers");
const fitIds = new Set(catalogue.models.map((model) => model.id));
const seen = new Set();
for (const model of models) {
  if (fitIds.has(model.id))
    fail(`id "${model.id}" collides with the fit dataset`);
  if (seen.has(model.id)) fail(`duplicate id "${model.id}"`);
  seen.add(model.id);
  if (!model.sourceUrl) fail(`${model.name}: no model card`);
}

const checked = /Sources checked through \*\*([\d-]+)\*\*/.exec(md);
if (!checked) fail("the guide states no checked-through date");

const dataset = {
  meta: {
    guide: path.basename(sourcePath),
    sourceUrl: `https://github.com/agenticoding/agenticoding.github.io/blob/main/${path.basename(sourcePath)}`,
    checkedThrough: checked[1],
    protocols: [...PROTOCOLS],
  },
  models,
};

fs.writeFileSync(outPath, `${JSON.stringify(dataset, null, 2)}\n`);
const guessed = models.filter((model) => model.weights === null).length;
console.log(
  `wrote ${path.relative(repo, outPath)}: ${models.length} classifiers, ${guessed} without a published weight size, ${new Set(models.map((m) => m.protocol)).size} protocols`,
);
void lines;
