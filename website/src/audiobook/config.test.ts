import assert from 'node:assert/strict';
import test from 'node:test';
import { assertRenderConfig, AUDIO_CONFIG, GEMINI_VOICES } from './config.ts';

test('assertRenderConfig accepts the committed voice bindings', () => {
  assert.doesNotThrow(() => assertRenderConfig());
  const bindings: string[] = Object.values(AUDIO_CONFIG.speakers);
  assert.ok(bindings.length > 0);
  for (const voice of bindings)
    assert.ok(
      GEMINI_VOICES.includes(voice),
      `${voice} is not a Gemini prebuilt voice`
    );
});

// Render-time guard: an unknown voice would silently produce audio nobody chose.
// The committed config is temporarily broken and restored, so the real guard
// code path runs against a real unlisted voice — no mocks.
test('assertRenderConfig rejects an unlisted voice and names its role', () => {
  const original = AUDIO_CONFIG.speakers.alex;
  AUDIO_CONFIG.speakers.alex = 'NotAGeminiVoice';
  try {
    assert.throws(() => assertRenderConfig(), /unknown voice name.*alex/s);
  } finally {
    AUDIO_CONFIG.speakers.alex = original;
  }
});
