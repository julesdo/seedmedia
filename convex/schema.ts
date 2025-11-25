import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================
  // USERS (Better Auth users - un par email)
  // ============================================
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()), // Nom d'affichage (synchronisé avec Better Auth)
    image: v.optional(v.string()), // URL de l'image de profil (synchronisé avec Better Auth)
    // Niveau et progression
    level: v.number(), // Niveau actuel (défaut 1)
    region: v.optional(v.string()), // Région sélectionnée (ex: "Nouvelle-Aquitaine") - Affichage uniquement
    reachRadius: v.number(), // Rayon d'audience en km (calculé selon niveau) - ⚠️ Affichage uniquement, NE PAS utiliser pour filtrer
    // Localisation
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
        city: v.optional(v.string()),
        region: v.optional(v.string()),
        country: v.optional(v.string()),
      })
    ), // ⚠️ Affichage uniquement, NE PAS utiliser pour filtrer les contenus
    // Profil
    bio: v.optional(v.string()),
    username: v.optional(v.string()), // Nom d'utilisateur unique (ex: @johndoe)
    coverImage: v.optional(v.string()), // URL de l'image de couverture
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
    // Système de crédibilité Seed (réputation)
    credibilityScore: v.number(), // Score de crédibilité (0-100), calculé automatiquement
    role: v.union(
      v.literal("explorateur"), // Peut commenter, voter, proposer sources
      v.literal("contributeur"), // Peut écrire articles, voter gouvernance
      v.literal("editeur") // Peut valider articles, vote pondéré x4
    ),
    expertiseDomains: v.array(v.string()), // Domaines d'expertise (validés)
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("email", ["email"])
    .index("level", ["level"])
    .index("region", ["region"])
    .index("credibilityScore", ["credibilityScore"])
    .index("role", ["role"]),

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
    reachRadius: v.number(), // ⚠️ Affichage uniquement, NE PAS utiliser pour filtrer
    // Localisation - ⚠️ Affichage uniquement, NE PAS utiliser pour filtrer
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
    summary: v.string(), // Résumé court (TL;DR)
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
    // Structure obligatoire selon NEW_SEED.md (optionnels pour permettre brouillons incomplets et articles existants)
    // Validation sera faite à la publication : min 2 sources, min 1 contre-argument, these et conclusion requis
    these: v.optional(v.string()), // Thèse / problème (obligatoire pour publication)
    counterArguments: v.optional(v.array(v.string())), // Contre-arguments (min 1 obligatoire pour publication)
    conclusion: v.optional(v.string()), // Conclusion orientée solutions (obligatoire pour publication)
    sourcesCount: v.optional(v.number()), // Nombre de sources (min 2 obligatoire pour publication, défaut 0)
    dossierId: v.optional(v.id("dossiers")), // Dossier thématique associé
    debatId: v.optional(v.id("debates")), // Débat associé
    categoryIds: v.optional(v.array(v.id("categories"))), // Catégories associées (gérées par gouvernance)
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
    .index("articleType", ["articleType"])
    .index("dossierId", ["dossierId"])
    .index("debatId", ["debatId"])
    .index("categoryIds", ["categoryIds"]),

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
    categoryIds: v.optional(v.array(v.id("categories"))), // Catégories associées (gérées par gouvernance)
    // Localisation - ⚠️ Affichage uniquement, NE PAS utiliser pour filtrer
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
    .index("openSource", ["openSource"])
    .index("categoryIds", ["categoryIds"]),

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
    // Localisation Seed - ⚠️ Affichage uniquement, NE PAS utiliser pour filtrer les contenus
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
    categoryIds: v.optional(v.array(v.id("categories"))), // Catégories associées (gérées par gouvernance)
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
    .index("categoryIds", ["categoryIds"]),

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
    categoryIds: v.optional(v.array(v.id("categories"))), // Catégories associées (gérées par gouvernance)
    type: v.union(
      v.literal("petition"),
      v.literal("contribution"),
      v.literal("event")
    ),
    authorId: v.id("users"),
    orgId: v.optional(v.id("organizations")),
    tags: v.array(v.string()),
    target: v.optional(v.string()), // Cible de l'action (pour pétitions)
    link: v.optional(v.string()), // URL externe
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    deadline: v.optional(v.number()), // Timestamp
    // Localisation (optionnel pour événements) - ⚠️ Affichage uniquement, NE PAS utiliser pour filtrer
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
  // ACTION PARTICIPANTS (Participants aux actions)
  // ============================================
  actionParticipants: defineTable({
    actionId: v.id("actions"),
    userId: v.id("users"),
    // Timestamps
    createdAt: v.number(),
  })
    .index("actionId", ["actionId"])
    .index("userId", ["userId"])
    .index("actionId_userId", ["actionId", "userId"]), // Unique par action+user

  // ============================================
  // SUPER ADMINS (Équipe Seed Tech - Accès via email uniquement)
  // ============================================
  superAdmins: defineTable({
    email: v.string(), // Email unique pour accès super admin
    addedBy: v.string(), // Email de celui qui a ajouté
    addedAt: v.number(), // Timestamp
    notes: v.optional(v.string()), // Notes optionnelles
  })
    .index("email", ["email"]), // Index unique sur email

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

  // Templates de missions (gérés par les admins)
  // Ces templates sont utilisés pour créer les missions pour chaque nouvel utilisateur
  missionTemplates: defineTable({
    type: v.string(), // Identifiant unique de la mission (ex: "login_3_days", "view_10_projects")
    category: v.union(
      v.literal("discovery"),
      v.literal("habit"),
      v.literal("contribution"),
      v.literal("engagement")
    ),
    title: v.string(),
    description: v.string(),
    target: v.number(), // Objectif à atteindre
    active: v.boolean(), // Si false, la mission ne sera pas créée pour les nouveaux utilisateurs
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("type", ["type"])
    .index("active", ["active"]),

  // ============================================
  // REACTIONS
  // ============================================
  reactions: defineTable({
    userId: v.id("users"),
    targetType: v.union(
      v.literal("article"),
      v.literal("project"),
      v.literal("action"),
      v.literal("comment")
    ),
    targetId: v.union(
      v.id("articles"),
      v.id("projects"),
      v.id("actions"),
      v.id("comments")
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
      v.literal("action"),
      v.literal("proposal")
    ),
    targetId: v.union(
      v.id("articles"),
      v.id("projects"),
      v.id("actions"),
      v.id("governanceProposals")
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
    viewerIp: v.optional(v.string()), // Adresse IP du visiteur (pour éviter les doublons)
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
    .index("targetType_targetId_userId", ["targetType", "targetId", "userId"])
    .index("targetType_targetId_viewerIp", ["targetType", "targetId", "viewerIp"])
    .index("viewerIp", ["viewerIp"])
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

  // ============================================
  // ARTICLE VOTES (Votes spécifiques sur articles)
  // ============================================
  articleVotes: defineTable({
    articleId: v.id("articles"),
    userId: v.id("users"),
    voteType: v.union(
      v.literal("solide"), // Article solide
      v.literal("a_revoir"), // À revoir
      v.literal("biaise"), // Biaisé
      v.literal("non_etaye") // Non étayé
    ),
    comment: v.optional(v.string()), // Commentaire optionnel
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("articleId", ["articleId"])
    .index("userId", ["userId"])
    .index("voteType", ["voteType"])
    .index("articleId_userId", ["articleId", "userId"]), // Unique par article+user

  // ============================================
  // ARTICLE CORRECTIONS (Propositions de correction)
  // ============================================
  articleCorrections: defineTable({
    articleId: v.id("articles"),
    proposerId: v.id("users"), // Utilisateur qui propose la correction
    correctionType: v.union(
      v.literal("source"), // Proposition de source
      v.literal("contre_argument"), // Ajout contre-argument
      v.literal("fact_check"), // Correction factuelle
      v.literal("other") // Autre
    ),
    title: v.string(), // Titre de la correction
    description: v.string(), // Description détaillée
    content: v.optional(v.string()), // Contenu de la correction (markdown)
    status: v.union(
      v.literal("pending"), // En attente
      v.literal("approved"), // Approuvée
      v.literal("rejected") // Rejetée
    ),
    reviewedBy: v.optional(v.id("users")), // Expert/éditeur qui a revu
    reviewedAt: v.optional(v.number()),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("articleId", ["articleId"])
    .index("proposerId", ["proposerId"])
    .index("status", ["status"])
    .index("correctionType", ["correctionType"]),

  // ============================================
  // DEBATES (Débats structurés)
  // ============================================
  debates: defineTable({
    question: v.string(), // Question centrale du débat
    slug: v.string(), // Unique
    description: v.optional(v.string()), // Description du débat
    articleId: v.optional(v.id("articles")), // Article associé (optionnel)
    categoryIds: v.optional(v.array(v.id("categories"))), // Catégories associées (gérées par gouvernance)
    // Métriques
    argumentsForCount: v.number(), // Nombre d'arguments POUR
    argumentsAgainstCount: v.number(), // Nombre d'arguments CONTRE
    polarizationScore: v.number(), // Score de polarisation (0-100)
    // Synthèse
    synthesis: v.optional(v.string()), // Synthèse automatique ou éditoriale (markdown)
    synthesisType: v.union(
      v.literal("automatic"), // Synthèse automatique
      v.literal("editorial") // Synthèse éditoriale
    ),
    synthesizedBy: v.optional(v.id("users")), // Qui a fait la synthèse (si éditoriale)
    // Statut
    status: v.union(
      v.literal("open"), // Débat ouvert
      v.literal("closed"), // Débat fermé
      v.literal("archived") // Débat archivé
    ),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    closedAt: v.optional(v.number()),
  })
    .index("slug", ["slug"])
    .index("status", ["status"])
    .index("polarizationScore", ["polarizationScore"])
    .index("articleId", ["articleId"])
    .index("categoryIds", ["categoryIds"]),

  // ============================================
  // DEBAT ARGUMENTS (Arguments POUR/CONTRE dans un débat)
  // ============================================
  debatArguments: defineTable({
    debatId: v.id("debates"),
    authorId: v.id("users"),
    position: v.union(
      v.literal("for"), // Argument POUR
      v.literal("against") // Argument CONTRE
    ),
    title: v.string(), // Titre de l'argument
    content: v.string(), // Contenu de l'argument (markdown)
    sources: v.array(v.string()), // URLs ou références de sources
    // Métriques
    upvotes: v.number(), // Votes positifs
    downvotes: v.number(), // Votes négatifs
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("debatId", ["debatId"])
    .index("authorId", ["authorId"])
    .index("position", ["position"])
    .index("debatId_position", ["debatId", "position"]),

  // ============================================
  // DOSSIERS (Dossiers thématiques)
  // ============================================
  dossiers: defineTable({
    title: v.string(),
    slug: v.string(), // Unique
    description: v.string(),
    coverImage: v.optional(v.string()), // URL
    tags: v.array(v.string()),
    categoryIds: v.optional(v.array(v.id("categories"))), // Catégories associées (gérées par gouvernance)
    // Métriques
    articlesCount: v.number(), // Nombre d'articles dans le dossier
    featured: v.boolean(), // Dossier en vedette
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("slug", ["slug"])
    .index("featured", ["featured"])
    .index("tags", ["tags"])
    .index("categoryIds", ["categoryIds"]),

  // ============================================
  // GOVERNANCE PROPOSALS (Propositions de gouvernance)
  // ============================================
  governanceProposals: defineTable({
    title: v.string(),
    slug: v.string(), // Unique
    description: v.string(), // Description de la proposition (markdown)
    proposerId: v.id("users"), // Utilisateur qui propose
    proposalType: v.union(
      v.literal("editorial_rules"), // Règles éditoriales
      v.literal("product_evolution"), // Évolution du produit
      v.literal("ethical_charter"), // Charte éthique
      v.literal("category_addition"), // Ajout de catégories
      v.literal("expert_nomination"), // Process de nomination des experts
      v.literal("other") // Autre
    ),
    // Votes
    votesFor: v.number(), // Votes POUR
    votesAgainst: v.number(), // Votes CONTRE
    votesAbstain: v.number(), // Votes abstention
    totalVotes: v.number(), // Total des votes
    // Statut
    status: v.union(
      v.literal("draft"), // Brouillon
      v.literal("open"), // Vote ouvert
      v.literal("closed"), // Vote fermé
      v.literal("approved"), // Approuvée
      v.literal("rejected") // Rejetée
    ),
    // Détails du vote
    voteStartAt: v.optional(v.number()), // Début du vote
    voteEndAt: v.optional(v.number()), // Fin du vote
    quorumRequired: v.number(), // Quorum requis (nombre de votes)
    majorityRequired: v.number(), // Majorité requise (%, ex: 50 pour 50%)
    // Résultat
    result: v.optional(
      v.union(
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("quorum_not_met")
      )
    ),
    // Données d'action (spécifiques au type de proposition)
    actionData: v.optional(
      v.object({
        // Pour editorial_rules
        ruleKey: v.optional(v.string()), // Clé de la règle à modifier
        ruleValue: v.optional(v.any()), // Nouvelle valeur de la règle
        // Pour category_addition
        categoryId: v.optional(v.id("categories")), // ID de la catégorie à activer
        actionType: v.optional(v.string()), // "activate_default" ou "create_new"
        name: v.optional(v.string()), // Nom de la catégorie
        slug: v.optional(v.string()), // Slug de la catégorie
        description: v.optional(v.string()), // Description de la catégorie
        icon: v.optional(v.string()), // Icône de la catégorie
        color: v.optional(v.string()), // Couleur de la catégorie
        appliesTo: v.optional(v.array(v.string())), // Types de contenu concernés
        categorySlug: v.optional(v.string()), // Slug pour activer une catégorie par défaut
        // Pour expert_nomination
        userId: v.optional(v.id("users")), // ID de l'utilisateur à nommer expert
        expertiseDomain: v.optional(v.string()), // Domaine d'expertise
        // Pour product_evolution
        settingKey: v.optional(v.string()), // Clé du paramètre produit
        settingValue: v.optional(v.any()), // Nouvelle valeur
        // Pour ethical_charter
        charterSection: v.optional(v.string()), // Section de la charte
        charterContent: v.optional(v.string()), // Nouveau contenu
        // Pour other (données personnalisées)
        customData: v.optional(v.any()),
      })
    ),
    // Indique si l'action a été exécutée
    actionExecuted: v.boolean(),
    actionExecutedAt: v.optional(v.number()),
    actionExecutedBy: v.optional(v.id("users")),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("slug", ["slug"])
    .index("status", ["status"])
    .index("proposalType", ["proposalType"])
    .index("proposerId", ["proposerId"])
    .index("voteEndAt", ["voteEndAt"]),

  // ============================================
  // GOVERNANCE VOTES (Votes sur propositions de gouvernance)
  // ============================================
  governanceVotes: defineTable({
    proposalId: v.id("governanceProposals"),
    userId: v.id("users"),
    vote: v.union(
      v.literal("for"), // POUR
      v.literal("against"), // CONTRE
      v.literal("abstain") // Abstention
    ),
    weight: v.number(), // Poids du vote (1 pour contributeur, 4 pour éditeur/expert)
    comment: v.optional(v.string()), // Commentaire optionnel
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  }) 
    .index("proposalId", ["proposalId"])
    .index("userId", ["userId"])
    .index("proposalId_userId", ["proposalId", "userId"]), // Unique par proposition+user

  // ============================================
  // NOTIFICATIONS (Système de notifications)
  // ============================================
  notifications: defineTable({
    userId: v.id("users"), // Utilisateur destinataire
    type: v.union(
      v.literal("article_pending"), // Nouvel article en attente de validation
      v.literal("article_approved"), // Article approuvé
      v.literal("article_rejected"), // Article rejeté
      v.literal("correction_proposed"), // Nouvelle correction proposée sur un article
      v.literal("correction_approved"), // Correction approuvée
      v.literal("correction_rejected"), // Correction rejetée
      v.literal("proposal_vote"), // Vote sur proposition
      v.literal("proposal_closed"), // Proposition fermée
      v.literal("debat_argument"), // Nouvel argument dans débat (déprécié, utiliser debate_new_argument)
      v.literal("debate_new_argument"), // Nouvel argument ajouté à un débat
      v.literal("debate_argument_voted"), // Vote sur un argument de débat
      v.literal("debate_closed"), // Débat fermé
      v.literal("article_comment"), // Commentaire sur article (déprécié, utiliser comment)
      v.literal("comment"), // Commentaire sur un contenu
      v.literal("comment_reply"), // Réponse à un commentaire
      v.literal("comment_reaction"), // Réaction sur un commentaire
      v.literal("invitation_received"), // Invitation reçue
      v.literal("invitation_accepted"), // Invitation acceptée
      v.literal("invitation_rejected"), // Invitation refusée
      v.literal("member_joined"), // Nouveau membre (pour organisations)
      v.literal("role_changed"), // Changement de rôle
      v.literal("level_up"), // Montée de niveau
      v.literal("other") // Autre
    ),
    title: v.string(), // Titre de la notification
    message: v.string(), // Message de la notification
    link: v.optional(v.string()), // Lien vers la ressource (ex: /articles/slug)
    read: v.boolean(), // Lu ou non
    // Métadonnées optionnelles
    metadata: v.optional(
      v.object({
        articleId: v.optional(v.id("articles")),
        proposalId: v.optional(v.id("governanceProposals")),
        debateId: v.optional(v.id("debates")),
        correctionId: v.optional(v.id("articleCorrections")),
        organizationId: v.optional(v.id("organizations")),
        invitationId: v.optional(v.id("invitations")),
        acceptedBy: v.optional(v.id("users")),
        rejectedBy: v.optional(v.id("users")),
        // Pour les commentaires
        targetType: v.optional(v.union(
          v.literal("article"),
          v.literal("project"),
          v.literal("action"),
          v.literal("proposal")
        )),
        targetId: v.optional(v.union(
          v.id("articles"),
          v.id("projects"),
          v.id("actions"),
          v.id("governanceProposals")
        )),
        commentId: v.optional(v.id("comments")),
        commenterId: v.optional(v.id("users")),
        parentCommentId: v.optional(v.id("comments")),
        reactionType: v.optional(v.union(
          v.literal("like"),
          v.literal("love"),
          v.literal("useful")
        )),
        reactorId: v.optional(v.id("users")),
      })
    ),
    // Timestamps
    createdAt: v.number(),
    readAt: v.optional(v.number()),
  })
    .index("userId", ["userId"])
    .index("userId_read", ["userId", "read"])
    .index("userId_createdAt", ["userId", "createdAt"]),

  // ============================================
  // CATEGORIES (Gérées par gouvernance)
  // ============================================
  categories: defineTable({
    name: v.string(), // Nom de la catégorie (ex: "Climat", "Santé", "Technologie")
    slug: v.string(), // Slug unique
    description: v.optional(v.string()), // Description de la catégorie
    icon: v.optional(v.string()), // Nom de l'icône Solar
    color: v.optional(v.string()), // Couleur hexadécimale
    // Applicable à
    appliesTo: v.array(
      v.union(
        v.literal("articles"),
        v.literal("dossiers"),
        v.literal("debates"),
        v.literal("projects"),
        v.literal("organizations"),
        v.literal("actions")
      )
    ), // Types de contenus auxquels cette catégorie peut être appliquée
    // Gouvernance
    proposedBy: v.id("users"), // Utilisateur qui a proposé la catégorie
    proposalId: v.optional(v.id("governanceProposals")), // Proposition de gouvernance associée
    approvedAt: v.optional(v.number()), // Date d'approbation
    approvedBy: v.optional(v.id("users")), // Utilisateur qui a approuvé (éditeur)
    // Statut
    status: v.union(
      v.literal("pending"), // En attente d'approbation
      v.literal("active"), // Active et utilisable
      v.literal("archived") // Archivée (plus utilisée)
    ),
    // Usage
    usageCount: v.number(), // Nombre de fois où la catégorie est utilisée
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("slug", ["slug"])
    .index("status", ["status"])
    .index("appliesTo", ["appliesTo"])
    .index("proposedBy", ["proposedBy"]),

  // ============================================
  // CONFIGURABLE RULES (Règles configurables par gouvernance)
  // ============================================
  configurableRules: defineTable({
    // Identifiant unique de la règle (ex: "scientific_articles_min_sources")
    key: v.string(),
    // Label clair pour l'utilisateur
    label: v.string(),
    // Description détaillée
    description: v.optional(v.string()),
    // Catégorie de la règle (peut être créée dynamiquement)
    category: v.string(), // Ex: "editorial", "product", "moderation", etc.
    // Type de valeur
    valueType: v.union(
      v.literal("number"),
      v.literal("boolean"),
      v.literal("string"),
      v.literal("select")
    ),
    // Valeur actuelle
    currentValue: v.any(),
    // Valeur par défaut
    defaultValue: v.any(),
    // Pour valueType = "select" - options disponibles
    options: v.optional(
      v.array(
        v.object({
          label: v.string(),
          value: v.any(),
        })
      )
    ),
    // Pour valueType = "number" - contraintes
    min: v.optional(v.number()),
    max: v.optional(v.number()),
    step: v.optional(v.number()),
    unit: v.optional(v.string()), // Unité affichée (ex: "sources", "jours", "%")
    // Type de proposition qui peut modifier cette règle
    proposalType: v.union(
      v.literal("editorial_rules"),
      v.literal("product_evolution"),
      v.literal("ethical_charter"),
      v.literal("other")
    ),
    // Statut
    status: v.union(
      v.literal("active"), // Règle active
      v.literal("deprecated") // Règle dépréciée
    ),
    // Historique des modifications (via propositions)
    lastModifiedBy: v.optional(v.id("governanceProposals")), // Dernière proposition qui a modifié
    lastModifiedAt: v.optional(v.number()),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("key", ["key"])
    .index("category", ["category"])
    .index("proposalType", ["proposalType"])
    .index("status", ["status"]),

  // ============================================
  // GOVERNANCE EVOLUTION (Évolution des règles de gouvernance)
  // ============================================
  governanceEvolution: defineTable({
    // Type d'évolution
    evolutionType: v.union(
      v.literal("vote_parameters"), // Modification des paramètres de vote
      v.literal("credibility_rules"), // Modification des règles de crédibilité
      v.literal("role_permissions"), // Modification des permissions de rôle
      v.literal("content_rules"), // Modification des règles de contenu
      v.literal("other") // Autre
    ),
    // Paramètres de vote (si evolutionType = "vote_parameters")
    voteParameters: v.optional(
      v.object({
        defaultQuorum: v.optional(v.number()), // Quorum par défaut
        defaultMajority: v.optional(v.number()), // Majorité par défaut (%)
        defaultDurationDays: v.optional(v.number()), // Durée par défaut (jours)
        minQuorum: v.optional(v.number()), // Quorum minimum
        maxQuorum: v.optional(v.number()), // Quorum maximum
        minMajority: v.optional(v.number()), // Majorité minimum (%)
        maxMajority: v.optional(v.number()), // Majorité maximum (%)
        minDurationDays: v.optional(v.number()), // Durée minimum (jours)
        maxDurationDays: v.optional(v.number()), // Durée maximum (jours)
      })
    ),
    // Règles de crédibilité (si evolutionType = "credibility_rules")
    credibilityRules: v.optional(
      v.object({
        publicationWeight: v.optional(v.number()), // Poids des publications (max 30)
        sourcesWeight: v.optional(v.number()), // Poids des sources (max 20)
        votesWeight: v.optional(v.number()), // Poids des votes (max 20)
        correctionsWeight: v.optional(v.number()), // Poids des corrections (max 15)
        expertiseWeight: v.optional(v.number()), // Poids de l'expertise (max 10)
        behaviorWeight: v.optional(v.number()), // Poids des comportements (max 5)
      })
    ),
    // Permissions de rôle (si evolutionType = "role_permissions")
    rolePermissions: v.optional(
      v.object({
        explorateur: v.optional(
          v.object({
            canVote: v.optional(v.boolean()),
            canComment: v.optional(v.boolean()),
            canProposeSources: v.optional(v.boolean()),
            voteWeight: v.optional(v.number()),
          })
        ),
        contributeur: v.optional(
          v.object({
            canWriteArticles: v.optional(v.boolean()),
            canVoteGovernance: v.optional(v.boolean()),
            canFactCheck: v.optional(v.boolean()),
            voteWeight: v.optional(v.number()),
          })
        ),
        editeur: v.optional(
          v.object({
            canValidateArticles: v.optional(v.boolean()),
            canArbitrateDebates: v.optional(v.boolean()),
            voteWeight: v.optional(v.number()),
          })
        ),
      })
    ),
    // Règles de contenu éditoriales (si evolutionType = "content_rules")
    contentRules: v.optional(v.any()), // Objet flexible pour stocker les règles éditoriales
    // Description
    description: v.string(), // Description de l'évolution
    // Gouvernance
    proposedBy: v.id("users"), // Utilisateur qui a proposé
    proposalId: v.optional(v.id("governanceProposals")), // Proposition associée
    approvedAt: v.optional(v.number()), // Date d'approbation
    approvedBy: v.optional(v.id("users")), // Utilisateur qui a approuvé
    // Statut
    status: v.union(
      v.literal("pending"), // En attente
      v.literal("active"), // Active (appliquée)
      v.literal("rejected"), // Rejetée
      v.literal("superseded") // Remplacée par une autre évolution
    ),
    // Application
    appliedAt: v.optional(v.number()), // Date d'application
    appliedBy: v.optional(v.id("users")), // Utilisateur qui a appliqué
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("evolutionType", ["evolutionType"])
    .index("status", ["status"])
    .index("proposedBy", ["proposedBy"])
    .index("proposalId", ["proposalId"]),

  // ============================================
  // CREDIBILITY HISTORY (Historique des gains de crédibilité)
  // ============================================
  credibilityHistory: defineTable({
    userId: v.id("users"),
    previousScore: v.number(), // Score avant le changement
    newScore: v.number(), // Score après le changement
    pointsGained: v.number(), // Points gagnés (peut être négatif)
    actionType: v.union(
      v.literal("article_published"), // Article publié
      v.literal("source_added"), // Source ajoutée
      v.literal("vote_received"), // Vote reçu
      v.literal("correction_approved"), // Correction approuvée
      v.literal("expertise_granted"), // Expertise accordée
      v.literal("verification_done"), // Vérification effectuée
      v.literal("mission_completed"), // Mission complétée
      v.literal("recalculation") // Recalcul automatique
    ),
    actionDetails: v.optional(
      v.object({
        articleId: v.optional(v.id("articles")),
        sourceId: v.optional(v.string()),
        voteId: v.optional(v.string()),
        correctionId: v.optional(v.id("articleCorrections")),
        verificationId: v.optional(v.string()),
        missionId: v.optional(v.id("missions")),
        reason: v.optional(v.string()), // Raison du changement
      })
    ),
    createdAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("userId_createdAt", ["userId", "createdAt"]),
});
