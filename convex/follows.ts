import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";

/**
 * Vérifie si l'utilisateur suit une organisation
 */
export const isFollowing = query({
  args: {
    targetType: v.union(v.literal("user"), v.literal("organization"), v.literal("tag")),
    targetId: v.string(),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      return false;
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      return false;
    }

    const follow = await ctx.db
      .query("follows")
      .withIndex("targetType_targetId", (q) =>
        q.eq("targetType", args.targetType).eq("targetId", args.targetId)
      )
      .filter((q) => q.eq(q.field("userId"), appUser._id))
      .first();

    return !!follow;
  },
});

/**
 * Suit ou ne suit plus une organisation, utilisateur ou tag
 */
export const toggleFollow = mutation({
  args: {
    targetType: v.union(v.literal("user"), v.literal("organization"), v.literal("tag")),
    targetId: v.string(),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      throw new Error("Not authenticated");
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      throw new Error("User not found");
    }

    // Vérifier si le follow existe déjà
    const existingFollow = await ctx.db
      .query("follows")
      .withIndex("targetType_targetId", (q) =>
        q.eq("targetType", args.targetType).eq("targetId", args.targetId)
      )
      .filter((q) => q.eq(q.field("userId"), appUser._id))
      .first();

    if (existingFollow) {
      // Ne plus suivre
      await ctx.db.delete(existingFollow._id);
      return { success: true, following: false };
    } else {
      // Suivre
      await ctx.db.insert("follows", {
        userId: appUser._id,
        targetType: args.targetType,
        targetId: args.targetId,
        createdAt: Date.now(),
      });
      return { success: true, following: true };
    }
  },
});

/**
 * Récupère les followers d'une organisation
 */
export const getOrganizationFollowers = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("targetType_targetId", (q) =>
        q.eq("targetType", "organization").eq("targetId", args.organizationId)
      )
      .collect();

    const followers = await Promise.all(
      follows.map(async (follow) => {
        const user = await ctx.db.get(follow.userId);
        return user
          ? {
              _id: user._id,
              email: user.email,
              name: user.name,
              image: user.image,
              credibilityScore: user.credibilityScore || 0,
              level: user.level || 1,
              createdAt: follow.createdAt,
            }
          : null;
      })
    );

    return followers
      .filter((f): f is NonNullable<typeof f> => f !== null)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Récupère le nombre de followers d'un utilisateur
 */
export const getUserFollowersCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("targetType_targetId", (q) =>
        q.eq("targetType", "user").eq("targetId", args.userId)
      )
      .collect();

    return follows.length;
  },
});

/**
 * Récupère le nombre d'utilisateurs suivis par un utilisateur
 */
export const getUserFollowingCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const follows = await ctx.db
      .query("follows")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("targetType"), "user"))
      .collect();

    return follows.length;
  },
});

