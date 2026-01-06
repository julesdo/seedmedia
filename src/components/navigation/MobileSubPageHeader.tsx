"use client";

import { useRouter, usePathname } from "next/navigation";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

// Mapping des routes vers les noms de pages et leurs icônes
const pageConfig: Record<string, { name: string; icon: string }> = {
  "/settings": { name: "Paramètres", icon: "settings-bold" },
  "/profile": { name: "Profil", icon: "user-bold" },
  "/notifications": { name: "Notifications", icon: "bell-bold" },
  "/trending": { name: "Tendances", icon: "fire-bold" },
  "/saved": { name: "Sauvegardés", icon: "bookmark-bold" },
  "/map": { name: "Carte", icon: "map-point-bold" },
  "/bots": { name: "Bots", icon: "smile-square-bold" },
};

// Fonction pour obtenir le nom et l'icône de la page à partir du pathname
function getPageConfig(pathname: string): { name: string; icon: string } {
  // Vérifier d'abord les routes exactes
  if (pageConfig[pathname]) {
    return pageConfig[pathname];
  }

  // Vérifier les routes dynamiques (ex: /u/[username])
  if (pathname.startsWith("/u/")) {
    const username = pathname.split("/u/")[1];
    return {
      name: username ? `@${username}` : "Profil",
      icon: "user-bold",
    };
  }

  // Si c'est un slug de décision, extraire le titre depuis l'URL ou utiliser un nom générique
  if (pathname.startsWith("/") && pathname !== "/" && !pathname.includes("/")) {
    // C'est probablement un slug de décision
    return { name: "Détail", icon: "document-bold" };
  }

  // Par défaut, utiliser le pathname en capitalisant la première lettre
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0) {
    return {
      name: segments[segments.length - 1]
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      icon: "document-bold",
    };
  }

  return { name: "Page", icon: "document-bold" };
}

export function MobileSubPageHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { name: pageName, icon } = getPageConfig(pathname);
  const { user: currentUser, isAuthenticated } = useUser();

  // Détecter si on est sur un profil utilisateur
  const isUserProfile = pathname.startsWith("/u/");
  const profileUsername = isUserProfile ? pathname.split("/u/")[1] : null;
  
  // Récupérer les infos du profil si on est sur un profil
  const profileUser = useQuery(
    api.users.getUserByUsername,
    profileUsername ? { username: profileUsername } : "skip"
  );

  // Ne pas afficher sur la page d'accueil
  if (pathname === "/") {
    return null;
  }

  // Fonction pour partager le profil
  const handleShare = async () => {
    if (!profileUsername) return;
    const url = `${window.location.origin}/u/${profileUsername}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié", {
        description: "L'URL du profil a été copiée dans le presse-papiers",
      });
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Erreur", {
        description: "Impossible de copier le lien",
      });
    }
  };

  // Fonction pour modifier le profil
  const handleEdit = () => {
    router.push("/settings");
  };

  const isOwnProfile = isAuthenticated && currentUser?._id === profileUser?._id;

  return (
    <header className="sticky top-0 z-50 lg:hidden border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3 px-4 h-14">
        {/* Bouton Retour */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-9 w-9 rounded-lg hover:bg-muted/50"
        >
          <SolarIcon icon="alt-arrow-left-bold" className="size-5 text-foreground" />
        </Button>

        {/* Icône avec cadre bleu dégradé */}
        <div className="size-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
          <SolarIcon icon={icon} className="size-4 text-white" />
        </div>

        {/* Nom de la page */}
        <h1 className="flex-1 text-base font-semibold text-foreground truncate">
          {pageName}
        </h1>

        {/* Boutons d'action pour les profils */}
        {isUserProfile && (
          <div className="flex items-center gap-1 shrink-0">
            {/* Bouton Partager - Toujours visible si username existe */}
            {profileUsername && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                className="h-9 w-9 rounded-lg hover:bg-muted/50"
              >
                <SolarIcon icon="share-bold" className="size-5 text-foreground" />
              </Button>
            )}
            
            {/* Bouton Modifier - Seulement si c'est son propre profil */}
            {isOwnProfile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEdit}
                className="h-9 w-9 rounded-lg hover:bg-muted/50"
              >
                <SolarIcon icon="settings-bold" className="size-5 text-foreground" />
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

