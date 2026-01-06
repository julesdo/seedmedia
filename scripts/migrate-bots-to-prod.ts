/**
 * Script de migration pour initialiser les bots en production
 * 
 * Usage:
 * 1. Se connecter à Convex Dashboard
 * 2. Aller dans Functions
 * 3. Exécuter: api.bots.initializeDefaultBots
 * 
 * OU via CLI:
 * npx convex run bots:initializeDefaultBots
 */

import { api } from "../convex/_generated/api";

/**
 * Cette fonction est déjà disponible dans convex/bots.ts
 * Il suffit de l'appeler une fois en production via:
 * 
 * Option 1: Via le Dashboard Convex
 * - Aller dans Functions > bots:initializeDefaultBots
 * - Cliquer sur "Run"
 * 
 * Option 2: Via CLI
 * npx convex run bots:initializeDefaultBots
 * 
 * Option 3: Via code (dans une action/mutation admin)
 * await ctx.runMutation(api.bots.initializeDefaultBots, {});
 */

export const migrateBotsToProduction = async () => {
  console.log("Pour initialiser les bots en production:");
  console.log("1. Via Dashboard: Functions > bots:initializeDefaultBots > Run");
  console.log("2. Via CLI: npx convex run bots:initializeDefaultBots");
  console.log("3. Cette fonction crée les 5 bots par défaut s'ils n'existent pas déjà");
};

