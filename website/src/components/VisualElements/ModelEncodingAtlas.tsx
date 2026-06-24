import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { PresentationAwareProps } from '../PresentationMode/types';
import { EmojiImage } from './ActorNodes';
import { EMOJI, type EmojiAsset } from './emojiAssets';
import styles from './ModelEncodingAtlas.module.css';

const MAX_ACTIVE_PULSES = 14;
const MOBILE_ACTIVE_PULSES = 7;
const NODE_SIZE = 30;
const NODE_PORT_OFFSET = NODE_SIZE / 2;

// SVG mirrors DESIGN_SYSTEM.md spacing so geometry changes stay token-bound.
const SPACE_1 = 8;
const SPACE_2 = 16;
const SPACE_3 = 24;
const SPACE_4 = 32;
const SPACE_5 = 40;
const SPACE_6 = 48;
const SPACE_7 = 56;
const SPACE_8 = 64;
const SPACE_10 = 80;
const GRID = SPACE_1 / 2;
const MIN_EDGE_SEPARATION = SPACE_2;
const NODE_CLEARANCE = SPACE_2;
const LABEL_CLEARANCE = SPACE_1;
const FIELD_BOUNDARY_CLEARANCE = SPACE_1;
const FIELD_BOUNDARY_RUN_LIMIT = 9;
const FIELD_PADDING = SPACE_3;
const FIELD_CONTENT_FIT = 0.98;
const FIELD_LABEL_CLEARANCE = GRID;
const ROUTE_BEND = SPACE_4;

type FieldId = 'knowledge' | 'action';
type EdgeKind = FieldId | 'cross';
type EdgeWeight = 'primary' | 'secondary';
type NodeId =
  | 'facts'
  | 'docs'
  | 'formats'
  | 'code'
  | 'answer'
  | 'ask'
  | 'repair'
  | 'validate';
type EdgeId =
  | 'facts-docs'
  | 'facts-formats'
  | 'docs-code'
  | 'formats-code'
  | 'answer-repair'
  | 'answer-ask'
  | 'ask-validate'
  | 'repair-validate'
  | 'docs-answer'
  | 'formats-ask'
  | 'code-repair'
  | 'code-validate'
  | 'facts-validate';
type PhaseId = 'knowledge' | 'action' | 'cross' | 'whole';
type Viewport = 'desktop' | 'mobile';

type Point = { x: number; y: number };
type LayoutBox = Point & { width: number; height: number };
type PortSide = 'top' | 'right' | 'bottom' | 'left';
type Cubic = { start: Point; c1: Point; c2: Point; end: Point };
type Field = {
  id: FieldId;
  title: string;
  subtitle: string;
  center: Point;
  radius: Point;
  label: Point;
  subtitleY: number;
  textAnchor?: 'start' | 'middle' | 'end';
};
type Node = Point & {
  id: NodeId;
  label: string;
  emoji: EmojiAsset;
  field: FieldId;
};
type Edge = {
  id: EdgeId;
  from: NodeId;
  to: NodeId;
  kind: EdgeKind;
  weight: EdgeWeight;
  d: string;
  curve: Cubic;
};
type DiagramSpec = {
  viewBox: LayoutBox;
  surface: LayoutBox;
  eyebrow: Point;
  caption: Point & { copy: string };
  modelFrame: LayoutBox;
  fields: Field[];
  nodes: Node[];
  edges: Edge[];
};
type ActivePulse = {
  id: string;
  edgeId: EdgeId;
  phase: PhaseId;
  reverse: boolean;
  width: number;
  opacity: number;
  duration: number;
  size: number;
};

type PulseStyle = React.CSSProperties & {
  '--pulse-size': number;
  '--pulse-gap': number;
  '--pulse-width': number;
  '--pulse-opacity': number;
  '--pulse-duration': string;
};

const STORY_COPY = {
  label:
    'Venn-style map of world knowledge and action patterns interconnected inside one LLM parameter mesh',
  eyebrow: 'encoded statistical structure',
  desktopCaption:
    'knowledge and actions are intertwined across one parameter mesh',
  mobileCaption: 'one interconnected model mesh',
};

const NODE_INFO: Record<NodeId, Omit<Node, 'x' | 'y'>> = {
  facts: {
    id: 'facts',
    label: 'facts',
    emoji: EMOJI.globe,
    field: 'knowledge',
  },
  docs: { id: 'docs', label: 'docs', emoji: EMOJI.books, field: 'knowledge' },
  formats: {
    id: 'formats',
    label: 'formats',
    emoji: EMOJI.receipt,
    field: 'knowledge',
  },
  code: {
    id: 'code',
    label: 'code',
    emoji: EMOJI.computer,
    field: 'knowledge',
  },
  answer: {
    id: 'answer',
    label: 'answer',
    emoji: EMOJI.writing,
    field: 'action',
  },
  ask: { id: 'ask', label: 'ask', emoji: EMOJI.question, field: 'action' },
  repair: {
    id: 'repair',
    label: 'repair',
    emoji: EMOJI.tools,
    field: 'action',
  },
  validate: {
    id: 'validate',
    label: 'validate',
    emoji: EMOJI.check,
    field: 'action',
  },
};

