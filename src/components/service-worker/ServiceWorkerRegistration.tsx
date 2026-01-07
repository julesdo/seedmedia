"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Composant pour enregistrer le Service Worker
 * 
 * Enregistre automatiquement le Service Worker au chargement de l'app
 * Compatible avec ISR : Ne met en cache que les assets statiques
 * Force la mise à jour lors des déploiements
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Vérifier que le Service Worker est supporté
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let registration: ServiceWorkerRegistration | null = null;

    // Enregistrer le Service Worker avec cache busting
    navigator.serviceWorker
      .register("/sw.js", {
        scope: "/",
        // Ajouter un timestamp pour forcer la mise à jour
        updateViaCache: "none", // Ne jamais utiliser le cache du navigateur pour le SW
      })
      .then((reg) => {
        registration = reg;
        console.log("[SW] Service Worker enregistré avec succès:", reg.scope);

        // Vérifier les mises à jour immédiatement
        reg.update();

        // Vérifier les mises à jour périodiquement (toutes les 5 minutes)
        const updateInterval = setInterval(() => {
          reg.update();
        }, 5 * 60 * 1000); // 5 minutes

        // Écouter les mises à jour
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed") {
                if (navigator.serviceWorker.controller) {
                  // Nouveau Service Worker disponible, forcer l'activation
                  console.log("[SW] Nouvelle version disponible, activation...");
                  
                  // Envoyer un message au nouveau worker pour forcer skipWaiting
                  newWorker.postMessage({ type: "SKIP_WAITING" });
                  
                  // Attendre que le nouveau worker prenne le contrôle
                  navigator.serviceWorker.addEventListener("controllerchange", () => {
                    console.log("[SW] Nouveau Service Worker activé, rechargement...");
                    // Recharger la page pour utiliser les nouveaux assets
                    window.location.reload();
                  }, { once: true });
                } else {
                  // Premier chargement, le worker est déjà actif
                  console.log("[SW] Service Worker installé et actif");
                }
              }
            });
          }
        });

        // Nettoyer l'intervalle au démontage
        return () => clearInterval(updateInterval);
      })
      .catch((error) => {
        console.error("[SW] Erreur lors de l'enregistrement:", error);
      });

    // Écouter les messages du Service Worker
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "CACHE_UPDATED") {
        console.log("[SW] Cache mis à jour:", event.data);
      }
    });

    // Vérifier si le Service Worker est obsolète au chargement
    if (navigator.serviceWorker.controller) {
      // Vérifier si le Service Worker a changé (nouveau déploiement)
      navigator.serviceWorker.controller.addEventListener("statechange", () => {
        if (navigator.serviceWorker.controller?.state === "redundant") {
          console.log("[SW] Service Worker obsolète, rechargement...");
          window.location.reload();
        }
      });
    }
  }, []);

  return null; // Ce composant ne rend rien
}

