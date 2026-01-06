import { action } from "../_generated/server";
import { v } from "convex/values";

/**
 * Récupère les métadonnées d'une URL (Open Graph, Twitter Cards, etc.)
 * et extrait l'image de couverture
 */
export const fetchUrlMetadata = action({
  args: {
    url: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Fetch la page HTML
      const response = await fetch(args.url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        },
        // Timeout de 10 secondes
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        console.error(`Failed to fetch ${args.url}: ${response.status}`);
        return null;
      }

      const html = await response.text();

      // Parser les métadonnées Open Graph et Twitter Cards
      const metadata: {
        image?: string;
        title?: string;
        description?: string;
      } = {};

      // Open Graph (priorité)
      const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
      if (ogImageMatch && ogImageMatch[1]) {
        metadata.image = ogImageMatch[1].trim();
      }

      // Twitter Card (fallback)
      if (!metadata.image) {
        const twitterImageMatch = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);
        if (twitterImageMatch && twitterImageMatch[1]) {
          metadata.image = twitterImageMatch[1].trim();
        }
      }

      // Meta image standard (fallback)
      if (!metadata.image) {
        const metaImageMatch = html.match(/<meta\s+name=["']image["']\s+content=["']([^"']+)["']/i);
        if (metaImageMatch && metaImageMatch[1]) {
          metadata.image = metaImageMatch[1].trim();
        }
      }

      // Première image dans le contenu (dernier fallback)
      if (!metadata.image) {
        const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
        if (imgMatch && imgMatch[1]) {
          let imgSrc = imgMatch[1].trim();
          // Convertir les URLs relatives en absolues
          if (imgSrc.startsWith("//")) {
            imgSrc = `https:${imgSrc}`;
          } else if (imgSrc.startsWith("/")) {
            try {
              const urlObj = new URL(args.url);
              imgSrc = `${urlObj.protocol}//${urlObj.host}${imgSrc}`;
            } catch (e) {
              // URL invalide, ignorer
            }
          }
          metadata.image = imgSrc;
        }
      }

      // Nettoyer l'URL de l'image (enlever les paramètres de tracking, etc.)
      if (metadata.image) {
        try {
          const imageUrl = new URL(metadata.image);
          // Garder seulement les paramètres essentiels
          const cleanUrl = `${imageUrl.protocol}//${imageUrl.host}${imageUrl.pathname}`;
          metadata.image = cleanUrl;
        } catch (e) {
          // URL invalide, garder tel quel
        }
      }

      // Extraire aussi le titre et la description pour référence
      const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
      if (ogTitleMatch && ogTitleMatch[1]) {
        metadata.title = ogTitleMatch[1].trim();
      }

      const ogDescriptionMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
      if (ogDescriptionMatch && ogDescriptionMatch[1]) {
        metadata.description = ogDescriptionMatch[1].trim();
      }

      return metadata;
    } catch (error) {
      console.error(`Error fetching metadata for ${args.url}:`, error);
      return null;
    }
  },
});

