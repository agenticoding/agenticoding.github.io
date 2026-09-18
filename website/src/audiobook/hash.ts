import { AUDIO_CONFIG, type SpeakerRole } from './config.ts';
import { dialogueTranscript } from './dialogue.ts';
import { sha256 } from './serialize.ts';

/**
 * Cache key from a prompt text. `prompt` must be the exact text a render request
 * sends, so editing the template or labels (see `dialogueTranscript`) re-renders
 * instead of serving a stale take. The ASR model is hashed too: the cached entry
 * also holds the transcribed words/boundaries, so a transcribe upgrade must
 * re-align instead of reusing stale alignment.
 */
export const promptCacheKey = (prompt: string): string =>
  sha256(
    JSON.stringify({
      prompt,
      modelId: AUDIO_CONFIG.modelId,
      transcribeModelId: AUDIO_CONFIG.transcribeModelId,
      speakers: AUDIO_CONFIG.speakers,
    })
  );

export function dialogueChunkCacheKey(
  turns: ReadonlyArray<{ speaker: SpeakerRole; text: string }>
): string {
  return promptCacheKey(dialogueTranscript(turns));
}
