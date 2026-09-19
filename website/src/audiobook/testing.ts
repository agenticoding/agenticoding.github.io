import { extractDoc, type Block } from './extract.ts';
import type { MdNode } from './mdast.ts';

/**
 * Test-only helpers for extraction rules.
 *
 * Fixtures are inline MDX strings so each rule can be read on its own line,
 * matching the repo's "no fixture directories, no mocks" test style.
 */
export const extractFixture = (mdx: string) => extractDoc(mdx, 'fixture.mdx');

export const blocksOf = <K extends Block['kind']>(
  mdx: string,
  kind: K
): Extract<Block, { kind: K }>[] =>
  extractFixture(mdx).blocks.filter(
    (block): block is Extract<Block, { kind: K }> => block.kind === kind
  );

export const proseOf = (mdx: string): string[] =>
  blocksOf(mdx, 'prose').map((block) => block.text);

export const violationsOf = (mdx: string): string[] =>
  extractFixture(mdx).violations;

/** Every block in document order, for tests that exercise the segmenter. */
export const allBlocks = (mdx: string): Block[] => extractFixture(mdx).blocks;

/** Figure anchors are DOM indexes, so tests can assert ordering without narrowing unions. */
export const figureIndexes = (mdx: string): number[] =>
  blocksOf(mdx, 'figure').map((block) =>
    block.anchor.kind === 'figure' ? block.anchor.index : -1
  );

/**
 * The canonical fence for the live-flag contract: narration prose whose `live`
 * token Docusaurus promotes to a playground. Shared because renderFlags.test.ts
 * asserts the vendor promotes exactly what extract.test.ts asserts we reject.
 */
export const SMUGGLING_FENCE =
  '```bash narration="Keep the rules live in one file."\nrg --files\n```\n';

/**
 * Loads a Docusaurus remark plugin from its internal path. The vendor exposes no
 * API for these mirrors, so a private path that moves on upgrade must fail the
 * contract tests loudly rather than drift. CJS interop: the plugin sits one
 * level deeper behind `exports.default`.
 */
export async function loadDocusaurusPlugin(
  modulePath: string
): Promise<unknown> {
  const mod = (await import(modulePath)) as { default?: { default?: unknown } };
  const plugin = mod.default?.default ?? mod.default;
  // unified().use(undefined) silently no-ops, which would let the corpus
  // contract test pass vacuously — the shape check must throw here instead.
  if (typeof plugin !== 'function')
    throw new Error(
      `Docusaurus plugin at ${modulePath} no longer exports a function: ` +
        `update this loader and re-check the mirror in extract.ts`
    );
  return plugin;
}

/** Depth-first nodes of one mdast type; vendor contract tests walk their own trees. */
export function nodesOfType(root: MdNode, type: string): MdNode[] {
  const found: MdNode[] = [];
  const visit = (node: MdNode): void => {
    if (node.type === type) found.push(node);
    (node.children ?? []).forEach(visit);
  };
  visit(root);
  return found;
}
