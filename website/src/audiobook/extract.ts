import {
  admonitionTitleToDirectiveLabel,
  escapeMarkdownHeadingIds,
  unwrapMdxCodeBlocks,
} from '@docusaurus/utils';
import remarkDirective from 'remark-directive';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import { createHeadingReader, type HeadingInfo } from './headings.ts';
import { attrWasExpression, type MdNode, stringAttr, textOf } from './mdast.ts';
import {
  paragraphText,
  type NormalizeContext,
  sanitizeText,
  violation,
  type Violations,
} from './normalize.ts';
import { isHtmlTag, ruleFor } from './rules.ts';
import type { Anchor } from './schemas.ts';

export type Block =
  | { kind: 'prose'; text: string; anchor: Anchor }
  | { kind: 'figure'; text: string; label: string; anchor: Anchor }
  | { kind: 'code'; text: string; label: string; anchor: Anchor };

export type Extraction = {
  blocks: Block[];
  violations: Violations;
  headings: HeadingInfo[];
  frontmatterTitle?: string;
};

/** Docusaurus' default admonition keywords (mdx-loader/remark/admonitions). */
const ADMONITION_KEYWORDS = [
  'secondary',
  'info',
  'success',
  'danger',
  'note',
  'tip',
  'warning',
  'important',
  'caution',
];

/** Docusaurus' default `mdx1Compat` flags, both enabled in this repo. */
const MDX1_COMPAT = { headingIds: true, admonitions: true };

const ADMONITION_LABEL: Record<string, string> = {
  info: 'Info',
  success: 'Success',
  danger: 'Danger',
  note: 'Note',
  tip: 'Tip',
  warning: 'Warning',
  important: 'Important',
  caution: 'Caution',
  secondary: '',
};

const processor = unified()
  .use(remarkParse)
  .use(remarkFrontmatter)
  .use(remarkGfm)
  .use(remarkMdx)
  .use(remarkDirective);

/**
 * Docusaurus rewrites MDX before parsing (`{#id}` escaping, admonition labels,
 * mdx-code-block unwrapping). Skipping a step changes the tree — without the
 * escaping, `{#id}` parses as a JS expression and the file fails to parse — so
 * the extractor reuses the same public helpers in the same order.
 */
export function preprocessMdx(source: string): string {
  const escaped = MDX1_COMPAT.headingIds
    ? escapeMarkdownHeadingIds(source)
    : source;
  const unwrapped = unwrapMdxCodeBlocks(escaped);
  return MDX1_COMPAT.admonitions
    ? admonitionTitleToDirectiveLabel(unwrapped, ADMONITION_KEYWORDS)
    : unwrapped;
}

export const parseMdx = (source: string): MdNode =>
  processor.parse(preprocessMdx(source)) as unknown as MdNode;

/** Code fence meta is the only place a code block's spoken text can live. */
export function parseFenceMeta(meta: string): {
  pairs: Record<string, string>;
  leftover: string;
} {
  const pairs: Record<string, string> = {};
  const leftover = meta.replace(
    /([A-Za-z-]+)="([^"]*)"/g,
    (_match, key: string, value: string) => {
      pairs[key] = value;
      return '';
    }
  );
  return { pairs, leftover: leftover.trim() };
}

/**
 * Docusaurus reads render flags straight out of the raw metastring it is handed:
 * `live` is a space-split token (mdx-loader codeCompatPlugin). Our narration
 * prose shares that metastring, so an ordinary word like "live" silently turns a
 * documentation fence into an executable playground that compiles Markdown as JS
 * and throws in the browser. The sniffer mirrors the vendor instead of invoking
 * it: the vendor exposes no API, and a rename upstream must fail loudly in
 * renderFlags.test.ts rather than leave pages broken.
 *
 * Deliberately partial: only the promotion flag is guarded. Cosmetic metastring
 * tokens (title, showLineNumbers, highlight ranges) share the same string but
 * cannot break a page.
 */
