// Source-level doc inventory + title parsing, shared by the navigation and
// doc-title guards. Parsing lives here (not in the MDX extractor) so the guards
// stay independent of the pipeline they check.
import { readFileSync, readdirSync } from 'node:fs';

const docsDir = new URL('../../docs/', import.meta.url);

const isDocName = (name: unknown): name is string =>
  typeof name === 'string' && /\.mdx?$/.test(name);

const isIncluded = (name: string): boolean => {
  // Mirror the docs plugin's exclude list (docusaurus.config.ts) so
  // build-excluded files can't false-fail the reachability/title contracts.
  const segments = name.split(/[\\/]/);
  const basename = segments.at(-1)!;
  return (
    !basename.startsWith('_') &&
    !segments.some(
      (segment) => segment.startsWith('_') || segment === '__tests__'
    ) &&
    !/\.test\.[jt]sx?$/.test(basename) &&
    basename !== 'CLAUDE.md'
  );
};

const docFileById = new Map(
  readdirSync(docsDir, { recursive: true })
    .filter(isDocName)
    .map((name) => [name.replace(/\.mdx?$/, ''), name])
);

/** Every doc the build includes, as `id` (path without extension). */
export const docIds: readonly string[] = readdirSync(docsDir, {
  recursive: true,
})
  .filter(isDocName)
  .filter(isIncluded)
  .map((name) => name.replace(/\.mdx?$/, ''));

export function docSource(id: string): string {
  const file = docFileById.get(id);
  if (!file)
    throw new Error(`doc source for "${id}" not found in website/docs`);
  return readFileSync(new URL(`../../docs/${file}`, import.meta.url), 'utf8');
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;

/** Frontmatter `title` with surrounding quotes stripped; undefined when absent. */
export function frontmatterTitle(source: string): string | undefined {
  const yaml = source.match(FRONTMATTER)?.[1];
  return yaml
    ?.match(/^title:[ \t]*(.+)$/m)?.[1]
    ?.trim()
    .replace(/^['"]|['"]$/g, '');
}

/** Top-level `# ` heading, ignoring frontmatter and fenced code blocks. */
export function hasBodyH1(source: string): boolean {
  let fence: string | null = null;
  for (const line of source.replace(FRONTMATTER, '').split(/\r?\n/)) {
    const marker = line.match(/^[ \t]*(`{3,}|~{3,})/)?.[1]?.[0];
    if (marker) {
      if (fence === null) fence = marker;
      else if (fence === marker) fence = null;
      continue;
    }
    if (fence === null && /^#[ \t]+\S/.test(line)) return true;
  }
  return false;
}
