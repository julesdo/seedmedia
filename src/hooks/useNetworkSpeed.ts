"use client";

import { useState, useEffect } from "react";

interface NetworkSpeedInfo {
  effectiveType: "slow-2g" | "2g" | "3g" | "4g" | null;
  downlink: number | null;
  rtt: number | null;
  saveData: boolean;
}

/**
 * Hook pour détecter la vitesse du réseau et adapter le chargement des ressources
 */
export function useNetworkSpeed(): NetworkSpeedInfo {
  const [networkInfo, setNetworkInfo] = useState<NetworkSpeedInfo>({
    effectiveType: null,
    downlink: null,
    rtt: null,
    saveData: false,
  });

  useEffect(() => {
    // Vérifier si l'API Network Information est disponible
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (!connection) {
      // Par défaut, on considère une connexion rapide si l'API n'est pas disponible
      setNetworkInfo({
        effectiveType: "4g",
        downlink: 10, // Mbps par défaut
        rtt: 50, // ms par défaut
        saveData: false,
      });
      return;
    }

    const updateNetworkInfo = () => {
      setNetworkInfo({
        effectiveType: connection.effectiveType || null,
        downlink: connection.downlink || null,
        rtt: connection.rtt || null,
        saveData: connection.saveData || false,
      });
    };

    // Mettre à jour immédiatement
    updateNetworkInfo();

    // Écouter les changements de connexion
    connection.addEventListener("change", updateNetworkInfo);

    return () => {
      connection.removeEventListener("change", updateNetworkInfo);
    };
  }, []);

  return networkInfo;
}

/**
 * Détermine la qualité d'image à charger selon la vitesse du réseau
 */
export function getImageQuality(networkInfo: NetworkSpeedInfo): "low" | "medium" | "high" | "original" {
  // Si saveData est activé, charger la version la plus légère
  if (networkInfo.saveData) {
    return "low";
  }

  // Déterminer selon effectiveType
  switch (networkInfo.effectiveType) {
    case "slow-2g":
    case "2g":
      return "low";
    case "3g":
      return networkInfo.downlink && networkInfo.downlink > 1.5 ? "medium" : "low";
    case "4g":
      return networkInfo.downlink && networkInfo.downlink > 5 ? "high" : "medium";
    default:
      // Par défaut, charger medium pour économiser de la bande passante
      return "medium";
  }
}

