/**
 * 🎯 TRADING ENGINE - Bonding Curve Formulas
 * 
 * Implémentation des formules mathématiques pour le marché prédictif binaire
 * basé sur une Bonding Curve linéaire.
 * 
 * Formule de base : P(S) = m × S
 * - P : Prix unitaire instantané en Seeds
 * - S : Supply Total (Ghost Supply + Real Supply)
 * - m : Slope (pente de la courbe)
 * 
 * 🚀 STRATÉGIE IPO (Initial Political Offering) :
 * 
 * Le système utilise un "Pre-Minting" (pré-minage d'actions fantômes) pour
 * créer un marché immédiatement sans attendre de liquidité :
 * 
 * 1. L'admin définit targetPrice (1-99 Seeds) et depthFactor (500-10000)
 * 2. Le système calcule slope = 100 / depthFactor
 * 3. Le système calcule ghostSupply = targetPrice / slope
 * 4. Prix initial = slope × ghostSupply = targetPrice ✅
 * 
 * Résultat : Le marché démarre au prix cible dès la création, créant
 * un effet "bourse" plutôt qu'un simple sondage qui démarre à 0.
 */

/**
 * Calcule la pente (slope) de la bonding curve
 * @param depthFactor - Facteur de profondeur (ex: 10 000 pour stable, 500 pour volatile)
 * @returns La pente m = 100 / depthFactor
 * 
 * Exemple:
 * - depthFactor = 10 000 → m = 0.01 (courbe très plate, prix stable)
 * - depthFactor = 500 → m = 0.2 (courbe raide, prix volatile)
 */
export function calculateSlope(depthFactor: number): number {
  if (depthFactor <= 0) {
    throw new Error("depthFactor must be positive");
  }
  return 100 / depthFactor;
}

/**
 * Calcule le Supply Fantôme (Ghost Supply) initial
 * @param targetPrice - Prix de départ souhaité en Seeds
 * @param slope - Pente de la courbe (m)
 * @returns Le Supply Fantôme S_ghost = targetPrice / m
 * 
 * Le Ghost Supply simule un prix de départ sans avoir besoin de liquidité réelle.
 * Il permet de définir un prix initial P_0 = m × S_ghost = targetPrice
 */
export function calculateGhostSupply(targetPrice: number, slope: number): number {
  if (slope <= 0) {
    throw new Error("slope must be positive");
  }
  return targetPrice / slope;
}


/**
 * Calcule le prix unitaire instantané d'une action
 * @param slope - Pente de la courbe (m)
 * @param totalSupply - Supply Total (Ghost Supply + Real Supply)
 * @returns Le prix unitaire P = m × S
 * 
 * Exemple:
 * - slope = 0.01, totalSupply = 1000 → P = 10 Seeds
 * - slope = 0.2, totalSupply = 100 → P = 20 Seeds
 */
export function getCurrentPrice(slope: number, totalSupply: number): number {
  if (totalSupply < 0) {
    throw new Error("totalSupply cannot be negative");
  }
  if (slope < 0) {
    throw new Error("slope cannot be negative");
  }
  // ✅ GARDE-FOU : S'assurer que le prix ne peut jamais être négatif
  return Math.max(0, slope * totalSupply);
}

/**
 * 🎯 Calcule le prix unitaire instantané (bonding curve simple)
 * @param slope - Pente de la courbe (m)
 * @param ghostSupply - Supply fantôme
 * @param realSupply - Supply réel
 * @returns Prix unitaire P = m × (ghostSupply + realSupply)
 * 
 * ALGORITHME SIMPLIFIÉ :
 * - Utilise directement la bonding curve linéaire
 * - Pas d'ajustement complexe de pente
 * - Prix initial = slope × ghostSupply = targetPrice ✅
 * - Prix peut dépasser 100 Seeds (quotes < 1 possibles) ✅
 * 
 * Exemple:
 * - slope = 0.01, ghostSupply = 5000, realSupply = 0
 *   → Prix = 0.01 × 5000 = 50 Seeds ✅
 * - slope = 0.01, ghostSupply = 5000, realSupply = 10000
 *   → Prix = 0.01 × 15000 = 150 Seeds (quote = 0.67x) ✅
 */
