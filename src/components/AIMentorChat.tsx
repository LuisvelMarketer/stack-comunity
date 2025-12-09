import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Send, X, Loader2, Sparkles, MessageCircle, Plus, History, Trash2, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  course_id: string | null;
  module_id: string | null;
  created_at: string;
  updated_at: string;
}

interface AIMentorChatProps {
  courseId?: string;
  moduleId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-mentor-chat`;

export const AIMentorChat: React.FC<AIMentorChatProps> = ({
  courseId,
  moduleId,
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load conversations list
  const loadConversations = useCallback(async () => {
    if (!user) return;
    
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('ai_mentor_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoadingHistory(false);
    }
  }, [user]);

  // Load messages for a conversation
  const loadConversation = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ai_mentor_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data?.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })) || []);
      setCurrentConversationId(conversationId);
      setShowHistory(false);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  }, [user]);

  // Create new conversation
  const createConversation = useCallback(async (firstMessage: string): Promise<string | null> => {
    if (!user) return null;

    try {
      const title = firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : '');
      
      const { data, error } = await supabase
        .from('ai_mentor_conversations')
        .insert({
          user_id: user.id,
          title,
          course_id: courseId || null,
          module_id: moduleId || null
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }, [user, courseId, moduleId]);

  // Save message to database
  const saveMessage = useCallback(async (conversationId: string, role: 'user' | 'assistant', content: string) => {
    try {
      await supabase
        .from('ai_mentor_messages')
        .insert({
          conversation_id: conversationId,
          role,
          content
        });

      // Update conversation timestamp
      await supabase
        .from('ai_mentor_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }, []);

  // Delete conversation
  const deleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      await supabase
        .from('ai_mentor_conversations')
        .delete()
        .eq('id', conversationId);

      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (currentConversationId === conversationId) {
        startNewChat();
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  // Start new chat
  const startNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setShowHistory(false);
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      loadConversations();
    }
  }, [isOpen, loadConversations]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !user) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    let conversationId = currentConversationId;
    let assistantContent = '';

    try {
      // Create conversation if needed
      if (!conversationId) {
        conversationId = await createConversation(userMessage.content);
        if (!conversationId) throw new Error('Failed to create conversation');
        setCurrentConversationId(conversationId);
      }

      // Save user message
      await saveMessage(conversationId, 'user', userMessage.content);

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          user_id: user.id,
          course_id: courseId,
          module_id: moduleId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al enviar mensaje');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage?.role === 'assistant') {
                  lastMessage.content = assistantContent;
                }
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Save assistant message
      if (conversationId && assistantContent) {
        await saveMessage(conversationId, 'assistant', assistantContent);
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev.filter(m => m.content !== ''),
        { 
          role: 'assistant', 
          content: `Lo siento, hubo un error: ${error instanceof Error ? error.message : 'Error desconocido'}. Por favor, intenta de nuevo.` 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-[420px] h-[600px] shadow-2xl z-50 flex flex-col border-primary/20">
      <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between py-3 px-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <div className="flex items-center gap-2">
          {showHistory ? (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowHistory(false)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : (
            <div className="p-1.5 bg-primary rounded-lg">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
          <CardTitle className="text-base font-semibold">
            {showHistory ? 'Historial' : 'AI Mentor'}
          </CardTitle>
        </div>
        <div className="flex items-center gap-1">
          {!showHistory && (
            <>
              <Button variant="ghost" size="icon" onClick={startNewChat} className="h-8 w-8" title="Nueva conversación">
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => { setShowHistory(true); loadConversations(); }} className="h-8 w-8" title="Historial">
                <History className="h-4 w-4" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {showHistory ? (
          <ScrollArea className="flex-1 p-4">
            {loadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                <History className="h-12 w-12 mb-4 text-muted-foreground/50" />
                <p className="text-sm">No tienes conversaciones anteriores</p>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer hover:bg-muted/80 transition-colors group",
                      currentConversationId === conv.id ? 'bg-muted' : 'bg-muted/40'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{conv.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true, locale: es })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => deleteConversation(conv.id, e)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        ) : (
          <>
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                  <Bot className="h-12 w-12 mb-4 text-primary/50" />
                  <p className="font-medium text-foreground mb-2">¡Hola! Soy tu AI Mentor</p>
                  <p className="text-sm">
                    Pregúntame cualquier cosa sobre el curso, código, o conceptos de programación.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {['¿Cómo funciona React?', '¿Qué es una API?', 'Explica async/await'].map((suggestion) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setInput(suggestion);
                          inputRef.current?.focus();
                        }}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex gap-2",
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        )}
                      >
                        {message.role === 'assistant' ? (
                          <MarkdownRenderer content={message.content || '...'} />
                        ) : (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && messages[messages.length - 1]?.content === '' && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Pensando...</span>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            <div className="flex-shrink-0 p-3 border-t bg-background">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe tu pregunta..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!input.trim() || isLoading}
                  size="icon"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Floating button to open chat
export const AIMentorChatButton: React.FC<{
  onClick: () => void;
  unreadCount?: number;
}> = ({ onClick, unreadCount = 0 }) => {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-40 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
    >
      <MessageCircle className="h-6 w-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </Button>
  );
};
