import { DocSidebar } from "@/components/documentation/DocSidebar";
import { SimplifiedHeader } from "@/components/navigation/SimplifiedHeader";

export default function DocumentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <DocSidebar />
      <div className="flex min-h-screen flex-col lg:pl-[280px]">
        <SimplifiedHeader />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

