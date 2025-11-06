#!/usr/bin/env node

/**
 * Unified Podcast Generation Script
 *
 * Generates podcast scripts and audio from MDX course content:
 * 1. Script Generation: Converts MDX to dialog using Claude Code CLI (Haiku 4.5)
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

import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync, unlinkSync } from 'fs';
import { join, relative, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import * as readline from 'readline';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const DOCS_DIR = join(__dirname, '../website/docs');
const SCRIPT_OUTPUT_DIR = join(__dirname, 'output/podcasts');
const AUDIO_OUTPUT_DIR = join(__dirname, '../website/static/audio');
const SCRIPT_MANIFEST_PATH = join(SCRIPT_OUTPUT_DIR, 'manifest.json');
const AUDIO_MANIFEST_PATH = join(AUDIO_OUTPUT_DIR, 'manifest.json');

// Model configuration
const TTS_MODEL = 'gemini-2.5-pro-preview-tts';

// API key for Gemini TTS
const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GCP_API_KEY;

// Parse command-line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    mode: 'interactive',
    pipeline: 'both', // 'both', 'script-only', 'audio-only'
    file: null,
    module: null,
    debug: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--all') {
      config.mode = 'batch';
    } else if (arg === '--script-only') {
      config.pipeline = 'script-only';
    } else if (arg === '--audio-only') {
      config.pipeline = 'audio-only';
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
// SCRIPT GENERATION - From generate-podcast-script.js
// ============================================================================

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

  // Tag admonition boxes so Claude knows they're pedagogical reinforcement
  // Match :::tip[Title], :::warning, :::info, etc.
  cleaned = cleaned.replace(/:::(tip|warning|info|note|caution)\s*(?:\[([^\]]*)\])?\s*/gi, (match, type, title) => {
    return `\n[PEDAGOGICAL ${type.toUpperCase()}: ${title || 'Note'}]\n`;
  });
  // Mark end of admonition boxes
  cleaned = cleaned.replace(/^:::$/gm, '\n[END NOTE]\n');

  // Clean up excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}

/**
 * Generate podcast dialog prompt optimized for Claude Haiku 4.5
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

CRITICAL: CONTENT DEDUPLICATION REQUIREMENTS

The source material uses pedagogical reinforcement patterns designed for written learning:
- Main explanatory text
- [PEDAGOGICAL TIP/WARNING/INFO/NOTE] boxes that often RESTATE key concepts from the main text
- Repeated summaries and transitions for visual learners

For linear podcast format, you MUST deduplicate to avoid boring repetition:

✓ SYNTHESIZE: When a concept appears in both main text and [PEDAGOGICAL NOTE] sections, create ONE clear, cohesive explanation that integrates both perspectives naturally
✓ MERGE: Combine multiple mentions of the same idea into a single well-developed discussion with depth
✓ ADVANCE: Only return to a concept if you're significantly advancing understanding with genuinely new context, examples, or implications
✓ FLOW: Prioritize natural conversational progression over written pedagogical reinforcement patterns
✓ TRIM: Remove redundant restatements - podcast listeners cannot re-read like readers can, so repetition feels tedious rather than reinforcing

✗ DO NOT: Discuss the same point multiple times without adding substantial new insight
✗ DO NOT: Treat [PEDAGOGICAL NOTE] sections as separate topics requiring their own discussion - they're reinforcement of concepts already covered in main text
✗ DO NOT: Create circular discussions that return to the same idea repeatedly without meaningful progression
✗ DO NOT: Feel obligated to cover every sentence - synthesize into the most compelling narrative
✗ DO NOT: Use transition phrases like "going back to", "as I mentioned", "to circle back" - these signal repetition

DETECT REPETITION PATTERNS - CRITICAL:

Pattern 1: Main text + [PEDAGOGICAL TIP] saying the same thing differently
Example:
- Main text: "The real productivity gain is working on multiple projects simultaneously"
- [PEDAGOGICAL TIP]: "Autonomous mode's power is parallel work, not speed per task"
→ These are IDENTICAL concepts with different wording. Merge into ONE statement.
→ DO NOT discuss "productivity gain" then later return to "parallel work advantage"

Pattern 2: Synonym clusters that mean the same thing
WATCH FOR THESE EQUIVALENT PHRASES:
- "parallel work" = "working on multiple tasks simultaneously" = "three agents running" = "concurrent projects"
- "10x productivity" = "actual game changer" = "real gain" = "where productivity explodes" = "genuine productivity improvement"
- "speed per task" vs "throughput" vs "finishing faster" = same concept, different framing

ANTI-REPETITION RULE:
If you mention "parallel work" in one exchange, DO NOT return to "working on multiple tasks simultaneously"
as if it's a new topic. You already covered it. Move forward to genuinely new insights.

Pattern 3: Circular explanations
BAD (circular):
- Exchange 1: "Autonomous mode's advantage is you can work on three projects at once"
- Exchange 3: "The real productivity gain isn't about speed"
- Exchange 4: "The game changer is parallel work - running multiple agents simultaneously"
→ This repeats the same point 3 times within close proximity

GOOD (progressive):
- Exchange 1: "Autonomous mode's advantage is parallel work - three projects simultaneously while living your life"
- [Move to next concept - don't return to parallel work unless adding 50%+ new insight]

EXAMPLE OF GOOD DEDUPLICATION:
If main text explains "autonomous mode lets you work on multiple projects simultaneously" and a
[PEDAGOGICAL TIP] says "the real 10x productivity gain is parallel work, not speed per task",
synthesize these into ONE cohesive explanation: "Autonomous mode's real power isn't speed - it's
working on three projects simultaneously while living your life. That's the actual 10x gain."
Don't discuss autonomous mode, then later discuss "the real 10x gain" as if it's a separate concept.

OUTPUT FORMAT:
Use clear speaker labels followed by natural dialog. Structure your output within XML tags:

<podcast_dialog>
Alex: [natural dialog here]

Sam: [natural dialog here]

Alex: [natural dialog here]

[continue the conversation...]
</podcast_dialog>${metaCommentary}

LENGTH CONSTRAINT:
Target 6,000-7,500 tokens for the complete dialog. This ensures it fits within TTS API limits while maintaining quality.
Given the deduplication requirements above, your podcast will likely be SHORTER than the source material - this is expected and desirable.
Focus on depth and clarity over comprehensive coverage. Prioritize depth over breadth.

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
 * Validate dialog for repetition patterns
 */
