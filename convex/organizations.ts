import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";

/**
 * Récupère toutes les organizations d'un utilisateur
 */
export const getUserOrganizations = query({
  args: {},
  handler: async (ctx) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      return [];
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      return [];
    }

    // Récupérer les membres actifs
    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("userId", (q) => q.eq("userId", appUser._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Récupérer les organizations
    const organizations = await Promise.all(
      memberships.map(async (membership) => {
        const org = await ctx.db.get(membership.organizationId);
        if (!org) return null;
        return {
          ...org,
          role: membership.role,
          canInvite: membership.canInvite,
          canEdit: membership.canEdit,
          canDelete: membership.canDelete,
        };
      })
    );

    return organizations.filter(Boolean);
  },
});

/**
 * Récupère une organization avec ses membres
 */
export const getOrganization = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      return null;
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      return null;
    }

    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      return null;
    }

    // Vérifier que l'utilisateur est membre
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("organizationId", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("userId"), appUser._id))
      .first();

    if (!membership || membership.status !== "active") {
      return null;
    }

    // Récupérer tous les membres
    const members = await ctx.db
      .query("organizationMembers")
      .withIndex("organizationId", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const membersWithUsers = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId);
        const betterAuthUserData = await betterAuthComponent.safeGetAuthUser(ctx as any);
        return {
          ...member,
          user: user
            ? {
                _id: user._id,
                email: user.email,
                name: betterAuthUserData?.name,
                image: betterAuthUserData?.image,
              }
            : null,
        };
      })
    );

    return {
      ...organization,
      role: membership.role,
      canInvite: membership.canInvite,
      canEdit: membership.canEdit,
      canDelete: membership.canDelete,
      members: membersWithUsers,
    };
  },
});

/**
 * Récupère les projets d'une organisation
 */
export const getOrganizationProjects = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      return [];
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      return [];
    }

    // Vérifier que l'utilisateur est membre
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("organizationId", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("userId"), appUser._id))
      .first();

    if (!membership || membership.status !== "active") {
      return [];
    }

    // Récupérer les projets de l'organisation
    const projects = await ctx.db
      .query("projects")
      .withIndex("orgId", (q) => q.eq("orgId", args.organizationId))
      .order("desc")
      .collect();

    return projects;
  },
});

/**
 * Récupère les actions d'une organisation
 */
export const getOrganizationActions = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      return [];
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser) {
      return [];
    }

    // Vérifier que l'utilisateur est membre
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("organizationId", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("userId"), appUser._id))
      .first();

    if (!membership || membership.status !== "active") {
      return [];
    }

    // Récupérer les actions de l'organisation
    const actions = await ctx.db
      .query("actions")
      .withIndex("orgId", (q) => q.eq("orgId", args.organizationId))
      .order("desc")
      .collect();

    return actions;
  },
});

/**
 * Récupère un profil public d'organisation (accessible sans être membre)
 */
export const getOrganizationPublic = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      return null;
    }

    // Vérifier si l'utilisateur est membre (pour les permissions)
    let membership = null;
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (betterAuthUser) {
      const appUser = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
        .first();

      if (appUser) {
        membership = await ctx.db
          .query("organizationMembers")
          .withIndex("organizationId", (q) => q.eq("organizationId", args.organizationId))
          .filter((q) => q.eq(q.field("userId"), appUser._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .first();
      }
    }

    return {
      ...organization,
      // Permissions si membre
      role: membership?.role || null,
      canInvite: membership?.canInvite || false,
      canEdit: membership?.canEdit || false,
      canDelete: membership?.canDelete || false,
      isMember: !!membership,
    };
  },
});

/**
 * Récupère uniquement le nom d'une organisation (pour le breadcrumb)
 */
export const getOrganizationName = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const organization = await ctx.db.get(args.organizationId);
    return organization ? { name: organization.name } : null;
  },
});

/**
 * Récupère les statistiques publiques d'une organisation
 */
