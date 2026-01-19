# 💰 Plan d'Intégration : Monétisation Web App (Stripe + Pub Récompensée + Parrainage)

**Version :** 1.0  
**Date :** 2025-01-XX  
**Stack :** Next.js 16 + Convex + TypeScript + Stripe

---

## 📋 Vue d'ensemble

Ce plan intègre 3 sources de revenus dans l'app existante :
1. **Paiements Stripe** (Pack Survie/Stratège/Whale)
2. **Publicité récompensée** (Cooldown Sponsorisé)
3. **Parrainage viral** (Inviter un pote = +100 Seeds)

**Principe :** Utiliser l'infrastructure existante (Seeds, transactions) sans tout réécrire.

---

## 🎯 PHASE 1 : STRIPE CHECKOUT (Paiements)

### 1.1 Configuration Backend (Convex)

#### A. Ajouter au schéma (`convex/schema.ts`)

```typescript
// Dans users table, ajouter :
stripeCustomerId: v.optional(v.string()), // ID client Stripe

// Nouvelle table : stripePayments
stripePayments: defineTable({
  userId: v.id("users"),
  stripeSessionId: v.string(), // ID de session Stripe
  stripePaymentIntentId: v.optional(v.string()), // ID du paiement
  packId: v.string(), // "pack_survie", "pack_strategie", "pack_whale"
  amount: v.number(), // Montant en centimes (ex: 199 = 1.99€)
  currency: v.string(), // "eur"
  seedsAwarded: v.number(), // Seeds crédités
  status: v.union(
    v.literal("pending"), // En attente
    v.literal("completed"), // Payé et crédité
    v.literal("failed"), // Échec
    v.literal("refunded") // Remboursé
  ),
  metadata: v.optional(v.any()), // Métadonnées Stripe
  createdAt: v.number(),
  completedAt: v.optional(v.number()),
})
  .index("userId", ["userId"])
  .index("stripeSessionId", ["stripeSessionId"])
  .index("status", ["status"]),
```

#### B. Créer `convex/payments.ts`

**Fonctions à créer :**
- `createCheckoutSession` (mutation) : Crée une session Stripe Checkout
- `getUserPayments` (query) : Récupère l'historique des paiements
- `creditSeedsFromPayment` (internal mutation) : Crédite les Seeds après paiement (appelé par webhook)

**Packs définis :**
```typescript
const SEED_PACKS = {
  pack_survie: { seeds: 1200, price: 199 }, // 1.99€
  pack_strategie: { seeds: 6000, price: 999 }, // 9.99€
  pack_whale: { seeds: 30000, price: 4999 }, // 49.99€
} as const;
```

### 1.2 API Routes Next.js

#### A. `src/app/api/payments/checkout/route.ts`

**Rôle :** Crée une session Stripe Checkout

**Flux :**
1. Récupère l'utilisateur connecté (via Better Auth)
2. Appelle Convex `createCheckoutSession` avec `packId`
3. Convex crée la session Stripe (utilise `stripe` package)
4. Retourne l'URL de redirection Stripe

**Sécurité :**
- Vérifier que l'utilisateur est authentifié
- Valider que le `packId` existe

#### B. `src/app/api/webhooks/stripe/route.ts`

**Rôle :** Reçoit les événements Stripe (webhook)

**Événements à gérer :**
- `checkout.session.completed` : Paiement réussi → Créditer les Seeds
- `payment_intent.succeeded` : Confirmation de paiement
- `charge.refunded` : Remboursement → Débiter les Seeds

**Sécurité CRITIQUE :**
- Vérifier la signature Stripe (`stripe-signature` header)
- Utiliser `stripe.webhooks.constructEvent()`
- Ne jamais faire confiance au payload sans vérification

**Flux :**
1. Vérifier la signature
2. Parser l'événement
3. Si `checkout.session.completed` :
   - Récupérer `metadata.userId` et `metadata.packId`
   - Appeler Convex `creditSeedsFromPayment` (internal mutation)
4. Retourner `200 OK` à Stripe

### 1.3 Frontend (Composants React)

#### A. `src/components/payments/SeedPackShop.tsx`

**Rôle :** Affiche les 3 packs avec boutons d'achat

**Fonctionnalités :**
- Affiche les packs (Survie, Stratège, Whale)
- Bouton "Acheter" qui appelle `/api/payments/checkout`
- Redirection vers Stripe Checkout
- Page de succès `/payments/success` après paiement

#### B. `src/app/(public)/payments/success/page.tsx`

**Rôle :** Page de confirmation après paiement Stripe

**Flux :**
- Stripe redirige vers `/payments/success?session_id=xxx`
- Vérifier que le paiement est bien complété (appel Convex)
- Afficher confirmation + Seeds crédités

---

## 📺 PHASE 2 : PUBLICITÉ RÉCOMPENSÉE (Cooldown Sponsorisé)

### 2.1 Configuration Backend (Convex)

#### A. Ajouter au schéma (`convex/schema.ts`)

