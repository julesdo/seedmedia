/**
 * Script pour ajouter un super admin
 * 
 * Pour ajouter un super admin, utilisez la Console Convex Dashboard :
 * - Allez sur https://dashboard.convex.dev
 * - Sélectionnez votre projet
 * - Allez dans "Functions"
 * - Exécutez scripts/addSuperAdmin:addSuperAdmin (mutation interne) avec les arguments JSON
 * 
 * OU via l'API interne (depuis une autre fonction Convex):
 * import { internal } from "./_generated/api";
 * await ctx.runMutation(internal.scripts.addSuperAdmin.addSuperAdmin, { email: "...", addedBy: "..." });
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const addSuperAdmin = internalMutation({
  args: {
    email: v.string(),
    addedBy: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Normaliser l'email (lowercase, trim) pour éviter les problèmes de casse
    const normalizedEmail = args.email.toLowerCase().trim();

    // Vérifier si l'email existe déjà
    const existing = await ctx.db
      .query("superAdmins")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (existing) {
      throw new Error(`Super admin with email ${normalizedEmail} already exists`);
    }

    const adminId = await ctx.db.insert("superAdmins", {
      email: normalizedEmail,
      addedBy: args.addedBy,
      addedAt: Date.now(),
      notes: args.notes,
    });

    console.log(`✅ Super admin ajouté avec succès: ${normalizedEmail}`);
    console.log(`   ID: ${adminId}`);
    console.log(`   Ajouté par: ${args.addedBy}`);

    return { success: true, adminId };
  },
});

