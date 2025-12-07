import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  fallback: string;
  level?: number;
  size?: "sm" | "md" | "lg" | "xl";
  showLevel?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const levelBadgeSizes = {
  sm: "h-4 w-4 text-[8px] -bottom-0.5 -right-0.5",
  md: "h-5 w-5 text-[9px] -bottom-0.5 -right-0.5",
  lg: "h-6 w-6 text-[10px] -bottom-1 -right-1",
  xl: "h-7 w-7 text-xs -bottom-1 -right-1",
};

const getLevelColor = (level: number) => {
  if (level >= 50) return "bg-gradient-to-br from-yellow-400 to-amber-600 text-white shadow-amber-500/50";
  if (level >= 30) return "bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-purple-500/50";
  if (level >= 20) return "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/50";
  if (level >= 10) return "bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-emerald-500/50";
  if (level >= 5) return "bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-orange-500/50";
  return "bg-gradient-to-br from-gray-400 to-gray-600 text-white shadow-gray-500/50";
};

export const UserAvatar = ({
  src,
  fallback,
  level = 1,
  size = "md",
  showLevel = true,
  className,
}: UserAvatarProps) => {
  return (
    <div className="relative inline-block">
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarImage src={src || ""} />
        <AvatarFallback className="bg-primary text-primary-foreground font-medium">
          {fallback}
        </AvatarFallback>
      </Avatar>
      {showLevel && level > 0 && (
        <div
          className={cn(
            "absolute flex items-center justify-center rounded-full font-bold shadow-lg ring-2 ring-background",
            levelBadgeSizes[size],
            getLevelColor(level)
          )}
        >
          {level}
        </div>
      )}
    </div>
  );
};

export const getInitials = (name: string | null) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};
