"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { LanguageSelectorCompact } from "@/components/translation/LanguageSelectorCompact";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { SearchModal } from "@/components/search/SearchModal";
import { useUser } from "@/contexts/UserContext";

/**
 * Top Bar Desktop - Style Instagram
 * Contient : Recherche, Notifications, Langue, Dark Theme, Profil
 */
export function DesktopTopBar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const { isAuthenticated } = useConvexAuth();
  const { user } = useUser();

  // TODO: Vérifier les notifications non lues
  const hasUnreadNotifications = false;

  const handleSearchClick = () => {
    setIsSearchModalOpen(true);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      setIsSearchModalOpen(true);
    }
  };

  return (
    <header className="hidden lg:flex fixed top-0 left-[244px] right-[319px] z-30 h-14 border-b border-border/50 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80" style={{ top: "var(--breaking-news-height, 0px)" }}>
      <div className="flex items-center justify-between w-full px-6">
        {/* Barre de recherche */}
        <div className="flex-1 max-w-[400px]">
          <div className="relative">
            <SolarIcon
              icon="magnifer-bold"
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
            />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onClick={handleSearchClick}
              className="pl-9 h-9 text-sm bg-muted/50 border-border/50 focus:bg-background cursor-pointer"
              readOnly
            />
          </div>
        </div>

        {/* Actions droite */}
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

          {/* Notifications */}
          <Link href="/notifications" prefetch={true} data-prefetch="viewport">
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 hover:bg-muted/50"
            >
              <SolarIcon icon="bell-bold" className="size-5 text-foreground" />
              {hasUnreadNotifications && (
                <div className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary ring-2 ring-background" />
              )}
            </Button>
          </Link>

          {/* Sélecteur de langue */}
          <LanguageSelectorCompact variant="ghost" size="sm" className="h-9" />

          {/* Switch Dark Theme */}
          <ThemeToggle variant="ghost" size="icon" className="h-9 w-9" />

          {/* Boutons auth si non connecté */}
          {!isAuthenticated && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  router.prefetch("/sign-in");
                  router.push("/sign-in");
                }}
                className="h-9 text-xs"
              >
                Connexion
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  router.prefetch("/sign-up");
                  router.push("/sign-up");
                }}
                className="h-9 text-xs"
              >
                Inscription
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modale de recherche */}
      <SearchModal
        open={isSearchModalOpen}
        onOpenChange={setIsSearchModalOpen}
        initialQuery={searchQuery}
      />
    </header>
  );
}