const EDGE_INFO: Record<EdgeId, Omit<Edge, 'd' | 'curve'>> = {
  'facts-docs': edge('facts-docs', 'facts', 'docs', 'knowledge', 'secondary'),
  'facts-formats': edge(
    'facts-formats',
    'facts',
    'formats',
    'knowledge',
    'secondary'
  ),
  'docs-code': edge('docs-code', 'docs', 'code', 'knowledge', 'primary'),
  'formats-code': edge(
    'formats-code',
    'formats',
    'code',
    'knowledge',
    'secondary'
  ),
  'answer-repair': edge(
    'answer-repair',
    'answer',
    'repair',
    'action',
    'primary'
  ),
  'answer-ask': edge('answer-ask', 'answer', 'ask', 'action', 'secondary'),
  'ask-validate': edge(
    'ask-validate',
    'ask',
    'validate',
    'action',
    'secondary'
  ),
  'repair-validate': edge(
    'repair-validate',
    'repair',
    'validate',
    'action',
    'secondary'
  ),
  'docs-answer': edge('docs-answer', 'docs', 'answer', 'cross', 'primary'),
  'formats-ask': edge('formats-ask', 'formats', 'ask', 'cross', 'secondary'),
  'code-repair': edge('code-repair', 'code', 'repair', 'cross', 'primary'),
  'code-validate': edge(
    'code-validate',
    'code',
    'validate',
    'cross',
    'secondary'
  ),
  'facts-validate': edge(
    'facts-validate',
    'facts',
    'validate',
    'cross',
    'secondary'
  ),
};

const VIEWPORT_LAYOUTS = {
  desktop: {
    viewBox: { x: 0, y: 0, width: 640, height: 360 },
    surfaceInset: SPACE_2,
    frame: { x: SPACE_4, y: SPACE_10 - GRID, width: 576, height: 244 },
    eyebrow: { x: SPACE_5, y: SPACE_4 },
  },
  mobile: {
    viewBox: { x: 0, y: 0, width: 360, height: 612 },
    surfaceInset: SPACE_1 + GRID,
    frame: { x: SPACE_3 + GRID, y: SPACE_8, width: 304, height: 488 },
    eyebrow: { x: SPACE_4, y: SPACE_5 },
  },
} satisfies Record<
  Viewport,
  {
    viewBox: LayoutBox;
    surfaceInset: number;
    frame: LayoutBox;
    eyebrow: Point;
  }
>;

const PHASE_EDGES: Record<PhaseId, EdgeId[]> = {
  knowledge: ['facts-docs', 'facts-formats', 'docs-code', 'formats-code'],
  action: ['answer-repair', 'answer-ask', 'ask-validate', 'repair-validate'],
  cross: ['docs-answer', 'formats-ask', 'code-repair'],
  whole: ['facts-validate', 'code-validate', 'docs-answer'],
};

const PHASE_SEQUENCE: PhaseId[] = ['knowledge', 'cross', 'action', 'whole'];

const NODE_IDS = Object.keys(NODE_INFO) as NodeId[];
const EDGE_IDS = Object.keys(EDGE_INFO) as EdgeId[];

type Route = {
  from: PortSide;
  to: PortSide;
  out: number;
  in: number;
  cross: number;
};

const DESKTOP_NODE_SLOTS: Record<NodeId, Point> = {
  facts: { x: -0.62, y: -0.22 },
  docs: { x: 0, y: -0.48 },
  formats: { x: -0.35, y: 0.38 },
  code: { x: 0.38, y: 0.34 },
  answer: { x: -0.18, y: -0.46 },
  ask: { x: -0.12, y: 0.38 },
  repair: { x: 0.58, y: -0.18 },
  validate: { x: 0.42, y: 0.38 },
};

const MOBILE_NODE_SLOTS: Record<NodeId, Point> = {
  facts: { x: -0.42, y: -0.56 },
  docs: { x: 0.62, y: -0.45 },
  formats: { x: -0.5, y: 0.16 },
  code: { x: -0.06, y: 0.32 },
  answer: { x: 0.2, y: -0.42 },
  ask: { x: -0.66, y: 0.24 },
  repair: { x: 0.34, y: 0.28 },
  validate: { x: 0, y: 0.44 },
};

const ROUTES: Record<Viewport, Record<EdgeId, Route>> = {
  desktop: {
    'facts-docs': route('right', 'left', ROUTE_BEND, ROUTE_BEND, -SPACE_1),
    'facts-formats': route('bottom', 'top', SPACE_3, SPACE_3, -SPACE_1),
    'docs-code': route('bottom', 'top', SPACE_5, SPACE_5, -SPACE_2),
    'formats-code': route('right', 'left', SPACE_5, SPACE_5, SPACE_3),
    'answer-repair': route('right', 'top', SPACE_5, SPACE_5, -SPACE_3),
    'answer-ask': route('bottom', 'top', SPACE_5, SPACE_5, SPACE_1),
    'ask-validate': route('right', 'left', SPACE_5, SPACE_5, SPACE_6),
    'repair-validate': route('bottom', 'top', SPACE_3, SPACE_3, SPACE_1),
    'docs-answer': route('right', 'left', SPACE_5, SPACE_5, -SPACE_2),
    'formats-ask': route('bottom', 'left', SPACE_7, SPACE_7, SPACE_5),
    'code-repair': route('right', 'left', SPACE_8, SPACE_8, SPACE_4),
    'code-validate': route('bottom', 'bottom', SPACE_7, SPACE_7, -SPACE_6),
    'facts-validate': route('left', 'bottom', SPACE_10, SPACE_6, -SPACE_8),
  },
  mobile: {
    'facts-docs': route('right', 'left', SPACE_5, SPACE_5, -SPACE_3),
    'facts-formats': route('bottom', 'top', SPACE_6, SPACE_6, -SPACE_2),
    'docs-code': route('bottom', 'top', SPACE_10, SPACE_10, SPACE_3),
    'formats-code': route('right', 'left', SPACE_3, SPACE_3, SPACE_2),
    'answer-repair': route('right', 'right', SPACE_8, SPACE_6, -SPACE_10),
    'answer-ask': route('left', 'top', SPACE_10, SPACE_5, SPACE_4),
    'ask-validate': route('right', 'left', SPACE_6, SPACE_6, SPACE_3),
    'repair-validate': route('bottom', 'right', SPACE_4, SPACE_4, SPACE_1),
    'docs-answer': route('bottom', 'right', SPACE_7, SPACE_5, -SPACE_4),
    'formats-ask': route('bottom', 'top', SPACE_8, SPACE_8, SPACE_1),
    'code-repair': route('right', 'top', SPACE_7, SPACE_5, -SPACE_3),
    'code-validate': route('bottom', 'top', SPACE_7, SPACE_6, SPACE_5),
    'facts-validate': route('left', 'left', SPACE_10, SPACE_10, -SPACE_8),
  },
};

