import { action } from "./_generated/server";
import { v } from "convex/values";

/**
 * Recherche d'images sur Pexels
 */
export const searchPexelsImages = action({
  args: {
    query: v.string(),
    perPage: v.optional(v.number()),
    orientation: v.optional(v.union(v.literal("landscape"), v.literal("portrait"), v.literal("square"))),
  },
  handler: async (ctx, args) => {
    const pexelsKey = process.env.PEXELS_API_KEY;
    if (!pexelsKey) {
      throw new Error("PEXELS_API_KEY n'est pas configurée");
    }

    const perPage = args.perPage || 20;
    const orientation = args.orientation || "landscape";

    try {
      const url = new URL("https://api.pexels.com/v1/search");
      url.searchParams.set("query", args.query);
      url.searchParams.set("per_page", perPage.toString());
      url.searchParams.set("orientation", orientation);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: pexelsKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur Pexels API: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        photos: (data.photos || []).map((photo: any) => ({
          id: photo.id,
          url: photo.src?.large || photo.src?.original || "",
          thumbnail: photo.src?.medium || photo.src?.small || "",
          photographer: photo.photographer || "Unknown",
          photographerUrl: photo.photographer_url || "",
          alt: photo.alt || args.query,
          width: photo.width || 0,
          height: photo.height || 0,
        })),
        totalResults: data.total_results || 0,
        page: data.page || 1,
        perPage: data.per_page || perPage,
      };
    } catch (error: any) {
      console.error("Erreur lors de la recherche Pexels:", error);
      throw new Error(`Erreur lors de la recherche d'images: ${error.message}`);
    }
  },
});

