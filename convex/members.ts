import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";

/**
 * Retire un membre d'une organization
 */
export const removeMember = mutation({
  args: {
    organizationId: v.id("organizations"),
    userId: v.id("users"),
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

    // Vérifier les permissions
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("organizationId", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("userId"), appUser._id))
      .first();

    if (!membership || (!membership.canEdit && membership.role !== "owner")) {
      throw new Error("Unauthorized");
    }

    // Ne pas permettre de retirer le propriétaire
    const targetMember = await ctx.db
      .query("organizationMembers")
      .withIndex("organizationId", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!targetMember) {
      throw new Error("Member not found");
    }

    if (targetMember.role === "owner") {
      throw new Error("Cannot remove owner");
    }

    // Supprimer le membre
    await ctx.db.delete(targetMember._id);

    return { success: true };
  },
});

/**
 * Met à jour le rôle d'un membre
 */
export const updateMemberRole = mutation({
  args: {
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("member")),
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

    // Vérifier les permissions (seul owner ou admin peut modifier)
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("organizationId", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("userId"), appUser._id))
      .first();

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      throw new Error("Unauthorized");
    }

    // Ne pas permettre de modifier le rôle du propriétaire
    const targetMember = await ctx.db
      .query("organizationMembers")
      .withIndex("organizationId", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!targetMember) {
      throw new Error("Member not found");
    }

    if (targetMember.role === "owner") {
      throw new Error("Cannot change owner role");
    }

    // Mettre à jour le rôle et les permissions
    await ctx.db.patch(targetMember._id, {
      role: args.role,
      canInvite: args.role === "admin",
      canEdit: args.role === "admin",
      canDelete: false,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Quitte une organization
 */
export const leaveOrganization = mutation({
  args: {
    organizationId: v.id("organizations"),
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

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("organizationId", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("userId"), appUser._id))
      .first();

    if (!membership) {
      throw new Error("Not a member");
    }

    // Ne pas permettre au propriétaire de quitter (doit transférer ou supprimer)
    if (membership.role === "owner") {
      throw new Error("Owner cannot leave organization. Transfer ownership or delete organization.");
    }

    await ctx.db.delete(membership._id);

    return { success: true };
  },
});

