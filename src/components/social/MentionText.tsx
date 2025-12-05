import { Fragment } from "react";

interface MentionTextProps {
  content: string;
  className?: string;
}

export const MentionText = ({ content, className }: MentionTextProps) => {
  // Regex to find @mentions (handles names with spaces and accents)
  const mentionRegex = /@([a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ\s]+?)(?=\s|$|[.,!?;:])/g;
  
  const parts: { text: string; isMention: boolean }[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push({
        text: content.slice(lastIndex, match.index),
        isMention: false,
      });
    }
    
    // Add the mention
    parts.push({
      text: match[0],
      isMention: true,
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after last mention
  if (lastIndex < content.length) {
    parts.push({
      text: content.slice(lastIndex),
      isMention: false,
    });
  }

  // If no mentions found, return plain text
  if (parts.length === 0) {
    return <span className={className}>{content}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {part.isMention ? (
            <span className="text-primary font-medium bg-primary/10 px-1 rounded">
              {part.text}
            </span>
          ) : (
            part.text
          )}
        </Fragment>
      ))}
    </span>
  );
};
