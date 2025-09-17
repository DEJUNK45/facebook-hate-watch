interface EmojiDisplayProps {
  text: string;
  className?: string;
}

const EmojiDisplay = ({ text, className = "" }: EmojiDisplayProps) => {
  // Function to preserve emojis and emoticons in text
  const renderTextWithEmojis = (text: string) => {
    // Split text while preserving emojis and emoticons
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|:\)|:\(|:D|:P|;\)|<3|:\||:-\)|:-\(|:-D|:-P|;-\)|:-\||XD|>:\(|:\'\(|:\*|:-\*|8\)|8-\)|B\)|B-\))/gu;
    
    return text.split(emojiRegex).map((part, index) => {
      if (emojiRegex.test(part)) {
        return (
          <span key={index} className="emoji" style={{ fontSize: '1.1em' }}>
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <span className={className}>
      {renderTextWithEmojis(text)}
    </span>
  );
};

export default EmojiDisplay;