import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface Requirement {
  label: string;
  met: boolean;
}

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const requirements: Requirement[] = useMemo(() => [
    { label: "Al menos 8 caracteres", met: password.length >= 8 },
    { label: "Una letra mayúscula", met: /[A-Z]/.test(password) },
    { label: "Un número", met: /[0-9]/.test(password) },
    { label: "Un carácter especial", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ], [password]);

  const strength = useMemo(() => {
    const metCount = requirements.filter((r) => r.met).length;
    return (metCount / requirements.length) * 100;
  }, [requirements]);

  const strengthLabel = useMemo(() => {
    if (strength === 0) return { text: "", color: "" };
    if (strength <= 25) return { text: "Muy débil", color: "text-red-500" };
    if (strength <= 50) return { text: "Débil", color: "text-orange-500" };
    if (strength <= 75) return { text: "Buena", color: "text-yellow-500" };
    return { text: "Muy fuerte", color: "text-green-500" };
  }, [strength]);

  const progressColor = useMemo(() => {
    if (strength <= 25) return "bg-red-500";
    if (strength <= 50) return "bg-orange-500";
    if (strength <= 75) return "bg-yellow-500";
    return "bg-green-500";
  }, [strength]);

  if (!password) return null;

  return (
    <div className="space-y-3 mt-2">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Fortaleza</span>
          <span className={cn("text-xs font-medium", strengthLabel.color)}>
            {strengthLabel.text}
          </span>
        </div>
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <div
            className={cn("h-full transition-all duration-300", progressColor)}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {requirements.map((req, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              req.met ? "text-green-600" : "text-muted-foreground"
            )}
          >
            {req.met ? (
              <Check className="h-3 w-3 flex-shrink-0" />
            ) : (
              <X className="h-3 w-3 flex-shrink-0" />
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
