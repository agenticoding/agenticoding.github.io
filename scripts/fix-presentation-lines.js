#!/usr/bin/env node

/**
 * Fix Line Breaks in Existing Presentations
 *
 * Applies deterministic line breaking to existing presentation JSON files
 * to ensure all code blocks fit within the 60-character limit.
 *
 * Usage:
 *   node scripts/fix-presentation-lines.js --all              # Fix all presentations
 *   node scripts/fix-presentation-lines.js --file lesson-4.json  # Fix specific file
 *   node scripts/fix-presentation-lines.js --dry-run --all    # Show what would change
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { processPresentation } from './lib/line-breaker.js';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Line breaking has been disabled - this script is no longer functional
console.log('⚠️  Line breaking has been disabled in the presentation generation pipeline.');
console.log('ℹ️  This script is no longer functional and will not modify presentations.');
process.exit(0);

const PRESENTATIONS_DIR = join(__dirname, '../website/static/presentations');

/**
 * Parse command-line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    all: false,
    file: null,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--all') {
      config.all = true;
    } else if (args[i] === '--file' && i + 1 < args.length) {
      config.file = args[i + 1];
      i++;
    } else if (args[i] === '--dry-run') {
      config.dryRun = true;
    }
  }

  return config;
}

/**
 * Find all presentation JSON files (recursively)
 */
function findPresentationFiles(dir) {
  if (!existsSync(dir)) {
    console.error(`❌ Presentations directory not found: ${dir}`);
    return [];
  }

  const files = [];

  function traverse(currentDir) {
    const items = readdirSync(currentDir);

    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith('.json') && item !== 'manifest.json') {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files.sort();
}

/**
 * Analyze a presentation for line length issues
 */
function analyzePresentation(presentation) {
  const issues = [];
  let maxLineLength = 0;
  let totalLongLines = 0;

  for (const slide of presentation.slides || []) {
    // Check code slides
    if (slide.type === 'code' && slide.code) {
      const lines = slide.code.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].length > 60) {
          totalLongLines++;
          maxLineLength = Math.max(maxLineLength, lines[i].length);
          issues.push({
            slideTitle: slide.title || 'Untitled',
            location: 'code',
            line: i + 1,
            length: lines[i].length,
            preview: lines[i].substring(0, 50) + '...',
          });
        }
      }
    }

    // Check codeComparison slides
    if (slide.type === 'codeComparison') {
      if (slide.leftCode?.code) {
        const lines = slide.leftCode.code.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].length > 60) {
            totalLongLines++;
            maxLineLength = Math.max(maxLineLength, lines[i].length);
            issues.push({
              slideTitle: slide.title || 'Untitled',
              location: 'leftCode',
              line: i + 1,
              length: lines[i].length,
              preview: lines[i].substring(0, 50) + '...',
            });
          }
        }
      }
      if (slide.rightCode?.code) {
        const lines = slide.rightCode.code.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].length > 60) {
            totalLongLines++;
            maxLineLength = Math.max(maxLineLength, lines[i].length);
            issues.push({
              slideTitle: slide.title || 'Untitled',
              location: 'rightCode',
              line: i + 1,
              length: lines[i].length,
              preview: lines[i].substring(0, 50) + '...',
            });
          }
        }
      }
    }

    // Check codeExecution slides
    if (slide.type === 'codeExecution' && Array.isArray(slide.steps)) {
      for (let i = 0; i < slide.steps.length; i++) {
        if (slide.steps[i].line && typeof slide.steps[i].line === 'string') {
          // Split by newlines and check each line individually
          const lines = slide.steps[i].line.split('\n');
          for (let j = 0; j < lines.length; j++) {
            if (lines[j].length > 60) {
              totalLongLines++;
              maxLineLength = Math.max(maxLineLength, lines[j].length);
              issues.push({
                slideTitle: slide.title || 'Untitled',
                location: `step ${i + 1}, line ${j + 1}`,
                line: j + 1,
                length: lines[j].length,
                preview: lines[j].substring(0, 50) + '...',
              });
            }
          }
        }
      }
    }
  }

  return {
    totalLongLines,
    maxLineLength,
    issues: issues.slice(0, 5), // Show first 5 issues
    hasIssues: totalLongLines > 0,
  };
}

/**
 * Process a single presentation file
 */
