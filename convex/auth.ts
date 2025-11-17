import {
  createClient,
} from "@convex-dev/better-auth";
import { components } from "./_generated/api";
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
        const userId = await ctx.db.insert("users", {
          email: user.email,
          level: 1,
          reachRadius: 10, // Niveau 1 = 10km
          tags: [],
          links: [],
          profileCompletion: 0,
          premiumTier: "free",
          boostCredits: 0,
          createdAt: now,
          updatedAt: now,
        });

        // Initialize missions for new user
        // Note: We'll call this from the frontend after user creation
        // to avoid circular dependencies
      },
      onUpdate: async (ctx, newUser, oldUser) => {
        // Keep the user's email synced
        const appUser = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", oldUser.email))
          .first();

        if (appUser && appUser._id) {
          await ctx.db.patch(appUser._id as Id<"users">, {
            email: newUser.email,
          });
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

    // If no app user found, just return the Better Auth user data
    if (!appUser) {
      console.warn(`No app user found for email: ${betterAuthUser.email}`);
      return betterAuthUser;
    }

    // Merge app user data with Better Auth user data
    // Better Auth data takes precedence for fields like email, name, image
    return {
      ...appUser,
      ...betterAuthUser,
    };
  },
});