```typescript
// Dans users table, ajouter :
lastAdRewardTimestamp: v.optional(v.number()), // Dernière récompense pub

// Nouvelle table : adRewards
adRewards: defineTable({
  userId: v.id("users"),
  seedsAwarded: v.number(), // Seeds gagnés (défaut: 10)
  rewardType: v.union(
    v.literal("sponsored_link"), // Lien sponsorisé (cooldown)
    v.literal("video_ad") // Vidéo pub (si implémenté plus tard)
  ),
  partnerUrl: v.optional(v.string()), // URL du partenaire (si applicable)
  createdAt: v.number(),
})
  .index("userId", ["userId"])
  .index("userId_createdAt", ["userId", "createdAt"]),
```

#### B. Créer `convex/adRewards.ts`

**Fonctions à créer :**
- `claimAdReward` (mutation) : Réclame la récompense pub
  - Vérifie le rate limit (cooldown de 4h)
  - Si OK → Crédite 10 Seeds + Met à jour `lastAdRewardTimestamp`
  - Si trop tôt → Retourne erreur avec temps restant
- `getAdRewardStatus` (query) : Récupère le statut (peut réclamer ? temps restant ?)

**Rate Limiting :**
```typescript
const AD_REWARD_COOLDOWN = 4 * 60 * 60 * 1000; // 4 heures en ms
const AD_REWARD_SEEDS = 10; // Seeds gagnés par pub
```

### 2.2 Frontend (Composants React)

#### A. `src/components/ads/AdRewardButton.tsx`

**Rôle :** Bouton "Gagner 10 Seeds" avec cooldown

**Fonctionnalités :**
- Affiche le bouton si cooldown terminé
- Affiche compte à rebours si cooldown actif
- Au clic :
  1. Ouvre un nouvel onglet vers partenaire/AdSense
  2. Lance un compte à rebours de 30 secondes
  3. Appelle Convex `claimAdReward` après 30s
  4. Affiche confirmation + Seeds crédités

**UX :**
- Modal avec compte à rebours
- Bouton désactivé pendant le cooldown
- Affichage du temps restant

---

## 🎁 PHASE 3 : PARRAINAGE VIRAL

### 3.1 Configuration Backend (Convex)

#### A. Ajouter au schéma (`convex/schema.ts`)

```typescript
// Dans users table, ajouter :
referralCode: v.optional(v.string()), // Code unique (ex: "USER123")
referredBy: v.optional(v.id("users")), // Utilisateur qui a parrainé
referralRewardClaimed: v.optional(v.boolean()), // Récompense déjà réclamée

// Nouvelle table : referrals
referrals: defineTable({
  referrerId: v.id("users"), // Celui qui parraine
  referredId: v.id("users"), // Celui qui s'inscrit
  referrerRewardClaimed: v.boolean(), // Récompense parrain déjà créditée
  referredRewardClaimed: v.boolean(), // Récompense parrainé déjà créditée
  createdAt: v.number(),
})
  .index("referrerId", ["referrerId"])
  .index("referredId", ["referredId"])
  .index("referrerId_createdAt", ["referrerId", "createdAt"]),
```

#### B. Créer `convex/referrals.ts`

**Fonctions à créer :**
- `generateReferralCode` (mutation) : Génère un code unique pour l'utilisateur
- `processReferral` (internal mutation) : Traite un parrainage lors de l'inscription
  - Vérifie que le code existe
  - Crée l'entrée dans `referrals`
  - Crédite 100 Seeds au parrain ET au parrainé
- `getReferralStats` (query) : Stats de parrainage (nombre de filleuls, Seeds gagnés)

**Récompenses :**
```typescript
const REFERRAL_REWARD = 100; // Seeds pour le parrain ET le parrainé
```

### 3.2 Frontend (Composants React)

#### A. `src/components/referrals/ReferralButton.tsx`

**Rôle :** Bouton "Inviter un pote = +100 Seeds"

**Fonctionnalités :**
- Affiche le code de parrainage de l'utilisateur
- Bouton "Copier le lien"
- Lien format : `seed.app/sign-up?ref=USER123`
- Affiche les stats (nombre de filleuls, Seeds gagnés)

#### B. Modifier `src/app/(unauth)/sign-up/page.tsx`

**Rôle :** Détecter le paramètre `?ref=XXX` et l'enregistrer

**Flux :**
1. Lire `?ref=XXX` dans l'URL
2. Stocker temporairement (cookie/localStorage)
3. Après inscription réussie, appeler Convex `processReferral`
4. Créditer les Seeds aux deux utilisateurs

---

## 🔧 DÉTAILS TECHNIQUES

### Stack & Dépendances

**À installer :**
```bash
pnpm add stripe @stripe/stripe-js
```

