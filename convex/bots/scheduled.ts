import { api } from "../_generated/api";
import { internalAction, action } from "../_generated/server";

/**
 * Action interne pour la détection et génération de décisions
 */
export const runDecisionDetection = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("Running decision detection...");

    try {
      // Détecter les nouvelles décisions
      // @ts-ignore - Type instantiation is excessively deep (known Convex type issue)
      const result = await ctx.runAction(api.bots.detectDecisions.detectDecisions, {
        limit: 25, // Augmenté de 10 à 25 pour créer plus de décisions à chaque exécution
      });

      console.log(`Detected ${result.detected} potential events`);

      // Cache des décisions créées dans cette batch pour éviter les doublons
      const createdInThisBatch: Array<{ title: string; sourceUrl: string; slug: string }> = [];

      // Pour chaque événement majeur détecté, générer une Decision Card
      for (const detectedEvent of result.events) {
        const decisionId = await ctx.runAction(
          // @ts-ignore - Type instantiation is excessively deep (known Convex type issue)
          api.bots.generateDecision.generateDecision,
          {
            detectedEvent,
            createdInThisBatch, // Passer le cache pour vérification
          }
        );
        
        // Si une décision a été créée, récupérer ses infos pour le cache
        if (decisionId) {
          try {
            const decision = await ctx.runQuery(api.decisions.getDecisionById, {
              decisionId,
            });
            if (decision) {
              createdInThisBatch.push({
                title: decision.title,
                sourceUrl: decision.sourceUrl,
                slug: decision.slug,
              });
            }
          } catch (error) {
            // Ignorer les erreurs de récupération pour le cache
            console.warn("Error fetching decision for cache:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error in detectDecisions:", error);
    }
  },
});

/**
 * Action publique pour déclencher manuellement la détection et génération
 * Utile pour tester ou déclencher manuellement depuis le dashboard
 */
export const triggerDecisionGeneration = action({
  args: {},
  handler: async (ctx): Promise<{
    success: boolean;
    detected?: number;
    generated?: number;
    decisionIds?: string[];
    errors?: string[];
    error?: string;
  }> => {
    console.log("Manually triggering decision detection and generation...");

    try {
      // Détecter les nouvelles décisions
      const result: {
        detected: number;
        events: Array<{
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
        }>;
      } = await ctx.runAction(api.bots.detectDecisions.detectDecisions, {
        limit: 25, // Augmenté de 10 à 25 pour créer plus de décisions à chaque exécution
      });

      console.log(`Detected ${result.detected} potential events`);

      const generated: string[] = [];
      const errors: string[] = [];
      
      // Cache des décisions créées dans cette batch pour éviter les doublons
      // Format: { title: string, sourceUrl: string, slug: string }[]
      const createdInThisBatch: Array<{ title: string; sourceUrl: string; slug: string }> = [];

      // Pour chaque événement majeur détecté, générer une Decision Card
      for (const detectedEvent of result.events) {
        try {
          const decisionId = await ctx.runAction(
            // @ts-ignore - Type instantiation is excessively deep (known Convex type issue)
            api.bots.generateDecision.generateDecision,
            {
              detectedEvent,
              createdInThisBatch, // Passer le cache pour vérification
            }
          );
          if (decisionId) {
            generated.push(decisionId);
            
            // Récupérer les infos de la décision créée pour le cache
            try {
              const decision = await ctx.runQuery(api.decisions.getDecisionById, {
                decisionId,
              });
              if (decision) {
                createdInThisBatch.push({
                  title: decision.title,
                  sourceUrl: decision.sourceUrl,
                  slug: decision.slug,
                });
              }
            } catch (cacheError) {
              // Ignorer les erreurs de récupération pour le cache
              console.warn("Error fetching decision for cache:", cacheError);
            }
            
            console.log(`✅ Generated Decision Card: ${decisionId}`);
          } else {
            console.log(`⚠️ Decision Card generation returned null (likely duplicate)`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          errors.push(errorMsg);
          console.error(`❌ Error generating Decision Card:`, errorMsg);
        }
      }

      return {
        success: true,
        detected: result.detected,
        generated: generated.length,
        decisionIds: generated,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error("Error in triggerDecisionGeneration:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});

/**
 * Action interne pour la traduction des décisions
 */
export const runDecisionTranslation = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("Running scheduled decision translations...");

    try {
      // Récupérer les décisions non traduites
      const decisions = await ctx.runQuery(api.decisions.getDecisions, {
        limit: 50,
        status: "announced",
      });

      // Langues supportées (à étendre)
      const languages = ["en", "es", "de", "it", "pt"];

      // Traduire chaque décision dans toutes les langues
      for (const decision of decisions) {
        await ctx.runAction(
          api.decisionTranslations.translateDecisionToAllLanguages,
          {
            decisionId: decision._id,
            languages,
          }
        );
      }
    } catch (error) {
      console.error("Error in translateDecisionsScheduled:", error);
    }
  },
});

// Note: Les cron jobs sont maintenant définis dans convex/crons.ts
// Ce fichier contient uniquement les fonctions utilisées par les cron jobs
