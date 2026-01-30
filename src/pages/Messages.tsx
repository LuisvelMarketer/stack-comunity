import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageSquare, Search } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { MessageBubble } from "@/components/messages/MessageBubble";
import { ConversationItem } from "@/components/messages/ConversationItem";
import { TypingIndicator } from "@/components/messages/TypingIndicator";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";

interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  updated_at: string;
  other_user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  last_message?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  reactions?: Array<{
    emoji: string;
    count: number;
    users: string[];
    hasReacted: boolean;
  }>;
}

interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

export default function Messages() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isOtherUserTyping, setTyping } = useTypingIndicator(conversationId);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
      fetchReactions(conversationId);
      const conv = conversations.find(c => c.id === conversationId);
      setSelectedConversation(conv || null);
    }
  }, [conversationId, conversations]);

  // Realtime messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages(prev => [...prev, { ...payload.new as Message, reactions: [] }]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dm_reactions'
        },
        () => {
          fetchReactions(conversationId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .or(`participant_1.eq.${user?.id},participant_2.eq.${user?.id}`)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const conversationsWithUsers = await Promise.all(
        (data || []).map(async (conv) => {
          const otherUserId = conv.participant_1 === user?.id ? conv.participant_2 : conv.participant_1;
          
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .eq("id", otherUserId)
            .single();

          const { data: lastMsg } = await supabase
            .from("direct_messages")
            .select("content")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          const { count } = await supabase
            .from("direct_messages")
            .select("*", { count: 'exact', head: true })
            .eq("conversation_id", conv.id)
            .eq("read", false)
            .neq("sender_id", user?.id);

          return {
            ...conv,
            other_user: profileData,
            last_message: lastMsg?.content,
            unread_count: count || 0
          };
        })
      );

      setConversations(conversationsWithUsers);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from("direct_messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages((data || []).map(m => ({ ...m, reactions: [] })));

      // Mark messages as read
      await supabase
        .from("direct_messages")
        .update({ read: true, read_at: new Date().toISOString() })
        .eq("conversation_id", convId)
        .neq("sender_id", user?.id);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const fetchReactions = async (convId: string) => {
    try {
      // Get all message IDs for this conversation
      const { data: messageIds } = await supabase
        .from("direct_messages")
        .select("id")
        .eq("conversation_id", convId);

      if (!messageIds?.length) return;

      const { data: reactionsData } = await supabase
        .from("dm_reactions")
        .select("*")
        .in("message_id", messageIds.map(m => m.id));

      setReactions(reactionsData || []);
    } catch (error) {
      console.error("Error fetching reactions:", error);
    }
  };

  const getMessageReactions = useCallback((messageId: string) => {
    const messageReactions = reactions.filter(r => r.message_id === messageId);
    const grouped: { [key: string]: { count: number; users: string[] } } = {};
    
    messageReactions.forEach(r => {
      if (!grouped[r.emoji]) {
        grouped[r.emoji] = { count: 0, users: [] };
      }
      grouped[r.emoji].count++;
      grouped[r.emoji].users.push(r.user_id);
    });

    return Object.entries(grouped).map(([emoji, data]) => ({
      emoji,
      count: data.count,
      users: data.users,
      hasReacted: data.users.includes(user?.id || '')
    }));
  }, [reactions, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (e.target.value) {
      setTyping(true);
    } else {
      setTyping(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || !user) return;

    setTyping(false);
    setSending(true);
    try {
      const { error } = await supabase
        .from("direct_messages")
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: newMessage.trim()
        });

      if (error) throw error;

      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.other_user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (!user) return null;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">Mensajes</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
          {/* Conversations List */}
          <Card className="md:col-span-1 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="h-5 w-5" />
                Conversaciones
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar conversación..."
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                {loading ? (
                  <div className="p-4 text-center text-muted-foreground">Cargando...</div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {searchQuery ? "Sin resultados" : "No tienes conversaciones"}
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      id={conv.id}
                      otherUser={conv.other_user || null}
                      lastMessage={conv.last_message}
                      updatedAt={conv.updated_at}
                      unreadCount={conv.unread_count}
                      isSelected={conversationId === conv.id}
                      onClick={() => navigate(`/messages/${conv.id}`)}
                    />
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="md:col-span-2 flex flex-col">
            {conversationId && selectedConversation ? (
              <>
                <CardHeader className="border-b py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        {selectedConversation.other_user?.avatar_url && (
                          <AvatarImage src={selectedConversation.other_user.avatar_url} />
                        )}
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(selectedConversation.other_user?.full_name || null)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">
                        {selectedConversation.other_user?.full_name || "Usuario"}
                      </CardTitle>
                      {isOtherUserTyping && (
                        <span className="text-xs text-primary">Escribiendo...</span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <MessageBubble
                          key={message.id}
                          id={message.id}
                          content={message.content}
                          senderId={message.sender_id}
                          isOwnMessage={message.sender_id === user.id}
                          createdAt={message.created_at}
                          read={message.read}
                          reactions={getMessageReactions(message.id)}
                          onReactionToggle={() => fetchReactions(conversationId)}
                        />
                      ))}
                      {isOtherUserTyping && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                            <TypingIndicator />
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  <form onSubmit={sendMessage} className="p-4 border-t flex gap-2 bg-card/50">
                    <Input
                      value={newMessage}
                      onChange={handleInputChange}
                      placeholder="Escribe un mensaje..."
                      disabled={sending}
                      className="flex-1"
                    />
                    <Button 
                      type="submit" 
                      disabled={sending || !newMessage.trim()}
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">
                    Selecciona una conversación para ver los mensajes
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
