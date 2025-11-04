#!/usr/bin/env node

/**
 * Podcast Script Generation Script
 *
 * Generates engaging podcast dialog scripts from MDX course content using Claude Code CLI:
 * 1. Scans all MDX files in website/docs/
 * 2. Converts technical content to conversational two-speaker dialogue using Haiku 4.5
 * 3. Saves markdown scripts to scripts/output/podcasts/
 * 4. Creates manifest mapping docs to scripts
 *
 * Usage:
 *   node scripts/generate-podcast-script.js          # Process only new/missing files
 *   node scripts/generate-podcast-script.js --force  # Regenerate all files
 *   node scripts/generate-podcast-script.js -f       # Shorthand for --force
 *
 * The script is idempotent by default:
 * - Skips files already in the manifest with valid content
 * - Use --force to regenerate existing files (e.g., after course content updates)
 * - Deletes output files before regeneration to ensure fresh writes
 *
 * Uses Claude Code CLI in headless mode with prompt engineering optimized for Haiku 4.5.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync, unlinkSync } from 'fs';
import { join, relative, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const DOCS_DIR = join(__dirname, '../website/docs');
const SCRIPT_OUTPUT_DIR = join(__dirname, 'output/podcasts');
const MANIFEST_PATH = join(SCRIPT_OUTPUT_DIR, 'manifest.json');

/**
 * Parse MDX/MD file and extract clean text content
 * Strips frontmatter, JSX components, and code blocks
 */
function parseMarkdownContent(filePath) {
  const content = readFileSync(filePath, 'utf-8');

  // Remove frontmatter
  let cleaned = content.replace(/^---[\s\S]*?---\n/, '');

  // Remove JSX components (simple approach - remove anything with <>)
  cleaned = cleaned.replace(/<[^>]+>/g, '');

  // Extract text from code blocks but label them
  cleaned = cleaned.replace(/```[\s\S]*?```/g, () => {
    return '[Code example omitted for audio]';
  });

  // Remove inline code
  cleaned = cleaned.replace(/`[^`]+`/g, (match) => match.replace(/`/g, ''));

  // Remove images
  cleaned = cleaned.replace(/!\[.*?\]\(.*?\)/g, '[Image]');

  // Clean up markdown links but keep text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // Clean up excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}

/**
 * Find all MDX/MD files recursively
 */
function findMarkdownFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const items = readdirSync(currentDir);

    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.match(/\.(md|mdx)$/i) && !item.includes('CLAUDE.md')) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files.sort();
}

/**
 * Generate podcast dialog prompt optimized for Claude Haiku 4.5
 * Based on ArguSeek research:
 * - Explicit, direct instructions
 * - Clear persona definition
 * - XML tags for structure
 * - Context-rich
 * - Action-oriented language
 * - Instructs Claude to write output directly to file
 */
function buildDialogPrompt(content, fileName, outputPath) {
  // Special handling for intro.md - add brief meta-acknowledgement
  const isIntro = fileName === 'intro';
  const metaCommentary = isIntro ? `

SPECIAL CONTEXT FOR THIS EPISODE - BRIEF META-ACKNOWLEDGEMENT:
This is the course introduction. When discussing how the course was developed using AI, include a SHORT moment of self-awareness:

REQUIREMENTS:
✓ Brief acknowledgement that this script was generated using AI tools
✓ Quick moment of self-awareness about the recursive nature (AI teaching about AI)
✓ Keep it light and concise - acknowledge the irony, then move on
✓ Integrate naturally into the conversation flow
✓ Maintain senior engineer sensibility

EXAMPLE APPROACH:
- Mention that the course (and this script) were developed using AI tools
- Brief observation about the recursive nature
- Quick return to the actual course content

LENGTH: Keep this to 3-5 exchanges maximum, then return to introducing the course content.` : '';

  return `You are a podcast script writer specializing in educational content for senior software engineers.

TASK: Convert the technical course material below into an engaging two-person podcast dialog.

SPEAKERS:
- Alex: Instructor with 15+ years experience. Teaching style: clear, measured, pedagogical. Guides the conversation and explains concepts thoroughly.
- Sam: Senior engineer with 8 years experience. Thoughtful, asks clarifying questions that peers would ask, connects concepts to real-world production scenarios.

TARGET AUDIENCE:
Senior software engineers (3+ years experience) who understand fundamentals. They want practical, production-focused insights. No hand-holding or basic explanations.

DIALOG STYLE REQUIREMENTS:
✓ DO: Create argument-driven content - make clear points, explore areas of nuance
✓ DO: Use storytelling and analogies to illustrate complex concepts
✓ DO: Reference real-world production scenarios and trade-offs
✓ DO: Keep the conversation natural and flowing
✓ DO: Have Sam ask relevant questions that advance understanding
✓ DO: Go deep on fewer points rather than surface-level on many
✓ DO: Maintain professional composure - engaging but measured
✓ DO: Include brief moments of insight or "aha" understanding

✗ AVOID: Excessive enthusiasm or exclamations
✗ AVOID: "Laundry lists" of points without depth
✗ AVOID: Dumbing down technical concepts
✗ AVOID: Marketing language or hype

OUTPUT FORMAT:
Use clear speaker labels followed by natural dialog. Structure your output within XML tags:

<podcast_dialog>
Alex: [natural dialog here]

Sam: [natural dialog here]

Alex: [natural dialog here]

[continue the conversation...]
</podcast_dialog>${metaCommentary}

LENGTH CONSTRAINT:
Target 6,000-7,500 tokens for the complete dialog. This ensures it fits within TTS API limits while maintaining quality. Prioritize depth over breadth.

TECHNICAL CONTENT TITLE: ${fileName}

TECHNICAL CONTENT:
${content}

IMPORTANT: Write the complete podcast dialog directly to the file: ${outputPath}

The file should contain ONLY the podcast dialog wrapped in XML tags - no preamble, no summary, no explanation.
Just write the raw dialog to the file now.`;
}

