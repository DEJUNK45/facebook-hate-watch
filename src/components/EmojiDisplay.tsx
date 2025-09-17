interface EmojiDisplayProps {
  text: string;
  className?: string;
}

const EmojiDisplay = ({ text, className = "" }: EmojiDisplayProps) => {
  // Function to preserve emojis and emoticons in text
  const renderTextWithEmojis = (text: string) => {
    // Simple approach: just render the text as is, emojis will display naturally
    // We'll use a different approach to avoid regex issues
    const parts = [];
    let currentIndex = 0;
    
    // Look for common text emoticons
    const emoticons = [':)', ':(', ':D', ':P', ';)', '<3', ':|', ':-)', ':-(', ':-D', ':-P', ';-)', ':-|', 'XD', '>:(', ":'(", ':*', ':-*', '8)', '8-)', 'B)', 'B-)'];
    
    for (let i = 0; i < text.length; i++) {
      // Check if we have an emoticon starting at this position
      let foundEmoticon = false;
      
      for (const emoticon of emoticons) {
        if (text.substring(i, i + emoticon.length) === emoticon) {
          // Add text before emoticon
          if (i > currentIndex) {
            parts.push(text.substring(currentIndex, i));
          }
          
          // Add emoticon as emoji span
          parts.push(
            <span key={`emoji-${i}`} className="emoji" style={{ fontSize: '1.1em' }}>
              {emoticon}
            </span>
          );
          
          i += emoticon.length - 1; // Skip past the emoticon
          currentIndex = i + 1;
          foundEmoticon = true;
          break;
        }
      }
    }
    
    // Add remaining text
    if (currentIndex < text.length) {
      parts.push(text.substring(currentIndex));
    }
    
    return parts.length > 1 ? parts : text;
  };

  return (
    <span className={className}>
      {renderTextWithEmojis(text)}
    </span>
  );
};

export default EmojiDisplay;