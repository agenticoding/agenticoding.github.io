import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { AUDIO_DOC_IDS } from './docs.ts';
import { loadDialogue } from './dialogue.ts';
import { type AudioManifest, validateManifest } from './schemas.ts';

const AUDIO_DIR = new URL('../../static/audio/', import.meta.url);
const MANIFEST_FILE = new URL('manifest.json', AUDIO_DIR);

// Audio is a build artifact, so these tests skip rather than fail before `npm run audio:build`.
const NO_MANIFEST =
  !existsSync(MANIFEST_FILE) &&
  'website/static/audio/manifest.json is missing — run npm run audio:build';

const readManifest = (): AudioManifest => {
  assert.ok(
    existsSync(MANIFEST_FILE),
    NO_MANIFEST || 'manifest.json disappeared mid-run'
  );
  return JSON.parse(readFileSync(MANIFEST_FILE, 'utf8'));
};

/**
 * Audio legitimately lags the text, so staleness is reported instead of failing.
 * What must never happen is a manifest that points at audio nobody can play.
 */
test(
  'the manifest is internally consistent, matches the config, and its audio exists',
  { skip: NO_MANIFEST },
  (t) => {
    const manifest = readManifest();
    const problems = validateManifest(manifest);
    const stale: string[] = [];
    for (const [id, audio] of Object.entries(manifest.chapters)) {
      if (!existsSync(new URL(audio.file, AUDIO_DIR)))
        problems.push(`${id}: ${audio.file} is missing`);
      const dialogue = loadDialogue(id);
      if (!dialogue) {
        problems.push(`${id}: manifest entry without a dialogue script`);
      } else if (dialogue.script.contentHash !== audio.narrationHash) {
        stale.push(id);
      }
    }
    // Staleness is a report, not a failure: audio legitimately lags the text.
    if (stale.length)
      t.diagnostic(
        `[audio] stale narration hash: ${stale.join(', ')} — rendered from an older dialogue script`
      );
    assert.deepEqual(problems, []);
  }
);

test(
  'every published MP3 is described by the manifest',
  { skip: NO_MANIFEST },
  () => {
    const manifest = readManifest();
    const published = readdirSync(AUDIO_DIR, { recursive: true })
      .filter((name) => String(name).endsWith('.mp3'))
      .map(String)
      .sort();
    const described = Object.values(manifest.chapters)
      .map((audio) => audio.file)
      .sort();
    assert.deepEqual(published, described);
  }
);

test('manifest chapter keys are real documents', { skip: NO_MANIFEST }, () => {
  const unknown = Object.keys(readManifest().chapters).filter(
    (id) => !AUDIO_DOC_IDS.includes(id)
  );
  assert.deepEqual(unknown, []);
});