function route(
  from: PortSide,
  to: PortSide,
  out: number,
  inside: number,
  cross: number
): Route {
  return { from, to, out, in: inside, cross };
}

function edge(
  id: EdgeId,
  from: NodeId,
  to: NodeId,
  kind: EdgeKind,
  weight: EdgeWeight
) {
  return { id, from, to, kind, weight };
}

function buildSpec(viewport: Viewport): DiagramSpec {
  const layout = VIEWPORT_LAYOUTS[viewport];
  const spec = {
    viewBox: layout.viewBox,
    surface: insetBox(layout.viewBox, layout.surfaceInset),
    eyebrow: layout.eyebrow,
    caption: caption(layout),
    modelFrame: layout.frame,
    fields: buildFields(viewport, layout.frame),
    nodes: buildNodes(viewport, layout.frame),
    edges: [] as Edge[],
  };
  spec.edges = buildEdges(viewport, spec.nodes);
  validateSpec(viewport, spec);
  return spec;
}

function caption(layout: (typeof VIEWPORT_LAYOUTS)[Viewport]) {
  const copy =
    layout.viewBox.width > 400
      ? STORY_COPY.desktopCaption
      : STORY_COPY.mobileCaption;
  const surface = insetBox(layout.viewBox, layout.surfaceInset);
  return { x: layout.viewBox.width / 2, y: bottom(surface) - SPACE_2, copy };
}

function insetBox(box: LayoutBox, inset: number): LayoutBox {
  return snapBox({
    x: inset,
    y: inset,
    width: box.width - inset * 2,
    height: box.height - inset * 2,
  });
}

function buildFields(viewport: Viewport, frame: LayoutBox) {
  return viewport === 'desktop' ? desktopFields(frame) : mobileFields(frame);
}

function desktopFields(frame: LayoutBox): Field[] {
  const center = boxCenter(frame);
  const radius = {
    x: snap(frame.width * 0.34),
    y: snap((frame.height - FIELD_PADDING) / 2),
  };
  return [
    field(
      'knowledge',
      'world + domain knowledge',
      'facts, concepts, artifacts',
      { x: center.x - SPACE_10 - GRID, y: center.y },
      radius,
      { x: frame.x + SPACE_10 * 2, y: frame.y - SPACE_2 },
      'middle'
    ),
    field(
      'action',
      'action patterns',
      'answers, revisions, validation',
      { x: center.x + SPACE_10 + GRID, y: center.y },
      radius,
      { x: right(frame) - SPACE_10 * 2, y: frame.y - SPACE_2 },
      'middle'
    ),
  ];
}

function mobileFields(frame: LayoutBox): Field[] {
  const center = boxCenter(frame);
  const radius = { x: snap(frame.width * 0.45), y: snap(frame.height * 0.295) };
  return [
    field(
      'knowledge',
      'world + domain knowledge',
      'facts, concepts, artifacts',
      { x: center.x - SPACE_3, y: frame.y + snap(frame.height * 0.39) },
      radius,
      { x: frame.x + SPACE_4, y: frame.y + SPACE_2 }
    ),
    field(
      'action',
      'action patterns',
      'answers, revisions, validation',
      { x: center.x + SPACE_3, y: frame.y + snap(frame.height * 0.62) },
      radius,
      { x: right(frame) - SPACE_4, y: bottom(frame) - SPACE_3 },
      'end'
    ),
  ];
}

function field(
  id: FieldId,
  title: string,
  subtitle: string,
  center: Point,
  radius: Point,
  label: Point,
  textAnchor?: Field['textAnchor']
): Field {
  return {
    id,
    title,
    subtitle,
    center: snapPoint(center),
    radius: snapPoint(radius),
    label: snapPoint(label),
    subtitleY: snap(label.y + SPACE_1 + GRID),
    textAnchor,
  };
}

function buildNodes(viewport: Viewport, frame: LayoutBox) {
  const slots = viewport === 'desktop' ? DESKTOP_NODE_SLOTS : MOBILE_NODE_SLOTS;
  const fields = Object.fromEntries(
    buildFields(viewport, frame).map((item) => [item.id, item])
  );
  return NODE_IDS.map((id) =>
    nodeFromSlot(id, fields[NODE_INFO[id].field], slots[id])
  );
}

function nodeFromSlot(id: NodeId, field: Field, slot: Point) {
  return {
    ...NODE_INFO[id],
    ...snapPoint({
      x: field.center.x + field.radius.x * slot.x,
      y: field.center.y + field.radius.y * slot.y,
    }),
  };
}

