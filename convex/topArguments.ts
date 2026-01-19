import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";

/**
 * 🎯 FEATURE 3: KING OF THE HILL - Récupère le top argument pour une décision
 */
export const getTopArgument = query({
  args: {
    decisionId: v.id("decisions"),
  },
  handler: async (ctx, args) => {
    // Récupérer tous les arguments pour cette décision
    const allArguments = await ctx.db
      .query("topArguments")
      .withIndex("decisionId", (q) => q.eq("decisionId", args.decisionId))
      .collect();

    // Retourner celui avec la plus haute enchère
    const topArgument = allArguments.reduce((top, current) => {
      return current.currentBid > top.currentBid ? current : top;
    }, allArguments[0] || null);

    if (!topArgument) return null;

    // Enrichir avec les infos utilisateur
    const user = await ctx.db.get(topArgument.userId) as any;
    return {
      ...topArgument,
      user: user ? {
        _id: user._id,
        name: user.name || undefined,
        image: user.image || undefined,
        username: user.username || undefined,
      } : null,
    };
  },
});

/**
 * 🎯 FEATURE 3: KING OF THE HILL - Récupère TOUS les arguments pour une décision (feed complet)
 */
export const getAllArguments = query({
  args: {
    decisionId: v.id("decisions"),
  },
  handler: async (ctx, args) => {
    // Récupérer tous les arguments pour cette décision
    const allArguments = await ctx.db
      .query("topArguments")
      .withIndex("decisionId", (q) => q.eq("decisionId", args.decisionId))
      .order("desc")
      .collect();

    // 🎯 TRIER LE FEED COMME INSTAGRAM :
    // 1. Commentaires payants (bid > 0) par investissement décroissant
    // 2. Commentaires gratuits (bid = 0) par date décroissante (plus récents en premier)
    allArguments.sort((a, b) => {
      // Si les deux sont payants, trier par bid décroissant
      if (a.currentBid > 0 && b.currentBid > 0) {
        return b.currentBid - a.currentBid;
      }
      // Si l'un est payant et l'autre gratuit, le payant passe en premier
      if (a.currentBid > 0 && b.currentBid === 0) {
        return -1;
      }
      if (a.currentBid === 0 && b.currentBid > 0) {
        return 1;
      }
      // Si les deux sont gratuits, trier par date décroissante (plus récents en premier)
      return b.createdAt - a.createdAt;
    });

    // Enrichir avec les infos utilisateurs et les mentions
    const enriched = await Promise.all(
      allArguments.map(async (arg) => {
        const user = await ctx.db.get(arg.userId) as any;
        
        // Enrichir les utilisateurs mentionnés
        const mentionedUsers = arg.mentionedUserIds && arg.mentionedUserIds.length > 0
          ? await Promise.all(
              arg.mentionedUserIds.map(async (userId) => {
                const mentionedUser = await ctx.db.get(userId) as any;
                return mentionedUser ? {
                  _id: mentionedUser._id,
                  name: mentionedUser.name || undefined,
                  username: mentionedUser.username || undefined,
                  image: mentionedUser.image || undefined,
                } : null;
              })
            )
          : [];
        
        return {
          ...arg,
          user: user ? {
            _id: user._id,
            name: user.name || undefined,
            image: user.image || undefined,
            username: user.username || undefined,
          } : null,
          mentionedUsers: mentionedUsers.filter(u => u !== null),
        };
      })
    );

    return enriched;
  },
});

/**
 * 🎯 FEATURE 3: KING OF THE HILL - Crée ou sur-enchérit sur un argument
 * MODIFIÉ : Permet maintenant de créer plusieurs arguments (même utilisateur)
 */