export const getOrganizationStats = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    // Compter les followers
    const followers = await ctx.db
      .query("follows")
      .withIndex("targetType_targetId", (q) =>
        q.eq("targetType", "organization").eq("targetId", args.organizationId)
      )
      .collect();

    // Compter les membres actifs
    const members = await ctx.db
      .query("organizationMembers")
      .withIndex("organizationId", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const memberIds = members.map((m) => m.userId);

    // Compter les articles publiés par les membres de l'organisation
    const allArticles = await ctx.db
      .query("articles")
      .withIndex("status", (q) => q.eq("status", "published"))
      .collect();

    // Filtrer les articles par les membres de l'organisation
    const orgArticles = allArticles.filter((article) => memberIds.includes(article.authorId));

    // Compter les projets
    const projects = await ctx.db
      .query("projects")
      .withIndex("orgId", (q) => q.eq("orgId", args.organizationId))
      .collect();

    // Compter les actions
    const actions = await ctx.db
      .query("actions")
      .withIndex("orgId", (q) => q.eq("orgId", args.organizationId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    return {
      followersCount: followers.length,
      articlesCount: orgArticles.length,
      projectsCount: projects.length,
      actionsCount: actions.length,
      membersCount: members.length,
    };
  },
});

/**
 * Récupère les articles publics d'une organisation
 */
export const getOrganizationArticlesPublic = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    // Pour l'instant, on récupère via les membres (les articles ont authorId)
    // À améliorer si un champ orgId est ajouté aux articles
    const members = await ctx.db
      .query("organizationMembers")
      .withIndex("organizationId", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const memberIds = members.map((m) => m.userId);

    // Récupérer les articles publiés par les membres
    const allArticles = await ctx.db
      .query("articles")
      .withIndex("status", (q) => q.eq("status", "published"))
      .collect();

    const orgArticles = allArticles.filter((article) => memberIds.includes(article.authorId));

    return orgArticles.sort((a, b) => (b.publishedAt || b.createdAt) - (a.publishedAt || a.createdAt));
  },
});

/**
 * Récupère les projets publics d'une organisation
 */
export const getOrganizationProjectsPublic = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("orgId", (q) => q.eq("orgId", args.organizationId))
      .order("desc")
      .collect();

    return projects;
  },
});

/**
 * Récupère les actions publiques d'une organisation
 */
export const getOrganizationActionsPublic = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const actions = await ctx.db
      .query("actions")
      .withIndex("orgId", (q) => q.eq("orgId", args.organizationId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .order("desc")
      .collect();

    return actions;
  },
});

/**
 * Crée une nouvelle organization
 */
export const createOrganization = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    logo: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
        address: v.optional(v.string()),
        city: v.optional(v.string()),
        region: v.optional(v.string()),
        country: v.optional(v.string()),
        postalCode: v.optional(v.string()),
      })
    ),
    seedRegion: v.optional(v.string()),
    organizationType: v.optional(
      v.union(
        v.literal("association"),
        v.literal("entreprise"),
        v.literal("collectif"),
        v.literal("institution"),
        v.literal("autre")
      )
    ),
    legalStatus: v.optional(v.string()),
    foundedAt: v.optional(v.number()),
    sector: v.optional(
      v.union(
        v.literal("tech"),
        v.literal("environnement"),
        v.literal("social"),
        v.literal("education"),
        v.literal("culture"),
        v.literal("sante"),
        v.literal("autre")
      )
    ),
    tags: v.optional(v.array(v.string())),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    website: v.optional(v.string()),
    languages: v.optional(v.array(v.string())),
    reachRadius: v.optional(v.number()),
    impactMetrics: v.optional(
      v.array(
        v.object({
          label: v.string(),
          value: v.string(),
        })
      )
    ),
    schedule: v.optional(
      v.object({
        meetings: v.optional(v.string()),
        hours: v.optional(v.string()),
        timezone: v.optional(v.string()),
      })
    ),
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

    // Vérifier que le slug est unique
    const existing = await ctx.db
      .query("organizations")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("Organization slug already exists");
    }

    const now = Date.now();
    const organizationId = await ctx.db.insert("organizations", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      logo: args.logo,
      coverImage: args.coverImage,
      ownerId: appUser._id,
      location: args.location,
      seedRegion: args.seedRegion,
      organizationType: args.organizationType,
      legalStatus: args.legalStatus,
      foundedAt: args.foundedAt,
      sector: args.sector,
      tags: args.tags || [],
      contactEmail: args.contactEmail,
      contactPhone: args.contactPhone,
      website: args.website,
      links: [],
      languages: args.languages || ["fr"],
      reachRadius: args.reachRadius,
      impactMetrics: args.impactMetrics,
      schedule: args.schedule,
      verified: false,
      premiumTier: "free",
      createdAt: now,
      updatedAt: now,
    });

    // Créer le membership du propriétaire
    await ctx.db.insert("organizationMembers", {
      organizationId,
      userId: appUser._id,
      role: "owner",
      canInvite: true,
      canEdit: true,
      canDelete: true,
      status: "active",
      joinedAt: now,
      updatedAt: now,
    });

    return organizationId;
  },
});

