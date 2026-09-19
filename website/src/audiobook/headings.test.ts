import assert from 'node:assert/strict';
import test from 'node:test';
import { AUDIO_DOC_IDS, readDocSource } from './docs.ts';
import { parseMdx } from './extract.ts';
import { createHeadingReader } from './headings.ts';
import type { MdNode } from './mdast.ts';
import { loadDocusaurusPlugin, nodesOfType } from './testing.ts';

type HeadingWithProps = MdNode & { data?: { hProperties?: { id?: string } } };

const headingNodes = (root: MdNode): MdNode[] => nodesOfType(root, 'heading');

/** Ids as the extractor derives them: one slugger per document, explicit ids win. */
const extractorIds = (mdx: string): string[] => {
  const read = createHeadingReader();
  return headingNodes(parseMdx(mdx)).map((node) => read(node).id);
};

/**
 * Ids as Docusaurus derives them at build time. Uses Docusaurus' own remark
 * plugin (internal path) on purpose: the whole point is to detect drift between
 * what we narrate against and what the built page actually renders.
 */
const docusaurusIds = async (mdx: string): Promise<string[]> => {
  const plugin = await loadDocusaurusPlugin(
    '@docusaurus/mdx-loader/lib/remark/headings/index.js'
  );
  const { unified } = await import('unified');
  const root = parseMdx(mdx);
  await unified()
    .use(plugin as never, { anchorsMaintainCase: false } as never)
    .run(root as never);
  return headingNodes(root).map(
    (node) => (node as HeadingWithProps).data?.hProperties?.id ?? ''
  );
};

const corpus = (): [string, string][] =>
  AUDIO_DOC_IDS.map((id) => [id, readDocSource(id)]);

const fixture = '## Custom Title {#chosen}\n\n## Same\n\n## Same\n';

test('explicit heading ids win and generated ids dedupe per document', () => {
  assert.deepEqual(extractorIds('## Custom Title {#chosen}\n'), ['chosen']);
  assert.deepEqual(extractorIds('## Same\n\n## Same\n'), ['same', 'same-1']);
});

test('extractor ids match Docusaurus heading ids across the whole corpus', async () => {
  const mismatches: string[] = [];
  for (const [id, source] of corpus()) {
    const ours = extractorIds(source);
    const theirs = await docusaurusIds(source);
    if (JSON.stringify(ours) !== JSON.stringify(theirs))
      mismatches.push(`${id}: ${ours.join()} != ${theirs.join()}`);
    if (new Set(ours).size !== ours.length)
      mismatches.push(`${id}: duplicate heading ids`);
  }
  assert.deepEqual(mismatches, []);
});

test('the parity fixture itself produces stable ids', async () => {
  assert.deepEqual(await docusaurusIds(fixture), extractorIds(fixture));
});
