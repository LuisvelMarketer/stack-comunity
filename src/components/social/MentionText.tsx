import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface MentionTextProps {
  content: string;
  className?: string;
}

interface UserMatch {
  id: string;
  full_name: string;
}

export const MentionText = ({ content, className }: MentionTextProps) => {
  const [userMap, setUserMap] = useState<Map<string, string>>(new Map());
  
  useEffect(() => {
    const fetchMentionedUsers = async () => {
      // Extract all mentions from content
      const mentionRegex = /@([a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ\s]+?)(?=\s|$|[.,!?;:])/g;
      const mentions: string[] = [];
      let match;
      
      while ((match = mentionRegex.exec(content)) !== null) {
        mentions.push(match[1].trim());
      }
      
      if (mentions.length === 0) return;
      
      // Fetch users by name
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("full_name", mentions);
      
      if (data) {
        const map = new Map<string, string>();
        data.forEach((user: UserMatch) => {
          if (user.full_name) {
            map.set(user.full_name.toLowerCase(), user.id);
          }
        });
        setUserMap(map);
      }
    };
    
    fetchMentionedUsers();
  }, [content]);

  // Regex to find @mentions
  const mentionRegex = /@([a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ\s]+?)(?=\s|$|[.,!?;:])/g;
  
  const parts: { text: string; isMention: boolean; username: string }[] = [];
  let lastIndex = 0;
  let regexMatch;

  while ((regexMatch = mentionRegex.exec(content)) !== null) {
    if (regexMatch.index > lastIndex) {
      parts.push({
        text: content.slice(lastIndex, regexMatch.index),
        isMention: false,
        username: "",
      });
    }
    
    parts.push({
      text: regexMatch[0],
      isMention: true,
      username: regexMatch[1].trim(),
    });
    
    lastIndex = regexMatch.index + regexMatch[0].length;
  }
  
  if (lastIndex < content.length) {
    parts.push({
      text: content.slice(lastIndex),
      isMention: false,
      username: "",
    });
  }

  if (parts.length === 0) {
    return <span className={className}>{content}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {part.isMention ? (
            (() => {
              const userId = userMap.get(part.username.toLowerCase());
              if (userId) {
                return (
                  <Link
                    to={`/profile/${userId}`}
                    className="text-primary font-medium bg-primary/10 px-1 rounded hover:bg-primary/20 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {part.text}
                  </Link>
                );
              }
              return (
                <span className="text-primary font-medium bg-primary/10 px-1 rounded">
                  {part.text}
                </span>
              );
            })()
          ) : (
            part.text
          )}
        </Fragment>
      ))}
    </span>
  );
};
