/**
 * Render — the only stage that produces audio.
 *
 * One dialogue chunk per request; the take is cached under the frozen
 * `dialogueChunkCacheKey` so an unchanged chunk is never paid for twice. Gemini
 * TTS is not deterministic, so a cache miss may produce different bytes and must
 * be a visible event.
 *
 * A dialogue chapter sends a labeled two-speaker transcript with
 * `multiSpeakerVoiceConfig` (Gemini derives speakers from the prompt labels, so
 * the labels are the contract). The model returns base64 24 kHz/16-bit/mono PCM
 * in `inlineData` — no server-side WAV/MP3.
 */
import { AUDIO_CONFIG } from '../../website/src/audiobook/config.ts';
import { dialogueTranscript, roleLabel } from '../../website/src/audiobook/dialogue.ts';
import { gemini, withRetry } from './report.mjs';

const MIME_RATE = /rate=(\d+)/;

const audioConfig = (speechConfig) => ({ responseModalities: ['AUDIO'], speechConfig });

/**
 * The multi-speaker request sends the raw `Alex:`/`Sam:` transcript built by
 * `dialogueTranscript` (the shared SSOT — the chunk cache key hashes the same
 * text). No pace direction: a measured/unhurried directive reads as sluggish, so
 * the model's natural, energetic delivery is preferred.
 */

const speakerConfig = (role) => ({
  speaker: roleLabel(role),
  voiceConfig: { prebuiltVoiceConfig: { voiceName: AUDIO_CONFIG.speakers[role] } },
});

const dialogueRequest = (turns) => ({
  model: AUDIO_CONFIG.modelId,
  contents: [{ parts: [{ text: dialogueTranscript(turns) }] }],
  config: audioConfig({
    multiSpeakerVoiceConfig: { speakerVoiceConfigs: [speakerConfig('alex'), speakerConfig('sam')] },
  }),
});

/**
 * Pull the PCM out of a generateContent response. A non-STOP finishReason means
 * the model hit the output-token cap (~10.9 min of audio) and the take is
 * truncated: that must fail, never be cached as complete.
 */
function decodeAudio(response) {
  const candidate = response.candidates?.[0];
  if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
    throw new Error(`generation stopped early: ${candidate.finishReason}`);
  }
  const inline = candidate?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData;
  if (!inline) throw new Error('response carried no audio');
  const rate = Number(MIME_RATE.exec(inline.mimeType ?? '')?.[1]);
  if (rate && rate !== AUDIO_CONFIG.sourceSampleRate) throw new Error(`unexpected sample rate ${rate} in ${inline.mimeType}`);
  const pcm = Buffer.from(inline.data ?? '', 'base64');
  if (!pcm.length) throw new Error('empty audio payload');
  return pcm;
}

const generate = (request) => withRetry(() => gemini().models.generateContent(request));

/** Two-speaker chunk rendering: one request, one PCM take for the whole chunk. */
export async function renderDialogueChunk(turns) {
  const request = dialogueRequest(turns);
  return { request, pcm: decodeAudio(await generate(request)) };
}