function validateDialogQuality(dialog) {
  const warnings = [];

  // Split into exchanges (speaker turns)
  const exchanges = dialog.split('\n\n').filter(e => e.trim().match(/^(Alex|Sam):/));

  if (exchanges.length === 0) {
    return warnings; // Can't validate empty dialog
  }

  // Key phrases to watch for repetition (case-insensitive)
  const keyPhrases = [
    'parallel work',
    '10x productivity',
    'autonomous mode',
    'game changer',
    'real gain',
    'actual productivity',
    'speed per task',
    'throughput',
    'multiple projects',
    'three agents'
  ];

  // Check for repeated key phrases within close proximity (sliding window of 5 exchanges)
  const windowSize = 5;
  for (let i = 0; i < exchanges.length - windowSize + 1; i++) {
    const window = exchanges.slice(i, i + windowSize).join(' ').toLowerCase();

    for (const phrase of keyPhrases) {
      const regex = new RegExp(phrase, 'gi');
      const occurrences = (window.match(regex) || []).length;

      if (occurrences >= 3) {
        warnings.push(
          `Potential repetition: "${phrase}" appears ${occurrences} times within 5 exchanges ` +
          `(exchanges ${i + 1}-${i + windowSize})`
        );
      }
    }
  }

  // Check for circular transition phrases that signal repetition
  const circularPhrases = [
    'as i mentioned',
    'going back to',
    'to circle back',
    'like i said',
    'as we discussed',
    'returning to'
  ];

  const fullText = dialog.toLowerCase();
  for (const phrase of circularPhrases) {
    if (fullText.includes(phrase)) {
      warnings.push(
        `Circular transition detected: "${phrase}" - this often signals unnecessary repetition`
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

// ============================================================================
// AUDIO GENERATION - From generate-podcast-audio.js
// ============================================================================

/**
 * Parse markdown script file
 */
function parseScriptFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');

  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!frontmatterMatch) {
    throw new Error('Invalid script format - missing frontmatter');
  }

  // Parse frontmatter (simple YAML parsing for our specific structure)
  const frontmatter = {};
  const frontmatterText = frontmatterMatch[1];

  // Extract simple key-value pairs
  frontmatter.source = frontmatterText.match(/source:\s*(.+)/)?.[1]?.trim() || '';
  frontmatter.generatedAt = frontmatterText.match(/generatedAt:\s*(.+)/)?.[1]?.trim() || '';
  frontmatter.model = frontmatterText.match(/model:\s*(.+)/)?.[1]?.trim() || '';
  frontmatter.tokenCount = parseInt(frontmatterText.match(/tokenCount:\s*(\d+)/)?.[1] || '0', 10);

  // Extract dialog content (everything after frontmatter)
  const dialog = content.slice(frontmatterMatch[0].length).trim();

  return {
    frontmatter,
    dialog
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
  const MAX_CHUNK_DURATION = 600;    // 10 minutes max (safety margin)
  const MIN_CHUNK_DURATION = 120;    // 2 minutes minimum (40% of target)

  const lines = dialogue.split('\n');
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
    if (currentDuration + lineDuration > TARGET_CHUNK_DURATION &&
        currentChunk.length > 0 &&
        isSpeakerLine) {
      // Save current chunk
      chunks.push(currentChunk.join('\n'));
      currentChunk = [line];
      currentDuration = lineDuration;
    } else {
      currentChunk.push(line);
      currentDuration += lineDuration;

      // Hard limit safety check
      if (currentDuration > MAX_CHUNK_DURATION) {
        console.warn(`  ⚠️  Chunk exceeds max duration (${(currentDuration/60).toFixed(1)} min), forcing split`);
        chunks.push(currentChunk.join('\n'));
        currentChunk = [];
        currentDuration = 0;
      }
    }
  }

  // Add remaining chunk
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join('\n'));
  }

  // Merge undersized final chunk with previous chunk to avoid API errors
  if (chunks.length > 1) {
    const lastChunk = chunks[chunks.length - 1];
    const lastChunkDuration = estimateDuration(lastChunk);

    if (lastChunkDuration < MIN_CHUNK_DURATION) {
      console.log(`  ⚙️  Merging small final chunk (${(lastChunkDuration/60).toFixed(1)} min) with previous chunk`);

      // Remove last chunk and merge with previous
      chunks.pop();
      const previousChunk = chunks.pop();
      const mergedChunk = previousChunk + '\n' + lastChunk;
      const mergedDuration = estimateDuration(mergedChunk);

      // Verify merged chunk doesn't exceed max duration
      if (mergedDuration > MAX_CHUNK_DURATION) {
        console.warn(`  ⚠️  Merged chunk exceeds max duration (${(mergedDuration/60).toFixed(1)} min), keeping original split`);
        chunks.push(previousChunk);
        chunks.push(lastChunk);
      } else {
        chunks.push(mergedChunk);
        console.log(`  ✅ Merged chunk duration: ${(mergedDuration/60).toFixed(1)} min`);
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
  header.write('RIFF', 0);                          // ChunkID
  header.writeUInt32LE(36 + pcmDataLength, 4);     // ChunkSize
  header.write('WAVE', 8);                          // Format

  // fmt subchunk
  header.write('fmt ', 12);                         // Subchunk1ID
  header.writeUInt32LE(16, 16);                    // Subchunk1Size (PCM = 16)
  header.writeUInt16LE(1, 20);                     // AudioFormat (PCM = 1)
  header.writeUInt16LE(1, 22);                     // NumChannels (mono = 1)
  header.writeUInt32LE(24000, 24);                 // SampleRate (24kHz)
  header.writeUInt32LE(24000 * 1 * 2, 28);         // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  header.writeUInt16LE(1 * 2, 32);                 // BlockAlign (NumChannels * BitsPerSample/8)
  header.writeUInt16LE(16, 34);                    // BitsPerSample (16-bit)

  // data subchunk
  header.write('data', 36);                         // Subchunk2ID
  header.writeUInt32LE(pcmDataLength, 40);         // Subchunk2Size

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
        error.message?.includes('fetch failed') ||
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('ETIMEDOUT') ||
        error.message?.includes('ENOTFOUND') ||
        error.status === 429 ||  // Rate limit
        error.status === 500 ||  // Internal server error
        error.status === 503 ||  // Service unavailable
        error.status === 504;    // Gateway timeout

      // Don't retry permanent errors
      const isPermanent =
        error.status === 400 ||  // Bad request
        error.status === 401 ||  // Unauthorized
        error.status === 403 ||  // Forbidden
        error.status === 404;    // Not found

      if (isPermanent) {
        throw error;  // Fail fast on permanent errors
      }

      if (!isRetryable || attempt === maxAttempts - 1) {
        throw lastError;
      }

      // Exponential backoff: 1s, 2s, 4s, 8s
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`  ⏳ Retry ${attempt + 1}/${maxAttempts} after ${delay}ms (${error.message})`);
      await new Promise(resolve => setTimeout(resolve, delay));
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
    contents: [{
      role: 'user',
      parts: [{ text: dialogue }]
    }]
  });

  return result.totalTokens;
}

