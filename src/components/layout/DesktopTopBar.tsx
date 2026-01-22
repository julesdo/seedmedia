"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [hasOverflow, setHasOverflow] = useState(false);
  const [showMoreOpen, setShowMoreOpen] = useState(false);
  const categoriesScrollRef = useRef<HTMLDivElement>(null);

  // Récupérer les catégories avec liquidité
  const categoriesWithLiquidity = useQuery(api.categories.getCategoriesWithLiquidity, {
    limit: 10, // Top 10 catégories par liquidité
  });

  // Récupérer TOUTES les catégories pour le dropdown "Voir plus"
  const allCategories = useQuery(api.categories.getActiveCategories, {
    appliesTo: "decisions",
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

  // Détecter si des catégories sont cachées (overflow)
  useEffect(() => {
    const checkOverflow = () => {
      if (categoriesScrollRef.current) {
        const { scrollWidth, clientWidth } = categoriesScrollRef.current;
        setHasOverflow(scrollWidth > clientWidth);
      }
    };

    // Vérifier au montage et après chaque changement
    checkOverflow();
    
    // Vérifier après un court délai pour laisser le temps au rendu
    const timeout = setTimeout(checkOverflow, 100);

    // Observer les changements de taille
    const resizeObserver = new ResizeObserver(checkOverflow);
    if (categoriesScrollRef.current) {
      resizeObserver.observe(categoriesScrollRef.current);
    }

    // Observer aussi les changements de taille de fenêtre
    window.addEventListener('resize', checkOverflow);

    return () => {
      clearTimeout(timeout);
      resizeObserver.disconnect();
      window.removeEventListener('resize', checkOverflow);
    };
  }, [categoriesWithLiquidity]);

  // Calculer les catégories visibles vs cachées
  // Limiter à 5 catégories visibles en desktop XL
  const { visibleCategories, hiddenCategories } = useMemo(() => {
    const maxVisibleCategories = 5;
    const allCategoriesWithLiquidity = categoriesWithLiquidity || [];
    
    // Si une catégorie active est sélectionnée et qu'elle n'est pas dans les 5 premières,
    // la remplacer par la dernière catégorie visible
    let visible = allCategoriesWithLiquidity.slice(0, maxVisibleCategories);
    
    if (activeCategory && allCategories) {
      // Trouver la catégorie active dans toutes les catégories
      const activeCategoryData = allCategories.find(cat => cat.slug === activeCategory);
      
      // Si la catégorie active existe et n'est pas déjà dans les visibles
      if (activeCategoryData && !visible.some(v => v.slug === activeCategory)) {
        // Remplacer la dernière catégorie visible par la catégorie active
        visible = [
          ...allCategoriesWithLiquidity.slice(0, maxVisibleCategories - 1),
          activeCategoryData
        ];
      }
    }
    
    const hidden = allCategories 
      ? allCategories.filter(cat => !visible.some(v => v._id === cat._id || v.slug === cat.slug))
      : [];
    
    return { visibleCategories: visible, hiddenCategories: hidden };
  }, [categoriesWithLiquidity, allCategories, activeCategory]);


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
        {/* Catégories - Scroll horizontal épuré avec détection d'overflow */}
        <div className="flex-1 max-w-[800px] overflow-hidden relative">
          {/* Gradient fade à droite pour indiquer qu'il y a plus de contenu */}
          {(hasOverflow || hiddenCategories.length > 0) && (
            <div className="absolute right-0 top-0 bottom-0 w-20 pointer-events-none z-10 bg-gradient-to-l from-background/95 via-background/80 to-transparent" />
          )}
          
          <div 
            ref={categoriesScrollRef}
            className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1"
            onScroll={() => {
              // Mettre à jour l'état du gradient si nécessaire
              if (categoriesScrollRef.current) {
                const { scrollWidth, clientWidth, scrollLeft } = categoriesScrollRef.current;
                const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 1;
                // Le gradient peut être ajusté selon la position du scroll
              }
            }}
          >
            {/* Bouton "Tous" */}
            <Link
              href="/"
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0",
                !activeCategory
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <SolarIcon icon="widget-4-bold" className="size-3.5" />
              <span>Tous</span>
            </Link>

            {/* Catégories - Limitées à 5 maximum en desktop XL */}
            {visibleCategories.length > 0 ? (
              visibleCategories.map((category) => {
                const isActive = activeCategory === category.slug;

                return (
                  <Link
                    key={category._id || category.slug}
                    href={`/?category=${category.slug}`}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0",
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
            ) : categoriesWithLiquidity === undefined ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground px-4 flex-shrink-0">
                <SolarIcon icon="loading" className="size-3.5 animate-spin" />
                <span>Chargement...</span>
              </div>
            ) : null}

            {/* Bouton "Voir plus" avec dropdown - Dans la ligne scrollable */}
            {hiddenCategories.length > 0 && (
              <Popover open={showMoreOpen} onOpenChange={setShowMoreOpen}>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0",
                      "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <span>Voir plus</span>
                    {hiddenCategories.length > 0 && (
                      <span className="text-xs opacity-70">({hiddenCategories.length})</span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-64 p-2" 
                  align="start"
                  side="bottom"
                  sideOffset={8}
                >
                  <ScrollArea className="max-h-[400px]">
                    <div className="space-y-1">
                      {hiddenCategories.map((category) => {
                        const isActive = activeCategory === category.slug;
                        return (
                          <Link
                            key={category._id || category.slug}
                            href={`/?category=${category.slug}`}
                            onClick={() => setShowMoreOpen(false)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all w-full",
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                          >
                            {category.icon && (
                              <SolarIcon
                                icon={category.icon}
                                className="size-4"
                                style={category.color && !isActive ? { color: category.color } : undefined}
                              />
                            )}
                            <span className="flex-1">{category.name}</span>
                            {isActive && (
                              <SolarIcon icon="check-circle-bold" className="size-4" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
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

