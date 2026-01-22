"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMemo } from "react";

/**
 * Hook optimisé pour charger toutes les données de trading en une seule fois
 * Réduit le nombre de requêtes et améliore les performances
 */
export function useTradingData(decisionId: Id<"decisions">) {
  // Charger toutes les données en parallèle
  const decision = useQuery(api.decisions.getDecisionById, { decisionId });
  const probability = useQuery(api.trading.getSingleOdds, { decisionId });
  const courseHistory = useQuery(api.trading.getDecisionCourseHistory, { decisionId });
  const investmentWindow = useQuery(api.trading.getInvestmentWindow, { decisionId });
  const topArguments = useQuery(api.topArguments.getAllArguments, { decisionId });
  const tradingPools = useQuery(api.trading.getTradingPools, { decisionId });

  // Mémoriser le résultat pour éviter les recalculs
  return useMemo(
    () => ({
      decision,
      probability,
      courseHistory,
      investmentWindow,
      topArguments,
      tradingPools,
      isLoading: !decision || probability === undefined || !courseHistory || !investmentWindow || !tradingPools,
    }),
    [decision, probability, courseHistory, investmentWindow, topArguments, tradingPools]
  );
}

