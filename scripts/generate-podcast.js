#!/usr/bin/env node

/**
 * Unified Podcast Generation Script
 *
 * Generates podcast scripts and audio from MDX course content:
 * 1. Script Generation: Converts MDX to dialog using Claude Code CLI (Opus 4.5)
 * 2. Audio Generation: Synthesizes multi-speaker audio using Gemini TTS
 *
 * Modes:
 * - Default: Interactive file selection → generate script + audio
 * - --script-only: Generate script only
 * - --audio-only: Generate audio from existing script (skip script generation)
 * - --all: Batch process all files
 * - --file <path>: Process specific file
 * - --module <name>: Process all files in module directory
 * - --debug: Save prompt for validation
 *
 * Usage:
 *   node scripts/generate-podcast.js                 # Interactive: script + audio
 *   node scripts/generate-podcast.js --script-only   # Interactive: script only
 *   node scripts/generate-podcast.js --audio-only    # Interactive: audio only
 *   node scripts/generate-podcast.js --all           # Batch: all files
 *   node scripts/generate-podcast.js --file intro.md # Specific file
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  statSync,
  existsSync,
  unlinkSync,
} from "fs";
import { join, relative, dirname, basename, extname } from "path";
import { fileURLToPath } from "url";
import { spawn, spawnSync } from "child_process";
import * as readline from "readline";

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const DOCS_DIR = join(__dirname, "../website/docs");
const SCRIPT_OUTPUT_DIR = join(__dirname, "output/podcasts");
const AUDIO_OUTPUT_DIR = join(__dirname, "../website/static/audio");
const SCRIPT_MANIFEST_PATH = join(SCRIPT_OUTPUT_DIR, "manifest.json");
const AUDIO_MANIFEST_PATH = join(AUDIO_OUTPUT_DIR, "manifest.json");

// Model configuration
const TTS_MODEL = "gemini-2.5-pro-preview-tts";

// API key for Gemini TTS
const API_KEY =
  process.env.GOOGLE_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.GCP_API_KEY;

/**
 * Check if ffmpeg is available with libmp3lame support
 */
function checkFfmpegAvailable() {
  const result = spawnSync("ffmpeg", ["-version"], {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });

  if (result.error || result.status !== 0) {
    console.error(`
Error: ffmpeg is required for MP3 conversion but was not found.

Install ffmpeg with:
  brew install ffmpeg

Then run this script again.
`);
    process.exit(1);
  }

  // Check for libmp3lame support
  const output = result.stdout || "";
  if (!output.includes("--enable-libmp3lame")) {
    console.error(`
Error: ffmpeg is installed but lacks libmp3lame support for MP3 encoding.

Reinstall ffmpeg with MP3 support:
  brew reinstall ffmpeg

Then run this script again.
`);
    process.exit(1);
  }

  return true;
}

// Parse command-line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    mode: "interactive",
    pipeline: "both", // 'both', 'script-only', 'audio-only'
    file: null,
    module: null,
    debug: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--all") {
      config.mode = "batch";
    } else if (arg === "--script-only") {
      config.pipeline = "script-only";
    } else if (arg === "--audio-only") {
      config.pipeline = "audio-only";
    } else if (arg === "--file") {
      config.mode = "batch";
      config.file = args[++i];
    } else if (arg === "--module") {
      config.mode = "batch";
      config.module = args[++i];
    } else if (arg === "--debug") {
      config.debug = true;
    }
  }

  return config;
}

// ============================================================================
// SCRIPT GENERATION - From generate-podcast-script.js
// ============================================================================

/**
 * Calculate semantic overlap between two text segments using word-based Jaccard similarity
 * This is a lightweight approach that doesn't require external NLP libraries
 *
 * @param {string} text1 - First text segment
 * @param {string} text2 - Second text segment
 * @param {number} threshold - Similarity threshold (0-1), default 0.75
 * @returns {boolean} - True if texts are semantically similar above threshold
 */
function detectSemanticOverlap(text1, text2, threshold = 0.75) {
  // Normalize: lowercase, remove punctuation, split into words
  const normalize = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3); // Ignore short words (a, the, is, etc.)
  };

  const words1 = new Set(normalize(text1));
  const words2 = new Set(normalize(text2));

  if (words1.size === 0 || words2.size === 0) {
    return false;
  }

  // Jaccard similarity: intersection / union
  const intersection = new Set([...words1].filter((word) => words2.has(word)));
  const union = new Set([...words1, ...words2]);

  const similarity = intersection.size / union.size;

  return similarity >= threshold;
}

/**
 * Extract unique sentences from text2 that are not semantically covered in text1
 * Used to preserve novel information from pedagogical notes
 *
 * @param {string} text1 - Main text (reference)
 * @param {string} text2 - Secondary text (to filter)
 * @returns {string} - Sentences from text2 not covered in text1
 */
function extractUniqueSentences(text1, text2) {
  const sentences2 = text2
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
  const uniqueSentences = [];

  for (const sentence of sentences2) {
    // Check if this sentence is already covered in text1
    if (!detectSemanticOverlap(sentence, text1, 0.6)) {
      uniqueSentences.push(sentence);
    }
  }

  return uniqueSentences.join(". ");
}

/**
 * Analyze code block context and generate audio-appropriate description
 * Transforms code into natural language that preserves pedagogical value
 */
function describeCodeBlock(codeBlock, precedingContext, followingContext) {
  // Extract language and code content
  const langMatch = codeBlock.match(/```(\w+)?\n([\s\S]*?)```/);
  const language = langMatch?.[1] || "";
  const code = langMatch?.[2]?.trim() || "";

  if (!code) {
    return "[Code example]";
  }

  // Focus on immediate context (last 100 chars before, first 100 chars after)
  const immediatePreContext = precedingContext.substring(
    Math.max(0, precedingContext.length - 100),
  );
  const immediatePostContext = followingContext.substring(0, 100);

  // Detect code block type based on context and content
  const fullContext = (precedingContext + " " + followingContext).toLowerCase();
  const immediateContext = (
    immediatePreContext +
    " " +
    immediatePostContext
  ).toLowerCase();

  // Type 1: Comparison examples (ineffective vs effective)
  // Prioritize immediate context for these labels
  if (
    immediateContext.includes("**ineffective:**") ||
    immediateContext.includes("**risky:**") ||
    immediateContext.includes("**bad:**") ||
    immediateContext.includes("**wrong:**") ||
    immediateContext.includes("**don't rely on llms")
  ) {
    return `[INEFFECTIVE CODE EXAMPLE: ${extractCodeSummary(code, language)}]`;
  }

  if (
    immediateContext.includes("**effective:**") ||
    immediateContext.includes("**better:**") ||
    immediateContext.includes("**good:**") ||
    immediateContext.includes("**correct:**") ||
    immediateContext.includes("**instead")
  ) {
    return `[EFFECTIVE CODE EXAMPLE: ${extractCodeSummary(code, language)}]`;
  }

  // Fallback to emojis and broader context if no immediate label found
  if (fullContext.includes("❌") && !immediateContext.includes("✅")) {
    return `[INEFFECTIVE CODE EXAMPLE: ${extractCodeSummary(code, language)}]`;
  }

  if (fullContext.includes("✅") && !immediateContext.includes("❌")) {
    return `[EFFECTIVE CODE EXAMPLE: ${extractCodeSummary(code, language)}]`;
  }

  // Type 2: Pattern demonstrations (showing structure)
  if (
    fullContext.includes("pattern") ||
    fullContext.includes("structure") ||
    immediateContext.includes("example") ||
    fullContext.includes("template")
  ) {
    return `[CODE PATTERN: ${extractCodeSummary(code, language)}]`;
  }

  // Type 3: Specifications with requirements (numbered lists, constraints)
  if (
    code.includes("\n-") ||
    code.includes("\n•") ||
    /\d+\./.test(code) ||
    fullContext.includes("requirement") ||
    fullContext.includes("constraint") ||
    fullContext.includes("specification")
  ) {
    const requirements = extractRequirements(code);
    return `[CODE SPECIFICATION: ${extractCodeSummary(code, language)}. ${requirements}]`;
  }

  // Type 4: Default - describe the code structure
  return `[CODE EXAMPLE: ${extractCodeSummary(code, language)}]`;
}

