"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { StudioSidebar } from "./StudioSidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { Header } from "@/components/layout/Header";
import { CredibilityGainProvider } from "@/components/credibility/CredibilityGainProvider";
import { LoginTracker } from "@/components/missions/LoginTracker";

export function StudioSidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <StudioSidebar />
      <SidebarInset>
        {/* Sticky Header */}
        <Header />
        
        {/* Content Area */}
        <main className="flex-1 bg-background p-6">
          {children}
        </main>
      </SidebarInset>
      <CredibilityGainProvider />
      <LoginTracker />
    </SidebarProvider>
  );
}

