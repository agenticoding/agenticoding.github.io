const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  await page.goto('http://localhost:3000/practical-techniques/lesson-6-context-management');
  await page.waitForTimeout(4000);
  
  const outDir = '/tmp/context-pressure-panel-screenshots';
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
  
  async function getPanelBBox() {
    return page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll('div')).filter(el => el.textContent.trim() === 'Context Window');
      if (headers.length === 0) return null;
      const panel = headers[0].parentElement;
      const rect = panel.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    });
  }
  
  async function screenshotPanel(name) {
    const bbox = await getPanelBBox();
    if (!bbox) {
      console.log('Panel not found for', name);
      return;
    }
    const screenshotPath = path.join(outDir, `${name.replace(/[()]/g, '').replace(/\s+/g, '-').toLowerCase()}-panel.png`);
    await page.screenshot({ 
      path: screenshotPath,
      clip: { x: Math.floor(bbox.x), y: Math.floor(bbox.y), width: Math.ceil(bbox.width), height: Math.ceil(bbox.height) }
    });
    console.log('Screenshot:', screenshotPath);
  }
  
  for (const preset of presets) {
    await page.locator('button', { hasText: preset }).click();
    await page.waitForTimeout(1000);
    await screenshotPanel(preset);
  }
  
  // Custom: max context files to 20K
  const ctxSlider = await page.locator('div:has(> span:has-text("Context Files")) input[type="range"]');
  await ctxSlider.fill('20000');
  await page.waitForTimeout(500);
  await screenshotPanel('custom-context-files-20k');
  
  // Max tools
  const toolSlider = await page.locator('div:has(> span:has-text("Installed Tools")) input[type="range"]');
  await toolSlider.fill('200');
  await page.waitForTimeout(500);
  await screenshotPanel('custom-tools-200');
  
  // Max turns
  const turnSlider = await page.locator('div:has(> span:has-text("Conv. Turns")) input[type="range"]');
  await turnSlider.fill('20');
  await page.waitForTimeout(500);
  await screenshotPanel('custom-turns-20');
  
  // Disable compaction
  const compactionCheckbox = await page.locator('label:has-text("Compaction buffer") input[type="checkbox"]');
  await compactionCheckbox.click();
  await page.waitForTimeout(500);
  await screenshotPanel('custom-no-compaction');
  
  await browser.close();
  console.log('All panel screenshots saved to', outDir);
})();
