"use client";

import { Header } from "./Header";
import { SidebarLayout } from "./Sidebar";
import { SidebarInset } from "@/components/ui/sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
}

export function MainLayout({ children, rightPanel }: MainLayoutProps) {
  return (
    <SidebarLayout>
      <SidebarInset>
        {/* Sticky Header */}
        <Header />
        
        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-background">
            <div className="container mx-auto p-4">{children}</div>
          </main>
          {rightPanel && (
            <aside className="hidden lg:block w-80 border-l overflow-y-auto bg-background">
              <div className="p-4">{rightPanel}</div>
            </aside>
          )}
        </div>
      </SidebarInset>
    </SidebarLayout>
  );
}
