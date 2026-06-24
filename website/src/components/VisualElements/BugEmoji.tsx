import InlineEmojiImage from './InlineEmojiImage';
import { EMOJI } from './emojiAssets';

export default function BugEmoji({ size = 32 }: { size?: number }) {
  return <InlineEmojiImage asset={EMOJI.bug} size={size} className="idle-bug-legs-a" />;
}
