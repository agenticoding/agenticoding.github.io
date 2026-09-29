/**
 * Single source of truth for every knob that changes rendered audio.
 *
 * The render inputs carried here (model ids, voices) feed the segment cache key
 * (see hash.ts), so changing one re-renders affected segments instead of silently
 * mixing takes inside a chapter. Lint-only knobs (redundancy, deixis) change no
 * audio. Audio may lag the text; the manifest records what each MP3 was built from.
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
  redundancy: {
    runCharsMin: 20,
    narrationOverlapDiceMin: 0.35,
    /**
     * IDF-cosine lexical-echo guard (`lexical.ts`). Bag-of-words overlap with inverse-
     * document-frequency weighting and cosine normalisation, catching the same fact in
     * largely the same words where the verbatim run gate above sees nothing (it needs a
     * contiguous run). **Advisory only** — `docRedundancyProblems` and
     * `dialogueLexicalRedundancyProblems` both surface WARNs, never fatal. The metric
     * measures lexical overlap, not meaning, and on the real corpus it cannot separate a
     * benign same-topic overlap from a recap: measured false positives score 0.29–0.31,
     * above the user-blessed golden paraphrase (0.20) and close to the true defect (0.52),
     * so no `cosineMin` splits them. The verbatim run gate stays the fatal repeat guard.
     * Cross-speaker restatement bypasses this gate because it is the format. `defectBand`
     * is the loudness above which repeats union into one fact cluster (see `clusterRepeats`);
     * softer same-topic pairs stay their own cluster so distinct facts are not merged.
     */
    lexical: { cosineMin: 0.15, minTokens: 8, defectBand: 0.2 },
  },
  /**
   * Spoken-text vocabulary for the visual-deixis guard (`deixis.ts`). A listener
   * cannot see the page, so a spoken reference to an on-page visual is meaningless.
   * `visualNouns` are the page visuals the guard looks for; `pointers` are the
   * locational words that pair with them ("the figure above", "shown below").
   * Only page-specific nouns belong here: `table` is figurative ("onto the table"),
   * and `image`/`visual` are the model's data modality and an adjective ("an image
   * patch", "the visual design") — each would flag benign speech far more often than
   * the page reference it seeks. Idioms like "the figure of speech" are excluded in
   * `deixis.ts` by rejecting "<noun> of …". Page-layout nouns (`panel`, `tile`, `chip`, `ribbon`,
   * `row`, `column`) joined the list after a chapter shipped narration that walked the drawing;
   * `box` did not — "the box" is idiomatic for a tool — and colours never appear bare, only next
   * to a position word, which is what `positions` is for.
   */
  deixis: {
    visualNouns: [
      'figure',
      'diagram',
      'chart',
      'graph',
      'illustration',
      'screenshot',
      'panel',
      'tile',
      'chip',
      'ribbon',
      'row',
      'column',
    ],
    pointers: [
      'above',
      'below',
      'following',
      'previous',
      'prior',
      'earlier',
      'later',
      'next',
    ],
    /**
     * Layout words, matched only when glued to a visual noun ("left panel", "top tile").
     * Bare, they are ordinary English ("the right answer", "the middle ground", "the top
     * priority") and idiomatic in a chapter each — putting them in `pointers` would bury
     * real defects in false positives.
     */
    positions: ['left', 'right', 'top', 'bottom', 'middle', 'center'],
  },
  /**
   * Voice-identity gate (`voice.ts`, run inside `verify`). Gemini's multi-speaker
   * TTS occasionally returns a single-voice take for a correctly-formed two-speaker
   * request — observed once on a chapter's final chunk — and the word gates cannot
   * see it: a mono take transcribes the same text. Each turn's median pitch must sit
   * on its configured voice's side of the chapter's alex/sam midpoint, so a collapsed
   * take fails the build and the re-roll loop replaces it. Pitch is local DSP, so this
   * costs no API call; it gates verification, it changes no audio.
   *
   * The check is self-calibrating (chapter-relative medians, not fixed Hz bands), so
   * swapping either voice in `speakers` needs no retuning — only a check that the two
   * voices are actually distinguishable (`minRoleSeparation`; Kore/Charon ≈ 0.36).
   */
  voice: {
    /** Autocorrelation frame/hop and the human pitch band searched. */
    frameMs: 40,
    hopMs: 20,
    minHz: 60,
    maxHz: 300,
    /** Frames below this int16 RMS are silence, not speech. */
    voicedRmsFloor: 250,
    /** A turn with fewer voiced frames than this is too short to measure and is skipped. */
    minVoicedFrames: 20,
    /**
     * Measurable (non-null pitch) turns each role needs before the gate judges.
     * A Sam-light chapter (one short Sam turn, or all turns too short to measure)
     * would otherwise compare one sample against Alex's register and re-roll-loop
     * on a take that can never pass. 2 is the floor: 1 sample is not a register,
     * and the true-mono chapter the gate shipped against carries 2+ per role.
     */
    minTurnsPerRole: 2,
    /** |alex - sam| / max(alex, sam): under this the chapter carries a single voice. */
    minRoleSeparation: 0.15,
  },
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
