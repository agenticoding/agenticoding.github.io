import { extractDoc, type Block } from './extract.ts';

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
