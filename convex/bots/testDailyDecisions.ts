import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

/**
 * Test grandeur nature : Génère les décisions géopolitiques de la journée
 * Simule le comportement des cron jobs mais de manière manuelle avec logs détaillés
 */
export const generateDailyDecisions = action({
  args: {
    limit: v.optional(v.number()), // Nombre max de décisions à détecter (défaut: 10)
  },
  returns: v.object({
    success: v.boolean(),
    summary: v.string(),
    results: v.object({
      detected: v.number(),
      generated: v.number(),
      failed: v.number(),
      decisions: v.array(v.object({
        decisionId: v.id("decisions"),
        title: v.string(),
        question: v.string(),
        hasImage: v.boolean(),
        newsAggregated: v.optional(v.number()),
      })),
      errors: v.array(v.string()),
    }),
  }),
  handler: async (ctx, args): Promise<{
    success: boolean;
    summary: string;
    results: {
      detected: number;
      generated: number;
      failed: number;
      decisions: Array<{
        decisionId: Id<"decisions">;
        title: string;
        question: string;
        hasImage: boolean;
        newsAggregated?: number;
      }>;
      errors: string[];
    };
  }> => {
    const limit = args.limit || 10;
    
    console.log(`🚀 Démarrage du test grandeur nature - Génération des décisions du jour`);
    console.log(`📊 Limite: ${limit} décisions à détecter`);

    const results = {
      detected: 0,
      generated: 0,
      failed: 0,
      decisions: [] as Array<{
        decisionId: Id<"decisions">;
        title: string;
        question: string;
        hasImage: boolean;
        newsAggregated?: number;
      }>,
      errors: [] as string[],
    };

    // 1. DÉTECTION DES ÉVÉNEMENTS MAJEURS
    console.log(`\n📡 Étape 1/3 : Détection des événements majeurs...`);
    let detectedEvents: Array<{
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
    }> = [];

    try {
      const detectionResult = await ctx.runAction(
        api.bots.detectDecisions.detectDecisions,
        { limit }
      );

      detectedEvents = detectionResult.events || [];
      results.detected = detectionResult.detected || 0;

      console.log(`✅ ${detectionResult.detected || 0} événement(s) majeur(s) détecté(s)`);
      detectedEvents.forEach((event, i) => {
        console.log(`   ${i + 1}. ${event.mainArticle.title.substring(0, 80)}... (${event.articles.length} articles)`);
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
      console.error(`❌ Erreur lors de la détection:`, errorMsg);
      results.errors.push(`Détection: ${errorMsg}`);
      return {
        success: false,
        summary: `❌ Échec lors de la détection: ${errorMsg}`,
        results,
      };
    }

    if (detectedEvents.length === 0) {
      return {
        success: false,
        summary: `⚠️ Aucun événement majeur détecté aujourd'hui`,
        results,
      };
    }

    // 2. GÉNÉRATION DES DECISION CARDS
    console.log(`\n🎨 Étape 2/3 : Génération des Decision Cards...`);
    
    for (let i = 0; i < detectedEvents.length; i++) {
      const detectedEvent = detectedEvents[i];
      console.log(`\n   [${i + 1}/${detectedEvents.length}] Génération: ${detectedEvent.mainArticle.title.substring(0, 60)}... (${detectedEvent.articles.length} articles)`);

      try {
        const decisionId = await ctx.runAction(
          api.bots.generateDecision.generateDecision,
          { detectedEvent }
        );

        if (decisionId) {
          // Récupérer les détails de la décision créée
          const decision = await ctx.runQuery(api.decisions.getDecisionById, {
            decisionId,
          });

          if (decision) {
            results.generated++;
            results.decisions.push({
              decisionId,
              title: decision.title,
              question: decision.question,
              hasImage: !!decision.imageUrl,
            });

            console.log(`   ✅ Decision Card créée (ID: ${decisionId})`);
            console.log(`      Question: ${decision.question}`);
            console.log(`      Image: ${decision.imageUrl ? "✅ Oui" : "❌ Non"}`);
            console.log(`      Décideur: ${decision.decider}`);
            console.log(`      Type: ${decision.type}`);

            // 3. AGRÉGATION D'ACTUALITÉS (en parallèle après génération)
            try {
              console.log(`   📰 Agrégation des actualités...`);
              const aggregationResult = await ctx.runAction(
                api.bots.aggregateNews.aggregateNewsForDecision,
                { decisionId }
              );

              if (aggregationResult) {
                const lastDecision = results.decisions[results.decisions.length - 1];
                lastDecision.newsAggregated = aggregationResult.aggregated;
                console.log(`      ✅ ${aggregationResult.aggregated} actualité(s) agrégée(s), ${aggregationResult.saved} sauvegardée(s)`);
              }
            } catch (aggError) {
              const errorMsg = aggError instanceof Error ? aggError.message : "Erreur inconnue";
              console.error(`      ⚠️ Erreur lors de l'agrégation: ${errorMsg}`);
              results.errors.push(`Agrégation pour ${decision.title}: ${errorMsg}`);
            }
          }
        } else {
          console.log(`   ⚠️ Décision dupliquée ou non créée (c'est normal si elle existe déjà)`);
          results.failed++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Erreur inconnue";
        console.error(`   ❌ Erreur lors de la génération:`, errorMsg);
        results.errors.push(`Génération pour ${detectedEvent.mainArticle.title}: ${errorMsg}`);
        results.failed++;
      }
    }

    // RÉSUMÉ FINAL
    const success = results.generated > 0;
    const summary = `
🎯 RÉSUMÉ DU TEST GRANDEUR NATURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📡 Détection :
   - Décisions détectées : ${results.detected}

🎨 Génération :
   - Decision Cards créées : ${results.generated}
   - Échecs/Doublons : ${results.failed}

📰 Agrégation :
   - Décisions avec actualités : ${results.decisions.filter(d => d.newsAggregated && d.newsAggregated > 0).length}
   - Total actualités agrégées : ${results.decisions.reduce((sum, d) => sum + (d.newsAggregated || 0), 0)}

🖼️ Images :
   - Décisions avec image : ${results.decisions.filter(d => d.hasImage).length}

${results.errors.length > 0 ? `\n⚠️ Erreurs (${results.errors.length}) :\n${results.errors.map(e => `   - ${e}`).join("\n")}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${success ? "✅ Test réussi ! Les décisions du jour ont été créées." : "❌ Aucune décision n'a pu être créée."}
`;

    console.log(summary);

    return {
      success,
      summary,
      results,
    };
  },
});