function buildEdges(viewport: Viewport, nodes: Node[]) {
  const nodeMap = nodes.reduce(
    (map, node) => ({ ...map, [node.id]: node }),
    {} as Record<NodeId, Node>
  );
  return EDGE_IDS.map((id) => edgeFromRoute(id, nodeMap, ROUTES[viewport][id]));
}

function edgeFromRoute(id: EdgeId, nodes: Record<NodeId, Node>, route: Route) {
  const info = EDGE_INFO[id];
  const curve = cubicRoute(nodes[info.from], nodes[info.to], route);
  return { ...info, curve, d: cubicPath(curve) };
}

function cubicRoute(from: Node, to: Node, route: Route): Cubic {
  const start = port(from, route.from);
  const end = port(to, route.to);
  return {
    start,
    end,
    c1: control(start, route.from, route.out, route.cross),
    c2: control(end, route.to, route.in, -route.cross),
  };
}

function control(point: Point, side: PortSide, out: number, cross: number) {
  const vector = sideVector(side);
  const normal = { x: -vector.y, y: vector.x };
  return snapPoint({
    x: point.x + vector.x * out + normal.x * cross,
    y: point.y + vector.y * out + normal.y * cross,
  });
}

function port(node: Node, side: PortSide) {
  const vector = sideVector(side);
  return snapPoint({
    x: node.x + vector.x * NODE_PORT_OFFSET,
    y: node.y + vector.y * NODE_PORT_OFFSET,
  });
}

function sideVector(side: PortSide) {
  return {
    top: { x: 0, y: -1 },
    right: { x: 1, y: 0 },
    bottom: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
  }[side];
}

function cubicPath({ start, c1, c2, end }: Cubic) {
  return `M ${start.x} ${start.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${end.x} ${end.y}`;
}

function validateSpec(viewport: Viewport, spec: DiagramSpec) {
  const failures = [
    ...validateFieldBounds(spec),
    ...validateFieldLabels(spec),
    ...validateFieldContents(viewport, spec),
    ...validateNodeBounds(spec),
    ...validateNodeGaps(spec),
    ...validateEdges(viewport, spec),
  ];
  if (failures.length > 0)
    throw new Error(
      `ModelEncodingAtlas ${viewport} geometry invalid: ${failures.join('; ')}`
    );
}

function validateFieldBounds(spec: DiagramSpec) {
  return spec.fields.flatMap((field) =>
    containsField(spec.surface, field)
      ? []
      : [`${field.id} field outside surface clearance`]
  );
}

function validateFieldLabels(spec: DiagramSpec) {
  return spec.fields.flatMap((field) =>
    fieldLabelClearsBoundary(field)
      ? []
      : [`${field.id} field label too close to boundary`]
  );
}

function validateFieldContents(viewport: Viewport, spec: DiagramSpec) {
  const fields = Object.fromEntries(
    spec.fields.map((field) => [field.id, field])
  ) as Record<FieldId, Field>;
  return spec.nodes.flatMap((node) =>
    nodeContentsFitField(viewport, node, fields[node.field])
      ? []
      : [`${node.id} content outside ${node.field} field fit`]
  );
}

function validateNodeBounds(spec: DiagramSpec) {
  return spec.nodes.flatMap((node) =>
    containsNode(spec.modelFrame, node)
      ? []
      : [`${node.id} outside model frame clearance`]
  );
}

function validateNodeGaps(spec: DiagramSpec) {
  return pairs(spec.nodes).flatMap(([a, b]) =>
    distance(a, b) >= NODE_SIZE + MIN_EDGE_SEPARATION
      ? []
      : [`${a.id}/${b.id} node gap below token`]
  );
}

function validateEdges(viewport: Viewport, spec: DiagramSpec) {
  return [
    ...validateEdgeNodes(spec),
    ...validateEdgeLabels(viewport, spec),
    ...validateEdgeFieldBoundaries(viewport, spec),
    ...validateEdgePairs(viewport, spec),
  ];
}

function validateEdgeNodes(spec: DiagramSpec) {
  const samples = edgeSamples(spec.edges);
  return samples.flatMap(({ edge, point }) =>
    spec.nodes.flatMap((node) =>
      edge.from === node.id ||
      edge.to === node.id ||
      INTENTIONAL_EDGE_NODE_PROXIMITIES.has(`${edge.id}/${node.id}`) ||
      distance(point, node) >= NODE_PORT_OFFSET + NODE_CLEARANCE
        ? []
        : [`${edge.id} too close to ${node.id}`]
    )
  );
}

function validateEdgeLabels(viewport: Viewport, spec: DiagramSpec) {
  const labels = spec.nodes.map((node) => labelBox(viewport, node));
  return edgeSamples(spec.edges).flatMap(({ edge, point }) =>
    labels.flatMap((label) =>
      INTENTIONAL_EDGE_NODE_PROXIMITIES.has(`${edge.id}/${label.id}`) ||
      ENDPOINT_LABEL_PROXIMITIES[viewport].has(`${edge.id}/${label.id}`) ||
      pointBoxDistance(point, label) >= LABEL_CLEARANCE
        ? []
        : [`${edge.id} too close to ${label.id} label`]
    )
  );
}

function validateEdgeFieldBoundaries(viewport: Viewport, spec: DiagramSpec) {
  return spec.edges.flatMap((edge) =>
    spec.fields.flatMap((field) =>
      shouldValidateFieldBoundary(viewport, edge, field) &&
      hasBoundaryRide(edge.curve, field)
        ? [`${edge.id} rides ${field.id} field boundary`]
        : []
    )
  );
}

