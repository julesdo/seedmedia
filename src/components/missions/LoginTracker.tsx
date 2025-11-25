"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConvexAuth } from "convex/react";

/**
 * Composant qui track automatiquement les connexions pour les missions
 * Appelé une fois par session (utilise localStorage pour éviter les appels multiples)
 */
export function LoginTracker() {
  const { isAuthenticated } = useConvexAuth();
  const trackLogin = useMutation(api.missions.trackLogin);
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    // Ne tracker qu'une fois par session et seulement si authentifié
    if (isAuthenticated && !hasTrackedRef.current) {
      const sessionKey = `login_tracked_${Date.now()}`;
      const lastTracked = localStorage.getItem("last_login_track");
      const now = Date.now();
      
      // Tracker seulement si on n'a pas déjà tracké aujourd'hui (éviter les appels multiples)
      // On vérifie si le dernier track était il y a plus de 1 heure
      if (!lastTracked || now - parseInt(lastTracked) > 3600000) {
        trackLogin()
          .then(() => {
            localStorage.setItem("last_login_track", now.toString());
            hasTrackedRef.current = true;
          })
          .catch((error) => {
            console.error("Erreur tracking login:", error);
          });
      } else {
        hasTrackedRef.current = true;
      }
    }
  }, [isAuthenticated, trackLogin]);

  return null;
}

