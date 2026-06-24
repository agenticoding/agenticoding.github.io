import { access, mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

export const OPENMOJI_METADATA_URL = 'https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/data/openmoji.json';
export const OPENMOJI_SVG_BASE = 'https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/color/svg';
export const OPENMOJI_CACHE_DIR = join(SCRIPT_DIR, '.openmoji-cache');
export const EMOJI_OUT_DIR = join(SCRIPT_DIR, '..', 'website', 'static', 'img', 'emoji');

export async function exists(path) {
  return access(path).then(() => true).catch(() => false);
}

export function normalizeEmojiToken(input) {
  let token = input.trim().replace(/\.svg$/i, '');
  token = token.replace(/^u(?=[0-9a-f]{2,6}(?:[_-]|$))/i, '');
  token = token.replace(/_/g, '-').toUpperCase();
  validateHexcode(token, input);
  return token;
}

function validateHexcode(token, input) {
  const segments = token.split('-');
  const valid = segments.length > 0 && segments.every((part) => /^[0-9A-F]{2,6}$/.test(part));
  if (!valid) throw new Error(`Invalid emoji codepoint "${input}". Expected hexadecimal segments like 1F916 or 1F64B-1F3FB-200D-2642.`);
}

export function openMojiFilename(hexcode) {
  return `${hexcode}.svg`;
}

export async function readOpenMojiMetadata({ force = false } = {}) {
  const cachePath = join(OPENMOJI_CACHE_DIR, 'openmoji.json');
  await mkdir(OPENMOJI_CACHE_DIR, { recursive: true });
  if (!force && await exists(cachePath)) return readJson(cachePath);
  const metadata = await fetchJson(OPENMOJI_METADATA_URL);
  await writeFile(cachePath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  return metadata;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch OpenMoji metadata: HTTP ${res.status} ${url}`);
  return res.json();
}

export function buildOpenMojiResolver(metadata) {
  const exact = new Map(metadata.map(({ hexcode }) => [hexcode.toUpperCase(), hexcode.toUpperCase()]));
  const aliases = uniqueAliases([...exact.keys()]);
  return (input) => resolveOpenMojiHexcode(input, exact, aliases);
}

function uniqueAliases(hexcodes) {
  const buckets = new Map();
  for (const hexcode of hexcodes) addAliasBucket(buckets, withoutVariationSelectors(hexcode), hexcode);
  return new Map([...buckets].filter(([, values]) => values.size === 1).map(([alias, values]) => [alias, [...values][0]]));
}

function addAliasBucket(buckets, alias, hexcode) {
  if (alias === hexcode) return;
  if (!buckets.has(alias)) buckets.set(alias, new Set());
  buckets.get(alias).add(hexcode);
}

function withoutVariationSelectors(hexcode) {
  return hexcode.split('-').filter((segment) => segment !== 'FE0F').join('-');
}

function resolveOpenMojiHexcode(input, exact, aliases) {
  const normalized = normalizeEmojiToken(input);
  const resolved = exact.get(normalized) ?? aliases.get(normalized);
  if (!resolved) throw unresolvedError(normalized);
  return resolved;
}

function unresolvedError(normalized) {
  return new Error(`OpenMoji asset not found for "${normalized}". Resolve through ${OPENMOJI_METADATA_URL} instead of guessing filenames.`);
}

export function cleanOpenMojiSvg(svg) {
  return normalizeSvgRoot(stripXmlNoise(svg)).trim();
}

function stripXmlNoise(svg) {
  return svg.replace(/<\?xml[^?]*\?>/g, '').replace(/<!--[\s\S]*?-->/g, '');
}

function normalizeSvgRoot(svg) {
  return svg.replace(/<svg[^>]*>/, (match) => {
    const vb = (match.match(/viewBox="([^"]*)"/) ?? [])[1] ?? '0 0 72 72';
    return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">`;
  });
}