/**
 * Extract a concise summary of what the code does/shows
 */
function extractCodeSummary(code, language) {
  const lines = code.split("\n").filter((l) => l.trim());

  // Detect function definitions - more precise matching
  const functionMatch = code.match(
    /(?:^|\n)\s*(?:export\s+)?(?:async\s+)?(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?function)/m,
  );
  if (functionMatch) {
    const funcName = functionMatch[1] || functionMatch[2] || functionMatch[3];
    // Validate it's a real function name (at least 3 chars, starts with letter)
    if (funcName && funcName.length >= 3 && /^[a-zA-Z]/.test(funcName)) {
      const params = code.match(/\(([^)]*)\)/)?.[1] || "";
      const paramCount = params.trim() ? params.split(",").length : 0;
      const hasReturn = code.includes("return");
      return `Function '${funcName}'${paramCount > 0 ? ` with ${paramCount} parameter${paramCount > 1 ? "s" : ""}` : ""}${hasReturn ? " that returns a value" : ""}`;
    }
  }

  // Detect type/interface definitions
  if (code.includes("interface") || code.includes("type")) {
    const typeMatch = code.match(/(?:interface|type)\s+(\w+)/);
    if (typeMatch) {
      return `Type definition '${typeMatch[1]}'`;
    }
  }

  // Detect class definitions
  if (code.includes("class")) {
    const classMatch = code.match(/class\s+(\w+)/);
    if (classMatch) {
      return `Class '${classMatch[1]}'`;
    }
  }

  // Detect imports
  if (code.includes("import") || code.includes("require")) {
    return "Import statements for dependencies";
  }

  // Detect configuration/object
  if (
    code.trim().startsWith("{") ||
    code.includes("config") ||
    code.includes("options")
  ) {
    return "Configuration object with properties";
  }

  // Detect command-line/shell
  if (
    language === "bash" ||
    language === "sh" ||
    code.includes("$") ||
    code.includes("npm") ||
    code.includes("git")
  ) {
    const commands = lines.filter((l) => !l.startsWith("#")).length;
    return `Shell command${commands > 1 ? "s" : ""} (${commands} line${commands > 1 ? "s" : ""})`;
  }

  // Detect specifications/requirements
  if (code.includes("-") || code.includes("•") || /^\d+\./.test(code)) {
    const items = lines.filter((l) => l.match(/^[\s-•\d]/)).length;
    return `Specification with ${items} requirement${items > 1 ? "s" : ""}`;
  }

  // Default: describe by line count and language
  const lineCount = lines.length;
  return `${language || "Code"} snippet (${lineCount} line${lineCount > 1 ? "s" : ""})`;
}

/**
 * Extract and summarize requirements from code
 */
function extractRequirements(code) {
  const lines = code.split("\n");
  const requirements = [];

  // Extract lines that look like requirements (bullets, numbers, dashes)
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.match(/^[-•\d]+[.)]?\s+(.+)/) && trimmed.length > 5) {
      const content = trimmed.replace(/^[-•\d]+[.)]?\s+/, "").trim();
      if (content.length > 0) {
        requirements.push(content);
      }
    }
  }

  if (requirements.length === 0) {
    return "";
  }

  if (requirements.length <= 3) {
    return `Requirements: ${requirements.join("; ")}`;
  }

  return `${requirements.length} specific requirements including: ${requirements.slice(0, 2).join("; ")}`;
}

/**
 * Parse MDX/MD file and extract clean text content
 * Transforms code blocks into audio-appropriate descriptions
 */
function parseMarkdownContent(filePath) {
  const content = readFileSync(filePath, "utf-8");

  // Remove frontmatter
  let cleaned = content.replace(/^---[\s\S]*?---\n/, "");

  // DEDUPLICATION PHASE 1: Handle Deep Dive sections (<details> tags)
  // Do this BEFORE removing HTML tags so we can detect and process them
  // These often duplicate main explanations - extract and deduplicate first
  const detailsRegex =
    /<details>\s*<summary>([\s\S]*?)<\/summary>\s*([\s\S]*?)<\/details>/gi;
  let detailsMatch;
  const detailsToProcess = [];

  console.log(`  🔍 Scanning for Deep Dive sections...`);

  while ((detailsMatch = detailsRegex.exec(cleaned)) !== null) {
    detailsToProcess.push({
      fullMatch: detailsMatch[0],
      title: detailsMatch[1].trim(),
      content: detailsMatch[2].trim(),
      index: detailsMatch.index,
    });
  }

  // Process details sections in reverse order to maintain correct indices
  for (let i = detailsToProcess.length - 1; i >= 0; i--) {
    const detail = detailsToProcess[i];

    // Extract broader context (1000 chars before - deep dives cover broader topics)
    const contextStart = Math.max(0, detail.index - 1000);
    const precedingContext = cleaned.substring(contextStart, detail.index);

    // Check overlap with preceding content
    const overlapHigh = detectSemanticOverlap(
      detail.content,
      precedingContext,
      0.7,
    );
    const overlapMedium = detectSemanticOverlap(
      detail.content,
      precedingContext,
      0.45,
    );

    let replacement;
    if (overlapHigh) {
      // >70% overlap: Deep dive is redundant, remove entirely
      console.log(
        `  🔧 Deduplication: Removed redundant Deep Dive "${detail.title}" (>70% overlap with main content)`,
      );
      replacement = "";
    } else if (overlapMedium) {
      // 45-70% overlap: Keep only unique sentences
      const uniqueContent = extractUniqueSentences(
        precedingContext,
        detail.content,
      );
      if (uniqueContent.length > 30) {
        console.log(
          `  🔧 Deduplication: Condensed Deep Dive "${detail.title}" (45-70% overlap, kept unique parts)`,
        );
        replacement = `\n[DEEP DIVE: ${detail.title}]\n${uniqueContent}\n[END DEEP DIVE]\n`;
      } else {
        console.log(
          `  🔧 Deduplication: Removed Deep Dive "${detail.title}" (no unique content after filtering)`,
        );
        replacement = "";
      }
    } else {
      // <45% overlap: Keep entire deep dive (genuinely new information)
      replacement = `\n[DEEP DIVE: ${detail.title}]\n${detail.content}\n[END DEEP DIVE]\n`;
    }

    // Replace in cleaned content
    cleaned =
      cleaned.substring(0, detail.index) +
      replacement +
      cleaned.substring(detail.index + detail.fullMatch.length);
  }

  console.log(`  🔍 Found ${detailsToProcess.length} Deep Dive section(s)`);

  // DEDUPLICATION PHASE 2: Handle pedagogical note boxes (:::tip, :::warning, etc.)
  // Extract and deduplicate against surrounding context to prevent repetition
  console.log(`  🔍 Scanning for pedagogical note boxes...`);
  // Match both formats: ":::tip Title" and ":::tip[Title]"
  const pedagogicalNoteRegex =
    /:::(tip|warning|info|note|caution)\s*(?:\[([^\]]*)\]|([^\n]*))\s*\n([\s\S]*?)\n:::/gi;
  let noteMatch;
  const notesToProcess = [];

  while ((noteMatch = pedagogicalNoteRegex.exec(cleaned)) !== null) {
    notesToProcess.push({
      fullMatch: noteMatch[0],
      type: noteMatch[1],
      title: (noteMatch[2] || noteMatch[3] || "Note").trim(),
      content: noteMatch[4].trim(),
      index: noteMatch.index,
    });
  }

  // Process pedagogical notes in reverse order to maintain correct indices
  for (let i = notesToProcess.length - 1; i >= 0; i--) {
    const note = notesToProcess[i];

    // Extract surrounding context (500 chars before and after)
    const contextStart = Math.max(0, note.index - 500);
    const contextEnd = Math.min(
      cleaned.length,
      note.index + note.fullMatch.length + 500,
    );
    const surroundingContext =
      cleaned.substring(contextStart, note.index) +
      cleaned.substring(note.index + note.fullMatch.length, contextEnd);

    // Check overlap with surrounding context
    const overlapHigh = detectSemanticOverlap(
      note.content,
      surroundingContext,
      0.75,
    );
    const overlapMedium = detectSemanticOverlap(
      note.content,
      surroundingContext,
      0.5,
    );

    let replacement;
    if (overlapHigh) {
      // >75% overlap: Completely redundant, remove entirely
      console.log(
        `  🔧 Deduplication: Removed redundant ${note.type} note (>75% overlap)`,
      );
      replacement = "";
    } else if (overlapMedium) {
      // 50-75% overlap: Keep only unique sentences
      const uniqueContent = extractUniqueSentences(
        surroundingContext,
        note.content,
      );
      if (uniqueContent.length > 20) {
        console.log(
          `  🔧 Deduplication: Condensed ${note.type} note (50-75% overlap, kept unique parts)`,
        );
        replacement = `\n[PEDAGOGICAL ${note.type.toUpperCase()}: ${note.title}] ${uniqueContent}\n`;
      } else {
        console.log(
          `  🔧 Deduplication: Removed ${note.type} note (no unique content after filtering)`,
        );
        replacement = "";
      }
    } else {
      // <50% overlap: Keep entire note (genuinely new information)
      replacement = `\n[PEDAGOGICAL ${note.type.toUpperCase()}: ${note.title}]\n${note.content}\n[END NOTE]\n`;
    }

    // Replace in cleaned content
    cleaned =
      cleaned.substring(0, note.index) +
      replacement +
      cleaned.substring(note.index + note.fullMatch.length);
  }

  console.log(`  🔍 Found ${notesToProcess.length} pedagogical note(s)`);

  // NOW safe to remove remaining JSX/HTML components after deduplication
  cleaned = cleaned.replace(/<[^>]+>/g, "");

  // Process code blocks: Find all code blocks and their contexts
  const codeBlocks = [];
  const codeRegex = /```[\s\S]*?```/g;
  let codeMatch;

  while ((codeMatch = codeRegex.exec(cleaned)) !== null) {
    const precedingStart = Math.max(0, codeMatch.index - 200);
    const precedingContext = cleaned.substring(precedingStart, codeMatch.index);

    const followingEnd = Math.min(
      cleaned.length,
      codeMatch.index + codeMatch[0].length + 200,
    );
    const followingContext = cleaned.substring(
      codeMatch.index + codeMatch[0].length,
      followingEnd,
    );

    codeBlocks.push({
      original: codeMatch[0],
      index: codeMatch.index,
      precedingContext,
      followingContext,
    });
  }

  // Replace code blocks with descriptions
  let offset = 0;
  for (const block of codeBlocks) {
    const description = describeCodeBlock(
      block.original,
      block.precedingContext,
      block.followingContext,
    );
    const adjustedIndex = block.index + offset;

    cleaned =
      cleaned.substring(0, adjustedIndex) +
      description +
      cleaned.substring(adjustedIndex + block.original.length);

    offset += description.length - block.original.length;
  }

  // Remove inline code
  cleaned = cleaned.replace(/`[^`]+`/g, (match) => match.replace(/`/g, ""));

  // Remove images
  cleaned = cleaned.replace(/!\[.*?\]\(.*?\)/g, "[Image]");

  // Clean up markdown links but keep text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, "");

  // Clean up excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();

  return cleaned;
}

