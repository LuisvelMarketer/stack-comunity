import { useNavigate } from "react-router-dom";
import { usePortfolio } from "@/hooks/usePortfolio";
import { PortfolioEditor } from "@/components/portfolio/PortfolioEditor";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const MyPortfolio = () => {
  const navigate = useNavigate();
  const { settings } = usePortfolio();

  const handlePreview = () => {
    if (settings?.slug) {
      window.open(`/portfolio/${settings.slug}`, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <PortfolioEditor onPreview={settings ? handlePreview : undefined} />
      </main>
    </div>
  );
};

export default MyPortfolio;
