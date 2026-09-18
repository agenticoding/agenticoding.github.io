/**
 * Stitch — one chapter stream plus its section boundaries.
 *
 * PCM is concatenated in segment order; because every segment is already 24 kHz
 * 16-bit mono, joining the buffers is the whole "stitch" step (D8: one shared
 * encoder pass, no intermediate encode).
 *
 * ID3 chapters are per heading section (plus the title), while the manifest keeps
 * a mark per segment so the player can highlight the exact passage (D5).
 */
/**
 * Only the title and real heading anchors open an ID3 chapter: turns anchored to
 * a null heading stay inside the surrounding section instead of creating
 * duplicate-title chapter entries. Consecutive segments that share one heading
 * merge into a single entry, which is what a dialogue chapter needs (several turns
 * per heading). `key` is the heading identity (a slug); `title` is the human
 * heading text, never the slug.
 */
const headingTitles = (script) => new Map((script.headings ?? []).map(({ id, title }) => [id, title]));

function sectionFor(segment, script, titles) {
  if (segment.kind === 'title') return { key: 'title', title: script.title };
  if (segment.anchor.kind !== 'heading' || !segment.anchor.id) return null;
  return { key: segment.anchor.id, title: titles.get(segment.anchor.id) ?? segment.anchor.id };
}

export function sectionsFor(script, stream) {
  const titles = headingTitles(script);
  const sections = [];
  let previousKey;
  script.segments.forEach((segment, index) => {
    const section = sectionFor(segment, script, titles);
    if (!section || section.key === previousKey) return;
    const previous = sections.at(-1);
    if (previous) previous.endMs = stream.spans[index].startMs;
    sections.push({ title: section.title, startMs: stream.spans[index].startMs, endMs: stream.durationMs });
    previousKey = section.key;
  });
  return sections;
}

/** One mark per segment: the player resolves its anchor at runtime (D4). */
export const marksFor = (script, stream) =>
  script.segments.map((segment, index) => ({
    startMs: stream.spans[index].startMs,
    endMs: stream.spans[index].endMs,
    segmentId: segment.id,
    label: segment.label ?? segment.speaker ?? segment.kind,
    anchor: segment.anchor,
    ...(segment.speaker ? { speaker: segment.speaker } : {}),
  }));

/** ffmetadata escapes `\`, `=`, `;` and `#`; line breaks would end the value. */
export const escapeMetadata = (text) => String(text).replace(/[\\;#=]/g, '\\$&').replace(/\n/g, ' ');

export function ffmetadata(title, sections) {
  const lines = [';FFMETADATA1', `title=${escapeMetadata(title)}`];
  for (const section of sections) {
    lines.push('[CHAPTER]', 'TIMEBASE=1/1000', `START=${section.startMs}`, `END=${section.endMs}`, `title=${escapeMetadata(section.title)}`);
  }
  return `${lines.join('\n')}\n`;
}