const hasLiveToken = (meta: string): boolean =>
  meta.split(' ').includes('live');

/**
 * Bare flags are already rejected as leftover meta by the caller, so this looks
 * only inside quoted values — where prose hides a flag and the violation would
 * otherwise be invisible.
 */
function smuggledLiveKey(pairs: Record<string, string>): string | null {
  for (const [key, value] of Object.entries(pairs))
    if (hasLiveToken(`${key}="${value}"`)) return key;
  return null;
}

type State = {
  ctx: NormalizeContext;
  blocks: Block[];
  prose: string[];
  anchor: Anchor;
  headingId: string | null;
  figureIndex: number;
  codeIndex: number;
  headings: HeadingInfo[];
  readHeading: (node: MdNode) => HeadingInfo;
};

const flush = (state: State): void => {
  const text = sanitizeText(state.prose.join(' ')).trim();
  if (text) state.blocks.push({ kind: 'prose', text, anchor: state.anchor });
  state.prose = [];
};

const push = (state: State, text: string): void => {
  const clean = sanitizeText(text).trim();
  if (clean) state.prose.push(clean);
};

/** Every heading is read so slugger dedupe matches the built site, even for h1. */
function heading(state: State, node: MdNode): void {
  const { id, title } = state.readHeading(node);
  if ((node.depth ?? 1) === 1) {
    // An h1 opens a new document, not a section: prose accumulated under the
    // previous anchor must still flush, or it leaks into the next section's block.
    flush(state);
    return;
  }
  if (!title) return;
  flush(state);
  state.headingId = id;
  state.anchor = { kind: 'heading', id };
  state.headings.push({ id, title });
  push(state, `Section: ${title}.`);
}

function paragraph(state: State, node: MdNode): void {
  const text = sanitizeText(paragraphText(node, state.ctx)).trim();
  if (/^Next:/.test(text)) return; // reading-spine footer is navigation chrome
  push(state, text);
}

/** Container nodes change nothing about who speaks: their children are walked. */
function walkChildren(state: State, node: MdNode): void {
  (node.children ?? []).forEach((child) => walk(state, child));
}

/**
 * Admonition type or authored `[title]` becomes a spoken cue, then the body.
 * A directive with no cue (unknown type, blank title) would otherwise speak a
 * bare "." — audible noise — so it is a violation like any other malformed node;
 * the body still walks, keeping its content anchored.
 */
function directive(state: State, node: MdNode): void {
  const label = node.children?.find((child) => child.data?.directiveLabel);
  const spoken = label
    ? sanitizeText(textOf(label)).trim()
    : (ADMONITION_LABEL[node.name ?? ''] ?? '');
  if (!spoken)
    violation(
      state.ctx,
      node,
      `directive ":::${node.name ?? ''}" produces no spoken cue: known admonition types speak their type; anything else needs an authored [title]`
    );
  else push(state, `${spoken}.`);
  (node.children ?? [])
    .filter((child) => child !== label)
    .forEach((child) => walk(state, child));
}

/** Reports every meta problem, then returns the narration the fence will be spoken from. */
function codeNarration(state: State, node: MdNode): string | null {
  const { pairs, leftover } = parseFenceMeta(node.meta ?? '');
  const unknown = Object.keys(pairs).filter((key) => key !== 'narration');
  if (leftover)
    violation(state.ctx, node, `code fence meta not understood: "${leftover}"`);
  if (unknown.length)
    violation(
      state.ctx,
      node,
      `unknown code fence meta key(s): ${unknown.join(', ')}`
    );
  const smuggled = smuggledLiveKey(pairs);
  if (smuggled)
    violation(
      state.ctx,
      node,
      `meta key "${smuggled}" must not contain "live": Docusaurus reads it as a live-editor flag and renders this fence as a playground`
    );
  if (!pairs.narration) {
    violation(
      state.ctx,
      node,
      'code fence needs narration="..." in its meta line; the code itself is not spoken'
    );
    return null;
  }
  return pairs.narration;
}

