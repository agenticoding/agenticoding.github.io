import type { SpeakerRole } from './config.ts';

/**
 * Voice-identity gate: did each render unit actually carry the second host's voice?
 *
 * The word gates (WER/terms) compare text, so a take that reads every turn in one
 * voice transcribes identically and passes — the defect `retrieval-augmented-generation`
 * shipped once. Pitch separates the two configured hosts by design (a female and a
 * male prebuilt voice), so a unit whose script holds Sam turns but whose audio never
 * drops into Sam's register rendered a single voice.
 *
 * The unit — one Gemini request, one take — is the right grain: a mono take is exactly
 * a unit with no second-register audio, while a take's per-turn boundaries can drift
 * (ASR alignment is approximate), so anything finer would false-positive on healthy
 * audio. Pure audio math: verify runs it, and because it costs no API call the build's
 * re-roll loop may retry a collapsed take.
 */

/** Pitch knobs and thresholds; see `AUDIO_CONFIG.voice`. */
export type VoiceGates = {
  frameMs: number;
  hopMs: number;
  minHz: number;
  maxHz: number;
  voicedRmsFloor: number;
  minVoicedFrames: number;
  minTurnsPerRole: number;
  minRoleSeparation: number;
};

/** One turn's measured pitch, tagged with the render unit that owns it (the re-roll target). */
export type TurnPitch = {
  unitId: string;
  segmentId: string;
  speaker: SpeakerRole;
  pitchHz: number | null;
};

/** A gate failure, attributed to the render unit whose take must be re-rendered. */
export type VoiceProblem = { unitId: string; problem: string };

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = sorted.length >> 1;
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};

const round = (hz: number): number => Math.round(hz);

const closerTo = (pitchHz: number, target: number, other: number): boolean =>
  Math.abs(pitchHz - target) < Math.abs(pitchHz - other);

/**
 * Autocorrelation pitch of one frame, or null for silence. Lag is searched only in
 * the speech band, and the median over a turn absorbs the few frames that still halve.
 */
function framePitch(
  frame: Int16Array,
  sampleRate: number,
  gates: VoiceGates
): number | null {
  let mean = 0;
  for (const sample of frame) mean += sample;
  mean /= frame.length;
  const centered = Float64Array.from(frame, (sample) => sample - mean);
  let energy = 0;
  for (const value of centered) energy += value * value;
  if (Math.sqrt(energy / centered.length) < gates.voicedRmsFloor) return null;
  const minLag = Math.floor(sampleRate / gates.maxHz);
  const maxLag = Math.min(
    Math.floor(sampleRate / gates.minHz),
    centered.length - 1
  );
  let bestLag = 0;
  let bestScore = -Infinity;
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let score = 0;
    for (let index = 0; index + lag < centered.length; index += 1)
      score += centered[index] * centered[index + lag];
    if (score > bestScore) {
      bestScore = score;
      bestLag = lag;
    }
  }
  return bestLag ? sampleRate / bestLag : null;
}

/** Median voiced pitch over one take, or null when too few frames are voiced to measure. */
export function medianPitchHz(
  pcm: Int16Array,
  sampleRate: number,
  gates: VoiceGates
): number | null {
  const frame = Math.round((gates.frameMs / 1000) * sampleRate);
  const hop = Math.round((gates.hopMs / 1000) * sampleRate);
  const pitches: number[] = [];
  for (let start = 0; start + frame <= pcm.length; start += hop) {
    const pitch = framePitch(
      pcm.subarray(start, start + frame),
      sampleRate,
      gates
    );
    if (pitch !== null) pitches.push(pitch);
  }
  return pitches.length >= gates.minVoicedFrames ? median(pitches) : null;
}

/** Chapter reference pitch per host: the median of every measurable turn in the role. */
const roleMedian = (turns: TurnPitch[], role: SpeakerRole): number | null => {
  const pitches = turns.flatMap((turn) =>
    turn.speaker === role && turn.pitchHz !== null ? [turn.pitchHz] : []
  );
  return pitches.length ? median(pitches) : null;
};

/**
 * Chapter-level separation between the two hosts' registers. Below `minRoleSeparation`
 * the chapter carries one voice everywhere; the two calibrated hosts sit near 0.36.
 */
export const roleSeparation = (alex: number, sam: number): number =>
  Math.abs(alex - sam) / Math.max(alex, sam);

/** Turns that share a render unit, so a failure names the take the build must replace. */
const byUnit = (turns: TurnPitch[]): Map<string, TurnPitch[]> => {
  const units = new Map<string, TurnPitch[]>();
  for (const turn of turns)
    units.set(turn.unitId, [...(units.get(turn.unitId) ?? []), turn]);
  return units;
};

/**
 * Flags every unit that holds Sam turns but never reaches Sam's register — the mono
 * take. When the whole chapter collapsed (`mono`), every such unit is a re-roll target.
 * A unit with no measurable turn is skipped: pitch cannot judge it, and a short or
 * silent take is already caught by the RMS gate.
 */
function unitProblems(
  turns: TurnPitch[],
  alex: number,
  sam: number,
  mono: boolean
): VoiceProblem[] {
  const monoMessage = `voice: chapter carries one voice (alex ${round(alex)} Hz ≈ sam ${round(sam)} Hz) — the second host was not rendered`;
  const unitMessage = `voice: Sam turns present but the take never reaches Sam's register (alex ${round(alex)} Hz / sam ${round(sam)} Hz) — the take rendered one voice`;
  return [...byUnit(turns)].flatMap(([unitId, unitTurns]) => {
    if (!unitTurns.some((turn) => turn.speaker === 'sam')) return [];
    const pitches = unitTurns.flatMap((turn) =>
      turn.pitchHz !== null ? [turn.pitchHz] : []
    );
    if (!pitches.length) return [];
    // Any turn near Sam clears the unit: ASR turn boundaries drift, so the take — not the label — is judged (never filter to sam-only turns).
    if (!mono && pitches.some((pitch) => closerTo(pitch, sam, alex))) return [];
    return [{ unitId, problem: mono ? monoMessage : unitMessage }];
  });
}

/**
 * Measurable (non-null pitch) turns per role: a chapter median from fewer is a
 * single sample, not a register, so the separation comparison cannot judge it.
 */
const measurableTurns = (turns: TurnPitch[], role: SpeakerRole): number =>
  turns.filter((turn) => turn.speaker === role && turn.pitchHz !== null)
    .length;

/** Sam-light chapters skip the gate instead of re-roll-looping on one sample. */
const enoughEvidence = (turns: TurnPitch[], gates: VoiceGates): boolean =>
  measurableTurns(turns, 'alex') >= gates.minTurnsPerRole &&
  measurableTurns(turns, 'sam') >= gates.minTurnsPerRole;

/**
 * Gate failures for a chapter's turns. Without enough measurable pitch per role the
 * comparison is undefined, so the gate stays silent rather than guessing.
 */
export function voiceProblems(
  turns: TurnPitch[],
  gates: VoiceGates
): VoiceProblem[] {
  if (!enoughEvidence(turns, gates)) return [];
  const alex = roleMedian(turns, 'alex');
  const sam = roleMedian(turns, 'sam');
  if (alex === null || sam === null) return [];
  return unitProblems(
    turns,
    alex,
    sam,
    roleSeparation(alex, sam) < gates.minRoleSeparation
  );
}