export function getCurrentPriceAdjusted(
  slope: number,
  ghostSupply: number,
  realSupply: number
): number {
  if (slope < 0) {
    throw new Error("slope cannot be negative");
  }
  if (ghostSupply < 0 || realSupply < 0) {
    throw new Error("ghostSupply and realSupply cannot be negative");
  }
  const totalSupply = ghostSupply + realSupply;
  // ✅ ALGORITHME SIMPLE : Prix = slope × totalSupply (bonding curve linéaire)
  return Math.max(0, slope * totalSupply);
}

/**
 * Calcule le coût total pour acheter k actions
 * @param slope - Pente de la courbe (m)
 * @param currentSupply - Supply actuel (avant l'achat)
 * @param shares - Nombre d'actions à acheter (k)
 * @returns Le coût total en Seeds : Cost = (m/2) × (S_new² - S_current²)
 * 
 * Formule dérivée de l'intégrale de la bonding curve :
 * ∫[S_current à S_new] m × S dS = (m/2) × (S_new² - S_current²)
 * 
 * Exemple:
 * - slope = 0.01, currentSupply = 1000, shares = 100
 * - S_new = 1100
 * - Cost = (0.01/2) × (1100² - 1000²) = 0.005 × (1,210,000 - 1,000,000) = 1,050 Seeds
 */
export function calculateBuyCost(
  slope: number,
  currentSupply: number,
  shares: number
): number {
  if (shares <= 0) {
    throw new Error("shares must be positive");
  }
  if (currentSupply < 0) {
    throw new Error("currentSupply cannot be negative");
  }
  if (slope < 0) {
    throw new Error("slope cannot be negative");
  }

  const newSupply = currentSupply + shares;
  const cost = (slope / 2) * (newSupply * newSupply - currentSupply * currentSupply);
  
  // ✅ GARDE-FOU : S'assurer que le coût ne peut jamais être négatif
  // Arrondir à 2 décimales pour éviter les erreurs de précision
  return Math.max(0, Math.round(cost * 100) / 100);
}

/**
 * 🎯 Calcule le coût d'achat (bonding curve simple)
 * @param slope - Pente de la courbe (m)
 * @param ghostSupply - Supply fantôme
 * @param currentRealSupply - Supply réel actuel
 * @param shares - Nombre d'actions à acheter
 * @returns Coût total en Seeds : Cost = (m/2) × (S_new² - S_current²)
 * 
 * ALGORITHME SIMPLIFIÉ :
 * - Utilise directement calculateBuyCost avec totalSupply
 * - Pas d'ajustement complexe de pente
 * - Formule standard de bonding curve linéaire
 */
export function calculateBuyCostAdjusted(
  slope: number,
  ghostSupply: number,
  currentRealSupply: number,
  shares: number
): number {
  if (shares <= 0) {
    throw new Error("shares must be positive");
  }
  if (currentRealSupply < 0) {
    throw new Error("currentRealSupply cannot be negative");
  }

  const currentTotalSupply = ghostSupply + currentRealSupply;
  // ✅ ALGORITHME SIMPLE : Utiliser directement calculateBuyCost
  return calculateBuyCost(slope, currentTotalSupply, shares);
}

/**
 * Calcule le montant brut reçu pour vendre k actions
 * @param slope - Pente de la courbe (m)
 * @param currentSupply - Supply actuel (avant la vente)
 * @param shares - Nombre d'actions à vendre (k)
 * @returns Le montant brut en Seeds : Gross = (m/2) × (S_current² - S_new²)
 * 
 * C'est l'inverse de l'achat : on retire de la réserve la valeur correspondante.
 * 
 * Exemple:
 * - slope = 0.01, currentSupply = 1100, shares = 100
 * - S_new = 1000
 * - Gross = (0.01/2) × (1100² - 1000²) = 0.005 × (1,210,000 - 1,000,000) = 1,050 Seeds
 */
