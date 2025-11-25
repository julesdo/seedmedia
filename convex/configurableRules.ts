import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";
import { DEFAULT_RULES, getDefaultRule, getDefaultRulesForProposalType, type DefaultRule } from "./configurableRules.defaults";

/**
 * Initialise une règle si elle n'existe pas en base
 */
async function ensureRuleExists(ctx: any, defaultRule: typeof DEFAULT_RULES[0]): Promise<void> {
  const existing = await ctx.db
    .query("configurableRules")
    .withIndex("key", (q: any) => q.eq("key", defaultRule.key))
    .first();

  if (!existing) {
    const now = Date.now();
    await ctx.db.insert("configurableRules", {
      key: defaultRule.key,
      label: defaultRule.label,
      description: defaultRule.description,
      category: defaultRule.category,
      valueType: defaultRule.valueType,
      currentValue: defaultRule.currentValue !== undefined ? defaultRule.currentValue : defaultRule.defaultValue,
      defaultValue: defaultRule.defaultValue,
      options: defaultRule.options,
      min: defaultRule.min,
      max: defaultRule.max,
      step: defaultRule.step,
      unit: defaultRule.unit,
      proposalType: defaultRule.proposalType,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  }
}

/**
 * Récupère la valeur d'une règle spécifique par sa clé
 */
export const getRuleValue = query({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    // Chercher la règle en base
    const rule = await ctx.db
      .query("configurableRules")
      .withIndex("key", (q: any) => q.eq("key", args.key))
      .first();

    if (rule) {
      return {
        key: rule.key,
        value: rule.currentValue !== undefined ? rule.currentValue : rule.defaultValue,
      };
    }

    // Si la règle n'existe pas en base, retourner la valeur par défaut
    const defaultRule = getDefaultRule(args.key);
    if (defaultRule) {
      return {
        key: defaultRule.key,
        value: defaultRule.currentValue !== undefined ? defaultRule.currentValue : defaultRule.defaultValue,
      };
    }

    return null;
  },
});

/**
 * Récupère toutes les règles configurables actives
 * Combine les règles en base avec les règles par défaut (si elles n'existent pas encore)
 */
export const getActiveRules = query({
  args: {
    category: v.optional(v.string()),
    proposalType: v.optional(
      v.union(
        v.literal("editorial_rules"),
        v.literal("product_evolution"),
        v.literal("ethical_charter"),
        v.literal("other")
      )
    ),
  },
  handler: async (ctx, args) => {
    // Récupérer les règles en base
    let rules = await ctx.db
      .query("configurableRules")
      .withIndex("status", (q: any) => q.eq("status", "active"))
      .collect();

    // Filtrer par catégorie si spécifié
    if (args.category) {
      rules = rules.filter((rule) => rule.category === args.category);
    }

    // Filtrer par type de proposition si spécifié
    if (args.proposalType) {
      rules = rules.filter((rule) => rule.proposalType === args.proposalType);
    }

    // Récupérer les clés des règles existantes
    const existingKeys = new Set(rules.map((r) => r.key));

    // Ajouter les règles par défaut qui n'existent pas encore en base
    let defaultRulesToAdd = DEFAULT_RULES;
    if (args.proposalType) {
      defaultRulesToAdd = getDefaultRulesForProposalType(args.proposalType);
    }
    if (args.category) {
      defaultRulesToAdd = defaultRulesToAdd.filter((r) => r.category === args.category);
    }

    // Pour les règles par défaut qui n'existent pas en base, les retourner quand même
    // avec leurs valeurs par défaut (elles seront créées automatiquement lors de la première modification)
    for (const defaultRule of defaultRulesToAdd) {
      if (!existingKeys.has(defaultRule.key)) {
        // Retourner la règle par défaut même si elle n'est pas en base
        rules.push({
          _id: "" as any, // Pas d'ID car pas encore en base
          _creationTime: Date.now(),
          key: defaultRule.key,
          label: defaultRule.label,
          description: defaultRule.description,
          category: defaultRule.category,
          valueType: defaultRule.valueType,
          currentValue: defaultRule.currentValue !== undefined ? defaultRule.currentValue : defaultRule.defaultValue,
          defaultValue: defaultRule.defaultValue,
          options: defaultRule.options,
          min: defaultRule.min,
          max: defaultRule.max,
          step: defaultRule.step,
          unit: defaultRule.unit,
          proposalType: defaultRule.proposalType,
          status: "active",
          lastModifiedBy: undefined,
          lastModifiedAt: undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        } as any);
      }
    }

    return rules.sort((a, b) => a.label.localeCompare(b.label));
  },
});

/**
 * Récupère toutes les catégories de règles disponibles
 */
export const getRuleCategories = query({
  args: {},
  handler: async (ctx) => {
    const rules = await ctx.db
      .query("configurableRules")
      .withIndex("status", (q: any) => q.eq("status", "active"))
      .collect();

    const categories = new Set(rules.map((rule) => rule.category));
    return Array.from(categories).sort();
  },
});

/**
 * Récupère une règle par sa clé
 */
export const getRuleByKey = query({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("configurableRules")
      .withIndex("key", (q: any) => q.eq("key", args.key))
      .first();
  },
});

/**
 * Initialise toutes les règles par défaut en base (si elles n'existent pas)
 * Cette fonction peut être appelée manuellement ou automatiquement
 */
