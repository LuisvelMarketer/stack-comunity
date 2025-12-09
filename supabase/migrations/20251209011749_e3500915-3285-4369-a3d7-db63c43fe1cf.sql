-- Create table for AI mentor chat conversations
CREATE TABLE public.ai_mentor_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Nueva conversación',
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  module_id UUID REFERENCES public.course_modules(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for chat messages
CREATE TABLE public.ai_mentor_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.ai_mentor_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_mentor_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_mentor_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Users can view own conversations"
  ON public.ai_mentor_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON public.ai_mentor_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON public.ai_mentor_conversations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON public.ai_mentor_conversations
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for messages
CREATE POLICY "Users can view messages of own conversations"
  ON public.ai_mentor_messages
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ai_mentor_conversations c
    WHERE c.id = ai_mentor_messages.conversation_id
    AND c.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert messages to own conversations"
  ON public.ai_mentor_messages
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ai_mentor_conversations c
    WHERE c.id = ai_mentor_messages.conversation_id
    AND c.user_id = auth.uid()
  ));

-- Indexes for performance
CREATE INDEX idx_ai_mentor_conversations_user ON public.ai_mentor_conversations(user_id);
CREATE INDEX idx_ai_mentor_messages_conversation ON public.ai_mentor_messages(conversation_id);

-- Trigger for updated_at
CREATE TRIGGER update_ai_mentor_conversations_updated_at
  BEFORE UPDATE ON public.ai_mentor_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();