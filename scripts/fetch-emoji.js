#!/usr/bin/env node

import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cacheDir = join(__dirname, '.noto-cache');
const outDir = join(__dirname, '..', 'website', 'static', 'img', 'emoji');
const BASE_URL = 'https://raw.githubusercontent.com/adobe-fonts/noto-emoji-svg/refs/heads/main/svg';

async function exists(path) {
  return access(path).then(() => true).catch(() => false);
}

function clean(svg) {
  // Strip XML prolog and comments
  let s = svg
    .replace(/<\?xml[^?]*\?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Normalize <svg> root: keep only viewBox and xmlns
  s = s.replace(/<svg[^>]*>/, (match) => {
    const vb = (match.match(/viewBox="([^"]*)"/) ?? [])[1] ?? '0 0 128 128';
    return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">`;
  });

  // Convert style="fill:..." to fill="..." attribute
  s = s.replace(/style="fill:([^;"]+)[^"]*"/g, (_, color) => `fill="${color.trim()}"`);

  return s.trim();
}

async function fetchEmoji(codepoints) {
  await mkdir(cacheDir, { recursive: true });
  await mkdir(outDir, { recursive: true });

  let failed = false;
  for (const cp of codepoints) {
    const filename = `u${cp}.svg`;
    const cachePath = join(cacheDir, filename);
    const outPath = join(outDir, `u${cp}.svg`);

    let raw;
    if (await exists(cachePath)) {
      console.log(`  cache hit: ${filename}`);
      raw = await readFile(cachePath, 'utf8');
    } else {
      const url = `${BASE_URL}/${filename}`;
      console.log(`  fetching: ${url}`);
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`  error: ${filename} — HTTP ${res.status}`);
        failed = true;
        continue;
      }
      raw = await res.text();
      await writeFile(cachePath, raw, 'utf8');
    }

    const cleaned = clean(raw);
    await writeFile(outPath, cleaned, 'utf8');
    console.log(`  wrote: ${outPath}`);
  }

  if (failed) process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node fetch-emoji.js <codepoint> [codepoint ...]');
  console.log('Example: node fetch-emoji.js 1f916 1f4a1');
  process.exit(0);
}

fetchEmoji(args).catch(console.error);
