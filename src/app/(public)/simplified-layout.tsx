"use client";

import { BottomNav } from "@/components/navigation/BottomNav";
import { SimplifiedHeader } from "@/components/navigation/SimplifiedHeader";
import { ReelHeader } from "@/components/navigation/ReelHeader";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { DesktopRightSidebar } from "@/components/layout/DesktopRightSidebar";
import { DesktopTopBar } from "@/components/layout/DesktopTopBar";
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
  const [isReelMode, setIsReelMode] = useState(false);
  
  // Précharger automatiquement les liens visibles dans le viewport
  usePrefetchVisibleLinks();

  // Détecter si on est en mode reels (body a la classe hide-mobile-nav)
  useEffect(() => {
    const checkReelMode = () => {
      setIsReelMode(document.body.classList.contains('hide-mobile-nav'));
    };
    
    checkReelMode();
    
    // Observer les changements de classe sur le body
    const observer = new MutationObserver(checkReelMode);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  // Note: Les barres de navigation sont cachées uniquement en mode feed reels
  // Cette logique est gérée dans DecisionDetailClient.tsx
  // Les barres restent visibles sur toutes les autres pages

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Reel Header - Affiché uniquement en mode reel (mobile) */}
      {isReelMode && (
        <div className="lg:hidden">
          <ReelHeader />
        </div>
      )}

      {/* Mobile Header - Caché si body a la classe hide-mobile-nav */}
      <div data-hide-on-reel className="lg:hidden sticky top-0 z-50">
        {/* Breaking News Banner (au-dessus du header) - Sticky */}
        <BreakingNewsBanner />
        {/* Header - Sticky juste en dessous du breaking news */}
        <SimplifiedHeader />
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
          "flex-1 pb-16 lg:pb-0 lg:pl-[244px] xl:pr-[319px] min-h-screen",
          isSubPage && "lg:[padding-top:calc(56px+var(--breaking-news-height,0px)+32px)]",
          !isSubPage && "lg:[padding-top:calc(var(--header-height,56px)+var(--breaking-news-height,0px))]" // Desktop seulement pour la page d'accueil
        )}
        style={{ 
          paddingTop: undefined // Mobile: pas de padding-top via style, géré par les classes Tailwind en desktop
        }}
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