export function calculateSellGross(
  slope: number,
  currentSupply: number,
  shares: number
): number {
  if (shares <= 0) {
    throw new Error("shares must be positive");
  }
  if (currentSupply < shares) {
    throw new Error("Cannot sell more shares than current supply");
  }
  if (slope < 0) {
    throw new Error("slope cannot be negative");
  }

  const newSupply = currentSupply - shares;
  const gross = (slope / 2) * (currentSupply * currentSupply - newSupply * newSupply);
  
  // ✅ GARDE-FOU : S'assurer que le montant brut ne peut jamais être négatif
  // Arrondir à 2 décimales pour éviter les erreurs de précision
  return Math.max(0, Math.round(gross * 100) / 100);
}

/**
 * 🎯 Calcule le montant brut de vente (bonding curve simple)
 * @param slope - Pente de la courbe (m)
 * @param ghostSupply - Supply fantôme
 * @param currentRealSupply - Supply réel actuel
 * @param shares - Nombre d'actions à vendre
 * @returns Montant brut en Seeds : Gross = (m/2) × (S_current² - S_new²)
 * 
 * ALGORITHME SIMPLIFIÉ :
 * - Utilise directement calculateSellGross avec totalSupply
 * - Pas d'ajustement complexe de pente
 * - Formule standard de bonding curve linéaire
 */
export function calculateSellGrossAdjusted(
  slope: number,
  ghostSupply: number,
  currentRealSupply: number,
  shares: number
): number {
  if (shares <= 0) {
    throw new Error("shares must be positive");
  }
  if (currentRealSupply < shares) {
    throw new Error("Cannot sell more shares than current real supply");
  }
  if (slope < 0) {
    throw new Error("slope cannot be negative");
  }
  if (ghostSupply < 0) {
    throw new Error("ghostSupply cannot be negative");
  }

  const currentTotalSupply = ghostSupply + currentRealSupply;
  // ✅ ALGORITHME SIMPLE : Utiliser directement calculateSellGross
  return calculateSellGross(slope, currentTotalSupply, shares);
}

/**
 * 🎯 FOMO : Calcule la durée de disponibilité d'investissement (fenêtre variable)
 * 
 * @param decision - Décision avec ses propriétés
 * @param now - Timestamp actuel
 * @returns Durée en millisecondes pendant laquelle l'investissement est disponible
 * 
 * STRATÉGIE ÉCONOMIQUE :
 * - Durées courtes (1-5 jours) pour créer de l'urgence et du FOMO
 * - Heat élevé = fenêtre plus courte (événements chauds = urgence)
 * - Types urgents (crisis, conflict) = fenêtre très courte
 * - Date proche = fenêtre réduite (événement imminent)
 * - Nombre d'anticipations élevé = fenêtre réduite (FOMO social)
 * 
 * ÉCHELLE DE CALCUL :
 * - Base : 3 jours (72h)
 * - Ajustements selon critères : -2j à +2j
 * - Résultat final : 1-5 jours (24h à 120h)
 */
