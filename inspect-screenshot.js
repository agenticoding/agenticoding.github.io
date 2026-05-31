const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  await page.goto('http://localhost:3000/practical-techniques/lesson-6-context-management');
  await page.waitForTimeout(4000); // wait for hydration
  
  const outDir = '/tmp/context-pressure-screenshots';
  fs.mkdirSync(outDir, { recursive: true });
  
  const presets = [
    'Fresh Session',
    'Normal Session',
    'Heavy MCP (eager)',
    'Heavy MCP (deferred)',
    'Deep Conversation',
    'Skill-Heavy',
    'Near Compaction',
    'Overloaded',
  ];
  
  // Find the diagram by looking for the "Your Config" header
  const diagram = await page.locator('div:has(> div:has-text("Your Config")):has(> div:has-text("Context Window")):has(> div:has-text("Attention"))').first();
  
  for (const preset of presets) {
    await page.locator('button', { hasText: preset }).click();
    await page.waitForTimeout(1000); // wait for transitions
    const screenshotPath = path.join(outDir, `${preset.replace(/[()]/g, '').replace(/\s+/g, '-').toLowerCase()}.png`);
    await diagram.screenshot({ path: screenshotPath });
    console.log('Screenshot:', screenshotPath);
  }
  
  // Custom configs
  // Max context files
  const ctxSlider = await page.locator('div:has(> span:has-text("Context Files")) input[type="range"]');
  await ctxSlider.fill('20000');
  await page.waitForTimeout(500);
  await diagram.screenshot({ path: path.join(outDir, 'custom-context-files-20k.png') });
  
  // Max tools
  const toolSlider = await page.locator('div:has(> span:has-text("Installed Tools")) input[type="range"]');
  await toolSlider.fill('200');
  await page.waitForTimeout(500);
  await diagram.screenshot({ path: path.join(outDir, 'custom-tools-200.png') });
  
  // Max turns
  const turnSlider = await page.locator('div:has(> span:has-text("Conv. Turns")) input[type="range"]');
  await turnSlider.fill('20');
  await page.waitForTimeout(500);
  await diagram.screenshot({ path: path.join(outDir, 'custom-turns-20.png') });
  
  // Disable compaction
  const compactionCheckbox = await page.locator('label:has-text("Compaction buffer") input[type="checkbox"]');
  await compactionCheckbox.click();
  await page.waitForTimeout(500);
  await diagram.screenshot({ path: path.join(outDir, 'custom-no-compaction.png') });
  
  // Re-enable compaction
  await compactionCheckbox.click();
  await page.waitForTimeout(500);
  
  // Enable toolSearch
  const toolSearchCheckbox = await page.locator('label:has-text("ToolSearch") input[type="checkbox"]');
  await toolSearchCheckbox.click();
  await page.waitForTimeout(500);
  await diagram.screenshot({ path: path.join(outDir, 'custom-toolsearch.png') });
  
  await browser.close();
  console.log('All screenshots saved to', outDir);
})();
