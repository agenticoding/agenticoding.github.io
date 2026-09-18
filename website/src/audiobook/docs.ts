import { existsSync, readFileSync } from 'node:fs';
import { chapters, toolboxEntries } from '../../chapters.ts';
import { extractDoc, type Block } from './extract.ts';
import { sha256 } from './serialize.ts';
import type { HeadingInfo } from './headings.ts';

/** Every document in book order: chapters.ts is the single source of truth. */
export const AUDIO_DOC_IDS: readonly string[] = [
  ...chapters.map((entry) => entry.id),
  ...toolboxEntries.map((entry) => entry.id),
];

export function docSourcePath(id: string): string {
  const file = [`docs/${id}.mdx`, `docs/${id}.md`].find((candidate) =>
    existsSync(new URL(`../../${candidate}`, import.meta.url))
  );
  if (!file) throw new Error(`no doc source for "${id}"`);
  return file;
}

export const readDocSource = (id: string): string =>
  readFileSync(new URL(`../../${docSourcePath(id)}`, import.meta.url), 'utf8');

/** Extractor ground truth for one document: no authored overlay, no solo script. */
export type ChapterMeta = {
  title: string;
  headings: HeadingInfo[];
  sourceHash: string;
  blocks: Block[];
  violations: string[];
};

/**
 * The canonical spoken source for one chapter: exactly what the extractor sees,
 * before any authored dialogue. This is the ground truth `audio:dialogue:source`
 * prints and every coverage check measures against. `title` is the doc's
 * frontmatter title — the single source of truth shared by the sidebar, page H1,
 * and SEO (see doc-titles.test.ts).
 */
export function chapterMeta(id: string): ChapterMeta {
  const file = docSourcePath(id);
  const source = readDocSource(id);
  const extraction = extractDoc(source, file);
  return {
    title: extraction.frontmatterTitle ?? id,
    headings: extraction.headings,
    sourceHash: sha256(source),
    blocks: extraction.blocks,
    violations: extraction.violations,
  };
}
