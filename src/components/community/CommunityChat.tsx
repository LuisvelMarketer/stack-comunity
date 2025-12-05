import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Send, MessageSquare, SmilePlus, Reply, X, Paperclip, FileText, Loader2, Mic, Square, Pencil, Trash2 } from "lucide-react";
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
  reply_to_id: string | null;
  file_url: string | null;
  file_type: string | null;
  file_name: string | null;
  reply_to?: {
    content: string;
    user_name: string | null;
  } | null;
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
  const [uploading, setUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

          let replyTo = null;
          if (payload.new.reply_to_id) {
            const existingMsg = messages.find((m) => m.id === payload.new.reply_to_id);
            if (existingMsg) {
              replyTo = {
                content: existingMsg.content,
                user_name: existingMsg.user_name,
              };
            }
          }

          const newMsg: Message = {
            id: payload.new.id as string,
            content: payload.new.content as string,
            created_at: payload.new.created_at as string,
            user_id: payload.new.user_id as string,
            user_name: profile?.full_name || null,
            user_avatar: profile?.avatar_url || null,
            reply_to_id: (payload.new.reply_to_id as string) || null,
            file_url: (payload.new.file_url as string) || null,
            file_type: (payload.new.file_type as string) || null,
            file_name: (payload.new.file_name as string) || null,
            reply_to: replyTo,
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

  useEffect(() => {
    if (replyingTo) {
      inputRef.current?.focus();
    }
  }, [replyingTo]);

  const loadMessages = async () => {
    try {
      const { data: messagesData, error } = await supabase
        .from("community_messages")
        .select("id, content, created_at, user_id, reply_to_id, file_url, file_type, file_name")
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

      const messageMap = new Map<string, Message>();
      messagesData.forEach((m) => {
        messageMap.set(m.id, {
          id: m.id,
          content: m.content,
          created_at: m.created_at,
          user_id: m.user_id,
          user_name: profileMap.get(m.user_id)?.full_name || null,
          user_avatar: profileMap.get(m.user_id)?.avatar_url || null,
          reply_to_id: m.reply_to_id,
          file_url: m.file_url,
          file_type: m.file_type,
          file_name: m.file_name,
          reply_to: null,
        });
      });

      const formattedMessages: Message[] = messagesData.map((m) => {
        const msg = messageMap.get(m.id)!;
        if (m.reply_to_id) {
          const replyMsg = messageMap.get(m.reply_to_id);
          if (replyMsg) {
            msg.reply_to = {
              content: replyMsg.content,
              user_name: replyMsg.user_name,
            };
          }
        }
        return msg;
      });

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

      setReactions((prev) => {
        const current = prev[messageId] || [];
        if (hasReacted) {
          return {
            ...prev,
            [messageId]: current
              .map((r) =>
                r.emoji === emoji
                  ? { ...r, count: r.count - 1, users: r.users.filter((u) => u !== user.id), hasReacted: false }
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
                  ? { ...r, count: r.count + 1, users: [...r.users, user.id], hasReacted: true }
                  : r
              ),
            };
          } else {
            return {
              ...prev,
              [messageId]: [...current, { emoji, count: 1, users: [user.id], hasReacted: true }],
            };
          }
        }
      });
    } catch (error) {
      console.error("Error toggling reaction:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("El archivo es muy grande. Máximo 10MB.");
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const clearAudio = () => {
    setAudioBlob(null);
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl(null);
    }
    setRecordingTime(0);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("No se pudo acceder al micrófono. Verifica los permisos.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const uploadFile = async (file: File | Blob, customName?: string): Promise<{ url: string; type: string; name: string } | null> => {
    if (!user) return null;

    const isBlob = file instanceof Blob && !(file instanceof File);
    const fileExt = isBlob ? "webm" : (file as File).name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const displayName = customName || (isBlob ? `audio_${Date.now()}.webm` : (file as File).name);

    const { error } = await supabase.storage.from("chat-files").upload(fileName, file);

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(fileName);

    let type = "file";
    if (isBlob || (file instanceof File && file.type.startsWith("audio/"))) {
      type = "audio";
    } else if (file instanceof File && file.type.startsWith("image/")) {
      type = "image";
    }

    return {
      url: urlData.publicUrl,
      type,
      name: displayName,
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile && !audioBlob) || !user || sending) return;

    setSending(true);
    setUploading(!!(selectedFile || audioBlob));

    try {
      let fileData = null;
      if (audioBlob) {
        fileData = await uploadFile(audioBlob, `audio_${Date.now()}.webm`);
      } else if (selectedFile) {
        fileData = await uploadFile(selectedFile);
      }

      const { error } = await supabase.from("community_messages").insert({
        community_id: communityId,
        user_id: user.id,
        content: newMessage.trim() || (fileData ? (fileData.type === "audio" ? "🎤 Mensaje de voz" : fileData.name) : ""),
        reply_to_id: replyingTo?.id || null,
        file_url: fileData?.url || null,
        file_type: fileData?.type || null,
        file_name: fileData?.name || null,
      });

      if (error) throw error;

      setNewMessage("");
      setReplyingTo(null);
      clearFile();
      clearAudio();
      inputRef.current?.focus();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (name) {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return "U";
  };

  const isOwnMessage = (message: Message) => message.user_id === user?.id;

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  const isImageFile = (type: string | null) => type === "image";
  const isAudioFile = (type: string | null) => type === "audio";

  const deleteMessage = async (messageId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este mensaje?")) return;
    
    try {
      const { error } = await supabase
        .from("community_messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const startEditing = (message: Message) => {
    setEditingMessage(message);
    setEditContent(message.content);
  };

  const cancelEditing = () => {
    setEditingMessage(null);
    setEditContent("");
  };

  const saveEdit = async () => {
    if (!editingMessage || !editContent.trim()) return;

    try {
      const { error } = await supabase
        .from("community_messages")
        .update({ content: editContent.trim() })
        .eq("id", editingMessage.id);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === editingMessage.id ? { ...m, content: editContent.trim() } : m
        )
      );
      cancelEditing();
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

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
                    {message.user_avatar && <AvatarImage src={message.user_avatar} />}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getInitials(message.user_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col max-w-[70%] ${isOwnMessage(message) ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{message.user_name || "Usuario"}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                    <div className="group relative">
                      {message.reply_to && (
                        <div className={`mb-1 px-3 py-1.5 rounded-lg border-l-2 border-primary/50 bg-muted/50 text-xs ${isOwnMessage(message) ? "text-right" : "text-left"}`}>
                          <span className="font-medium text-primary/70">{message.reply_to.user_name || "Usuario"}</span>
                          <p className="text-muted-foreground truncate">{truncateText(message.reply_to.content)}</p>
                        </div>
                      )}

                      <div className={`rounded-2xl overflow-hidden ${isOwnMessage(message) ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm"}`}>
                        {message.file_url && isImageFile(message.file_type) && (
                          <a href={message.file_url} target="_blank" rel="noopener noreferrer">
                            <img src={message.file_url} alt={message.file_name || "imagen"} className="max-w-full max-h-64 object-cover" />
                          </a>
                        )}
                        {message.file_url && isAudioFile(message.file_type) && (
                          <div className="px-4 py-3 flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isOwnMessage(message) ? "bg-primary-foreground/20" : "bg-primary/20"}`}>
                              <Mic className="h-4 w-4" />
                            </div>
                            <audio controls className="h-8 max-w-[200px]" src={message.file_url}>
                              Tu navegador no soporta audio.
                            </audio>
                          </div>
                        )}
                        {message.file_url && !isImageFile(message.file_type) && !isAudioFile(message.file_type) && (
                          <a
                            href={message.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 px-4 py-2 ${isOwnMessage(message) ? "hover:bg-primary-foreground/10" : "hover:bg-muted-foreground/10"}`}
                          >
                            <FileText className="h-5 w-5" />
                            <span className="text-sm underline">{message.file_name}</span>
                          </a>
                        )}
                        {message.content && (!message.file_url || (message.content !== message.file_name && message.content !== "🎤 Mensaje de voz")) && (
                          <p className="text-sm whitespace-pre-wrap break-words px-4 py-2">{message.content}</p>
                        )}
                      </div>

                      {reactions[message.id]?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {reactions[message.id].map((reaction) => (
                            <button
                              key={reaction.emoji}
                              onClick={() => toggleReaction(message.id, reaction.emoji)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${reaction.hasReacted ? "bg-primary/20 border border-primary/30" : "bg-muted hover:bg-muted/80"}`}
                            >
                              <span>{reaction.emoji}</span>
                              <span className="text-muted-foreground">{reaction.count}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className={`absolute -bottom-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ${isOwnMessage(message) ? "left-0" : "right-0"}`}>
                        <button onClick={() => setReplyingTo(message)} className="p-1 rounded-full bg-card border shadow-sm hover:bg-muted" title="Responder">
                          <Reply className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="p-1 rounded-full bg-card border shadow-sm hover:bg-muted">
                              <SmilePlus className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2" side="top">
                            <div className="flex gap-1">
                              {EMOJI_OPTIONS.map((emoji) => (
                                <button key={emoji} onClick={() => toggleReaction(message.id, emoji)} className="p-1.5 hover:bg-muted rounded transition-colors text-lg">
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                        {isOwnMessage(message) && !message.file_url && (
                          <button onClick={() => startEditing(message)} className="p-1 rounded-full bg-card border shadow-sm hover:bg-muted" title="Editar">
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </button>
                        )}
                        {isOwnMessage(message) && (
                          <button onClick={() => deleteMessage(message.id)} className="p-1 rounded-full bg-card border shadow-sm hover:bg-destructive/10 hover:border-destructive/30" title="Eliminar">
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {replyingTo && (
          <div className="px-4 py-2 border-t bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Reply className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Respondiendo a</span>
              <span className="font-medium">{replyingTo.user_name || "Usuario"}</span>
              <span className="text-muted-foreground truncate max-w-[200px]">{truncateText(replyingTo.content, 30)}</span>
            </div>
            <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-muted rounded">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}

        {selectedFile && (
          <div className="px-4 py-2 border-t bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {filePreview ? (
                <img src={filePreview} alt="preview" className="h-12 w-12 object-cover rounded" />
              ) : (
                <div className="h-12 w-12 bg-muted rounded flex items-center justify-center">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <span className="text-sm truncate max-w-[200px]">{selectedFile.name}</span>
            </div>
            <button onClick={clearFile} className="p-1 hover:bg-muted rounded">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}

        {audioBlob && audioPreviewUrl && (
          <div className="px-4 py-2 border-t bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center">
                <Mic className="h-5 w-5 text-primary" />
              </div>
              <audio controls src={audioPreviewUrl} className="h-8 max-w-[200px]" />
            </div>
            <button onClick={clearAudio} className="p-1 hover:bg-muted rounded">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}

        {isRecording && (
          <div className="px-4 py-2 border-t bg-destructive/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-destructive rounded-full animate-pulse" />
              <span className="text-sm font-medium text-destructive">Grabando... {formatTime(recordingTime)}</span>
            </div>
            <Button type="button" variant="destructive" size="sm" onClick={stopRecording}>
              <Square className="h-4 w-4 mr-1" />
              Detener
            </Button>
          </div>
        )}

        {editingMessage && (
          <div className="px-4 py-2 border-t bg-primary/5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm">
              <Pencil className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Editando mensaje</span>
            </div>
            <div className="flex gap-2">
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="flex-1"
                autoFocus
              />
              <Button type="button" size="sm" onClick={saveEdit} disabled={!editContent.trim()}>
                Guardar
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={cancelEditing}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt" />
          <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={sending || isRecording}>
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={isRecording ? "destructive" : "ghost"}
            size="icon"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={sending || !!audioBlob}
          >
            {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={replyingTo ? "Escribe tu respuesta..." : "Escribe un mensaje..."}
            disabled={sending || isRecording}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={sending || isRecording || (!newMessage.trim() && !selectedFile && !audioBlob)}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};