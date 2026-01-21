"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { LanguageSelectorCompact } from "@/components/translation/LanguageSelectorCompact";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useUser } from "@/contexts/UserContext";
import { SeedsDisplayWithShop } from "@/components/ui/SeedsDisplayWithShop";
import { cn } from "@/lib/utils";

/**
 * Top Bar Desktop - Style Instagram
 * Contient : Recherche, Notifications, Langue, Dark Theme, Profil
 */
export function DesktopTopBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useConvexAuth();
  const { user } = useUser();
  const [rightSidebarWidth, setRightSidebarWidth] = useState(319); // Largeur par défaut

  // Récupérer les catégories avec liquidité
  const categoriesWithLiquidity = useQuery(api.categories.getCategoriesWithLiquidity, {
    limit: 10, // Top 10 catégories par liquidité
  });

  // TODO: Vérifier les notifications non lues
  const hasUnreadNotifications = false;

  // Catégorie active depuis les query params
  const activeCategory = searchParams?.get("category");

  // Détecter la largeur de la sidebar droite (pour ajuster la top bar)
  useEffect(() => {
    const updateSidebarWidth = () => {
      const sidebar = document.querySelector('[data-sidebar="right"]');
      if (sidebar) {
        const width = sidebar.getBoundingClientRect().width;
        if (width > 0) {
          setRightSidebarWidth(width);
        }
      }
    };

    // Utiliser ResizeObserver pour détecter les changements de taille
    const sidebar = document.querySelector('[data-sidebar="right"]');
    let resizeObserver: ResizeObserver | null = null;
    
    if (sidebar) {
      updateSidebarWidth(); // Initialiser
      
      // Observer les changements de taille
      resizeObserver = new ResizeObserver(() => {
        updateSidebarWidth();
      });
      resizeObserver.observe(sidebar);
    }

    // Observer aussi les changements de taille de fenêtre
    window.addEventListener('resize', updateSidebarWidth);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', updateSidebarWidth);
    };
  }, []);


  return (
    <header 
      className="hidden lg:flex fixed top-0 left-[244px] z-30 h-14 border-b border-border/50 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80" 
      style={{ 
        top: "var(--breaking-news-height, 0px)",
        right: typeof window !== 'undefined' && window.innerWidth >= 1280 
          ? `${rightSidebarWidth}px` 
          : "319px" // Desktop uniquement (xl breakpoint)
      }}
    >
      <div className="flex items-center justify-between w-full px-6">
        {/* Catégories - Scroll horizontal épuré */}
        <div className="flex-1 max-w-[800px] overflow-hidden">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1">
            {/* Bouton "Tous" */}
            <Link
              href="/"
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                !activeCategory
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <SolarIcon icon="widget-4-bold" className="size-3.5" />
              <span>Tous</span>
            </Link>

            {/* Catégories */}
            {categoriesWithLiquidity && categoriesWithLiquidity.length > 0 ? (
              categoriesWithLiquidity.map((category) => {
                const isActive = activeCategory === category.slug;

                return (
                  <Link
                    key={category._id || category.slug}
                    href={`/?category=${category.slug}`}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    {category.icon && (
                      <SolarIcon
                        icon={category.icon}
                        className="size-3.5"
                        style={category.color && !isActive ? { color: category.color } : undefined}
                      />
                    )}
                    <span>{category.name}</span>
                  </Link>
                );
              })
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground px-4">
                <SolarIcon icon="loading" className="size-3.5 animate-spin" />
                <span>Chargement...</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions droite */}
        <div className="flex items-center gap-2">
          {/* Seeds avec bouton shop */}
          <SeedsDisplayWithShop variant="default" buttonSize="md" />

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
           </header>
  );
}

