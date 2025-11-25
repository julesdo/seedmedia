import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { getGovernanceVoteParameters, getRuleValueAsNumber } from "./configurableRules.helpers";
import { api } from "./_generated/api";

/**
 * Récupère les propositions de gouvernance avec filtres
 */
export const getOpenProposals = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("open"),
        v.literal("closed"),
        v.literal("approved"),
        v.literal("rejected")
      )
    ),
    proposalType: v.optional(
      v.union(
        v.literal("editorial_rules"),
        v.literal("product_evolution"),
        v.literal("ethical_charter"),
        v.literal("category_addition"),
        v.literal("expert_nomination"),
        v.literal("other")
      )
    ),
    sortBy: v.optional(
      v.union(
        v.literal("recent"), // Plus récentes
        v.literal("oldest"), // Plus anciennes
        v.literal("votes"), // Plus de votes
        v.literal("ending_soon") // Se terminant bientôt
      )
    ),
  },
  handler: async (ctx, args) => {
    // Récupérer la limite par défaut depuis les règles configurables
    const defaultLimit = await getRuleValueAsNumber(ctx, "default_list_limit").catch(() => 20);
    const limit = args.limit || defaultLimit;
    const status = args.status || "open";
    const sortBy = args.sortBy || "recent";

    // Récupérer les propositions selon le statut
    let proposals = await ctx.db
      .query("governanceProposals")
      .withIndex("status", (q) => q.eq("status", status))
      .collect();
    
    // Filtrer par type si spécifié
    if (args.proposalType) {
      proposals = proposals.filter((p) => p.proposalType === args.proposalType);
    }
    
    // Trier selon le critère choisi
    if (sortBy === "recent") {
      proposals.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortBy === "oldest") {
      proposals.sort((a, b) => a.createdAt - b.createdAt);
    } else if (sortBy === "votes") {
      proposals.sort((a, b) => b.totalVotes - a.totalVotes);
    } else if (sortBy === "ending_soon") {
      // Trier par date de fin de vote (plus proche en premier)
      proposals.sort((a, b) => {
        const aEnd = a.voteEndAt || Infinity;
        const bEnd = b.voteEndAt || Infinity;
        return aEnd - bEnd;
      });
    }
    
    // Limiter les résultats
    const sortedProposals = proposals.slice(0, limit);

    // Enrichir avec les données du proposant
    const proposalsWithProposer = await Promise.all(
      sortedProposals.map(async (proposal) => {
        const proposerDoc = await ctx.db.get(proposal.proposerId);
        if (!proposerDoc) {
          return {
            ...proposal,
            proposer: null,
          };
        }
        
        const proposer = proposerDoc as any;
        
        // Récupérer l'image depuis la table users (synchronisée avec Better Auth via onUpdate)
        // Si pas d'image dans la table, essayer Better Auth seulement si c'est l'utilisateur connecté
        let proposerImage: string | null = proposer.image || null;
        
        if (!proposerImage) {
          try {
            const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
            if (betterAuthUser && betterAuthUser.email === proposer.email) {
              proposerImage = betterAuthUser.image || null;
            }
          } catch {
            // Ignorer les erreurs
          }
        }
        
        return {
          ...proposal,
          proposer: {
            _id: proposer._id,
            email: proposer.email || "",
            name: proposer.name || proposer.email?.split("@")[0] || "Auteur",
            image: proposerImage,
          },
        };
      })
    );

    return proposalsWithProposer;
  },
});

/**
 * Récupère une proposition par son slug
 */
export const getProposalBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const proposal = await ctx.db
      .query("governanceProposals")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!proposal) {
      return null;
    }

    const proposerDoc = await ctx.db.get(proposal.proposerId);
    const proposer = proposerDoc as any;

    // Récupérer les votes
    const votes = await ctx.db
      .query("governanceVotes")
      .withIndex("proposalId", (q) => q.eq("proposalId", proposal._id))
      .collect();

    // Enrichir avec les données des votants
    const votesWithVoters = await Promise.all(
      votes.map(async (vote) => {
        const voterDoc = await ctx.db.get(vote.userId);
        if (!voterDoc) {
          return {
            ...vote,
            voter: null,
          };
        }
        
        const voter = voterDoc as any;
        return {
          ...vote,
          voter: {
            _id: voter._id,
            email: voter.email || "",
            name: voter.name || voter.email?.split("@")[0] || "Votant",
            image: voter.image || null,
            role: voter.role || "explorateur",
            credibilityScore: voter.credibilityScore || 0,
          },
        };
      })
    );

    // Trier les votes par date (plus récents en premier)
    votesWithVoters.sort((a, b) => b.createdAt - a.createdAt);

    return {
      ...proposal,
      proposer: proposer
        ? {
            _id: proposer._id,
            email: proposer.email || "",
            name: proposer.name || proposer.email?.split("@")[0] || "Auteur",
            image: proposer.image || null,
          }
        : null,
      votes: votesWithVoters,
    };
  },
});

