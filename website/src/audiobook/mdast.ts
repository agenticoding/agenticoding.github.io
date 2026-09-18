/**
 * Minimal structural view of the mdast/MDX tree the audiobook extractor consumes.
 *
 * Declared locally instead of depending on @types/mdast: the extractor only reads
 * six node fields, and a local shape keeps it decoupled from upstream type churn.
 * Nodes are produced by remark-parse + remark-mdx (see extract.ts).
 */
export type MdAttributeValue =
  | string
  | null
  | undefined
  | { type: string; value?: string };

export type MdAttribute = {
  type: 'mdxJsxAttribute';
  name: string;
  value?: MdAttributeValue;
};

export type MdNode = {
  type: string;
  value?: string;
  name?: string | null;
  lang?: string | null;
  meta?: string | null;
  alt?: string | null;
  depth?: number;
  attributes?: MdAttribute[];
  children?: MdNode[];
  /** remark-directive marks an admonition's `[title]` child with directiveLabel. */
  data?: { directiveLabel?: boolean };
  position?: { start: { line: number; column: number } };
};

export const childrenOf = (node: MdNode): MdNode[] => node.children ?? [];

/** Text content including descendants; matches mdast-util-to-string for our node set. */
export function textOf(node: MdNode): string {
  if (typeof node.value === 'string') return node.value;
  return childrenOf(node).map(textOf).join('');
}

/**
 * Attribute value, but only for plain string attributes.
 *
 * `narration={someExpression}` is rejected on purpose: the extractor must stay a
 * static transform, so authors write `narration="..."` and tests catch the rest.
 */
export function stringAttr(node: MdNode, name: string): string | undefined {
  const value = (node.attributes ?? []).find(
    (attr) => attr.name === name
  )?.value;
  return typeof value === 'string' ? value : undefined;
}

export const attrWasExpression = (node: MdNode, name: string): boolean => {
  const value = (node.attributes ?? []).find(
    (attr) => attr.name === name
  )?.value;
  return value !== null && typeof value === 'object';
};

export const locationOf = (node: MdNode): string =>
  node.position
    ? `${node.position.start.line}:${node.position.start.column}`
    : '?';
