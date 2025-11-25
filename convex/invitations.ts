import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

/**
 * Génère un token unique pour une invitation
 */
function generateInvitationToken(): string {
  // Utiliser Date.now() + random pour générer un token unique
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
}

/**
 * Récupère toutes les invitations de l'utilisateur connecté (tous statuts)
 */
export const getUserInvitations = query({
  args: {},
  handler: async (ctx) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      return [];
    }

    // Récupérer toutes les invitations pour cet email (tous statuts)
    const allInvitations = await ctx.db
      .query("invitations")
      .filter((q) => q.eq(q.field("email"), betterAuthUser.email))
      .collect();

    // Vérifier les expirations et enrichir avec les infos de l'organisation
    const now = Date.now();
    const enriched = await Promise.all(
      allInvitations.map(async (inv) => {
        // Vérifier si l'invitation est expirée (seulement si status est pending)
        const isExpired = inv.status === "pending" && inv.expiresAt < now;
        
        // Récupérer l'organisation
        const organization = await ctx.db.get(inv.organizationId);
        
        return {
          ...inv,
          status: isExpired ? ("expired" as const) : inv.status,
          organization: organization
            ? {
                _id: organization._id,
                name: organization.name,
                logo: organization.logo,
                description: organization.description,
              }
            : null,
        };
      })
    );

    // Trier par date de création (plus récentes en premier)
    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Récupère les invitations d'une organization
 */
export const getOrganizationInvitations = query({
  args: { organizationId: v.id("organizations") },
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

    // Vérifier les permissions
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("organizationId", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("userId"), appUser._id))
      .first();

    if (!membership || !membership.canInvite) {
      return [];
    }

    // Récupérer les invitations
    const invitations = await ctx.db
      .query("invitations")
      .withIndex("organizationId", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    // Vérifier les expirations (sans modifier, juste pour l'affichage)
    const now = Date.now();
    const validInvitations = invitations.map((inv) => {
      // Si l'invitation est expirée et toujours en pending, on la marque comme expirée dans le retour
      // (la mutation expireInvitations peut être appelée séparément pour mettre à jour la DB)
      if (inv.expiresAt < now && inv.status === "pending") {
        return { ...inv, status: "expired" as const };
      }
      return inv;
    });

    return validInvitations;
  },
});

/**
 * Invite un utilisateur à rejoindre une organization
 */
export const inviteUser = mutation({
  args: {
    organizationId: v.id("organizations"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
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

    // Vérifier les permissions
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("organizationId", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("userId"), appUser._id))
      .first();

    if (!membership || !membership.canInvite) {
      throw new Error("Unauthorized");
    }

    // Vérifier que l'utilisateur n'est pas déjà membre
    const existingUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      const existingMember = await ctx.db
        .query("organizationMembers")
        .withIndex("organizationId", (q) => q.eq("organizationId", args.organizationId))
        .filter((q) => q.eq(q.field("userId"), existingUser._id))
        .first();

      if (existingMember && existingMember.status === "active") {
        throw new Error("User is already a member");
      }
    }

    // Vérifier qu'il n'y a pas déjà une invitation en attente
    const existingInvitation = await ctx.db
      .query("invitations")
      .withIndex("organizationId", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("email"), args.email))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existingInvitation) {
      throw new Error("Invitation already sent");
    }

    const now = Date.now();
    const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 jours

    const invitationId = await ctx.db.insert("invitations", {
      organizationId: args.organizationId,
      email: args.email,
      invitedBy: appUser._id,
      role: args.role,
      token: generateInvitationToken(),
      status: "pending",
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    // Récupérer l'organisation pour la notification
    const organization = await ctx.db.get(args.organizationId);
    
    // Si l'utilisateur invité existe déjà, lui envoyer une notification
    if (existingUser) {
      await ctx.runMutation(internal.notifications.createNotificationInternal, {
        userId: existingUser._id,
        type: "invitation_received",
        title: "Nouvelle invitation",
        message: `${appUser.email?.split("@")[0] || "Un utilisateur"} vous a invité à rejoindre "${organization?.name || "une organisation"}" en tant que ${args.role === "admin" ? "administrateur" : "membre"}`,
        link: "/studio/invitations",
        metadata: {
          invitationId,
          organizationId: args.organizationId,
        },
      });
    }

    // TODO: Envoyer un email d'invitation
    // await sendInvitationEmail(args.email, invitationId, token);

    return invitationId;
  },
});

/**
 * Accepte une invitation
 */
