import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { CredibilityGainProvider } from "@/components/credibility/CredibilityGainProvider";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1 pt-16 md:pt-32">{children}</main>
      <PublicFooter />
      <CredibilityGainProvider />
    </div>
  );
}

