import {
  createClient,
} from "@convex-dev/better-auth";
import { components, internal } from "./_generated/api";
import { query } from "./_generated/server";
import { DataModel, Id } from "./_generated/dataModel";
import { asyncMap } from "convex-helpers";

export const betterAuthComponent = createClient(components.betterAuth, {
  verbose: false,
  triggers: {
    user: {
      onCreate: async (ctx, user) => {
        // Initialize user with Seed defaults
        const now = Date.now();
        // Récupérer les valeurs initiales depuis les règles configurables
        // Note: Dans un trigger onCreate, on ne peut pas utiliser les queries Convex
        // On utilise donc les valeurs par défaut directement
        const initialLevel = 1;
        const initialReachRadius = 10;

        const userData: any = {
          email: user.email,
          level: initialLevel,
          reachRadius: initialReachRadius,
          tags: [],
          links: [],
          profileCompletion: 0,
          premiumTier: "free",
          boostCredits: 0,
          credibilityScore: 0, // Score initial de crédibilité
          role: "explorateur", // Rôle par défaut
          expertiseDomains: [], // Domaines d'expertise (vide au départ)
          createdAt: now,
          updatedAt: now,
        };
        
        // Ajouter name et image seulement s'ils existent
        if (user.name) {
          userData.name = user.name;
        }
        if (user.image) {
          userData.image = user.image;
        }
        
        const userId = await ctx.db.insert("users", userData);

        // Initialize missions for new user (via internal mutation)
        // Note: We use internal mutation to avoid circular dependencies
        await ctx.runMutation(internal.missions.initializeMissionsInternal, {
          userId,
        });
      },
      onUpdate: async (ctx, newUser, oldUser) => {
        // Keep the user's email, name, and image synced
        const appUser = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", oldUser.email))
          .first();

        if (appUser && appUser._id) {
          const updates: any = {
            email: newUser.email,
            updatedAt: Date.now(),
          };
          
          // Synchroniser le nom si disponible dans Better Auth
          // On met à jour si Better Auth a un nom et que l'utilisateur n'en a pas ou a juste l'email
          if (newUser.name && appUser.email && typeof appUser.email === "string" && (!appUser.name || appUser.name === appUser.email.split("@")[0])) {
            updates.name = newUser.name;
          }
          
          // Synchroniser l'image si disponible dans Better Auth
          // On met à jour si Better Auth a une image et que l'utilisateur n'en a pas
          if (newUser.image && !appUser.image) {
            updates.image = newUser.image;
          }
          
          await ctx.db.patch(appUser._id as Id<"users">, updates);
        }
      },
      onDelete: async (ctx, user) => {
        // Delete the user's application data
        const appUser = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", user.email))
          .first();

        if (appUser && appUser._id) {
          // Delete the user's data (missions, reactions, comments, etc.)
          // Note: We could add cascade deletes here if needed
          // For now, we'll just delete the user
          await ctx.db.delete(appUser._id as Id<"users">);
        }
      },
    },
  },
});

// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    // Get user data from Better Auth - email, name, image, etc.
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      return null;
    }

    // Get user data from your application's database
    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    // If no app user found, return null instead of Better Auth user data
    // This ensures that components don't try to use an invalid _id
    if (!appUser) {
      console.warn(`No app user found for email: ${betterAuthUser.email}. User may not be fully initialized yet.`);
      return null;
    }

    // Merge app user data with Better Auth user data
    // Better Auth data takes precedence for fields like email, name, image
    // But we keep appUser._id which is the valid Convex ID
    return {
      ...appUser,
      ...betterAuthUser,
      _id: appUser._id, // Ensure we use the Convex _id, not Better Auth id
    };
  },
});