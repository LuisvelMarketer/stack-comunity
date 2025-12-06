import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Award, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Certificate {
  id: string;
  certificate_number: string;
  issued_at: string;
  course_title?: string;
  user_name?: string;
}

interface CourseCertificateProps {
  courseId: string;
  courseTitle: string;
  progressPercent: number;
}

export function CourseCertificate({ courseId, courseTitle, progressPercent }: CourseCertificateProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkExistingCertificate();
  }, [courseId, user]);

  const checkExistingCertificate = async () => {
    if (!user) {
      setChecking(false);
      return;
    }

    try {
      const { data } = await supabase
        .from("certificates")
        .select("*")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .maybeSingle();

      if (data) {
        setCertificate({
          ...data,
          course_title: courseTitle,
        });
      }
    } catch (error) {
      console.error("Error checking certificate:", error);
    } finally {
      setChecking(false);
    }
  };

  const generateCertificate = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para obtener tu certificado",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-certificate", {
        body: { courseId },
      });

      if (error) throw error;

      if (data.success) {
        setCertificate(data.certificate);
        toast({
          title: "¡Felicidades!",
          description: "Tu certificado ha sido generado exitosamente",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo generar el certificado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = () => {
    if (!certificate) return;

    // Generate a simple HTML certificate that can be printed
    const userName = certificate.user_name || "Estudiante";
    const certDate = format(new Date(certificate.issued_at), "d 'de' MMMM 'de' yyyy", { locale: es });
    
    const certificateHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Certificado - ${courseTitle}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', sans-serif;
            background: #f5f5f5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
          }
          
          .certificate {
            width: 800px;
            padding: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            position: relative;
            overflow: hidden;
          }
          
          .certificate::before {
            content: '';
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            bottom: 20px;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 15px;
            pointer-events: none;
          }
          
          .inner {
            background: white;
            border-radius: 15px;
            padding: 50px;
            text-align: center;
            position: relative;
          }
          
          .award-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
          }
          
          .award-icon svg {
            width: 40px;
            height: 40px;
            fill: white;
          }
          
          h1 {
            font-family: 'Playfair Display', serif;
            font-size: 36px;
            color: #333;
            margin-bottom: 10px;
          }
          
          .subtitle {
            color: #666;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 3px;
            margin-bottom: 30px;
          }
          
          .recipient {
            font-family: 'Playfair Display', serif;
            font-size: 32px;
            color: #667eea;
            margin: 20px 0;
            padding: 10px 0;
            border-bottom: 2px solid #667eea;
            display: inline-block;
          }
          
          .course-name {
            font-size: 24px;
            color: #333;
            margin: 20px 0;
            font-weight: 600;
          }
          
          .description {
            color: #666;
            font-size: 16px;
            line-height: 1.6;
            max-width: 500px;
            margin: 0 auto 30px;
          }
          
          .details {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin-top: 30px;
            padding-top: 30px;
            border-top: 1px solid #eee;
          }
          
          .detail {
            text-align: center;
          }
          
          .detail-label {
            font-size: 12px;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .detail-value {
            font-size: 14px;
            color: #333;
            font-weight: 600;
            margin-top: 5px;
          }
          
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .certificate {
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="inner">
            <div class="award-icon">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
            </div>
            <p class="subtitle">Certificado de Finalización</p>
            <h1>Certificado de Logro</h1>
            <p class="description">Este certificado se otorga a</p>
            <p class="recipient">${userName}</p>
            <p class="description">por haber completado exitosamente el curso</p>
            <p class="course-name">"${courseTitle}"</p>
            <div class="details">
              <div class="detail">
                <p class="detail-label">Fecha de Emisión</p>
                <p class="detail-value">${certDate}</p>
              </div>
              <div class="detail">
                <p class="detail-label">Número de Certificado</p>
                <p class="detail-value">${certificate.certificate_number}</p>
              </div>
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([certificateHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  if (checking) {
    return null;
  }

  const isCompleted = progressPercent >= 100;

  if (certificate) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
            <Award className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">¡Curso Completado!</CardTitle>
          <CardDescription>
            Tu certificado fue emitido el{" "}
            {format(new Date(certificate.issued_at), "d 'de' MMMM 'de' yyyy", { locale: es })}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Certificado N°: <span className="font-mono font-semibold">{certificate.certificate_number}</span>
          </p>
          <Button onClick={downloadCertificate} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Descargar Certificado
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isCompleted) {
    return (
      <Card className="border-muted">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Award className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl text-muted-foreground">Certificado</CardTitle>
          <CardDescription>
            Completa todos los módulos del curso para obtener tu certificado
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground">
            Progreso actual: <span className="font-semibold">{Math.round(progressPercent)}%</span>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 animate-pulse">
          <Award className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-xl">¡Felicidades!</CardTitle>
        <CardDescription>
          Has completado todos los módulos. Obtén tu certificado ahora.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={generateCertificate} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Award className="mr-2 h-4 w-4" />
              Obtener Certificado
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
