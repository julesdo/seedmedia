/**
 * Script pour créer les marchés Municipales 2026
 * 
 * Utilisation :
 * 1. Exécuter cette fonction depuis le dashboard Convex ou via une action
 * 2. Les marchés seront créés avec les métadonnées spéciales
 * 
 * Date : 20 janvier 2026
 * Élections : Mars 2026 (1er tour généralement mi-mars, 2nd tour fin mars)
 */

import { internalMutation, action } from "../_generated/server";
import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

/**
 * Helper pour générer un slug unique à partir d'un titre
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

/**
 * Helper pour générer un hash de contenu
 */
function generateContentHash(title: string, sourceUrl: string): string {
  const content = `${title.toLowerCase().trim()}|${sourceUrl}`;
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(32, '0').substring(0, 32);
}

/**
 * Crée un marché municipal
 */
async function createMunicipalMarket(
  ctx: any,
  market: {
    title: string;
    description: string;
    question: string;
    decider: string;
    city?: string;
    region?: string;
    eventCategory: "blockbuster" | "tendance" | "insolite";
    targetPrice: number; // 1-99 Seeds
    depthFactor: number; // 500-10000
    sentiment: "positive" | "negative" | "neutral";
    heat: number; // 0-100
    sourceUrl: string;
    sourceName?: string;
    imageUrl?: string;
  }
): Promise<Id<"decisions"> | null> {
  const now = Date.now();
  const slug = generateSlug(market.title);
  const contentHash = generateContentHash(market.title, market.sourceUrl);

  // Vérifier que le slug est unique
  const existing = await ctx.db
    .query("decisions")
    .withIndex("slug", (q: any) => q.eq("slug", slug))
    .first();

  if (existing) {
    console.log(`⚠️ Marché déjà existant: ${market.title}`);
    return null;
  }

  // Date de résolution : après le 2nd tour (fin mars 2026)
  // Les municipales ont généralement lieu le 15 mars (1er tour) et 22 mars (2nd tour)
  const resolutionDate = new Date("2026-03-23").getTime(); // Après le 2nd tour

  const decisionId = await ctx.db.insert("decisions", {
    title: market.title,
    description: market.description,
    slug,
    contentHash,
    decider: market.decider,
    deciderType: "institution" as const,
    date: now, // Date de création
    type: "election" as const,
    officialText: market.description,
    sourceUrl: market.sourceUrl,
    sourceName: market.sourceName || "Ministère de l'Intérieur",
    impactedDomains: ["politique", "société"],
    indicatorIds: [],
    question: market.question,
    answer1: "OUI", // Système binaire
    targetPrice: market.targetPrice,
    depthFactor: market.depthFactor,
    imageUrl: market.imageUrl,
    imageSource: market.imageUrl ? "Pexels" : undefined,
    createdBy: "manual" as const,
    status: "announced" as const,
    anticipationsCount: 0,
    sourcesCount: 0,
    sentiment: market.sentiment,
    heat: market.heat,
    emoji: "🗳️",
    badgeColor: "#3b82f6", // Bleu pour les municipales
    // ✅ ÉVÉNEMENTS SPÉCIAUX
    specialEvent: "municipales_2026" as const,
    specialEventMetadata: {
      region: market.region,
      city: market.city,
      eventCategory: market.eventCategory,
    },
    createdAt: now,
    updatedAt: now,
  });

  // Initialiser les pools de trading
  try {
    await ctx.scheduler.runAfter(0, internal.trading.initializeTradingPools, {
      decisionId,
    });
  } catch (error) {
    console.error("Error initializing trading pools:", error);
  }

  return decisionId;
}

/**
 * Crée tous les marchés Municipales 2026
 */