export const initializeDefaultRules = mutation({
  args: {},
  handler: async (ctx) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      throw new Error("Not authenticated");
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser || appUser.role !== "editeur") {
      throw new Error("Seuls les éditeurs peuvent initialiser les règles");
    }

    let initialized = 0;
    for (const defaultRule of DEFAULT_RULES) {
      const existing = await ctx.db
        .query("configurableRules")
        .withIndex("key", (q: any) => q.eq("key", defaultRule.key))
        .first();

      if (!existing) {
        await ensureRuleExists(ctx, defaultRule);
        initialized++;
      }
    }

    return { initialized, total: DEFAULT_RULES.length };
  },
});

/**
 * Met à jour une règle configurable (réservé aux éditeurs)
 * Si la règle n'existe pas en base, elle est créée automatiquement depuis les valeurs par défaut
 */
export const updateRule = mutation({
  args: {
    ruleKey: v.string(), // Utiliser la clé au lieu de l'ID pour gérer les règles non encore en base
    currentValue: v.any(),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      throw new Error("Not authenticated");
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser || appUser.role !== "editeur") {
      throw new Error("Seuls les éditeurs peuvent modifier des règles configurables");
    }

    // Récupérer la règle par défaut
    const defaultRule = getDefaultRule(args.ruleKey);
    if (!defaultRule) {
      throw new Error(`Règle "${args.ruleKey}" non trouvée dans les règles par défaut`);
    }

    // Vérifier si la règle existe en base
    let rule = await ctx.db
      .query("configurableRules")
      .withIndex("key", (q: any) => q.eq("key", args.ruleKey))
      .first();

    const now = Date.now();

    if (!rule) {
      // Créer la règle en base depuis les valeurs par défaut
      await ensureRuleExists(ctx, defaultRule);
      rule = await ctx.db
        .query("configurableRules")
        .withIndex("key", (q: any) => q.eq("key", args.ruleKey))
        .first();
      if (!rule) {
        throw new Error("Erreur lors de la création de la règle");
      }
    }

    // Validation de la valeur selon le type
    if (rule.valueType === "number") {
      const numValue = Number(args.currentValue);
      if (isNaN(numValue)) {
        throw new Error("La valeur doit être un nombre");
      }
      if (rule.min !== undefined && numValue < rule.min) {
        throw new Error(`La valeur doit être supérieure ou égale à ${rule.min}`);
      }
      if (rule.max !== undefined && numValue > rule.max) {
        throw new Error(`La valeur doit être inférieure ou égale à ${rule.max}`);
      }
    } else if (rule.valueType === "boolean") {
      if (typeof args.currentValue !== "boolean") {
        throw new Error("La valeur doit être un booléen");
      }
    } else if (rule.valueType === "select") {
      if (!rule.options || !rule.options.some((opt) => opt.value === args.currentValue)) {
        throw new Error("La valeur doit être parmi les options disponibles");
      }
    }

    // Mettre à jour uniquement la valeur actuelle
    await ctx.db.patch(rule._id, {
      currentValue: args.currentValue,
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Met à jour la valeur d'une règle (utilisé lors de l'exécution d'une proposition approuvée)
 * Version interne pour être appelée depuis d'autres mutations
 */
export const updateRuleValue = internalMutation({
  args: {
    ruleKey: v.string(),
    newValue: v.any(),
    proposalId: v.id("governanceProposals"),
  },
  handler: async (ctx, args) => {
    const rule = await ctx.db
      .query("configurableRules")
      .withIndex("key", (q: any) => q.eq("key", args.ruleKey))
      .first();

    if (!rule) {
      throw new Error(`Règle avec la clé "${args.ruleKey}" non trouvée`);
    }

    // Validation de la valeur selon le type
    if (rule.valueType === "number") {
      const numValue = Number(args.newValue);
      if (isNaN(numValue)) {
        throw new Error("La valeur doit être un nombre");
      }
      if (rule.min !== undefined && numValue < rule.min) {
        throw new Error(`La valeur doit être supérieure ou égale à ${rule.min}`);
      }
      if (rule.max !== undefined && numValue > rule.max) {
        throw new Error(`La valeur doit être inférieure ou égale à ${rule.max}`);
      }
    } else if (rule.valueType === "boolean") {
      if (typeof args.newValue !== "boolean") {
        throw new Error("La valeur doit être un booléen");
      }
    } else if (rule.valueType === "select") {
      if (!rule.options || !rule.options.some((opt) => opt.value === args.newValue)) {
        throw new Error("La valeur doit être parmi les options disponibles");
      }
    }

    const now = Date.now();
    await ctx.db.patch(rule._id, {
      currentValue: args.newValue,
      lastModifiedBy: args.proposalId,
      lastModifiedAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Dépublie une règle (réservé aux éditeurs)
 */
export const deprecateRule = mutation({
  args: {
    ruleId: v.id("configurableRules"),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      throw new Error("Not authenticated");
    }

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q: any) => q.eq("email", betterAuthUser.email))
      .first();

    if (!appUser || appUser.role !== "editeur") {
      throw new Error("Seuls les éditeurs peuvent déprécier des règles");
    }

    await ctx.db.patch(args.ruleId, {
      status: "deprecated",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

