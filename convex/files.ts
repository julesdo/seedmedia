import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Génère une URL d'upload pour un fichier
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Récupère l'URL d'un fichier stocké
 */
export const getFileUrl = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