export const bidOnArgument = mutation({
  args: {
    decisionId: v.id("decisions"),
    content: v.string(),
    bidAmount: v.number(), // Montant de l'enchère en Seeds
    mentionedUserIds: v.optional(v.array(v.id("users"))), // IDs des utilisateurs mentionnés
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

    // 🎯 PERMETTRE LES COMMENTAIRES GRATUITS (bidAmount = 0)
    // Si bidAmount > 0, c'est pour se mettre en vedette (King of the Hill)
    if (args.bidAmount < 0) {
      throw new Error("Le montant ne peut pas être négatif.");
    }

    // Vérifier que l'utilisateur a assez de Seeds seulement si bidAmount > 0
    if (args.bidAmount > 0 && (appUser.seedsBalance || 0) < args.bidAmount) {
      throw new Error(`Vous n'avez pas assez de Seeds. Vous avez ${appUser.seedsBalance || 0} Seeds, mais vous devez payer ${args.bidAmount} Seeds.`);
    }

    // Récupérer tous les arguments pour cette décision (seulement ceux avec bid > 0)
    const existingArguments = await ctx.db
      .query("topArguments")
      .withIndex("decisionId", (q) =>
        q.eq("decisionId", args.decisionId)
      )
      .collect();

    // Trouver le top argument (celui avec le plus haut bid > 0)
    const paidArguments = existingArguments.filter((arg) => arg.currentBid > 0);
    const currentTop = paidArguments.reduce((top, current) => {
      return current.currentBid > top.currentBid ? current : top;
    }, paidArguments[0] || null);

    // Vérifier que la nouvelle enchère est supérieure au top actuel (seulement si on veut se mettre en vedette)
    if (args.bidAmount > 0 && currentTop && args.bidAmount <= currentTop.currentBid) {
      throw new Error(`Pour vous mettre en vedette, vous devez investir plus que ${currentTop.currentBid} Seeds. L'investissement actuel est de ${currentTop.currentBid} Seeds.`);
    }

    // 🎯 RÉSOUDRE LES MENTIONS DANS LE CONTENU
    // Extraire les usernames du texte (@username) et les résoudre en IDs
    const mentionRegex = /@(\w+)/g;
    const mentionedUsernames: string[] = [];
    let match;
    while ((match = mentionRegex.exec(args.content)) !== null) {
      mentionedUsernames.push(match[1].toLowerCase());
    }

    // Résoudre les usernames en IDs
    const resolvedMentionedUserIds: Id<"users">[] = [];
    if (mentionedUsernames.length > 0) {
      for (const username of mentionedUsernames) {
        const mentionedUser = await ctx.db
          .query("users")
          .withIndex("username", (q) => q.eq("username", username))
          .first();
        if (mentionedUser) {
          resolvedMentionedUserIds.push(mentionedUser._id);
        }
      }
    }

    // Utiliser les IDs résolus ou ceux fournis en paramètre
    const finalMentionedUserIds = args.mentionedUserIds && args.mentionedUserIds.length > 0
      ? args.mentionedUserIds
      : (resolvedMentionedUserIds.length > 0 ? resolvedMentionedUserIds : undefined);

    const now = Date.now();

    // Créer un NOUVEAU argument (on permet plusieurs arguments par utilisateur)
    // Si l'utilisateur sur-enchérit sur son propre argument, on crée quand même un nouveau
    const newArgument: any = {
      decisionId: args.decisionId,
      userId: appUser._id,
      content: args.content,
      currentBid: args.bidAmount,
      bidHistory: [
        {
          userId: appUser._id,
          amount: args.bidAmount,
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
    
    // Ajouter les mentions si présentes
    if (finalMentionedUserIds && finalMentionedUserIds.length > 0) {
      newArgument.mentionedUserIds = finalMentionedUserIds;
    }
    
    await ctx.db.insert("topArguments", newArgument);

    // 🎯 GESTION DES SEEDS : Seulement si bidAmount > 0 (mise en vedette)
    if (args.bidAmount > 0) {
      // Si un top argument existait et que ce n'était pas le même utilisateur, rembourser l'ancien propriétaire
      if (currentTop && currentTop.userId !== appUser._id) {
        const previousOwner = await ctx.db.get(currentTop.userId) as any;
        if (previousOwner) {
          await ctx.db.patch(currentTop.userId, {
            seedsBalance: (previousOwner.seedsBalance || 0) + currentTop.currentBid,
            updatedAt: now,
          });

          // Créer une transaction de remboursement
          await ctx.db.insert("seedsTransactions", {
            userId: currentTop.userId,
            type: "earned",
            amount: currentTop.currentBid,
            reason: "top_argument_refund",
            relatedId: currentTop._id,
            relatedType: "top_argument",
            levelBefore: previousOwner.level || 1,
            levelAfter: previousOwner.level || 1,
            createdAt: now,
          });
        }
      }

      // Débiter les Seeds de l'utilisateur
      const levelBefore = appUser.level || 1;
      await ctx.db.patch(appUser._id, {
        seedsBalance: (appUser.seedsBalance || 0) - args.bidAmount,
        updatedAt: now,
      });

      // Calculer le nouveau niveau
      const newSeedsBalance = (appUser.seedsBalance || 0) - args.bidAmount;
      const levelAfter = Math.floor(Math.sqrt(newSeedsBalance / 100)) + 1;

      // Créer une transaction de dépense
      await ctx.db.insert("seedsTransactions", {
        userId: appUser._id,
        type: "lost",
        amount: args.bidAmount,
        reason: "top_argument_bid",
        relatedId: undefined,
        relatedType: "top_argument",
        levelBefore,
        levelAfter,
        createdAt: now,
      });
    }

    return { success: true };
  },
});

/**
 * 🎯 BOOSTER UN COMMENTAIRE EXISTANT (après publication)
 * Met à jour le currentBid d'un commentaire existant pour le mettre en vedette
 */
export const boostArgument = mutation({
  args: {
    argumentId: v.id("topArguments"),
    bidAmount: v.number(), // Montant à investir pour booster
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

    // Récupérer le commentaire existant
    const argument = await ctx.db.get(args.argumentId);
    if (!argument) {
      throw new Error("Commentaire introuvable");
    }

    // 🎯 PERMETTRE DE BOOSTER N'IMPORTE QUEL COMMENTAIRE (pas seulement le sien)
    // Plus besoin de vérifier que c'est le propriétaire

    // Vérifier que le montant est supérieur à l'investissement actuel
    if (args.bidAmount <= argument.currentBid) {
      throw new Error(`Vous devez investir plus que ${argument.currentBid} Seeds pour booster ce commentaire.`);
    }

    // Vérifier que l'utilisateur a assez de Seeds
    if ((appUser.seedsBalance || 0) < args.bidAmount) {
      throw new Error(`Vous n'avez pas assez de Seeds. Vous avez ${appUser.seedsBalance || 0} Seeds, mais vous devez payer ${args.bidAmount} Seeds.`);
    }

    // Récupérer tous les commentaires payants pour cette décision
    const existingArguments = await ctx.db
      .query("topArguments")
      .withIndex("decisionId", (q) =>
        q.eq("decisionId", argument.decisionId)
      )
      .collect();

    const paidArguments = existingArguments.filter((arg) => arg.currentBid > 0 && arg._id !== args.argumentId);
    const currentTop = paidArguments.reduce((top, current) => {
      return current.currentBid > top.currentBid ? current : top;
    }, paidArguments[0] || null);

    // Vérifier que la nouvelle enchère est supérieure au top actuel (si un top existe)
    if (currentTop && args.bidAmount <= currentTop.currentBid) {
      throw new Error(`Pour vous mettre en vedette, vous devez investir plus que ${currentTop.currentBid} Seeds. L'investissement actuel est de ${currentTop.currentBid} Seeds.`);
    }

    const now = Date.now();

    // Si un top argument existait et que ce n'était pas le même utilisateur, rembourser l'ancien propriétaire
    if (currentTop && currentTop.userId !== appUser._id) {
      const previousOwner = await ctx.db.get(currentTop.userId) as any;
      if (previousOwner) {
        await ctx.db.patch(currentTop.userId, {
          seedsBalance: (previousOwner.seedsBalance || 0) + currentTop.currentBid,
          updatedAt: now,
        });

        // Créer une transaction de remboursement
        await ctx.db.insert("seedsTransactions", {
          userId: currentTop.userId,
          type: "earned",
          amount: currentTop.currentBid,
          reason: "top_argument_refund",
          relatedId: currentTop._id,
          relatedType: "top_argument",
          levelBefore: previousOwner.level || 1,
          levelAfter: previousOwner.level || 1,
          createdAt: now,
        });
      }
    }

    // Calculer la différence à débiter (seulement le supplément)
    const additionalAmount = args.bidAmount - argument.currentBid;

    // Débiter les Seeds de l'utilisateur (seulement le supplément)
    const levelBefore = appUser.level || 1;
    await ctx.db.patch(appUser._id, {
      seedsBalance: (appUser.seedsBalance || 0) - additionalAmount,
      updatedAt: now,
    });

    // Calculer le nouveau niveau
    const newSeedsBalance = (appUser.seedsBalance || 0) - additionalAmount;
    const levelAfter = Math.floor(Math.sqrt(newSeedsBalance / 100)) + 1;

    // Créer une transaction de dépense
    await ctx.db.insert("seedsTransactions", {
      userId: appUser._id,
      type: "lost",
      amount: additionalAmount,
      reason: "top_argument_boost",
      relatedId: args.argumentId,
      relatedType: "top_argument",
      levelBefore,
      levelAfter,
      createdAt: now,
    });

    // Mettre à jour le commentaire avec le nouveau bid
    await ctx.db.patch(args.argumentId, {
      currentBid: args.bidAmount,
      bidHistory: [
        ...argument.bidHistory,
        {
          userId: appUser._id,
          amount: args.bidAmount,
          timestamp: now,
        },
      ],
      updatedAt: now,
    });

    return { success: true };
  },
});

/**
 * Récupère l'historique des enchères pour une décision
 */
export const getBidHistory = query({
  args: {
    decisionId: v.id("decisions"),
  },
  handler: async (ctx, args) => {
    const arguments_ = await ctx.db
      .query("topArguments")
      .withIndex("decisionId", (q) => q.eq("decisionId", args.decisionId))
      .collect();

    // Enrichir l'historique avec les infos utilisateurs
    const enrichedHistory = await Promise.all(
      arguments_.map(async (arg) => {
        const enrichedBids = await Promise.all(
          arg.bidHistory.map(async (bid) => {
            const user = await ctx.db.get(bid.userId) as any;
            return {
              ...bid,
              user: user ? {
                _id: user._id,
                name: user.name || undefined,
                image: user.image || undefined,
                username: user.username || undefined,
              } : null,
            };
          })
        );
        return {
          argumentId: arg._id,
          content: arg.content,
          bids: enrichedBids,
        };
      })
    );

    return enrichedHistory;
  },
});
