import InlineEmojiImage from './InlineEmojiImage';
import { EMOJI } from './emojiAssets';

export default function RobotEmoji({ size = 32 }: { size?: number }) {
  return <InlineEmojiImage asset={EMOJI.agent} size={size} />;
}