export const createAllMunicipalesMarkets = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const createdMarkets: Array<{ title: string; decisionId: Id<"decisions"> | null }> = [];

    // ============================================
    // BLOCKBUSTERS (3-5 marchés)
    // ============================================

    // 1. Bataille de Paris 🗼
    const parisMarket = await createMunicipalMarket(ctx, {
      title: "Bataille de Paris 🗼",
      description: "Élection municipale de Paris 2026. Qui sera le prochain maire de la capitale ? Selon les résultats officiels du Ministère de l'Intérieur après le 2nd tour.",
      question: "Rachida Dati (ou autre candidat clé) sera-t-elle la prochaine Maire de Paris après le 2nd tour des municipales 2026 ?",
      decider: "Ministère de l'Intérieur",
      city: "Paris",
      region: "Île-de-France",
      eventCategory: "blockbuster",
      targetPrice: 50, // Probabilité moyenne
      depthFactor: 3000, // Marché volatile (beaucoup d'incertitude)
      sentiment: "neutral",
      heat: 85, // Très chaud (élection très suivie)
      sourceUrl: "https://www.interieur.gouv.fr/Elections/Les-resultats/Municipales",
      sourceName: "Ministère de l'Intérieur",
    });
    createdMarkets.push({ title: "Bataille de Paris 🗼", decisionId: parisMarket });

    // 2. La Vague Bleue Marine ? 🌊
    const rnMarket = await createMunicipalMarket(ctx, {
      title: "La Vague Bleue Marine ? 🌊",
      description: "Le Rassemblement National (RN) tentera de remporter plusieurs grandes villes lors des municipales 2026. Selon les résultats officiels du Ministère de l'Intérieur après le 2nd tour.",
      question: "Le RN gagnera-t-il la mairie de Marseille ou Perpignan après le 2nd tour des municipales 2026 ?",
      decider: "Ministère de l'Intérieur",
      city: undefined, // Plusieurs villes
      region: undefined, // National
      eventCategory: "blockbuster",
      targetPrice: 45, // Légèrement en faveur du NON
      depthFactor: 2500, // Très volatile
      sentiment: "neutral",
      heat: 80,
      sourceUrl: "https://www.interieur.gouv.fr/Elections/Les-resultats/Municipales",
      sourceName: "Ministère de l'Intérieur",
    });
    createdMarkets.push({ title: "La Vague Bleue Marine ? 🌊", decisionId: rnMarket });

    // 3. Lyon : Les Écolos Gardent ? 🟢
    const lyonMarket = await createMunicipalMarket(ctx, {
      title: "Lyon : Les Écolos Gardent ? 🟢",
      description: "Élection municipale de Lyon 2026. Les écologistes pourront-ils conserver la mairie ? Selon les résultats officiels du Ministère de l'Intérieur après le 2nd tour.",
      question: "Les Écologistes garderont-ils la mairie de Lyon après le 2nd tour des municipales 2026 ?",
      decider: "Ministère de l'Intérieur",
      city: "Lyon",
      region: "Auvergne-Rhône-Alpes",
      eventCategory: "blockbuster",
      targetPrice: 55, // Légèrement en faveur du OUI (sortants)
      depthFactor: 3000,
      sentiment: "positive",
      heat: 75,
      sourceUrl: "https://www.interieur.gouv.fr/Elections/Les-resultats/Municipales",
      sourceName: "Ministère de l'Intérieur",
    });
    createdMarkets.push({ title: "Lyon : Les Écolos Gardent ? 🟢", decisionId: lyonMarket });

    // ============================================
    // TENDANCES NATIONALES (5-7 marchés)
    // ============================================

    // 4. Le RN Remportera-t-il Plus de 15 Villes ?
    const rn15Villes = await createMunicipalMarket(ctx, {
      title: "Le RN Remportera-t-il Plus de 15 Villes ?",
      description: "Tendance nationale : le RN tentera de remporter de nombreuses villes de plus de 100 000 habitants. Selon les résultats officiels du Ministère de l'Intérieur après le 2nd tour.",
      question: "Le RN remportera-t-il plus de 15 villes de plus de 100 000 habitants après le 2nd tour des municipales 2026 ?",
      decider: "Ministère de l'Intérieur",
      eventCategory: "tendance",
      targetPrice: 40, // Légèrement en faveur du NON
      depthFactor: 4000,
      sentiment: "neutral",
      heat: 70,
      sourceUrl: "https://www.interieur.gouv.fr/Elections/Les-resultats/Municipales",
      sourceName: "Ministère de l'Intérieur",
    });
    createdMarkets.push({ title: "Le RN Remportera-t-il Plus de 15 Villes ?", decisionId: rn15Villes });

    // 5. L'Abstention Dépassera-t-elle 60% ?
    const abstentionMarket = await createMunicipalMarket(ctx, {
      title: "L'Abstention Dépassera-t-elle 60% ? 🗳️",
      description: "Tendance nationale : l'abstention aux municipales. Selon les chiffres officiels du Ministère de l'Intérieur au 1er tour.",
      question: "L'abstention dépassera-t-elle 60% au premier tour des municipales 2026 ?",
      decider: "Ministère de l'Intérieur",
      eventCategory: "tendance",
      targetPrice: 50, // Probabilité moyenne
      depthFactor: 5000, // Marché stable
      sentiment: "negative",
      heat: 65,
      sourceUrl: "https://www.interieur.gouv.fr/Elections/Les-resultats/Municipales",
      sourceName: "Ministère de l'Intérieur",
    });
    createdMarkets.push({ title: "L'Abstention Dépassera-t-elle 60% ? 🗳️", decisionId: abstentionMarket });

    // 6. L'Hécatombe des Ministres 📉
    const ministresMarket = await createMunicipalMarket(ctx, {
      title: "L'Hécatombe des Ministres 📉",
      description: "Plusieurs ministres en exercice se présentent aux municipales. Selon les résultats officiels du Ministère de l'Intérieur après le 2nd tour.",
      question: "Plus de 5 ministres en exercice perdront-ils leur élection municipale après le 2nd tour des municipales 2026 ?",
      decider: "Ministère de l'Intérieur",
      eventCategory: "tendance",
      targetPrice: 45, // Légèrement en faveur du NON
      depthFactor: 3500,
      sentiment: "negative",
      heat: 70,
      sourceUrl: "https://www.interieur.gouv.fr/Elections/Les-resultats/Municipales",
      sourceName: "Ministère de l'Intérieur",
    });
    createdMarkets.push({ title: "L'Hécatombe des Ministres 📉", decisionId: ministresMarket });

    // 7. La Participation Dépassera-t-elle 45% ?
    const participationMarket = await createMunicipalMarket(ctx, {
      title: "La Participation Dépassera-t-elle 45% ?",
      description: "Tendance nationale : taux de participation au 1er tour. Selon les chiffres officiels du Ministère de l'Intérieur.",
      question: "La participation au premier tour des municipales 2026 dépassera-t-elle 45% au niveau national ?",
      decider: "Ministère de l'Intérieur",
      eventCategory: "tendance",
      targetPrice: 55, // Légèrement en faveur du OUI
      depthFactor: 5000,
      sentiment: "positive",
      heat: 60,
      sourceUrl: "https://www.interieur.gouv.fr/Elections/Les-resultats/Municipales",
      sourceName: "Ministère de l'Intérieur",
    });
    createdMarkets.push({ title: "La Participation Dépassera-t-elle 45% ?", decisionId: participationMarket });

    // 8. Le RN Gagnera-t-il Plus de Mairies qu'en 2020 ?
    const rnVs2020 = await createMunicipalMarket(ctx, {
      title: "Le RN Gagnera-t-il Plus de Mairies qu'en 2020 ?",
      description: "Comparaison avec les résultats de 2020. Selon les résultats officiels du Ministère de l'Intérieur après le 2nd tour.",
      question: "Le RN remportera-t-il plus de mairies qu'en 2020 après le 2nd tour des municipales 2026 ?",
      decider: "Ministère de l'Intérieur",
      eventCategory: "tendance",
      targetPrice: 60, // En faveur du OUI (tendance haussière)
      depthFactor: 4000,
      sentiment: "neutral",
      heat: 75,
      sourceUrl: "https://www.interieur.gouv.fr/Elections/Les-resultats/Municipales",
      sourceName: "Ministère de l'Intérieur",
    });
    createdMarkets.push({ title: "Le RN Gagnera-t-il Plus de Mairies qu'en 2020 ?", decisionId: rnVs2020 });

    // ============================================
    // INSOLITES / BUZZ (2-3 marchés)
    // ============================================

    // 9. Une Célébrité Élue ?
    const celebriteMarket = await createMunicipalMarket(ctx, {
      title: "Une Célébrité Élue ?",
      description: "Marché insolite : une célébrité (hors politique) sera-t-elle élue ? Selon les résultats officiels du Ministère de l'Intérieur après le 2nd tour.",
      question: "Une célébrité (hors politique) sera-t-elle élue conseillère municipale dans une grande ville (plus de 100 000 habitants) après le 2nd tour des municipales 2026 ?",
      decider: "Ministère de l'Intérieur",
      eventCategory: "insolite",
      targetPrice: 30, // Probabilité faible
      depthFactor: 2000, // Très volatile (marché fun)
      sentiment: "positive",
      heat: 50,
      sourceUrl: "https://www.interieur.gouv.fr/Elections/Les-resultats/Municipales",
      sourceName: "Ministère de l'Intérieur",
    });
    createdMarkets.push({ title: "Une Célébrité Élue ?", decisionId: celebriteMarket });

    // 10. Égalité Parfaite (Pile ou Face) ?
    const egaliteMarket = await createMunicipalMarket(ctx, {
      title: "Égalité Parfaite (Pile ou Face) ?",
      description: "Marché insolite : une égalité parfaite au 2nd tour nécessitant un tirage au sort. Selon les résultats officiels du Ministère de l'Intérieur.",
      question: "Y aura-t-il au moins une ville où le 2nd tour se terminera par une égalité parfaite (nécessitant un tirage au sort) lors des municipales 2026 ?",
      decider: "Ministère de l'Intérieur",
      eventCategory: "insolite",
      targetPrice: 20, // Probabilité très faible
      depthFactor: 1500, // Très volatile (marché fun)
      sentiment: "neutral",
      heat: 40,
      sourceUrl: "https://www.interieur.gouv.fr/Elections/Les-resultats/Municipales",
      sourceName: "Ministère de l'Intérieur",
    });
    createdMarkets.push({ title: "Égalité Parfaite (Pile ou Face) ?", decisionId: egaliteMarket });

    // Résumé
    const successCount = createdMarkets.filter(m => m.decisionId !== null).length;
    const failedCount = createdMarkets.filter(m => m.decisionId === null).length;

    console.log(`✅ ${successCount} marchés créés avec succès`);
    if (failedCount > 0) {
      console.log(`⚠️ ${failedCount} marchés déjà existants ou en erreur`);
    }

    return {
      success: true,
      created: successCount,
      failed: failedCount,
      markets: createdMarkets,
    };
  },
});

/**
 * Action publique pour créer les marchés Municipales 2026
 * Utilisable depuis le dashboard Convex ou via une action manuelle
 */
export const createMunicipalesMarkets = action({
  args: {},
  handler: async (ctx): Promise<{
    success: boolean;
    created: number;
    failed: number;
    markets: Array<{ title: string; decisionId: Id<"decisions"> | null }>;
  }> => {
    // Exécuter la mutation interne
    const result = await ctx.runMutation(internal.scripts.createMunicipalesMarkets.createAllMunicipalesMarkets, {});
    return result;
  },
});