function shouldValidateFieldBoundary(
  viewport: Viewport,
  edge: Edge,
  field: Field
) {
  return (
    edge.kind !== 'cross' &&
    edge.kind !== field.id &&
    !INTENTIONAL_EDGE_FIELD_PROXIMITIES[viewport].has(`${edge.id}/${field.id}`)
  );
}

function hasBoundaryRide(curve: Cubic, field: Field) {
  return maxConsecutive(
    sampleCurve(curve).map(
      (point) =>
        ellipseBoundaryDistance(point, field) < FIELD_BOUNDARY_CLEARANCE
    )
  ) >= FIELD_BOUNDARY_RUN_LIMIT;
}

function ellipseBoundaryDistance(point: Point, field: Field) {
  const dx = point.x - field.center.x;
  const dy = point.y - field.center.y;
  if (dx === 0 && dy === 0) return Math.min(field.radius.x, field.radius.y);
  const angle = Math.atan2(dy, dx);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const boundaryRadius =
    1 /
    Math.sqrt(
      (cos / field.radius.x) ** 2 + (sin / field.radius.y) ** 2
    );
  return Math.abs(Math.hypot(dx, dy) - boundaryRadius);
}

function maxConsecutive(values: boolean[]) {
  return values.reduce(
    (state, value) => {
      const current = value ? state.current + 1 : 0;
      return { current, max: Math.max(state.max, current) };
    },
    { current: 0, max: 0 }
  ).max;
}

function validateEdgePairs(viewport: Viewport, spec: DiagramSpec) {
  const nodes = nodeRecord(spec.nodes);
  return pairs(spec.edges).flatMap(([a, b]) =>
    skipEdgePair(viewport, a, b) ||
    minCurveDistance(a, b, sharedNode(a, b, nodes)) >= MIN_EDGE_SEPARATION
      ? []
      : [`${a.id}/${b.id} edge separation below token`]
  );
}

function skipEdgePair(viewport: Viewport, a: Edge, b: Edge) {
  return INTENTIONAL_EDGE_CROSSINGS[viewport].has(pairKey(a.id, b.id));
}

function edgeSamples(edges: Edge[]) {
  return edges.flatMap((edge) =>
    sampleCurve(edge.curve).map((point) => ({ edge, point }))
  );
}

function sampleCurve(curve: Cubic) {
  return Array.from({ length: 65 }, (_, index) =>
    cubicPoint(curve, index / 64)
  );
}

function cubicPoint({ start, c1, c2, end }: Cubic, t: number) {
  const mt = 1 - t;
  return {
    x:
      mt ** 3 * start.x +
      3 * mt ** 2 * t * c1.x +
      3 * mt * t ** 2 * c2.x +
      t ** 3 * end.x,
    y:
      mt ** 3 * start.y +
      3 * mt ** 2 * t * c1.y +
      3 * mt * t ** 2 * c2.y +
      t ** 3 * end.y,
  };
}

function minCurveDistance(a: Edge, b: Edge, shared?: Node) {
  const distances = sampleCurve(a.curve).flatMap((p) =>
    sampleCurve(b.curve)
      .filter((q) => !shared || outsideSharedPortZone(p, q, shared))
      .map((q) => distance(p, q))
  );
  return Math.min(...distances);
}

function outsideSharedPortZone(a: Point, b: Point, node: Node) {
  const radius = NODE_PORT_OFFSET + MIN_EDGE_SEPARATION;
  return distance(a, node) > radius || distance(b, node) > radius;
}

function labelBox(viewport: Viewport, node: Node) {
  const point = nodeLabelPoint(viewport, node);
  const width = Math.max(SPACE_5, node.label.length * 6);
  return {
    id: node.id,
    x: point.x - width / 2,
    y: point.y - SPACE_1,
    width,
    height: SPACE_2,
  };
}

function fieldLabelClearsBoundary(field: Field) {
  const label = fieldTextBox(field);
  const top = field.center.y - field.radius.y;
  const bottomEdge = field.center.y + field.radius.y;
  return field.label.y < field.center.y
    ? bottom(label) + FIELD_LABEL_CLEARANCE <= top
    : label.y - FIELD_LABEL_CLEARANCE >= bottomEdge;
}

function fieldTextBox(field: Field) {
  const title = textBox(field.label, field.title, field.textAnchor, 6);
  const subtitle = textBox(
    { x: field.label.x, y: field.subtitleY },
    field.subtitle,
    field.textAnchor,
    5.5
  );
  return unionBox(title, subtitle);
}

function textBox(
  baseline: Point,
  copy: string,
  textAnchor: Field['textAnchor'],
  charWidth: number
): LayoutBox {
  const width = copy.length * charWidth;
  const left =
    textAnchor === 'middle'
      ? baseline.x - width / 2
      : textAnchor === 'end'
        ? baseline.x - width
        : baseline.x;
  return { x: left, y: baseline.y - SPACE_1, width, height: SPACE_2 };
}

function unionBox(a: LayoutBox, b: LayoutBox): LayoutBox {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, width: Math.max(right(a), right(b)) - x, height: Math.max(bottom(a), bottom(b)) - y };
}

function nodeContentsFitField(viewport: Viewport, node: Node, field: Field) {
  return contentPoints(viewport, node).every(
    (point) => ellipseValue(point, field) <= FIELD_CONTENT_FIT
  );
}

