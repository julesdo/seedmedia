"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface GainEntry {
  id: string;
  points: number;
  action: string;
}

const ACTION_LABELS: Record<string, string> = {
  article_published: "Article publié",
  source_added: "Source ajoutée",
  vote_received: "Vote reçu",
  correction_approved: "Correction approuvée",
  expertise_granted: "Expertise accordée",
  verification_done: "Vérification effectuée",
  recalculation: "Recalcul automatique",
};

export function useCredibilityGain(userId?: string) {
  const [gains, setGains] = useState<GainEntry[]>([]);
  const previousScoreRef = useRef<number | null>(null);
  const historyRef = useRef<Set<string>>(new Set());

  const user = useQuery(api.auth.getCurrentUser);
  const currentUserId = userId || user?._id;
  
  const history = useQuery(
    api.credibility.getCredibilityHistory,
    currentUserId ? { userId: currentUserId, limit: 5 } : "skip"
  );

  const currentScore = user?.credibilityScore || 0;

  useEffect(() => {
    if (!history || history.length === 0) {
      previousScoreRef.current = currentScore;
      return;
    }

    // Détecter les nouveaux gains
    const newGains: GainEntry[] = [];
    
    history.forEach((entry) => {
      const entryId = entry._id;
      
      // Ignorer si déjà traité
      if (historyRef.current.has(entryId)) {
        return;
      }

      // Ignorer les recalculs automatiques
      if (entry.actionType === "recalculation") {
        historyRef.current.add(entryId);
        return;
      }

      // Ignorer si pas de gain positif
      if (entry.pointsGained <= 0) {
        historyRef.current.add(entryId);
        return;
      }

      // Nouveau gain détecté
      const actionLabel = ACTION_LABELS[entry.actionType] || "Action";
      newGains.push({
        id: entryId,
        points: entry.pointsGained,
        action: actionLabel,
      });

      historyRef.current.add(entryId);
    });

    // Afficher les nouveaux gains
    if (newGains.length > 0) {
      setGains((prev) => [...prev, ...newGains]);
    }

    previousScoreRef.current = currentScore;
  }, [history, currentScore]);

  const removeGain = (id: string) => {
    setGains((prev) => prev.filter((gain) => gain.id !== id));
  };

  return { gains, removeGain };
}

