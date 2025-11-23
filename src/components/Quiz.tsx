import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QuizOption {
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  explanation: string | null;
  order_index: number;
}

interface QuizProps {
  moduleId: string;
}

export const Quiz = ({ moduleId }: QuizProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Map<string, number>>(new Map());
  const [submittedAnswers, setSubmittedAnswers] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestions();
  }, [moduleId]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      
      const { data: quizData, error: quizError } = await supabase
        .from("module_quizzes")
        .select("*")
        .eq("module_id", moduleId)
        .order("order_index");

      if (quizError) throw quizError;
      
      // Transform data to match QuizQuestion interface
      const transformedQuestions: QuizQuestion[] = (quizData || []).map(quiz => ({
        id: quiz.id,
        question: quiz.question,
        options: quiz.options as unknown as QuizOption[],
        explanation: quiz.explanation,
        order_index: quiz.order_index,
      }));
      
      setQuestions(transformedQuestions);

      if (user) {
        const { data: answersData } = await supabase
          .from("user_quiz_answers")
          .select("quiz_id, selected_option, is_correct")
          .eq("user_id", user.id)
          .in("quiz_id", quizData?.map(q => q.id) || []);

        if (answersData) {
          const answersMap = new Map<string, number>();
          const submittedMap = new Map<string, boolean>();
          
          answersData.forEach(answer => {
            answersMap.set(answer.quiz_id, answer.selected_option);
            submittedMap.set(answer.quiz_id, answer.is_correct);
          });
          
          setUserAnswers(answersMap);
          setSubmittedAnswers(submittedMap);
        }
      }
    } catch (error: any) {
      console.error("Error fetching quiz:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los quizzes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (quizId: string, optionIndex: number) => {
    setUserAnswers(new Map(userAnswers.set(quizId, optionIndex)));
  };

  const handleSubmitAnswer = async (quizId: string, optionIndex: number) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para responder los quizzes",
        variant: "destructive",
      });
      return;
    }

    const question = questions.find(q => q.id === quizId);
    if (!question) return;

    const isCorrect = question.options[optionIndex].isCorrect;

    try {
      const { error } = await supabase
        .from("user_quiz_answers")
        .upsert({
          user_id: user.id,
          quiz_id: quizId,
          selected_option: optionIndex,
          is_correct: isCorrect,
        }, {
          onConflict: "user_id,quiz_id"
        });

      if (error) throw error;

      setSubmittedAnswers(new Map(submittedAnswers.set(quizId, isCorrect)));

      toast({
        title: isCorrect ? "¡Correcto!" : "Incorrecto",
        description: isCorrect 
          ? "Has respondido correctamente" 
          : "Intenta revisar el contenido nuevamente",
        variant: isCorrect ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (questions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <AlertCircle className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-semibold">Quiz del Módulo</h3>
      </div>

      {questions.map((question, index) => {
        const selectedOption = userAnswers.get(question.id);
        const isSubmitted = submittedAnswers.has(question.id);
        const isCorrectAnswer = submittedAnswers.get(question.id);

        return (
          <Card key={question.id} className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                  {index + 1}
                </span>
                <span className="flex-1">{question.question}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={selectedOption?.toString()}
                onValueChange={(value) => handleAnswerSelect(question.id, parseInt(value))}
                disabled={isSubmitted}
              >
                {question.options.map((option, optionIndex) => {
                  const isSelected = selectedOption === optionIndex;
                  const showResult = isSubmitted && isSelected;

                  return (
                    <div
                      key={optionIndex}
                      className={`flex items-center space-x-3 p-4 rounded-lg border transition-all ${
                        isSubmitted && option.isCorrect
                          ? "border-green-500 bg-green-500/10"
                          : showResult && !option.isCorrect
                          ? "border-red-500 bg-red-500/10"
                          : isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value={optionIndex.toString()} id={`${question.id}-${optionIndex}`} />
                      <Label
                        htmlFor={`${question.id}-${optionIndex}`}
                        className="flex-1 cursor-pointer"
                      >
                        {option.text}
                      </Label>
                      {isSubmitted && option.isCorrect && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                      {showResult && !option.isCorrect && (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  );
                })}
              </RadioGroup>

              {!isSubmitted && selectedOption !== undefined && (
                <Button
                  onClick={() => handleSubmitAnswer(question.id, selectedOption)}
                  className="w-full"
                >
                  Verificar Respuesta
                </Button>
              )}

              {isSubmitted && question.explanation && (
                <div className="mt-4 p-4 rounded-lg bg-muted border border-border">
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Explicación:
                  </p>
                  <p className="text-sm text-muted-foreground">{question.explanation}</p>
                </div>
              )}

              {isSubmitted && (
                <div className={`flex items-center gap-2 text-sm font-medium ${
                  isCorrectAnswer ? "text-green-600" : "text-red-600"
                }`}>
                  {isCorrectAnswer ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Respuesta correcta
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      Respuesta incorrecta
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
