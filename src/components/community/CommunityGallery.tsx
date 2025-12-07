import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Images, ChevronLeft, ChevronRight, X } from "lucide-react";

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
  order_index: number;
  created_at: string;
}

interface CommunityGalleryProps {
  communityId: string;
}

export function CommunityGallery({ communityId }: CommunityGalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

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

  const handlePrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1);
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

  if (images.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Images className="h-5 w-5" />
            Galería
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Images className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay imágenes en la galería</p>
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
          Galería ({images.length} imágenes)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Dialog key={image.id}>
              <DialogTrigger asChild>
                <button
                  onClick={() => setSelectedIndex(index)}
                  className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <img
                    src={image.image_url}
                    alt={image.caption || "Imagen de galería"}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                  {image.caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-sm truncate">{image.caption}</p>
                    </div>
                  )}
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl p-0 bg-black/95">
                <div className="relative">
                  <img
                    src={images[selectedIndex ?? index].image_url}
                    alt={images[selectedIndex ?? index].caption || "Imagen de galería"}
                    className="w-full max-h-[80vh] object-contain"
                  />
                  
                  {/* Navigation buttons */}
                  {(selectedIndex ?? index) > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevious();
                      }}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                  )}
                  
                  {(selectedIndex ?? index) < images.length - 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNext();
                      }}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  )}
                  
                  {/* Caption */}
                  {images[selectedIndex ?? index].caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-white text-center">{images[selectedIndex ?? index].caption}</p>
                    </div>
                  )}
                  
                  {/* Image counter */}
                  <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {(selectedIndex ?? index) + 1} / {images.length}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
