import { StudioSidebarLayout } from "@/components/studio/StudioSidebarLayout";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudioSidebarLayout>{children}</StudioSidebarLayout>;
}

