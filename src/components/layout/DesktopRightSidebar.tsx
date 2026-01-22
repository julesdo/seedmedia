"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link } from "next-view-transitions";
import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import { DailyLoginWidget } from "@/components/widgets/DailyLoginWidget";
import { LeaderboardWidget } from "@/components/widgets/LeaderboardWidget";
import { ShopPromoWidget } from "@/components/widgets/ShopPromoWidget";
import { TopPerformersWidget } from "@/components/widgets/TopPerformersWidget";
import { OpportunityAlertWidget } from "@/components/widgets/OpportunityAlertWidget";
import { YourPerformanceWidget } from "@/components/widgets/YourPerformanceWidget";
import { TrendingNowWidget } from "@/components/widgets/TrendingNowWidget";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from 'next-intl';
import { usePathname } from "next/navigation";
import { TradingWidget } from "@/components/decisions/TradingWidget";
import { RelatedNewsWidget } from "@/components/widgets/RelatedNewsWidget";
import { RelatedPredictionsWidget } from "@/components/widgets/RelatedPredictionsWidget";

/**
 * Sidebar droite - Style Instagram Desktop (Suggestions)
 * Affiche le widget d'achat si on est sur une page de détail de décision
 */
export function DesktopRightSidebar() {
  const t = useTranslations('widgets.sidebar');
  const pathname = usePathname();
  
  // Routes exclues (qui ne sont PAS des pages de détail de décision)
  const excludedRoutes = [
    "/", "/portfolio", "/challenges", "/profile", "/notifications", 
    "/stats", "/bots", "/sign-in", "/sign-up", "/api", "/_next", "/settings",
    "/shop", "/about", "/help", "/u"
  ];
  
  // Pour une route dynamique [slug], le pathname sera "/mon-slug"
  // On extrait le slug en enlevant le "/" initial
  const slug = pathname && pathname !== "/" && !excludedRoutes.some(route => pathname === route || pathname.startsWith(route + "/"))
    ? pathname.slice(1) // Enlever le "/" initial
    : null;
  
  // Essayer de charger la décision avec ce slug
  // Si la décision existe, c'est une page de détail
  const decision = useQuery(
    api.decisions.getDecisionBySlug,
    slug ? { slug } : "skip"
  );
  
  // On est sur une page de détail si :
  // 1. On a un slug (pas null)
  // 2. La décision existe (decision !== null)
  // 3. La décision n'est pas en cours de chargement (decision !== undefined)
  const isDecisionDetailPage = slug !== null && decision !== undefined && decision !== null;
  
  // Récupérer les décisions "hot" pour les suggestions
  const hotDecisions = useQuery(api.decisions.getHotDecisions, { limit: 5 });

  // Déterminer si on doit afficher le widget d'achat
  // On affiche le widget si on est sur une page de détail ET la décision n'est pas résolue
  const shouldShowTradingWidget = isDecisionDetailPage && decision && decision.status !== "resolved";
  
  // Si on a un slug mais la décision n'est pas encore chargée, on attend
  const isLoadingDecision = slug !== null && decision === undefined;

  // Largeur dynamique : plus large sur les pages de détail pour le widget d'achat
  const sidebarWidth = shouldShowTradingWidget ? "w-[400px]" : "w-[319px]";

  return (
    <aside 
      data-sidebar="right" 
      className={cn(
        "hidden xl:flex flex-col border-l border-border/50 bg-background fixed right-0 top-0 bottom-0 overflow-y-auto z-20 transition-all duration-300",
        sidebarWidth
      )}
    >
      <div className="flex flex-col px-6 pt-6 pb-6">
        
        {/* Widget d'achat - SEULEMENT si on est sur une page de détail */}
        {isLoadingDecision ? (
          <div className="flex items-center justify-center py-12">
            <SolarIcon icon="loading" className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : shouldShowTradingWidget ? (
          <div className="space-y-6">
            <TradingWidget decisionId={decision._id} />
            <RelatedNewsWidget decisionId={decision._id} />
            <RelatedPredictionsWidget decisionId={decision._id} />
          </div>
        ) : (
          <>
            {/* Suggestions de décisions - SEULEMENT si PAS sur une page de détail */}
            {hotDecisions && hotDecisions.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    {t('importantDecisions')}
                  </h3>
                  <Button variant="ghost" size="sm" className="text-xs h-auto p-0">
                    {t('seeAll')}
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {hotDecisions.slice(0, 5).map((decision) => (
                    <Link
                      key={decision._id}
                      href={`/${decision.slug}`}
                      className="flex items-center gap-3 hover:opacity-70 transition-opacity group"
                    >
                      <div className="relative size-11 rounded-full overflow-hidden bg-muted flex-shrink-0 ring-2 ring-primary/20">
                        {decision.imageUrl ? (
                          <img
                            src={decision.imageUrl}
                            alt={decision.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-primary/20 to-primary/5">
                            <SolarIcon
                              icon="document-text-bold"
                              className="size-5 text-primary/60"
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {decision.decider}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {decision.title.length > 40
                            ? `${decision.title.substring(0, 40)}...`
                            : decision.title}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Promotion boutique */}
            <div className="mb-6">
              <ShopPromoWidget />
            </div>

            {/* Widgets pertinents - Optimisés pour l'engagement UX */}
            <div className="space-y-6">
              {/* Daily Login - En haut pour visibilité */}
              <DailyLoginWidget />
              
              <Separator />
              
              {/* Vos performances - Gamification */}
              <YourPerformanceWidget />
              
              <Separator />
              
              {/* Top Performers - Social Proof + FOMO */}
              <TopPerformersWidget />
              
              <Separator />
              
              {/* Trending Now - FOMO */}
              <TrendingNowWidget />
              
              <Separator />
              
              {/* Opportunity Alert - Scarcity + FOMO */}
              <OpportunityAlertWidget />
              
              <Separator />
              
              {/* Leaderboard - Social Proof */}
              <LeaderboardWidget />
            </div>
          </>
        )}

      </div>
    </aside>
  );
}