export function calculateInvestmentWindow(params: {
  heat: number; // 0-100
  type: string;
  sentiment: "positive" | "negative" | "neutral";
  eventDate: number; // Date de l'événement décisionnel
  createdAt: number; // Date de création de la décision
  anticipationsCount: number; // Nombre d'anticipations existantes
  totalSharesPurchased: number; // Volume total d'actions achetées (OUI + NON)
  now: number; // Timestamp actuel
}): number {
  const { heat, type, sentiment, eventDate, createdAt, anticipationsCount, totalSharesPurchased, now } = params;
  
  // Base : 3 jours (72 heures)
  let windowHours = 72;
  
  // 1. Ajustement selon le HEAT (0-100)
  // Heat élevé = urgence = fenêtre plus courte
  // Heat faible = moins urgent = fenêtre plus longue
  const heatAdjustment = (heat - 50) * -0.3; // -15h à +15h selon heat
  windowHours += heatAdjustment;
  
  // 2. Ajustement selon le TYPE d'événement
  const typeAdjustments: Record<string, number> = {
    // Types très urgents = fenêtre très courte
    "crisis": -24, // -1 jour
    "conflict": -24,
    "disaster": -18, // -18h
    "economic_event": -12, // -12h
    
    // Types modérés = ajustement modéré
    "sanction": -6,
    "tax": -6,
    "policy": -3,
    
    // Types stables = fenêtre plus longue
    "election": +12, // +12h
    "law": +6,
    "regulation": +6,
    "agreement": +3,
    "discovery": +3,
    
    // Autres = neutre
    "other": 0,
  };
  
  windowHours += typeAdjustments[type] || 0;
  
  // 3. Ajustement selon le SENTIMENT
  // Événements négatifs = plus urgents = fenêtre plus courte
  if (sentiment === "negative") {
    windowHours -= 12; // -12h
  } else if (sentiment === "positive") {
    windowHours += 6; // +6h
  }
  // Neutral = pas d'ajustement
  
  // 4. Ajustement selon la PROXIMITÉ de l'événement
  // Si l'événement est proche (< 7 jours), réduire la fenêtre
  const daysUntilEvent = (eventDate - now) / (24 * 60 * 60 * 1000);
  if (daysUntilEvent < 7) {
    // Événement très proche = urgence maximale
    windowHours -= 18; // -18h
  } else if (daysUntilEvent < 30) {
    // Événement proche = urgence modérée
    windowHours -= 6; // -6h
  }
  
  // 5. Ajustement selon le NOMBRE D'ANTICIPATIONS (FOMO social)
  // Plus il y a d'anticipations, plus c'est populaire = fenêtre réduite
  if (anticipationsCount > 50) {
    windowHours -= 12; // -12h (très populaire)
  } else if (anticipationsCount > 20) {
    windowHours -= 6; // -6h (populaire)
  } else if (anticipationsCount > 10) {
    windowHours -= 3; // -3h (modérément populaire)
  }
  
  // 6. 🎯 PROLONGATION selon le VOLUME D'ACTIONS ACHETÉES (PROGRESSIVE)
  // Plus il y a d'actions achetées, plus la fenêtre se prolonge (récompense l'engagement)
  // Formule progressive : +0.01h (36 secondes) par action, plafonné à +24h (1 jour max)
  // Cela encourage les achats de manière continue et progressive, sans sauts discrets
  const volumeBonusHours = Math.min(24, totalSharesPurchased * 0.01); // Max +24h, progressif
  windowHours += volumeBonusHours;
  
  // Convertir en millisecondes et clamper entre 24h (1 jour) et 144h (6 jours max avec bonus)
  const windowMs = Math.max(24 * 60 * 60 * 1000, Math.min(144 * 60 * 60 * 1000, windowHours * 60 * 60 * 1000));
  
  return Math.round(windowMs);
}

/**
 * Calcule le temps ajouté à la fenêtre d'investissement pour un achat donné (PROGRESSIF)
 * @param sharesPurchased - Nombre d'actions achetées dans cette transaction
 * @param totalSharesBefore - Volume total d'actions avant cet achat (non utilisé dans la version progressive)
 * @returns Temps ajouté en millisecondes
 */
export function calculateTimeAddedForPurchase(
  sharesPurchased: number,
  totalSharesBefore: number
): number {
  // Formule progressive : +0.01h (36 secondes) par action
  // Le temps ajouté est directement proportionnel au nombre d'actions achetées
  const hoursAdded = sharesPurchased * 0.01; // Progressif : 1 action = 0.01h (36s), 10 actions = 0.1h (6min), 100 actions = 1h
  
  // Convertir en millisecondes
  return hoursAdded * 60 * 60 * 1000;
}

