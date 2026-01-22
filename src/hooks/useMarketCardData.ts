"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMemo } from "react";
import { useConvexAuth } from "convex/react";

/**
 * Hook optimisé pour charger toutes les données d'une MarketCard
 * Réduit le nombre de requêtes et améliore les performances
 */
export function useMarketCardData(decisionId: Id<"decisions">) {
  const { isAuthenticated } = useConvexAuth();
  
  // Charger toutes les données en parallèle
  const decisionData = useQuery(api.decisions.getDecisionById, { decisionId });
  const probability = useQuery(api.trading.getSingleOdds, { decisionId });
  const tradingPools = useQuery(api.trading.getTradingPools, { decisionId });
  const courseHistory = useQuery(api.trading.getDecisionCourseHistory, { decisionId });
  const investmentWindow = useQuery(api.trading.getInvestmentWindow, { decisionId });
  const userBalance = useQuery(
    api.users.getCurrentUser,
    isAuthenticated ? {} : "skip"
  );

  // Mémoriser le résultat pour éviter les recalculs
  return useMemo(
    () => ({
      decisionData,
      probability,
      tradingPools,
      courseHistory,
      investmentWindow,
      userBalance,
      isLoading: !decisionData || probability === undefined || !tradingPools || !courseHistory || !investmentWindow,
    }),
    [decisionData, probability, tradingPools, courseHistory, investmentWindow, userBalance]
  );
}

