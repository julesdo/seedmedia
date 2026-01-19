"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { SeedDisplay } from "@/components/ui/SeedDisplay";

/**
 * 🎯 FEATURE 2: LE TRADING - Portefeuille d'Opinions
 * Affiche les anticipations avec leurs prix actuels et profits/pertes réels
 */
export function OpinionPortfolio() {
  const portfolio = useQuery(api.trading.getUserPortfolio);

  if (portfolio === undefined) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (portfolio.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <SolarIcon icon="chart-2-bold" className="size-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Aucune position ouverte. Votez sur des décisions pour commencer à trader !
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculer le total des gains/pertes en Seeds
  const totalProfit = portfolio.reduce((sum, item) => sum + (item.profit || 0), 0);
  const totalInvested = portfolio.reduce((sum, item) => sum + (item.totalInvested || 0), 0);
  const totalValue = portfolio.reduce((sum, item) => sum + (item.estimatedValue || 0), 0);

  return (
    <div className="space-y-4">
      {/* Résumé du portefeuille */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <SolarIcon icon="chart-2-bold" className="size-5 text-primary" />
            Portefeuille d'Opinions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Investi</p>
              <motion.div
                key={totalInvested}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-lg font-bold"
              >
                <SeedDisplay amount={totalInvested} variant="inline" iconSize="size-4" />
              </motion.div>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Valeur Actuelle</p>
              <motion.div
                key={totalValue}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-lg font-bold"
              >
                <SeedDisplay amount={totalValue} variant="inline" iconSize="size-4" />
              </motion.div>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Profit/Perte</p>
              <motion.div
                key={totalProfit}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className={cn(
                  "text-xl font-bold",
                  totalProfit > 0 ? "text-green-500" : totalProfit < 0 ? "text-red-500" : "text-muted-foreground"
                )}
              >
                {totalProfit > 0 ? "+" : ""}
                <SeedDisplay amount={Math.abs(totalProfit)} variant="inline" iconSize="size-4" />
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des positions */}
      <div className="space-y-2">
        {portfolio.map((item) => {
          const { 
            anticipation, 
            decision, 
            currentPrice, 
            sharesOwned, 
            totalInvested, 
            estimatedValue, 
            profit, 
            profitPercentage,
            averageBuyPrice
          } = item;

          const isProfit = (profit || 0) > 0;

          return (
            <motion.div
              key={anticipation._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Link href={`/${decision.slug || decision._id}`}>
                <Card className={cn(
                  "hover:border-primary/50 transition-all cursor-pointer",
                  isProfit && "border-green-500/30 bg-green-500/5",
                  !isProfit && (profit || 0) < 0 && "border-red-500/30 bg-red-500/5"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      {/* Info décision */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                          {decision.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px]",
                              anticipation.position === "yes" 
                                ? "border-green-500/50 text-green-500" 
                                : "border-red-500/50 text-red-500"
                            )}
                          >
                            {anticipation.position === "yes" ? "OUI" : "NON"}
                          </Badge>
                          <span>•</span>
                          <span>{sharesOwned} action{sharesOwned > 1 ? "s" : ""}</span>
                          <span>•</span>
                          <span>Prix: <SeedDisplay amount={currentPrice || 0} variant="inline" iconSize="size-3" /></span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Prix moyen: <SeedDisplay amount={averageBuyPrice || 0} variant="inline" iconSize="size-3" />
                        </div>
                      </div>

                      {/* Profit/Perte */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <motion.div
                          key={profit}
                          initial={{ scale: 1.2 }}
                          animate={{ scale: 1 }}
                          className={cn(
                            "text-lg font-bold",
                            isProfit ? "text-green-500" : (profit || 0) < 0 ? "text-red-500" : "text-muted-foreground"
                          )}
                        >
                          {isProfit ? "+" : ""}
                          <SeedDisplay amount={Math.abs(profit || 0)} variant="inline" iconSize="size-4" />
                        </motion.div>
                        <div className="flex items-center gap-1 text-xs">
                          {isProfit ? (
                            <SolarIcon icon="arrow-up-bold" className="size-3 text-green-500" />
                          ) : (profit || 0) < 0 ? (
                            <SolarIcon icon="arrow-down-bold" className="size-3 text-red-500" />
                          ) : (
                            <SolarIcon icon="minus-bold" className="size-3 text-muted-foreground" />
                          )}
                          <span className={cn(
                            "text-[10px]",
                            isProfit ? "text-green-500" : (profit || 0) < 0 ? "text-red-500" : "text-muted-foreground"
                          )}>
                            {profitPercentage > 0 ? "+" : ""}{profitPercentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Valeur: <SeedDisplay amount={estimatedValue || 0} variant="inline" iconSize="size-3" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

