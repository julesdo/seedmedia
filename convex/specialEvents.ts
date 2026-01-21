import { query, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Vérifie si une décision correspond aux règles de cohorte d'un événement spécial
 * Fonction interne utilisée pour le matching automatique
 */
export const matchesSpecialEvent = internalQuery({
  args: {
    decisionId: v.id("decisions"),
    specialEventId: v.id("specialEvents"),
  },
  handler: async (ctx, args) => {
    const decision = await ctx.db.get(args.decisionId);
    if (!decision) {
      return false;
    }

    const specialEvent = await ctx.db.get(args.specialEventId);
    if (!specialEvent) {
      return false;
    }

    const rules = specialEvent.cohortRules;
    const operator = rules.operator || "AND";
    const conditions: boolean[] = [];

    // Filtre par catégories (optionnel)
    if (rules.categoryIds && rules.categoryIds.length > 0) {
      const hasMatchingCategory = !!(
        decision.categoryIds &&
        decision.categoryIds.length > 0 &&
        rules.categoryIds.some((catId) => decision.categoryIds!.includes(catId))
      );
      conditions.push(hasMatchingCategory);
    }

    // Filtre par mots-clés dans le titre
    if (rules.titleKeywords && rules.titleKeywords.length > 0) {
      const titleLower = decision.title.toLowerCase();
      const hasMatchingKeyword = rules.titleKeywords.some((keyword) =>
        titleLower.includes(keyword.toLowerCase())
      );
      conditions.push(hasMatchingKeyword);
    }

    // Filtre par texte exact dans le titre
    if (rules.titleContains) {
      const titleLower = decision.title.toLowerCase();
      conditions.push(titleLower.includes(rules.titleContains.toLowerCase()));
    }

    // Filtre par mots-clés dans la description
    if (rules.descriptionKeywords && rules.descriptionKeywords.length > 0) {
      const descLower = decision.description.toLowerCase();
      const hasMatchingKeyword = rules.descriptionKeywords.some((keyword) =>
        descLower.includes(keyword.toLowerCase())
      );
      conditions.push(hasMatchingKeyword);
    }

    // Filtre par texte exact dans la description
    if (rules.descriptionContains) {
      const descLower = decision.description.toLowerCase();
      conditions.push(descLower.includes(rules.descriptionContains.toLowerCase()));
    }

    // Filtre par type de décision
    if (rules.decisionType && rules.decisionType.length > 0) {
      conditions.push(rules.decisionType.includes(decision.type));
    }

    // Filtre par décideur
    if (rules.decider) {
      const deciderLower = decision.decider.toLowerCase();
      conditions.push(deciderLower.includes(rules.decider.toLowerCase()));
    }

    // Filtre par sentiment
    if (rules.sentiment && rules.sentiment.length > 0) {
      conditions.push(rules.sentiment.includes(decision.sentiment));
    }

    // Filtre par domaines impactés (⚠️ DEPRECATED - pour compatibilité)
    if (rules.impactedDomains && rules.impactedDomains.length > 0) {
      const hasMatchingDomain = rules.impactedDomains.some((domain) =>
        decision.impactedDomains.includes(domain)
      );
      conditions.push(hasMatchingDomain);
    }

    // Filtre par date de création (après)
    if (rules.decisionCreatedAfter) {
      conditions.push(decision.createdAt >= rules.decisionCreatedAfter);
    }

    // Filtre par date de création (avant)
    if (rules.decisionCreatedBefore) {
      conditions.push(decision.createdAt <= rules.decisionCreatedBefore);
    }

    // Si aucune condition n'a été définie, retourner false (sécurité)
    if (conditions.length === 0) {
      return false;
    }

    // Appliquer l'opérateur logique
    if (operator === "OR") {
      return conditions.some((condition) => condition);
    } else {
      // AND par défaut
      return conditions.every((condition) => condition);
    }
  },
});

/**
 * Prévisualise les décisions correspondant aux règles de cohorte d'un événement spécial
 * Utilisé dans l'interface admin pour valider les règles avant création/modification
 */
export const previewMatchingDecisions = query({
  args: {
    cohortRules: v.object({
      categoryIds: v.optional(v.array(v.id("categories"))),
      titleKeywords: v.optional(v.array(v.string())),
      titleContains: v.optional(v.string()),
      descriptionKeywords: v.optional(v.array(v.string())),
      descriptionContains: v.optional(v.string()),
      decisionType: v.optional(
        v.array(
          v.union(
            v.literal("law"),
            v.literal("sanction"),
            v.literal("tax"),
            v.literal("agreement"),
            v.literal("policy"),
            v.literal("regulation"),
            v.literal("crisis"),
            v.literal("disaster"),
            v.literal("conflict"),
            v.literal("discovery"),
            v.literal("election"),
            v.literal("economic_event"),
            v.literal("other")
          )
        )
      ),
      decider: v.optional(v.string()),
      sentiment: v.optional(
        v.array(
          v.union(v.literal("positive"), v.literal("negative"), v.literal("neutral"))
        )
      ),
      impactedDomains: v.optional(v.array(v.string())),
      decisionCreatedAfter: v.optional(v.number()),
      decisionCreatedBefore: v.optional(v.number()),
      operator: v.optional(v.union(v.literal("AND"), v.literal("OR"))),
    }),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const rules = args.cohortRules;
    const operator = rules.operator || "AND";

    // Récupérer toutes les décisions
    let decisions = await ctx.db.query("decisions").withIndex("date").order("desc").collect();

    // Appliquer les filtres
    const matchingDecisions = decisions.filter((decision) => {
      const conditions: boolean[] = [];

      // Filtre par catégories
      if (rules.categoryIds && rules.categoryIds.length > 0) {
        const hasMatchingCategory = !!(
          decision.categoryIds &&
          decision.categoryIds.length > 0 &&
          rules.categoryIds.some((catId) => decision.categoryIds!.includes(catId))
        );
        conditions.push(hasMatchingCategory);
      }

      // Filtre par mots-clés dans le titre
      if (rules.titleKeywords && rules.titleKeywords.length > 0) {
        const titleLower = decision.title.toLowerCase();
        const hasMatchingKeyword = rules.titleKeywords.some((keyword) =>
          titleLower.includes(keyword.toLowerCase())
        );
        conditions.push(hasMatchingKeyword);
      }

      // Filtre par texte exact dans le titre
      if (rules.titleContains) {
        const titleLower = decision.title.toLowerCase();
        conditions.push(titleLower.includes(rules.titleContains.toLowerCase()));
      }

      // Filtre par mots-clés dans la description
      if (rules.descriptionKeywords && rules.descriptionKeywords.length > 0) {
        const descLower = decision.description.toLowerCase();
        const hasMatchingKeyword = rules.descriptionKeywords.some((keyword) =>
          descLower.includes(keyword.toLowerCase())
        );
        conditions.push(hasMatchingKeyword);
      }

      // Filtre par texte exact dans la description
      if (rules.descriptionContains) {
        const descLower = decision.description.toLowerCase();
        conditions.push(descLower.includes(rules.descriptionContains.toLowerCase()));
      }

      // Filtre par type de décision
      if (rules.decisionType && rules.decisionType.length > 0) {
        conditions.push(rules.decisionType.includes(decision.type));
      }

      // Filtre par décideur
      if (rules.decider) {
        const deciderLower = decision.decider.toLowerCase();
        conditions.push(deciderLower.includes(rules.decider.toLowerCase()));
      }

      // Filtre par sentiment
      if (rules.sentiment && rules.sentiment.length > 0) {
        conditions.push(rules.sentiment.includes(decision.sentiment));
      }

      // Filtre par domaines impactés (⚠️ DEPRECATED)
      if (rules.impactedDomains && rules.impactedDomains.length > 0) {
        const hasMatchingDomain = rules.impactedDomains.some((domain) =>
          decision.impactedDomains.includes(domain)
        );
        conditions.push(hasMatchingDomain);
      }

      // Filtre par date de création (après)
      if (rules.decisionCreatedAfter) {
        conditions.push(decision.createdAt >= rules.decisionCreatedAfter);
      }

      // Filtre par date de création (avant)
      if (rules.decisionCreatedBefore) {
        conditions.push(decision.createdAt <= rules.decisionCreatedBefore);
      }

      // Si aucune condition n'a été définie, exclure la décision
      if (conditions.length === 0) {
        return false;
      }

      // Appliquer l'opérateur logique
      if (operator === "OR") {
        return conditions.some((condition) => condition);
      } else {
        // AND par défaut
        return conditions.every((condition) => condition);
      }
    });

    // Limiter les résultats
    return matchingDecisions.slice(0, limit);
  },
});

/**
 * Récupère tous les événements spéciaux actifs
 */
export const getSpecialEvents = query({
  args: {
    featured: v.optional(v.boolean()),
    activeOnly: v.optional(v.boolean()), // Seulement les événements en cours
  },
  handler: async (ctx, args) => {
    let events = await ctx.db.query("specialEvents").collect();

    // Filtrer par featured si fourni
    if (args.featured !== undefined) {
      events = events.filter((event) => event.featured === args.featured);
    }

    // Filtrer par événements actifs (en cours)
    if (args.activeOnly) {
      const now = Date.now();
      events = events.filter((event) => {
        if (event.startDate && event.startDate > now) return false; // Pas encore commencé
        if (event.endDate && event.endDate < now) return false; // Déjà terminé
        return true;
      });
    }

    // Trier par priorité (croissant), puis par date de début
    return events.sort((a, b) => {
      const priorityA = a.priority ?? 0;
      const priorityB = b.priority ?? 0;
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      const startA = a.startDate ?? 0;
      const startB = b.startDate ?? 0;
      return startB - startA; // Plus récent en premier
    });
  },
});

/**
 * Récupère un événement spécial par son slug
 */
export const getSpecialEventBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("specialEvents")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

/**
 * Récupère les décisions correspondant à un événement spécial
 */
export const getDecisionsForSpecialEvent = query({
  args: {
    specialEventId: v.id("specialEvents"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const specialEvent = await ctx.db.get(args.specialEventId);
    if (!specialEvent) {
      return [];
    }

    // Récupérer toutes les décisions
    let decisions = await ctx.db.query("decisions").withIndex("date").order("desc").collect();

    // Appliquer les règles de cohorte
    const rules = specialEvent.cohortRules;
    const operator = rules.operator || "AND";

    const matchingDecisions = decisions.filter((decision) => {
      const conditions: boolean[] = [];

      // Filtre par catégories
      if (rules.categoryIds && rules.categoryIds.length > 0) {
        const hasMatchingCategory = !!(
          decision.categoryIds &&
          decision.categoryIds.length > 0 &&
          rules.categoryIds.some((catId) => decision.categoryIds!.includes(catId))
        );
        conditions.push(hasMatchingCategory);
      }

      // Filtre par mots-clés dans le titre
      if (rules.titleKeywords && rules.titleKeywords.length > 0) {
        const titleLower = decision.title.toLowerCase();
        const hasMatchingKeyword = rules.titleKeywords.some((keyword) =>
          titleLower.includes(keyword.toLowerCase())
        );
        conditions.push(hasMatchingKeyword);
      }

      // Filtre par texte exact dans le titre
      if (rules.titleContains) {
        const titleLower = decision.title.toLowerCase();
        conditions.push(titleLower.includes(rules.titleContains.toLowerCase()));
      }

      // Filtre par mots-clés dans la description
      if (rules.descriptionKeywords && rules.descriptionKeywords.length > 0) {
        const descLower = decision.description.toLowerCase();
        const hasMatchingKeyword = rules.descriptionKeywords.some((keyword) =>
          descLower.includes(keyword.toLowerCase())
        );
        conditions.push(hasMatchingKeyword);
      }

      // Filtre par texte exact dans la description
      if (rules.descriptionContains) {
        const descLower = decision.description.toLowerCase();
        conditions.push(descLower.includes(rules.descriptionContains.toLowerCase()));
      }

      // Filtre par type de décision
      if (rules.decisionType && rules.decisionType.length > 0) {
        conditions.push(rules.decisionType.includes(decision.type));
      }

      // Filtre par décideur
      if (rules.decider) {
        const deciderLower = decision.decider.toLowerCase();
        conditions.push(deciderLower.includes(rules.decider.toLowerCase()));
      }

      // Filtre par sentiment
      if (rules.sentiment && rules.sentiment.length > 0) {
        conditions.push(rules.sentiment.includes(decision.sentiment));
      }

      // Filtre par domaines impactés (⚠️ DEPRECATED)
      if (rules.impactedDomains && rules.impactedDomains.length > 0) {
        const hasMatchingDomain = rules.impactedDomains.some((domain) =>
          decision.impactedDomains.includes(domain)
        );
        conditions.push(hasMatchingDomain);
      }

      // Filtre par date de création (après)
      if (rules.decisionCreatedAfter) {
        conditions.push(decision.createdAt >= rules.decisionCreatedAfter);
      }

      // Filtre par date de création (avant)
      if (rules.decisionCreatedBefore) {
        conditions.push(decision.createdAt <= rules.decisionCreatedBefore);
      }

      // Si aucune condition n'a été définie, exclure la décision
      if (conditions.length === 0) {
        return false;
      }

      // Appliquer l'opérateur logique
      if (operator === "OR") {
        return conditions.some((condition) => condition);
      } else {
        // AND par défaut
        return conditions.every((condition) => condition);
      }
    });

    // Limiter les résultats
    return matchingDecisions.slice(0, limit);
  },
});

