import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Images, Upload, Trash2, GripVertical, Loader2 } from "lucide-react";

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
  order_index: number;
  created_at: string;
}

interface CommunityGalleryManagerProps {
  communityId: string;
}

export function CommunityGalleryManager({ communityId }: CommunityGalleryManagerProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadGallery();
  }, [communityId]);

  const loadGallery = async () => {
    try {
      const { data, error } = await supabase
        .from("community_gallery")
        .select("*")
        .eq("community_id", communityId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error("Error loading gallery:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

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
        description: "El archivo no puede superar 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${communityId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("community-gallery")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("community-gallery")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from("community_gallery")
        .insert({
          community_id: communityId,
          image_url: publicUrl,
          caption: caption || null,
          order_index: images.length,
          uploaded_by: user.id,
        });

      if (insertError) throw insertError;

      toast({
        title: "Éxito",
        description: "Imagen subida correctamente",
      });

      setCaption("");
      loadGallery();
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (image: GalleryImage) => {
    try {
      // Extract file path from URL
      const urlParts = image.image_url.split("/community-gallery/");
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from("community-gallery").remove([filePath]);
      }

      const { error } = await supabase
        .from("community_gallery")
        .delete()
        .eq("id", image.id);

      if (error) throw error;

      toast({
        title: "Eliminada",
        description: "Imagen eliminada de la galería",
      });

      loadGallery();
    } catch (error) {
      console.error("Error deleting image:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la imagen",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Images className="h-5 w-5" />
          Gestionar Galería
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload section */}
        <div className="border-2 border-dashed rounded-lg p-6 text-center space-y-4">
          <div className="space-y-2">
            <Label htmlFor="caption">Descripción (opcional)</Label>
            <Input
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Añadir descripción a la imagen..."
            />
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <Input
              id="gallery-upload"
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
            <Label
              htmlFor="gallery-upload"
              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading ? "Subiendo..." : "Subir Imagen"}
            </Label>
            <p className="text-sm text-muted-foreground">
              JPG, PNG, GIF hasta 5MB
            </p>
          </div>
        </div>

        {/* Gallery grid */}
        {images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="relative group aspect-square rounded-lg overflow-hidden border"
              >
                <img
                  src={image.image_url}
                  alt={image.caption || "Imagen de galería"}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDelete(image)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {image.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/70 text-white text-sm truncate">
                    {image.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Images className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay imágenes en la galería</p>
            <p className="text-sm">Sube la primera imagen para comenzar</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
