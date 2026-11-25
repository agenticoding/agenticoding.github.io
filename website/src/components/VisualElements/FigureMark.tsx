import { markOf } from './figureMarks.ts';
import styles from './Figure.module.css';
import ToolMark from './ToolMark.tsx';

/**
 * The mark a figure table draws for a lab: its official vector, or — when the
 * lab publishes none — its initial in a neutral tile.
 *
 * WHY the initial: the column is reserved in every row, so a lab with no vector
 * would read as a hole. The letter is not a substitute brand; it is the same
 * fact the row's second line already states, drawn once, so the column keeps one
 * rhythm and no reader mistakes a blank for a loading image. Decorative only:
 * the row's name stays the accessible label.
 */
export function FigureMark({ lab }: { lab: string }) {
  const mark = markOf(lab);
  if (!mark)
    return (
      <span className={styles.markInitial} aria-hidden="true">
        {lab.charAt(0).toUpperCase()}
      </span>
    );

  return (
    <ToolMark
      src={mark.src}
      inline
      luminance={mark.luminance}
      mode={mark.mode}
      imageTone={mark.imageTone}
      darkImageTone={mark.darkImageTone}
    />
  );
}