function processFile(filePath, dryRun = false) {
  const fileName = basename(filePath);
  console.log(`\n📄 ${fileName}`);

  try {
    // Read and parse JSON
    const content = readFileSync(filePath, 'utf-8');
    const presentation = JSON.parse(content);

    // Analyze before processing
    const beforeAnalysis = analyzePresentation(presentation);

    if (!beforeAnalysis.hasIssues) {
      console.log('  ✅ No lines exceed 60 characters');
      return {
        success: true,
        changed: false,
        fileName,
      };
    }

    console.log(`  ⚠️  Found ${beforeAnalysis.totalLongLines} long lines (max: ${beforeAnalysis.maxLineLength} chars)`);

    if (beforeAnalysis.issues.length > 0) {
      console.log('  📍 Sample issues:');
      for (const issue of beforeAnalysis.issues) {
        console.log(`     - "${issue.slideTitle}" (${issue.location}): ${issue.length} chars`);
      }
    }

    // Apply line breaking
    const { presentation: processedPresentation, stats } = processPresentation(presentation);

    // Analyze after processing
    const afterAnalysis = analyzePresentation(processedPresentation);

    if (dryRun) {
      console.log(`  🔍 DRY RUN: Would fix ${stats.linesShortened} lines (max reduction: ${stats.maxReduction} chars)`);
      if (afterAnalysis.hasIssues) {
        console.log(`  ⚠️  ${afterAnalysis.totalLongLines} lines would still exceed limit`);
      } else {
        console.log('  ✅ All lines would be within limit after processing');
      }
    } else {
      // Write back
      writeFileSync(filePath, JSON.stringify(processedPresentation, null, 2), 'utf-8');
      console.log(`  ✂️  Fixed ${stats.linesShortened} lines (max reduction: ${stats.maxReduction} chars)`);

      if (afterAnalysis.hasIssues) {
        console.log(`  ⚠️  Warning: ${afterAnalysis.totalLongLines} lines still exceed limit`);
      } else {
        console.log('  ✅ All lines now within 60-character limit');
      }
    }

    return {
      success: true,
      changed: stats.linesShortened > 0,
      fileName,
      stats,
    };
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return {
      success: false,
      changed: false,
      fileName,
      error: error.message,
    };
  }
}

/**
 * Main execution
 */
function main() {
  const config = parseArgs();

  if (!config.all && !config.file) {
    console.log('Usage:');
    console.log('  node scripts/fix-presentation-lines.js --all');
    console.log('  node scripts/fix-presentation-lines.js --file lesson-4.json');
    console.log('  node scripts/fix-presentation-lines.js --dry-run --all');
    process.exit(1);
  }

  console.log('🔧 Fixing Presentation Line Breaks');
  console.log('=' .repeat(50));

  if (config.dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }

  let files = [];

  if (config.all) {
    files = findPresentationFiles(PRESENTATIONS_DIR);
    console.log(`\nFound ${files.length} presentation files\n`);
  } else if (config.file) {
    let filePath;

    // Handle absolute paths, relative paths from project root, or just filename
    if (config.file.startsWith('/')) {
      // Absolute path
      filePath = config.file;
    } else if (config.file.startsWith('website/')) {
      // Relative path from project root
      filePath = join(__dirname, '..', config.file);
    } else {
      // Just filename - look in PRESENTATIONS_DIR
      filePath = join(PRESENTATIONS_DIR, config.file);
    }

    if (!existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }

    files = [filePath];
  }

  // Process all files
  const results = files.map(file => processFile(file, config.dryRun));

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary\n');

  const successful = results.filter(r => r.success);
  const changed = results.filter(r => r.changed);
  const errors = results.filter(r => !r.success);

  console.log(`Total files processed: ${results.length}`);
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`✂️  Modified: ${changed.length}`);

  if (errors.length > 0) {
    console.log(`❌ Errors: ${errors.length}`);
    console.log('\nFailed files:');
    for (const result of errors) {
      console.log(`  - ${result.fileName}: ${result.error}`);
    }
  }

  if (changed.length > 0) {
    const totalLinesFixed = changed.reduce((sum, r) => sum + (r.stats?.linesShortened || 0), 0);
    const maxReduction = Math.max(...changed.map(r => r.stats?.maxReduction || 0));
    console.log(`\nTotal lines fixed: ${totalLinesFixed}`);
    console.log(`Maximum reduction: ${maxReduction} characters`);
  }

  if (config.dryRun) {
    console.log('\n💡 Run without --dry-run to apply changes');
  }

  console.log();
  process.exit(errors.length > 0 ? 1 : 0);
}

main();
