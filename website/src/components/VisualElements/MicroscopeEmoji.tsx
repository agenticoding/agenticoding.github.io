import InlineEmojiImage from './InlineEmojiImage';
import { EMOJI } from './emojiAssets';

export default function MicroscopeEmoji({ size = 32 }: { size?: number }) {
  return <InlineEmojiImage asset={EMOJI.microscope} size={size} className="idle-microscope-rock" />;
}
