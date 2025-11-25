"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { SidebarInset } from "@/components/ui/sidebar";
import { Header } from "@/components/layout/Header";

export function AdminSidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        {/* Sticky Header */}
        <Header />
        
        {/* Content Area */}
        <main className="flex-1 bg-background p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

