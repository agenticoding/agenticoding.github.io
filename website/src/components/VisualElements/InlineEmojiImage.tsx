import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { emojiDisplaySize, type EmojiAsset, emojiSrc } from './emojiAssets';

interface Props {
  asset: EmojiAsset;
  size?: number;
  className?: string;
}

export default function InlineEmojiImage({ asset, size = 32, className }: Props) {
  const base = useBaseUrl('/img/emoji');
  const displaySize = emojiDisplaySize(size);
  return (
    <img
      src={emojiSrc(base, asset)}
      alt=""
      aria-hidden="true"
      className={className}
      width={displaySize}
      height={displaySize}
      style={{ display: 'inline-block', verticalAlign: '-0.2em' }}
    />
  );
}
