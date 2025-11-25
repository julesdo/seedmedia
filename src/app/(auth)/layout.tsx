"use client";

import { usePathname } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Les routes /studio ont leur propre layout, on ne leur applique pas MainLayout
  if (pathname?.startsWith("/studio")) {
    return <>{children}</>;
  }
  
  // Pour les autres routes (auth), on utilise MainLayout
  return <MainLayout>{children}</MainLayout>;
}

