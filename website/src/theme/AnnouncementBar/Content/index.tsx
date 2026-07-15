import type { ReactNode } from 'react';
import { useThemeConfig } from '@docusaurus/theme-common';
import type { Props } from '@theme/AnnouncementBar/Content';
import InlineEmojiImage from '@site/src/components/VisualElements/InlineEmojiImage';
import { EMOJI } from '@site/src/components/VisualElements/emojiAssets';

export default function AnnouncementBarContent({
  className,
  ...props
}: Props): ReactNode {
  const { announcementBar } = useThemeConfig();

  return (
    <div {...props} className={className}>
      <InlineEmojiImage
        asset={EMOJI.construction}
        size={16}
        className="announcement-status-icon"
      />
      <span className="announcement-status-label">UNDER CONSTRUCTION</span>
      <span className="announcement-status-detail">
        {announcementBar?.content}
      </span>
    </div>
  );
}
