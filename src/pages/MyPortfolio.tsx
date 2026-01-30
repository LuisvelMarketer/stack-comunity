import { useNavigate } from "react-router-dom";
import { usePortfolio } from "@/hooks/usePortfolio";
import { PortfolioEditor } from "@/components/portfolio/PortfolioEditor";
import { MainLayout } from "@/components/layout/MainLayout";

const MyPortfolio = () => {
  const { settings } = usePortfolio();

  const handlePreview = () => {
    if (settings?.slug) {
      window.open(`/portfolio/${settings.slug}`, "_blank");
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <PortfolioEditor onPreview={settings ? handlePreview : undefined} />
      </div>
    </MainLayout>
  );
};

export default MyPortfolio;