/**
 * Call Claude Code CLI in headless mode to generate dialog
 * Uses Haiku 4.5 for cost-effective, fast generation
 * Claude writes the dialog directly to the output file
 */
async function generateDialogWithClaude(prompt, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`  🤖 Calling Claude Code CLI (Haiku 4.5)...`);

    // Ensure output directory exists before Claude tries to write
    mkdirSync(dirname(outputPath), { recursive: true });

    // Spawn claude process with headless mode
    const claude = spawn('claude', [
      '-p',              // Headless mode (non-interactive)
      '--model', 'haiku', // Use Haiku 4.5
      '--allowedTools', 'Edit', 'Write' // Allow file editing and writing only
    ]);

    let stdout = '';
    let stderr = '';

    // Collect stdout
    claude.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    // Collect stderr
    claude.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Handle process completion
    claude.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr}`));
        return;
      }

      // Debug: Log Claude's response
      if (process.env.DEBUG) {
        console.log(`  🔍 DEBUG - Claude output:\n${stdout.slice(0, 300)}`);
      }

      // Check if Claude created the file
      if (!existsSync(outputPath)) {
        reject(new Error(
          `Claude did not create the output file: ${outputPath}\n` +
          `Claude response: ${stdout.slice(0, 200)}`
        ));
        return;
      }

      console.log(`  ✅ File created: ${outputPath}`);

      // Read the file content that Claude wrote
      let fileContent;
      try {
        fileContent = readFileSync(outputPath, 'utf-8');
      } catch (readError) {
        reject(new Error(`Failed to read created file: ${readError.message}`));
        return;
      }

      // Extract dialog from XML tags in the file
      const match = fileContent.match(/<podcast_dialog>([\s\S]*?)<\/podcast_dialog>/);
      if (!match) {
        reject(new Error(
          `File exists but missing XML tags.\n` +
          `File preview: ${fileContent.slice(0, 200)}...`
        ));
        return;
      }

      const dialog = match[1].trim();
      console.log(`  ✅ Extracted dialog (${dialog.split('\n').length} lines)`);
      resolve(dialog);
    });

    // Handle errors
    claude.on('error', (err) => {
      reject(new Error(`Failed to spawn Claude CLI: ${err.message}. Is 'claude' installed and in PATH?`));
    });

    // Send prompt to stdin
    claude.stdin.write(prompt);
    claude.stdin.end();
  });
}

/**
 * Count approximate tokens (rough estimate: ~4 chars per token)
 */
function estimateTokenCount(text) {
  return Math.ceil(text.length / 4);
}

/**
 * Save podcast script as markdown with frontmatter
 */
function saveScript(dialog, sourcePath, outputPath, fileName) {
  const tokenCount = estimateTokenCount(dialog);
  const relativePath = relative(DOCS_DIR, sourcePath);

  const markdown = `---
source: ${relativePath}
speakers:
  - name: Alex
    role: Instructor
    voice: Kore
  - name: Sam
    role: Senior Engineer
    voice: Charon
generatedAt: ${new Date().toISOString()}
model: claude-haiku-4.5
tokenCount: ${tokenCount}
---

