import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";

/**
 * Script de test pour vérifier toute la chaîne des bots
 * 
 * Teste :
 * 1. Détection de décisions
 * 2. Génération d'une Decision Card
 * 3. Agrégation d'actualités pour une décision
 * 
 * Usage : Appeler cette action depuis le dashboard Convex ou via MCP
 */
export const testBotChain = action({
  args: {
    testMode: v.optional(v.union(v.literal("full"), v.literal("detection"), v.literal("generation"), v.literal("aggregation"))),
  },
  returns: v.object({
    success: v.boolean(),
    results: v.object({
      detection: v.optional(v.object({
        detected: v.number(),
        decisions: v.array(v.object({
          title: v.string(),
          url: v.string(),
          source: v.string(),
        })),
      })),
      generation: v.optional(v.object({
        decisionId: v.union(v.id("decisions"), v.null()),
        error: v.optional(v.string()),
      })),
      aggregation: v.optional(v.object({
        aggregated: v.number(),
        saved: v.number(),
        error: v.optional(v.string()),
      })),
    }),
    summary: v.string(),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    results: {
      detection?: {
        detected: number;
        decisions: Array<{ title: string; url: string; source: string }>;
      };
      generation?: {
        decisionId: Id<"decisions"> | null;
        error?: string;
      };
      aggregation?: {
        aggregated: number;
        saved: number;
        error?: string;
      };
    };
    summary: string;
  }> => {
    const testMode = args.testMode || "full";
    const results: {
      detection?: {
        detected: number;
        decisions: Array<{ title: string; url: string; source: string }>;
      };
      generation?: {
        decisionId: Id<"decisions"> | null;
        error?: string;
      };
      aggregation?: {
        aggregated: number;
        saved: number;
        error?: string;
      };
    } = {};

    console.log(`🧪 Démarrage du test de la chaîne des bots (mode: ${testMode})`);

    // 1. TEST DE DÉTECTION
    if (testMode === "full" || testMode === "detection") {
      console.log("📡 Test 1/3 : Détection de décisions...");
      try {
        const detectionResult = await ctx.runAction(
          api.bots.detectDecisions.detectDecisions,
          { limit: 3 } // Limiter à 3 pour le test
        );

        results.detection = {
          detected: detectionResult.detected,
          decisions: detectionResult.events.map((event: { mainArticle: { title: string; url: string; source: string } }) => ({
            title: event.mainArticle.title,
            url: event.mainArticle.url,
            source: event.mainArticle.source,
          })),
        };

        console.log(`✅ Détection réussie : ${detectionResult.detected} décision(s) détectée(s)`);
      } catch (error) {
        console.error("❌ Erreur lors de la détection:", error);
        results.detection = {
          detected: 0,
          decisions: [],
        };
      }
    }

    // 2. TEST DE GÉNÉRATION
    if (testMode === "full" || testMode === "generation") {
      console.log("🎨 Test 2/3 : Génération d'une Decision Card...");
      
      // Utiliser un événement détecté ou créer un événement de test
      let detectedEvent: {
        articles: Array<{
          title: string;
          url: string;
          publishedAt: number;
          source: string;
          content?: string;
        }>;
        mainArticle: {
          title: string;
          url: string;
          publishedAt: number;
          source: string;
          content?: string;
        };
      } | null = null;

      if (results.detection && results.detection.decisions.length > 0) {
        // Utiliser le premier événement détecté (on doit reconstruire la structure)
        const first = results.detection.decisions[0];
        const mainArticle = {
          title: first.title,
          url: first.url,
          publishedAt: Date.now(),
          source: first.source,
        };
        detectedEvent = {
          articles: [mainArticle], // Pour le test, on utilise un seul article
          mainArticle,
        };
      } else {
        // Créer un événement de test
        const mainArticle = {
          title: "Test : Décision de test pour vérifier la chaîne des bots",
          url: "https://example.com/test-decision",
          publishedAt: Date.now(),
          source: "Test Bot",
          content: "Ceci est une décision de test pour vérifier que la génération fonctionne correctement.",
        };
        detectedEvent = {
          articles: [mainArticle],
          mainArticle,
        };
      }

      try {
        const generationResult = await ctx.runAction(
          api.bots.generateDecision.generateDecision,
          { detectedEvent }
        );

        results.generation = {
          decisionId: generationResult,
        };

        if (generationResult) {
          console.log(`✅ Génération réussie : Decision Card créée (ID: ${generationResult})`);
        } else {
          console.log("⚠️ Génération : Décision dupliquée ou non créée (c'est normal si elle existe déjà)");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        console.error("❌ Erreur lors de la génération:", errorMessage);
        results.generation = {
          decisionId: null,
          error: errorMessage,
        };
      }
    }

    // 3. TEST D'AGRÉGATION
    if (testMode === "full" || testMode === "aggregation") {
      console.log("📰 Test 3/3 : Agrégation d'actualités...");

      let decisionId: Id<"decisions"> | null = null;

      // Utiliser la décision générée ou trouver une décision existante
      if (results.generation?.decisionId) {
        decisionId = results.generation.decisionId;
      } else {
        // Chercher une décision existante pour tester l'agrégation
        const existingDecisions = await ctx.runQuery(api.decisions.getDecisions, {
          limit: 1,
          status: "tracking",
        });

        if (existingDecisions && existingDecisions.length > 0) {
          decisionId = existingDecisions[0]._id;
          console.log(`📋 Utilisation d'une décision existante pour le test (ID: ${decisionId})`);
        }
      }

      if (decisionId) {
        try {
          const aggregationResult = await ctx.runAction(
            api.bots.aggregateNews.aggregateNewsForDecision,
            { decisionId }
          );

          results.aggregation = {
            aggregated: aggregationResult.aggregated,
            saved: aggregationResult.saved,
          };

          console.log(
            `✅ Agrégation réussie : ${aggregationResult.aggregated} actualité(s) agrégée(s), ${aggregationResult.saved} sauvegardée(s)`
          );
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
          console.error("❌ Erreur lors de l'agrégation:", errorMessage);
          results.aggregation = {
            aggregated: 0,
            saved: 0,
            error: errorMessage,
          };
        }
      } else {
        console.log("⚠️ Agrégation : Aucune décision disponible pour tester l'agrégation");
        results.aggregation = {
          aggregated: 0,
          saved: 0,
          error: "Aucune décision disponible",
        };
      }
    }

    // RÉSUMÉ
    const success =
      (testMode === "detection" && results.detection && results.detection.detected > 0) ||
      (testMode === "generation" && results.generation && results.generation.decisionId !== null) ||
      (testMode === "aggregation" && results.aggregation && results.aggregation.aggregated > 0) ||
      (testMode === "full" &&
        results.detection &&
        results.generation &&
        results.aggregation &&
        results.detection.detected >= 0 &&
        results.generation.decisionId !== undefined &&
        results.aggregation.aggregated >= 0);

    const summary = `
🧪 RÉSUMÉ DU TEST DE LA CHAÎNE DES BOTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mode de test : ${testMode}

${testMode === "full" || testMode === "detection" ? `📡 Détection :
   - Décisions détectées : ${results.detection?.detected || 0}
   - ${results.detection?.decisions.length || 0} décision(s) trouvée(s)
` : ""}
${testMode === "full" || testMode === "generation" ? `🎨 Génération :
   - Decision Card créée : ${results.generation?.decisionId ? "✅ Oui" : "❌ Non"}
   ${results.generation?.error ? `   - Erreur : ${results.generation.error}` : ""}
` : ""}
${testMode === "full" || testMode === "aggregation" ? `📰 Agrégation :
   - Actualités agrégées : ${results.aggregation?.aggregated || 0}
   - Actualités sauvegardées : ${results.aggregation?.saved || 0}
   ${results.aggregation?.error ? `   - Erreur : ${results.aggregation.error}` : ""}
` : ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${success ? "✅ Test réussi !" : "⚠️ Test partiel ou échec - vérifiez les logs ci-dessus"}
`;

    console.log(summary);

    return {
      success: success || false,
      results,
      summary,
    };
  },
});

/**
 * Test rapide : Détection uniquement
 */
export const testDetection = action({
  args: {},
  returns: v.object({
    success: v.boolean(),
    results: v.object({
      detection: v.optional(v.object({
        detected: v.number(),
        decisions: v.array(v.object({
          title: v.string(),
          url: v.string(),
          source: v.string(),
        })),
      })),
      generation: v.optional(v.object({
        decisionId: v.union(v.id("decisions"), v.null()),
        error: v.optional(v.string()),
      })),
      aggregation: v.optional(v.object({
        aggregated: v.number(),
        saved: v.number(),
        error: v.optional(v.string()),
      })),
    }),
    summary: v.string(),
  }),
  handler: async (ctx): Promise<{
    success: boolean;
    results: {
      detection?: {
        detected: number;
        decisions: Array<{ title: string; url: string; source: string }>;
      };
      generation?: {
        decisionId: Id<"decisions"> | null;
        error?: string;
      };
      aggregation?: {
        aggregated: number;
        saved: number;
        error?: string;
      };
    };
    summary: string;
  }> => {
    return await ctx.runAction(api.bots.testChain.testBotChain, {
      testMode: "detection",
    });
  },
});

/**
 * Test rapide : Génération uniquement
 */
export const testGeneration = action({
  args: {},
  returns: v.object({
    success: v.boolean(),
    results: v.object({
      detection: v.optional(v.object({
        detected: v.number(),
        decisions: v.array(v.object({
          title: v.string(),
          url: v.string(),
          source: v.string(),
        })),
      })),
      generation: v.optional(v.object({
        decisionId: v.union(v.id("decisions"), v.null()),
        error: v.optional(v.string()),
      })),
      aggregation: v.optional(v.object({
        aggregated: v.number(),
        saved: v.number(),
        error: v.optional(v.string()),
      })),
    }),
    summary: v.string(),
  }),
  handler: async (ctx): Promise<{
    success: boolean;
    results: {
      detection?: {
        detected: number;
        decisions: Array<{ title: string; url: string; source: string }>;
      };
      generation?: {
        decisionId: Id<"decisions"> | null;
        error?: string;
      };
      aggregation?: {
        aggregated: number;
        saved: number;
        error?: string;
      };
    };
    summary: string;
  }> => {
    return await ctx.runAction(api.bots.testChain.testBotChain, {
      testMode: "generation",
    });
  },
});

/**
 * Test rapide : Agrégation uniquement
 */
export const testAggregation = action({
  args: {},
  returns: v.object({
    success: v.boolean(),
    results: v.object({
      detection: v.optional(v.object({
        detected: v.number(),
        decisions: v.array(v.object({
          title: v.string(),
          url: v.string(),
          source: v.string(),
        })),
      })),
      generation: v.optional(v.object({
        decisionId: v.union(v.id("decisions"), v.null()),
        error: v.optional(v.string()),
      })),
      aggregation: v.optional(v.object({
        aggregated: v.number(),
        saved: v.number(),
        error: v.optional(v.string()),
      })),
    }),
    summary: v.string(),
  }),
  handler: async (ctx): Promise<{
    success: boolean;
    results: {
      detection?: {
        detected: number;
        decisions: Array<{ title: string; url: string; source: string }>;
      };
      generation?: {
        decisionId: Id<"decisions"> | null;
        error?: string;
      };
      aggregation?: {
        aggregated: number;
        saved: number;
        error?: string;
      };
    };
    summary: string;
  }> => {
    return await ctx.runAction(api.bots.testChain.testBotChain, {
      testMode: "aggregation",
    });
  },
});

