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
        try {
          // Vérifier d'abord si l'utilisateur n'existe pas déjà (éviter les doublons)
          const existingUser = await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", user.email))
            .first();

          if (existingUser) {
            // L'utilisateur existe déjà, ne rien faire
            console.log(`User ${user.email} already exists in Convex, skipping creation`);
            return;
          }

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
          console.log(`Created user ${user.email} in Convex with ID: ${userId}`);

          // Initialize missions for new user (via internal mutation)
          // Note: We use internal mutation to avoid circular dependencies
          try {
            await ctx.runMutation(internal.missions.initializeMissionsInternal, {
              userId,
            });
          } catch (missionError) {
            // Ignorer les erreurs d'initialisation des missions (peut ne pas exister ou échouer)
            // Mais on continue car l'utilisateur est créé
            console.error(`Error initializing missions for user ${user.email}:`, missionError);
          }
        } catch (error) {
          // Logger l'erreur mais ne pas la propager pour éviter de bloquer la création dans Better Auth
          console.error(`Error in onCreate trigger for user ${user.email}:`, error);
          // Ne pas throw pour éviter de bloquer la création dans Better Auth
        }
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
          
          // Synchroniser le nom UNIQUEMENT si l'utilisateur n'a pas de nom personnalisé
          // On vérifie si le nom actuel est celui par défaut (email sans @domain) ou vide
          const emailPrefix = appUser.email && typeof appUser.email === "string" 
            ? appUser.email.split("@")[0] 
            : "";
          const isDefaultName = !appUser.name || appUser.name === emailPrefix;
          
          // Ne mettre à jour le nom que si c'est un nom par défaut ou vide
          // Cela permet à l'utilisateur de garder son nom personnalisé même si Better Auth change
          if (newUser.name && isDefaultName) {
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
    // Prioriser le nom de appUser s'il existe et est différent de celui de Better Auth
    // Cela permet à l'utilisateur de modifier son nom dans l'app même si Better Auth en a un
    const displayName = appUser.name && appUser.name !== betterAuthUser.name 
      ? appUser.name 
      : (betterAuthUser.name || appUser.name);

    return {
      ...appUser,
      ...betterAuthUser,
      name: displayName, // Utiliser le nom prioritaire
      _id: appUser._id, // Ensure we use the Convex _id, not Better Auth id
    };
  },
});