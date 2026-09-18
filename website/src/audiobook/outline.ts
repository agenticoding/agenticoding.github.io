/**
 * Chapter outline: which narration belongs to which table-of-contents row.
 *
 * The TOC is the skeleton, not the narration. A heading the narration never reaches
 * still renders as a row (the page owns the rows; this module only reports state for
 * the ids it knows), and a mark's anchor only decides which section it belongs to.
 *
 * Headings are the spine: the walk carries the last heading id forward through figure
 * and code marks, because the manifest's figure/code anchors carry no heading of their
 * own — document order is the only thing that relates them to a section.
 *
 * Marks before the first headlined section belong to the opener, which has no TOC row:
 * `preamble` carries that span so the header can still report position while it plays.
 */
import type { AudioMark } from './schemas.ts';

/** One heading the page renders, identified exactly as the manifest identifies it. */
export type TocEntry = { id: string; title: string };

/** A section the narration reaches. Sections with no narration are absent by design. */
export type OutlineRow = {
  id: string;
  title: string;
  startMs: number;
  endMs: number;
};

export type AudioOutline = {
  rows: OutlineRow[];
  /** Heading id → row, so a view can look up state by the id it already renders. */
  byId: ReadonlyMap<string, OutlineRow>;
  /** Opener span before the first headlined section; null when the chapter opens on a heading. */
  preamble: { startMs: number; endMs: number } | null;
};

type SectionSpan = { id: string | null; startMs: number; endMs: number };

/** Rows + their id map for headlined spans; the opener span becomes `preamble`. */
function outlineOf(
  titles: ReadonlyMap<string, string>,
  spans: readonly SectionSpan[]
): Pick<AudioOutline, 'rows' | 'byId' | 'preamble'> {
  const rows: OutlineRow[] = [];
  const byId = new Map<string, OutlineRow>();
  let preamble: AudioOutline['preamble'] = null;

  for (const span of spans) {
    if (span.id === null) {
      preamble = { startMs: span.startMs, endMs: span.endMs };
      continue;
    }
    // An id the page does not render keeps its own title: a manifest/page mismatch has
    // to stay visible in the UI instead of silently dropping narration.
    const row: OutlineRow = {
      id: span.id,
      title: titles.get(span.id) ?? span.id,
      startMs: span.startMs,
      endMs: span.endMs,
    };
    rows.push(row);
    byId.set(row.id, row);
  }
  return { rows, byId, preamble };
}

export function deriveAudioOutline(
  entries: readonly TocEntry[],
  marks: readonly AudioMark[]
): AudioOutline {
  const titles = new Map(entries.map((entry) => [entry.id, entry.title]));
  return outlineOf(titles, narrateSections(marks));
}

/** One span per contiguous run of marks sharing a heading; null id is the opener. */
function narrateSections(marks: readonly AudioMark[]): SectionSpan[] {
  const spans: SectionSpan[] = [];
  let headingId: string | null = null;
  marks.forEach((mark) => {
    if (mark.anchor.kind === 'heading' && mark.anchor.id)
      headingId = mark.anchor.id;
    const current = spans.at(-1);
    if (current && current.id === headingId) {
      current.endMs = mark.endMs;
      return;
    }
    spans.push({ id: headingId, startMs: mark.startMs, endMs: mark.endMs });
  });
  return spans;
}

/**
 * The section being narrated at `timeMs`, null while the opener plays or before narration
 * starts. Sections partition the timeline, so the voice is simply the last section that
 * started — a floor-by-start rule, which keeps the reported section on the closing one
 * after the chapter ends.
 */
export function voiceIdAt(
  outline: AudioOutline,
  timeMs: number
): string | null {
  return outline.rows.filter((row) => row.startMs <= timeMs).at(-1)?.id ?? null;
}

/** Index of the narrated section, 0-based; -1 while the opener plays. */
export function voiceIndex(
  outline: AudioOutline,
  voiceId: string | null
): number {
  return outline.rows.findIndex((row) => row.id === voiceId);
}

/**
 * The row the voice is in, or null while the opener plays. Every surface that names the
 * narrated section reads it here, so the announcer and the visible status text cannot name
 * two different sections.
 */
export function voiceRow(
  outline: AudioOutline,
  voiceId: string | null
): OutlineRow | null {
  return voiceId === null ? null : (outline.byId.get(voiceId) ?? null);
}

/**
 * Fraction of the whole chapter narrated at `timeMs`, 0..1 — the one definition the shared
 * scrubber consumes on both of its surfaces, the sidebar band and the mobile dock, so the two
 * fills cannot disagree. The sidebar's contents list deliberately draws no progress.
 *
 * Non-finite input or a zero-length chapter reports 0 rather than NaN: an unreadable
 * clock is "no progress", never a broken transform.
 */
export function chapterProgress(timeMs: number, durationMs: number): number {
  if (!Number.isFinite(timeMs) || !(durationMs > 0)) return 0;
  return clamp01(timeMs / durationMs);
}

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

/**
 * Section skip targets for OS media keys. At the first section there is nothing
 * before it, so `previous` returns that section — restarting it beats seeking to a
 * section the listener did not ask for.
 */
export function neighbourSection(
  outline: AudioOutline,
  timeMs: number,
  direction: -1 | 1
): OutlineRow | null {
  const index = voiceIndex(outline, voiceIdAt(outline, timeMs));
  if (index === -1) return outline.rows[0] ?? null;
  if (direction === 1) return outline.rows[index + 1] ?? null;
  return outline.rows[Math.max(0, index - 1)] ?? null;
}
