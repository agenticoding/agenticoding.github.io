import { readdirSync } from 'node:fs';

/**
 * How a document component is treated by the narration extractor.
 *
 * `frame` = DiagramFrame: renders a <figure> and owns the spoken explanation.
 * `narrate` = a visual component that must carry its own narration prop.
 * `skip` = intentionally silent; the reason is required so the coverage test
 *          can explain every silent node instead of ignoring it by omission.
 *    transparent = walk the children; produces no node of its own (e.g. prose wrapper).
 */
export type NodeRule =
  | { kind: 'frame' }
  | { kind: 'narrate' }
  | { kind: 'skip'; reason: string }
  | { kind: 'transparent' };

/** Silent components and why. Reasons are required so the rules test can
    explain every silent node instead of ignoring it by omission. */
export const SKIP: Record<string, string> = {
  PromptExample: 'prompt body: the surrounding prose carries the meaning',
  ToolMark: 'decorative tool logo',
  InlineEmojiImage: 'inline emoji art',
  SchemaMarkup: 'renders nothing (JSON-LD head data)',
  // HomepageProse is transparent: used only in intro.mdx to wrap prose children
  GitHubProjectSource: 'navigation chrome (repository star badge)',
};

/** Visual components outside VisualElements/ that still own their spoken explanation. */
const NARRATE = new Set<string>([
  'HomepageVisualPreview',
  'PromptComparison',
  'PromptAnatomy',
]);

const VISUALS_DIR = new URL('../components/VisualElements/', import.meta.url);

let visualNames: Set<string> | undefined;

/** Visual components are addressed by filename, so a new figure is narrated by default. */
function visualComponents(): Set<string> {
  visualNames ??= new Set(
    readdirSync(VISUALS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.tsx'))
      .map((entry) => entry.name.replace(/\.tsx$/, ''))
  );
  return visualNames;
}

/** Undefined means "unknown component": the coverage test fails loudly on those. */
export function ruleFor(component: string): NodeRule | undefined {
  if (component === 'DiagramFrame') return { kind: 'frame' };
  const reason = SKIP[component];
  if (reason) return { kind: 'skip', reason };
  if (component === 'HomepageProse') return { kind: 'transparent' };
  if (NARRATE.has(component) || visualComponents().has(component))
    return { kind: 'narrate' };
  return undefined;
}

/** Raw HTML tags (div/span/p/...) are transparent: their children are narrated. */
export const isHtmlTag = (component: string): boolean =>
  /^[a-z]/.test(component);
