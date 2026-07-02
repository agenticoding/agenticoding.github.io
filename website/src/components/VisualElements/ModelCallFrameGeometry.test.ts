import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MODEL_CALL_FRAME_STROKE_OUTSET,
  MODEL_CALL_FRAME_TAB_OVERHANG,
  modelCallFrameTab,
  modelCallFrameVisualBounds,
} from './ModelCallFrameGeometry.ts';

test('model call frame tab overhang is included in visual bounds', () => {
  const frame = { x: 20, y: 20, width: 320, height: 200 };
  const bounds = modelCallFrameVisualBounds(frame, 'inside the model');

  assert.equal(
    bounds.y,
    frame.y - MODEL_CALL_FRAME_TAB_OVERHANG - MODEL_CALL_FRAME_STROKE_OUTSET
  );
  assert.equal(bounds.x, frame.x - MODEL_CALL_FRAME_STROKE_OUTSET);
  assert.ok(bounds.height > frame.height);
});

test('model call frame tab geometry honors explicit tab width', () => {
  const tab = modelCallFrameTab(52, 328, 'DETERMINISTIC WORKFLOW', 228);

  assert.equal(tab.x, 76);
  assert.equal(tab.y, 312);
  assert.equal(tab.width, 228);
  assert.equal(tab.height, 32);
});
