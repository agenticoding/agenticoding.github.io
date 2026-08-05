import assert from 'node:assert/strict';
import test from 'node:test';
import {
  horizontalConnector,
  verticalConnector,
  type Box,
} from './PostTrainingTuningBoardGeometry.ts';

const boxes = {
  base: { x: 16, y: 112, width: 160, height: 160 },
  tuning: { x: 216, y: 40, width: 208, height: 320 },
  profile: { x: 456, y: 72, width: 160, height: 240 },
  mobileBase: { x: 32, y: 52, width: 296, height: 88 },
  mobileTuning: { x: 20, y: 164, width: 320, height: 316 },
  mobileProfile: { x: 32, y: 500, width: 296, height: 146 },
} satisfies Record<string, Box>;

test('desktop connectors use non-degenerate straight paths', () => {
  assert.equal(
    horizontalConnector(boxes.base, boxes.tuning),
    'M 176 192 H 208'
  );
  assert.equal(
    horizontalConnector(boxes.tuning, boxes.profile),
    'M 424 200 H 448'
  );
});

test('mobile connectors reach the card edge with a vertical tangent', () => {
  assert.equal(
    verticalConnector(boxes.mobileBase, boxes.mobileTuning),
    'M 180 140 V 164'
  );
  assert.equal(
    verticalConnector(boxes.mobileTuning, boxes.mobileProfile),
    'M 180 480 V 500'
  );
});
