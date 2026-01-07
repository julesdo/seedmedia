"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SolarIcon } from "@/components/icons/SolarIcon";
import Link from "next/link";
import { useUser } from "@/contexts/UserContext";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
import dynamic from "next/dynamic";

// Lazy load SearchModal (modal, pas besoin au chargement initial)
const SearchModal = dynamic(
  () => import("@/components/search/SearchModal").then((mod) => ({ default: mod.SearchModal })),
  {
    ssr: false, // Modal, pas besoin de SSR
  }
);

export function SimplifiedHeader() {
  const { isAuthenticated, user } = useUser();
  const router = useRouter();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const t = useTranslations('navigation');
  const unreadNotifications = useQuery(
    api.notifications.getUnreadNotificationsCount,
    isAuthenticated ? {} : "skip"
  );

  // Définir la hauteur du header en CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty("--header-height", "56px");
  }, []);

  const navLinks = [
    {
      label: t('decisions'),
      href: "/",
    },
    {
      label: t('profile'),
      href: "/profile",
    },
  ];

  return (
    <header 
      className="sticky z-40 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden"
      style={{ top: "var(--breaking-news-height, 0px)" }} 
      style={{ 
        top: "var(--breaking-news-height, 0px)"
      }}
    >
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" prefetch={true} className="flex items-center gap-2 group">
            <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <SolarIcon icon="leaf-bold" className="size-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Seed</span>
          </Link>

          {/* Navigation Links (Desktop only) */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                data-prefetch="viewport"
                className="px-3 py-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors rounded-md"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side: Seeds + Recherche + Notifications + Paramètres */}
          <div className="flex items-center gap-2">
            {/* Seeds - Gamification */}
            {isAuthenticated && user && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors">
                <SolarIcon icon="leaf-bold" className="size-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {user.seedsBalance || 0}
                </span>
              </div>
            )}

            {/* Recherche */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="flex items-center justify-center h-10 w-10 hover:bg-muted/50 rounded-lg transition-colors"
            >
              <SolarIcon 
                icon="magnifer-bold" 
                className="size-6 text-muted-foreground"
              />
            </button>

            {/* Notifications */}
            <Link 
              href="/notifications"
              prefetch={true}
              data-prefetch="viewport"
              className="relative flex items-center justify-center h-10 w-10 hover:bg-muted/50 rounded-lg transition-colors"
            >
              <SolarIcon 
                icon="bell-bold" 
                className={cn(
                  "size-6 transition-colors",
                  unreadNotifications && unreadNotifications > 0
                    ? "text-primary"
                    : "text-muted-foreground"
                )} 
              />
              {unreadNotifications && unreadNotifications > 0 && (
                <div className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-red-500 ring-2 ring-background" />
              )}
            </Link>

            {/* Paramètres */}
            <Link
              href="/settings"
              prefetch={true}
              data-prefetch="viewport"
              className="flex items-center justify-center h-10 w-10 hover:bg-muted/50 rounded-lg transition-colors"
            >
              <SolarIcon 
                icon="settings-bold" 
                className="size-6 text-muted-foreground"
              />
            </Link>
          </div>
        </div>
      </div>

      {/* Modale de recherche */}
      <SearchModal
        open={isSearchModalOpen}
        onOpenChange={setIsSearchModalOpen}
        initialQuery=""
      />
    </header>
  );
}