**Variables d'environnement :**
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AdSense (optionnel, pour plus tard)
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-...
```

### Sécurité

1. **Stripe Webhook :**
   - Toujours vérifier la signature
   - Utiliser `stripe.webhooks.constructEvent()`
   - Ne jamais faire confiance au payload

2. **Rate Limiting (Pub) :**
   - Vérification serveur (Convex) uniquement
   - Le front-end peut être contourné, donc la logique doit être backend

3. **Parrainage :**
   - Vérifier que l'utilisateur ne s'auto-parraine pas
   - Vérifier qu'un utilisateur ne peut parrainer qu'une fois par inscription

### Intégration avec l'existant

**Réutilisation :**
- `convex/seedsTransactions.ts` : Créer les transactions
- `convex/users.ts` : `updateUserSeeds` pour créditer
- `convex/gamification.ts` : `calculateLevel` pour mettre à jour le niveau

**Nouveaux fichiers :**
- `convex/payments.ts` : Logique Stripe
- `convex/adRewards.ts` : Logique pub récompensée
- `convex/referrals.ts` : Logique parrainage
- `src/app/api/payments/checkout/route.ts` : API Checkout
- `src/app/api/webhooks/stripe/route.ts` : Webhook Stripe
- `src/components/payments/SeedPackShop.tsx` : UI Packs
- `src/components/ads/AdRewardButton.tsx` : UI Pub
- `src/components/referrals/ReferralButton.tsx` : UI Parrainage

---

## 📅 ORDRE D'IMPLÉMENTATION RECOMMANDÉ

### Sprint 1 : Stripe Checkout (Base)
1. Installer Stripe
2. Créer le schéma `stripePayments`
3. Créer `convex/payments.ts` (createCheckoutSession)
4. Créer API route `/api/payments/checkout`
5. Créer composant `SeedPackShop`
6. Tester avec Stripe Test Mode

### Sprint 2 : Stripe Webhook (Sécurité)
1. Créer API route `/api/webhooks/stripe`
2. Implémenter vérification de signature
3. Créer `creditSeedsFromPayment` (internal mutation)
4. Tester avec Stripe CLI webhook forwarding
5. Créer page `/payments/success`

### Sprint 3 : Pub Récompensée
1. Créer le schéma `adRewards`
2. Créer `convex/adRewards.ts` (rate limiting)
3. Créer composant `AdRewardButton`
4. Intégrer dans le profil ou une page dédiée
5. Tester le cooldown

### Sprint 4 : Parrainage Viral
1. Créer le schéma `referrals`
2. Créer `convex/referrals.ts`
3. Modifier `sign-up` pour détecter `?ref=`
4. Créer composant `ReferralButton`
5. Afficher les stats de parrainage

---

## 🎨 UX/UI RECOMMANDATIONS

### Paiements
- **Placement :** Bouton "Recharger" dans le profil, ou modal accessible depuis le header
- **Design :** Cards avec gradient, prix en évidence, Seeds affichés
- **Feedback :** Toast de confirmation après paiement réussi

### Pub Récompensée
- **Placement :** Section dédiée dans le profil ou page "Gagner des Seeds"
- **Design :** Bouton avec icône pub, compte à rebours visible
- **Feedback :** Animation de +10 Seeds après récompense

### Parrainage
- **Placement :** Section dans le profil "Inviter des amis"
- **Design :** Code de parrainage en évidence, bouton copier, stats visuelles
- **Feedback :** Toast "Lien copié !" + notification quand quelqu'un s'inscrit

---

## ✅ CHECKLIST FINALE

### Backend (Convex)
- [ ] Schéma `stripePayments` créé
- [ ] Schéma `adRewards` créé
- [ ] Schéma `referrals` créé
- [ ] `convex/payments.ts` implémenté
- [ ] `convex/adRewards.ts` implémenté
- [ ] `convex/referrals.ts` implémenté
- [ ] Variables d'environnement Stripe configurées

### API Routes (Next.js)
- [ ] `/api/payments/checkout` créé
- [ ] `/api/webhooks/stripe` créé avec vérification signature
- [ ] Tests avec Stripe CLI

### Frontend (React)
- [ ] `SeedPackShop` composant créé
- [ ] `AdRewardButton` composant créé
- [ ] `ReferralButton` composant créé
- [ ] Page `/payments/success` créée
- [ ] Intégration dans le profil

### Tests
- [ ] Test paiement Stripe (mode test)
- [ ] Test webhook Stripe
- [ ] Test rate limiting pub
- [ ] Test parrainage (auto-parrainage bloqué)

---

## 🚨 POINTS D'ATTENTION

1. **Stripe Webhook :** La sécurité est CRITIQUE. Ne jamais déployer sans vérification de signature.
2. **Rate Limiting :** La logique doit être 100% backend. Le front peut être contourné.
3. **Parrainage :** Prévoir une limite (ex: max 10 parrainages par utilisateur) pour éviter les abus.
4. **AdSense :** Si AdSense est trop strict, utiliser une alternative comme Monetag pour démarrer.
5. **Convex Actions :** Les webhooks Stripe doivent appeler des `internal` mutations, pas des mutations publiques.

---

**Note :** Ce plan est conçu pour s'intégrer progressivement sans casser l'existant. Chaque phase peut être déployée indépendamment.

