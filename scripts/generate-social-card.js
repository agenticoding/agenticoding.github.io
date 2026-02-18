#!/usr/bin/env node

import { createCanvas, registerFont } from 'canvas';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Register design system fonts (TTF required by node-canvas)
registerFont(join(__dirname, 'fonts', 'SpaceGrotesk-Bold.ttf'), {
  family: 'Space Grotesk',
  weight: 'bold',
});
registerFont(join(__dirname, 'fonts', 'Inter-Variable.ttf'), {
  family: 'Inter',
  weight: 'normal',
});

// Open Graph standard dimensions
const WIDTH = 1200;
const HEIGHT = 630;

async function generateSocialCard() {
  console.log('Generating social card...');

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Solid dark background per design system spec
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Draw </> glyph — neutral-100
  const centerX = WIDTH / 2;
  const glyphY = 200;

  ctx.strokeStyle = '#e8e8e8';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // < bracket
  ctx.beginPath();
  ctx.moveTo(centerX - 40, glyphY - 40);
  ctx.lineTo(centerX - 80, glyphY);
  ctx.lineTo(centerX - 40, glyphY + 40);
  ctx.stroke();

  // / slash
  ctx.beginPath();
  ctx.moveTo(centerX + 20, glyphY - 50);
  ctx.lineTo(centerX - 20, glyphY + 50);
  ctx.stroke();

  // > bracket
  ctx.beginPath();
  ctx.moveTo(centerX + 40, glyphY - 40);
  ctx.lineTo(centerX + 80, glyphY);
  ctx.lineTo(centerX + 40, glyphY + 40);
  ctx.stroke();

  // Title — Space Grotesk Bold (display font)
  ctx.fillStyle = '#e8e8e8';
  ctx.font = 'bold 80px "Space Grotesk"';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Agentic Coding', centerX, 380);

  // Subtitle — Inter (body font)
  ctx.fillStyle = '#9b9b9b';
  ctx.font = '32px "Inter"';
  ctx.fillText('Master AI-assisted software engineering', centerX, 450);

  // 3px accent line — cyan-400
  ctx.fillStyle = '#00b2b2';
  ctx.fillRect(centerX - 150, 500, 300, 3);

  // Convert to buffer and save
  const buffer = canvas.toBuffer('image/png');
  const outputPath = join(__dirname, '..', 'website', 'static', 'img', 'social-card.png');

  await writeFile(outputPath, buffer);

  console.log(`Social card generated: ${outputPath}`);
  console.log(`  Dimensions: ${WIDTH}x${HEIGHT}px`);
  console.log(`  File size: ${(buffer.length / 1024).toFixed(1)}KB`);
}

generateSocialCard().catch(console.error);
