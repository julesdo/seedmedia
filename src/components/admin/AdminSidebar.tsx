"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SolarIcon } from "@/components/icons/SolarIcon";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/contexts/UserContext";

const adminNavItems = [
  {
    title: "Dashboard",
    icon: "chart-2-bold",
    href: "/admin",
    exact: true,
  },
  {
    title: "Décisions",
    icon: "document-text-bold",
    href: "/admin/decisions",
  },
  {
    title: "Trading",
    icon: "wallet-bold",
    href: "/admin/trading",
  },
  {
    title: "Utilisateurs",
    icon: "users-group-rounded-bold",
    href: "/admin/users",
  },
  {
    title: "News",
    icon: "news-bold",
    href: "/admin/news",
  },
  {
    title: "Bots",
    icon: "robot-bold",
    href: "/admin/bots",
  },
  {
    title: "Shop",
    icon: "shop-bold",
    href: "/admin/shop",
  },
  {
    title: "Configuration",
    icon: "settings-bold",
    href: "/admin/config",
  },
  {
    title: "Catégories",
    icon: "tag-bold",
    href: "/admin/config/categories",
  },
  {
    title: "Événements spéciaux",
    icon: "calendar-bold",
    href: "/admin/config/special-events",
  },
  {
    title: "Scripts",
    icon: "code-bold",
    href: "/admin/scripts",
  },
];

/**
 * Sidebar admin - Style identique à DesktopSidebar
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <aside className="hidden lg:flex flex-col w-[244px] border-r border-border/50 bg-background fixed left-0 top-0 bottom-0 overflow-y-auto z-30">
      <div className="flex flex-col h-full px-4 py-6">
        {/* Logo */}
        <Link href="/admin" prefetch={true} data-prefetch="viewport" className="mb-8">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <SolarIcon icon="shield-check-bold" className="size-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Admin</span>
          </div>
        </Link>

        {/* Navigation principale */}
        <nav className="flex-1 space-y-1">
          {adminNavItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname?.startsWith(`${item.href}/`) || pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                data-prefetch="viewport"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary/10 text-foreground font-semibold"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <SolarIcon
                  icon={item.icon}
                  className={cn(
                    "size-6",
                    isActive && "text-primary"
                  )}
                />
                <span className="text-sm flex-1">{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* Profil utilisateur */}
        {user && (
          <div className="mt-auto pt-6 border-t border-border/50">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
              <Avatar className="size-8">
                <AvatarImage src={user?.image || undefined} alt={user?.name || user?.email || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">
                  {user?.name || user?.email || "Admin"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Super Admin
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Retour à l'app */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <Link
            href="/"
            prefetch={true}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
              "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <SolarIcon
              icon="arrow-left-bold"
              className="size-6"
            />
            <span className="text-sm flex-1">Retour à l'app</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}


