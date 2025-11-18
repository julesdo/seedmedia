"use client";

import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";

// Fonction de validation d'URL personnalisée
function validateUrl(url: string): boolean {
  if (!url) return false;
  
  // Vérifier si c'est une URL valide
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    // Si ce n'est pas une URL complète, vérifier si c'est un chemin relatif valide
    if (url.startsWith("/") || url.startsWith("./") || url.startsWith("../")) {
      return true;
    }
    // Vérifier si c'est un mailto: ou tel:
    if (url.startsWith("mailto:") || url.startsWith("tel:")) {
      return true;
    }
    return false;
  }
}

export function CustomLinkPlugin() {
  return <LinkPlugin validateUrl={validateUrl} />;
}

