import { Moon, Sun, Monitor, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useThemePreference } from "@/hooks/useThemePreference";

export function ThemeToggle() {
  const { theme, setTheme } = useThemePreference();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-500 ease-in-out dark:-rotate-180 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-180 scale-0 transition-all duration-500 ease-in-out dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Cambiar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover">
        <DropdownMenuItem 
          onClick={() => setTheme("light")} 
          className="flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            Claro
          </div>
          {theme === "light" && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")} 
          className="flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            Oscuro
          </div>
          {theme === "dark" && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")} 
          className="flex items-center justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Sistema
          </div>
          {theme === "system" && <Check className="h-4 w-4 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
