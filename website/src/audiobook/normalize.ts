import { locationOf, type MdNode, stringAttr, textOf } from './mdast.ts';
import { isHtmlTag, ruleFor } from './rules.ts';

export type Violations = string[];

export type NormalizeContext = { file: string; violations: Violations };

/**
 * Glyphs the speech model would otherwise swallow; spoken forms keep the sentence
 * grammatical instead of dropping the relationship the arrow carried.
 */
const GLYPH_WORDS: Record<string, string> = {
  '→': ' to ',
  '←': ' from ',
  '↓': ' then ',
  '↑': ' back ',
  '•': ' ',
};

/** Inline code is spoken verbatim, minus CLI dashes and code punctuation nobody says. */
/**
 * Inline code is spoken for its meaning, not its syntax: CLI dashes and notation
 * punctuation (glob stars, angle brackets, braces) are dropped, so the fzf
 * trigger `**<TAB>` is heard as "TAB" instead of "asterisk asterisk TAB".
 * Authors who need the literal form write a narration.
 */
export const spokenInlineCode = (value: string): string =>
  value.replace(/^--?/, '').replace(/[*`<>{|}[\]]+/g, ' ');

/** Collapse whitespace without trimming: inline text is joined by the caller. */
const collapse = (text: string): string => text.replace(/\s+/g, ' ');

/** Collapse whitespace, tighten punctuation and drop unspoken glyphs. */
export function sanitizeText(text: string): string {
  const replaced = text.replace(
    /[→←↓↑•]/g,
    (glyph) => GLYPH_WORDS[glyph] ?? ' '
  );
  return collapse(replaced)
    .replace(/\s+([.,;:!?…])/g, '$1')
    .trim();
}

export const violation = (
  ctx: NormalizeContext,
  node: MdNode,
  message: string
): void => {
  ctx.violations.push(`${ctx.file}:${locationOf(node)} ${message}`);
};

/**
 * Spoken text for one inline subtree.
 *
 * Markup carries no audio: links keep their anchor text, images speak their alt
 * text, footnotes and decorative components say nothing. Dynamic JSX values are
 * skipped by rule (they are computed at build time and cannot be a static
 * transform); anything unclassified is a violation so new content cannot be
 * dropped silently.
 */
export function inlineText(node: MdNode, ctx: NormalizeContext): string {
  switch (node.type) {
    case 'text':
    case 'inlineCode':
      return collapse(
        node.type === 'inlineCode'
          ? spokenInlineCode(node.value ?? '')
          : (node.value ?? '')
      );
    case 'image':
      return collapse(node.alt ?? '');
    case 'footnoteReference':
    case 'break':
    case 'mdxTextExpression':
      return ' ';
    case 'mdxJsxTextElement':
      return inlineComponent(node, ctx);
    default:
      break;
  }
  if (node.children)
    return node.children.map((child) => inlineText(child, ctx)).join('');
  return collapse(textOf(node));
}

/** Inline visuals are narration-carrying; decorative ones are skipped by rule. */
function inlineComponent(node: MdNode, ctx: NormalizeContext): string {
  const name = node.name ?? '';
  if (isHtmlTag(name))
    return node.children?.map((child) => inlineText(child, ctx)).join('') ?? '';
  const rule = ruleFor(name);
  if (!rule) {
    violation(ctx, node, `unclassified inline component <${name}>`);
    return ' ';
  }
  if (rule.kind === 'skip') return ' ';
  const narration = stringAttr(node, 'narration');
  if (!narration) {
    violation(ctx, node, `<${name}> needs a narration="..." prop`);
    return ' ';
  }
  return collapse(narration);
}

/** Spoken text of a paragraph (the only block container that holds inline content). */
export function paragraphText(node: MdNode, ctx: NormalizeContext): string {
  if (node.type !== 'paragraph') {
    violation(
      ctx,
      node,
      `unclassified flow node "${node.type}" inside a prose container`
    );
    return ' ';
  }
  return node.children?.map((child) => inlineText(child, ctx)).join('') ?? '';
}
