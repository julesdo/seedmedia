import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================
  // USERS (Better Auth users - un par email)
  // ============================================
  users: defineTable({
    email: v.string(),
    // Niveau et progression
    level: v.number(), // Niveau actuel (défaut 1)
    region: v.optional(v.string()), // Région sélectionnée (ex: "Nouvelle-Aquitaine")
    reachRadius: v.number(), // Rayon d'audience en km (calculé selon niveau)
    // Localisation
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
        city: v.optional(v.string()),
        region: v.optional(v.string()),
        country: v.optional(v.string()),
      })
    ),
    // Profil
    bio: v.optional(v.string()),
    tags: v.array(v.string()), // Sujets suivis
    links: v.array(
      v.object({
        type: v.string(), // "website", "github", "twitter", etc.
        url: v.string(),
      })
    ),
    profileCompletion: v.number(), // 0-100
    // Premium
    premiumTier: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("pro"),
      v.literal("impact")
    ),
    boostCredits: v.number(), // Crédits de boost mensuels
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("email", ["email"])
    .index("level", ["level"])
    .index("region", ["region"]),

  // ============================================
  // USER ACCOUNTS (Multi-comptes par utilisateur)
  // ============================================
  userAccounts: defineTable({
    userId: v.id("users"), // Référence à l'utilisateur Better Auth
    accountEmail: v.string(), // Email du compte (peut être différent de l'email principal)
    name: v.string(), // Nom d'affichage du compte
    type: v.union(
      v.literal("personal"), // Compte personnel
      v.literal("professional"), // Compte professionnel
      v.literal("organization") // Compte organisation
    ),
    // Niveau et progression (spécifique à ce compte)
    level: v.number(),
    region: v.optional(v.string()),
    reachRadius: v.number(),
    // Localisation
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
        city: v.optional(v.string()),
        region: v.optional(v.string()),
        country: v.optional(v.string()),
      })
    ),
    // Profil
    bio: v.optional(v.string()),
    tags: v.array(v.string()),
    links: v.array(
      v.object({
        type: v.string(),
        url: v.string(),
      })
    ),
    profileCompletion: v.number(),
    // Premium
    premiumTier: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("pro"),
      v.literal("impact")
    ),
    boostCredits: v.number(),
    // Avatar/Image (optionnel, peut être différent du compte principal)
    image: v.optional(v.string()),
    // Compte par défaut
    isDefault: v.boolean(),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("accountEmail", ["accountEmail"])
    .index("isDefault", ["isDefault"]),

  // ============================================
  // ARTICLES
  // ============================================
  articles: defineTable({
    title: v.string(),
    slug: v.string(), // Unique
    summary: v.string(),
    content: v.string(), // Markdown
    authorId: v.id("users"),
    tags: v.array(v.string()),
    coverImage: v.optional(v.string()), // URL
    featured: v.boolean(), // En vedette
    publishedAt: v.optional(v.number()), // Timestamp de publication
    // Métriques
    views: v.number(),
    reactions: v.number(),
    comments: v.number(),
    // Système de qualité et vérification
    qualityScore: v.number(), // Score de qualité (0-100), calculé automatiquement
    verifiedClaimsCount: v.number(), // Nombre de claims vérifiés
    totalClaimsCount: v.number(), // Nombre total de claims
    expertReviewCount: v.number(), // Nombre de vérifications par des experts
    communityVerificationScore: v.number(), // Score de vérification communautaire (0-100)
    // Type d'article
    articleType: v.union(
      v.literal("scientific"), // Article scientifique
      v.literal("expert"), // Article d'expert
      v.literal("opinion"), // Article d'opinion
      v.literal("news"), // Actualité
      v.literal("tutorial"), // Tutoriel
      v.literal("other") // Autre
    ),
    // Statut
    status: v.union(
      v.literal("draft"),
      v.literal("pending"),
      v.literal("published"),
      v.literal("rejected")
    ),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("authorId", ["authorId"])
    .index("publishedAt", ["publishedAt"])
    .index("featured", ["featured"])
    .index("status", ["status"])
    .index("slug", ["slug"])
    .index("tags", ["tags"])
    .index("qualityScore", ["qualityScore"])
    .index("articleType", ["articleType"]),

  // ============================================
  // ARTICLE CLAIMS (Affirmations dans les articles)
  // ============================================
  articleClaims: defineTable({
    articleId: v.id("articles"),
    claimText: v.string(), // Le texte de l'affirmation
    position: v.optional(v.number()), // Position dans l'article (pour référence)
    // Vérification
    verificationStatus: v.union(
      v.literal("unverified"), // Non vérifié
      v.literal("verified"), // Vérifié
      v.literal("disputed"), // Contesté
      v.literal("false") // Faux
    ),
    verificationScore: v.number(), // Score de vérification (0-100)
    // Sources
    sourcesCount: v.number(), // Nombre de sources associées
    expertVerificationsCount: v.number(), // Nombre de vérifications par experts
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("articleId", ["articleId"])
    .index("verificationStatus", ["verificationStatus"])
    .index("verificationScore", ["verificationScore"]),

  // ============================================
  // CLAIM SOURCES (Sources pour justifier les claims)
  // ============================================
  claimSources: defineTable({
    claimId: v.id("articleClaims"),
    sourceType: v.union(
      v.literal("scientific_paper"), // Article scientifique
      v.literal("expert_statement"), // Déclaration d'expert
      v.literal("official_data"), // Données officielles
      v.literal("news_article"), // Article de presse
      v.literal("website"), // Site web
      v.literal("other") // Autre
    ),
    title: v.string(), // Titre de la source
    url: v.optional(v.string()), // URL de la source
    author: v.optional(v.string()), // Auteur de la source
    publicationDate: v.optional(v.number()), // Date de publication
    reliabilityScore: v.number(), // Score de fiabilité de la source (0-100)
    addedBy: v.id("users"), // Utilisateur qui a ajouté la source
    // Timestamps
    createdAt: v.number(),
  })
    .index("claimId", ["claimId"])
    .index("sourceType", ["sourceType"])
    .index("reliabilityScore", ["reliabilityScore"]),

  // ============================================
  // CLAIM VERIFICATIONS (Vérifications par la communauté/experts)
  // ============================================
  claimVerifications: defineTable({
    claimId: v.id("articleClaims"),
    verifierId: v.id("users"), // Utilisateur qui vérifie
    isExpert: v.boolean(), // Vérification par un expert
    verificationResult: v.union(
      v.literal("verified"), // Vérifié comme vrai
      v.literal("disputed"), // Contesté
      v.literal("false") // Vérifié comme faux
    ),
    comment: v.optional(v.string()), // Commentaire de vérification
    // Timestamps
    createdAt: v.number(),
  })
    .index("claimId", ["claimId"])
    .index("verifierId", ["verifierId"])
    .index("isExpert", ["isExpert"])
    .index("verificationResult", ["verificationResult"]),

  // ============================================
  // PROJECTS
  // ============================================
  projects: defineTable({
    title: v.string(),
    slug: v.string(), // Unique
    summary: v.string(),
    description: v.string(), // Markdown
    orgId: v.optional(v.id("organizations")),
    authorId: v.id("users"),
    tags: v.array(v.string()),
    // Localisation
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
        city: v.optional(v.string()),
        region: v.optional(v.string()),
        country: v.optional(v.string()),
      })
    ),
    images: v.array(v.string()), // URLs
    links: v.array(
      v.object({
        type: v.string(), // "website", "github", "demo", etc.
        url: v.string(),
      })
    ),
    stage: v.union(
      v.literal("idea"),
      v.literal("prototype"),
      v.literal("beta"),
      v.literal("production")
    ),
    impactMetrics: v.array(
      v.object({
        label: v.string(),
        value: v.string(),
      })
    ),
    featured: v.boolean(),
    openSource: v.boolean(),
    // Métriques
    views: v.number(),
    reactions: v.number(),
    comments: v.number(),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("authorId", ["authorId"])
    .index("orgId", ["orgId"])
    .index("featured", ["featured"])
    .index("slug", ["slug"])
    .index("tags", ["tags"])
    .index("stage", ["stage"])
    .index("openSource", ["openSource"]),

  // ============================================
  // ORGANIZATIONS
  // ============================================
  organizations: defineTable({
    name: v.string(),
    slug: v.string(), // Unique
    description: v.string(),
    logo: v.optional(v.string()), // URL
    coverImage: v.optional(v.string()), // URL - Image de couverture
    ownerId: v.id("users"), // Créateur/propriétaire
    // Localisation Seed (hyper important pour Seed)
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
        address: v.optional(v.string()), // Adresse complète
        city: v.optional(v.string()),
        region: v.optional(v.string()), // Région Seed (ex: "Île-de-France", "Auvergne-Rhône-Alpes")
        country: v.optional(v.string()),
        postalCode: v.optional(v.string()),
      })
    ),
    seedRegion: v.optional(v.string()), // Région Seed sélectionnée (ex: "IDF", "ARA", "Occitanie")
    // Type et statut
    organizationType: v.optional(
      v.union(
        v.literal("association"),
        v.literal("entreprise"),
        v.literal("collectif"),
        v.literal("institution"),
        v.literal("autre")
      )
    ),
    legalStatus: v.optional(v.string()), // Statut légal (ex: "Association loi 1901", "SARL", "SCIC")
    foundedAt: v.optional(v.number()), // Date de fondation (timestamp, différent de createdAt)
    // Secteur d'activité
    sector: v.optional(
      v.union(
        v.literal("tech"),
        v.literal("environnement"),
        v.literal("social"),
        v.literal("education"),
        v.literal("culture"),
        v.literal("sante"),
        v.literal("autre")
      )
    ),
    tags: v.array(v.string()),
    // Contact
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    website: v.optional(v.string()), // Site web principal
    links: v.array(
      v.object({
        type: v.string(),
        url: v.string(),
      })
    ),
    // Langues
    languages: v.optional(v.array(v.string())), // Langues parlées (ex: ["fr", "en"])
    // Rayon d'audience Seed
    reachRadius: v.optional(v.number()), // Rayon en km (0 = local, null = global)
    // Métriques d'impact (optionnel)
    impactMetrics: v.optional(
      v.array(
        v.object({
          label: v.string(),
          value: v.string(),
        })
      )
    ),
    // Horaires et réunions (optionnel)
    schedule: v.optional(
      v.object({
        meetings: v.optional(v.string()), // Fréquence des réunions (ex: "Tous les mercredis à 19h")
        hours: v.optional(v.string()), // Horaires d'ouverture
        timezone: v.optional(v.string()), // Fuseau horaire
      })
    ),
    verified: v.boolean(),
    premiumTier: v.union(
      v.literal("free"),
      v.literal("starter"),
      v.literal("pro"),
      v.literal("impact")
    ),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("slug", ["slug"])
    .index("ownerId", ["ownerId"])
    .index("verified", ["verified"])
    .index("premiumTier", ["premiumTier"])
    .index("seedRegion", ["seedRegion"])
    .index("organizationType", ["organizationType"])
    .index("sector", ["sector"]),

  // ============================================
  // ORGANIZATION MEMBERS (liaison users <-> organizations)
  // ============================================
  organizationMembers: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: v.union(
      v.literal("owner"), // Propriétaire
      v.literal("admin"), // Administrateur
      v.literal("member") // Membre
    ),
    // Permissions spécifiques
    canInvite: v.boolean(), // Peut inviter des membres
    canEdit: v.boolean(), // Peut modifier l'organisation
    canDelete: v.boolean(), // Peut supprimer l'organisation
    // Statut
    status: v.union(
      v.literal("active"), // Membre actif
      v.literal("pending"), // Invitation en attente
      v.literal("suspended") // Suspendu
    ),
    // Timestamps
    joinedAt: v.number(),
    updatedAt: v.number(),
  })
    .index("organizationId", ["organizationId"])
    .index("userId", ["userId"])
    .index("status", ["status"])
    .index("role", ["role"]),

  // ============================================
  // INVITATIONS (invitations à rejoindre des organizations)
  // ============================================
  invitations: defineTable({
    organizationId: v.id("organizations"),
    email: v.string(), // Email de la personne invitée
    invitedBy: v.id("users"), // Utilisateur qui a envoyé l'invitation
    role: v.union(
      v.literal("admin"),
      v.literal("member")
    ),
    token: v.string(), // Token unique pour l'invitation
    // Statut
    status: v.union(
      v.literal("pending"), // En attente
      v.literal("accepted"), // Acceptée
      v.literal("rejected"), // Refusée
      v.literal("expired") // Expirée
    ),
    // Expiration (7 jours par défaut)
    expiresAt: v.number(),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("organizationId", ["organizationId"])
    .index("email", ["email"])
    .index("token", ["token"])
    .index("status", ["status"])
    .index("expiresAt", ["expiresAt"]),

  // ============================================
  // ACTIONS
  // ============================================
  actions: defineTable({
    title: v.string(),
    slug: v.string(), // Unique
    summary: v.string(),
    description: v.string(), // Markdown
    type: v.union(
      v.literal("petition"),
      v.literal("contribution"),
      v.literal("event")
    ),
    authorId: v.id("users"),
    orgId: v.optional(v.id("organizations")),
    tags: v.array(v.string()),
    target: v.string(), // Cible de l'action
    link: v.optional(v.string()), // URL externe
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    deadline: v.optional(v.number()), // Timestamp
    // Localisation (optionnel pour événements)
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
        city: v.optional(v.string()),
        region: v.optional(v.string()),
      })
    ),
    featured: v.boolean(),
    participants: v.number(),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("authorId", ["authorId"])
    .index("orgId", ["orgId"])
    .index("status", ["status"])
    .index("deadline", ["deadline"])
    .index("featured", ["featured"])
    .index("slug", ["slug"])
    .index("type", ["type"]),

  // ============================================
  // MISSIONS
  // ============================================
  missions: defineTable({
    userId: v.id("users"),
    type: v.string(), // ex: "login_3_days", "view_10_projects", etc.
    category: v.union(
      v.literal("discovery"),
      v.literal("habit"),
      v.literal("contribution"),
      v.literal("engagement")
    ),
    title: v.string(),
    description: v.string(),
    target: v.number(), // Objectif à atteindre
    progress: v.number(), // Progression actuelle
    completed: v.boolean(),
    completedAt: v.optional(v.number()), // Timestamp
    expiresAt: v.optional(v.number()), // Timestamp
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("completed", ["completed"])
    .index("category", ["category"])
    .index("type", ["type"]),

  // ============================================
  // REACTIONS
  // ============================================
  reactions: defineTable({
    userId: v.id("users"),
    targetType: v.union(
      v.literal("article"),
      v.literal("project"),
      v.literal("action")
    ),
    targetId: v.union(
      v.id("articles"),
      v.id("projects"),
      v.id("actions")
    ),
    type: v.union(v.literal("like"), v.literal("love"), v.literal("useful")),
    // Timestamps
    createdAt: v.number(),
  })
    .index("targetType_targetId", ["targetType", "targetId"])
    .index("userId", ["userId"]),

  // ============================================
  // COMMENTS
  // ============================================
  comments: defineTable({
    userId: v.id("users"),
    targetType: v.union(
      v.literal("article"),
      v.literal("project"),
      v.literal("action")
    ),
    targetId: v.union(
      v.id("articles"),
      v.id("projects"),
      v.id("actions")
    ),
    content: v.string(),
    parentId: v.optional(v.id("comments")), // Pour les réponses
    usefulCount: v.number(),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("targetType_targetId", ["targetType", "targetId"])
    .index("userId", ["userId"])
    .index("parentId", ["parentId"]),

  // ============================================
  // VIEWS
  // ============================================
  views: defineTable({
    userId: v.optional(v.id("users")), // Optionnel pour vues anonymes
    targetType: v.union(
      v.literal("article"),
      v.literal("project"),
      v.literal("action"),
      v.literal("profile")
    ),
    targetId: v.string(), // Id ou userId pour profil
    viewerLocation: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
        region: v.optional(v.string()),
      })
    ),
    // Timestamps
    createdAt: v.number(),
  })
    .index("targetType_targetId", ["targetType", "targetId"])
    .index("userId", ["userId"])
    .index("createdAt", ["createdAt"]),

  // ============================================
  // FAVORITES
  // ============================================
  favorites: defineTable({
    userId: v.id("users"),
    targetType: v.union(
      v.literal("article"),
      v.literal("project"),
      v.literal("action")
    ),
    targetId: v.union(
      v.id("articles"),
      v.id("projects"),
      v.id("actions")
    ),
    // Timestamps
    createdAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("targetType_targetId", ["targetType", "targetId"]),

  // ============================================
  // FOLLOWS
  // ============================================
  follows: defineTable({
    userId: v.id("users"),
    targetType: v.union(
      v.literal("user"),
      v.literal("organization"),
      v.literal("tag")
    ),
    targetId: v.string(), // Id ou tag name
    // Timestamps
    createdAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("targetType_targetId", ["targetType", "targetId"]),
});
