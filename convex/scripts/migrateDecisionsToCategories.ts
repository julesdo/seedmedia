import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";

/**
 * Normalise un slug de domaine (gère les variations, accents, etc.)
 */
function normalizeDomainSlug(domain: string): string {
  return domain
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
    .replace(/[^a-z0-9]+/g, "-") // Remplacer les caractères spéciaux par des tirets
    .replace(/^-+|-+$/g, "") // Supprimer les tirets en début/fin
    .trim();
}

/**
 * Mapping des domaines vers les noms de catégories
 */
const DOMAIN_TO_CATEGORY_NAME: Record<string, string> = {
  "politique": "Politique",
  "société": "Société",
  "societe": "Société",
  "économie": "Économie",
  "economie": "Économie",
  "énergie": "Énergie",
  "energie": "Énergie",
  "diplomatie": "Diplomatie",
  "géopolitique": "Géopolitique",
  "geopolitique": "Géopolitique",
  "technologie": "Technologie",
  "environnement": "Environnement",
  "santé": "Santé",
  "sante": "Santé",
  "mobilité": "Mobilité",
  "mobilite": "Mobilité",
  "urbanisme": "Urbanisme",
  "culture": "Culture",
  "sport": "Sport",
  "alimentation": "Alimentation",
};

/**
 * Mapping des événements spéciaux vers les catégories
 */
const SPECIAL_EVENT_TO_CATEGORY: Record<string, { name: string; slug: string }> = {
  "municipales_2026": {
    name: "Municipales 2026",
    slug: "municipales-2026",
  },
  "presidentielles_2027": {
    name: "Présidentielles 2027",
    slug: "presidentielles-2027",
  },
};

/**
 * Récupère ou crée une catégorie par son slug
 */
export const getOrCreateCategory = internalMutation({
  args: {
    slug: v.string(),
    name: v.string(),
    categoryType: v.union(
      v.literal("domain"),
      v.literal("event_type"),
      v.literal("special_event"),
      v.literal("topic")
    ),
    isSpecialEvent: v.optional(v.boolean()),
    priority: v.optional(v.number()),
    eventStartDate: v.optional(v.number()),
    eventEndDate: v.optional(v.number()),
    metadata: v.optional(v.any()),
    proposedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Chercher la catégorie existante
    const existing = await ctx.db
      .query("categories")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      // Vérifier qu'elle s'applique aux décisions
      if (!existing.appliesTo.includes("decisions")) {
        // Ajouter "decisions" à appliesTo
        await ctx.db.patch(existing._id, {
          appliesTo: [...existing.appliesTo, "decisions"],
          updatedAt: Date.now(),
        });
      }
      return existing._id;
    }

    // Créer la catégorie
    const now = Date.now();
    const categoryId = await ctx.db.insert("categories", {
      name: args.name,
      slug: args.slug,
      description: undefined,
      shortDescription: undefined,
      icon: undefined,
      color: undefined,
      categoryType: args.categoryType,
      parentCategoryId: undefined,
      appliesTo: ["decisions"],
      featured: args.isSpecialEvent ?? false,
      priority: args.isSpecialEvent ? (args.priority ?? 1) : (args.priority ?? 0),
      coverImage: undefined,
      coverImageAlt: undefined,
      tags: [],
      metadata: args.metadata,
      isSpecialEvent: args.isSpecialEvent ?? false,
      eventStartDate: args.eventStartDate,
      eventEndDate: args.eventEndDate,
      status: "active",
      usageCount: 0,
      proposedBy: args.proposedBy,
      createdAt: now,
      updatedAt: now,
    });

    return categoryId;
  },
});

/**
 * Migration principale : convertit impactedDomains et specialEvent en categoryIds
 */
export const migrateDecisionsToCategories = internalMutation({
  args: {
    adminUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const stats = {
      decisionsProcessed: 0,
      categoriesCreated: 0,
      errors: [] as string[],
    };

    try {
      // 1. Récupérer toutes les décisions
      const allDecisions = await ctx.db.query("decisions").collect();
      stats.decisionsProcessed = allDecisions.length;

      // 2. Collecter tous les domaines uniques
      const uniqueDomains = new Set<string>();
      for (const decision of allDecisions) {
        for (const domain of decision.impactedDomains) {
          uniqueDomains.add(domain);
        }
      }

      // 3. Créer les catégories pour les domaines
      const domainCategoryMap = new Map<string, Id<"categories">>();
      for (const domain of uniqueDomains) {
        const normalizedSlug = normalizeDomainSlug(domain);
        const categoryName = DOMAIN_TO_CATEGORY_NAME[normalizedSlug] || domain.charAt(0).toUpperCase() + domain.slice(1);

        try {
          const categoryId = await ctx.runMutation(
            internal.scripts.migrateDecisionsToCategories.getOrCreateCategory,
            {
              slug: normalizedSlug,
              name: categoryName,
              categoryType: "domain" as const,
              proposedBy: args.adminUserId,
            }
          );
          domainCategoryMap.set(domain, categoryId);
          stats.categoriesCreated++;
        } catch (error: any) {
          stats.errors.push(`Erreur création catégorie ${normalizedSlug}: ${error.message}`);
        }
      }

      // 4. Créer les catégories pour les événements spéciaux
      const specialEventCategoryMap = new Map<string, Id<"categories">>();
      for (const [eventKey, eventData] of Object.entries(SPECIAL_EVENT_TO_CATEGORY)) {
        try {
          const categoryId = await ctx.runMutation(
            internal.scripts.migrateDecisionsToCategories.getOrCreateCategory,
            {
              slug: eventData.slug,
              name: eventData.name,
              categoryType: "special_event" as const,
              isSpecialEvent: true,
              priority: 1,
              proposedBy: args.adminUserId,
            }
          );
          specialEventCategoryMap.set(eventKey, categoryId);
          stats.categoriesCreated++;
        } catch (error: any) {
          stats.errors.push(`Erreur création événement ${eventKey}: ${error.message}`);
        }
      }

      // 5. Migrer chaque décision
      for (const decision of allDecisions) {
        try {
          const categoryIds: Id<"categories">[] = [];

          // Ajouter les catégories correspondant aux impactedDomains
          for (const domain of decision.impactedDomains) {
            const categoryId = domainCategoryMap.get(domain);
            if (categoryId && !categoryIds.includes(categoryId)) {
              categoryIds.push(categoryId);
            }
          }

          // Ajouter la catégorie correspondant au specialEvent si présent
          if (decision.specialEvent) {
            const categoryId = specialEventCategoryMap.get(decision.specialEvent);
            if (categoryId && !categoryIds.includes(categoryId)) {
              categoryIds.push(categoryId);
            }
          }

          // Mettre à jour la décision avec categoryIds
          if (categoryIds.length > 0) {
            await ctx.db.patch(decision._id, {
              categoryIds,
              updatedAt: Date.now(),
            });
          }
        } catch (error: any) {
          stats.errors.push(`Erreur migration décision ${decision._id}: ${error.message}`);
        }
      }

      return {
        success: true,
        stats,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        stats,
      };
    }
  },
});

