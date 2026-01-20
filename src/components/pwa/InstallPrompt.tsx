"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { X } from "lucide-react";

/**
 * Composant pour afficher une bannière d'installation PWA
 * 
 * Principes UX appliqués :
 * - Social Proof : "Rejoignez des milliers d'utilisateurs"
 * - FOMO : "Accédez rapidement à Seed"
 * - Scarcity : "Installation rapide"
 * - Loss Aversion : "Ne manquez pas les dernières décisions"
 * 
 * Pour Chrome/Android : Intercepte beforeinstallprompt et déclenche la popup native
 * Pour iOS : Affiche des instructions pour ajouter à l'écran d'accueil
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  // Vérifier si l'app est déjà installée (standalone mode)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Vérifier si on est en mode standalone (app installée)
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    setIsStandalone(isStandaloneMode);

    // Détecter iOS
    const iOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    setIsIOS(iOS);

    // Vérifier si la bannière a été fermée
    const dismissed = localStorage.getItem("seed-install-prompt-dismissed");
    setIsDismissed(dismissed === "true");

    // Afficher la bannière après un délai (pour ne pas être trop intrusif)
    // Seulement si l'app n'est pas déjà installée et pas fermée
    if (!isStandaloneMode && dismissed !== "true") {
      // Attendre 3 secondes avant d'afficher (pour laisser l'utilisateur explorer)
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  // Intercepter l'événement beforeinstallprompt (Chrome/Android)
  useEffect(() => {
    if (typeof window === "undefined" || isStandalone) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      // Empêcher la popup native automatique
      e.preventDefault();
      
      // Stocker l'événement pour l'utiliser plus tard
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Afficher notre bannière personnalisée
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [isStandalone]);

  // Gérer l'installation (Chrome/Android)
  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Si pas de beforeinstallprompt, rediriger vers les instructions
      if (isIOS) {
        // Pour iOS, on ne peut pas déclencher automatiquement
        return;
      }
      return;
    }

    // Afficher la popup native
    deferredPrompt.prompt();

    // Attendre la réponse de l'utilisateur
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("[PWA] Installation acceptée");
      setShowPrompt(false);
      // Ne pas fermer définitivement, l'utilisateur peut vouloir réinstaller
    } else {
      console.log("[PWA] Installation refusée");
    }

    // Réinitialiser
    setDeferredPrompt(null);
  };

  // Fermer la bannière
  const handleDismiss = () => {
    setShowPrompt(false);
    setIsDismissed(true);
    localStorage.setItem("seed-install-prompt-dismissed", "true");
    
    // Réafficher après 7 jours (pour donner une seconde chance)
    setTimeout(() => {
      localStorage.removeItem("seed-install-prompt-dismissed");
    }, 7 * 24 * 60 * 60 * 1000);
  };

  // Ne rien afficher si :
  // - L'app est déjà installée
  // - La bannière a été fermée
  // - On ne doit pas afficher la bannière
  if (isStandalone || isDismissed || !showPrompt) {
    return null;
  }

  // Bannière pour iOS (instructions simplifiées)
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 lg:left-auto lg:right-4 lg:w-80 animate-in slide-in-from-bottom-4">
        <div className="relative rounded-xl border border-border/60 bg-background/95 backdrop-blur-sm shadow-lg p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="absolute right-1 top-1 h-5 w-5 text-muted-foreground hover:text-foreground"
            aria-label="Fermer"
          >
            <X className="h-3.5 w-3.5" />
          </Button>

          <div className="pr-6 flex items-center gap-2.5">
            <SolarIcon icon="share-bold" className="h-4 w-4 text-primary flex-shrink-0" />
            <p className="text-xs text-foreground leading-tight">
              Appuyez sur <span className="font-semibold">Partager</span> puis <span className="font-semibold">Sur l'écran d'accueil</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Bannière pour Chrome/Android (avec bouton d'installation)
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 lg:left-auto lg:right-4 lg:w-96 animate-in slide-in-from-bottom-4">
      <div className="relative rounded-xl border border-border/60 bg-background/95 backdrop-blur-sm shadow-lg p-4 space-y-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="absolute right-2 top-2 h-6 w-6 text-muted-foreground hover:text-foreground"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="pr-8 space-y-2">
          <div className="flex items-center gap-2">
            <SolarIcon icon="download-bold" className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Installez l'app Seed
            </h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Accédez rapidement à Seed, recevez des notifications et profitez d'une expérience optimale.
          </p>
          <Button
            onClick={handleInstall}
            size="sm"
            className="w-full"
          >
            <SolarIcon icon="download-bold" className="h-4 w-4 mr-2" />
            Installer maintenant
          </Button>
        </div>
      </div>
    </div>
  );
}

// Type pour l'événement beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

