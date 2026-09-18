import { AUDIO_CONFIG, type SpeakerRole } from './config.ts';
import type { HeadingInfo } from './headings.ts';

/** Where a segment sits in the rendered page; the TOC outline matches sections on these. */
export type Anchor =
  | { kind: 'heading'; id: string | null }
  | { kind: 'figure'; index: number }
  | { kind: 'code'; index: number; headingId: string | null };

export type SegmentKind = 'title' | 'turn';

export type Segment = {
  id: string;
  kind: SegmentKind;
  text: string;
  anchor: Anchor;
  /** Human label for the player's section list (figure title, code language). */
  label?: string;
  /** Set on dialogue turns; the synthesised title turn also carries Alex. */
  speaker?: SpeakerRole;
};

/** Committed, diffable spoken script for one document. Audio lags it. */
export type NarrationScript = {
  chapterId: string;
  title: string;
  sourceHash: string;
  contentHash: string;
  /** Heading id → human title, so section labels (ID3 chapters) never show a slug. */
  headings: HeadingInfo[];
  segments: Segment[];
};

export type AudioMark = {
  startMs: number;
  endMs: number;
  segmentId: string;
  label: string;
  anchor: Anchor;
  speaker?: SpeakerRole;
};

export type ChapterAudio = {
  file: string;
  modelId: string;
  /** Every chapter is a two-speaker dialogue: the manifest records the role→voice map. */
  speakers?: Record<SpeakerRole, string>;
  narrationHash: string;
  durationMs: number;
  sampleRate: number;
  bitrateKbps: number;
  lufs: number;
  truePeakDb: number;
  marks: AudioMark[];
};

export type AudioManifest = {
  version: number;
  chapters: Record<string, ChapterAudio>;
};

export const MANIFEST_VERSION = 1;

export function validateManifest(manifest: AudioManifest): string[] {
  const problems: string[] = [];
  Object.entries(manifest.chapters).forEach(([chapterId, audio]) => {
    const where = `manifest.${chapterId}`;
    if (audio.narrationHash.length !== 64)
      problems.push(`${where}: narrationHash is not a sha256`);
    if (!(audio.durationMs > 0))
      problems.push(`${where}: durationMs must be positive`);
    if (audio.modelId !== AUDIO_CONFIG.modelId)
      problems.push(`${where}: rendered with a different model`);
    problems.push(...voiceProblems(where, audio));
    if (audio.sampleRate !== AUDIO_CONFIG.encode.sampleRate)
      problems.push(`${where}: unexpected sample rate`);
    if (audio.bitrateKbps !== AUDIO_CONFIG.encode.bitrateKbps)
      problems.push(`${where}: unexpected bitrate`);
    problems.push(...markProblems(where, audio));
  });
  return problems;
}

function markProblems(where: string, audio: ChapterAudio): string[] {
  const problems: string[] = [];
  audio.marks.forEach((mark, index) => {
    const previous = audio.marks[index - 1];
    if (!(mark.endMs > mark.startMs))
      problems.push(`${where}#${mark.segmentId}: empty mark`);
    if (mark.endMs > audio.durationMs + 1)
      problems.push(`${where}#${mark.segmentId}: mark past the end`);
    if (previous && mark.startMs < previous.endMs)
      problems.push(`${where}#${mark.segmentId}: marks overlap`);
  });
  if (audio.marks.length === 0) problems.push(`${where}: no marks`);
  return problems;
}

/**
 * Every voice a chapter used must be declared in config: an undeclared voice is
 * audio nobody can reproduce, and a chapter with no voice at all is a silent bug.
 */
function voiceProblems(where: string, audio: ChapterAudio): string[] {
  const problems: string[] = [];
  const declared = new Set<string>(Object.values(AUDIO_CONFIG.speakers));
  const used = audio.speakers ? Object.values(audio.speakers) : [];
  if (!used.length) problems.push(`${where}: no voice recorded`);
  used.forEach((voice) => {
    if (!declared.has(voice))
      problems.push(`${where}: rendered with an undeclared voice ${voice}`);
  });
  return problems;
}