/**
 * Calculate target token count based on source material complexity
 */
function calculateTargetTokens(sourceContent) {
  const MIN_TOKENS = 3000;
  const MAX_TOKENS = 15000;

  // Estimate source token count (rough: ~4 chars per token)
  const sourceTokenCount = Math.ceil(sourceContent.length / 4);

  // Base scaling: 0.6x source tokens (allows expansion for dialogue format)
  let target = Math.floor(sourceTokenCount * 0.6);

  // Complexity multipliers - count structural elements
  const hasCodeBlocks = (sourceContent.match(/```/g) || []).length / 2;
  const hasTables = (sourceContent.match(/^\|/gm) || []).length;
  const hasDeepDives = (sourceContent.match(/<details>/g) || []).length;
  const hasPedagogicalNotes = (
    sourceContent.match(/:::(tip|warning|info|note)/gi) || []
  ).length;

  // Add tokens for complex content that needs narration
  target += hasCodeBlocks * 200; // Each code block needs explanation
  target += hasTables * 150; // Tables need verbal description
  target += hasDeepDives * 500; // Deep dives = high information density
  target += hasPedagogicalNotes * 100; // Pedagogical notes add context

  // Clamp to reasonable bounds
  const finalTarget = Math.max(MIN_TOKENS, Math.min(MAX_TOKENS, target));

  console.log(`  📊 Source complexity analysis:`);
  console.log(`     - Estimated source tokens: ${sourceTokenCount}`);
  console.log(`     - Code blocks: ${hasCodeBlocks}`);
  console.log(`     - Tables: ${hasTables}`);
  console.log(`     - Deep dives: ${hasDeepDives}`);
  console.log(`     - Pedagogical notes: ${hasPedagogicalNotes}`);
  console.log(`     - Target podcast tokens: ${finalTarget}`);

  return finalTarget;
}

/**
 * Select appropriate model based on content complexity
 */
function selectModel(targetTokenCount, sourceTokenCount) {
  // Use Sonnet for complex lessons requiring depth
  // if (targetTokenCount > 8000 || sourceTokenCount > 6000) {
  //   console.log(`  🤖 Selected model: Sonnet (high complexity)`);
  //   return 'sonnet';
  // }
  // Opus for shorter, simpler content
  console.log(`  🤖 Selected model: Opus (standard complexity)`);
  return "opus";
}

/**
 * Generate podcast dialog prompt optimized for Claude Opus 4.5
 */
function buildDialogPrompt(
  content,
  fileName,
  outputPath,
  targetTokens,
  sourceTokens,
) {
  // Special handling for intro.md - add brief meta-acknowledgement
  const isIntro = fileName === "intro";
  const metaCommentary = isIntro
    ? `

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

LENGTH: Keep this to 3-5 exchanges maximum, then return to introducing the course content.`
    : "";

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

CRITICAL: HANDLING CODE BLOCKS IN AUDIO FORMAT

The source material includes code blocks that have been transformed into audio-appropriate descriptions with tags like:
- [INEFFECTIVE CODE EXAMPLE: ...] - Shows what NOT to do
- [EFFECTIVE CODE EXAMPLE: ...] - Shows the correct approach
- [CODE PATTERN: ...] - Demonstrates a structure or template
- [CODE SPECIFICATION: ...] - Lists requirements or constraints
- [CODE EXAMPLE: ...] - General code reference

HOW TO NARRATE CODE IN DIALOG:

✓ DO: Narrate the code's structure and intent in natural language
   Example: "The effective version is a TypeScript function called validateEmail that takes an email string and returns an object with a valid boolean and optional reason. It has three specific constraints: reject multiple @ symbols, reject missing domains, and accept plus addressing."

✓ DO: Explain what the code demonstrates pedagogically
   Example: "This code pattern shows how starting with a function signature and type annotations helps the AI understand exactly what you want."

✓ DO: Connect code to the conversational point being made
   Example: "See the difference? The ineffective prompt just says 'validate emails', but the effective version specifies the RFC standard, lists edge cases, and defines the return structure."

✓ DO: Use code as concrete examples to back abstract discussions
   Example: "When I say 'be specific', here's what I mean: instead of 'handle errors', write 'throw ValidationError with a descriptive message for each of these five cases'."

✓ DO: Compare code blocks when showing ineffective vs effective patterns
   Example: "The first version gives no context, just 'Write a function that validates emails.' The second version specifies TypeScript, references RFC 5322, lists three edge cases, and defines the exact return type."

✗ DO NOT: Skip over code blocks - they're pedagogically important
✗ DO NOT: Say "there's a code example here" without describing what it shows
✗ DO NOT: Lose the specificity that the code demonstrates
✗ DO NOT: Read code character-by-character or line-by-line
✗ DO NOT: Use phrases like "the code shows" without explaining WHAT it shows

COMPARING EFFECTIVE VS INEFFECTIVE CODE:
When you see both [INEFFECTIVE CODE EXAMPLE: ...] and [EFFECTIVE CODE EXAMPLE: ...]:
1. First, describe what's wrong with the ineffective version (vague, missing context, unclear requirements)
2. Then, contrast with the effective version (specific, constrained, clear expectations)
3. Explain WHY the effective version works better (helps AI understand intent, reduces ambiguity, produces better results)
4. Make the contrast explicit and compelling

EXAMPLE DIALOG FOR CODE BLOCKS:
Alex: "Let me show you the difference between an ineffective and effective prompt. The ineffective one just says 'Write a function that validates emails.' That's it. No language, no specification, no edge cases."

Sam: "So the AI has to guess everything - which TypeScript or Python, which validation standard, how to handle plus addressing..."

Alex: "Exactly. Now look at the effective version: 'Write a TypeScript function that validates email addresses per RFC 5322. Handle these edge cases: reject multiple @ symbols, reject missing domains, accept plus addressing. Return an object with a valid boolean and optional reason field.' See how much clearer that is?"

Sam: "That's night and day. The second version gives the AI everything it needs - language, standard, edge cases, return type."

CRITICAL: PRESERVE TECHNICAL SPECIFICITY

The source material contains actionable technical details that MUST be preserved in the podcast:

✓ PRESERVE: Exact numbers (token counts, LOC thresholds, dimensions, percentages, ratios)
  Example: "60-120K tokens reliable attention" NOT "somewhat less than advertised"
  Example: "<10K LOC use agentic search, 10-100K use semantic search" NOT "different tools for different sizes"

✓ PRESERVE: Tool and product names with brief context
  Example: "ChunkHound for structured multi-hop traversal" NOT just "a tool"
  Example: "ChromaDB, pgvector, or Qdrant vector databases" NOT just "vector databases"

✓ PRESERVE: Decision matrices and selection criteria
  Example: "Under 10K lines use X, 10-100K lines use Y, above 100K use Z with reason" NOT just "pick the right tool"

✓ PRESERVE: Technical architecture details
  Example: "768-1536 dimensional vectors with cosine similarity" NOT just "high-dimensional vectors"

✓ PRESERVE: Concrete examples with specific numbers
  Example: "10 chunks at 15K tokens plus 25K for files equals 40K" NOT just "uses a lot of tokens"

✗ DO NOT: Replace specific numbers with vague descriptors ("a lot", "many", "significant")
✗ DO NOT: Skip tool names - always mention them with 1-sentence context of what they do
✗ DO NOT: Simplify decision criteria into generic advice
✗ DO NOT: Omit architectural details that explain how things work

EXAMPLE - BAD (too vague):
"You need different approaches for different codebase sizes to get good results."

EXAMPLE - GOOD (preserves specifics):
"For codebases under 10,000 lines, agentic search with Grep and Read works well. Between 10,000 and 100,000 lines,
switch to semantic search - tools like ChunkHound or Claude Context via MCP servers. Above 100,000 lines, you need
ChunkHound's structured multi-hop traversal because autonomous agents start missing connections."

CRITICAL: CONTENT HAS BEEN PRE-DEDUPLICATED

The source content has been programmatically deduplicated during preprocessing:
- Redundant pedagogical note boxes (:::tip, :::warning) have been removed or condensed
- Duplicate deep dive sections have been filtered out
- Only unique information remains in [PEDAGOGICAL NOTE] and [DEEP DIVE] tags

Your job is to transform this already-clean content into engaging dialog:

✓ TRUST THE PREPROCESSING: Content is already deduplicated - focus on dialog quality
✓ NATURAL FLOW: Create conversational progression without forced repetition checks
✓ AVOID CIRCULAR PHRASES: Don't use "going back to", "as I mentioned", "to circle back"
✓ PROGRESSIVE DISCUSSION: Each exchange should advance understanding, not restate

The heavy lifting of deduplication is done. Focus on creating engaging, technically accurate dialog.

OUTPUT FORMAT:
Use clear speaker labels followed by natural dialog. Structure your output within XML tags:

<podcast_dialog>
Alex: [natural dialog here]

Sam: [natural dialog here]

Alex: [natural dialog here]

[continue the conversation...]
</podcast_dialog>${metaCommentary}

LENGTH CONSTRAINT:
Target ${targetTokens}-${targetTokens + 1500} tokens for the complete dialog (dynamically calculated based on source complexity).
This lesson has ${sourceTokens} estimated source tokens with specific complexity factors considered.

IMPORTANT: Depth is prioritized over compression for this content.
- Preserve ALL technical specifics, numbers, tool names, and decision criteria
- The token budget is adaptive - complex lessons get more space to preserve detail
- Deduplication is for removing redundancy, NOT for cutting essential technical information
- Focus on making content clear and complete, not artificially short

TECHNICAL CONTENT TITLE: ${fileName}

TECHNICAL CONTENT:
${content}

IMPORTANT: Write the complete podcast dialog directly to the file: ${outputPath}

The file should contain ONLY the podcast dialog wrapped in XML tags - no preamble, no summary, no explanation.
Just write the raw dialog to the file now.`;
}

/**
 * Call Claude Code CLI in headless mode to generate dialog
 */
async function generateDialogWithClaude(prompt, outputPath, model = "opus") {
  return new Promise((resolve, reject) => {
    console.log(`  🤖 Calling Claude Code CLI (${model})...`);

    // Ensure output directory exists before Claude tries to write
    mkdirSync(dirname(outputPath), { recursive: true });

    // Spawn claude process with headless mode
    const claude = spawn("claude", [
      "-p", // Headless mode (non-interactive)
      "--model",
      model, // Use specified model (opus)
      "--allowedTools",
      "Edit",
      "Write", // Allow file editing and writing only
    ]);

    let stdout = "";
    let stderr = "";

    // Collect stdout
    claude.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    // Collect stderr
    claude.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    // Handle process completion
    claude.on("close", (code) => {
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
        reject(
          new Error(
            `Claude did not create the output file: ${outputPath}\n` +
              `Claude response: ${stdout.slice(0, 200)}`,
          ),
        );
        return;
      }

      console.log(`  ✅ File created: ${outputPath}`);

      // Read the file content that Claude wrote
      let fileContent;
      try {
        fileContent = readFileSync(outputPath, "utf-8");
      } catch (readError) {
        reject(new Error(`Failed to read created file: ${readError.message}`));
        return;
      }

      // Extract dialog from XML tags in the file
      const match = fileContent.match(
        /<podcast_dialog>([\s\S]*?)<\/podcast_dialog>/,
      );
      if (!match) {
        reject(
          new Error(
            `File exists but missing XML tags.\n` +
              `File preview: ${fileContent.slice(0, 200)}...`,
          ),
        );
        return;
      }

      const dialog = match[1].trim();
      console.log(`  ✅ Extracted dialog (${dialog.split("\n").length} lines)`);
      resolve(dialog);
    });

    // Handle errors
    claude.on("error", (err) => {
      reject(
        new Error(
          `Failed to spawn Claude CLI: ${err.message}. Is 'claude' installed and in PATH?`,
        ),
      );
    });

    // Send prompt to stdin
    claude.stdin.write(prompt);
    claude.stdin.end();
  });
}

/**
 * Validate technical depth and information preservation
 */
function validateTechnicalDepth(dialog, sourceContent) {
  const warnings = [];

  // Extract numbers from source and dialog (including LOC like "10K", percentages, dimensions)
  const sourceNumbers =
    sourceContent.match(/\b\d+[KM]?(?:%|K|M|,\d{3})*\b/g) || [];
  const dialogNumbers = dialog.match(/\b\d+[KM]?(?:%|K|M|,\d{3})*\b/g) || [];

  // Should preserve at least 40% of specific numbers
  if (dialogNumbers.length < sourceNumbers.length * 0.4) {
    warnings.push(
      `⚠️  Low number preservation: ${dialogNumbers.length}/${sourceNumbers.length} numbers mentioned ` +
        `(${((dialogNumbers.length / sourceNumbers.length) * 100).toFixed(0)}%)`,
    );
  }

  // Extract tool/product names (capitalized technical terms)
  const toolPattern =
    /\b(?:[A-Z][a-z]+(?:[A-Z][a-z]+)*(?:DB|RAG|Search|Agent|Hound|Seek|Context|MCP|Serena|Perplexity|ChunkHound|ArguSeek)|ChunkHound|ArguSeek|ChromaDB|pgvector|Qdrant)\b/g;
  const sourceTools = new Set(sourceContent.match(toolPattern) || []);
  const dialogTools = new Set(dialog.match(toolPattern) || []);

  const missingTools = [...sourceTools].filter((t) => !dialogTools.has(t));
  if (missingTools.length > sourceTools.size * 0.3) {
    warnings.push(
      `⚠️  Missing important tools: ${missingTools.slice(0, 5).join(", ")}` +
        `${missingTools.length > 5 ? ` (+ ${missingTools.length - 5} more)` : ""}`,
    );
  }

  // Check for decision matrices / thresholds (lines with multiple | symbols)
  const sourceTables = (sourceContent.match(/^\|.*\|.*\|/gm) || []).length;
  if (sourceTables > 0) {
    // Tables should be mentioned or narrated somehow
    const tableKeywords = /(matrix|table|comparison|threshold|scale|tier)/gi;
    if (!tableKeywords.test(dialog)) {
      warnings.push(
        `⚠️  Source contains ${sourceTables} table rows but podcast doesn't narrate them`,
      );
    }
  }

  return warnings;
}

/**
 * Validate dialog for repetition patterns using semantic similarity
 */
function validateDialogQuality(dialog) {
  const warnings = [];

  // Split into exchanges (speaker turns)
  const exchanges = dialog
    .split("\n\n")
    .filter((e) => e.trim().match(/^(Alex|Sam):/));

  if (exchanges.length === 0) {
    return warnings; // Can't validate empty dialog
  }

  // SEMANTIC REPETITION DETECTION: Check for exchanges covering the same concepts
  // Use sliding window of 10 exchanges (broader than old 5-exchange window)
  const windowSize = 10;
  const similarityThreshold = 0.65; // 65% semantic overlap = likely repetition

  for (let i = 0; i < exchanges.length - 2; i++) {
    const currentExchange = exchanges[i];

    // Check if this exchange is semantically similar to any of the next few exchanges
    for (let j = i + 2; j < Math.min(i + windowSize, exchanges.length); j++) {
      const laterExchange = exchanges[j];

      if (
        detectSemanticOverlap(
          currentExchange,
          laterExchange,
          similarityThreshold,
        )
      ) {
        // Extract preview of both exchanges (first 60 chars)
        const preview1 =
          currentExchange.substring(0, 60).replace(/\n/g, " ") + "...";
        const preview2 =
          laterExchange.substring(0, 60).replace(/\n/g, " ") + "...";

        warnings.push(
          `⚠️  Semantic repetition detected:\n` +
            `     Exchange ${i + 1}: "${preview1}"\n` +
            `     Exchange ${j + 1}: "${preview2}"\n` +
            `     (>65% semantic overlap - likely discussing same concept)`,
        );
        break; // Only report first occurrence for this exchange
      }
    }
  }

  // Check for circular transition phrases that signal repetition
  const circularPhrases = [
    "as i mentioned",
    "going back to",
    "to circle back",
    "like i said",
    "as we discussed",
    "returning to",
  ];

  const fullText = dialog.toLowerCase();
  for (const phrase of circularPhrases) {
    if (fullText.includes(phrase)) {
      warnings.push(
        `⚠️  Circular transition detected: "${phrase}" - this often signals unnecessary repetition`,
      );
    }
  }

  return warnings;
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
model: claude-opus-4.5
tokenCount: ${tokenCount}
---

${dialog}
`;

  // Ensure output directory exists
  mkdirSync(dirname(outputPath), { recursive: true });

  writeFileSync(outputPath, markdown, "utf-8");

  return {
    tokenCount,
    size: Buffer.byteLength(markdown, "utf-8"),
  };
}

// ============================================================================
// AUDIO GENERATION - From generate-podcast-audio.js
// ============================================================================

/**
 * Parse markdown script file
 */
function parseScriptFile(filePath) {
  const content = readFileSync(filePath, "utf-8");

  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatterMatch) {
    throw new Error("Invalid script format - missing frontmatter");
  }

  // Parse frontmatter (simple YAML parsing for our specific structure)
  const frontmatter = {};
  const frontmatterText = frontmatterMatch[1];

  // Extract simple key-value pairs
  frontmatter.source =
    frontmatterText.match(/source:\s*(.+)/)?.[1]?.trim() || "";
  frontmatter.generatedAt =
    frontmatterText.match(/generatedAt:\s*(.+)/)?.[1]?.trim() || "";
  frontmatter.model = frontmatterText.match(/model:\s*(.+)/)?.[1]?.trim() || "";
  frontmatter.tokenCount = parseInt(
    frontmatterText.match(/tokenCount:\s*(\d+)/)?.[1] || "0",
    10,
  );

  // Extract dialog content (everything after frontmatter)
  const dialog = content.slice(frontmatterMatch[0].length).trim();

  return {
    frontmatter,
    dialog,
  };
}

/**
 * Estimate audio duration from text
 */
function estimateDuration(text) {
  const CHARS_PER_MINUTE = 750;
  const chars = text.length;
  return (chars / CHARS_PER_MINUTE) * 60; // Return seconds
}

/**
 * Split dialogue into chunks at speaker boundaries
 */
function chunkDialogue(dialogue) {
  const TARGET_CHUNK_DURATION = 300; // 5 minutes in seconds
  const MAX_CHUNK_DURATION = 600; // 10 minutes max (safety margin)
  const MIN_CHUNK_DURATION = 120; // 2 minutes minimum (40% of target)

  const lines = dialogue.split("\n");
  const chunks = [];
  let currentChunk = [];
  let currentDuration = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines
    if (!trimmedLine) {
      currentChunk.push(line);
      continue;
    }

    // Check if this is a speaker line (starts with "Alex:" or "Sam:")
    const isSpeakerLine = /^(Alex|Sam):/.test(trimmedLine);
    const lineDuration = estimateDuration(line);

    // If adding this line would exceed target AND we have content, start new chunk
    if (
      currentDuration + lineDuration > TARGET_CHUNK_DURATION &&
      currentChunk.length > 0 &&
      isSpeakerLine
    ) {
      // Save current chunk
      chunks.push(currentChunk.join("\n"));
      currentChunk = [line];
      currentDuration = lineDuration;
    } else {
      currentChunk.push(line);
      currentDuration += lineDuration;

      // Hard limit safety check
      if (currentDuration > MAX_CHUNK_DURATION) {
        console.warn(
          `  ⚠️  Chunk exceeds max duration (${(currentDuration / 60).toFixed(1)} min), forcing split`,
        );
        chunks.push(currentChunk.join("\n"));
        currentChunk = [];
        currentDuration = 0;
      }
    }
  }

  // Add remaining chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join("\n"));
  }

  // Merge undersized final chunk with previous chunk to avoid API errors
  if (chunks.length > 1) {
    const lastChunk = chunks[chunks.length - 1];
    const lastChunkDuration = estimateDuration(lastChunk);

    if (lastChunkDuration < MIN_CHUNK_DURATION) {
      console.log(
        `  ⚙️  Merging small final chunk (${(lastChunkDuration / 60).toFixed(1)} min) with previous chunk`,
      );

      // Remove last chunk and merge with previous
      chunks.pop();
      const previousChunk = chunks.pop();
      const mergedChunk = previousChunk + "\n" + lastChunk;
      const mergedDuration = estimateDuration(mergedChunk);

      // Verify merged chunk doesn't exceed max duration
      if (mergedDuration > MAX_CHUNK_DURATION) {
        console.warn(
          `  ⚠️  Merged chunk exceeds max duration (${(mergedDuration / 60).toFixed(1)} min), keeping original split`,
        );
        chunks.push(previousChunk);
        chunks.push(lastChunk);
      } else {
        chunks.push(mergedChunk);
        console.log(
          `  ✅ Merged chunk duration: ${(mergedDuration / 60).toFixed(1)} min`,
        );
      }
    }
  }

  return chunks;
}

/**
 * Create WAV header for raw PCM data
 */
function createWavHeader(pcmDataLength) {
  const header = Buffer.alloc(44);

  // RIFF chunk descriptor
  header.write("RIFF", 0); // ChunkID
  header.writeUInt32LE(36 + pcmDataLength, 4); // ChunkSize
  header.write("WAVE", 8); // Format

  // fmt subchunk
  header.write("fmt ", 12); // Subchunk1ID
  header.writeUInt32LE(16, 16); // Subchunk1Size (PCM = 16)
  header.writeUInt16LE(1, 20); // AudioFormat (PCM = 1)
  header.writeUInt16LE(1, 22); // NumChannels (mono = 1)
  header.writeUInt32LE(24000, 24); // SampleRate (24kHz)
  header.writeUInt32LE(24000 * 1 * 2, 28); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  header.writeUInt16LE(1 * 2, 32); // BlockAlign (NumChannels * BitsPerSample/8)
  header.writeUInt16LE(16, 34); // BitsPerSample (16-bit)

  // data subchunk
  header.write("data", 36); // Subchunk2ID
  header.writeUInt32LE(pcmDataLength, 40); // Subchunk2Size

  return header;
}

/**
 * Retry a function with exponential backoff
 */
async function retryWithBackoff(fn, maxAttempts = 4) {
  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      const isRetryable =
        error.message?.includes("fetch failed") ||
        error.message?.includes("ECONNRESET") ||
        error.message?.includes("ETIMEDOUT") ||
        error.message?.includes("ENOTFOUND") ||
        error.status === 429 || // Rate limit
        error.status === 500 || // Internal server error
        error.status === 503 || // Service unavailable
        error.status === 504; // Gateway timeout

      // Don't retry permanent errors
      const isPermanent =
        error.status === 400 || // Bad request
        error.status === 401 || // Unauthorized
        error.status === 403 || // Forbidden
        error.status === 404; // Not found

      if (isPermanent) {
        throw error; // Fail fast on permanent errors
      }

      if (!isRetryable || attempt === maxAttempts - 1) {
        throw lastError;
      }

      // Exponential backoff: 1s, 2s, 4s, 8s
      const delay = Math.pow(2, attempt) * 1000;
      console.log(
        `  ⏳ Retry ${attempt + 1}/${maxAttempts} after ${delay}ms (${error.message})`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Count tokens in dialogue text using Gemini API
 */
async function countDialogueTokens(dialogue, genAI) {
  const model = genAI.getGenerativeModel({ model: TTS_MODEL });

  const result = await model.countTokens({
    contents: [
      {
        role: "user",
        parts: [{ text: dialogue }],
      },
    ],
  });

  return result.totalTokens;
}

/**
 * Generate audio for a single dialogue chunk
 */
async function generateAudioChunk(dialogue, chunkIndex, totalChunks, genAI) {
  const chunkLabel =
    totalChunks > 1 ? ` (chunk ${chunkIndex + 1}/${totalChunks})` : "";
  console.log(`  🎙️  Synthesizing audio${chunkLabel}...`);

  // Validate token count before attempting TTS
  const tokenCount = await countDialogueTokens(dialogue, genAI);
  const TOKEN_LIMIT = 8192;
  const TOKEN_SAFETY_MARGIN = 500;
  const MAX_TOKENS = TOKEN_LIMIT - TOKEN_SAFETY_MARGIN;

  const estimatedSeconds = estimateDuration(dialogue);
  console.log(
    `  📊 Chunk${chunkLabel}: ${tokenCount} tokens, ~${(estimatedSeconds / 60).toFixed(1)} min`,
  );

  if (tokenCount > MAX_TOKENS) {
    throw new Error(
      `Chunk exceeds token limit: ${tokenCount} > ${MAX_TOKENS}. Split into smaller chunks.`,
    );
  }

  // Wrap TTS API call with retry logic
  const result = await retryWithBackoff(async () => {
    const model = genAI.getGenerativeModel({
      model: TTS_MODEL,
    });

    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: dialogue }],
        },
      ],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: "Alex",
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: "Kore", // Firm, professional voice
                  },
                },
              },
              {
                speaker: "Sam",
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: "Charon", // Neutral, professional voice
                  },
                },
              },
            ],
          },
        },
      },
    });

    // Guarded response parsing
    if (
      !response?.response?.candidates?.[0]?.content?.parts?.[0]?.inlineData
        ?.data
    ) {
      throw new Error(
        "TTS API returned malformed response - missing inlineData.data",
      );
    }

    return response;
  });

  const audioData = result.response.candidates[0].content.parts[0].inlineData;

  // Decode base64 audio (raw PCM data, no header)
  const pcmBuffer = Buffer.from(audioData.data, "base64");

  console.log(
    `  ✅ Chunk${chunkLabel} complete: ${(pcmBuffer.length / 1024 / 1024).toFixed(2)} MB`,
  );

  return {
    pcmBuffer,
    tokenCount,
  };
}

/**
 * Convert dialogue text to audio using multi-speaker TTS
 */
async function generateAudio(dialogue, outputPath, genAI) {
  const totalDuration = estimateDuration(dialogue);
  console.log(
    `  📏 Total estimated duration: ~${(totalDuration / 60).toFixed(1)} minutes`,
  );

  // Split dialogue into manageable chunks
  const chunks = chunkDialogue(dialogue);

  if (chunks.length > 1) {
    console.log(`  ✂️  Split into ${chunks.length} chunks for processing`);
  }

  // Generate audio for each chunk
  const pcmBuffers = [];
  let totalTokens = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunkResult = await generateAudioChunk(
      chunks[i],
      i,
      chunks.length,
      genAI,
    );
    pcmBuffers.push(chunkResult.pcmBuffer);
    totalTokens += chunkResult.tokenCount;
  }

  // Concatenate all PCM data
  const combinedPcm = Buffer.concat(pcmBuffers);

  // Create WAV header for the combined PCM data
  const wavHeader = createWavHeader(combinedPcm.length);

  // Combine header + PCM data to create valid WAV file
  const wavBuffer = Buffer.concat([wavHeader, combinedPcm]);

  // Ensure output directory exists
  mkdirSync(dirname(outputPath), { recursive: true });

  writeFileSync(outputPath, wavBuffer);

  console.log(
    `  ✅ Audio saved: ${(wavBuffer.length / 1024 / 1024).toFixed(2)} MB, ${totalTokens} tokens`,
  );

  return {
    size: wavBuffer.length,
    format: "audio/wav",
    tokenCount: totalTokens,
    chunks: chunks.length,
  };
}

/**
 * Convert WAV file to MP3 using ffmpeg with high-quality settings
 */
async function convertWavToMp3(wavPath, mp3Path) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-y", // Overwrite output file
      "-i",
      wavPath,
      "-codec:a",
      "libmp3lame",
      "-q:a",
      "2", // VBR quality 2 (~190 kbps) - high quality for voice
      mp3Path,
    ]);

    let stderr = "";
    ffmpeg.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        // Delete the intermediate WAV file
        unlinkSync(wavPath);

        const stats = statSync(mp3Path);
        console.log(
          `  🔊 Converted to MP3: ${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        );
        resolve({ size: stats.size, format: "audio/mp3" });
      } else {
        reject(new Error(`ffmpeg failed with code ${code}: ${stderr}`));
      }
    });

    ffmpeg.on("error", (err) => {
      reject(new Error(`Failed to spawn ffmpeg: ${err.message}`));
    });
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
      } else if (item.match(/\.(md|mdx)$/i) && !item.includes("CLAUDE.md")) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files.sort();
}

