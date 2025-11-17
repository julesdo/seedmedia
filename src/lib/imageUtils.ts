import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

/**
 * Vérifie si une string est un storageId Convex (commence par "j")
 */
function isStorageId(str: string): boolean {
  // Les IDs Convex commencent généralement par une lettre minuscule
  // Les storageId sont des Id<"_storage">
  return /^[a-z0-9]+$/.test(str) && str.length > 20;
}

/**
 * Hook pour obtenir l'URL d'une image (convertit storageId en URL si nécessaire)
 */
export function useImageUrl(imageUrl: string | null | undefined): string | null | undefined {
  if (!imageUrl) return null;

  // Si c'est déjà une URL complète (commence par http/https), on la retourne telle quelle
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // Si c'est un storageId Convex (commence par une lettre et contient des caractères alphanumériques)
  // On le convertit en URL signée
  if (isStorageId(imageUrl)) {
    const fileUrl = useQuery(api.storage.getFileUrl, {
      storageId: imageUrl as Id<"_storage">,
    });
    return fileUrl || null;
  }

  // Sinon, on retourne tel quel (pourrait être une URL relative)
  return imageUrl;
}

/**
 * Fonction utilitaire pour obtenir l'URL d'une image (version synchrone pour composants non-hook)
 */
export function getImageUrl(imageUrl: string | null | undefined): string | null | undefined {
  if (!imageUrl) return null;

  // Si c'est déjà une URL complète, on la retourne telle quelle
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // Pour les storageId, il faut utiliser le hook useImageUrl dans un composant
  // Cette fonction retourne juste l'URL telle quelle pour les cas simples
  return imageUrl;
}

