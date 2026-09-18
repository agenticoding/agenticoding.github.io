import assert from 'node:assert/strict';
import test from 'node:test';
import {
  allBlocks,
  blocksOf,
  figureIndexes,
  proseOf,
  violationsOf,
} from './testing.ts';

const VISUAL = '<ContextPressureDiagram />';
const FRAME = `<DiagramFrame kicker="k" title="T" size="wide" narration="Spoken figure.">\n\n${VISUAL}\n\n</DiagramFrame>`;
test('prose is verbatim and headings become spoken section markers', () => {
  const mdx = '## Why It Matters {#why}\n\nThe agent stops here.\n';
  assert.deepEqual(proseOf(mdx), [
    'Section: Why It Matters. The agent stops here.',
  ]);
  assert.deepEqual(blocksOf(mdx, 'prose').at(0)?.anchor, {
    kind: 'heading',
    id: 'why',
  });
});

test('h1 is not spoken but still consumes its heading slug', () => {
  const mdx = '# Prompting 101\n\n## Prompting 101\n\nBody.\n';
  assert.deepEqual(proseOf(mdx), ['Section: Prompting 101. Body.']);
  assert.deepEqual(blocksOf(mdx, 'prose').at(0)?.anchor, {
    kind: 'heading',
    id: 'prompting-101-1',
  });
});

test('links keep their anchor text, arrows become words, inline flags lose their dashes', () => {
  const mdx =
    'Latency → cost rises. Use `--chapter` to pick. See [the docs](https://example.com).\n';
  assert.deepEqual(proseOf(mdx), [
    'Latency to cost rises. Use chapter to pick. See the docs.',
  ]);
});

test('images speak their alt text and footnotes are dropped', () => {
  const mdx =
    '![ripgrep results with line numbers](https://example.com/a.png)\n\nA claim[^1].\n\n[^1]: Unspoken detail.\n';
  assert.deepEqual(proseOf(mdx), [
    'ripgrep results with line numbers A claim.',
  ]);
});

test('the reading-spine footer is navigation chrome, not narration', () => {
  assert.deepEqual(
    proseOf('Body sentence.\n\n**Next:** [Label](./other.md)\n'),
    ['Body sentence.']
  );
});

test('prompt bodies and tables stay silent while their prose neighbours are spoken', () => {
  const mdx =
    '<PromptExample title="Prompt">\n\nDo the thing.\n\n</PromptExample>\n\n| Tool | Use |\n| --- | --- |\n| rg | search |\n\nAfter the table.\n';
  assert.deepEqual(proseOf(mdx), ['After the table.']);
});

test('admonitions speak their type or authored title before the body', () => {
  assert.deepEqual(
    proseOf(':::tip[Why it matters]\n\nCaching drifts.\n\n:::\n'),
    ['Why it matters. Caching drifts.']
  );
  assert.deepEqual(proseOf(':::warning\n\nAvoid silent retries.\n\n:::\n'), [
    'Warning. Avoid silent retries.',
  ]);
});

test('a framed figure is one narrated block labelled by its title', () => {
  const mdx = `<DiagramFrame kicker="k" title="Shown" size="wide" narration="Pressure builds.">\n\n${VISUAL}\n\n</DiagramFrame>\n`;
  assert.deepEqual(
    blocksOf(mdx, 'figure'),
    [
      {
        kind: 'figure',
        text: 'Pressure builds.',
        label: 'Shown',
        anchor: { kind: 'figure', index: 0 },
      },
    ],
    'a framed figure is one narrated block labelled by its title'
  );
  assert.deepEqual(violationsOf(mdx), []);
});

test('a figure without narration is a violation and still consumes its DOM index', () => {
  const missing = `<DiagramFrame kicker="k" title="First" size="wide">\n\n${VISUAL}\n\n</DiagramFrame>\n`;
  const present = `<DiagramFrame kicker="k" title="Second" size="wide" narration="Spoken.">\n\n${VISUAL}\n\n</DiagramFrame>\n`;
  assert.match(
    violationsOf(missing)[0] ?? '',
    /needs a narration="\.\.\." prop/
  );
  assert.deepEqual(figureIndexes(missing + present), [1]);
});