/**
 * Met à jour une organization
 */
export const updateOrganization = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    logo: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
        address: v.optional(v.string()),
        city: v.optional(v.string()),
        region: v.optional(v.string()),
        country: v.optional(v.string()),
        postalCode: v.optional(v.string()),
      })
    ),
    seedRegion: v.optional(v.string()),
    organizationType: v.optional(
      v.union(
        v.literal("association"),
        v.literal("entreprise"),
        v.literal("collectif"),
        v.literal("institution"),
        v.literal("autre")
      )
    ),
    legalStatus: v.optional(v.string()),
    foundedAt: v.optional(v.number()),
    sector: v.optional(
      v.union(
        v.literal("tech"),
        v.literal("environnement"),
        v.literal("social"),
        v.literal("education"),
        v.literal("culture"),
        v.literal("sante"),
        v.literal("autre")
      )
    ),
    tags: v.optional(v.array(v.string())),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    website: v.optional(v.string()),
    languages: v.optional(v.array(v.string())),
    // reachRadius est géré automatiquement par l'algorithme selon le niveau/XP
    impactMetrics: v.optional(
      v.array(
        v.object({
          label: v.string(),
          value: v.string(),
        })
      )
    ),
    links: v.optional(
      v.array(
        v.object({
          type: v.string(),
          url: v.string(),
        })
      )
    ),
    schedule: v.optional(
      v.object({
        meetings: v.optional(v.string()),
        hours: v.optional(v.string()),
        timezone: v.optional(v.string()),
      })
    ),
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

    if (!membership || !membership.canEdit) {
      throw new Error("Unauthorized");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.logo !== undefined) updates.logo = args.logo;
    if (args.coverImage !== undefined) updates.coverImage = args.coverImage;
    if (args.location !== undefined) updates.location = args.location;
    if (args.seedRegion !== undefined) updates.seedRegion = args.seedRegion;
    if (args.organizationType !== undefined) updates.organizationType = args.organizationType;
    if (args.legalStatus !== undefined) updates.legalStatus = args.legalStatus;
    if (args.foundedAt !== undefined) updates.foundedAt = args.foundedAt;
    if (args.sector !== undefined) updates.sector = args.sector;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.contactEmail !== undefined) updates.contactEmail = args.contactEmail;
    if (args.contactPhone !== undefined) updates.contactPhone = args.contactPhone;
    if (args.website !== undefined) updates.website = args.website;
    if (args.languages !== undefined) updates.languages = args.languages;
    // reachRadius est géré automatiquement par l'algorithme selon le niveau/XP
    if (args.impactMetrics !== undefined) updates.impactMetrics = args.impactMetrics;
    if (args.links !== undefined) updates.links = args.links;
    if (args.schedule !== undefined) updates.schedule = args.schedule;

    await ctx.db.patch(args.organizationId, updates);

    return { success: true };
  },
});

/**
 * Transfère la propriété d'une organisation à un autre membre
 */
