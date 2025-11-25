"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Hook pour récupérer les points de crédibilité estimés pour chaque action
 * Utilise les règles configurables pour calculer les points dynamiquement
 */
export function useCredibilityPoints() {
  const points = useQuery(api.credibility.getCredibilityPoints);

  // Valeurs par défaut si les règles ne sont pas encore chargées
  const defaultPoints = {
    articlePublished: 10,
    sourceAdded: 4,
    correctionApproved: 5,
    voteReceived: 1,
    verificationDone: 2,
    expertVerificationDone: 3,
    missionCompleted: 2,
  };

  return points || defaultPoints;
}

