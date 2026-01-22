"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Composant pour précharger l'image LCP (Largest Contentful Paint)
 * Précharge l'image de la première décision visible sur la homepage
 * pour améliorer le LCP
 * 
 * NOTE: Ne s'exécute que sur la homepage pour éviter de précharger
 * des images qui ne sont pas la LCP réelle sur d'autres pages
 */
export function LCPImagePreloader() {
  // Vérifier qu'on est sur la homepage
  const isHomePage = typeof window !== "undefined" && window.location.pathname === "/";
  
  // Récupérer les 3 premières décisions pour précharger leurs images (LCP)
  const firstDecisions = useQuery(
    api.decisions.getDecisions,
    isHomePage ? { limit: 3 } : "skip"
  );

  useEffect(() => {
    // Ne précharger que sur la homepage
    if (!isHomePage) return;
    if (!firstDecisions || firstDecisions.length === 0) return;

    const links: HTMLLinkElement[] = [];

    // Précharger les 3 premières images pour améliorer le LCP
    firstDecisions.forEach((decision, index) => {
      if (!decision.imageUrl) return;

      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = decision.imageUrl;
      // La première image a la priorité la plus haute
      link.setAttribute("fetchPriority", index === 0 ? "high" : "low");
      document.head.appendChild(link);
      links.push(link);
    });

    // Nettoyer après préchargement
    return () => {
      links.forEach((link) => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      });
    };
  }, [firstDecisions, isHomePage]);

  return null; // Ce composant ne rend rien
}

