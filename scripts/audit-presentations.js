#!/usr/bin/env node

/**
 * Audit all presentations for content array violations (3-5 items rule)
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIN_ITEMS = 3;
const MAX_ITEMS = 5;

function auditPresentation(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const presentation = JSON.parse(content);
  const violations = [];

  // Check slides with content arrays
  const slidesWithContent = presentation.slides.filter(slide => {
    if (slide.type === 'title') return false;
    return slide.content && Array.isArray(slide.content);
  });

  for (const slide of slidesWithContent) {
    const contentLength = slide.content.length;
    if (contentLength < MIN_ITEMS || contentLength > MAX_ITEMS) {
      violations.push({
        slide: slide.title || slide.type,
        type: slide.type,
        count: contentLength,
        items: slide.content
      });
    }
  }

  // Check comparison slides (left/right content)
  const comparisonSlides = presentation.slides.filter(s =>
    s.type === 'comparison' || s.type === 'marketingReality'
  );

  for (const slide of comparisonSlides) {
    const leftContent = slide.left?.content || slide.metaphor?.content;
    const rightContent = slide.right?.content || slide.reality?.content;

    if (leftContent && Array.isArray(leftContent)) {
      const leftLength = leftContent.length;
      if (leftLength < MIN_ITEMS || leftLength > MAX_ITEMS) {
        violations.push({
          slide: `${slide.title} (LEFT)`,
          type: slide.type,
          count: leftLength,
          items: leftContent
        });
      }
    }

    if (rightContent && Array.isArray(rightContent)) {
      const rightLength = rightContent.length;
      if (rightLength < MIN_ITEMS || rightLength > MAX_ITEMS) {
        violations.push({
          slide: `${slide.title} (RIGHT)`,
          type: slide.type,
          count: rightLength,
          items: rightContent
        });
      }
    }
  }

  return {
    title: presentation.metadata?.title || 'Unknown',
    violations,
    totalSlides: presentation.slides.length
  };
}

function main() {
  const presentationsDir = join(__dirname, '../website/static/presentations');
  const files = [
    'intro.json',
    'methodology/lesson-3-high-level-methodology.json',
    'methodology/lesson-4-prompting-101.json',
    'methodology/lesson-5-grounding.json',
    'practical-techniques/lesson-6-project-onboarding.json',
    'practical-techniques/lesson-7-planning-execution.json',
    'practical-techniques/lesson-8-tests-as-guardrails.json',
    'practical-techniques/lesson-9-reviewing-code.json',
    'practical-techniques/lesson-10-debugging.json',
    'understanding-the-tools/lesson-1-intro.json',
    'understanding-the-tools/lesson-2-understanding-agents.json'
  ];

  console.log('📊 Auditing presentations for content array violations (3-5 items rule)\n');

  const results = [];
  let totalViolations = 0;

  for (const file of files) {
    const filePath = join(presentationsDir, file);
    try {
      const result = auditPresentation(filePath);
      results.push({ file, ...result });

      if (result.violations.length > 0) {
        totalViolations += result.violations.length;
        console.log(`❌ ${file}`);
        console.log(`   Title: ${result.title}`);
        result.violations.forEach(v => {
          console.log(`   - "${v.slide}" (${v.type}): ${v.count} items`);
          if (v.count <= 8) {
            v.items.forEach(item => {
              const truncated = item.length > 60 ? item.substring(0, 57) + '...' : item;
              console.log(`     • ${truncated}`);
            });
          }
        });
        console.log('');
      }
    } catch (error) {
      console.log(`⚠️  ${file}: Error reading file - ${error.message}\n`);
    }
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  const violatingFiles = results.filter(r => r.violations.length > 0);

  if (violatingFiles.length === 0) {
    console.log('✅ All presentations pass validation!');
  } else {
    console.log(`\n📋 SUMMARY:\n`);
    console.log(`Total files audited: ${results.length}`);
    console.log(`Files with violations: ${violatingFiles.length}`);
    console.log(`Total violations: ${totalViolations}\n`);
    console.log('Files needing regeneration:');
    violatingFiles.forEach(r => {
      console.log(`  - ${r.file} (${r.violations.length} violation(s))`);
    });
  }
  console.log('═══════════════════════════════════════════════════════════');
}

main();
