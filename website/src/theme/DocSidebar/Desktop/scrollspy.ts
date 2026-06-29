export type HeadingSnapshot = {
  id: string;
  top: number;
  bottom: number;
};

const READING_OFFSET_PX = 96;

export function resolveActiveHeading({
  headings,
  viewportHeight,
  atPageBottom,
}: {
  headings: readonly HeadingSnapshot[];
  viewportHeight: number;
  atPageBottom: boolean;
}): string {
  if (headings.length === 0) return '';
  if (atPageBottom) return headings[headings.length - 1].id;

  return headingAboveReadingLine(headings, viewportHeight)
    ?? visibleHeading(headings, viewportHeight)
    ?? headings[0].id;
}

function headingAboveReadingLine(headings: readonly HeadingSnapshot[], viewportHeight: number): string | undefined {
  const readingLine = Math.min(READING_OFFSET_PX, viewportHeight / 3);
  for (let index = headings.length - 1; index >= 0; index -= 1) {
    if (headings[index].top <= readingLine) return headings[index].id;
  }
  return undefined;
}

function visibleHeading(headings: readonly HeadingSnapshot[], viewportHeight: number): string | undefined {
  return headings.find(heading => heading.bottom >= 0 && heading.top <= viewportHeight)?.id;
}
