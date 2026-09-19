import assert from 'node:assert/strict';
import test from 'node:test';
import { unified } from 'unified';
import { AUDIO_DOC_IDS, readDocSource } from './docs.ts';
import { parseMdx } from './extract.ts';
import type { MdNode } from './mdast.ts';
import {
  loadDocusaurusPlugin,
  nodesOfType,
  SMUGGLING_FENCE,
  violationsOf,
} from './testing.ts';

type CodeWithProps = MdNode & {
  data?: { hProperties?: { live?: boolean } };
};

const VENDOR_CODE_COMPAT =
  '@docusaurus/mdx-loader/lib/remark/mdx1Compat/codeCompatPlugin.js';

/**
 * extract.ts mirrors, rather than invokes, Docusaurus' metastring tokenization.
 * These tests bind the mirror to the vendor: the exact fence the extractor
 * rejects must be the fence the vendor promotes, and every corpus fence the
 * extractor accepts must render as an ordinary code block.
 */
const vendorProcessor = async () =>
  unified().use((await loadDocusaurusPlugin(VENDOR_CODE_COMPAT)) as never);

const liveFlagOfFirstFence = async (source: string): Promise<boolean> => {
  const tree = parseMdx(source);
  await (await vendorProcessor()).run(tree as never);
  const [code] = nodesOfType(tree, 'code');
  return (code as CodeWithProps | undefined)?.data?.hProperties?.live === true;
};

test('the vendor loader fails loudly when the export shape changes', async () => {
  await assert.rejects(
    loadDocusaurusPlugin('data:text/javascript,export default 42'),
    /no longer exports a function/
  );
});

test('the vendor promotes the exact fence the extractor rejects', async () => {
  assert.equal(
    await liveFlagOfFirstFence(SMUGGLING_FENCE),
    true,
    'vendor tokenization changed: update the guard in extract.ts'
  );
  assert.ok(
    violationsOf(SMUGGLING_FENCE).length > 0,
    'the extractor accepted a fence the vendor renders as a playground'
  );
});

test('no accepted corpus fence is promoted', async () => {
  const promoted: string[] = [];
  let fences = 0;
  for (const id of AUDIO_DOC_IDS) {
    const tree = parseMdx(readDocSource(id));
    await (await vendorProcessor()).run(tree as never);
    for (const node of nodesOfType(tree, 'code')) {
      fences += 1;
      if ((node as CodeWithProps).data?.hProperties?.live)
        promoted.push(`${id}: ${node.meta ?? ''}`);
    }
  }
  assert.ok(
    fences > 0,
    'corpus walk found no code fences: the contract is vacuous'
  );
  assert.deepEqual(promoted, []);
});