function contentPoints(viewport: Viewport, node: Node) {
  const label = labelBox(viewport, node);
  return [
    { x: node.x - NODE_PORT_OFFSET, y: node.y },
    { x: node.x + NODE_PORT_OFFSET, y: node.y },
    { x: node.x, y: node.y - NODE_PORT_OFFSET },
    { x: node.x, y: node.y + NODE_PORT_OFFSET },
    ...boxCorners(label),
  ];
}

function boxCorners(box: LayoutBox) {
  return [
    { x: box.x, y: box.y },
    { x: right(box), y: box.y },
    { x: box.x, y: bottom(box) },
    { x: right(box), y: bottom(box) },
  ];
}

function ellipseValue(point: Point, field: Field) {
  return (
    ((point.x - field.center.x) / field.radius.x) ** 2 +
    ((point.y - field.center.y) / field.radius.y) ** 2
  );
}

function containsField(box: LayoutBox, field: Field) {
  return (
    field.center.x - field.radius.x >= box.x + FIELD_BOUNDARY_CLEARANCE &&
    field.center.x + field.radius.x <= right(box) - FIELD_BOUNDARY_CLEARANCE &&
    field.center.y - field.radius.y >= box.y + FIELD_BOUNDARY_CLEARANCE &&
    field.center.y + field.radius.y <= bottom(box) - FIELD_BOUNDARY_CLEARANCE
  );
}

function containsNode(box: LayoutBox, node: Node) {
  const radius = NODE_PORT_OFFSET + NODE_CLEARANCE;
  return (
    node.x - radius >= box.x &&
    node.x + radius <= right(box) &&
    node.y - radius >= box.y &&
    node.y + SPACE_6 <= bottom(box)
  );
}

function pointBoxDistance(point: Point, box: LayoutBox & { id: NodeId }) {
  const dx = Math.max(box.x - point.x, 0, point.x - right(box));
  const dy = Math.max(box.y - point.y, 0, point.y - bottom(box));
  return Math.hypot(dx, dy);
}

function sharedNode(a: Edge, b: Edge, nodes: Record<NodeId, Node>) {
  return sharedNodeId(a, b) ? nodes[sharedNodeId(a, b) as NodeId] : undefined;
}

function sharedNodeId(a: Edge, b: Edge) {
  return [a.from, a.to].find((id) => id === b.from || id === b.to);
}

function nodeRecord(nodes: Node[]) {
  return nodes.reduce(
    (map, node) => ({ ...map, [node.id]: node }),
    {} as Record<NodeId, Node>
  );
}

const INTENTIONAL_EDGE_CROSSINGS: Record<Viewport, Set<string>> = {
  desktop: new Set(
    [
      'docs-code/docs-answer',
      'docs-code/formats-ask',
      'docs-code/facts-validate',
      'facts-formats/facts-validate',
      'formats-code/facts-validate',
      'answer-ask/code-repair',
      'answer-ask/facts-validate',
      'ask-validate/code-repair',
      'ask-validate/code-validate',
      'ask-validate/facts-validate',
      'formats-ask/code-repair',
      'formats-ask/code-validate',
      'formats-ask/facts-validate',
      'code-repair/facts-validate',
      'code-validate/facts-validate',
    ].map(normalPairKey)
  ),
  mobile: new Set(
    [
      'docs-code/docs-answer',
      'docs-code/answer-ask',
      'formats-code/answer-ask',
      'answer-repair/code-repair',
      'answer-repair/docs-answer',
      'answer-ask/code-repair',
      'answer-ask/code-validate',
      'answer-ask/facts-validate',
      'answer-ask/formats-ask',
      'ask-validate/facts-validate',
      'formats-ask/facts-validate',
      'code-validate/facts-validate',
    ].map(normalPairKey)
  ),
};

const INTENTIONAL_EDGE_FIELD_PROXIMITIES: Record<Viewport, Set<string>> = {
  desktop: new Set([
    'docs-code/action',
    'formats-code/action',
    'answer-repair/knowledge',
  ]),
  mobile: new Set(['answer-ask/knowledge']),
};

const ENDPOINT_LABEL_PROXIMITIES: Record<Viewport, Set<string>> = {
  desktop: new Set([
    'facts-formats/facts',
    'docs-code/docs',
    'answer-ask/answer',
    'repair-validate/repair',
    'formats-ask/formats',
    'code-validate/code',
    'code-validate/validate',
    'facts-validate/facts',
    'facts-validate/validate',
  ]),
  mobile: new Set([
    'facts-formats/facts',
    'docs-code/docs',
    'formats-code/formats',
    'docs-answer/docs',
    'answer-repair/answer',
    'answer-ask/answer',
    'repair-validate/repair',
    'formats-ask/formats',
    'code-validate/code',
    'code-validate/validate',
    'facts-validate/facts',
    'facts-validate/validate',
  ]),
};

const INTENTIONAL_EDGE_NODE_PROXIMITIES = new Set([
  'formats-ask/code',
  'code-repair/ask',
  'code-validate/ask',
  'facts-validate/code',
  'facts-validate/ask',
  'answer-ask/code',
  'code-validate/repair',
  'facts-validate/formats',
  'answer-ask/formats',
  'code-repair/answer',
]);

function pairs<T>(items: T[]) {
  return items.flatMap((item, index) =>
    items.slice(index + 1).map((other) => [item, other] as const)
  );
}

function pairKey(a: EdgeId, b: EdgeId) {
  return normalPairKey(`${a}/${b}`);
}

function normalPairKey(key: string) {
  return key.split('/').sort().join('/');
}

