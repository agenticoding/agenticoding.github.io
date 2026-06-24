#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import {
  EMOJI_OUT_DIR,
  OPENMOJI_CACHE_DIR,
  OPENMOJI_SVG_BASE,
  buildOpenMojiResolver,
  cleanOpenMojiSvg,
  exists,
  openMojiFilename,
  readOpenMojiMetadata,
} from './openmoji-assets.js';

function parseArgs(argv) {
  const force = argv.includes('--force');
  const inputs = argv.filter((arg) => arg !== '--force');
  return { force, inputs };
}

function usage() {
  console.log('Usage: node fetch-openmoji.js [--force] <codepoint> [codepoint ...]');
  console.log('Example: node fetch-openmoji.js 1f916 1f64b_1f3fb_200d_2642');
}

async function main() {
  const { force, inputs } = parseArgs(process.argv.slice(2));
  if (inputs.length === 0) return usage();

  const metadata = await readOpenMojiMetadata({ force });
  const resolve = buildOpenMojiResolver(metadata);
  const hexcodes = inputs.map(resolve);
  await fetchOpenMojiAssets([...new Set(hexcodes)], { force });
}

async function fetchOpenMojiAssets(hexcodes, { force }) {
  await mkdir(OPENMOJI_CACHE_DIR, { recursive: true });
  await mkdir(EMOJI_OUT_DIR, { recursive: true });
  for (const hexcode of hexcodes) await writeAsset(hexcode, { force });
}

async function writeAsset(hexcode, { force }) {
  const filename = openMojiFilename(hexcode);
  const raw = await rawSvg(hexcode, { force });
  const outPath = join(EMOJI_OUT_DIR, filename);
  await writeFile(outPath, cleanOpenMojiSvg(raw), 'utf8');
  console.log(`wrote: ${outPath}`);
}

async function rawSvg(hexcode, { force }) {
  const filename = openMojiFilename(hexcode);
  const cachePath = join(OPENMOJI_CACHE_DIR, filename);
  if (!force && await exists(cachePath)) return cachedSvg(cachePath, filename);
  return fetchSvg(cachePath, filename);
}

async function cachedSvg(cachePath, filename) {
  console.log(`cache hit: ${filename}`);
  return readFile(cachePath, 'utf8');
}

async function fetchSvg(cachePath, filename) {
  const url = `${OPENMOJI_SVG_BASE}/${filename}`;
  console.log(`fetching: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${filename}: HTTP ${res.status} ${url}`);
  const raw = await res.text();
  await writeFile(cachePath, raw, 'utf8');
  return raw;
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