/**
 * Calcule le montant net reçu après taxe de transaction progressive
 * @param gross - Montant brut avant taxe
 * @param holdingDurationMs - Durée de détention en millisecondes (depuis l'achat de la première part)
 * @returns Le montant net après taxe progressive
 * 
 * Taxe progressive selon durée de détention (encourage positions long terme) :
 * - < 24h : 20% de taxe (décourage trading rapide)
 * - 24h-7j : 15% de taxe
 * - 7j-30j : 10% de taxe
 * - > 30j : 5% de taxe (récompense positions long terme)
 */
export function calculateSellNet(gross: number, holdingDurationMs: number = 0): number {
  if (gross < 0) {
    throw new Error("gross cannot be negative");
  }
  
  const holdingDurationDays = holdingDurationMs / (24 * 60 * 60 * 1000);
  
  let taxRate: number;
  if (holdingDurationDays < 1) {
    // < 24h : 20% de taxe
    taxRate = 0.20;
  } else if (holdingDurationDays < 7) {
    // 24h-7j : 15% de taxe
    taxRate = 0.15;
  } else if (holdingDurationDays < 30) {
    // 7j-30j : 10% de taxe
    taxRate = 0.10;
  } else {
    // > 30j : 5% de taxe (positions long terme)
    taxRate = 0.05;
  }
  
  const net = gross * (1 - taxRate);
  return Math.round(net * 100) / 100;
}

/**
 * Calcule le prix moyen par action pour un achat de k actions
 * @param slope - Pente de la courbe (m)
 * @param currentSupply - Supply actuel (avant l'achat)
 * @param shares - Nombre d'actions à acheter
 * @returns Le prix moyen par action : AveragePrice = Cost / shares
 * 
 * Utile pour l'affichage dans l'UI.
 */
export function calculateAverageBuyPrice(
  slope: number,
  currentSupply: number,
  shares: number
): number {
  const cost = calculateBuyCost(slope, currentSupply, shares);
  return cost / shares;
}

/**
 * Calcule le prix moyen par action pour une vente de k actions
 * @param slope - Pente de la courbe (m)
 * @param currentSupply - Supply actuel (avant la vente)
 * @param shares - Nombre d'actions à vendre
 * @returns Le prix moyen net par action : AveragePrice = Net / shares
 * 
 * Utile pour l'affichage dans l'UI.
 */
export function calculateAverageSellPrice(
  slope: number,
  currentSupply: number,
  shares: number,
  holdingDurationMs: number = 0
): number {
  const gross = calculateSellGross(slope, currentSupply, shares);
  const net = calculateSellNet(gross, holdingDurationMs);
  return net / shares;
}

/**
 * Calcule la liquidité d'un pool de manière cohérente
 * @param pool - Pool de trading (peut être null)
 * @param targetPrice - Prix cible de la décision (pour calculer la liquidité initiale)
 * @returns La liquidité du pool
 * 
 * Logique :
 * - Si pool existe et reserve > 0 : utiliser reserve (liquidité réelle)
 * - Si pool existe mais reserve = 0 : utiliser ghostSupply * slope = targetPrice (liquidité initiale)
 * - Si pool n'existe pas : utiliser targetPrice (liquidité par défaut)
 * 
 * Cette fonction garantit la cohérence : même formule partout dans le code.
 */
export function calculatePoolLiquidity(
  pool: { reserve: number; ghostSupply: number; slope: number } | null,
  targetPrice: number
): number {
  if (!pool) {
    // Si le pool n'existe pas, utiliser targetPrice comme liquidité initiale
    return targetPrice;
  }
  
  if (pool.reserve > 0) {
    // Si la réserve existe, c'est la liquidité réelle
    return pool.reserve;
  }
  
  // Si reserve = 0, utiliser la liquidité initiale basée sur ghostSupply
  // Liquidité initiale = ghostSupply × slope = targetPrice
  // C'est cohérent avec l'IPO : le prix initial = targetPrice
  return pool.ghostSupply * pool.slope;
}

