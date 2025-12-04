import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export const MentionInput = ({
  value,
  onChange,
  placeholder,
  className,
  minHeight = "100px",
}: MentionInputProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const findMentionQuery = useCallback((text: string, cursor: number) => {
    const textBeforeCursor = text.slice(0, cursor);
    const atIndex = textBeforeCursor.lastIndexOf("@");
    
    if (atIndex === -1) return null;
    
    const textAfterAt = textBeforeCursor.slice(atIndex + 1);
    // Check if there's a space before @ or @ is at the start
    const charBeforeAt = atIndex > 0 ? textBeforeCursor[atIndex - 1] : " ";
    
    if (charBeforeAt !== " " && charBeforeAt !== "\n" && atIndex !== 0) {
      return null;
    }
    
    // Check if there's no space in the mention query
    if (textAfterAt.includes(" ") || textAfterAt.includes("\n")) {
      return null;
    }
    
    return { query: textAfterAt, startIndex: atIndex };
  }, []);

  const searchUsers = useCallback(async (query: string) => {
    if (!query) {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .not("full_name", "is", null)
        .limit(5);
      
      setSuggestions(data || []);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .ilike("full_name", `%${query}%`)
      .limit(5);

    setSuggestions(data || []);
  }, []);

  useEffect(() => {
    const mention = findMentionQuery(value, cursorPosition);
    
    if (mention !== null) {
      setMentionQuery(mention.query);
      setShowSuggestions(true);
      searchUsers(mention.query);
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [value, cursorPosition, findMentionQuery, searchUsers]);

  const insertMention = (user: User) => {
    const mention = findMentionQuery(value, cursorPosition);
    if (!mention || !user.full_name) return;

    const beforeMention = value.slice(0, mention.startIndex);
    const afterCursor = value.slice(cursorPosition);
    const newValue = `${beforeMention}@${user.full_name} ${afterCursor}`;
    
    onChange(newValue);
    setShowSuggestions(false);
    
    // Focus back to textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = mention.startIndex + user.full_name.length + 2;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && showSuggestions) {
      e.preventDefault();
      insertMention(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    setCursorPosition((e.target as HTMLTextAreaElement).selectionStart);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative w-full">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onSelect={handleSelect}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(`min-h-[${minHeight}] resize-none`, className)}
        style={{ minHeight }}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-64 bg-popover border border-border rounded-md shadow-lg overflow-hidden"
        >
          {suggestions.map((user, index) => (
            <button
              key={user.id}
              type="button"
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted transition-colors",
                index === selectedIndex && "bg-muted"
              )}
              onClick={() => insertMention(user)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.avatar_url || ""} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm truncate">{user.full_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
