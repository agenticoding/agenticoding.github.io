import {useEffect, useRef, type ReactNode} from 'react';
import { useThemeConfig } from '@docusaurus/theme-common';
import type { Props } from '@theme/AnnouncementBar/Content';
import InlineEmojiImage from '@site/src/components/VisualElements/InlineEmojiImage';
import { EMOJI } from '@site/src/components/VisualElements/emojiAssets';

export default function AnnouncementBarContent({
  className,
  ...props
}: Props): ReactNode {
  const { announcementBar } = useThemeConfig();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = contentRef.current?.parentElement;
    if (!bar) return;

    const updateHeight = () => {
      document.documentElement.style.setProperty(
        '--announcement-height',
        `${bar.getBoundingClientRect().height}px`,
      );
    };

    updateHeight();
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(updateHeight);
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={contentRef} {...props} className={className}>
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
