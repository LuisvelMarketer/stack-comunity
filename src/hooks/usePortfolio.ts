import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface PortfolioSettings {
  id: string;
  user_id: string;
  slug: string;
  headline: string | null;
  summary: string | null;
  contact_email: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  website_url: string | null;
  show_projects: boolean;
  show_certificates: boolean;
  show_achievements: boolean;
  featured_projects: string[];
  theme: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  live_url: string | null;
  repository_url: string | null;
  tech_stack: string[];
  status: string;
  likes_count: number;
  views_count: number;
}

export interface PortfolioCertificate {
  id: string;
  certificate_number: string;
  issued_at: string;
  course_title: string;
  course_thumbnail: string | null;
}

export interface PortfolioAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  unlocked_at: string;
}

export interface PortfolioProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  level: number;
  points: number;
}

export function usePortfolio(slugOrUserId?: string, isSlug = true) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PortfolioSettings | null>(null);
  const [profile, setProfile] = useState<PortfolioProfile | null>(null);
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [certificates, setCertificates] = useState<PortfolioCertificate[]>([]);
  const [achievements, setAchievements] = useState<PortfolioAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = async () => {
    setLoading(true);
    setError(null);

    try {
      let portfolioSettings: PortfolioSettings | null = null;
      let userId: string | null = null;

      if (slugOrUserId) {
        if (isSlug) {
          const { data, error } = await supabase
            .from("portfolio_settings")
            .select("*")
            .eq("slug", slugOrUserId)
            .eq("is_public", true)
            .single();

          if (error) throw new Error("Portfolio no encontrado");
          portfolioSettings = data;
          userId = data.user_id;
        } else {
          userId = slugOrUserId;
          const { data } = await supabase
            .from("portfolio_settings")
            .select("*")
            .eq("user_id", slugOrUserId)
            .single();
          portfolioSettings = data;
        }
      } else if (user) {
        userId = user.id;
        const { data } = await supabase
          .from("portfolio_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();
        portfolioSettings = data;
      }

      setSettings(portfolioSettings);

      if (userId) {
        // Fetch profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, bio, location, level, points")
          .eq("id", userId)
          .single();

        setProfile(profileData);

        // Fetch projects
        const { data: projectsData } = await supabase
          .from("build_projects")
          .select("id, title, description, thumbnail_url, live_url, repository_url, tech_stack, status, likes_count, views_count")
          .eq("user_id", userId)
          .eq("visibility", "public")
          .order("created_at", { ascending: false });

        setProjects(projectsData || []);

        // Fetch certificates with course info
        const { data: certsData } = await supabase
          .from("certificates")
          .select(`
            id,
            certificate_number,
            issued_at,
            courses (
              title,
              thumbnail_url
            )
          `)
          .eq("user_id", userId)
          .order("issued_at", { ascending: false });

        const formattedCerts = certsData?.map((cert: any) => ({
          id: cert.id,
          certificate_number: cert.certificate_number,
          issued_at: cert.issued_at,
          course_title: cert.courses?.title || "Curso",
          course_thumbnail: cert.courses?.thumbnail_url,
        })) || [];

        setCertificates(formattedCerts);

        // Fetch achievements
        const { data: achievementsData } = await supabase
          .from("user_achievements")
          .select(`
            unlocked_at,
            achievements (
              id,
              name,
              description,
              icon,
              points
            )
          `)
          .eq("user_id", userId)
          .order("unlocked_at", { ascending: false });

        const formattedAchievements = achievementsData
          ?.filter((item: any) => item.achievements)
          .map((item: any) => ({
            ...item.achievements,
            unlocked_at: item.unlocked_at,
          })) || [];

        setAchievements(formattedAchievements);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: Partial<PortfolioSettings>) => {
    if (!user) return { error: "No autenticado" };

    const { data: existing } = await supabase
      .from("portfolio_settings")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (existing) {
      const { error } = await supabase
        .from("portfolio_settings")
        .update(newSettings)
        .eq("user_id", user.id);

      if (error) return { error: error.message };
    } else {
      const { error } = await supabase
        .from("portfolio_settings")
        .insert({
          user_id: user.id,
          slug: newSettings.slug || user.id,
          ...newSettings,
        });

      if (error) return { error: error.message };
    }

    await fetchPortfolio();
    return { error: null };
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const checkSlugAvailability = async (slug: string) => {
    const { data } = await supabase
      .from("portfolio_settings")
      .select("id, user_id")
      .eq("slug", slug)
      .single();

    if (!data) return true;
    if (user && data.user_id === user.id) return true;
    return false;
  };

  useEffect(() => {
    fetchPortfolio();
  }, [slugOrUserId, user?.id]);

  return {
    settings,
    profile,
    projects,
    certificates,
    achievements,
    loading,
    error,
    saveSettings,
    generateSlug,
    checkSlugAvailability,
    refetch: fetchPortfolio,
  };
}
