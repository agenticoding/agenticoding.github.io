/**
 * Zero-provider helpers shared by every audio stage and the website unit tests.
 *
 * Kept apart from report.mjs on purpose: importing them must never drag a
 * provider SDK (`@google/genai`) into a pure-function test's module graph. CI
 * installs only `website/` deps, so a static SDK import reached from a website
 * test fails the whole test file (see verifyUnits.mjs).
 */

/**
 * Copy of s16le PCM as int16 samples: sample math without a per-sample Buffer read. The copy keeps
 * this correct for any byteOffset alignment, which a zero-copy view would not be.
 */
export const asInt16 = (pcm) =>
  new Int16Array(pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + (pcm.byteLength >> 1 << 1)));

export const log = (stage, message) => console.log(`[${stage}] ${message}`);
export const warn = (stage, message) => console.warn(`[${stage}] ${message}`);