function boxCenter(box: LayoutBox) {
  return { x: snap(box.x + box.width / 2), y: snap(box.y + box.height / 2) };
}

function right(box: LayoutBox) {
  return box.x + box.width;
}
function bottom(box: LayoutBox) {
  return box.y + box.height;
}
function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function snap(value: number) {
  return Math.round(value / GRID) * GRID;
}
function snapPoint(point: Point) {
  return { x: snap(point.x), y: snap(point.y) };
}
function snapBox(box: LayoutBox) {
  return {
    x: snap(box.x),
    y: snap(box.y),
    width: snap(box.width),
    height: snap(box.height),
  };
}

const DESKTOP_SPEC = buildSpec('desktop');
const MOBILE_SPEC = buildSpec('mobile');

function randomFloat(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randomInt(min: number, max: number) {
  return Math.floor(randomFloat(min, max + 1));
}

function shouldReduceMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function pulseStyle(pulse: ActivePulse): PulseStyle {
  return {
    '--pulse-size': pulse.size,
    '--pulse-gap': 100 - pulse.size,
    '--pulse-width': pulse.width,
    '--pulse-opacity': pulse.opacity,
    '--pulse-duration': `${pulse.duration}ms`,
  };
}

function makePulse(id: string, edgeId: EdgeId, phase: PhaseId): ActivePulse {
  const weight = EDGE_INFO[edgeId].weight;
  return {
    id,
    edgeId,
    phase,
    reverse: phase === 'whole' || Math.random() > 0.84,
    width: Number(
      randomFloat(
        weight === 'primary' ? 2.2 : 1.3,
        weight === 'primary' ? 3.4 : 2
      ).toFixed(2)
    ),
    opacity: Number(
      randomFloat(
        weight === 'primary' ? 0.68 : 0.34,
        weight === 'primary' ? 0.92 : 0.52
      ).toFixed(2)
    ),
    duration: randomInt(1200, weight === 'primary' ? 2200 : 2800),
    size: Number(
      randomFloat(
        weight === 'primary' ? 6 : 4,
        weight === 'primary' ? 13 : 8
      ).toFixed(2)
    ),
  };
}

function fieldClassName(id: FieldId) {
  return id === 'knowledge' ? styles.knowledgeField : styles.actionField;
}

function edgeClassName(edge: Edge) {
  return [
    styles.meshEdge,
    styles[`${edge.kind}Edge`],
    styles[`${edge.weight}Edge`],
  ].join(' ');
}

function FieldHalo({ field }: { field: Field }) {
  return (
    <g>
      <ellipse
        cx={field.center.x}
        cy={field.center.y}
        rx={field.radius.x}
        ry={field.radius.y}
        className={`${styles.fieldPlate} ${fieldClassName(field.id)}`}
      />
      <ellipse
        cx={field.center.x}
        cy={field.center.y}
        rx={field.radius.x}
        ry={field.radius.y}
        className={`${styles.fieldBoundary} ${fieldClassName(field.id)}`}
      />
      <FieldLabel field={field} />
    </g>
  );
}

function FieldLabel({ field }: { field: Field }) {
  const color =
    field.id === 'knowledge' ? 'var(--visual-indigo)' : 'var(--visual-magenta)';
  return (
    <>
      <text
        {...textProps(field.label, field.textAnchor)}
        fontSize="12"
        fontWeight="600"
        fill={color}
      >
        {field.title}
      </text>
      <text
        {...textProps(
          { x: field.label.x, y: field.subtitleY },
          field.textAnchor
        )}
        fontSize="10"
        fill="var(--text-muted)"
      >
        {field.subtitle}
      </text>
    </>
  );
}

function textProps(point: Point, textAnchor: Field['textAnchor'] = 'start') {
  return {
    x: point.x,
    y: point.y,
    textAnchor,
    fontFamily: 'var(--font-mono-spec)',
  };
}

function MeshEdge({ edge }: { edge: Edge; viewport: Viewport }) {
  return <path d={edge.d} className={edgeClassName(edge)} />;
}

function PulsePath({
  edge,
  pulse,
  onDone,
}: {
  edge: Edge;
  pulse: ActivePulse;
  onDone: (id: string) => void;
}) {
  const className = [
    styles.edgePulse,
    styles[`${pulse.phase}Pulse`],
    pulse.reverse && styles.edgePulseReverse,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <path
      d={edge.d}
      pathLength="100"
      className={className}
      style={pulseStyle(pulse)}
      onAnimationEnd={() => onDone(pulse.id)}
    />
  );
}

function PatternNode({ node, viewport }: { node: Node; viewport: Viewport }) {
  const color =
    node.field === 'knowledge'
      ? 'var(--visual-indigo)'
      : 'var(--visual-magenta)';
  const label = nodeLabelPoint(viewport, node);
  return (
    <g>
      <EmojiImage
        asset={node.emoji}
        x={node.x - NODE_PORT_OFFSET}
        y={node.y - NODE_PORT_OFFSET}
        size={NODE_SIZE}
      />
      <text
        x={label.x}
        y={label.y}
        textAnchor="middle"
        fontFamily="var(--font-mono-keyword)"
        fontSize="10.5"
        fill={color}
        stroke="var(--surface-raised)"
        strokeWidth="4"
        paintOrder="stroke fill"
      >
        {node.label}
      </text>
    </g>
  );
}

function nodeLabelPoint(viewport: Viewport, node: Node) {
  return viewport === 'mobile' && node.id === 'answer'
    ? { x: node.x - SPACE_3, y: node.y + 39 }
    : { x: node.x, y: node.y + 39 };
}

function FieldMeshLayer({
  spec,
  viewport,
}: {
  spec: DiagramSpec;
  viewport: Viewport;
}) {
  return (
    <>
      {spec.fields.map((field) => (
        <FieldHalo key={field.id} field={field} />
      ))}
      {spec.edges.map((edge) => (
        <MeshEdge key={edge.id} edge={edge} viewport={viewport} />
      ))}
    </>
  );
}

function NodeLayer({ nodes, viewport }: { nodes: Node[]; viewport: Viewport }) {
  return (
    <>
      {nodes.map((node) => (
        <PatternNode key={node.id} node={node} viewport={viewport} />
      ))}
    </>
  );
}

function PulseLayer({
  spec,
  pulses,
  onDone,
}: {
  spec: DiagramSpec;
  pulses: ActivePulse[];
  onDone: (id: string) => void;
}) {
  return <>{pulses.map((pulse) => renderPulse(spec, pulse, onDone))}</>;
}

function renderPulse(
  spec: DiagramSpec,
  pulse: ActivePulse,
  onDone: (id: string) => void
) {
  const edge = spec.edges.find((candidate) => candidate.id === pulse.edgeId);
  return edge ? (
    <PulsePath key={pulse.id} edge={edge} pulse={pulse} onDone={onDone} />
  ) : null;
}

function layoutBox(layout: LayoutBox) {
  return {
    x: layout.x,
    y: layout.y,
    width: layout.width,
    height: layout.height,
  };
}

function AtlasSvg({
  spec,
  className,
  pulses,
  onDone,
  viewport,
}: {
  spec: DiagramSpec;
  className: string;
  pulses: ActivePulse[];
  onDone: (id: string) => void;
  viewport: Viewport;
}) {
  return (
    <svg
      viewBox={`${spec.viewBox.x} ${spec.viewBox.y} ${spec.viewBox.width} ${spec.viewBox.height}`}
      width="100%"
      role="img"
      aria-label={STORY_COPY.label}
      className={`${styles.diagram} ${className}`}
    >
      <rect
        {...layoutBox(spec.surface)}
        fill="var(--surface-raised)"
        stroke="var(--border-default)"
        strokeWidth="1"
      />
      <text
        x={spec.eyebrow.x}
        y={spec.eyebrow.y}
        fontFamily="var(--font-mono-spec)"
        fontSize="11"
        fill="var(--text-muted)"
      >
        {STORY_COPY.eyebrow}
      </text>
      <FieldMeshLayer spec={spec} viewport={viewport} />
      <PulseLayer spec={spec} pulses={pulses} onDone={onDone} />
      <NodeLayer nodes={spec.nodes} viewport={viewport} />
      <text
        x={spec.caption.x}
        y={spec.caption.y}
        textAnchor="middle"
        fontFamily="var(--font-mono-ai)"
        fontSize="11"
        fill="var(--visual-violet)"
      >
        {spec.caption.copy}
      </text>
    </svg>
  );
}

export default function ModelEncodingAtlas({
  compact = false,
}: PresentationAwareProps = {}) {
  const pulseIdRef = useRef(0);
  const phaseIndexRef = useRef(0);
  const [activePulses, setActivePulses] = useState<ActivePulse[]>([]);

  const removePulse = useCallback((id: string) => {
    setActivePulses((current) => current.filter((pulse) => pulse.id !== id));
  }, []);

  useEffect(
    () =>
      startPulseLoop(
        pulseIdRef,
        phaseIndexRef,
        setActivePulses
      ),
    []
  );

  const containerClassName = compact
    ? `${styles.container} ${styles.compact}`
    : styles.container;
  return (
    <div className={containerClassName}>
      <AtlasSvg
        spec={DESKTOP_SPEC}
        className={styles.desktopDiagram}
        viewport="desktop"
        pulses={activePulses}
        onDone={removePulse}
      />
      <AtlasSvg
        spec={MOBILE_SPEC}
        className={styles.mobileDiagram}
        viewport="mobile"
        pulses={activePulses.slice(-MOBILE_ACTIVE_PULSES)}
        onDone={removePulse}
      />
    </div>
  );
}

function startPulseLoop(
  pulseIdRef: React.MutableRefObject<number>,
  phaseIndexRef: React.MutableRefObject<number>,
  setActivePulses: React.Dispatch<React.SetStateAction<ActivePulse[]>>
) {
  if (shouldReduceMotion()) return undefined;
  let stopped = false;
  let timer: number;
  const spawnPulses = () => {
    const phase = PHASE_SEQUENCE[phaseIndexRef.current];
    phaseIndexRef.current = (phaseIndexRef.current + 1) % PHASE_SEQUENCE.length;
    setActivePulses((current) =>
      [...current, ...makePulseBatch(pulseIdRef, phase)].slice(
        -MAX_ACTIVE_PULSES
      )
    );
    if (!stopped) timer = window.setTimeout(spawnPulses, randomInt(460, 820));
  };
  timer = window.setTimeout(spawnPulses, 200);
  return () => {
    stopped = true;
    window.clearTimeout(timer);
  };
}

function makePulseBatch(
  pulseIdRef: React.MutableRefObject<number>,
  phase: PhaseId
) {
  const edgeIds = PHASE_EDGES[phase];
  return Array.from({ length: randomInt(2, 3) }, () => {
    const id = `pulse-${pulseIdRef.current}`;
    pulseIdRef.current += 1;
    return makePulse(id, edgeIds[randomInt(0, edgeIds.length - 1)], phase);
  });
}
