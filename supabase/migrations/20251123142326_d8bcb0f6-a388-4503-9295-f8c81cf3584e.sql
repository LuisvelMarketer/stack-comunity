-- Create module_quizzes table
CREATE TABLE public.module_quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of options: [{text: string, isCorrect: boolean}]
  explanation TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.module_quizzes ENABLE ROW LEVEL SECURITY;

-- Policies for module_quizzes
CREATE POLICY "Users can view quizzes of published courses"
  ON public.module_quizzes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course_modules cm
      JOIN courses c ON c.id = cm.course_id
      WHERE cm.id = module_quizzes.module_id
      AND c.is_published = true
    )
  );

CREATE POLICY "Admins can manage quizzes"
  ON public.module_quizzes
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create user_quiz_answers table to track user answers
CREATE TABLE public.user_quiz_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.module_quizzes(id) ON DELETE CASCADE,
  selected_option INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, quiz_id)
);

-- Enable RLS
ALTER TABLE public.user_quiz_answers ENABLE ROW LEVEL SECURITY;

-- Policies for user_quiz_answers
CREATE POLICY "Users can view own answers"
  ON public.user_quiz_answers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own answers"
  ON public.user_quiz_answers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own answers"
  ON public.user_quiz_answers
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_module_quizzes_updated_at
  BEFORE UPDATE ON public.module_quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();