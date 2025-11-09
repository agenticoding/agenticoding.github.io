#!/usr/bin/env node

/**
 * Presentation Generation Script
 *
 * Generates presentation slides from MDX course content using AI:
 * 1. Parses MDX lesson content
 * 2. Uses Claude Code CLI (Haiku 4.5) to condense into presentation slides
 * 3. Generates structured JSON with slides, speaker notes, and metadata
 *
 * Modes:
 * - Default: Interactive file selection → generate presentation
 * - --all: Batch process all files
 * - --file <path>: Process specific file
 * - --module <name>: Process all files in module directory
 * - --debug: Save prompt for validation
 *
 * Usage:
 *   node scripts/generate-presentation.js                 # Interactive
 *   node scripts/generate-presentation.js --all           # Batch: all files
 *   node scripts/generate-presentation.js --file intro.md # Specific file
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync, unlinkSync } from 'fs';
import { join, relative, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import * as readline from 'readline';
import { parseMarkdownContent } from './lib/markdown-parser.js';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const DOCS_DIR = join(__dirname, '../website/docs');
const OUTPUT_DIR = join(__dirname, 'output/presentations');
const STATIC_OUTPUT_DIR = join(__dirname, '../website/static/presentations');
const MANIFEST_PATH = join(OUTPUT_DIR, 'manifest.json');

// Parse command-line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    mode: 'interactive',
    file: null,
    module: null,
    debug: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--all') {
      config.mode = 'batch';
    } else if (arg === '--file') {
      config.mode = 'batch';
      config.file = args[++i];
    } else if (arg === '--module') {
      config.mode = 'batch';
      config.module = args[++i];
    } else if (arg === '--debug') {
      config.debug = true;
    }
  }

  return config;
}

// ============================================================================
// CONTENT PARSING - Uses shared markdown-parser library
// ============================================================================
// (Functions imported from ./lib/markdown-parser.js)

// ============================================================================
// PRESENTATION PROMPT
// ============================================================================

/**
 * Generate presentation slides prompt optimized for Claude Haiku 4.5
 */
