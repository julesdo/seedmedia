import { PublicSidebar } from "@/components/layout/PublicSidebar";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { CredibilityGainProvider } from "@/components/credibility/CredibilityGainProvider";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <PublicSidebar />
      <div className="flex min-h-screen flex-col lg:pl-[280px]">
        <PublicHeader />
        <main className="flex-1">{children}</main>
      </div>
      <CredibilityGainProvider />
    </div>
  );
}

