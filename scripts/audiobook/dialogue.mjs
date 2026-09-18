/**
 * Dialogue stream — assembles the two-speaker chapter PCM from cached chunks.
 *
 * Turns are packed into ≤maxChunkChars chunks and rendered one request each
 * (Gemini TTS has no request stitching). Gemini returns only the chunk's PCM, not
 * per-speaker timings, so turn boundaries come from a second pass: `transcribe`
 * with word timestamps, aligned back onto the turn texts. The chunk is still
 * sliced into per-turn PCM so the master/verify/marks/encode stages keep seeing
 * the exact `{parts, spans, pcm}` shape they already consume.
 */
import { rmSync } from 'node:fs';
import { AUDIO_CONFIG } from '../../website/src/audiobook/config.ts';
import { chunkTurns, turnSliceBounds, turnStartMs } from '../../website/src/audiobook/dialogue.ts';
import { dialogueChunkCacheKey } from '../../website/src/audiobook/hash.ts';
import { renderDialogueChunk } from './render.mjs';
import { cacheFile, exists, log, pcmBytesForMs, pcmDurationMs, readBytes, readJsonIfExists, table, transcribe, warn, writeFile, writeJson } from './report.mjs';

export function chunkState(turns, force = false) {
  const cacheKey = dialogueChunkCacheKey(turns);
  return { cacheKey, hit: !force && exists(cacheFile(cacheKey, '.pcm')) };
}

/** Drops a cached chunk (take + alignment) so a failed verification gate can be retried. */
export function discardChunk(turns) {
  const { cacheKey } = chunkState(turns);
  for (const ext of ['.pcm', '.json']) rmSync(cacheFile(cacheKey, ext), { force: true });
}

/** Renders one chunk, then aligns its turns so the cache can be sliced without re-running ASR. */
async function renderChunk(turns, cacheKey) {
  const { request, pcm } = await renderDialogueChunk(turns);
  const { words } = await transcribe(pcm, { wordTimestamp: true });
  const boundariesMs = turnStartMs(
    turns.map((turn) => turn.text),
    words
  );
  writeJson(cacheFile(cacheKey, '.json'), { request, words, boundariesMs });
  writeFile(cacheFile(cacheKey, '.pcm'), pcm); // PCM last: its presence marks the chunk cached
  return { pcm, words, boundariesMs };
}

const readChunk = (cacheKey) => {
  const cached = readJsonIfExists(cacheFile(cacheKey, '.json'));
  return { pcm: readBytes(cacheFile(cacheKey, '.pcm')), words: cached?.words ?? [], boundariesMs: cached?.boundariesMs };
};

/**
 * Byte boundary per turn, plus the chunk end. Aligned boundaries are
 * authoritative; proportional slicing is a visible fallback for the rare ASR
 * miss, never a silent one.
 */
function turnBoundaries(turns, { words, boundariesMs }, totalBytes) {
  if (words?.length && boundariesMs?.length === turns.length) {
    return turnSliceBounds(boundariesMs.map(pcmBytesForMs), totalBytes);
  }
  warn('dialogue', `alignment unavailable (${words?.length ?? 0} words for ${turns.length} turns); slicing proportionally by text length`);
  return proportionalBoundaries(turns, totalBytes);
}

function proportionalBoundaries(turns, totalBytes) {
  const total = turns.reduce((sum, turn) => sum + turn.text.length, 0);
  let chars = 0;
  return turns
    .map((turn) => {
      const at = Math.round((chars / total) * totalBytes);
      chars += turn.text.length;
      return at;
    })
    .concat(totalBytes);
}

function sliceChunk(turns, pcm, meta) {
  const bounds = turnBoundaries(turns, meta, pcm.length);
  const parts = turns.map((turn, index) => ({
    segment: turn,
    pcm: pcm.subarray(Math.max(0, bounds[index]), Math.min(pcm.length, bounds[index + 1])),
  }));
  // Slicing must partition the chunk: any loss means clipped audio ships silently.
  const sliced = parts.reduce((sum, part) => sum + part.pcm.length, 0);
  if (sliced !== pcm.length) throw new Error(`chunk slicing lost ${pcm.length - sliced} of ${pcm.length} bytes`);
  return parts;
}

/** Renders or reads one chunk and returns its per-turn stream slice, timed from `offsetMs`. */
async function streamChunk(turns, { force, index, offsetMs, firstPart }) {
  const { cacheKey, hit } = chunkState(turns, force);
  const meta = hit ? readChunk(cacheKey) : await renderChunk(turns, cacheKey);
  const parts = sliceChunk(turns, meta.pcm, meta);
  const spans = [];
  let endMs = offsetMs;
  for (const part of parts) {
    const startMs = endMs;
    endMs += pcmDurationMs(part.pcm);
    spans.push({ segmentId: part.segment.id, startMs, endMs });
  }
  const unit = {
    id: `c${index + 1}`,
    kind: 'turn',
    text: turns.map((turn) => turn.text).join(' '),
    partIndexes: parts.map((_, partIndex) => firstPart + partIndex),
  };
  return { parts, spans, unit, endMs };
}

/** Renders any missing chunks and returns the full per-turn stream. */
export async function dialogueStream(script, options = {}) {
  const chunks = chunkTurns(script.segments, AUDIO_CONFIG.dialogue.maxChunkChars);
  const parts = [];
  const spans = [];
  const units = [];
  let offsetMs = 0;
  for (const [index, turns] of chunks.entries()) {
    const chunk = await streamChunk(turns, { force: options.force, index, offsetMs, firstPart: parts.length });
    parts.push(...chunk.parts);
    spans.push(...chunk.spans);
    units.push(chunk.unit);
    offsetMs = chunk.endMs;
  }
  return { parts, spans, pcm: Buffer.concat(parts.map((part) => part.pcm)), durationMs: offsetMs, units };
}

/** Dry-run plan: one row per chunk, plus the character count (the render cost). */
export function printDialoguePlan(script, options = {}) {
  const chunks = chunkTurns(script.segments, AUDIO_CONFIG.dialogue.maxChunkChars);
  const states = chunks.map((turns) => ({ turns, ...chunkState(turns, options.force) }));
  const rows = states.map(({ turns, cacheKey, hit }, index) => [
    `c${index + 1}`,
    turns.length,
    turns.reduce((sum, turn) => sum + turn.text.length, 0),
    `${cacheKey.slice(0, 8)} ${hit ? 'HIT' : 'MISS'}`,
  ]);
  console.log(table(['chunk', 'turns', 'chars', 'cache'], rows));
  const misses = states.filter((state) => !state.hit);
  const chars = misses.reduce((sum, { turns }) => sum + turns.reduce((total, turn) => total + turn.text.length, 0), 0);
  log('plan', `${script.chapterId}: ${script.segments.length} turns in ${chunks.length} chunks, ${misses.length} to render, ~${chars} chars`);
}
