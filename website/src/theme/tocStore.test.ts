/**
 * The TOC-value seam: one HTML string, two consumers.
 *
 * The sidebar renders it as markup (`tocHeadingHtml` + `innerHTML`); the player, the labels
 * and the live region need words (`headingText`). Docusaurus escapes heading text with
 * `escape-html` while it serializes the TOC, so a text consumer that does not undo that
 * escaping shows the reader `The stack you&#39;ll install`.
 *
 * The fixtures are real `TOCItem.value` strings copied out of a build, and the round trip at
 * the end pins the decode table to the loader's own encoder — a reference the table forgets,
 * or an encoder change the table does not follow, fails here instead of on the page.
 */
import { strict as assert } from 'node:assert';
import test from 'node:test';
import escapeHtml from 'escape-html';

import { headingText, tocHeadingHtml } from './tocStore.ts';

/** [loader output for a heading, the words the reader wrote] */
const LOADER_VALUES: ReadonlyArray<readonly [string, string]> = [
  // docs/exercises/tic-tac-toe/overview.md — the shipped `&#39;` report
  ['The stack you&#39;ll install', "The stack you'll install"],
  // docs/developer-tools/cli-tools.md
  ['Search &amp; Discovery Tools', 'Search & Discovery Tools'],
  // docs/validation.md
  [
    'Define &quot;Good Enough&quot; Before Choosing a Single Check',
    'Define "Good Enough" Before Choosing a Single Check',
  ],
  // docs/developer-tools/cli-coding-agents.md — the visual mark serializes as an empty
  // element and the rank numeral stays; its class attribute is markup, not words.
  [
    '<span class="rank-numeral">01</span> <ToolMark></ToolMark> pi',
    '01 pi',
  ],
  // `inlineCode` and `emphasis` serialize as elements with escaped text (loader's rule).
  ['<code>a&lt;b</code>', 'a<b'],
  ['<em>not</em> just a prompt', 'not just a prompt'],
];

const ENTITY = /&(?:[a-zA-Z]+|#\d+|#x[0-9a-fA-F]+);/;

test('a heading renders in the words the reader wrote', () => {
  for (const [value, words] of LOADER_VALUES)
    assert.equal(headingText(value), words);
});

test('no entity reference survives into the words', () => {
  for (const [value] of LOADER_VALUES) assert.doesNotMatch(headingText(value), ENTITY);
});

test('markup comes off before references are decoded', () => {
  // Decoding first would turn this heading's own text into a tag and delete it.
  assert.equal(headingText('Use &lt;code&gt; verbatim'), 'Use <code> verbatim');
});

test('plain words pass through untouched', () => {
  assert.equal(
    headingText("The operator's job & the rest"),
    "The operator's job & the rest"
  );
});

test('the sidebar half keeps the heading markup intact', () => {
  assert.equal(tocHeadingHtml('The stack you&#39;ll install'), 'The stack you&#39;ll install');
  assert.equal(tocHeadingHtml('a <ToolMark></ToolMark> b'), 'a b');
});

test('the decoder inverts the loader encoder for every ASCII character it escapes', () => {
  for (let code = 33; code <= 126; code++) {
    const text = `The ${String.fromCharCode(code)} sign`;
    assert.equal(headingText(escapeHtml(text)), text);
  }
});

test('whitespace collapses to one line', () => {
  assert.equal(headingText('The stack\n  you&#39;ll\tinstall'), "The stack you'll install");
});
