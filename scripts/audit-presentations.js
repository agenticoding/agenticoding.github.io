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
const MAX_WORDS = 5;

// Single source of truth: RevealSlideshow.tsx
const REVEAL_SLIDESHOW_PATH = join(
  __dirname,
  '../website/src/components/PresentationMode/RevealSlideshow.tsx'
);

function getValidVisualComponents() {
  const content = readFileSync(REVEAL_SLIDESHOW_PATH, 'utf-8');
  const match = content.match(/const VISUAL_COMPONENTS = \{([^}]+)\}/);
  if (!match) {
    throw new Error('Could not find VISUAL_COMPONENTS in RevealSlideshow.tsx');
  }
  return match[1]
    .split(',')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('//'))
    .map(line => line.split(':')[0].trim());
}

function auditPresentation(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const presentation = JSON.parse(content);
  const violations = [];
  const wordCountViolations = [];

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

  // Check takeaway word counts
  const takeawaySlides = presentation.slides.filter(s => s.type === 'takeaway');
  for (const slide of takeawaySlides) {
    if (slide.content && Array.isArray(slide.content)) {
      slide.content.forEach((item, index) => {
        const wordCount = item.trim().split(/\s+/).length;
        if (wordCount > MAX_WORDS) {
          wordCountViolations.push({
            type: 'takeaway',
            slide: slide.title,
            index: index + 1,
            wordCount,
            content: item,
            excess: wordCount - MAX_WORDS
          });
        }
      });
    }
  }

  // Check learning objectives word counts
  const objectives = presentation.metadata?.learningObjectives || [];
  objectives.forEach((objective, index) => {
    const wordCount = objective.trim().split(/\s+/).length;
    if (wordCount > MAX_WORDS) {
      wordCountViolations.push({
        type: 'objective',
        index: index + 1,
        wordCount,
        content: objective,
        excess: wordCount - MAX_WORDS
      });
    }
  });

  // Check visual component references
  const validComponents = getValidVisualComponents();
  const componentViolations = [];
  const visualSlides = presentation.slides.filter(s => s.type === 'visual');
  for (const slide of visualSlides) {
    if (slide.component && !validComponents.includes(slide.component)) {
      componentViolations.push({
        slide: slide.title,
        component: slide.component
      });
    }
  }

  return {
    title: presentation.metadata?.title || 'Unknown',
    violations,
    wordCountViolations,
    componentViolations,
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

  console.log('📊 Auditing presentations for violations\n');
  console.log('Checking:');
  console.log('  • Content arrays (3-5 items rule)');
  console.log('  • Takeaway word counts (5 words max)');
  console.log('  • Learning objectives word counts (5 words max)');
  console.log('  • Visual component references (must be registered)\n');

  const results = [];
  let totalViolations = 0;
  let totalWordCountViolations = 0;
  let totalComponentViolations = 0;

  for (const file of files) {
    const filePath = join(presentationsDir, file);
    try {
      const result = auditPresentation(filePath);
      results.push({ file, ...result });

      const hasViolations = result.violations.length > 0;
      const hasWordViolations = result.wordCountViolations.length > 0;
      const hasComponentViolations = result.componentViolations.length > 0;

      if (hasViolations || hasWordViolations || hasComponentViolations) {
        console.log(`❌ ${file}`);
        console.log(`   Title: ${result.title}`);

        if (hasViolations) {
          totalViolations += result.violations.length;
          console.log(`   Content array violations (${result.violations.length}):`);
          result.violations.forEach(v => {
            console.log(`   - "${v.slide}" (${v.type}): ${v.count} items`);
            if (v.count <= 8) {
              v.items.forEach(item => {
                const truncated = item.length > 60 ? item.substring(0, 57) + '...' : item;
                console.log(`     • ${truncated}`);
              });
            }
          });
        }

        if (hasWordViolations) {
          totalWordCountViolations += result.wordCountViolations.length;
          console.log(`   Word count violations (${result.wordCountViolations.length}):`);
          result.wordCountViolations.forEach(v => {
            if (v.type === 'takeaway') {
              console.log(`   - Takeaway "${v.slide}" item ${v.index}: ${v.wordCount} words (+${v.excess})`);
            } else {
              console.log(`   - Learning objective ${v.index}: ${v.wordCount} words (+${v.excess})`);
            }
            const truncated = v.content.length > 60 ? v.content.substring(0, 57) + '...' : v.content;
            console.log(`     "${truncated}"`);
          });
        }

        if (hasComponentViolations) {
          totalComponentViolations += result.componentViolations.length;
          console.log(`   Invalid visual components (${result.componentViolations.length}):`);
          result.componentViolations.forEach(v => {
            console.log(`   - Slide "${v.slide}": component "${v.component}" is not registered`);
          });
        }

        console.log('');
      }
    } catch (error) {
      console.log(`⚠️  ${file}: Error reading file - ${error.message}\n`);
    }
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  const violatingFiles = results.filter(r =>
    r.violations.length > 0 || r.wordCountViolations.length > 0 || r.componentViolations.length > 0
  );

  if (violatingFiles.length === 0) {
    console.log('✅ All presentations pass validation!');
  } else {
    console.log(`\n📋 SUMMARY:\n`);
    console.log(`Total files audited: ${results.length}`);
    console.log(`Files with violations: ${violatingFiles.length}`);
    console.log(`  • Content array violations: ${totalViolations}`);
    console.log(`  • Word count violations: ${totalWordCountViolations}`);
    console.log(`  • Invalid component violations: ${totalComponentViolations}`);
    console.log(`  • Total: ${totalViolations + totalWordCountViolations + totalComponentViolations}\n`);
    console.log('Files needing regeneration:');
    violatingFiles.forEach(r => {
      const arrayViolations = r.violations.length;
      const wordViolations = r.wordCountViolations.length;
      const compViolations = r.componentViolations.length;
      const total = arrayViolations + wordViolations + compViolations;
      const details = [];
      if (arrayViolations > 0) details.push(`${arrayViolations} array`);
      if (wordViolations > 0) details.push(`${wordViolations} word`);
      if (compViolations > 0) details.push(`${compViolations} component`);
      console.log(`  - ${r.file} (${total} total: ${details.join(', ')})`);
    });
  }
  console.log('═══════════════════════════════════════════════════════════');
}

main();
