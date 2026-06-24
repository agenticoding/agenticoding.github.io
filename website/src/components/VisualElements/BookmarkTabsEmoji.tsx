import InlineEmojiImage from './InlineEmojiImage';
import { EMOJI } from './emojiAssets';

export default function BookmarkTabsEmoji({ size = 32 }: { size?: number }) {
  return <InlineEmojiImage asset={EMOJI.bookmarkTabs} size={size} className="idle-bookmark-tab" />;
}
