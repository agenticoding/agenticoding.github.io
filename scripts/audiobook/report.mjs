/**
 * Shared primitives for the local-only audio stages (render, verify, stitch,
 * encode).
 *
 * Every stage needs the artifact layout, the cache reader and the same stdout
 * shape, so all three live here; duplicating any of them would let the stages
 * drift. The Gemini provider seam (client, retry, WAV wrap, ASR) lives here too
 * because render/dialogue TTS and verify/dialogue ASR share it; the ffmpeg
 * encoder stays in encode.mjs.
 *
 * All of it is local-only tooling: nothing here is imported by the website build.
 */
import { GoogleGenAI } from '@google/genai';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { AUDIO_CONFIG } from '../../website/src/audiobook/config.ts';
import { toCanonicalJson } from '../../website/src/audiobook/serialize.ts';

const WEBSITE_DIR = new URL('../../website/', import.meta.url);

/**
 * Artifact layout: cache + reports live under `website/audio/.cache/` (never
 * published), published audio + manifest under `website/static/audio/`. Doc ids
 * may contain "/".
 */
export const CACHE_DIR = new URL('audio/.cache/', WEBSITE_DIR);
export const STATIC_AUDIO_DIR = new URL('static/audio/', WEBSITE_DIR);
export const MANIFEST_FILE = new URL('manifest.json', STATIC_AUDIO_DIR);

export const FFMPEG = 'ffmpeg';
export const FFPROBE = 'ffprobe';

const ATTEMPTS = 4;
const MAX_OUTPUT_BYTES = 64 * 1024 * 1024;

export const cacheFile = (cacheKey, ext) => new URL(`${cacheKey}${ext}`, CACHE_DIR);
/** Local verification artifact, never published (D5). */
export const reportFile = (id) => new URL(`report-${id}.json`, CACHE_DIR);
export const chapterMp3 = (id) => new URL(`${id}.mp3`, STATIC_AUDIO_DIR);
export const flattenId = (id) => id.replaceAll('/', '__');

export const exists = (file) => existsSync(file);
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
export const readJsonIfExists = (file) => (existsSync(file) ? readJson(file) : undefined);
export const readBytes = (file) => readFileSync(file);
/**
 * Copy of s16le PCM as int16 samples: sample math without a per-sample Buffer read. The copy keeps
 * this correct for any byteOffset alignment, which a zero-copy view would not be.
 */
export const asInt16 = (pcm) =>
  new Int16Array(pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + (pcm.byteLength >> 1 << 1)));

/** Every artifact is written through here so directories can never be forgotten. */
export function writeFile(file, data) {
  mkdirSync(dirname(file.pathname), { recursive: true });
  writeFileSync(file, data);
}

export const writeJson = (file, value) => writeFile(file, toCanonicalJson(value));

/** TTS and ASR run locally with the operator's key; CI must never gain one (D7). */
export function requireApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set — export it in your shell; CI has no credentials and never will');
  return key;
}

let client;
/** One lazily-created Gemini client for every stage; the key is read once. */
export function gemini() {
  client ??= new GoogleGenAI({ apiKey: requireApiKey() });
  return client;
}

/** 24 kHz 16-bit mono WAV wrapper: ASR rejects headerless PCM. */
export function pcmToWav(pcm) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(AUDIO_CONFIG.sourceSampleRate, 24);
  header.writeUInt32LE(AUDIO_CONFIG.sourceSampleRate * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

/**
 * gemini-3.5-transcribe over in-memory PCM. Word timestamps are opt-in because
 * requesting them degrades transcription accuracy: only the dialogue alignment
 * asks for them, so WER verification can never be silently weakened by them.
 */
export async function transcribe(pcm, { wordTimestamp = false } = {}) {
  const request = {
    model: AUDIO_CONFIG.transcribeModelId,
    contents: [{ parts: [{ inlineData: { mimeType: 'audio/wav', data: pcmToWav(pcm).toString('base64') } }] }],
    ...(wordTimestamp ? { config: { audioTranscriptionConfig: { wordTimestamp: true } } } : {}),
  };
  const response = await withRetry(() => gemini().models.generateContent(request));
  const transcription = response.candidates?.[0]?.content?.parts?.[0]?.audioTranscription;
  if (typeof transcription?.text !== 'string') throw new Error('transcribe returned no transcript');
  return { text: transcription.text, words: transcription.words ?? [] };
}

/** 24 kHz 16-bit mono: byte length is an exact frame count, no ffprobe needed. */
export const pcmDurationMs = (pcm) => Math.round((pcm.length / 2 / AUDIO_CONFIG.sourceSampleRate) * 1000);

/** Inverse of `pcmDurationMs`: the byte offset of a chunk-relative timestamp. */
export const pcmBytesForMs = (ms) => Math.round((ms * AUDIO_CONFIG.sourceSampleRate * 2) / 1000);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Transport codes undici/node raise when a request never completed or the socket
 * died mid-flight. Anything status-less that carries none of these is a local bug
 * (bad args, bad config) — retrying it would only hide it.
 */
const TRANSPORT_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'EPIPE',
  'ETIMEDOUT',
  'ENOTFOUND',
  'EAI_AGAIN',
  'UND_ERR_SOCKET',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_BODY_TIMEOUT',
]);

