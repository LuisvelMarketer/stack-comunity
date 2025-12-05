import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Send, MessageSquare, SmilePlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👏"];

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_name: string | null;
  user_avatar: string | null;
}

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

interface CommunityChatProps {
  communityId: string;
}

export const CommunityChat = ({ communityId }: CommunityChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [reactions, setReactions] = useState<Record<string, Reaction[]>>({});
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel(`community-chat-${communityId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "community_messages",
          filter: `community_id=eq.${communityId}`,
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", payload.new.user_id)
            .single();

          const newMsg: Message = {
            id: payload.new.id as string,
            content: payload.new.content as string,
            created_at: payload.new.created_at as string,
            user_id: payload.new.user_id as string,
            user_name: profile?.full_name || null,
            user_avatar: profile?.avatar_url || null,
          };

          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "community_messages",
          filter: `community_id=eq.${communityId}`,
        },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "message_reactions",
        },
        () => {
          // Reload reactions when any change occurs
          loadReactions(messages.map((m) => m.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId]);

  useEffect(() => {
    if (messages.length > 0) {
      loadReactions(messages.map((m) => m.id));
    }
  }, [messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    try {
      const { data: messagesData, error } = await supabase
        .from("community_messages")
        .select("id, content, created_at, user_id")
        .eq("community_id", communityId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;

      if (!messagesData || messagesData.length === 0) {
        setMessages([]);
        setLoading(false);
        return;
      }

      const userIds = [...new Set(messagesData.map((m) => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      const formattedMessages: Message[] = messagesData.map((m) => ({
        id: m.id,
        content: m.content,
        created_at: m.created_at,
        user_id: m.user_id,
        user_name: profileMap.get(m.user_id)?.full_name || null,
        user_avatar: profileMap.get(m.user_id)?.avatar_url || null,
      }));

      setMessages(formattedMessages);
      await loadReactions(formattedMessages.map((m) => m.id));
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadReactions = async (messageIds: string[]) => {
    if (messageIds.length === 0) return;

    try {
      const { data, error } = await supabase
        .from("message_reactions")
        .select("message_id, emoji, user_id")
        .in("message_id", messageIds);

      if (error) throw error;

      const reactionMap: Record<string, Reaction[]> = {};

      messageIds.forEach((id) => {
        reactionMap[id] = [];
      });

      if (data) {
        const groupedByMessage: Record<string, Record<string, string[]>> = {};

        data.forEach((r) => {
          if (!groupedByMessage[r.message_id]) {
            groupedByMessage[r.message_id] = {};
          }
          if (!groupedByMessage[r.message_id][r.emoji]) {
            groupedByMessage[r.message_id][r.emoji] = [];
          }
          groupedByMessage[r.message_id][r.emoji].push(r.user_id);
        });

        Object.entries(groupedByMessage).forEach(([messageId, emojis]) => {
          reactionMap[messageId] = Object.entries(emojis).map(([emoji, users]) => ({
            emoji,
            count: users.length,
            users,
            hasReacted: user ? users.includes(user.id) : false,
          }));
        });
      }

      setReactions(reactionMap);
    } catch (error) {
      console.error("Error loading reactions:", error);
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    const messageReactions = reactions[messageId] || [];
    const existingReaction = messageReactions.find((r) => r.emoji === emoji);
    const hasReacted = existingReaction?.hasReacted;

    try {
      if (hasReacted) {
        await supabase
          .from("message_reactions")
          .delete()
          .eq("message_id", messageId)
          .eq("user_id", user.id)
          .eq("emoji", emoji);
      } else {
        await supabase.from("message_reactions").insert({
          message_id: messageId,
          user_id: user.id,
          emoji,
        });
      }

      // Optimistic update
      setReactions((prev) => {
        const current = prev[messageId] || [];
        if (hasReacted) {
          return {
            ...prev,
            [messageId]: current
              .map((r) =>
                r.emoji === emoji
                  ? {
                      ...r,
                      count: r.count - 1,
                      users: r.users.filter((u) => u !== user.id),
                      hasReacted: false,
                    }
                  : r
              )
              .filter((r) => r.count > 0),
          };
        } else {
          const existing = current.find((r) => r.emoji === emoji);
          if (existing) {
            return {
              ...prev,
              [messageId]: current.map((r) =>
                r.emoji === emoji
                  ? {
                      ...r,
                      count: r.count + 1,
                      users: [...r.users, user.id],
                      hasReacted: true,
                    }
                  : r
              ),
            };
          } else {
            return {
              ...prev,
              [messageId]: [
                ...current,
                { emoji, count: 1, users: [user.id], hasReacted: true },
              ],
            };
          }
        }
      });
    } catch (error) {
      console.error("Error toggling reaction:", error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    try {
      const { error } = await supabase.from("community_messages").insert({
        community_id: communityId,
        user_id: user.id,
        content: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage("");
      inputRef.current?.focus();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (name) {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return "U";
  };

  const isOwnMessage = (message: Message) => message.user_id === user?.id;

  if (loading) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </Card>
    );
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Chat de la Comunidad
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea ref={scrollRef} className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
              <p>No hay mensajes aún</p>
              <p className="text-sm">¡Sé el primero en escribir!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwnMessage(message) ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    {message.user_avatar && (
                      <AvatarImage src={message.user_avatar} />
                    )}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(message.user_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`flex flex-col max-w-[70%] ${
                      isOwnMessage(message) ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {message.user_name || "Usuario"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                    </div>
                    <div className="group relative">
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isOwnMessage(message)
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-muted rounded-tl-sm"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>

                      {/* Reactions display */}
                      {reactions[message.id]?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {reactions[message.id].map((reaction) => (
                            <button
                              key={reaction.emoji}
                              onClick={() => toggleReaction(message.id, reaction.emoji)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                                reaction.hasReacted
                                  ? "bg-primary/20 border border-primary/30"
                                  : "bg-muted hover:bg-muted/80"
                              }`}
                            >
                              <span>{reaction.emoji}</span>
                              <span className="text-muted-foreground">{reaction.count}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Add reaction button */}
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className={`absolute -bottom-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-card border shadow-sm hover:bg-muted ${
                              isOwnMessage(message) ? "left-0" : "right-0"
                            }`}
                          >
                            <SmilePlus className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2" side="top">
                          <div className="flex gap-1">
                            {EMOJI_OPTIONS.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => toggleReaction(message.id, emoji)}
                                className="p-1.5 hover:bg-muted rounded transition-colors text-lg"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};