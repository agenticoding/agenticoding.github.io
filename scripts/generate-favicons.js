#!/usr/bin/env node

import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const imgDir = join(__dirname, '..', 'website', 'static', 'img');

async function generateFavicons() {
  console.log('Generating favicons...');

  // Read the source SVG and strip dark-mode media query for light-mode raster export
  const svgSource = await readFile(join(imgDir, 'favicon-source.svg'), 'utf8');
  const lightSvg = svgSource.replace(
    /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{[^}]*\}/g,
    ''
  );
  const svgBuffer = Buffer.from(lightSvg);

  // Generate 32x32 PNG then convert to .ico
  const png32 = await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toBuffer();

  const ico = await pngToIco([png32]);
  const icoPath = join(imgDir, 'favicon.ico');
  await writeFile(icoPath, ico);
  console.log(`  favicon.ico (32x32): ${(ico.length / 1024).toFixed(1)}KB`);

  // Generate 180x180 apple-touch-icon
  const touchPath = join(imgDir, 'apple-touch-icon.png');
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(touchPath);

  const { size } = await readFile(touchPath).then(b => ({ size: b.length }));
  console.log(`  apple-touch-icon.png (180x180): ${(size / 1024).toFixed(1)}KB`);

  console.log('Done.');
}

generateFavicons().catch(console.error);