/**
 * Crée une nouvelle proposition de gouvernance
 */
export const createProposal = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    proposalType: v.union(
      v.literal("editorial_rules"),
      v.literal("product_evolution"),
      v.literal("ethical_charter"),
      v.literal("category_addition"),
      v.literal("expert_nomination"),
      v.literal("other")
    ),
    voteDurationDays: v.optional(v.number()), // Durée du vote en jours (seul paramètre modifiable)
    actionData: v.optional(
      v.object({
        ruleKey: v.optional(v.string()),
        ruleValue: v.optional(v.any()),
        categoryId: v.optional(v.id("categories")),
        userId: v.optional(v.id("users")),
        expertiseDomain: v.optional(v.string()),
        settingKey: v.optional(v.string()),
        settingValue: v.optional(v.any()),
        charterSection: v.optional(v.string()),
        charterContent: v.optional(v.string()),
        customData: v.optional(v.any()),
        // Champs pour la création de catégories
        actionType: v.optional(v.string()), // "activate_default" ou "create_new"
        name: v.optional(v.string()),
        slug: v.optional(v.string()),
        description: v.optional(v.string()),
        icon: v.optional(v.string()),
        color: v.optional(v.string()),
        appliesTo: v.optional(v.array(v.string())),
        categorySlug: v.optional(v.string()), // Pour activer une catégorie par défaut
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
      .query("governanceProposals")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existing) {
      throw new Error("Une proposition avec ce slug existe déjà");
    }

    // Validation de la durée du vote selon les règles configurables
    const currentVoteParams = await getGovernanceVoteParameters(ctx);
    const minDuration = currentVoteParams.defaultDurationDays || 1;
    const maxDuration = 90; // Maximum raisonnable
    const voteDurationDays = args.voteDurationDays || currentVoteParams.defaultDurationDays || 7;
    
    if (voteDurationDays < minDuration) {
      throw new Error(`La durée du vote doit être d'au moins ${minDuration} jour${minDuration > 1 ? "s" : ""}`);
    }
    if (voteDurationDays > maxDuration) {
      throw new Error(`La durée du vote ne peut pas dépasser ${maxDuration} jours`);
    }

    // Validation des données d'action selon le type de proposition
    if (args.actionData) {
      // Pour editorial_rules et product_evolution, vérifier que la règle existe
      if (args.proposalType === "editorial_rules" && args.actionData.ruleKey) {
        const rule = await ctx.db
          .query("configurableRules")
          .withIndex("key", (q) => q.eq("key", args.actionData!.ruleKey!))
          .first();
        if (!rule) {
          throw new Error(`La règle "${args.actionData.ruleKey}" n'existe pas`);
        }
        // Vérifier que la valeur est valide selon le type de règle
        if (args.actionData.ruleValue !== undefined) {
          if (rule.valueType === "number") {
            const numValue = Number(args.actionData.ruleValue);
            if (isNaN(numValue)) {
              throw new Error(`La valeur de la règle "${rule.label}" doit être un nombre`);
            }
            if (rule.min !== undefined && numValue < rule.min) {
              throw new Error(`La valeur de la règle "${rule.label}" doit être supérieure ou égale à ${rule.min}`);
            }
            if (rule.max !== undefined && numValue > rule.max) {
              throw new Error(`La valeur de la règle "${rule.label}" doit être inférieure ou égale à ${rule.max}`);
            }
          }
        }
      }
      
      // Pour product_evolution, validation similaire
      if (args.proposalType === "product_evolution" && args.actionData.settingKey) {
        // Les paramètres produit sont gérés différemment, validation basique
        if (!args.actionData.settingValue) {
          throw new Error("La nouvelle valeur du paramètre est requise");
        }
      }
      
      // Pour category_addition, validation des champs requis
      if (args.proposalType === "category_addition") {
        if (!args.actionData.actionType) {
          throw new Error("Le type d'action est requis");
        }
        if (args.actionData.actionType === "create_new" && !args.actionData.name) {
          throw new Error("Le nom de la catégorie est requis pour créer une nouvelle catégorie");
        }
        if (args.actionData.actionType === "activate_default" && !args.actionData.categorySlug) {
          throw new Error("Le slug de la catégorie par défaut est requis");
        }
      }
      
      // Pour expert_nomination, validation des champs requis
      if (args.proposalType === "expert_nomination") {
        if (!args.actionData.userId) {
          throw new Error("L'utilisateur à nommer est requis");
        }
        // Vérifier que l'utilisateur existe
        const user = await ctx.db.get(args.actionData.userId as Id<"users">);
        if (!user) {
          throw new Error("L'utilisateur sélectionné n'existe pas");
        }
        if (!args.actionData.expertiseDomain) {
          throw new Error("Le domaine d'expertise est requis");
        }
      }
      
      // Pour ethical_charter, validation des champs requis
      if (args.proposalType === "ethical_charter") {
        if (!args.actionData.charterSection) {
          throw new Error("La section de la charte est requise");
        }
        if (!args.actionData.charterContent) {
          throw new Error("Le nouveau contenu de la charte est requis");
        }
      }
    }

    // Calculer automatiquement les paramètres de vote selon le type de proposition
    const voteParams = await getVoteParametersForProposalType(ctx, args.proposalType);

    const now = Date.now();
    const voteDurationMs = (args.voteDurationDays || voteParams.durationDays) * 24 * 60 * 60 * 1000;

    const proposalId = await ctx.db.insert("governanceProposals", {
      title: args.title,
      slug: args.slug,
      description: args.description,
      proposerId: appUser._id,
      proposalType: args.proposalType,
      votesFor: 0,
      votesAgainst: 0,
      votesAbstain: 0,
      totalVotes: 0,
      status: "open",
      quorumRequired: voteParams.quorum,
      majorityRequired: voteParams.majority,
      actionData: args.actionData || undefined,
      actionExecuted: false,
      voteStartAt: now,
      voteEndAt: now + voteDurationMs,
      createdAt: now,
      updatedAt: now,
    });

    return { proposalId };
  },
});

