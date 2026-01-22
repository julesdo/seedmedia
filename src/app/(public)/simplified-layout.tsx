"use client";

import { BottomNav } from "@/components/navigation/BottomNav";
import { SimplifiedHeader } from "@/components/navigation/SimplifiedHeader";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { DesktopRightSidebar } from "@/components/layout/DesktopRightSidebar";
import { DesktopTopBar } from "@/components/layout/DesktopTopBar";
import { MobileCategoriesBar } from "@/components/layout/MobileCategoriesBar";
import { BreakingNewsBanner } from "@/components/breaking-news/BreakingNewsBanner";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { usePrefetchVisibleLinks } from "@/hooks/useInstantNavigation";

/**
 * Layout simplifié pour Seed
 * - Mobile : BottomNav + Header
 * - Desktop : Sidebar gauche + Top Bar + Feed central + Sidebar droite (style Instagram)
 * - Maximum 2 clics pour toute action
 */
export function SimplifiedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSubPage = pathname !== "/";
  const [rightSidebarWidth, setRightSidebarWidth] = useState(319); // Largeur par défaut
  const [isMounted, setIsMounted] = useState(false); // Pour éviter l'erreur d'hydratation
  const [isMobile, setIsMobile] = useState(false); // Détecter si on est sur mobile
  
  // Précharger automatiquement les liens visibles dans le viewport
  usePrefetchVisibleLinks();

  // Marquer comme monté après l'hydratation et détecter mobile
  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Plus de mode reels - navigation toujours visible

  // Détecter la largeur de la sidebar droite (pour ajuster le padding du main)
  // Sur mobile, ne pas compter la sidebar (elle est cachée)
  useEffect(() => {
    const updateSidebarWidth = () => {
      // Ne pas compter la sidebar sur mobile (< 1024px)
      if (window.innerWidth < 1024) {
        setRightSidebarWidth(0);
        return;
      }
      
      const sidebar = document.querySelector('[data-sidebar="right"]');
      if (sidebar) {
        const width = sidebar.getBoundingClientRect().width;
        if (width > 0) {
          setRightSidebarWidth(width);
        } else {
          setRightSidebarWidth(0);
        }
      } else {
        setRightSidebarWidth(0);
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
  }, [pathname]); // Re-vérifier quand on change de page

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50">
        {/* Breaking News Banner (au-dessus du header) - Sticky */}
        <BreakingNewsBanner />
        {/* Header - Sticky juste en dessous du breaking news */}
        <SimplifiedHeader />
        {/* Barre de catégories mobile - Uniquement sur la page d'accueil */}
        {pathname === "/" && <MobileCategoriesBar />}
      </div>
      
      {/* Desktop Breaking News Banner */}
      <div className="hidden lg:block">
        <BreakingNewsBanner />
      </div>
      
      {/* Desktop Sidebar Left */}
      <DesktopSidebar />
      
      {/* Desktop Top Bar (sticky, collée à la sidebar) */}
      <DesktopTopBar />
      
      {/* Main Content */}
      <main 
        className={cn(
          "flex-1 pb-16 lg:pb-0 lg:pl-[244px] min-h-screen",
          isSubPage && "lg:[padding-top:calc(56px+var(--breaking-news-height,0px)+32px)]",
          !isSubPage && "lg:[padding-top:calc(var(--header-height,56px)+var(--breaking-news-height,0px))]" // Desktop seulement pour la page d'accueil
        )}
        style={isMounted && !isMobile ? { 
          // Ne pas appliquer le padding sur mobile (lg et plus seulement)
          paddingRight: rightSidebarWidth > 0 ? `${rightSidebarWidth}px` : undefined
        } : undefined}
      >
        {children}
      </main>
      
      {/* Desktop Sidebar Right */}
      <DesktopRightSidebar />
      
      {/* Mobile Bottom Navigation - Couleur par défaut */}
      <div className="lg:hidden">
        <BottomNav transparent={false} />
      </div>
    </div>
  );
}