function buildPresentationPrompt(content, fileName, outputPath) {
  return `You are a presentation script writer specializing in educational content for senior software engineers.

TASK: Convert the technical course material below into a concise, visual presentation format for classroom teaching.

TARGET AUDIENCE:
Senior software engineers (3+ years experience) who want practical, production-focused insights. They don't need hand-holding.

PRESENTATION CONTEXT:
This presentation will be shown in a classroom using Reveal.js. The instructor needs:
- Clear, visual slides with minimal text (bullet points, not paragraphs)
- Speaker notes with detailed talking points and timing guidance
- Code examples that demonstrate key concepts
- Logical flow with clear transitions

PRESENTATION STRUCTURE REQUIREMENTS:

✓ DO: Create 8-15 slides total (no more, no less)
✓ DO: Each slide should cover ONE key concept or example
✓ DO: Use bullet points with 3-5 items per slide maximum
✓ DO: Include transitions between conceptual sections
✓ DO: Add speaker notes with:
  - Talking points that expand on slide content
  - Timing guidance (e.g., "Spend 2-3 minutes on this")
  - Discussion prompts or questions to ask students
  - Real-world examples to reference
✓ DO: Preserve important code examples as slide content
✓ DO: Identify which visual components to use (CapabilityMatrix, UShapeAttentionCurve, etc.)

✗ AVOID: Long paragraphs on slides (slides are visual anchors, not reading material)
✗ AVOID: More than 5 bullet points per slide
✗ AVOID: Redundant slides covering the same concept
✗ AVOID: Skipping critical concepts from the lesson
✗ AVOID: Technical jargon without context in speaker notes

SLIDE TYPES:

1. **Title Slide**: Lesson title, learning objectives
2. **Concept Slide**: Key idea with 3-5 bullet points
3. **Code Example Slide**: Code snippet with context
4. **Comparison Slide**: Effective vs ineffective patterns
5. **Visual Slide**: Custom component (CapabilityMatrix, etc.)
6. **Key Takeaway Slide**: Summary of section or lesson

HANDLING CODE BLOCKS:

The source material includes code blocks tagged like:
- [INEFFECTIVE CODE EXAMPLE: ...] - Shows what NOT to do
- [EFFECTIVE CODE EXAMPLE: ...] - Shows the correct approach
- [CODE PATTERN: ...] - Demonstrates a structure
- [CODE EXAMPLE: ...] - General code reference

For presentation slides:
✓ Include the most illustrative code examples (2-4 per presentation)
✓ Add context in speaker notes about what the code demonstrates
✓ For comparison slides, show ineffective and effective side-by-side
✓ Keep code snippets under 15 lines for readability
✗ Don't include every code example from the lesson
✗ Don't show code without explaining its purpose

SPEAKER NOTES GUIDELINES:

For each slide, provide speaker notes with:
1. **Talking points**: What to say (2-4 sentences)
2. **Timing**: Estimated time to spend (e.g., "2 minutes")
3. **Discussion prompts**: Questions to engage students
4. **Real-world context**: Production scenarios to reference
5. **Transition**: How to move to next slide

Example speaker notes:
\`\`\`
Talking points: This slide shows the difference between vague and specific prompts. The vague version gives no context, forcing the AI to guess. The specific version provides language, standard, edge cases, and return type.

Timing: 3-4 minutes - this is a critical concept

Discussion: Ask students to share examples of vague prompts they've used. Have them identify what's missing.

Real-world: In production, vague prompts lead to code that compiles but doesn't meet requirements. Specific prompts reduce iteration cycles from 5+ to 1-2.

Transition: "Now that we understand specificity, let's look at how to structure prompts for different tasks..."
\`\`\`

OUTPUT FORMAT:

You must generate a valid JSON file with this structure:

{
  "metadata": {
    "title": "Lesson Title",
    "lessonId": "lesson-id",
    "estimatedDuration": "30-45 minutes",
    "learningObjectives": ["Objective 1", "Objective 2", "Objective 3"]
  },
  "slides": [
    {
      "type": "title",
      "title": "Lesson Title",
      "subtitle": "Brief tagline",
      "content": [],
      "speakerNotes": {
        "talkingPoints": "...",
        "timing": "1 minute",
        "discussion": "...",
        "context": "...",
        "transition": "..."
      }
    },
    {
      "type": "concept",
      "title": "Slide Title",
      "content": [
        "Bullet point 1",
        "Bullet point 2",
        "Bullet point 3"
      ],
      "speakerNotes": { ... }
    },
    {
      "type": "code",
      "title": "Code Example Title",
      "language": "typescript",
      "code": "function example() { ... }",
      "caption": "Brief explanation",
      "speakerNotes": { ... }
    },
    {
      "type": "comparison",
      "title": "Ineffective vs Effective",
      "left": {
        "label": "Ineffective",
        "content": ["Point 1", "Point 2"]
      },
      "right": {
        "label": "Effective",
        "content": ["Point 1", "Point 2"]
      },
      "speakerNotes": { ... }
    },
    {
      "type": "visual",
      "title": "Visual Component",
      "component": "CapabilityMatrix",
      "caption": "Description of what the visual shows",
      "speakerNotes": { ... }
    },
    {
      "type": "takeaway",
      "title": "Key Takeaways",
      "content": [
        "Takeaway 1",
        "Takeaway 2",
        "Takeaway 3"
      ],
      "speakerNotes": { ... }
    }
  ]
}

CRITICAL REQUIREMENTS:

1. The output MUST be valid JSON - no preamble, no explanation, just the JSON object
2. Write the JSON directly to the file: ${outputPath}
3. Include 8-15 slides (no more, no less)
4. Every slide MUST have speakerNotes with all fields
5. Code examples must be actual code from the lesson, not pseudocode
6. Content arrays must have 3-5 items (except title slide)

TECHNICAL CONTENT TITLE: ${fileName}

TECHNICAL CONTENT:
${content}

IMPORTANT: Write the complete presentation JSON directly to the file: ${outputPath}

The file should contain ONLY valid JSON - no preamble, no markdown, no explanation.
Just write the raw JSON to the file now.`;
}

