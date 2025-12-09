import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/UserAvatar";
import { Star, Clock, ExternalLink } from "lucide-react";
import { OrderServiceDialog } from "./OrderServiceDialog";

interface ServiceCardProps {
  service: {
    id: string;
    user_id: string;
    title: string;
    description: string;
    category: string;
    price: number;
    delivery_days: number;
    skills: string[];
    portfolio_urls: string[];
    orders_completed: number;
    rating_average: number;
    rating_count: number;
    profiles?: {
      full_name: string | null;
      avatar_url: string | null;
      level: number;
    };
  };
  onRefresh: () => void;
}

export function ServiceCard({ service, onRefresh }: ServiceCardProps) {
  const { user } = useAuth();
  const [isOrderOpen, setIsOrderOpen] = useState(false);

  const categoryLabels: Record<string, string> = {
    mvp: "MVP / App",
    landing: "Landing Page",
    automation: "Automatización",
    design: "Diseño UI/UX",
    other: "Otros",
  };

  const isOwn = user?.id === service.user_id;

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <UserAvatar 
                src={service.profiles?.avatar_url} 
                fallback={service.profiles?.full_name?.charAt(0) || "U"} 
                level={service.profiles?.level || 1}
                size="sm" 
              />
              <div>
                <p className="text-sm font-medium">
                  {service.profiles?.full_name || "Usuario"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Nivel {service.profiles?.level || 1}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              {categoryLabels[service.category] || service.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-3">
          <h3 className="font-semibold line-clamp-2">{service.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {service.description}
          </p>

          {service.skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {service.skills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {service.skills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{service.skills.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {service.rating_count > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{service.rating_average}</span>
                <span>({service.rating_count})</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{service.delivery_days} días</span>
            </div>
          </div>

          {service.portfolio_urls.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2"
              onClick={() => window.open(service.portfolio_urls[0], "_blank")}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Ver portfolio
            </Button>
          )}
        </CardContent>
        <CardFooter className="pt-3 border-t flex items-center justify-between">
          <div>
            <span className="text-lg font-bold">${service.price}</span>
            <span className="text-sm text-muted-foreground ml-1">USD</span>
          </div>
          {!isOwn && (
            <Button size="sm" onClick={() => setIsOrderOpen(true)}>
              Contratar
            </Button>
          )}
        </CardFooter>
      </Card>

      <OrderServiceDialog
        open={isOrderOpen}
        onOpenChange={setIsOrderOpen}
        service={service}
        onSuccess={onRefresh}
      />
    </>
  );
}
