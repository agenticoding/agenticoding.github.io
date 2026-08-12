import clsx from 'clsx';
import useBaseUrl from '@docusaurus/useBaseUrl';

import styles from './ToolMark.module.css';

type ToolMarkProps = {
  // Site-relative path to the official mark, e.g. `/img/terminal-logos/ghostty.svg`.
  src: string;
  // Luminance masking for opaque official app-icon compositions: preserves
  // their bright foreground geometry instead of flattening every filled layer.
  luminance?: boolean;
  // Direct rendering preserves official compound/app-icon layer relationships.
  mode?: 'mask' | 'image';
  // Brightens a dark app-icon foreground without restoring its brand hue.
  imageTone?: 'standard' | 'foreground';
  // Replaces rasterized app-icon edging with a theme-colored CSS outline.
  imageFrame?: boolean;
  // Dark-theme presentation for official artwork drawn in dark tones:
  // 'lift' raises mid-tone bodies above the dark tile.
  darkImageTone?: 'lift';
  // Optional asset with colors selected for the dark theme.
  darkSrc?: string;
};

// Neutral 48px tile rendering an official tool logo. Decorative only: the
// adjacent heading text stays the accessible name.
export default function ToolMark({
  src,
  luminance = false,
  mode = 'mask',
  imageTone = 'standard',
  imageFrame = false,
  darkImageTone,
  darkSrc,
}: ToolMarkProps) {
  const url = useBaseUrl(src);
  const darkUrl = useBaseUrl(darkSrc ?? src);
  const imageClass = clsx(
    imageTone === 'foreground' && styles.imageForeground,
    imageFrame && styles.imageFrame,
    darkImageTone === 'lift' && styles.imageDarkLift
  );
  return (
    <span
      aria-hidden="true"
      className={clsx(styles.frame, darkSrc && styles.withDarkImage)}
    >
      {mode === 'image' ? (
        <>
          <img className={clsx(styles.image, imageClass)} src={url} alt="" />
          {darkSrc && (
            <img
              className={clsx(styles.darkImage, imageClass)}
              src={darkUrl}
              alt=""
            />
          )}
        </>
      ) : (
        <span
          className={clsx(styles.mark, luminance && styles.luminance)}
          style={{
            maskImage: `url('${url}')`,
            WebkitMaskImage: `url('${url}')`,
          }}
        />
      )}
    </span>
  );
}