/** 429, 5xx and transport failures are worth retrying; 401/400 and local bugs fail immediately. */
const retryable = (error) => {
  const status = error?.status ?? error?.response?.status;
  if (status === 429 || status >= 500) return true;
  const code = error?.code ?? error?.cause?.code;
  return code !== undefined && TRANSPORT_CODES.has(code);
};

/** Backoff wrapper for any provider call; anything not retryable fails immediately and visibly. */
export async function withRetry(operation) {
  let failure;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    if (attempt > 1) await sleep(2 ** (attempt - 2) * 1000);
    try {
      return await operation();
    } catch (error) {
      failure = error;
      if (!retryable(error)) throw error;
    }
  }
  throw new Error(`${failure.message} (after ${ATTEMPTS} attempts)`);
}

const describeFailure = (tool, result) =>
  result.error
    ? `${tool} is required for the audio pipeline: ${result.error.message}`
    : `${tool} failed (${result.status}): ${String(result.stderr).trim().split('\n').slice(-3).join(' ')}`;

/**
 * The one spawn for ffmpeg and ffprobe: identical failure handling, and callers
 * pick what they need — stdout (master's PCM, ffprobe's JSON) or stderr (the
 * loudness summary), never both products at once.
 */
export function runTool(tool, args, input) {
  const result = spawnSync(tool, args, { input, maxBuffer: MAX_OUTPUT_BYTES });
  if (result.error || result.status !== 0) throw new Error(describeFailure(tool, result));
  return { stdout: result.stdout, stderr: String(result.stderr) };
}

export const log = (stage, message) => console.log(`[${stage}] ${message}`);
export const warn = (stage, message) => console.warn(`[${stage}] ${message}`);

/**
 * The one PCM stream shape the whole pipeline speaks (24 kHz 16-bit mono), shared
 * by every ffmpeg invocation that reads it — a stage that disagrees with the rest
 * would resample or misdecode the chapter.
 */
export const PCM_HEAD = ['-f', 's16le', '-ar', String(AUDIO_CONFIG.sourceSampleRate), '-ac', '1'];
export const PCM_INPUT = [...PCM_HEAD, '-i', 'pipe:0'];

const RUN = ['-f', 'null', '-'];
const LUFS = /I:\s*(-?[\d.]+|-?inf)\s*LUFS/;
const TRUE_PEAK = /Peak:\s*(-?[\d.]+|-?inf)\s*dBFS/;
const RMS = /RMS level dB:\s*(-?[\d.]+|-?inf)/;

const toNumber = (raw) => (raw === undefined ? undefined : { inf: Infinity, '-inf': -Infinity }[raw] ?? Number(raw));

/** ffmpeg prints its summary last, so anchoring there ignores the progress lines and keeps keys unique. */
function summaryValue(stderr, anchor, pattern) {
  const at = stderr.lastIndexOf(anchor);
  return toNumber(at < 0 ? undefined : stderr.slice(at).match(pattern)?.[1]);
}

/**
 * The one loudness measurement in the pipeline: master chooses its gain with it and verify gates on it,
 * so the number a chapter is normalized to is the same number it is judged by. A metric ffmpeg did not
 * report stays `undefined`, which every caller compares against as a failure. `rms` adds the astats
 * pass only per-segment verification needs.
 */
function measure(pcm, { rms }) {
  const stderr = runTool(FFMPEG, [...PCM_INPUT, '-af', rms ? 'ebur128=peak=true,astats' : 'ebur128=peak=true', ...RUN], pcm).stderr;
  return {
    lufs: summaryValue(stderr, 'Integrated loudness:', LUFS),
    truePeakDb: summaryValue(stderr, 'True peak:', TRUE_PEAK),
    ...(rms ? { rmsDb: summaryValue(stderr, 'Overall', RMS) } : {}),
  };
}

/** Per-segment measurement: loudness, true peak and an RMS floor to catch truncated takes. */
export const measureLevels = (pcm) => measure(pcm, { rms: true });

/** Chapter-contract measurement: integrated loudness and true peak, measured on the bytes encode publishes. */
export const measureChapter = (pcm) => measure(pcm, { rms: false });

/** Aligned column table; widths come from the widest cell, so callers never pad. */
export function table(headers, rows) {
  const cells = rows.map((row) => row.map((cell) => String(cell ?? '')));
  const widths = headers.map((header, column) => Math.max(header.length, ...cells.map((row) => (row[column] ?? '').length)));
  const line = (row) => row.map((cell, column) => (cell ?? '').padEnd(widths[column])).join('  ').trimEnd();
  return [line(headers), widths.map((width) => '-'.repeat(width)).join('  '), ...cells.map(line)].join('\n');
}

export const statusLine = (pass, label, detail = '') => `${pass ? 'PASS' : 'FAIL'}  ${label.padEnd(6)}${detail}`.trimEnd();
export const seconds = (ms) => `${(ms / 1000).toFixed(1)}s`;
