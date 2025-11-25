import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * Récupère les débats ouverts avec options de filtrage et tri
 */
export const getOpenDebates = query({
  args: {
    limit: v.optional(v.number()),
    sortBy: v.optional(v.union(
      v.literal("recent"),
      v.literal("polarization"),
      v.literal("arguments"),
      v.literal("activity")
    )),
    hasArticle: v.optional(v.boolean()),
    minPolarization: v.optional(v.number()),
    maxPolarization: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const allDebates = await ctx.db
      .query("debates")
      .withIndex("status", (q) => q.eq("status", "open"))
      .collect();

    // Filtrer
    let filtered = allDebates;

    // Filtre par présence d'article
    if (args.hasArticle !== undefined) {
      if (args.hasArticle) {
        filtered = filtered.filter((d) => d.articleId !== undefined);
      } else {
        filtered = filtered.filter((d) => d.articleId === undefined);
      }
    }

    // Filtre par polarisation
    if (args.minPolarization !== undefined) {
      filtered = filtered.filter((d) => (d.polarizationScore || 0) >= args.minPolarization!);
    }
    if (args.maxPolarization !== undefined) {
      filtered = filtered.filter((d) => (d.polarizationScore || 0) <= args.maxPolarization!);
    }

    // Trier
    const sortBy = args.sortBy || "recent";
    switch (sortBy) {
      case "recent":
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case "polarization":
        filtered.sort((a, b) => (b.polarizationScore || 0) - (a.polarizationScore || 0));
        break;
      case "arguments":
        filtered.sort((a, b) => {
          const aTotal = a.argumentsForCount + a.argumentsAgainstCount;
          const bTotal = b.argumentsForCount + b.argumentsAgainstCount;
          return bTotal - aTotal;
        });
        break;
      case "activity":
        // Trier par updatedAt (dernière activité)
        filtered.sort((a, b) => b.updatedAt - a.updatedAt);
        break;
    }

    // Limiter
    const debates = filtered.slice(0, limit);

    // Enrichir avec les données de l'article associé si présent
    const debatesWithDetails = await Promise.all(
      debates.map(async (debat) => {
        let article = null;
        if (debat.articleId) {
          article = await ctx.db.get(debat.articleId);
        }

        return {
          ...debat,
          article: article
            ? {
                title: article.title,
                slug: article.slug,
              }
            : null,
        };
      })
    );

    return debatesWithDetails;
  },
});

/**
 * Récupère le dernier débat ouvert
 */
export const getLatestDebate = query({
  args: {},
  handler: async (ctx) => {
    const allDebates = await ctx.db
      .query("debates")
      .withIndex("status", (q) => q.eq("status", "open"))
      .collect();
    
    if (allDebates.length === 0) {
      return null;
    }

    // Trier par createdAt décroissant
    const latestDebate = allDebates
      .sort((a, b) => b.createdAt - a.createdAt)[0];

    return latestDebate;
  },
});

/**
 * Récupère un débat par son slug
 */
export const getDebateBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const debat = await ctx.db
      .query("debates")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!debat) {
      return null;
    }

    // Récupérer les arguments POUR et CONTRE
    const argumentsFor = await ctx.db
      .query("debatArguments")
      .withIndex("debatId_position", (q) =>
        q.eq("debatId", debat._id).eq("position", "for")
      )
      .order("desc")
      .collect();

    const argumentsAgainst = await ctx.db
      .query("debatArguments")
      .withIndex("debatId_position", (q) =>
        q.eq("debatId", debat._id).eq("position", "against")
      )
      .order("desc")
      .collect();

    // Enrichir avec les données des auteurs
    const enrichArguments = async (args: any[]) => {
      return Promise.all(
        args.map(async (arg) => {
          const authorDoc = await ctx.db.get(arg.authorId);
          if (!authorDoc) {
            return {
              ...arg,
              author: null,
            };
          }
          
          // Type assertion pour indiquer que c'est un document users
          const author = authorDoc as any;
          
          return {
            ...arg,
            author: {
              _id: author._id,
              email: author.email || "",
              name: author.email?.split("@")[0] || "Auteur",
              credibilityScore: author.credibilityScore || 0,
            },
          };
        })
      );
    };

    return {
      ...debat,
      argumentsFor: await enrichArguments(argumentsFor),
      argumentsAgainst: await enrichArguments(argumentsAgainst),
    };
  },
});

/**
 * Crée un nouveau débat
 */
