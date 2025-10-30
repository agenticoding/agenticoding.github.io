#!/usr/bin/env node

/**
 * Podcast Audio Generation Script
 *
 * Converts MDX course content to podcast-style audio using Gemini API:
 * 1. Scans all MDX files in website/docs/
 * 2. Converts technical content to conversational two-speaker dialogue
 * 3. Generates audio using Gemini 2.5 Flash TTS
 * 4. Saves to website/static/audio/
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const DOCS_DIR = join(__dirname, '../website/docs');
const AUDIO_OUTPUT_DIR = join(__dirname, '../website/static/audio');
const MANIFEST_PATH = join(AUDIO_OUTPUT_DIR, 'manifest.json');

// Model names
const DIALOGUE_MODEL = 'gemini-2.5-flash';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

// API key from environment
const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.env.GCP_API_KEY;

if (!API_KEY) {
  console.error('❌ Error: No API key found');
  console.error('Set GOOGLE_API_KEY, GEMINI_API_KEY, or GCP_API_KEY environment variable');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

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
  cleaned = cleaned.replace(/```[\s\S]*?```/g, (match) => {
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
 * Generate conversational dialogue from technical content
 */
async function generateDialogue(content, fileName) {
  console.log(`  🎭 Generating dialogue script...`);

  const model = genAI.getGenerativeModel({ model: DIALOGUE_MODEL });

  // Special handling for intro.md - add self-aware meta-commentary
  const isIntro = fileName === 'intro';
  const metaCommentary = isIntro ? `

SPECIAL INSTRUCTIONS FOR THIS EPISODE:
This is the course introduction. When discussing the section about how the course was developed using AI (including the podcast itself), have Alex and Sam briefly acknowledge in a natural, professional way that they themselves are AI-generated voices. This should feel like a thoughtful meta-moment, not gimmicky. Keep it concise - one or two exchanges where they note the self-referential nature of AI-generated hosts discussing AI-generated content. Make it feel authentic to how senior engineers would react to this realization.` : '';

  const prompt = `You are converting technical course content into a natural, engaging two-person podcast conversation.

Speakers:
- Alex: The instructor - knowledgeable, clear, engaging teacher
- Sam: Senior software engineer - curious, asks clarifying questions, relates concepts to real-world scenarios

Guidelines:
- Keep the conversation natural and flowing
- Sam should ask relevant questions that a senior engineer would ask
- Alex should explain concepts clearly but not patronizingly
- Include brief moments of insight or "aha" moments
- Keep technical accuracy - don't dumb down the content
- Make it engaging but professional
- Break down complex concepts through dialogue
- Reference real-world scenarios and examples${metaCommentary}

Technical Content Title: ${fileName}

Technical Content:
${content}

Generate a natural podcast dialogue between Alex and Sam discussing this content. Format the output with clear speaker labels:

Alex: [dialogue]
Sam: [dialogue]
Alex: [dialogue]
...

Keep it conversational and engaging. Begin the dialogue now:`;

  const result = await model.generateContent(prompt);
  const dialogue = result.response.text();

  return dialogue;
}

/**
 * Create WAV header for raw PCM data
 * Gemini TTS returns headerless 16-bit PCM @ 24kHz mono
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
 * Convert dialogue text to audio using multi-speaker TTS
 */
async function generateAudio(dialogue, outputPath) {
  console.log(`  🎙️  Synthesizing audio...`);

  const model = genAI.getGenerativeModel({
    model: TTS_MODEL,
  });

  const result = await model.generateContent({
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
                  voiceName: 'Puck' // Upbeat, curious voice
                }
              }
            }
          ]
        }
      }
    }
  });

  const audioData = result.response.candidates[0].content.parts[0].inlineData;

  // Decode base64 audio (raw PCM data, no header)
  const pcmBuffer = Buffer.from(audioData.data, 'base64');

  // Create WAV header for the raw PCM data
  const wavHeader = createWavHeader(pcmBuffer.length);

  // Combine header + PCM data to create valid WAV file
  const wavBuffer = Buffer.concat([wavHeader, pcmBuffer]);

  // Ensure output directory exists
  mkdirSync(dirname(outputPath), { recursive: true });

  writeFileSync(outputPath, wavBuffer);

  return {
    size: wavBuffer.length,
    format: 'audio/wav'
  };
}


/**
 * Process a single markdown file
 */
async function processFile(filePath, manifest) {
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

    // Generate dialogue
    const dialogue = await generateDialogue(content, fileName);

    // Determine output path
    const outputFileName = `${fileName}.wav`;
    const outputPath = join(AUDIO_OUTPUT_DIR, dirname(relativePath), outputFileName);

    // Generate audio
    const audioInfo = await generateAudio(dialogue, outputPath);

    // Update manifest
    const audioUrl = `/audio/${relative(AUDIO_OUTPUT_DIR, outputPath)}`;
    manifest[relativePath] = {
      audioUrl,
      size: audioInfo.size,
      format: audioInfo.format,
      generatedAt: new Date().toISOString()
    };

    console.log(`  ✅ Generated: ${audioUrl}`);
    console.log(`  📊 Size: ${(audioInfo.size / 1024 / 1024).toFixed(2)} MB`);

  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    console.error(`  Skipping this file and continuing...`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🎙️  AI Coding Course - Podcast Generator\n');
  console.log(`📂 Docs directory: ${DOCS_DIR}`);
  console.log(`🔊 Audio output: ${AUDIO_OUTPUT_DIR}`);
  console.log(`🤖 Dialogue model: ${DIALOGUE_MODEL}`);
  console.log(`🎵 TTS model: ${TTS_MODEL}`);

  // Find all markdown files
  const files = findMarkdownFiles(DOCS_DIR);
  console.log(`\n📚 Found ${files.length} markdown files\n`);

  // Load existing manifest or create new
  let manifest = {};
  if (existsSync(MANIFEST_PATH)) {
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
    console.log(`📋 Loaded existing manifest with ${Object.keys(manifest).length} entries\n`);
  }

  // Process files sequentially (to avoid rate limits)
  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    try {
      await processFile(file, manifest);
      processed++;

      // Rate limiting - wait 2 seconds between files
      if (processed < files.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`Failed to process ${file}:`, error.message);
      failed++;
    }
  }

  // Save manifest
  mkdirSync(dirname(MANIFEST_PATH), { recursive: true });
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('✨ Podcast generation complete!\n');
  console.log(`📊 Summary:`);
  console.log(`   ✅ Processed: ${processed}`);
  console.log(`   ⚠️  Skipped: ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`\n📋 Manifest saved to: ${MANIFEST_PATH}`);
  console.log('='.repeat(60));
}

// Run
main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
