import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy } from "lucide-react";

export const UserProgress = () => {
  const { user } = useAuth();
  const [level, setLevel] = useState(1);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    loadUserProgress();
  }, [user]);

  const loadUserProgress = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("level, points")
      .eq("id", user.id)
      .single();

    if (!error && data) {
      setLevel(data.level);
      setPoints(data.points);
    }
  };

  const progressPercentage = (points % 100);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-5 h-5 text-accent" />
        <h3 className="font-bold text-lg">Tu Progreso</h3>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Nivel {level}</span>
          <span className="text-muted-foreground">{points} pts</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>
    </Card>
  );
};