/**
 * Generate audio for a single dialogue chunk
 */
async function generateAudioChunk(dialogue, chunkIndex, totalChunks, genAI) {
  const chunkLabel = totalChunks > 1 ? ` (chunk ${chunkIndex + 1}/${totalChunks})` : '';
  console.log(`  🎙️  Synthesizing audio${chunkLabel}...`);

  // Validate token count before attempting TTS
  const tokenCount = await countDialogueTokens(dialogue, genAI);
  const TOKEN_LIMIT = 8192;
  const TOKEN_SAFETY_MARGIN = 500;
  const MAX_TOKENS = TOKEN_LIMIT - TOKEN_SAFETY_MARGIN;

  const estimatedSeconds = estimateDuration(dialogue);
  console.log(`  📊 Chunk${chunkLabel}: ${tokenCount} tokens, ~${(estimatedSeconds / 60).toFixed(1)} min`);

  if (tokenCount > MAX_TOKENS) {
    throw new Error(`Chunk exceeds token limit: ${tokenCount} > ${MAX_TOKENS}. Split into smaller chunks.`);
  }

  // Wrap TTS API call with retry logic
  const result = await retryWithBackoff(async () => {
    const model = genAI.getGenerativeModel({
      model: TTS_MODEL,
    });

    const response = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: dialogue }]
      }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: 'Alex',
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: 'Kore' // Firm, professional voice
                  }
                }
              },
              {
                speaker: 'Sam',
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: 'Charon' // Neutral, professional voice
                  }
                }
              }
            ]
          }
        }
      }
    });

    // Guarded response parsing
    if (!response?.response?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
      throw new Error('TTS API returned malformed response - missing inlineData.data');
    }

    return response;
  });

  const audioData = result.response.candidates[0].content.parts[0].inlineData;

  // Decode base64 audio (raw PCM data, no header)
  const pcmBuffer = Buffer.from(audioData.data, 'base64');

  console.log(`  ✅ Chunk${chunkLabel} complete: ${(pcmBuffer.length / 1024 / 1024).toFixed(2)} MB`);

  return {
    pcmBuffer,
    tokenCount
  };
}

