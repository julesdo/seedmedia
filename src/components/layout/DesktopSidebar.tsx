"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SolarIcon } from "@/components/icons/SolarIcon";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';

const navItems = [
  {
    labelKey: "navigation.decisions",
    href: "/",
    icon: "document-text-bold",
  },
  {
    labelKey: "navigation.map",
    href: "/map",
    icon: "map-point-bold",
  },
  {
    labelKey: "navigation.settings",
    href: "/settings",
    icon: "settings-bold",
  },
];

/**
 * Sidebar gauche - Style Instagram Desktop
 */
export function DesktopSidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useUser();
  const t = useTranslations();

  return (
    <aside className="hidden lg:flex flex-col w-[244px] border-r border-border/50 bg-background fixed left-0 top-0 bottom-0 overflow-y-auto">
      <div className="flex flex-col h-full px-4 py-6">
        {/* Logo */}
        <Link href="/" prefetch={true} data-prefetch="viewport" className="mb-8">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <SolarIcon icon="leaf-bold" className="size-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Seed</span>
          </div>
        </Link>

        {/* Navigation principale */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            
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
                <span className="text-sm flex-1">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Profil utilisateur */}
        {isAuthenticated && user && (
          <div className="mt-auto pt-6 border-t border-border/50">
            <Link
              href="/profile"
              prefetch={true}
              data-prefetch="viewport"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Avatar className="size-8">
                <AvatarImage src={user?.image || undefined} alt={user?.name || user?.email || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">
                  {user?.name || user?.email || t('navigation.user')}
                </div>
                {user?.level && (
                  <div className="text-xs text-muted-foreground">
                    {t('navigation.level')} {user.level}
                  </div>
                )}
              </div>
            </Link>
          </div>
        )}

        {/* Section Bots */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <Link
            href="/bots"
            prefetch={true}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
              pathname === "/bots" || pathname?.startsWith("/bots/")
                ? "bg-primary/10 text-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <SolarIcon
              icon="smile-square-bold"
              className={cn(
                "size-6",
                (pathname === "/bots" || pathname?.startsWith("/bots/")) && "text-primary"
              )}
            />
            <span className="text-sm flex-1">{t('navigation.bots')}</span>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-border/50">
          <div className="text-[10px] text-muted-foreground space-y-1">
            <div className="flex flex-wrap gap-x-2 gap-y-0">
              <Link href="/rules" prefetch={true} data-prefetch="viewport" className="hover:underline">{t('navigation.rules')}</Link>
              <span>•</span>
              <a href="#" className="hover:underline">{t('navigation.help')}</a>
              <span>•</span>
              <a href="#" className="hover:underline">{t('navigation.about')}</a>
            </div>
            <div className="text-[9px] mt-2">
              {t('navigation.copyright')}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

