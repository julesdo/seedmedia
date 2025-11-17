import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";

/**
 * Récupère tous les comptes d'un utilisateur
 */
export const getUserAccounts = query({
  args: {},
  handler: async (ctx) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      return [];
    }

    // Trouver l'utilisateur dans la table users
    let appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    // Si l'utilisateur n'existe pas encore, retourner un tableau vide
    // (il sera créé automatiquement par ensureUserExists)
    if (!appUser) {
      return [];
    }

    // Récupérer tous les comptes de cet utilisateur
    const accounts = await ctx.db
      .query("userAccounts")
      .withIndex("userId", (q) => q.eq("userId", appUser._id))
      .collect();

    // Si aucun compte n'existe, créer un compte par défaut
    if (accounts.length === 0) {
      // Le compte par défaut sera créé automatiquement lors de la première utilisation
      // via createDefaultAccount
      return [];
    }

    // Mapper les comptes avec les données Better Auth
    return accounts.map((account) => ({
      id: account._id,
      name: account.name,
      email: account.accountEmail,
      image: account.image || betterAuthUser.image || null,
      type: account.type,
      isDefault: account.isDefault,
      level: account.level,
      region: account.region,
      premiumTier: account.premiumTier,
    }));
  },
});

/**
 * Crée un compte par défaut pour un nouvel utilisateur
 */
export const createDefaultAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      throw new Error("Not authenticated");
    }

    // Trouver l'utilisateur dans la table users
    let appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    // Si l'utilisateur n'existe pas, le créer
    if (!appUser) {
      const now = Date.now();
      const userId = await ctx.db.insert("users", {
        email: betterAuthUser.email,
        level: 1,
        reachRadius: 10,
        tags: [],
        links: [],
        profileCompletion: 0,
        premiumTier: "free",
        boostCredits: 0,
        createdAt: now,
        updatedAt: now,
      });
      appUser = await ctx.db.get(userId);
      if (!appUser) {
        throw new Error("Failed to create user");
      }
    }

    // Vérifier si un compte par défaut existe déjà
    const existingDefault = await ctx.db
      .query("userAccounts")
      .withIndex("userId", (q) => q.eq("userId", appUser._id))
      .filter((q) => q.eq(q.field("isDefault"), true))
      .first();

    if (existingDefault) {
      return existingDefault._id;
    }

    // Créer le compte par défaut
    const now = Date.now();
    const accountId = await ctx.db.insert("userAccounts", {
      userId: appUser._id,
      accountEmail: betterAuthUser.email,
      name: betterAuthUser.name || "Mon compte",
      type: "personal",
      level: appUser.level,
      reachRadius: appUser.reachRadius,
      region: appUser.region,
      location: appUser.location,
      bio: appUser.bio,
      tags: appUser.tags,
      links: appUser.links,
      profileCompletion: appUser.profileCompletion,
      premiumTier: appUser.premiumTier,
      boostCredits: appUser.boostCredits,
      image: betterAuthUser.image || undefined,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    });

    return accountId;
  },
});

/**
 * Crée un nouveau compte pour l'utilisateur
 */
export const createAccount = mutation({
  args: {
    name: v.string(),
    accountEmail: v.string(),
    type: v.union(
      v.literal("personal"),
      v.literal("professional"),
      v.literal("organization")
    ),
    region: v.optional(v.string()),
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

    const now = Date.now();
    const accountId = await ctx.db.insert("userAccounts", {
      userId: appUser._id,
      accountEmail: args.accountEmail,
      name: args.name,
      type: args.type,
      level: 1,
      reachRadius: 10,
      region: args.region,
      tags: [],
      links: [],
      profileCompletion: 0,
      premiumTier: "free",
      boostCredits: 0,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    });

    return accountId;
  },
});

/**
 * Récupère un compte spécifique
 */
export const getAccount = query({
  args: { accountId: v.id("userAccounts") },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      return null;
    }

    const account = await ctx.db.get(args.accountId);
    if (!account) {
      return null;
    }

    // Vérifier que le compte appartient à l'utilisateur
    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser || account.userId !== appUser._id) {
      return null;
    }

    return {
      id: account._id,
      name: account.name,
      email: account.accountEmail,
      image: account.image || betterAuthUser.image || null,
      type: account.type,
      isDefault: account.isDefault,
      level: account.level,
      region: account.region,
      premiumTier: account.premiumTier,
      bio: account.bio,
      tags: account.tags,
      links: account.links,
      location: account.location,
    };
  },
});

/**
 * Met à jour un compte
 */
export const updateAccount = mutation({
  args: {
    accountId: v.id("userAccounts"),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    region: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    links: v.optional(
      v.array(
        v.object({
          type: v.string(),
          url: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      throw new Error("Not authenticated");
    }

    const account = await ctx.db.get(args.accountId);
    if (!account) {
      throw new Error("Account not found");
    }

    // Vérifier que le compte appartient à l'utilisateur
    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser || account.userId !== appUser._id) {
      throw new Error("Unauthorized");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.region !== undefined) updates.region = args.region;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.links !== undefined) updates.links = args.links;

    await ctx.db.patch(args.accountId, updates);

    return { success: true };
  },
});

/**
 * Supprime un compte (ne peut pas supprimer le compte par défaut)
 */
export const deleteAccount = mutation({
  args: {
    accountId: v.id("userAccounts"),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      throw new Error("Not authenticated");
    }

    const account = await ctx.db.get(args.accountId);
    if (!account) {
      throw new Error("Account not found");
    }

    // Vérifier que le compte appartient à l'utilisateur
    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser || account.userId !== appUser._id) {
      throw new Error("Unauthorized");
    }

    // Ne pas permettre la suppression du compte par défaut
    if (account.isDefault) {
      throw new Error("Cannot delete default account");
    }

    await ctx.db.delete(args.accountId);

    return { success: true };
  },
});

