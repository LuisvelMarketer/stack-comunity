import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Upload, FileText, Trash2, Download, Loader2 } from "lucide-react";

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  created_at: string;
}

interface ModuleAttachmentsManagerProps {
  moduleId: string;
  moduleName: string;
}

export function ModuleAttachmentsManager({ moduleId, moduleName }: ModuleAttachmentsManagerProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadAttachments();
  }, [moduleId]);

  const loadAttachments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("module_attachments")
      .select("*")
      .eq("module_id", moduleId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading attachments:", error);
    } else {
      setAttachments(data || []);
    }
    setLoading(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo no puede superar los 20MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Generate unique file path
      const fileExt = file.name.split(".").pop();
      const fileName = `${moduleId}/${Date.now()}-${file.name}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("course-files")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("course-files")
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from("module_attachments")
        .insert({
          module_id: moduleId,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_size: file.size,
          file_type: file.type || fileExt,
        });

      if (dbError) throw dbError;

      toast({
        title: "Archivo subido",
        description: `${file.name} ha sido agregado al módulo.`,
      });

      loadAttachments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo subir el archivo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    try {
      // Extract file path from URL for deletion
      const urlParts = attachment.file_url.split("/course-files/");
      const filePath = urlParts[1];

      if (filePath) {
        await supabase.storage.from("course-files").remove([filePath]);
      }

      const { error } = await supabase
        .from("module_attachments")
        .delete()
        .eq("id", attachment.id);

      if (error) throw error;

      toast({
        title: "Archivo eliminado",
        description: `${attachment.file_name} ha sido eliminado.`,
      });

      loadAttachments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el archivo.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <FileText className="h-4 w-4" />;
    if (fileType.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />;
    if (fileType.includes("image")) return <FileText className="h-4 w-4 text-blue-500" />;
    if (fileType.includes("video")) return <FileText className="h-4 w-4 text-purple-500" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          Archivos ({attachments.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Archivos adjuntos: {moduleName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Upload section */}
          <div className="space-y-2">
            <Label>Subir nuevo archivo</Label>
            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                disabled={uploading}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.txt,.md,.jpg,.jpeg,.png,.gif,.mp4,.mp3"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Máximo 20MB. PDFs, documentos, imágenes, videos, archivos comprimidos.
            </p>
            {uploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Subiendo archivo...
              </div>
            )}
          </div>

          {/* Attachments list */}
          <div className="space-y-2">
            <Label>Archivos actuales</Label>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : attachments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No hay archivos adjuntos en este módulo.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    {getFileIcon(attachment.file_type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {attachment.file_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.file_size)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                      >
                        <a
                          href={attachment.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción eliminará "{attachment.file_name}" permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(attachment)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}