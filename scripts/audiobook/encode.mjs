/**
 * Encode — one ffmpeg pass from the stitched PCM to the published MP3, then the
 * manifest entry that lets the player find it.
 *
 * encode.sampleRate/bitrateKbps come from AUDIO_CONFIG, and validateManifest
 * asserts the manifest echoes them, so nobody can publish audio that no longer
 * matches the config. Loudness is whatever verify measured on the same PCM.
 */
import { mkdirSync, rmSync } from 'node:fs';
import { dirname } from 'node:path';
import { AUDIO_CONFIG } from '../../website/src/audiobook/config.ts';
import { MANIFEST_VERSION } from '../../website/src/audiobook/schemas.ts';
import { cacheFile, chapterMp3, flattenId, MANIFEST_FILE, PCM_INPUT, readJsonIfExists, runTool, FFMPEG, FFPROBE, writeFile, writeJson } from './report.mjs';
import { ffmetadata, marksFor, sectionsFor } from './stitch.mjs';

export function probeDurationMs(file) {
  const { stdout } = runTool(FFPROBE, ['-v', 'error', '-show_format', '-of', 'json', file.pathname]);
  const { format } = JSON.parse(String(stdout));
  return Math.round(Number(format.duration) * 1000);
}

/** ID3v2.3 CHAP frames are what ffmpeg writes from an ffmetadata file. */
export function encodeArgs(metadata, output) {
  const { sampleRate, bitrateKbps, channels } = AUDIO_CONFIG.encode;
  return [
    ...PCM_INPUT,
    '-i', metadata.pathname,
    '-map', '0:a',
    '-map_metadata', '1',
    '-map_chapters', '1',
    '-c:a', 'libmp3lame',
    '-b:a', `${bitrateKbps}k`,
    '-ar', String(sampleRate),
    '-ac', String(channels),
    '-id3v2_version', '3',
    '-y', output.pathname,
  ];
}

export function manifestEntry(script, report, stream) {
  return {
    file: `${script.chapterId}.mp3`,
    modelId: AUDIO_CONFIG.modelId,
    speakers: AUDIO_CONFIG.speakers,
    narrationHash: script.contentHash,
    durationMs: probeDurationMs(chapterMp3(script.chapterId)),
    sampleRate: AUDIO_CONFIG.encode.sampleRate,
    bitrateKbps: AUDIO_CONFIG.encode.bitrateKbps,
    lufs: report.lufs,
    truePeakDb: report.truePeakDb,
    marks: marksFor(script, stream),
  };
}

/** Keys are sorted so a one-chapter rebuild produces a one-entry diff. */
export function updateManifest(id, entry) {
  const manifest = readJsonIfExists(MANIFEST_FILE) ?? { version: MANIFEST_VERSION, chapters: {} };
  const chapters = { ...manifest.chapters, [id]: entry };
  const sorted = Object.fromEntries(Object.entries(chapters).sort(([left], [right]) => left.localeCompare(right)));
  writeJson(MANIFEST_FILE, { version: MANIFEST_VERSION, chapters: sorted });
  return entry;
}

/** The ffmetadata file is scratch: it is deleted even when ffmpeg fails. */
function chaptersFile(script, stream) {
  const file = cacheFile(`stitch-${flattenId(script.chapterId)}`, '.ffmetadata');
  writeFile(file, ffmetadata(script.title, sectionsFor(script, stream)));
  return file;
}

/** Encodes the already-mastered chapter stream, so published bytes match what verify measured. */
export function encodeChapter(script, report, stream) {
  const metadata = chaptersFile(script, stream);
  const output = chapterMp3(script.chapterId);
  mkdirSync(dirname(output.pathname), { recursive: true });
  try {
    runTool(FFMPEG, encodeArgs(metadata, output), stream.pcm);
  } finally {
    rmSync(metadata, { force: true });
  }
  return updateManifest(script.chapterId, manifestEntry(script, report, stream));
}