export const createDebate = mutation({
  args: {
    question: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    articleId: v.optional(v.id("articles")),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      throw new Error("Not authenticated");
    }

    // Vérifier que le slug est unique
    const existing = await ctx.db
      .query("debates")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("Un débat avec ce slug existe déjà");
    }

    const now = Date.now();

    const debatId = await ctx.db.insert("debates", {
      question: args.question,
      slug: args.slug,
      description: args.description,
      articleId: args.articleId,
      argumentsForCount: 0,
      argumentsAgainstCount: 0,
      polarizationScore: 0,
      synthesisType: "automatic",
      status: "open",
      createdAt: now,
      updatedAt: now,
    });

    return { debatId };
  },
});

/**
 * Ajoute un argument POUR ou CONTRE à un débat
 */
export const addDebatArgument = mutation({
  args: {
    debatId: v.id("debates"),
    position: v.union(v.literal("for"), v.literal("against")),
    title: v.string(),
    content: v.string(),
    sources: v.optional(v.array(v.string())),
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

    const debat = await ctx.db.get(args.debatId);
    if (!debat) {
      throw new Error("Debate not found");
    }

    if (debat.status !== "open") {
      throw new Error("Le débat n'est plus ouvert");
    }

    const now = Date.now();

    const argumentId = await ctx.db.insert("debatArguments", {
      debatId: args.debatId,
      authorId: appUser._id,
      position: args.position,
      title: args.title,
      content: args.content,
      sources: args.sources || [],
      upvotes: 0,
      downvotes: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Mettre à jour le compteur d'arguments du débat
    const updateField =
      args.position === "for" ? "argumentsForCount" : "argumentsAgainstCount";
    await ctx.db.patch(args.debatId, {
      [updateField]: debat[updateField] + 1,
      updatedAt: now,
    });

    // Recalculer le score de polarisation
    await updatePolarizationScore(ctx, args.debatId);

    // Notifier l'auteur du débat et les autres participants
    // Récupérer tous les participants du débat (auteurs d'arguments)
    const allArguments = await ctx.db
      .query("debatArguments")
      .withIndex("debatId_position", (q) => q.eq("debatId", args.debatId))
      .collect();

    const participantIds = new Set<Id<"users">>();
    
    // Ajouter l'auteur du débat s'il y a un article associé
    if (debat.articleId) {
      const article = await ctx.db.get(debat.articleId);
      if (article) {
        participantIds.add(article.authorId);
      }
    }

    // Ajouter tous les auteurs d'arguments existants
    allArguments.forEach((arg) => {
      if (arg.authorId !== appUser._id) {
        participantIds.add(arg.authorId);
      }
    });

    // Créer des notifications pour tous les participants
    const notifications = Array.from(participantIds)
      .filter((userId) => userId !== appUser._id) // Ne pas notifier celui qui ajoute l'argument
      .map((userId) => ({
        userId,
        type: "debate_new_argument" as const,
        title: "Nouvel argument ajouté",
        message: `${appUser.email?.split("@")[0] || "Un utilisateur"} a ajouté un argument ${args.position === "for" ? "POUR" : "CONTRE"} au débat "${debat.question}"`,
        link: `/debats/${debat.slug}`,
        metadata: {
          debateId: args.debatId,
        },
      }));

    // Insérer les notifications
    for (const notif of notifications) {
      await ctx.runMutation(internal.notifications.createNotificationInternal, notif);
    }

    return { argumentId };
  },
});

/**
 * Vote sur un argument (upvote/downvote)
 */
export const voteDebatArgument = mutation({
  args: {
    argumentId: v.id("debatArguments"),
    vote: v.union(v.literal("up"), v.literal("down")),
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

    const argument = await ctx.db.get(args.argumentId);
    if (!argument) {
      throw new Error("Argument not found");
    }

    // TODO: Implémenter système de votes uniques (vérifier que l'utilisateur n'a pas déjà voté)
    // Pour l'instant, on permet les votes multiples

    const updateField = args.vote === "up" ? "upvotes" : "downvotes";
    await ctx.db.patch(args.argumentId, {
      [updateField]: argument[updateField] + 1,
      updatedAt: Date.now(),
    });

    // Notifier l'auteur de l'argument (sauf si c'est lui qui vote)
    if (argument.authorId !== appUser._id) {
      const debat = await ctx.db.get(argument.debatId);
      if (debat) {
        await ctx.runMutation(internal.notifications.createNotificationInternal, {
          userId: argument.authorId,
          type: "debate_argument_voted",
          title: "Vote sur votre argument",
          message: `${appUser.email?.split("@")[0] || "Un utilisateur"} a ${args.vote === "up" ? "soutenu" : "contesté"} votre argument dans le débat "${debat.question}"`,
          link: `/debats/${debat.slug}`,
          metadata: {
            debateId: argument.debatId,
          },
        });
      }
    }

    return { success: true };
  },
});

/**
 * Calcule le score de polarisation d'un débat (0-100)
 * Basé sur le ratio d'arguments POUR vs CONTRE
 */
async function updatePolarizationScore(ctx: any, debatId: Id<"debates">) {
  const debat = await ctx.db.get(debatId);
  if (!debat) {
    return;
  }

  const total = debat.argumentsForCount + debat.argumentsAgainstCount;
  if (total === 0) {
    await ctx.db.patch(debatId, {
      polarizationScore: 0,
      updatedAt: Date.now(),
    });
    return;
  }

  // Score de 0 à 100 basé sur l'équilibre
  // 0 = parfaitement équilibré (50/50)
  // 100 = totalement déséquilibré (100/0 ou 0/100)
  const ratioFor = debat.argumentsForCount / total;
  const polarizationScore = Math.abs(ratioFor - 0.5) * 200; // 0-100

  await ctx.db.patch(debatId, {
    polarizationScore: Math.round(polarizationScore),
    updatedAt: Date.now(),
  });
}

/**
 * Ferme un débat (réservé aux éditeurs/experts)
 */
export const closeDebate = mutation({
  args: {
    debatId: v.id("debates"),
    synthesis: v.optional(v.string()),
    synthesisType: v.optional(v.union(v.literal("automatic"), v.literal("editorial"))),
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

    // Vérifier que l'utilisateur est éditeur/expert
    if (appUser.role !== "editeur") {
      throw new Error("Seuls les éditeurs peuvent fermer un débat");
    }

    const debat = await ctx.db.get(args.debatId);
    if (!debat) {
      throw new Error("Debate not found");
    }

    await ctx.db.patch(args.debatId, {
      status: "closed",
      synthesis: args.synthesis,
      synthesisType: args.synthesisType || "editorial",
      synthesizedBy: appUser._id,
      closedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Notifier tous les participants du débat
    const allArguments = await ctx.db
      .query("debatArguments")
      .withIndex("debatId_position", (q) => q.eq("debatId", args.debatId))
      .collect();

    const participantIds = new Set<Id<"users">>();
    
    // Ajouter l'auteur du débat s'il y a un article associé
    if (debat.articleId) {
      const article = await ctx.db.get(debat.articleId);
      if (article) {
        participantIds.add(article.authorId);
      }
    }

    // Ajouter tous les auteurs d'arguments
    allArguments.forEach((arg) => {
      participantIds.add(arg.authorId);
    });

    // Créer des notifications pour tous les participants
    const notifications = Array.from(participantIds)
      .filter((userId) => userId !== appUser._id) // Ne pas notifier celui qui ferme
      .map((userId) => ({
        userId,
        type: "debate_closed" as const,
        title: "Débat fermé",
        message: `Le débat "${debat.question}" a été fermé${args.synthesis ? " avec une synthèse" : ""}`,
        link: `/debats/${debat.slug}`,
        metadata: {
          debateId: args.debatId,
        },
      }));

    // Insérer les notifications
    for (const notif of notifications) {
      await ctx.runMutation(internal.notifications.createNotificationInternal, notif);
    }

    return { success: true };
  },
});

/**
 * Récupère les débats créés par l'utilisateur connecté
 */
export const getMyDebates = query({
  args: {
    limit: v.optional(v.number()),
  },
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

    const limit = args.limit || 50;

    // Récupérer tous les débats où l'utilisateur est l'auteur (via article associé)
    // ou où l'utilisateur a ajouté des arguments
    const allDebates = await ctx.db
      .query("debates")
      .collect();

    // Filtrer les débats où l'utilisateur est impliqué
    const userDebates = await Promise.all(
      allDebates.map(async (debat) => {
        // Vérifier si l'utilisateur est l'auteur de l'article associé
        let isAuthor = false;
        if (debat.articleId) {
          const article = await ctx.db.get(debat.articleId);
          if (article && article.authorId === appUser._id) {
            isAuthor = true;
          }
        }

        // Vérifier si l'utilisateur a ajouté des arguments
        const userArguments = await ctx.db
          .query("debatArguments")
          .withIndex("debatId_position", (q) => q.eq("debatId", debat._id))
          .filter((q) => q.eq(q.field("authorId"), appUser._id))
          .first();

        if (isAuthor || userArguments) {
          // Enrichir avec les données de l'article associé si présent
          let article = null;
          if (debat.articleId) {
            const articleDoc = await ctx.db.get(debat.articleId);
            if (articleDoc) {
              article = {
                title: articleDoc.title,
                slug: articleDoc.slug,
              };
            }
          }

          return {
            ...debat,
            article,
            isAuthor,
            hasArguments: !!userArguments,
          };
        }

        return null;
      })
    );

    // Filtrer les null et trier par date de création décroissante
    const filtered = userDebates
      .filter((d) => d !== null)
      .sort((a, b) => b!.createdAt - a!.createdAt)
      .slice(0, limit);

    return filtered;
  },
});