function codeBlock(state: State, node: MdNode): void {
  flush(state);
  // The anchor advances even for an unspoken fence: DOM order is the index.
  const anchor: Anchor = {
    kind: 'code',
    index: state.codeIndex++,
    headingId: state.headingId,
  };
  const narration = codeNarration(state, node);
  if (narration === null) return;
  state.blocks.push({
    kind: 'code',
    text: sanitizeText(narration),
    label: node.lang ?? 'text',
    anchor,
  });
}

function component(state: State, node: MdNode): void {
  const name = node.name ?? '';
  if (isHtmlTag(name)) return walkChildren(state, node);
  const rule = ruleFor(name);
  if (!rule)
    return violation(
      state.ctx,
      node,
      `unclassified component <${name}>: add it to rules.ts`
    );
  if (rule.kind === 'skip') return;
  if (rule.kind === 'transparent') return walkChildren(state, node);
  flush(state);
  pushFigure(state, node, name);
}

/** The DOM index advances even without narration: it mirrors rendered <figure> order. */
function pushFigure(state: State, node: MdNode, name: string): void {
  const anchor: Anchor = { kind: 'figure', index: state.figureIndex++ };
  const narration = stringAttr(node, 'narration');
  if (narration) {
    state.blocks.push({
      kind: 'figure',
      text: sanitizeText(narration),
      label: stringAttr(node, 'title') ?? name,
      anchor,
    });
    return;
  }
  violation(state.ctx, node, narrationProblem(node, name));
}

const narrationProblem = (node: MdNode, name: string): string =>
  attrWasExpression(node, 'narration')
    ? `<${name}> narration must be a plain string: write narration="..." not narration={...}`
    : `<${name}> needs a narration="..." prop: the spoken explanation of what is shown`;

/** Node types that legitimately contribute no audio (each is silent by rule). */
const SILENT_FLOW = new Set([
  'yaml',
  'mdxjsEsm',
  'thematicBreak',
  'table',
  'footnoteDefinition',
  'definition',
  'html',
  'textDirective',
]);

const FLOW_HANDLERS: Record<string, (state: State, node: MdNode) => void> = {
  heading,
  paragraph,
  list: walkChildren,
  listItem: walkChildren,
  blockquote: walkChildren,
  containerDirective: directive,
  code: codeBlock,
  mdxJsxFlowElement: component,
};

function walk(state: State, node: MdNode): void {
  if (SILENT_FLOW.has(node.type)) return;
  const handler = FLOW_HANDLERS[node.type];
  if (handler) return handler(state, node);
  violation(state.ctx, node, `unclassified flow node "${node.type}"`);
}

const frontmatterTitleOf = (root: MdNode): string | undefined => {
  const yaml = (root.children ?? []).find((child) => child.type === 'yaml');
  const title = yaml?.value?.match(/^title:\s*(.+)$/m)?.[1]?.trim();
  return title?.replace(/^['"]|['"]$/g, '');
};

/**
 * MDX → ordered spoken blocks.
 *
 * A block is prose, one figure narration, or one code narration: the segmenter
 * never merges across those kinds, because each anchors to a different DOM target.
 */
export function extractDoc(source: string, file: string): Extraction {
  const root = parseMdx(source);
  const state = createState(file);
  for (const child of root.children ?? []) walk(state, child);
  flush(state);
  return {
    blocks: state.blocks,
    violations: state.ctx.violations,
    headings: state.headings,
    frontmatterTitle: frontmatterTitleOf(root),
  };
}

const createState = (file: string): State => ({
  ctx: { file, violations: [] },
  blocks: [],
  prose: [],
  anchor: { kind: 'heading', id: null },
  headingId: null,
  figureIndex: 0,
  codeIndex: 0,
  headings: [],
  readHeading: createHeadingReader(),
});