export const transferOwnership = mutation({
  args: {
    organizationId: v.id("organizations"),
    newOwnerId: v.id("users"),
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

    // Vérifier que l'utilisateur est le propriétaire actuel
    const currentOwner = await ctx.db
      .query("organizationMembers")
      .withIndex("organizationId", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("userId"), appUser._id))
      .first();

    if (!currentOwner || currentOwner.role !== "owner") {
      throw new Error("Only the current owner can transfer ownership");
    }

    // Vérifier que le nouveau propriétaire est membre de l'organisation
    const newOwner = await ctx.db
      .query("organizationMembers")
      .withIndex("organizationId", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("userId"), args.newOwnerId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!newOwner) {
      throw new Error("New owner must be an active member of the organization");
    }

    // Ne pas permettre de transférer à soi-même
    if (newOwner.userId === appUser._id) {
      throw new Error("Cannot transfer ownership to yourself");
    }

    // Mettre à jour l'ancien propriétaire (devient admin)
    await ctx.db.patch(currentOwner._id, {
      role: "admin",
      canInvite: true,
      canEdit: true,
      canDelete: false,
      updatedAt: Date.now(),
    });

    // Mettre à jour le nouveau propriétaire
    await ctx.db.patch(newOwner._id, {
      role: "owner",
      canInvite: true,
      canEdit: true,
      canDelete: true,
      updatedAt: Date.now(),
    });

    // Mettre à jour l'organisation avec le nouveau propriétaire
    await ctx.db.patch(args.organizationId, {
      ownerId: args.newOwnerId,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Supprime une organization
 */
export const deleteOrganization = mutation({
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

    // Vérifier les permissions
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("organizationId", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("userId"), appUser._id))
      .first();

    if (!membership || !membership.canDelete) {
      throw new Error("Unauthorized");
    }

    // Supprimer tous les membres
    const members = await ctx.db
      .query("organizationMembers")
      .withIndex("organizationId", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    // Supprimer toutes les invitations
    const invitations = await ctx.db
      .query("invitations")
      .withIndex("organizationId", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    for (const invitation of invitations) {
      await ctx.db.delete(invitation._id);
    }

    // Supprimer l'organization
    await ctx.db.delete(args.organizationId);

    return { success: true };
  },
});

/**
 * Recherche et filtre les organisations publiques
 */
export const searchOrganizations = query({
  args: {
    searchQuery: v.optional(v.string()), // Recherche textuelle (nom, description)
    seedRegion: v.optional(v.string()),
    organizationType: v.optional(
      v.union(
        v.literal("association"),
        v.literal("entreprise"),
        v.literal("collectif"),
        v.literal("institution"),
        v.literal("autre")
      )
    ),
    sector: v.optional(
      v.union(
        v.literal("tech"),
        v.literal("environnement"),
        v.literal("social"),
        v.literal("education"),
        v.literal("culture"),
        v.literal("sante"),
        v.literal("autre")
      )
    ),
    tags: v.optional(v.array(v.string())), // Au moins un tag doit correspondre
    verified: v.optional(v.boolean()),
    premiumTier: v.optional(
      v.union(
        v.literal("free"),
        v.literal("starter"),
        v.literal("pro"),
        v.literal("impact")
      )
    ),
    sortBy: v.optional(
      v.union(
        v.literal("relevance"),
        v.literal("createdAt"),
        v.literal("membersCount"),
        v.literal("followersCount")
      )
    ),
    limit: v.optional(v.number()), // Limite de résultats (défaut: 50)
  },
  handler: async (ctx, args) => {
    // Récupérer toutes les organisations
    const orgQuery = ctx.db.query("organizations");

    // Appliquer les filtres avec index si possible
    const results: any[] = [];
    
    // Si on a un filtre par région, utiliser l'index
    if (args.seedRegion) {
      const byRegion = await orgQuery
        .withIndex("seedRegion", (q) => q.eq("seedRegion", args.seedRegion!))
        .collect();
      results.push(...byRegion);
    } else if (args.organizationType) {
      // Si on a un filtre par type, utiliser l'index
      const byType = await orgQuery
        .withIndex("organizationType", (q) => q.eq("organizationType", args.organizationType!))
        .collect();
      results.push(...byType);
    } else if (args.sector) {
      // Si on a un filtre par secteur, utiliser l'index
      const bySector = await orgQuery
        .withIndex("sector", (q) => q.eq("sector", args.sector!))
        .collect();
      results.push(...bySector);
    } else {
      // Sinon, récupérer toutes les organisations
      const all = await orgQuery.collect();
      results.push(...all);
    }

    // Filtrer les résultats
    let filtered = results;

    // Filtre par recherche textuelle
    if (args.searchQuery) {
      const queryLower = args.searchQuery.toLowerCase();
      filtered = filtered.filter((org) => {
        const nameMatch = org.name.toLowerCase().includes(queryLower);
        const descMatch = org.description.toLowerCase().includes(queryLower);
        const tagMatch = org.tags.some((tag: string) => tag.toLowerCase().includes(queryLower));
        return nameMatch || descMatch || tagMatch;
      });
    }

    // Filtres supplémentaires (si pas déjà appliqués via index)
    // Note: ces filtres sont déjà appliqués via index si présents, donc on les applique seulement si non présents
    if (args.seedRegion === undefined) {
      // Pas de filtre par région, on garde tout
    } else if (!results.some((r) => r.seedRegion === args.seedRegion)) {
      // Si le filtre n'a pas été appliqué via index, on filtre manuellement
      filtered = filtered.filter((org) => org.seedRegion === args.seedRegion);
    }
    
    if (args.organizationType === undefined) {
      // Pas de filtre par type
    } else if (!results.some((r) => r.organizationType === args.organizationType)) {
      filtered = filtered.filter((org) => org.organizationType === args.organizationType);
    }
    
    if (args.sector === undefined) {
      // Pas de filtre par secteur
    } else if (!results.some((r) => r.sector === args.sector)) {
      filtered = filtered.filter((org) => org.sector === args.sector);
    }

    // Filtre par tags (au moins un tag doit correspondre)
    if (args.tags && args.tags.length > 0) {
      filtered = filtered.filter((org) =>
        args.tags!.some((tag) => org.tags.includes(tag))
      );
    }

    // Filtre par vérifié
    if (args.verified !== undefined) {
      filtered = filtered.filter((org) => org.verified === args.verified);
    }

    // Filtre par premium tier
    if (args.premiumTier) {
      filtered = filtered.filter((org) => org.premiumTier === args.premiumTier);
    }

    // Enrichir avec les stats (membres, followers)
    const enriched = await Promise.all(
      filtered.map(async (org) => {
        // Compter les membres
        const members = await ctx.db
          .query("organizationMembers")
          .withIndex("organizationId", (q) => q.eq("organizationId", org._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();

        // Compter les followers
        const followers = await ctx.db
          .query("follows")
          .withIndex("targetType_targetId", (q) =>
            q.eq("targetType", "organization").eq("targetId", org._id)
          )
          .collect();

        return {
          ...org,
          membersCount: members.length,
          followersCount: followers.length,
        };
      })
    );

    // Trier
    const sortBy = args.sortBy || "relevance";
    enriched.sort((a, b) => {
      switch (sortBy) {
        case "createdAt":
          return b.createdAt - a.createdAt;
        case "membersCount":
          return b.membersCount - a.membersCount;
        case "followersCount":
          return b.followersCount - a.followersCount;
        case "relevance":
        default:
          // Pour la pertinence, on privilégie les organisations vérifiées et avec plus de membres
          if (a.verified !== b.verified) {
            return a.verified ? -1 : 1;
          }
          return b.membersCount - a.membersCount;
      }
    });

    // Limiter les résultats
    const limit = args.limit || 50;
    return enriched.slice(0, limit);
  },
});

/**
 * Récupère les organisations récentes (pour la sidebar)
 */
export const getRecentOrganizations = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 5;
    
    const organizations = await ctx.db
      .query("organizations")
      .order("desc")
      .take(limit);

    return organizations.map((org) => ({
      _id: org._id,
      name: org.name,
      logo: org.logo,
      seedRegion: org.seedRegion,
      createdAt: org.createdAt,
    }));
  },
});