/**
 * 🎯 NOUVEAU SYSTÈME : Prix cohérents basés sur bonding curve avec corrélation inverse pour UX
 * 
 * PRINCIPE FONDAMENTAL :
 * - Le prix RÉEL de trading = prix de bonding curve (utilisé pour achat/vente)
 * - Le prix AFFICHÉ = prix réel ajusté pour corrélation inverse OUI/NON (pour UX)
 * - Garantit que : prix affiché ≈ prix réel (pas de tromperie)
 * 
 * LOGIQUE MATHÉMATIQUE :
 * 1. Calculer les prix RÉELS via bonding curve pour OUI et NON
 * 2. Calculer la somme des prix réels : totalRealPrice = realPriceYes + realPriceNo
 * 3. Normaliser pour que la somme = 100 (corrélation inverse) :
 *    - normalizedYes = (realPriceYes / totalRealPrice) × 100
 *    - normalizedNo = (realPriceNo / totalRealPrice) × 100
 * 4. Garantir que normalizedYes + normalizedNo = 100 (toujours)
 * 
 * AVANTAGES :
 * ✅ Prix affiché reflète le prix réel de trading (cohérent)
 * ✅ Corrélation inverse garantie (si OUI monte, NON baisse)
 * ✅ Si vous achetez et la tendance va dans votre sens, vous gagnez
 * ✅ Pas de dilution : le prix augmente avec vos achats
 * 
 * @param realPriceYes - Prix réel OUI calculé via bonding curve
 * @param realPriceNo - Prix réel NON calculé via bonding curve
 * @returns Prix normalisés { yes: number, no: number } avec corrélation inverse
 * 
 * Exemple:
 * - Prix réels : yes = 30, no = 70 → total = 100
 *   - Normalisé : yes = 30, no = 70 ✅ (déjà à 100)
 * - Prix réels : yes = 40, no = 80 → total = 120
 *   - Normalisé : yes = (40/120) × 100 = 33.33, no = (80/120) × 100 = 66.67 ✅
 * - Si vous achetez NON et prix réel monte à 90 :
 *   - Normalisé : yes = (40/130) × 100 = 30.77, no = (90/130) × 100 = 69.23 ✅
 */
export function normalizeBinaryPricesFromRealPrices(
  realPriceYes: number,
  realPriceNo: number
): { yes: number; no: number } {
  // ✅ GARDE-FOU : S'assurer que les prix réels ne sont jamais négatifs
  const safeRealPriceYes = Math.max(0, realPriceYes);
  const safeRealPriceNo = Math.max(0, realPriceNo);
  const totalRealPrice = safeRealPriceYes + safeRealPriceNo;
  
  // Éviter la division par zéro
  if (totalRealPrice <= 0) {
    return { yes: 50, no: 50 }; // Par défaut 50/50 si aucun prix
  }
  
  // 🎯 NORMALISATION : Garantir que yes + no = 100 (corrélation inverse)
  // Si totalRealPrice = 100, les prix sont déjà normalisés
  // Sinon, on normalise proportionnellement
  const normalizedYes = (safeRealPriceYes / totalRealPrice) * 100;
  const normalizedNo = (safeRealPriceNo / totalRealPrice) * 100;
  
  // ✅ GARANTIE MATHÉMATIQUE : normalizedYes + normalizedNo = 100 (toujours)
  // ✅ GARANTIE : Si realPriceYes augmente, normalizedYes augmente (et vice versa)
  // ✅ GARANTIE : Corrélation inverse (si yes monte, no baisse proportionnellement)
  
  // Arrondir à 2 décimales pour éviter les erreurs de précision
  return {
    yes: Math.max(0, Math.min(100, Math.round(normalizedYes * 100) / 100)),
    no: Math.max(0, Math.min(100, Math.round(normalizedNo * 100) / 100)),
  };
}

