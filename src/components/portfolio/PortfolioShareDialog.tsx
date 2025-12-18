import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Copy, Download, Share2, Linkedin, Twitter, Facebook, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PortfolioShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  userName: string;
}

export function PortfolioShareDialog({ open, onOpenChange, slug, userName }: PortfolioShareDialogProps) {
  const [generating, setGenerating] = useState(false);
  
  const portfolioUrl = `${window.location.origin}/portfolio/${slug}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(portfolioUrl);
      toast.success("Enlace copiado al portapapeles");
    } catch {
      toast.error("Error al copiar el enlace");
    }
  };

  const shareToSocial = (platform: string) => {
    const text = `Mira mi portfolio profesional: ${userName}`;
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(portfolioUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(portfolioUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(portfolioUrl)}`,
    };
    
    window.open(urls[platform], "_blank", "width=600,height=400");
  };

  const downloadPDF = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-portfolio-pdf", {
        body: { slug },
      });

      if (error) throw error;

      if (data?.html) {
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(data.html);
          printWindow.document.close();
          printWindow.onload = () => {
            printWindow.print();
          };
        }
      }
      
      toast.success("PDF generado correctamente");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Error al generar el PDF");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Compartir Portfolio
          </DialogTitle>
          <DialogDescription>
            Comparte tu portfolio profesional con el mundo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input value={portfolioUrl} readOnly className="flex-1" />
            <Button variant="outline" size="icon" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => shareToSocial("linkedin")}
            >
              <Linkedin className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => shareToSocial("twitter")}
            >
              <Twitter className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={() => shareToSocial("facebook")}
            >
              <Facebook className="h-5 w-5" />
            </Button>
          </div>

          <Button 
            className="w-full" 
            onClick={downloadPDF}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {generating ? "Generando PDF..." : "Descargar como PDF"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