/**
 * Met à jour une proposition (uniquement si elle est en draft et que l'utilisateur est le proposant)
 */
export const updateProposal = mutation({
  args: {
    proposalId: v.id("governanceProposals"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    proposalType: v.optional(
      v.union(
        v.literal("editorial_rules"),
        v.literal("product_evolution"),
        v.literal("ethical_charter"),
        v.literal("category_addition"),
        v.literal("expert_nomination"),
        v.literal("other")
      )
    ),
    voteDurationDays: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("open"),
        v.literal("closed")
      )
    ),
    actionData: v.optional(
      v.object({
        ruleKey: v.optional(v.string()),
        ruleValue: v.optional(v.any()),
        categoryId: v.optional(v.id("categories")),
        userId: v.optional(v.id("users")),
        expertiseDomain: v.optional(v.string()),
        settingKey: v.optional(v.string()),
        settingValue: v.optional(v.any()),
        charterSection: v.optional(v.string()),
        charterContent: v.optional(v.string()),
        customData: v.optional(v.any()),
        actionType: v.optional(v.string()),
        name: v.optional(v.string()),
        slug: v.optional(v.string()),
        description: v.optional(v.string()),
        icon: v.optional(v.string()),
        color: v.optional(v.string()),
        appliesTo: v.optional(v.array(v.string())),
        categorySlug: v.optional(v.string()),
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

    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }

    // Vérifier que l'utilisateur est le proposant
    if (proposal.proposerId !== appUser._id) {
      throw new Error("Seul le proposant peut modifier cette proposition");
    }

    // Permettre la modification seulement si la proposition est en draft ou open (pas closed)
    if (proposal.status === "closed") {
      throw new Error("Les propositions fermées ne peuvent pas être modifiées");
    }

    // Vérifier l'unicité du slug si modifié
    if (args.slug && args.slug !== proposal.slug) {
      const newSlug = args.slug; // TypeScript comprend maintenant que newSlug est string
      const existing = await ctx.db
        .query("governanceProposals")
        .withIndex("slug", (q) => q.eq("slug", newSlug))
        .first();

      if (existing) {
        throw new Error("Une proposition avec ce slug existe déjà");
      }
    }

    // Recalculer les paramètres de vote si le type change
    let quorumRequired = proposal.quorumRequired;
    let majorityRequired = proposal.majorityRequired;
    let voteParams = await getVoteParametersForProposalType(ctx, args.proposalType || proposal.proposalType);
    
    if (args.proposalType && args.proposalType !== proposal.proposalType) {
      voteParams = await getVoteParametersForProposalType(ctx, args.proposalType);
      quorumRequired = voteParams.quorum;
      majorityRequired = voteParams.majority;
    }

    // Construire l'objet de mise à jour
    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.slug !== undefined) updates.slug = args.slug;
    if (args.description !== undefined) updates.description = args.description;
    if (args.proposalType !== undefined) updates.proposalType = args.proposalType;
    if (args.actionData !== undefined) updates.actionData = args.actionData;
    if (quorumRequired !== proposal.quorumRequired) updates.quorumRequired = quorumRequired;
    if (majorityRequired !== proposal.majorityRequired) updates.majorityRequired = majorityRequired;

    // Gérer le changement de statut
    if (args.status !== undefined && args.status !== proposal.status) {
      updates.status = args.status;
      
      // Si on passe de draft à open, initialiser les dates de vote
      if (proposal.status === "draft" && args.status === "open") {
        const now = Date.now();
        // Utiliser la durée fournie ou celle de la proposition, ou les paramètres par défaut
        const durationDays = args.voteDurationDays || 
          (proposal.voteEndAt && proposal.voteStartAt 
            ? Math.ceil((proposal.voteEndAt - proposal.voteStartAt) / (1000 * 60 * 60 * 24))
            : voteParams.durationDays);
        const voteDurationMs = durationDays * 24 * 60 * 60 * 1000;
        updates.voteStartAt = now;
        updates.voteEndAt = now + voteDurationMs;
      }
      
      // Si on passe de open à draft, supprimer les dates de vote
      if (proposal.status === "open" && args.status === "draft") {
        updates.voteStartAt = undefined;
        updates.voteEndAt = undefined;
      }
    }

    await ctx.db.patch(args.proposalId, updates);

    return { success: true };
  },
});

