import { PortfolioCertificate } from "@/hooks/usePortfolio";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PortfolioCertificatesProps {
  certificates: PortfolioCertificate[];
}

export function PortfolioCertificates({ certificates }: PortfolioCertificatesProps) {
  if (certificates.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No hay certificados para mostrar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Award className="h-6 w-6" />
        Certificados ({certificates.length})
      </h2>
      
      <div className="grid gap-4 md:grid-cols-2">
        {certificates.map((cert) => (
          <Card key={cert.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex gap-4">
              <div className="shrink-0 w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                {cert.course_thumbnail ? (
                  <img
                    src={cert.course_thumbnail}
                    alt={cert.course_title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Award className="h-8 w-8 text-primary" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold line-clamp-1">{cert.course_title}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(cert.issued_at), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  {cert.certificate_number}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
