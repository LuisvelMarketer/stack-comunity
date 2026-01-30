import { ReactNode } from "react";
import { MainNavbar } from "./MainNavbar";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
  showAdminLink?: boolean;
  className?: string;
}

export function MainLayout({ children, showAdminLink = false, className }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <MainNavbar showAdminLink={showAdminLink} />
      <main className={cn(className)}>
        {children}
      </main>
    </div>
  );
}
