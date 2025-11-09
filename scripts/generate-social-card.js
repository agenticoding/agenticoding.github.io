#!/usr/bin/env node

import { createCanvas, loadImage } from 'canvas';
import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Open Graph standard dimensions
const WIDTH = 1200;
const HEIGHT = 630;

async function generateSocialCard() {
  console.log('Generating social card...');

  // Create canvas
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Solid color background (professional minimalist approach)
  ctx.fillStyle = '#7c3aed';  // Brand primary purple
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Add subtle radial overlay for depth without over-saturation
  const radialGradient = ctx.createRadialGradient(
    WIDTH / 2, HEIGHT / 2, 0,
    WIDTH / 2, HEIGHT / 2, WIDTH * 0.8
  );
  radialGradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)');  // Lighter purple center
  radialGradient.addColorStop(1, 'rgba(124, 58, 237, 0)');    // Transparent edges

  ctx.fillStyle = radialGradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Add a white/cream box in the center for the logo
  const boxSize = 200;
  const boxX = (WIDTH - boxSize) / 2;
  const boxY = 135;

  ctx.fillStyle = '#f5f5f0';
  ctx.fillRect(boxX, boxY, boxSize, boxSize);

  // Load and draw the logo SVG
  // For SVG, we need to use a workaround - load it as an image
  // The logo SVG needs to be converted first, or we can embed a simplified version

  // Draw a simplified version of the logo directly
  // Purple loop with fuchsia node
  const centerX = WIDTH / 2;
  const centerY = boxY + boxSize / 2;
  const radius = 50;

  // Draw the gapped circle (loop)
  ctx.strokeStyle = '#7c3aed';
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';

  const startAngle = (Math.PI / 180) * 10;
  const endAngle = (Math.PI / 180) * 280;

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, endAngle);
  ctx.stroke();

  // Draw the node (small square at top-right) - matches logo.svg positioning
  const nodeSize = 22;
  const nodeAngle = 36.9;  // Match logo.svg (was 45°, causing 8.1° misalignment)
  const nodeX = centerX + Math.cos((Math.PI / 180) * nodeAngle) * radius - nodeSize / 2;
  const nodeY = centerY - Math.sin((Math.PI / 180) * nodeAngle) * radius - nodeSize / 2;

  ctx.fillStyle = '#ec4899';
  ctx.beginPath();
  ctx.roundRect(nodeX, nodeY, nodeSize, nodeSize, 5);
  ctx.fill();

  // Add title text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 90px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const titleY = boxY + boxSize + 100;
  ctx.fillText('AI Coding Course', centerX, titleY);

  // Add subtitle text
  ctx.font = '32px sans-serif';
  const subtitleY = titleY + 70;
  ctx.fillText('Master AI-assisted software engineering for experienced developers', centerX, subtitleY);

  // Convert to buffer and save
  const buffer = canvas.toBuffer('image/png');
  const outputPath = join(__dirname, '..', 'website', 'static', 'img', 'social-card.png');

  await writeFile(outputPath, buffer);

  console.log(`✓ Social card generated: ${outputPath}`);
  console.log(`  Dimensions: ${WIDTH}x${HEIGHT}px`);
  console.log(`  File size: ${(buffer.length / 1024).toFixed(1)}KB`);
}

generateSocialCard().catch(console.error);
