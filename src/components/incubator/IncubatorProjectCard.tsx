import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/UserAvatar";
import { ExpressInterestDialog } from "./ExpressInterestDialog";
import { 
  Users, 
  DollarSign, 
  ExternalLink, 
  Target,
  Percent,
  PlayCircle
} from "lucide-react";

interface IncubatorProjectCardProps {
  project: {
    id: string;
    project_id: string | null;
    user_id: string;
    pitch: string;
    funding_goal: number;
    funding_received: number;
    equity_offered: number | null;
    status: string;
    target_market: string | null;
    team_size: number;
    video_pitch_url: string | null;
    build_project?: {
      title: string;
      description: string | null;
      thumbnail_url: string | null;
      live_url: string | null;
      tech_stack: string[];
    } | null;
    founder?: {
      full_name: string | null;
      avatar_url: string | null;
      level: number;
    } | null;
    interests_count?: number;
  };
  investorProfile: {
    id: string;
    user_id: string;
  } | null;
  onRefresh: () => void;
}

export function IncubatorProjectCard({ project, investorProfile, onRefresh }: IncubatorProjectCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interestDialogOpen, setInterestDialogOpen] = useState(false);

  const fundingProgress = project.funding_goal > 0 
    ? (project.funding_received / project.funding_goal) * 100 
    : 0;

  const isOwner = user?.id === project.user_id;
  const canInvest = investorProfile && !isOwner;

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow flex flex-col overflow-hidden">
        {/* Thumbnail */}
        {project.build_project?.thumbnail_url ? (
          <div className="relative h-40 bg-muted">
            <img
              src={project.build_project.thumbnail_url}
              alt={project.build_project.title}
              className="w-full h-full object-cover"
            />
            {project.status === "funded" && (
              <Badge className="absolute top-2 right-2 bg-green-500">
                Financiado
              </Badge>
            )}
          </div>
        ) : (
          <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Target className="h-12 w-12 text-primary/50" />
          </div>
        )}

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold line-clamp-1">
                {project.build_project?.title || "Proyecto sin nombre"}
              </h3>
              {project.target_market && (
                <p className="text-xs text-muted-foreground">{project.target_market}</p>
              )}
            </div>
            {project.video_pitch_url && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => window.open(project.video_pitch_url!, "_blank")}
              >
                <PlayCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-3">
          {/* Pitch */}
          <p className="text-sm text-muted-foreground line-clamp-3">
            {project.pitch}
          </p>

          {/* Funding Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium">${project.funding_received.toLocaleString()}</span>
              <span className="text-muted-foreground">de ${project.funding_goal.toLocaleString()}</span>
            </div>
            <Progress value={fundingProgress} className="h-2" />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {project.equity_offered && (
              <div className="flex items-center gap-1">
                <Percent className="h-3 w-3" />
                <span>{project.equity_offered}% equity</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{project.interests_count || 0} interesados</span>
            </div>
          </div>

          {/* Tech Stack */}
          {project.build_project?.tech_stack && project.build_project.tech_stack.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.build_project.tech_stack.slice(0, 3).map((tech) => (
                <Badge key={tech} variant="outline" className="text-xs">
                  {tech}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-3 border-t flex items-center justify-between">
          {/* Founder */}
          <div className="flex items-center gap-2">
            <UserAvatar
              src={project.founder?.avatar_url}
              fallback={project.founder?.full_name?.charAt(0) || "?"}
              level={project.founder?.level || 1}
              size="sm"
            />
            <span className="text-sm font-medium">
              {project.founder?.full_name || "Fundador"}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {project.build_project?.live_url && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => window.open(project.build_project!.live_url!, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            {canInvest && (
              <Button size="sm" onClick={() => setInterestDialogOpen(true)}>
                <DollarSign className="h-4 w-4 mr-1" />
                Invertir
              </Button>
            )}
            {project.project_id && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/project/${project.project_id}`)}
              >
                Ver proyecto
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {investorProfile && (
        <ExpressInterestDialog
          open={interestDialogOpen}
          onOpenChange={setInterestDialogOpen}
          project={project}
          investorId={investorProfile.id}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
}