/**
 * Ouvre une proposition pour le vote
 */
export const openProposalForVoting = mutation({
  args: {
    proposalId: v.id("governanceProposals"),
    voteDurationDays: v.optional(v.number()),
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

    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }

    // Vérifier que l'utilisateur est le proposant ou un éditeur
    if (proposal.proposerId !== appUser._id && appUser.role !== "editeur") {
      throw new Error("Seul le proposant ou un éditeur peut ouvrir le vote");
    }

    const now = Date.now();
    const voteDurationMs = (args.voteDurationDays || 7) * 24 * 60 * 60 * 1000;

    await ctx.db.patch(args.proposalId, {
      status: "open",
      voteStartAt: now,
      voteEndAt: now + voteDurationMs,
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Vote sur une proposition de gouvernance
 */
export const voteOnProposal = mutation({
  args: {
    proposalId: v.id("governanceProposals"),
    vote: v.union(v.literal("for"), v.literal("against"), v.literal("abstain")),
    comment: v.optional(v.string()),
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

    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }

    if (proposal.status !== "open") {
      throw new Error("La proposition n'est pas ouverte au vote");
    }

    if (proposal.voteEndAt && Date.now() > proposal.voteEndAt) {
      throw new Error("La période de vote est terminée");
    }

    // Vérifier si l'utilisateur a déjà voté
    const existingVote = await ctx.db
      .query("governanceVotes")
      .withIndex("proposalId_userId", (q) =>
        q.eq("proposalId", args.proposalId).eq("userId", appUser._id)
      )
      .first();

    if (existingVote) {
      // Mettre à jour le vote existant
      const oldVote = existingVote.vote;
      
      // Décrémenter l'ancien vote
      if (oldVote === "for") {
        proposal.votesFor -= existingVote.weight;
      } else if (oldVote === "against") {
        proposal.votesAgainst -= existingVote.weight;
      } else if (oldVote === "abstain") {
        proposal.votesAbstain -= existingVote.weight;
      }

      // Récupérer les permissions de rôle actuelles (gouvernance)
      let rolePermissions = {
        explorateur: { voteWeight: 1 },
        contributeur: { voteWeight: 1 },
        editeur: { voteWeight: 4 },
      };

      try {
        const evolutions = await ctx.db
          .query("governanceEvolution")
          .withIndex("evolutionType", (q: any) => q.eq("evolutionType", "role_permissions"))
          .filter((q: any) => q.eq(q.field("status"), "active"))
          .collect();

        if (evolutions.length > 0) {
          evolutions.sort((a: any, b: any) => (b.appliedAt || 0) - (a.appliedAt || 0));
          if (evolutions[0].rolePermissions) {
            rolePermissions = {
              explorateur: {
                voteWeight: evolutions[0].rolePermissions.explorateur?.voteWeight ?? 1,
              },
              contributeur: {
                voteWeight: evolutions[0].rolePermissions.contributeur?.voteWeight ?? 1,
              },
              editeur: {
                voteWeight: evolutions[0].rolePermissions.editeur?.voteWeight ?? 4,
              },
            };
          }
        }
      } catch {
        // Utiliser les valeurs par défaut en cas d'erreur
      }

      // Calculer le poids du vote selon le rôle
      const voteWeight =
        appUser.role === "editeur"
          ? rolePermissions.editeur.voteWeight
          : appUser.role === "contributeur"
          ? rolePermissions.contributeur.voteWeight
          : rolePermissions.explorateur.voteWeight;

      // Incrémenter le nouveau vote
      if (args.vote === "for") {
        proposal.votesFor += voteWeight;
      } else if (args.vote === "against") {
        proposal.votesAgainst += voteWeight;
      } else if (args.vote === "abstain") {
        proposal.votesAbstain += voteWeight;
      }

      // Mettre à jour le vote existant
      await ctx.db.patch(existingVote._id, {
        vote: args.vote,
        weight: voteWeight,
        comment: args.comment,
        updatedAt: Date.now(),
      });
    } else {
      // Créer un nouveau vote
      // Récupérer les permissions de rôle actuelles (gouvernance)
      let rolePermissions = {
        explorateur: { voteWeight: 1 },
        contributeur: { voteWeight: 1 },
        editeur: { voteWeight: 4 },
      };

      try {
        const evolutions = await ctx.db
          .query("governanceEvolution")
          .withIndex("evolutionType", (q: any) => q.eq("evolutionType", "role_permissions"))
          .filter((q: any) => q.eq(q.field("status"), "active"))
          .collect();

        if (evolutions.length > 0) {
          evolutions.sort((a: any, b: any) => (b.appliedAt || 0) - (a.appliedAt || 0));
          if (evolutions[0].rolePermissions) {
            rolePermissions = {
              explorateur: {
                voteWeight: evolutions[0].rolePermissions.explorateur?.voteWeight ?? 1,
              },
              contributeur: {
                voteWeight: evolutions[0].rolePermissions.contributeur?.voteWeight ?? 1,
              },
              editeur: {
                voteWeight: evolutions[0].rolePermissions.editeur?.voteWeight ?? 4,
              },
            };
          }
        }
      } catch {
        // Utiliser les valeurs par défaut en cas d'erreur
      }

      // Calculer le poids du vote selon le rôle
      const voteWeight =
        appUser.role === "editeur"
          ? rolePermissions.editeur.voteWeight
          : appUser.role === "contributeur"
          ? rolePermissions.contributeur.voteWeight
          : rolePermissions.explorateur.voteWeight;

      // Incrémenter les compteurs
      if (args.vote === "for") {
        proposal.votesFor += voteWeight;
      } else if (args.vote === "against") {
        proposal.votesAgainst += voteWeight;
      } else if (args.vote === "abstain") {
        proposal.votesAbstain += voteWeight;
      }

      await ctx.db.insert("governanceVotes", {
        proposalId: args.proposalId,
        userId: appUser._id,
        vote: args.vote,
        weight: voteWeight,
        comment: args.comment,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Mettre à jour les totaux
    proposal.totalVotes =
      proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;

    await ctx.db.patch(args.proposalId, {
      votesFor: proposal.votesFor,
      votesAgainst: proposal.votesAgainst,
      votesAbstain: proposal.votesAbstain,
      totalVotes: proposal.totalVotes,
      updatedAt: Date.now(),
    });

    // Notifier le proposant qu'un vote a été émis (sauf si c'est lui qui vote)
    if (proposal.proposerId !== appUser._id) {
      await ctx.runMutation(internal.notifications.createNotificationInternal, {
        userId: proposal.proposerId,
        type: "proposal_vote",
        title: "Nouveau vote sur votre proposition",
        message: `Votre proposition "${proposal.title}" a reçu un nouveau vote.`,
        link: `/gouvernance/${proposal.slug}`,
        metadata: {
          proposalId: args.proposalId,
        },
      });
    }

    // Vérifier si on doit fermer la proposition et calculer le résultat
    await checkAndCloseProposal(ctx, args.proposalId);

    return { success: true };
  },
});

/**
 * Calcule les paramètres de vote selon le type de proposition
 */
async function getVoteParametersForProposalType(
  ctx: any,
  proposalType: "editorial_rules" | "product_evolution" | "ethical_charter" | "category_addition" | "expert_nomination" | "other"
): Promise<{ quorum: number; majority: number; durationDays: number }> {
  // Récupérer les paramètres depuis les règles configurables
  const voteParams = await getGovernanceVoteParameters(ctx);

  // Paramètres de base depuis les règles configurables
  let baseParams = {
    quorum: voteParams.defaultQuorum,
    majority: voteParams.defaultMajority,
    durationDays: voteParams.defaultDurationDays,
  };

  // Récupérer les paramètres de vote depuis governanceEvolution si disponibles (priorité)
  try {
    const evolutions = await ctx.db
      .query("governanceEvolution")
      .withIndex("evolutionType", (q: any) => q.eq("evolutionType", "vote_parameters"))
      .filter((q: any) => q.eq(q.field("status"), "active"))
      .collect();

    if (evolutions.length > 0) {
      evolutions.sort((a: any, b: any) => (b.appliedAt || 0) - (a.appliedAt || 0));
      if (evolutions[0].voteParameters) {
        baseParams = {
          quorum: evolutions[0].voteParameters.defaultQuorum ?? voteParams.defaultQuorum,
          majority: evolutions[0].voteParameters.defaultMajority ?? voteParams.defaultMajority,
          durationDays: evolutions[0].voteParameters.defaultDurationDays ?? voteParams.defaultDurationDays,
        };
      }
    }
  } catch {
    // Utiliser les valeurs par défaut en cas d'erreur
  }

  // Ajuster selon le type de proposition (depuis les règles configurables)
  switch (proposalType) {
    case "editorial_rules":
      // Règles éditoriales : quorum plus élevé, majorité qualifiée
      return {
        quorum: Math.max(baseParams.quorum, voteParams.editorialRulesQuorum),
        majority: Math.max(baseParams.majority, voteParams.editorialRulesMajority),
        durationDays: baseParams.durationDays,
      };
    case "ethical_charter":
      // Charte éthique : quorum très élevé, majorité qualifiée
      return {
        quorum: Math.max(baseParams.quorum, voteParams.ethicalCharterQuorum),
        majority: Math.max(baseParams.majority, voteParams.ethicalCharterMajority),
        durationDays: baseParams.durationDays + voteParams.ethicalCharterExtraDays,
      };
    case "expert_nomination":
      // Nomination d'expert : quorum modéré, majorité simple
      return {
        quorum: Math.max(baseParams.quorum, voteParams.expertNominationQuorum),
        majority: baseParams.majority,
        durationDays: baseParams.durationDays,
      };
    case "category_addition":
      // Ajout de catégorie : quorum modéré, majorité simple
      return {
        quorum: Math.max(baseParams.quorum, voteParams.categoryAdditionQuorum),
        majority: baseParams.majority,
        durationDays: baseParams.durationDays,
      };
    case "product_evolution":
      // Évolution produit : quorum modéré, majorité qualifiée
      return {
        quorum: Math.max(baseParams.quorum, voteParams.productEvolutionQuorum),
        majority: Math.max(baseParams.majority, voteParams.productEvolutionMajority),
        durationDays: baseParams.durationDays,
      };
    case "other":
    default:
      // Autre : paramètres de base
      return baseParams;
  }
}

/**
 * Exécute l'action concrète d'une proposition approuvée
 */
async function executeProposalAction(
  ctx: any,
  proposalId: Id<"governanceProposals">,
  executedBy: Id<"users">
): Promise<void> {
  const proposal = await ctx.db.get(proposalId);
  if (!proposal || !proposal.actionData || proposal.actionExecuted) {
    return;
  }

  const now = Date.now();

  try {
    switch (proposal.proposalType) {
      case "editorial_rules":
        // Modifier une règle configurable
        if (proposal.actionData.ruleKey && proposal.actionData.ruleValue !== undefined) {
          // Mettre à jour la règle dans configurableRules
          await ctx.runMutation(internal.configurableRules.updateRuleValue, {
            ruleKey: proposal.actionData.ruleKey,
            newValue: proposal.actionData.ruleValue,
            proposalId: proposalId,
          });

          // Créer aussi une évolution de gouvernance pour l'historique
          await ctx.db.insert("governanceEvolution", {
            evolutionType: "content_rules",
            description: `Règle modifiée : ${proposal.actionData.ruleKey}`,
            contentRules: {
              [proposal.actionData.ruleKey]: proposal.actionData.ruleValue,
            },
            proposedBy: proposal.proposerId,
            proposalId: proposalId,
            status: "active",
            appliedAt: now,
            appliedBy: executedBy,
            createdAt: now,
            updatedAt: now,
          });
        }
        break;

      case "category_addition":
        // Créer une nouvelle catégorie ou activer une catégorie par défaut
        if (proposal.actionData.categoryId) {
          // Si c'est un ID existant, activer la catégorie (cas d'une catégorie par défaut qui n'était pas encore en base)
          const category = await ctx.db.get(proposal.actionData.categoryId);
          if (category) {
            await ctx.db.patch(proposal.actionData.categoryId, {
              status: "active",
              updatedAt: now,
            });
          }
        } else if (proposal.actionData.name && proposal.actionData.slug) {
          // Créer une nouvelle catégorie directement (pas de statut pending)
          await ctx.runMutation(internal.categories.createCategoryInternal, {
            name: proposal.actionData.name,
            slug: proposal.actionData.slug,
            description: proposal.actionData.description,
            icon: proposal.actionData.icon,
            color: proposal.actionData.color,
            appliesTo: proposal.actionData.appliesTo || ["articles", "dossiers", "debates"],
            proposalId: proposalId,
            executedBy: executedBy,
          });
        }
        break;

      case "expert_nomination":
        // Nommer un utilisateur comme expert
        if (proposal.actionData.userId && proposal.actionData.expertiseDomain) {
          const user = await ctx.db.get(proposal.actionData.userId);
          if (user) {
            const expertiseDomains = user.expertiseDomains || [];
            if (!expertiseDomains.includes(proposal.actionData.expertiseDomain)) {
              await ctx.db.patch(proposal.actionData.userId, {
                expertiseDomains: [...expertiseDomains, proposal.actionData.expertiseDomain],
                updatedAt: now,
              });
            }
            // Promouvoir au rôle contributeur si explorateur
            if (user.role === "explorateur") {
              await ctx.db.patch(proposal.actionData.userId, {
                role: "contributeur",
                updatedAt: now,
              });
            }
          }
        }
        break;

      case "product_evolution":
        // Modifier un paramètre produit (règle configurable)
        if (proposal.actionData.settingKey && proposal.actionData.settingValue !== undefined) {
          // Mettre à jour la règle dans configurableRules
          await ctx.runMutation(internal.configurableRules.updateRuleValue, {
            ruleKey: proposal.actionData.settingKey,
            newValue: proposal.actionData.settingValue,
            proposalId: proposalId,
          });

          // Créer aussi une évolution de gouvernance pour l'historique
          await ctx.db.insert("governanceEvolution", {
            evolutionType: "other",
            description: `Paramètre produit modifié : ${proposal.actionData.settingKey}`,
            proposedBy: proposal.proposerId,
            proposalId: proposalId,
            status: "active",
            appliedAt: now,
            appliedBy: executedBy,
            createdAt: now,
            updatedAt: now,
          });
        }
        break;

      case "ethical_charter":
        // Modifier la charte éthique
        if (proposal.actionData.charterSection && proposal.actionData.charterContent) {
          // Créer une évolution de gouvernance pour la charte éthique
          await ctx.db.insert("governanceEvolution", {
            evolutionType: "other",
            description: `Charte éthique modifiée : ${proposal.actionData.charterSection}`,
            proposedBy: proposal.proposerId,
            proposalId: proposalId,
            status: "active",
            appliedAt: now,
            appliedBy: executedBy,
            createdAt: now,
            updatedAt: now,
          });
        }
        break;

      case "other":
        // Actions personnalisées (peuvent être étendues)
        // Pour l'instant, on ne fait rien de spécifique
        break;
    }

    // Marquer l'action comme exécutée
    await ctx.db.patch(proposalId, {
      actionExecuted: true,
      actionExecutedAt: now,
      actionExecutedBy: executedBy,
      updatedAt: now,
    });
  } catch (error) {
    console.error("Erreur lors de l'exécution de l'action:", error);
    // Ne pas marquer comme exécutée en cas d'erreur
    throw error;
  }
}

/**
 * Vérifie et ferme une proposition si conditions remplies
 */
async function checkAndCloseProposal(
  ctx: any,
  proposalId: Id<"governanceProposals">
) {
  const proposal = await ctx.db.get(proposalId);
  if (!proposal || proposal.status !== "open") {
    return;
  }

  // Vérifier si le vote est terminé (date dépassée)
  if (proposal.voteEndAt && Date.now() > proposal.voteEndAt) {
    let result: "approved" | "rejected" | "quorum_not_met" = "rejected";

    // Vérifier le quorum
    if (proposal.totalVotes >= proposal.quorumRequired) {
      // Calculer le pourcentage de votes POUR
      const totalWeighted = proposal.votesFor + proposal.votesAgainst; // Abstentions ne comptent pas pour la majorité
      if (totalWeighted > 0) {
        const percentageFor = (proposal.votesFor / totalWeighted) * 100;

        if (percentageFor >= proposal.majorityRequired) {
          result = "approved";
        } else {
          result = "rejected";
        }
      }
    } else {
      result = "quorum_not_met";
    }

    await ctx.db.patch(proposalId, {
      status: "closed",
      result: result,
      updatedAt: Date.now(),
    });

    // Si la proposition est approuvée, exécuter l'action concrète
    if (result === "approved" && !proposal.actionExecuted) {
      try {
        // Utiliser le proposant comme exécuteur (ou un éditeur si disponible)
        await executeProposalAction(ctx, proposalId, proposal.proposerId);
      } catch (error) {
        console.error("Erreur lors de l'exécution de l'action:", error);
        // Notifier le proposant de l'erreur
        await ctx.runMutation(internal.notifications.createNotificationInternal, {
          userId: proposal.proposerId,
          type: "other",
          title: "Erreur lors de l'exécution de l'action",
          message: `Votre proposition "${proposal.title}" a été approuvée mais une erreur est survenue lors de l'exécution de l'action. Veuillez contacter un administrateur.`,
          link: `/gouvernance/${proposal.slug}`,
          metadata: {
            proposalId: proposalId,
          },
        });
      }
    }

    // Notifier le proposant que la proposition est fermée
    const resultMessage =
      result === "approved"
        ? "approuvée"
        : result === "rejected"
        ? "rejetée"
        : "fermée (quorum non atteint)";

    await ctx.runMutation(internal.notifications.createNotificationInternal, {
      userId: proposal.proposerId,
      type: "proposal_closed",
      title: `Proposition ${resultMessage}`,
      message: `Votre proposition "${proposal.title}" a été ${resultMessage}.${result === "approved" ? " L'action a été exécutée automatiquement." : ""}`,
      link: `/gouvernance/${proposal.slug}`,
      metadata: {
        proposalId: proposalId,
      },
    });
  }
}

/**
 * Récupère les propositions de l'utilisateur connecté
 */
export const getMyProposals = query({
  args: {
    limit: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("open"),
        v.literal("closed"),
        v.literal("approved"),
        v.literal("rejected")
      )
    ),
    sortBy: v.optional(
      v.union(
        v.literal("recent"), // Plus récentes
        v.literal("oldest"), // Plus anciennes
        v.literal("votes") // Plus de votes
      )
    ),
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

    // Récupérer la limite par défaut depuis les règles configurables
    const defaultLimit = await getRuleValueAsNumber(ctx, "default_list_limit").catch(() => 20);
    const limit = args.limit || defaultLimit;
    const sortBy = args.sortBy || "recent";

    // Récupérer toutes les propositions et filtrer par proposant
    let proposals = await ctx.db
      .query("governanceProposals")
      .withIndex("proposerId", (q) => q.eq("proposerId", appUser._id))
      .collect();
    
    // Filtrer par statut si spécifié
    if (args.status) {
      proposals = proposals.filter((p) => p.status === args.status);
    }
    
    // Trier selon le critère choisi
    if (sortBy === "recent") {
      proposals.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortBy === "oldest") {
      proposals.sort((a, b) => a.createdAt - b.createdAt);
    } else if (sortBy === "votes") {
      proposals.sort((a, b) => b.totalVotes - a.totalVotes);
    }
    
    // Limiter les résultats
    proposals = proposals.slice(0, limit);

    return proposals;
  },
});

/**
 * Récupère l'historique des propositions fermées avec filtres
 */
export const getProposalsHistory = query({
  args: {
    limit: v.optional(v.number()),
    proposalType: v.optional(
      v.union(
        v.literal("editorial_rules"),
        v.literal("product_evolution"),
        v.literal("ethical_charter"),
        v.literal("category_addition"),
        v.literal("expert_nomination"),
        v.literal("other")
      )
    ),
    result: v.optional(
      v.union(
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("quorum_not_met")
      )
    ),
    sortBy: v.optional(
      v.union(
        v.literal("recent"), // Plus récentes
        v.literal("oldest"), // Plus anciennes
        v.literal("votes") // Plus de votes
      )
    ),
  },
  handler: async (ctx, args) => {
    // Récupérer la limite par défaut depuis les règles configurables
    const defaultLimit = await getRuleValueAsNumber(ctx, "default_list_limit").catch(() => 20);
    const limit = args.limit || defaultLimit;
    const sortBy = args.sortBy || "recent";

    // Récupérer toutes les propositions fermées
    let proposals = await ctx.db
      .query("governanceProposals")
      .withIndex("status", (q) => q.eq("status", "closed"))
      .collect();
    
    // Filtrer par type si spécifié
    if (args.proposalType) {
      proposals = proposals.filter((p) => p.proposalType === args.proposalType);
    }
    
    // Filtrer par résultat si spécifié
    if (args.result) {
      proposals = proposals.filter((p) => p.result === args.result);
    }
    
    // Trier selon le critère choisi
    if (sortBy === "recent") {
      proposals.sort((a, b) => (b.voteEndAt || b.updatedAt) - (a.voteEndAt || a.updatedAt));
    } else if (sortBy === "oldest") {
      proposals.sort((a, b) => (a.voteEndAt || a.updatedAt) - (b.voteEndAt || b.updatedAt));
    } else if (sortBy === "votes") {
      proposals.sort((a, b) => b.totalVotes - a.totalVotes);
    }
    
    // Limiter les résultats
    proposals = proposals.slice(0, limit);

    // Enrichir avec les données du proposant
    const proposalsWithProposer = await Promise.all(
      proposals.map(async (proposal) => {
        const proposerDoc = await ctx.db.get(proposal.proposerId);
        const proposer = proposerDoc as any;
        
        return {
          ...proposal,
          proposer: proposer
            ? {
                _id: proposer._id,
                email: proposer.email || "",
                name: proposer.email?.split("@")[0] || "Auteur",
              }
            : null,
        };
      })
    );

    return proposalsWithProposer;
  },
});

/**
 * Ferme manuellement une proposition (réservé aux éditeurs)
 */
export const closeProposal = mutation({
  args: {
    proposalId: v.id("governanceProposals"),
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

    if (appUser.role !== "editeur") {
      throw new Error("Seuls les éditeurs peuvent fermer une proposition");
    }

    const proposal = await ctx.db.get(args.proposalId);
    if (!proposal) {
      throw new Error("Proposal not found");
    }

    // Calculer le résultat
    let result: "approved" | "rejected" | "quorum_not_met" = "rejected";

    if (proposal.totalVotes >= proposal.quorumRequired) {
      const totalWeighted = proposal.votesFor + proposal.votesAgainst;
      if (totalWeighted > 0) {
        const percentageFor = (proposal.votesFor / totalWeighted) * 100;
        if (percentageFor >= proposal.majorityRequired) {
          result = "approved";
        }
      }
    } else {
      result = "quorum_not_met";
    }

    await ctx.db.patch(args.proposalId, {
      status: "closed",
      result: result,
      updatedAt: Date.now(),
    });

    // Notifier le proposant que la proposition est fermée
    const resultMessage =
      result === "approved"
        ? "approuvée"
        : result === "rejected"
        ? "rejetée"
        : "fermée (quorum non atteint)";

    await ctx.runMutation(internal.notifications.createNotificationInternal, {
      userId: proposal.proposerId,
      type: "proposal_closed",
      title: `Proposition ${resultMessage}`,
      message: `Votre proposition "${proposal.title}" a été ${resultMessage}.`,
      link: `/gouvernance/${proposal.slug}`,
      metadata: {
        proposalId: args.proposalId,
      },
    });

    return { success: true, result };
  },
});