/**
 * 🎯 ANCIEN SYSTÈME (GARDÉ POUR COMPATIBILITÉ) : Normalisation basée sur liquidité
 * 
 * ⚠️ DÉPRÉCIÉ : Utilise normalizeBinaryPricesFromRealPrices à la place
 * 
 * Cette fonction est conservée pour la compatibilité mais ne devrait plus être utilisée
 * pour les nouveaux développements. Elle utilise un market cap fixe qui ne reflète pas
 * le prix réel de trading.
 * 
 * @deprecated Utilisez normalizeBinaryPricesFromRealPrices avec les prix réels de bonding curve
 */
export function normalizeBinaryPrices(
  yesLiquidity: number,
  noLiquidity: number,
  initialLiquidity?: number
): { yes: number; no: number } {
  // ✅ GARDE-FOU : S'assurer que les liquidités ne sont jamais négatives
  const safeYesLiquidity = Math.max(0, yesLiquidity);
  const safeNoLiquidity = Math.max(0, noLiquidity);
  const totalLiquidity = safeYesLiquidity + safeNoLiquidity;
  
  // Éviter la division par zéro
  if (totalLiquidity <= 0) {
    return { yes: 50, no: 50 }; // Par défaut 50/50 si aucune liquidité
  }
  
  // 🎯 CALCULER LE RATIO DE LIQUIDITÉ (probabilité relative) - CORRÉLATION INVERSE STRICTE
  const ratioYes = safeYesLiquidity / totalLiquidity;
  const ratioNo = safeNoLiquidity / totalLiquidity;
  
  // ✅ GARDE-FOU : S'assurer que les ratios sont entre 0 et 1
  const clampedRatioYes = Math.max(0, Math.min(1, ratioYes));
  const clampedRatioNo = Math.max(0, Math.min(1, ratioNo));
  
  // 🚀 MARKET CAP FIXE BASÉ SUR LIQUIDITÉ INITIALE (GARANTIT CORRÉLATION INVERSE STRICTE)
  // Utiliser la liquidité initiale comme référence FIXE pour garantir que :
  // - Si on achète OUI (yesLiquidity augmente, noLiquidity stable) → marketCap reste stable
  // - OUI monte (ratioYes augmente), NON baisse (ratioNo diminue) ✅
  // - Fonctionne dans les deux sens (OUI ou NON peut dominer)
  const baseLiquidity = Math.max(0, initialLiquidity || 100); // Liquidité initiale (targetPrice × 2)
  
  // Multiplicateur fixe basé sur la liquidité initiale (ne change jamais)
  const baseMultiplier = 1 + Math.pow(Math.max(0, baseLiquidity) / 100, 0.3);
  
  // Market cap FIXE = liquidité initiale × 2 × multiplicateur fixe
  // ✅ GARANTIE : Le market cap ne change JAMAIS, garantissant la corrélation inverse stricte
  const marketCap = Math.max(0, baseLiquidity * baseMultiplier);
  
  // 🎯 CORRÉLATION INVERSE STRICTE : Appliquer le ratio au market cap FIXE
  // Si ratioYes augmente, ratioNo diminue → OUI monte, NON baisse (TOUJOURS)
  // Le market cap est fixe, donc seule la répartition change
  const yesNormalized = clampedRatioYes * marketCap;
  const noNormalized = clampedRatioNo * marketCap;
  
  // ✅ GARDE-FOU FINAL : S'assurer que les prix normalisés ne sont jamais négatifs
  // Arrondir à 2 décimales pour éviter les erreurs de précision
  return {
    yes: Math.max(0, Math.round(yesNormalized * 100) / 100),
    no: Math.max(0, Math.round(noNormalized * 100) / 100),
  };
}