test('a narrate component without narration is a violation', () => {
  assert.match(
    violationsOf('<HomepageVisualPreview />\n')[0] ?? '',
    /needs a narration="\.\.\." prop/
  );
});

test('the comparison diagram speaks from its narration prop and consumes one figure anchor', () => {
  const narrated =
    '<PromptComparison bad={null} good={null} narration="Spoken comparison." />\n';
  assert.deepEqual(
    blocksOf(narrated, 'figure').map((block) => block.text),
    ['Spoken comparison.']
  );
  assert.match(
    violationsOf('<PromptComparison bad={null} good={null} />\n')[0] ?? '',
    /needs a narration="\.\.\." prop/
  );
});

test('narration as a JSX expression is rejected because extraction must stay static', () => {
  const mdx = `<DiagramFrame kicker="k" title="T" size="wide" narration={'Spoken.'}>\n\n${VISUAL}\n\n</DiagramFrame>\n`;
  assert.match(violationsOf(mdx)[0] ?? '', /must be a plain string/);
});

test('code fences are spoken from their meta, never from the code itself', () => {
  const mdx =
    '```bash narration="List the files you changed."\nrg --files\n```\n';
  assert.deepEqual(blocksOf(mdx, 'code'), [
    {
      kind: 'code',
      text: 'List the files you changed.',
      label: 'bash',
      anchor: { kind: 'code', index: 0, headingId: null },
    },
  ]);
  assert.match(
    violationsOf('```bash\nrg --files\n```\n')[0] ?? '',
    /needs narration="\.\.\." in its meta line/
  );
  assert.match(
    violationsOf('```bash title="x"\nrg\n```\n')[0] ?? '',
    /unknown code fence meta key/
  );
});

test('an unknown component or flow node fails loudly instead of being dropped', () => {
  assert.match(
    violationsOf('<UnknownVisual />\n')[0] ?? '',
    /unclassified component <UnknownVisual>/
  );
});

// A directive with no spoken cue would otherwise speak a bare "." — audible noise.
test('an unknown or cue-less directive is a violation, and its body still speaks', () => {
  assert.match(
    violationsOf(':::mystery\n\nCaching drifts.\n\n:::\n')[0] ?? '',
    /":::mystery" produces no spoken cue/
  );
  assert.match(
    violationsOf(':::note[]\n\nCaching drifts.\n\n:::\n')[0] ?? '',
    /produces no spoken cue/
  );
  assert.deepEqual(proseOf(':::mystery\n\nCaching drifts.\n\n:::\n'), [
    'Caching drifts.',
  ]);
});

// Prose before an h1 belongs to the previous section, not to whatever follows the h1.
test('an h1 flushes the open prose block so earlier text keeps its own anchor', () => {
  const mdx =
    '## First {#first}\n\nEarly.\n\n# Divider\n\n## Second {#second}\n\nLate.\n';
  assert.deepEqual(proseOf(mdx), [
    'Section: First. Early.',
    'Section: Second. Late.',
  ]);
  assert.deepEqual(
    allBlocks(mdx).map((block) =>
      block.kind === 'prose' ? block.anchor : null
    ),
    [
      { kind: 'heading', id: 'first' },
      { kind: 'heading', id: 'second' },
    ]
  );
});

test('raw HTML wrappers are transparent and decorative inline art is silent', () => {
  assert.deepEqual(proseOf('<div className="x">\n\nInside.\n\n</div>\n'), [
    'Inside.',
  ]);
  assert.deepEqual(
    proseOf('Text <InlineEmojiImage asset={EMOJI.x} /> more.\n'),
    ['Text more.']
  );
});

test('the block list keeps document order across kinds', () => {
  const mdx = `Intro sentence.\n\n## Part {#part}\n\n${FRAME}\n\n\`\`\`bash narration="Run it."\nrg foo\n\`\`\`\n\nAfter.\n`;
  // Two prose blocks before the figure: the heading closes the anchor-less intro.
  assert.deepEqual(
    allBlocks(mdx).map((block) => block.kind),
    ['prose', 'prose', 'figure', 'code', 'prose']
  );
});