/**
 * Call Claude Code CLI in headless mode to generate presentation
 */
async function generatePresentationWithClaude(prompt, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`  🤖 Calling Claude Code CLI (Haiku 4.5)...`);

    // Ensure output directory exists
    mkdirSync(dirname(outputPath), { recursive: true });

    // Spawn claude process with headless mode
    const claude = spawn('claude', [
      '-p',              // Headless mode
      '--model', 'haiku', // Use Haiku 4.5
      '--allowedTools', 'Edit', 'Write' // Allow file editing and writing only
    ]);

    let stdout = '';
    let stderr = '';

    claude.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    claude.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    claude.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr}`));
        return;
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

      // Read and validate JSON
      let fileContent;
      try {
        fileContent = readFileSync(outputPath, 'utf-8');
        const presentation = JSON.parse(fileContent);

        // Validate structure
        if (!presentation.metadata || !presentation.slides) {
          reject(new Error('Invalid presentation structure - missing metadata or slides'));
          return;
        }

        if (presentation.slides.length < 8 || presentation.slides.length > 15) {
          console.log(`  ⚠️  Warning: ${presentation.slides.length} slides (expected 8-15)`);
        }

        console.log(`  ✅ Valid presentation JSON (${presentation.slides.length} slides)`);
        resolve(presentation);
      } catch (parseError) {
        reject(new Error(`Failed to parse JSON: ${parseError.message}\nContent preview: ${fileContent?.slice(0, 200)}`));
        return;
      }
    });

    claude.on('error', (err) => {
      reject(new Error(`Failed to spawn Claude CLI: ${err.message}. Is 'claude' installed and in PATH?`));
    });

    // Send prompt to stdin
    claude.stdin.write(prompt);
    claude.stdin.end();
  });
}

// ============================================================================
// FILE DISCOVERY AND SELECTION
// ============================================================================

/**
 * Find all markdown files recursively
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
 * Filter files based on config
 */
function filterFiles(files, config, baseDir) {
  if (config.file) {
    const targetFile = join(baseDir, config.file);
    return files.filter(f => f === targetFile);
  }

  if (config.module) {
    const modulePath = join(baseDir, config.module);
    return files.filter(f => f.startsWith(modulePath));
  }

  return files;
}

/**
 * Interactive file selection
 */
async function promptSelectFile(files, baseDir) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log(`\n📚 Available files:\n`);

    files.forEach((file, index) => {
      const relativePath = relative(baseDir, file);
      console.log(`  ${index + 1}. ${relativePath}`);
    });

    console.log('\n');

    rl.question('Select a file by number (or press Ctrl+C to exit): ', (answer) => {
      rl.close();

      const selection = parseInt(answer, 10);

      if (isNaN(selection) || selection < 1 || selection > files.length) {
        reject(new Error(`Invalid selection: ${answer}. Please enter a number between 1 and ${files.length}.`));
        return;
      }

      resolve([files[selection - 1]]);
    });
  });
}

// ============================================================================
// PROCESSING
// ============================================================================

/**
 * Generate presentation for a file
 */
async function generatePresentation(filePath, manifest, config) {
  const relativePath = relative(DOCS_DIR, filePath);
  const fileName = basename(filePath, extname(filePath));

  console.log(`\n📄 Generating presentation: ${relativePath}`);

  try {
    // Parse content
    const content = parseMarkdownContent(filePath);

    if (content.length < 100) {
      console.log(`  ⚠️  Skipping - content too short`);
      return null;
    }

    // Determine output path
    const outputFileName = `${fileName}.json`;
    const outputPath = join(OUTPUT_DIR, dirname(relativePath), outputFileName);

    // Delete existing output file
    if (existsSync(outputPath)) {
      unlinkSync(outputPath);
      console.log(`  🗑️  Deleted existing file for fresh generation`);
    }

    // Build prompt
    const prompt = buildPresentationPrompt(content, fileName, outputPath);

    // Debug mode: save prompt
    if (config.debug) {
      const debugPath = outputPath.replace('.json', '.debug-prompt.txt');
      mkdirSync(dirname(debugPath), { recursive: true });
      writeFileSync(debugPath, prompt, 'utf-8');
      console.log(`  🔍 Debug prompt saved: ${debugPath}`);
    }

    // Generate presentation using Claude
    const presentation = await generatePresentationWithClaude(prompt, outputPath);

    // Copy to static directory for deployment
    const staticPath = join(STATIC_OUTPUT_DIR, dirname(relativePath), outputFileName);
    mkdirSync(dirname(staticPath), { recursive: true });
    writeFileSync(staticPath, JSON.stringify(presentation, null, 2), 'utf-8');

    // Update manifest
    const presentationUrl = `/presentations/${join(dirname(relativePath), outputFileName)}`;
    manifest[relativePath] = {
      presentationUrl,
      slideCount: presentation.slides.length,
      estimatedDuration: presentation.metadata.estimatedDuration,
      title: presentation.metadata.title,
      generatedAt: new Date().toISOString()
    };

    console.log(`  ✅ Generated: ${presentationUrl}`);
    console.log(`  📊 Slides: ${presentation.slides.length}`);
    console.log(`  ⏱️  Duration: ${presentation.metadata.estimatedDuration}`);

    return outputPath;

  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const config = parseArgs();

  console.log('🎭 AI Coding Course - Presentation Generator\n');
  console.log(`📂 Docs directory: ${DOCS_DIR}`);
  console.log(`📝 Output directory: ${OUTPUT_DIR}`);
  console.log(`🌐 Static directory: ${STATIC_OUTPUT_DIR}`);
  console.log(`🤖 Model: Claude Haiku 4.5 (via CLI)`);
  console.log(`📋 Mode: ${config.mode}`);

  // Find markdown files
  const sourceFiles = findMarkdownFiles(DOCS_DIR);

  if (sourceFiles.length === 0) {
    console.error('\n❌ No markdown files found.');
    process.exit(1);
  }

  console.log(`\n📚 Found ${sourceFiles.length} source file${sourceFiles.length !== 1 ? 's' : ''}`);

  // Load existing manifest
  let manifest = {};
  if (existsSync(MANIFEST_PATH)) {
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
  }

  // Select files to process
  let filesToProcess;

  if (config.mode === 'interactive') {
    try {
      filesToProcess = await promptSelectFile(sourceFiles, DOCS_DIR);
    } catch (error) {
      console.error(`\n❌ ${error.message}`);
      process.exit(1);
    }

    const relativePath = relative(DOCS_DIR, filesToProcess[0]);
    console.log(`\n✅ Selected: ${relativePath}\n`);
  } else {
    filesToProcess = filterFiles(sourceFiles, config, DOCS_DIR);

    if (filesToProcess.length === 0) {
      console.error('\n❌ No files match the specified filter.');
      process.exit(1);
    }

    console.log(`\n📦 Processing ${filesToProcess.length} file${filesToProcess.length !== 1 ? 's' : ''} in batch mode\n`);
  }

  console.log('='.repeat(60));

  // Process files
  let successCount = 0;
  let errorCount = 0;

  for (const file of filesToProcess) {
    try {
      await generatePresentation(file, manifest, config);
      successCount++;
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
      errorCount++;
    }
  }

  // Save manifests
  mkdirSync(dirname(MANIFEST_PATH), { recursive: true });
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');

  const staticManifestPath = join(STATIC_OUTPUT_DIR, 'manifest.json');
  mkdirSync(dirname(staticManifestPath), { recursive: true });
  writeFileSync(staticManifestPath, JSON.stringify(manifest, null, 2) + '\n');

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✨ Generation complete!');
  console.log(`   Success: ${successCount} file${successCount !== 1 ? 's' : ''}`);
  if (errorCount > 0) {
    console.log(`   Errors: ${errorCount} file${errorCount !== 1 ? 's' : ''}`);
  }
  console.log(`📋 Manifest: ${MANIFEST_PATH}`);
  console.log(`🌐 Static manifest: ${staticManifestPath}`);
  console.log('='.repeat(60));

  if (errorCount > 0) {
    process.exit(1);
  }
}

// Run
main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
