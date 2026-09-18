/**
 * Single source of truth for every knob that changes rendered audio.
 *
 * All of it feeds the segment cache key (see hash.ts), so changing one value
 * re-renders affected segments instead of silently mixing takes inside a chapter.
 * Audio may lag the text; the manifest records what each MP3 was built from.
 */
/**
 * The two fixed hosts of a two-speaker chapter, bound to voices here (config is
 * the SSOT) so a dialogue script stays voice-agnostic and diffable. `alex` is the
 * instructor who explains; `sam` is the senior engineer who questions from
 * competence and restates. These are the historic podcast personas.
 */
export type SpeakerRole = 'alex' | 'sam';

/** The 30 Gemini prebuilt voices; render config must pick from this list. */
export const GEMINI_VOICES: readonly string[] = [
  'Zephyr',
  'Puck',
  'Charon',
  'Kore',
  'Fenrir',
  'Leda',
  'Orus',
  'Aoede',
  'Callirrhoe',
  'Autonoe',
  'Enceladus',
  'Iapetus',
  'Umbriel',
  'Algieba',
  'Despina',
  'Erinome',
  'Algenib',
  'Rasalgethi',
  'Laomedeia',
  'Achernar',
  'Alnilam',
  'Schedar',
  'Gacrux',
  'Pulcherrima',
  'Achird',
  'Zubenelgenubi',
  'Vindemiatrix',
  'Sadachbia',
  'Sadaltager',
  'Sulafat',
];

export const AUDIO_CONFIG = {
  modelId: 'gemini-2.5-pro-preview-tts',
  transcribeModelId: 'gemini-3.5-transcribe',
  /** Role→voice binding: Alex (Kore, Firm) explains; Sam (Charon, Informative) questions. */
  speakers: {
    alex: 'Kore',
    sam: 'Charon',
  } as Record<SpeakerRole, string>,
  /**
   * Transcribe takes inline audio (~20 MB per request), so a chunk must stay
   * well under that: ~3500 chars ≈ 5 min of dialogue audio per request.
   */
  dialogue: { maxChunkChars: 3500 },
  /** Raw 24 kHz 16-bit mono PCM: no decode step, and the source for ffmpeg's resample. */
  sourceSampleRate: 24000,
  encode: { sampleRate: 44100, bitrateKbps: 64, channels: 1 },
  gates: {
    werMax: 0.1,
    /**
     * Loudness is a window with a CEILING, not a ± target. A fixed target and a true-peak ceiling are
     * jointly unsatisfiable for this material: raw TTS sits ~19.5 dB below its own true peak, so
     * normalizing up to -19 LUFS lands the peak ~3.5 dB over the ceiling, and the master must either
     * miss the target or pump to satisfy both. The ceiling is the contract; the floor only catches a
     * master that came out broken or near-silent.
     */
    lufsMinDb: -25,
    lufsMaxDb: -18,
    truePeakMaxDb: -3,
    /** A segment quieter than this reads as a truncated or empty render. */
    segmentRmsMinDb: -45,
    /** A chunk join must land in silence: two takes meeting mid-word chop the audio. */
    spliceSilenceMaxRmsDb: -50,
    spliceMaxStepLsb: 1024,
  },
  /**
   * Echo guard. Any two turns in the chapter that share a `runCharsMin`-char run of
   * content words are a defect: the listener hears the same fact twice, wherever it
   * sits, so a closing recap must paraphrase too. Content words are compared, not the
   * full stream, so shared function words never count. Calibrated on how-llms-work
   * (its worst defect shares 49 content chars; the loudest benign pair shares 19).
   * `narrationOverlapDiceMin` is the softer hint for a figure/code narration echoing the prose
   * beside it, shown only in `audio:dialogue:source` (never a gate). It is low-precision by
   * design — a book-wide scan flags ~28% of narrations, most of them benign restatement — so
   * treat it as an authoring nudge, not a defect count. See `redundancy.ts`.
   */
  redundancy: { runCharsMin: 20, narrationOverlapDiceMin: 0.35 },
} as const;

/** Render-time guard: a missing or unknown voice silently produces audio nobody chose. */
export function assertRenderConfig(): void {
  const bad = Object.entries(AUDIO_CONFIG.speakers).filter(
    ([, voice]) => !voice || !GEMINI_VOICES.includes(voice)
  );
  if (bad.length) {
    throw new Error(
      `AUDIO_CONFIG has unknown voice name(s) for ${bad.map(([role]) => role).join(', ')}. Pick from the Gemini prebuilt list and commit them in website/src/audiobook/config.ts.`
    );
  }
}
