import { api } from "../_generated/api";
import { internalAction, action } from "../_generated/server";

/**
 * Action interne pour la détection et génération de décisions
 */
// Helper function pour retry avec backoff exponentiel
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

export const runDecisionDetection = internalAction({
  args: {},
  handler: async (ctx) => {
    const startTime = Date.now();
    console.log(`[${new Date().toISOString()}] Running decision detection...`);

    try {
      // Détecter les nouvelles décisions avec retry
      console.log(`[${new Date().toISOString()}] Starting detectDecisions action...`);
      const detectStartTime = Date.now();
      
      const result = await retryWithBackoff(async () => {
        // @ts-ignore - Type instantiation is excessively deep (known Convex type issue)
        return await ctx.runAction(api.bots.detectDecisions.detectDecisions, {
          limit: 10, // Réduit à 10 pour éviter les timeouts
        });
      }, 2, 2000); // Réduire à 2 retries avec délai initial de 2s

      const detectDuration = Date.now() - detectStartTime;
      console.log(`[${new Date().toISOString()}] Detected ${result.detected} potential events in ${detectDuration}ms`);

      // Cache des décisions créées dans cette batch pour éviter les doublons
      const createdInThisBatch: Array<{ title: string; sourceUrl: string; slug: string }> = [];

      // Limiter le nombre d'événements traités pour éviter les timeouts
      const maxEvents = Math.min(result.events.length, 10); // Traiter max 10 événements par exécution
      console.log(`[${new Date().toISOString()}] Processing ${maxEvents} out of ${result.events.length} events`);

      // Pour chaque événement majeur détecté, générer une Decision Card
      for (let i = 0; i < maxEvents; i++) {
        const detectedEvent = result.events[i];
        const eventStartTime = Date.now();
        console.log(`[${new Date().toISOString()}] Processing event ${i + 1}/${maxEvents}: ${detectedEvent.mainArticle.title.substring(0, 50)}...`);
        
        try {
          const decisionId = await retryWithBackoff(async () => {
            // @ts-ignore - Type instantiation is excessively deep (known Convex type issue)
            return await ctx.runAction(
              api.bots.generateDecision.generateDecision,
              {
                detectedEvent,
                createdInThisBatch, // Passer le cache pour vérification
              }
            );
          }, 2, 2000); // Réduire à 2 retries
          
          const eventDuration = Date.now() - eventStartTime;
          
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
              console.warn(`[${new Date().toISOString()}] Error fetching decision for cache:`, error);
            }
            console.log(`[${new Date().toISOString()}] ✅ Generated decision ${decisionId} in ${eventDuration}ms`);
          } else {
            console.log(`[${new Date().toISOString()}] ⚠️ Decision generation returned null (likely duplicate) in ${eventDuration}ms`);
          }
        } catch (error) {
          const eventDuration = Date.now() - eventStartTime;
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`[${new Date().toISOString()}] ❌ Error generating decision for event (${eventDuration}ms): ${errorMsg}`);
          // Continuer avec les autres événements même en cas d'erreur
        }
      }

      const totalDuration = Date.now() - startTime;
      console.log(`[${new Date().toISOString()}] ✅ Decision detection completed in ${totalDuration}ms`);
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error(`[${new Date().toISOString()}] ❌ Error in runDecisionDetection (${totalDuration}ms): ${errorMsg}`);
      if (errorStack) {
        console.error(`[${new Date().toISOString()}] Stack trace: ${errorStack}`);
      }
      // Ne pas throw pour éviter d'arrêter le cron job - l'erreur sera loggée
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
        limit: 10, // Réduit à 10 pour éviter les timeouts
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
          const decisionId = await retryWithBackoff(async () => {
            // @ts-ignore - Type instantiation is excessively deep (known Convex type issue)
            return await ctx.runAction(
              api.bots.generateDecision.generateDecision,
              {
                detectedEvent,
                createdInThisBatch, // Passer le cache pour vérification
              }
            );
          });
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
          console.error(`❌ Error generating Decision Card (after retries):`, errorMsg);
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