${dialog}
`;

  // Ensure output directory exists
  mkdirSync(dirname(outputPath), { recursive: true });

  writeFileSync(outputPath, markdown, 'utf-8');

  return {
    tokenCount,
    size: Buffer.byteLength(markdown, 'utf-8')
  };
}

/**
 * Process a single markdown file
 */
async function processFile(filePath, manifest, force = false) {
  const relativePath = relative(DOCS_DIR, filePath);
  const fileName = basename(filePath, extname(filePath));

  console.log(`\n📄 Processing: ${relativePath}`);

  try {
    // Parse content
    const content = parseMarkdownContent(filePath);

    if (content.length < 100) {
      console.log(`  ⚠️  Skipping - content too short`);
      return;
    }

    // Determine output path (needed for prompt)
    const outputFileName = `${fileName}.md`;
    const outputPath = join(SCRIPT_OUTPUT_DIR, dirname(relativePath), outputFileName);

    // Skip if already processed (unless forcing)
    // Check both manifest entry AND file existence
    if (!force && manifest[relativePath]) {
      const entry = manifest[relativePath];
      if (entry.tokenCount && entry.size && existsSync(outputPath)) {
        console.log(`  ⏭️  Already processed - skipping (use --force to regenerate)`);
        return 'skipped';
      }
    }

    // Delete existing output file to ensure fresh write (prevents Claude from matching existing format)
    if (existsSync(outputPath)) {
      unlinkSync(outputPath);
      console.log(`  🗑️  Deleted existing file for fresh generation`);
    }

    // Build prompt optimized for Haiku 4.5 with output path
    const prompt = buildDialogPrompt(content, fileName, outputPath);

    // Generate dialog using Claude Code CLI (Claude writes directly to outputPath)
    const dialog = await generateDialogWithClaude(prompt, outputPath);

    // Save script with frontmatter (overwrites raw XML file Claude created)
    const scriptInfo = saveScript(dialog, filePath, outputPath, fileName);

    // Update manifest
    const scriptUrl = relative(SCRIPT_OUTPUT_DIR, outputPath);
    manifest[relativePath] = {
      scriptPath: scriptUrl,
      size: scriptInfo.size,
      tokenCount: scriptInfo.tokenCount,
      generatedAt: new Date().toISOString()
    };

    console.log(`  ✅ Saved: ${scriptUrl}`);
    console.log(`  📊 Token count: ${scriptInfo.tokenCount}`);
    console.log(`  📊 Size: ${(scriptInfo.size / 1024).toFixed(2)} KB`);

    return 'processed';

  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    console.error(`  Skipping this file and continuing...`);
    // Rethrow so the error counter increments
    throw error;
  }
}

/**
 * Process files with concurrency limit
 */
async function processFilesWithConcurrency(files, manifest, concurrency = 3, force = false) {
  const results = { processed: 0, failed: 0, skipped: 0, failedFiles: [] };

  // Process files in batches of `concurrency`
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);

    console.log(`\n🔄 Processing batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(files.length / concurrency)} (${batch.length} files concurrently)...`);

    // Process batch concurrently
    await Promise.all(
      batch.map(async (file) => {
        try {
          const result = await processFile(file, manifest, force);
          if (result === 'skipped') {
            results.skipped++;
          } else if (result === 'processed') {
            results.processed++;
          }
        } catch (error) {
          console.error(`\n❌ Failed to process ${file}:`, error.message);
          results.failed++;
          results.failedFiles.push(relative(DOCS_DIR, file));
        }
      })
    );
  }

  return results;
}

/**
 * Main execution
 */
async function main() {
  // Parse command-line arguments
  const args = process.argv.slice(2);
  const force = args.includes('--force') || args.includes('-f');

  console.log('🎭 AI Coding Course - Podcast Script Generator\n');
  console.log(`📂 Docs directory: ${DOCS_DIR}`);
  console.log(`📝 Script output: ${SCRIPT_OUTPUT_DIR}`);
  console.log(`🤖 Model: Claude Haiku 4.5 (via Claude Code CLI)`);
  if (force) {
    console.log(`🔄 Force mode: Regenerating all files`);
  }

  // Find all markdown files
  const files = findMarkdownFiles(DOCS_DIR);
  console.log(`\n📚 Found ${files.length} markdown files\n`);

  // Load existing manifest or create new
  let manifest = {};
  if (existsSync(MANIFEST_PATH)) {
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
    console.log(`📋 Loaded existing manifest with ${Object.keys(manifest).length} entries\n`);
  }

  // Process files with concurrency limit of 3
  const results = await processFilesWithConcurrency(files, manifest, 3, force);

  // Save manifest
  mkdirSync(dirname(MANIFEST_PATH), { recursive: true });
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');

  console.log('\n' + '='.repeat(60));
  console.log('✨ Podcast script generation complete!\n');
  console.log(`📊 Summary:`);
  console.log(`   ✅ Processed: ${results.processed}`);
  console.log(`   ⏭️  Skipped: ${results.skipped}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   📁 Total files: ${files.length}`);

  if (results.failedFiles.length > 0) {
    console.log(`\n⚠️  Failed files:`);
    results.failedFiles.forEach(file => {
      console.log(`     - ${file}`);
    });
  }

  console.log(`\n📋 Manifest saved to: ${MANIFEST_PATH}`);
  console.log('='.repeat(60));
}

// Run
main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
