import assert from 'node:assert/strict';
import test from 'node:test';
import { visualDeixisHits } from './deixis.ts';

/** The real context-files defects the guard exists to catch (t15 and t24). */
const TURN_T15 =
  'And because it sits in that prefix, ahead of every prompt, its size is a shared cost rather than a private one. The figure showed drift for a single conversation; a shared AGENTS.md does that to every conversation at once.';
const TURN_T24 =
  'An AGENTS.md that only ever grows is precisely the bloat the figure warns about.';

test('visualDeixisHits catches the real spoken defects', () => {
  assert.deepEqual(visualDeixisHits(TURN_T15), ['the figure']);
  assert.deepEqual(visualDeixisHits(TURN_T24), ['the figure']);
});

test('visualDeixisHits matches the shapes a visual reference takes', () => {
  const cases: Array<[string, string]> = [
    ['The diagram above shows the drift.', 'the diagram'],
    ['The chart below makes it clear.', 'the chart'],
    ['This graph is the result.', 'this graph'],
    ['In the above figure, the fall is sharp.', 'the above figure'],
    ['The next diagram adds selection.', 'the next diagram'],
    ['Look at figure 3.', 'figure 3'],
    ['Recall drops, as shown earlier.', 'as shown'],
    ['As illustrated above, recall falls.', 'as illustrated'],
    ['The impact is shown below.', 'shown below'],
    ['The states are depicted below.', 'depicted below'],
    ['The above explains the trade-off.', 'the above'],
    ['The left panel carries the input.', 'left panel'],
  ];
  for (const [text, expected] of cases)
    assert.deepEqual(visualDeixisHits(text), [expected], text);
});

test('visualDeixisHits ignores modality nouns: an image is data, not a page figure', () => {
  const benign = [
    'They encode screenshots, diagrams, and charts into token streams.',
    'An image patch, an audio frame, one unit.',
    'The image is split into patches before attention runs.',
    'The visual design of the page is not the point.',
    "So let's figure out which weight changed.",
    'The graphing library is not the point.',
    'The figure of speech is common in prose.',
    'The chart of accounts is reconciled nightly.',
    'Put the options on the table and decide.',
    'Below the surface, the loop keeps running.',
    'As noted earlier, the drift compounds.',
  ];
  for (const text of benign) assert.deepEqual(visualDeixisHits(text), [], text);
});

test('visualDeixisHits catches the page layout register, not just the word figure', () => {
  const cases: Array<[string, string]> = [
    ['The panel on the left is the cache.', 'the panel'],
    ['The top tile is the hot path.', 'top tile'],
    ['The middle column drifts.', 'middle column'],
    ['Read the bottom row last.', 'bottom row'],
    ['A gear labelled LLM turns the crank.', 'labelled'],
    ['The sequence is labeled by hand.', 'labeled'],
    ['The right column lists fees.', 'right column'],
    ['That chip shows the state.', 'that chip'],
  ];
  for (const [text, expected] of cases)
    assert.deepEqual(visualDeixisHits(text), [expected], text);
});

test('visualDeixisHits keeps layout words and visual nouns idiomatic in plain speech', () => {
  const benign = [
    'That is the right answer for a cold cache.',
    'The middle ground is where most teams land.',
    'Think outside the box before you buy one.',
    'The top priority is a stable context.',
    'Set it apart from the bottom line of the invoice.',
    'A row of seats is not a figure.',
    'The row of tiles renders once.',
    'The table of contents has its own row numbering.',
    'The left and the right disagree on cost.',
    'Give it labeled examples first and it sees the format.',
    'Scored against a representative set of human-labeled data.',
  ];
  for (const text of benign) assert.deepEqual(visualDeixisHits(text), [], text);
});

test('visualDeixisHits reports a layout reference beside an ordinary one', () => {
  assert.deepEqual(
    visualDeixisHits('The figure puts the fee in the left panel.'),
    ['the figure', 'left panel']
  );
});

test('visualDeixisHits dedupes and lowercases repeated references', () => {
  assert.deepEqual(
    visualDeixisHits('The Figure above, and the diagram above, both point up.'),
    ['the figure', 'the diagram']
  );
});
