import { createSlugger, parseMarkdownHeadingId } from '@docusaurus/utils';
import { type MdNode, textOf } from './mdast.ts';

export type HeadingInfo = { id: string; title: string };

/**
 * Heading id producer that mirrors @docusaurus/mdx-loader's remark/headings plugin.
 *
 * The manifest anchors sections by these ids, so a mismatch with the built site means
 * narration the TOC cannot attribute to a row. We reuse Docusaurus' own primitives
 * (github-slugger + {#id} parsing) and the same rules: explicit ids win and stay
 * out of the slugger, generated ids dedupe per document.
 */
export function createHeadingReader(): (node: MdNode) => HeadingInfo {
  const slugger = createSlugger();
  return (node) => {
    const raw = textOf(node).trim();
    const parsed = parseMarkdownHeadingId(raw);
    return {
      id: parsed.id ?? slugger.slug(parsed.text, { maintainCase: false }),
      title: parsed.text.trim(),
    };
  };
}
