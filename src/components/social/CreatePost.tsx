import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreatePostProps {
  onPostCreated?: () => void;
  communityId?: string;
}

export const CreatePost = ({ onPostCreated, communityId }: CreatePostProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "El contenido no puede estar vacío",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("posts").insert({
        user_id: user?.id,
        content: content.trim(),
        community_id: communityId || null,
      });

      if (error) throw error;

      setContent("");
      toast({
        title: "¡Publicado!",
        description: "Tu publicación se ha creado exitosamente",
      });
      
      onPostCreated?.();
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la publicación",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          <Avatar>
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user?.email?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="¿Qué estás pensando?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] resize-none border-none bg-muted/50 focus-visible:ring-0"
            />
            <div className="flex items-center justify-between mt-3">
              <Button type="button" variant="ghost" size="sm" disabled>
                <Image className="h-4 w-4 mr-2" />
                Imagen
              </Button>
              <Button type="submit" disabled={isSubmitting || !content.trim()} size="sm">
                <Send className="h-4 w-4 mr-2" />
                Publicar
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Card>
  );
};