/**
 * Convert dialogue text to audio using multi-speaker TTS
 */
async function generateAudio(dialogue, outputPath, genAI) {
  const totalDuration = estimateDuration(dialogue);
  console.log(`  📏 Total estimated duration: ~${(totalDuration / 60).toFixed(1)} minutes`);

  // Split dialogue into manageable chunks
  const chunks = chunkDialogue(dialogue);

  if (chunks.length > 1) {
    console.log(`  ✂️  Split into ${chunks.length} chunks for processing`);
  }

  // Generate audio for each chunk
  const pcmBuffers = [];
  let totalTokens = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunkResult = await generateAudioChunk(chunks[i], i, chunks.length, genAI);
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

  console.log(`  ✅ Audio saved: ${(wavBuffer.length / 1024 / 1024).toFixed(2)} MB, ${totalTokens} tokens`);

  return {
    size: wavBuffer.length,
    format: 'audio/wav',
    tokenCount: totalTokens,
    chunks: chunks.length
  };
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
      } else if (item.match(/\.md$/i) && item !== 'manifest.json') {
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
    return files.filter(f => f === targetFile);
  }

  if (config.module) {
    // Files in specific module
    const modulePath = join(baseDir, config.module);
    return files.filter(f => f.startsWith(modulePath));
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
      output: process.stdout
    });

    console.log(`\n📚 Available files:\n`);

    files.forEach((file, index) => {
      const relativePath = relative(baseDir, file);
      console.log(`  ${index + 1}. ${relativePath}`);
    });

    console.log('\n');

    rl.question(prompt, (answer) => {
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
 * Generate script for a file
 */
async function generateScript(filePath, scriptManifest, config) {
  const relativePath = relative(DOCS_DIR, filePath);
  const fileName = basename(filePath, extname(filePath));

  console.log(`\n📄 Generating script: ${relativePath}`);

  try {
    // Parse content
    const content = parseMarkdownContent(filePath);

    if (content.length < 100) {
      console.log(`  ⚠️  Skipping - content too short`);
      return null;
    }

    // Determine output path
    const outputFileName = `${fileName}.md`;
    const outputPath = join(SCRIPT_OUTPUT_DIR, dirname(relativePath), outputFileName);

    // Delete existing output file to ensure fresh write
    if (existsSync(outputPath)) {
      unlinkSync(outputPath);
      console.log(`  🗑️  Deleted existing file for fresh generation`);
    }

    // Build prompt
    const prompt = buildDialogPrompt(content, fileName, outputPath);

    // Debug mode: save prompt
    if (config.debug) {
      const debugPath = outputPath.replace('.md', '.debug-prompt.txt');
      writeFileSync(debugPath, prompt, 'utf-8');
      console.log(`  🔍 Debug prompt saved: ${debugPath}`);
    }

    // Generate dialog using Claude
    const dialog = await generateDialogWithClaude(prompt, outputPath);

    // Validate dialog quality
    const warnings = validateDialogQuality(dialog);
    if (warnings.length > 0) {
      console.log(`  ⚠️  Quality warnings detected:`);
      warnings.forEach(w => console.log(`     - ${w}`));
      console.log(`  💡 Consider regenerating if repetition is significant`);
    } else {
      console.log(`  ✅ Quality validation passed - no repetition detected`);
    }

    // Save script with frontmatter
    const scriptInfo = saveScript(dialog, filePath, outputPath, fileName);

    // Update manifest
    const scriptUrl = relative(SCRIPT_OUTPUT_DIR, outputPath);
    scriptManifest[relativePath] = {
      scriptPath: scriptUrl,
      size: scriptInfo.size,
      tokenCount: scriptInfo.tokenCount,
      generatedAt: new Date().toISOString()
    };

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
async function generateAudioFromScript(scriptPath, audioManifest, genAI) {
  const relativePath = relative(SCRIPT_OUTPUT_DIR, scriptPath);
  const fileName = basename(scriptPath, extname(scriptPath));

  console.log(`\n🎵 Generating audio: ${relativePath}`);

  try {
    // Parse script
    const { frontmatter, dialog } = parseScriptFile(scriptPath);

    console.log(`  📝 Source doc: ${frontmatter.source}`);
    console.log(`  📊 Estimated tokens: ${frontmatter.tokenCount || 'unknown'}`);

    // Determine audio output path
    const relativeDir = dirname(relativePath);
    const outputFileName = `${fileName}.wav`;
    const outputPath = join(AUDIO_OUTPUT_DIR, relativeDir, outputFileName);

    // Generate audio
    const audioInfo = await generateAudio(dialog, outputPath, genAI);

    // Update manifest using the source doc path as key
    const audioUrl = `/audio/${join(relativeDir, outputFileName)}`;
    audioManifest[frontmatter.source] = {
      audioUrl,
      size: audioInfo.size,
      format: audioInfo.format,
      tokenCount: audioInfo.tokenCount,
      chunks: audioInfo.chunks,
      generatedAt: new Date().toISOString(),
      scriptSource: relativePath
    };

    console.log(`  ✅ Generated: ${audioUrl}`);
    console.log(`  📊 Audio size: ${(audioInfo.size / 1024 / 1024).toFixed(2)} MB`);
    if (audioInfo.chunks > 1) {
      console.log(`  🧩 Chunks: ${audioInfo.chunks}`);
    }

  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    throw error;
  }
}

/**
 * Process a single file (script and/or audio)
 */
async function processFile(filePath, scriptManifest, audioManifest, config, genAI) {
  const shouldGenerateScript = config.pipeline !== 'audio-only';
  const shouldGenerateAudio = config.pipeline !== 'script-only';

  let scriptPath = null;

  // Generate script
  if (shouldGenerateScript) {
    scriptPath = await generateScript(filePath, scriptManifest, config);

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
    await generateAudioFromScript(scriptPath, audioManifest, genAI);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const config = parseArgs();

  console.log('🎭 AI Coding Course - Unified Podcast Generator\n');
  console.log(`📂 Docs directory: ${DOCS_DIR}`);
  console.log(`📝 Script output: ${SCRIPT_OUTPUT_DIR}`);
  console.log(`🔊 Audio output: ${AUDIO_OUTPUT_DIR}`);
  console.log(`🤖 Script model: Claude Haiku 4.5 (via CLI)`);
  console.log(`🎵 Audio model: ${TTS_MODEL}`);
  console.log(`📋 Pipeline: ${config.pipeline}`);
  console.log(`📋 Mode: ${config.mode}`);

  // Initialize Gemini API if needed for audio
  let genAI = null;
  if (config.pipeline !== 'script-only') {
    if (!API_KEY) {
      console.error('\n❌ Error: No API key found for Gemini TTS');
      console.error('Set GOOGLE_API_KEY, GEMINI_API_KEY, or GCP_API_KEY environment variable');
      process.exit(1);
    }
    genAI = new GoogleGenerativeAI(API_KEY);
  }

  // Determine source files based on pipeline mode
  let sourceFiles;
  let baseDir;

  if (config.pipeline === 'audio-only') {
    // Audio-only: scan script files
    sourceFiles = findScriptFiles(SCRIPT_OUTPUT_DIR);
    baseDir = SCRIPT_OUTPUT_DIR;

    if (sourceFiles.length === 0) {
      console.error('\n❌ No script files found. Generate scripts first or use different pipeline mode.');
      process.exit(1);
    }
  } else {
    // Script or both: scan markdown docs
    sourceFiles = findMarkdownFiles(DOCS_DIR);
    baseDir = DOCS_DIR;

    if (sourceFiles.length === 0) {
      console.error('\n❌ No markdown files found.');
      process.exit(1);
    }
  }

  console.log(`\n📚 Found ${sourceFiles.length} source file${sourceFiles.length !== 1 ? 's' : ''}`);

  // Load existing manifests
  let scriptManifest = {};
  if (existsSync(SCRIPT_MANIFEST_PATH)) {
    scriptManifest = JSON.parse(readFileSync(SCRIPT_MANIFEST_PATH, 'utf-8'));
  }

  let audioManifest = {};
  if (existsSync(AUDIO_MANIFEST_PATH)) {
    audioManifest = JSON.parse(readFileSync(AUDIO_MANIFEST_PATH, 'utf-8'));
  }

  // Select files to process
  let filesToProcess;

  if (config.mode === 'interactive') {
    // Interactive selection
    const prompt = config.pipeline === 'audio-only'
      ? 'Select a script by number (or press Ctrl+C to exit): '
      : 'Select a file by number (or press Ctrl+C to exit): ';

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
      if (config.pipeline === 'audio-only') {
        // Audio-only: file is already a script path
        await generateAudioFromScript(file, audioManifest, genAI);
      } else {
        // Script or both: file is a doc path
        await processFile(file, scriptManifest, audioManifest, config, genAI);
      }
      successCount++;
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
      errorCount++;
    }
  }

  // Save manifests
  if (config.pipeline !== 'audio-only') {
    mkdirSync(dirname(SCRIPT_MANIFEST_PATH), { recursive: true });
    writeFileSync(SCRIPT_MANIFEST_PATH, JSON.stringify(scriptManifest, null, 2) + '\n');
  }

  if (config.pipeline !== 'script-only') {
    mkdirSync(dirname(AUDIO_MANIFEST_PATH), { recursive: true });
    writeFileSync(AUDIO_MANIFEST_PATH, JSON.stringify(audioManifest, null, 2) + '\n');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✨ Generation complete!');
  console.log(`   Success: ${successCount} file${successCount !== 1 ? 's' : ''}`);
  if (errorCount > 0) {
    console.log(`   Errors: ${errorCount} file${errorCount !== 1 ? 's' : ''}`);
  }
  if (config.pipeline !== 'audio-only') {
    console.log(`📋 Script manifest: ${SCRIPT_MANIFEST_PATH}`);
  }
  if (config.pipeline !== 'script-only') {
    console.log(`📋 Audio manifest: ${AUDIO_MANIFEST_PATH}`);
  }
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
