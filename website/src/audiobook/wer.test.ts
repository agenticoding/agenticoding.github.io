import assert from 'node:assert/strict';
import test from 'node:test';
import {
  criticalTerms,
  missingCriticalTerms,
  normalizeForWer,
  wordErrorRate,
} from './wer.ts';

test('normalization compares pronunciation, not casing or punctuation', () => {
  assert.equal(normalizeForWer('Hello, world!'), 'hello world');
  assert.equal(wordErrorRate('Hello, world!', 'hello world'), 0);
});

test('phoneme lexemes are instructions, not words', () => {
  const narrated =
    '<phoneme alphabet="ipa" ph="ˈeɪdʒəntɪk">agentic</phoneme> tools';
  assert.equal(wordErrorRate(narrated, 'agentic tools'), 0);
});

test('audio tags are directions, not spoken words', () => {
  assert.equal(normalizeForWer('[pause] Hello [softly] world.'), 'hello world');
  assert.deepEqual(criticalTerms('[pause] call useDoc() with HTTP/2.'), [
    'useDoc()',
    'HTTP/2',
  ]);
});

test('word error rate reports the share of substituted words', () => {
  const reference = 'the agent stops at the checkpoint before writing code';
  assert.equal(
    wordErrorRate(reference, reference.replace('checkpoint', 'checkpoints')),
    1 / 9
  );
  assert.ok(wordErrorRate(reference, 'the agent stops') > 0.5);
});

test('critical terms cover numbers, flags, identifiers and acronyms', () => {
  const terms = criticalTerms(
    'Set --chapter to 4.5 and call useDoc() with top_k; see HTTP/2.'
  );
  assert.deepEqual(
    terms.sort(),
    ['--chapter', '4.5', 'HTTP/2', 'top_k', 'useDoc()'].sort()
  );
});

test('a transcript that drops a critical term is flagged', () => {
  const reference = 'Set --chapter to 4.5 percent.';
  assert.deepEqual(missingCriticalTerms(reference, 'Set to percent.'), [
    '--chapter',
    '4.5',
  ]);
  assert.deepEqual(
    missingCriticalTerms(reference, 'set chapter to 4.5 percent'),
    []
  );
});

test('separator-bearing terms survive ASR joining or respacing, but plain terms stay strict', () => {
  const reference = 'Hand over the trade-offs it cannot guess.';
  assert.deepEqual(
    missingCriticalTerms(reference, 'hand over the tradeoffs it cannot guess'),
    []
  );
  assert.deepEqual(
    missingCriticalTerms(reference, 'hand over the trade offs it cannot guess'),
    []
  );
  assert.deepEqual(
    missingCriticalTerms(reference, 'hand over the choices it cannot guess'),
    ['trade-offs']
  );
  assert.deepEqual(
    missingCriticalTerms('Deploy the AI safely.', 'deploy the said safely'),
    ['AI']
  );
});

test('a numeric range is its endpoints, so "to" is not a dropped term', () => {
  assert.deepEqual(criticalTerms('Priced 4–8× higher.'), []);
  assert.deepEqual(criticalTerms('70–85% of the bill.'), ['70', '85']);
  assert.deepEqual(
    missingCriticalTerms('70–85% of the bill.', '70 to 85 percent of the bill'),
    []
  );
  assert.deepEqual(
    missingCriticalTerms('70–85% of the bill.', '50 to 60 percent of the bill'),
    ['70', '85']
  );
});