/**
 * Find all script files recursively
 */
function findScriptFiles(dir) {
  if (!existsSync(dir)) {
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
      } else if (item.match(/\.md$/i) && item !== "manifest.json") {
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
    // Specific file
    const targetFile = join(baseDir, config.file);
    return files.filter((f) => f === targetFile);
  }

  if (config.module) {
    // Files in specific module
    const modulePath = join(baseDir, config.module);
    return files.filter((f) => f.startsWith(modulePath));
  }

  return files; // All files
}

/**
 * Interactive file selection
 */
async function promptSelectFile(files, baseDir, prompt) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log(`\n📚 Available files:\n`);

    files.forEach((file, index) => {
      const relativePath = relative(baseDir, file);
      console.log(`  ${index + 1}. ${relativePath}`);
    });

    console.log("\n");

    rl.question(prompt, (answer) => {
      rl.close();

      const selection = parseInt(answer, 10);

      if (isNaN(selection) || selection < 1 || selection > files.length) {
        reject(
          new Error(
            `Invalid selection: ${answer}. Please enter a number between 1 and ${files.length}.`,
          ),
        );
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
 * Generate script for a file
 */
async function generateScript(filePath, scriptManifest, modifiedScriptKeys, config) {
  const relativePath = relative(DOCS_DIR, filePath);
  const fileName = basename(filePath, extname(filePath));

  console.log(`\n📄 Generating script: ${relativePath}`);

  try {
    // Read raw content first for complexity analysis
    const rawContent = readFileSync(filePath, "utf-8");

    // Parse content for podcast generation
    const content = parseMarkdownContent(filePath);

    if (content.length < 100) {
      console.log(`  ⚠️  Skipping - content too short`);
      return null;
    }

    // Calculate dynamic token budget based on RAW content complexity (before parsing)
    const targetTokens = calculateTargetTokens(rawContent);
    const sourceTokens = Math.ceil(rawContent.length / 4);

    // Select appropriate model
    const model = selectModel(targetTokens, sourceTokens);

    // Determine output path
    const outputFileName = `${fileName}.md`;
    const outputPath = join(
      SCRIPT_OUTPUT_DIR,
      dirname(relativePath),
      outputFileName,
    );

    // Delete existing output file to ensure fresh write
    if (existsSync(outputPath)) {
      unlinkSync(outputPath);
      console.log(`  🗑️  Deleted existing file for fresh generation`);
    }

    // Build prompt with dynamic parameters
    const prompt = buildDialogPrompt(
      content,
      fileName,
      outputPath,
      targetTokens,
      sourceTokens,
    );

    // Debug mode: save prompt
    if (config.debug) {
      const debugPath = outputPath.replace(".md", ".debug-prompt.txt");
      writeFileSync(debugPath, prompt, "utf-8");
      console.log(`  🔍 Debug prompt saved: ${debugPath}`);
    }

    // Generate dialog using Claude with selected model
    const dialog = await generateDialogWithClaude(prompt, outputPath, model);

    // Validate technical depth and information preservation (against raw content)
    console.log(`  🔍 Validating technical depth...`);
    const technicalWarnings = validateTechnicalDepth(dialog, rawContent);
    if (technicalWarnings.length > 0) {
      console.log(`  ⚠️  Technical depth warnings:`);
      technicalWarnings.forEach((w) => console.log(`     ${w}`));
    } else {
      console.log(`  ✅ Technical depth validation passed`);
    }

    // Validate dialog quality (repetition)
    const qualityWarnings = validateDialogQuality(dialog);
    if (qualityWarnings.length > 0) {
      console.log(`  ⚠️  Quality warnings detected:`);
      qualityWarnings.forEach((w) => console.log(`     - ${w}`));
      console.log(`  💡 Consider regenerating if repetition is significant`);
    } else {
      console.log(`  ✅ Quality validation passed - no repetition detected`);
    }

    // Save script with frontmatter
    const scriptInfo = saveScript(dialog, filePath, outputPath, fileName);

    // Update manifest and track modified key
    const scriptUrl = relative(SCRIPT_OUTPUT_DIR, outputPath);
    scriptManifest[relativePath] = {
      scriptPath: scriptUrl,
      size: scriptInfo.size,
      tokenCount: scriptInfo.tokenCount,
      generatedAt: new Date().toISOString(),
    };
    modifiedScriptKeys.add(relativePath);

    console.log(`  ✅ Saved: ${scriptUrl}`);
    console.log(`  📊 Token count: ${scriptInfo.tokenCount}`);
    console.log(`  📊 Size: ${(scriptInfo.size / 1024).toFixed(2)} KB`);

    return outputPath; // Return script path for audio generation
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    throw error;
  }
}

/**
 * Generate audio from script
 */
async function generateAudioFromScript(scriptPath, audioManifest, modifiedAudioKeys, genAI) {
  const relativePath = relative(SCRIPT_OUTPUT_DIR, scriptPath);
  const fileName = basename(scriptPath, extname(scriptPath));

  console.log(`\n🎵 Generating audio: ${relativePath}`);

  try {
    // Parse script
    const { frontmatter, dialog } = parseScriptFile(scriptPath);

    console.log(`  📝 Source doc: ${frontmatter.source}`);
    console.log(
      `  📊 Estimated tokens: ${frontmatter.tokenCount || "unknown"}`,
    );

    // Determine audio output paths
    const relativeDir = dirname(relativePath);
    const wavFileName = `${fileName}.wav`;
    const mp3FileName = `${fileName}.mp3`;
    const wavPath = join(AUDIO_OUTPUT_DIR, relativeDir, wavFileName);
    const mp3Path = join(AUDIO_OUTPUT_DIR, relativeDir, mp3FileName);

    // Generate WAV audio first
    const wavInfo = await generateAudio(dialog, wavPath, genAI);

    // Convert WAV to MP3
    const mp3Info = await convertWavToMp3(wavPath, mp3Path);

    // Update manifest using the source doc path as key and track modified key
    const audioUrl = `/audio/${join(relativeDir, mp3FileName)}`;
    audioManifest[frontmatter.source] = {
      audioUrl,
      size: mp3Info.size,
      format: mp3Info.format,
      tokenCount: wavInfo.tokenCount,
      chunks: wavInfo.chunks,
      generatedAt: new Date().toISOString(),
      scriptSource: relativePath,
    };
    modifiedAudioKeys.add(frontmatter.source);

    console.log(`  ✅ Generated: ${audioUrl}`);
    console.log(
      `  📊 Audio size: ${(mp3Info.size / 1024 / 1024).toFixed(2)} MB`,
    );
    if (wavInfo.chunks > 1) {
      console.log(`  🧩 Chunks: ${wavInfo.chunks}`);
    }
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    throw error;
  }
}

/**
 * Process a single file (script and/or audio)
 */
async function processFile(
  filePath,
  scriptManifest,
  modifiedScriptKeys,
  audioManifest,
  modifiedAudioKeys,
  config,
  genAI,
) {
  const shouldGenerateScript = config.pipeline !== "audio-only";
  const shouldGenerateAudio = config.pipeline !== "script-only";

  let scriptPath = null;

  // Generate script
  if (shouldGenerateScript) {
    scriptPath = await generateScript(filePath, scriptManifest, modifiedScriptKeys, config);

    if (!scriptPath) {
      console.log(`  ⚠️  Skipping audio generation - no script generated`);
      return;
    }
  } else {
    // Audio-only mode: find existing script
    const relativePath = relative(DOCS_DIR, filePath);
    const fileName = basename(filePath, extname(filePath));
    const outputFileName = `${fileName}.md`;
    scriptPath = join(SCRIPT_OUTPUT_DIR, dirname(relativePath), outputFileName);

    if (!existsSync(scriptPath)) {
      console.log(`  ⚠️  No existing script found: ${scriptPath}`);
      return;
    }
  }

  // Generate audio
  if (shouldGenerateAudio) {
    await generateAudioFromScript(scriptPath, audioManifest, modifiedAudioKeys, genAI);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const config = parseArgs();

  console.log("🎭 AI Coding Course - Unified Podcast Generator\n");
  console.log(`📂 Docs directory: ${DOCS_DIR}`);
  console.log(`📝 Script output: ${SCRIPT_OUTPUT_DIR}`);
  console.log(`🔊 Audio output: ${AUDIO_OUTPUT_DIR}`);
  console.log(`🤖 Script model: Claude Opus 4.5 (via CLI)`);
  console.log(`🎵 Audio model: ${TTS_MODEL}`);
  console.log(`📋 Pipeline: ${config.pipeline}`);
  console.log(`📋 Mode: ${config.mode}`);

  // Initialize Gemini API and check ffmpeg if needed for audio
  let genAI = null;
  if (config.pipeline !== "script-only") {
    if (!API_KEY) {
      console.error("\n❌ Error: No API key found for Gemini TTS");
      console.error(
        "Set GOOGLE_API_KEY, GEMINI_API_KEY, or GCP_API_KEY environment variable",
      );
      process.exit(1);
    }
    checkFfmpegAvailable();
    genAI = new GoogleGenerativeAI(API_KEY);
  }

  // Determine source files based on pipeline mode
  let sourceFiles;
  let baseDir;

  if (config.pipeline === "audio-only") {
    // Audio-only: scan script files
    sourceFiles = findScriptFiles(SCRIPT_OUTPUT_DIR);
    baseDir = SCRIPT_OUTPUT_DIR;

    if (sourceFiles.length === 0) {
      console.error(
        "\n❌ No script files found. Generate scripts first or use different pipeline mode.",
      );
      process.exit(1);
    }
  } else {
    // Script or both: scan markdown docs
    sourceFiles = findMarkdownFiles(DOCS_DIR);
    baseDir = DOCS_DIR;

    if (sourceFiles.length === 0) {
      console.error("\n❌ No markdown files found.");
      process.exit(1);
    }
  }

  console.log(
    `\n📚 Found ${sourceFiles.length} source file${sourceFiles.length !== 1 ? "s" : ""}`,
  );

  // Load existing manifests and track modified keys for merge-on-write
  let scriptManifest = {};
  const modifiedScriptKeys = new Set();
  if (existsSync(SCRIPT_MANIFEST_PATH)) {
    scriptManifest = JSON.parse(readFileSync(SCRIPT_MANIFEST_PATH, "utf-8"));
  }

  let audioManifest = {};
  const modifiedAudioKeys = new Set();
  if (existsSync(AUDIO_MANIFEST_PATH)) {
    audioManifest = JSON.parse(readFileSync(AUDIO_MANIFEST_PATH, "utf-8"));
  }

  // Select files to process
  let filesToProcess;

  if (config.mode === "interactive") {
    // Interactive selection
    const prompt =
      config.pipeline === "audio-only"
        ? "Select a script by number (or press Ctrl+C to exit): "
        : "Select a file by number (or press Ctrl+C to exit): ";

    try {
      filesToProcess = await promptSelectFile(sourceFiles, baseDir, prompt);
    } catch (error) {
      console.error(`\n❌ ${error.message}`);
      process.exit(1);
    }

    const relativePath = relative(baseDir, filesToProcess[0]);
    console.log(`\n✅ Selected: ${relativePath}\n`);
  } else {
    // Batch mode
    filesToProcess = filterFiles(sourceFiles, config, baseDir);

    if (filesToProcess.length === 0) {
      console.error("\n❌ No files match the specified filter.");
      process.exit(1);
    }

    console.log(
      `\n📦 Processing ${filesToProcess.length} file${filesToProcess.length !== 1 ? "s" : ""} in batch mode\n`,
    );
  }

  console.log("=".repeat(60));

  // Process files
  let successCount = 0;
  let errorCount = 0;

  for (const file of filesToProcess) {
    try {
      if (config.pipeline === "audio-only") {
        // Audio-only: file is already a script path
        await generateAudioFromScript(file, audioManifest, modifiedAudioKeys, genAI);
      } else {
        // Script or both: file is a doc path
        await processFile(file, scriptManifest, modifiedScriptKeys, audioManifest, modifiedAudioKeys, config, genAI);
      }
      successCount++;
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
      errorCount++;
    }
  }

  // Merge-on-write: re-read manifests and merge only our changes to avoid race conditions
  if (config.pipeline !== "audio-only") {
    let freshScriptManifest = {};
    if (existsSync(SCRIPT_MANIFEST_PATH)) {
      freshScriptManifest = JSON.parse(readFileSync(SCRIPT_MANIFEST_PATH, "utf-8"));
    }
    for (const key of modifiedScriptKeys) {
      freshScriptManifest[key] = scriptManifest[key];
    }
    mkdirSync(dirname(SCRIPT_MANIFEST_PATH), { recursive: true });
    writeFileSync(
      SCRIPT_MANIFEST_PATH,
      JSON.stringify(freshScriptManifest, null, 2) + "\n",
    );
  }

  if (config.pipeline !== "script-only") {
    let freshAudioManifest = {};
    if (existsSync(AUDIO_MANIFEST_PATH)) {
      freshAudioManifest = JSON.parse(readFileSync(AUDIO_MANIFEST_PATH, "utf-8"));
    }
    for (const key of modifiedAudioKeys) {
      freshAudioManifest[key] = audioManifest[key];
    }
    mkdirSync(dirname(AUDIO_MANIFEST_PATH), { recursive: true });
    writeFileSync(
      AUDIO_MANIFEST_PATH,
      JSON.stringify(freshAudioManifest, null, 2) + "\n",
    );
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("✨ Generation complete!");
  console.log(
    `   Success: ${successCount} file${successCount !== 1 ? "s" : ""}`,
  );
  if (errorCount > 0) {
    console.log(`   Errors: ${errorCount} file${errorCount !== 1 ? "s" : ""}`);
  }
  if (config.pipeline !== "audio-only") {
    console.log(`📋 Script manifest: ${SCRIPT_MANIFEST_PATH}`);
  }
  if (config.pipeline !== "script-only") {
    console.log(`📋 Audio manifest: ${AUDIO_MANIFEST_PATH}`);
  }
  console.log("=".repeat(60));

  if (errorCount > 0) {
    process.exit(1);
  }
}

// Run
main().catch((error) => {
  console.error("\n💥 Fatal error:", error);
  process.exit(1);
});
