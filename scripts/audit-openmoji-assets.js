#!/usr/bin/env node

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { EMOJI_OUT_DIR } from './openmoji-assets.js';

const ROOT = join(import.meta.dirname, '..');
const CATALOG = join(ROOT, 'website', 'src', 'components', 'VisualElements', 'emojiAssets.ts');
const LEGACY_SOURCE_PATTERN = legacyPattern([
  ['No', 'toEmoji'],
  ['code', 'point='],
  ['/img/emoji/', 'u'],
  ['fetch', '-emoji'],
  ['.no', 'to-cache'],
  ['adobe-' + 'fonts/', 'no' + 'to-emoji-svg'],
]);
const LEGACY_SCRIPT_PATTERN = legacyPattern([
  ['fetch', '-emoji'],
  ['.no', 'to-cache'],
  ['adobe-' + 'fonts/', 'no' + 'to-emoji-svg'],
]);
const SCANS = [
  { path: join(ROOT, 'website', 'src'), pattern: LEGACY_SOURCE_PATTERN },
  { path: join(ROOT, 'website', 'docs'), pattern: LEGACY_SOURCE_PATTERN },
  { path: join(ROOT, 'scripts'), pattern: LEGACY_SCRIPT_PATTERN },
];

async function main() {
  const failures = [
    ...await catalogFailures(),
    ...await legacyAssetFailures(),
    ...await sourceReferenceFailures(),
  ];
  if (failures.length > 0) fail(failures);
  console.log('OpenMoji asset audit passed.');
}

async function catalogFailures() {
  const catalog = await readFile(CATALOG, 'utf8');
  const required = [...catalog.matchAll(/asset\('([^']+\.svg)'/g)].map((match) => match[1]);
  const files = new Set(await svgFiles());
  return [...new Set(required)].filter((file) => !files.has(file)).map((file) => `missing catalog asset: ${file}`);
}

async function legacyAssetFailures() {
  return (await svgFiles()).filter((file) => /^u[0-9a-f]/i.test(file)).map((file) => `legacy emoji asset remains: ${file}`);
}

async function sourceReferenceFailures() {
  const results = await Promise.all(SCANS.map(scanTree));
  return results.flat();
}

async function scanTree({ path, pattern }) {
  const files = await textFiles(path);
  const results = await Promise.all(files.map((file) => scanFile(file, pattern)));
  return results.flat();
}

async function scanFile(file, pattern) {
  const lines = (await readFile(file, 'utf8')).split('\n');
  return lines.flatMap((line, index) => pattern.test(line) ? [`legacy reference: ${relative(file)}:${index + 1}: ${line.trim()}`] : []);
}

async function textFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.filter(keepEntry).map((entry) => entry.isDirectory() ? textFiles(join(dir, entry.name)) : [join(dir, entry.name)]));
  return nested.flat().filter((file) => /\.(css|js|jsx|md|mdx|ts|tsx)$/.test(file));
}

function keepEntry(entry) {
  return !entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'output';
}

function legacyPattern(parts) {
  return new RegExp(parts.map(([left, right]) => escapeRegex(`${left}${right}`)).join('|'));
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function svgFiles() {
  return (await readdir(EMOJI_OUT_DIR)).filter((file) => file.endsWith('.svg'));
}

function relative(path) {
  return path.slice(ROOT.length + 1);
}

function fail(failures) {
  console.error(failures.join('\n'));
  process.exit(1);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
