import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Image, Send, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MentionInput } from "./MentionInput";

interface CreatePostProps {
  onPostCreated?: () => void;
  communityId?: string;
}

export const CreatePost = ({ onPostCreated, communityId }: CreatePostProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen no puede superar los 5MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage || !user) return null;

    setIsUploadingImage(true);
    try {
      const fileExt = selectedImage.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(fileName, selectedImage);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("post-images")
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && !selectedImage) {
      toast({
        title: "Error",
        description: "Agrega contenido o una imagen para publicar",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl: string | null = null;
      
      if (selectedImage) {
        imageUrl = await uploadImage();
      }

      const { error } = await supabase.from("posts").insert({
        user_id: user?.id,
        content: content.trim(),
        community_id: communityId || null,
        image_url: imageUrl,
      });

      if (error) throw error;

      setContent("");
      removeImage();
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
            <MentionInput
              value={content}
              onChange={setContent}
              placeholder="¿Qué estás pensando? Usa @ para mencionar usuarios"
              className="border-none bg-muted/50 focus-visible:ring-0"
              minHeight="100px"
            />
            
            {/* Image Preview */}
            {imagePreview && (
              <div className="relative mt-3 inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-48 rounded-lg object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-3">
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting || isUploadingImage}
                >
                  <Image className="h-4 w-4 mr-2" />
                  Imagen
                </Button>
              </div>
              <Button 
                type="submit" 
                disabled={isSubmitting || isUploadingImage || (!content.trim() && !selectedImage)} 
                size="sm"
              >
                {(isSubmitting || isUploadingImage) ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Publicar
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Card>
  );
};
