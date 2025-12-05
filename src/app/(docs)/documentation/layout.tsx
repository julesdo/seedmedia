import { DocSidebar } from "@/components/documentation/DocSidebar";
import { PublicHeader } from "@/components/layout/PublicHeader";

export default function DocumentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <DocSidebar />
      <div className="flex min-h-screen flex-col lg:pl-[280px]">
        <PublicHeader />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