export const acceptInvitation = mutation({
  args: {
    token: v.string(),
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

    // Trouver l'invitation
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("token", (q) => q.eq("token", args.token))
      .first();

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    // Vérifier que l'email correspond
    if (invitation.email !== betterAuthUser.email) {
      throw new Error("Invitation email mismatch");
    }

    // Vérifier le statut
    if (invitation.status !== "pending") {
      throw new Error("Invitation already processed");
    }

    // Vérifier l'expiration
    if (invitation.expiresAt < Date.now()) {
      await ctx.db.patch(invitation._id, { status: "expired", updatedAt: Date.now() });
      throw new Error("Invitation expired");
    }

    // Vérifier qu'il n'est pas déjà membre
    const existingMember = await ctx.db
      .query("organizationMembers")
      .withIndex("organizationId", (q) => q.eq("organizationId", invitation.organizationId))
      .filter((q) => q.eq(q.field("userId"), appUser._id))
      .first();

    if (existingMember && existingMember.status === "active") {
      throw new Error("Already a member");
    }

    const now = Date.now();

    // Créer ou mettre à jour le membership
    if (existingMember) {
      await ctx.db.patch(existingMember._id, {
        role: invitation.role,
        status: "active",
        canInvite: invitation.role === "admin",
        canEdit: invitation.role === "admin",
        canDelete: false,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("organizationMembers", {
        organizationId: invitation.organizationId,
        userId: appUser._id,
        role: invitation.role,
        canInvite: invitation.role === "admin",
        canEdit: invitation.role === "admin",
        canDelete: false,
        status: "active",
        joinedAt: now,
        updatedAt: now,
      });
    }

    // Marquer l'invitation comme acceptée
    await ctx.db.patch(invitation._id, {
      status: "accepted",
      updatedAt: now,
    });

    // Récupérer l'organisation et l'utilisateur qui a invité
    const organization = await ctx.db.get(invitation.organizationId);
    const inviter = await ctx.db.get(invitation.invitedBy);

    // Notifier celui qui a envoyé l'invitation
    if (inviter && inviter._id !== appUser._id) {
      await ctx.runMutation(internal.notifications.createNotificationInternal, {
        userId: inviter._id,
        type: "invitation_accepted",
        title: "Invitation acceptée",
        message: `${appUser.email?.split("@")[0] || "Un utilisateur"} a accepté votre invitation à rejoindre "${organization?.name || "l'organisation"}"`,
        link: `/discover/organizations/${invitation.organizationId}`,
        metadata: {
          invitationId: invitation._id,
          organizationId: invitation.organizationId,
          acceptedBy: appUser._id,
        },
      });
    }

    return { success: true };
  },
});

/**
 * Refuse une invitation
 */
export const rejectInvitation = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const betterAuthUser = await betterAuthComponent.safeGetAuthUser(ctx as any);
    if (!betterAuthUser) {
      throw new Error("Not authenticated");
    }

    const invitation = await ctx.db
      .query("invitations")
      .withIndex("token", (q) => q.eq("token", args.token))
      .first();

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.email !== betterAuthUser.email) {
      throw new Error("Unauthorized");
    }

    const now = Date.now();
    
    await ctx.db.patch(invitation._id, {
      status: "rejected",
      updatedAt: now,
    });

    // Récupérer l'organisation et l'utilisateur qui a invité
    const organization = await ctx.db.get(invitation.organizationId);
    const inviter = await ctx.db.get(invitation.invitedBy);
    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))
      .first();

    // Notifier celui qui a envoyé l'invitation
    if (inviter && appUser && inviter._id !== appUser._id) {
      await ctx.runMutation(internal.notifications.createNotificationInternal, {
        userId: inviter._id,
        type: "invitation_rejected",
        title: "Invitation refusée",
        message: `${appUser.email?.split("@")[0] || "Un utilisateur"} a refusé votre invitation à rejoindre "${organization?.name || "l'organisation"}"`,
        link: `/discover/organizations/${invitation.organizationId}`,
        metadata: {
          invitationId: invitation._id,
          organizationId: invitation.organizationId,
          rejectedBy: appUser._id,
        },
      });
    }

    return { success: true };
  },
});

/**
 * Expire les invitations périmées (à appeler périodiquement)
 */
export const expireInvitations = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Récupérer toutes les invitations en pending
    const pendingInvitations = await ctx.db
      .query("invitations")
      .withIndex("status", (q) => q.eq("status", "pending"))
      .collect();

    // Marquer comme expirées celles qui sont périmées
    for (const inv of pendingInvitations) {
      if (inv.expiresAt < now) {
        await ctx.db.patch(inv._id, {
          status: "expired",
          updatedAt: now,
        });
      }
    }

    return { success: true };
  },
});

/**
 * Supprime une invitation
 */
export const deleteInvitation = mutation({
  args: {
    invitationId: v.id("invitations"),
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

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    // Vérifier les permissions
    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("organizationId", (q) => q.eq("organizationId", invitation.organizationId))
      .filter((q) => q.eq(q.field("userId"), appUser._id))
      .first();

    if (!membership || !membership.canInvite) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.invitationId);

    return { success: true };
  },
});

