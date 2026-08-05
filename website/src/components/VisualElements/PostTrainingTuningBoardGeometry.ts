const CONNECTOR_TARGET_GAP = 8;

export type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function coord(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function horizontalConnector(from: Box, to: Box) {
  const startX = from.x + from.width;
  const endX = to.x - CONNECTOR_TARGET_GAP;
  const y = from.y + from.height / 2;
  return `M ${coord(startX)} ${coord(y)} H ${coord(endX)}`;
}

export function verticalConnector(from: Box, to: Box) {
  const startY = from.y + from.height;
  const x = from.x + from.width / 2;
  return `M ${coord(x)} ${coord(startY)} V ${coord(to.y)}`;
}
