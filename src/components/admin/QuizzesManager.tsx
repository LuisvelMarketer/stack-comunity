import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export const QuizzesManager = () => {
  const { toast } = useToast();

  return (
    <Card className="p-6">
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">Gestión de Quizzes</h3>
        <p className="text-muted-foreground mb-4">
          Funcionalidad en desarrollo
        </p>
        <p className="text-sm text-muted-foreground">
          Próximamente podrás crear y gestionar quizzes para los módulos
        </p>
      </div>
    </Card>
  );
};
