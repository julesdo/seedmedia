"use client";

import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { usePathname } from "next/navigation";

const breadcrumbMap: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/decisions": "Décisions",
  "/admin/trading": "Trading",
  "/admin/users": "Utilisateurs",
  "/admin/news": "News",
  "/admin/bots": "Bots",
  "/admin/shop": "Shop",
  "/admin/config": "Configuration",
  "/admin/scripts": "Scripts & Maintenance",
};

/**
 * Header pour l'interface admin
 */
export function AdminHeader() {
  const pathname = usePathname();
  const currentPage = breadcrumbMap[pathname] || "Admin";

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-foreground">{currentPage}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          title="Notifications"
        >
          <SolarIcon icon="bell-bold" className="size-5" />
        </Button>
      </div>
    </header>
  );
}

