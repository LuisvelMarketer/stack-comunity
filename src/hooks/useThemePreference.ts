import { useEffect } from "react";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useThemePreference() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  // Load theme from database on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .from("profiles")
          .select("preferences")
          .eq("id", user.id)
          .single();

        if (data?.preferences && typeof data.preferences === "object") {
          const prefs = data.preferences as { theme?: string };
          if (prefs.theme && prefs.theme !== theme) {
            setTheme(prefs.theme);
          }
        }
      } catch (error) {
        console.error("Error loading theme preference:", error);
      }
    };

    loadThemePreference();
  }, [user]);

  // Save theme to database when it changes
  const saveTheme = async (newTheme: string) => {
    setTheme(newTheme);
    
    if (!user) return;

    try {
      const { data } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", user.id)
        .single();

      const currentPrefs = (data?.preferences as Record<string, unknown>) || {};
      
      await supabase
        .from("profiles")
        .update({
          preferences: { ...currentPrefs, theme: newTheme }
        })
        .eq("id", user.id);
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  return { theme, setTheme: saveTheme };
}
