import { strict as assert } from 'node:assert';
import test from 'node:test';

import type { Anchor, AudioMark } from './schemas.ts';
import {
  chapterProgress,
  deriveAudioOutline,
  neighbourSection,
  voiceIdAt,
  voiceIndex,
} from './outline.ts';

function mark(startMs: number, endMs: number, anchor: Anchor): AudioMark {
  return {
    startMs,
    endMs,
    segmentId: `s${startMs}`,
    label: `label ${startMs}`,
    anchor,
  };
}

const heading = (id: string | null): Anchor => ({ kind: 'heading', id });

/**
 * Shaped after a real two-speaker chapter: the narration opens on prose that no heading
 * precedes, then reaches two headlined sections, and a figure sits inside the first.
 */
const marks: AudioMark[] = [
  mark(0, 20_000, heading(null)),
  mark(20_000, 53_000, heading(null)),
  mark(53_000, 66_000, heading('task')),
  mark(66_000, 68_000, { kind: 'figure', index: 0 }),
  mark(68_000, 91_000, { kind: 'code', index: 0, headingId: 'task' }),
  mark(91_000, 98_000, heading('questions')),
];

const entries = [
  { id: 'task', title: 'Start with the task' },
  { id: 'questions', title: 'Ask questions to load context' },
];

test('the opener becomes a preamble, not a row', () => {
  const outline = deriveAudioOutline(entries, marks);
  assert.deepEqual(outline.preamble, { startMs: 0, endMs: 53_000 });
  assert.deepEqual(
    outline.rows.map((row) => [row.id, row.startMs, row.endMs]),
    [
      ['task', 53_000, 91_000],
      ['questions', 91_000, 98_000],
    ]
  );
});

test('figure and code marks join the heading that precedes them', () => {
  const outline = deriveAudioOutline(entries, marks);
  // The figure at 66s and the code at 68s both extend `task`; without the carried
  // heading id they would have no section to belong to.
  assert.equal(outline.byId.get('task')?.endMs, 91_000);
  assert.equal(outline.byId.get('questions')?.startMs, 91_000);
});

test('rows use the TOC title, and an id the page does not render keeps its own name', () => {
  assert.equal(
    deriveAudioOutline(entries, marks).byId.get('task')?.title,
    'Start with the task'
  );
  const orphan = deriveAudioOutline([], marks);
  assert.deepEqual(
    orphan.rows.map((row) => row.title),
    ['task', 'questions'] // visible mismatch beats silently dropped narration
  );
});

test('a heading with no narration is absent from the outline', () => {
  const outline = deriveAudioOutline(
    [...entries, { id: 'silent', title: 'Never narrated' }],
    marks
  );
  assert.equal(outline.byId.has('silent'), false);
});

test('a chapter with no marks stays empty instead of inventing a section', () => {
  const outline = deriveAudioOutline(entries, []);
  assert.deepEqual(outline.rows, []);
  assert.equal(outline.preamble, null);
  assert.equal(voiceIdAt(outline, 0), null);
});

test('the voice is the last section that started, and null while the opener plays', () => {
  const outline = deriveAudioOutline(entries, marks);
  assert.equal(voiceIdAt(outline, 0), null);
  assert.equal(voiceIdAt(outline, 52_999), null);
  assert.equal(voiceIdAt(outline, 53_000), 'task');
  assert.equal(voiceIdAt(outline, 90_999), 'task');
  assert.equal(voiceIdAt(outline, 91_000), 'questions');
  // Parked at the end the player stays on the closing section, like every other player.
  assert.equal(voiceIdAt(outline, 200_000), 'questions');
});

test('voiceIndex counts from zero and is -1 before the first section', () => {
  const outline = deriveAudioOutline(entries, marks);
  assert.equal(voiceIndex(outline, voiceIdAt(outline, 0)), -1);
  assert.equal(voiceIndex(outline, voiceIdAt(outline, 60_000)), 0);
  assert.equal(voiceIndex(outline, voiceIdAt(outline, 93_000)), 1);
});

test('section skipping restarts the first section rather than seeking before it', () => {
  const outline = deriveAudioOutline(entries, marks);
  // From the opener, "previous" has nowhere to go but the first section.
  assert.equal(neighbourSection(outline, 0, -1)?.id, 'task');
  // From inside the first section it restarts that section: an earlier one does not exist.
  assert.equal(neighbourSection(outline, 60_000, -1)?.id, 'task');
  assert.equal(neighbourSection(outline, 60_000, 1)?.id, 'questions');
  // Past the last section there is nothing next.
  assert.equal(neighbourSection(outline, 93_000, 1), null);
  assert.equal(neighbourSection(deriveAudioOutline(entries, []), 0, 1), null);
});

test('chapter progress clamps at both ends and reports the midpoint', () => {
  assert.equal(chapterProgress(0, 200_000), 0);
  assert.equal(chapterProgress(100_000, 200_000), 0.5);
  assert.equal(chapterProgress(200_000, 200_000), 1);
  assert.equal(chapterProgress(300_000, 200_000), 1);
});

test('an unreadable clock or an empty chapter reports no progress', () => {
  assert.equal(chapterProgress(Number.NaN, 200_000), 0);
  assert.equal(chapterProgress(10_000, 0), 0);
});
