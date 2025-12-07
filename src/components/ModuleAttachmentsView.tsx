import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FileText, Download, Paperclip } from "lucide-react";

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
}

interface ModuleAttachmentsViewProps {
  moduleId: string;
}

export function ModuleAttachmentsView({ moduleId }: ModuleAttachmentsViewProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAttachments();
  }, [moduleId]);

  const loadAttachments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("module_attachments")
      .select("id, file_name, file_url, file_size, file_type")
      .eq("module_id", moduleId)
      .order("created_at", { ascending: true });

    if (!error) {
      setAttachments(data || []);
    }
    setLoading(false);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <FileText className="h-4 w-4" />;
    if (fileType.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />;
    if (fileType.includes("image")) return <FileText className="h-4 w-4 text-blue-500" />;
    if (fileType.includes("video")) return <FileText className="h-4 w-4 text-purple-500" />;
    if (fileType.includes("zip") || fileType.includes("rar")) return <FileText className="h-4 w-4 text-yellow-500" />;
    return <FileText className="h-4 w-4" />;
  };

  if (loading) {
    return null;
  }

  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Paperclip className="h-4 w-4" />
        Recursos descargables
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {attachments.map((attachment) => (
          <a
            key={attachment.id}
            href={attachment.file_url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border hover:bg-muted transition-colors group"
          >
            {getFileIcon(attachment.file_type)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                {attachment.file_name}
              </p>
              {attachment.file_size && (
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.file_size)}
                </p>
              )}
            </div>
            <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </a>
        ))}
      </div>
    </div>
  );
}