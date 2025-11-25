/**
 * Helpers pour récupérer et utiliser les valeurs des règles configurables
 * Ces fonctions peuvent être utilisées dans les mutations et queries
 */

import { DEFAULT_RULES, getDefaultRule } from "./configurableRules.defaults";

/**
 * Récupère la valeur actuelle d'une règle configurable
 * Retourne la valeur en base si elle existe, sinon la valeur par défaut
 * 
 * @param ctx - Contexte Convex
 * @param ruleKey - Clé de la règle
 * @returns La valeur actuelle de la règle
 */
export async function getRuleValue(ctx: any, ruleKey: string): Promise<any> {
  // Récupérer la règle en base
  const rule = await ctx.db
    .query("configurableRules")
    .withIndex("key", (q: any) => q.eq("key", ruleKey))
    .first();

  if (rule && rule.status === "active") {
    return rule.currentValue;
  }

  // Si pas en base, retourner la valeur par défaut
  const defaultRule = getDefaultRule(ruleKey);
  if (defaultRule) {
    return defaultRule.currentValue !== undefined 
      ? defaultRule.currentValue 
      : defaultRule.defaultValue;
  }

  // Si la règle n'existe pas du tout, retourner undefined
  return undefined;
}

/**
 * Récupère la valeur d'une règle de type number
 */
export async function getRuleValueAsNumber(ctx: any, ruleKey: string): Promise<number> {
  const value = await getRuleValue(ctx, ruleKey);
  if (value === undefined) {
    throw new Error(`Règle "${ruleKey}" non trouvée`);
  }
  return Number(value);
}

/**
 * Récupère la valeur d'une règle de type boolean
 */
export async function getRuleValueAsBoolean(ctx: any, ruleKey: string): Promise<boolean> {
  const value = await getRuleValue(ctx, ruleKey);
  if (value === undefined) {
    throw new Error(`Règle "${ruleKey}" non trouvée`);
  }
  return Boolean(value);
}

/**
 * Récupère la valeur d'une règle de type string
 */
export async function getRuleValueAsString(ctx: any, ruleKey: string): Promise<string> {
  const value = await getRuleValue(ctx, ruleKey);
  if (value === undefined) {
    throw new Error(`Règle "${ruleKey}" non trouvée`);
  }
  return String(value);
}

/**
 * Récupère les valeurs des règles éditoriales pour un type d'article donné
 */
export async function getEditorialRulesForArticleType(
  ctx: any,
  articleType: "scientific" | "expert" | "opinion" | "news" | "tutorial" | "other"
): Promise<{
  minSources: number;
  requireThesis: boolean;
  requireCounterArguments: boolean;
  requireConclusion: boolean;
  minLength: number;
  maxLength: number;
  maxTags: number;
}> {
  const ruleKeyMap: Record<string, string> = {
    scientific: "scientific_articles_min_sources",
    expert: "expert_articles_min_sources",
    opinion: "opinion_articles_min_sources",
    // Pour les types non définis, utiliser la règle pour les articles d'opinion comme défaut
    news: "opinion_articles_min_sources",
    tutorial: "expert_articles_min_sources",
    other: "opinion_articles_min_sources",
  };

  const minSourcesKey = ruleKeyMap[articleType] || ruleKeyMap.opinion;

  return {
    minSources: await getRuleValueAsNumber(ctx, minSourcesKey),
    requireThesis: await getRuleValueAsBoolean(ctx, "require_thesis_for_publication"),
    requireCounterArguments: await getRuleValueAsBoolean(ctx, "require_counter_arguments"),
    requireConclusion: await getRuleValueAsBoolean(ctx, "require_conclusion"),
    minLength: await getRuleValueAsNumber(ctx, "min_article_length"),
    maxLength: await getRuleValueAsNumber(ctx, "max_article_length"),
    maxTags: await getRuleValueAsNumber(ctx, "max_tags_per_article"),
  };
}

/**
 * Récupère les règles de qualité d'article
 */
export async function getArticleQualityRules(ctx: any): Promise<{
  scientificBonus: number;
  expertBonus: number;
  tutorialBonus: number;
  newsBonus: number;
  opinionBonus: number;
  otherBonus: number;
  verificationRatioWeight: number;
  expertReviewPoints: number;
  expertReviewMax: number;
  communityWeight: number;
  highQualityThreshold: number;
}> {
  return {
    scientificBonus: await getRuleValueAsNumber(ctx, "quality_score_scientific_bonus"),
    expertBonus: await getRuleValueAsNumber(ctx, "quality_score_expert_bonus"),
    tutorialBonus: await getRuleValueAsNumber(ctx, "quality_score_tutorial_bonus"),
    newsBonus: await getRuleValueAsNumber(ctx, "quality_score_news_bonus"),
    opinionBonus: await getRuleValueAsNumber(ctx, "quality_score_opinion_bonus"),
    otherBonus: 1, // Toujours 1 pour "other"
    verificationRatioWeight: await getRuleValueAsNumber(ctx, "quality_score_verification_ratio_weight"),
    expertReviewPoints: await getRuleValueAsNumber(ctx, "quality_score_expert_review_points"),
    expertReviewMax: await getRuleValueAsNumber(ctx, "quality_score_expert_review_max"),
    communityWeight: await getRuleValueAsNumber(ctx, "quality_score_community_weight"),
    highQualityThreshold: await getRuleValueAsNumber(ctx, "high_quality_article_threshold"),
  };
}

/**
 * Récupère les règles de crédibilité
 */
export async function getCredibilityRules(ctx: any): Promise<{
  publicationWeight: number;
  sourcesWeight: number;
  votesWeight: number;
  correctionsWeight: number;
  expertiseWeight: number;
  behaviorWeight: number;
  articlesPerPoints: number;
  sourcesPerPoints: number;
  correctionsPerPoints: number;
  expertVerificationPoints: number;
  regularVerificationPoints: number;
  expertiseDomainBonus: number;
  highQualityThreshold: number;
}> {
  return {
    publicationWeight: await getRuleValueAsNumber(ctx, "credibility_publication_weight"),
    sourcesWeight: await getRuleValueAsNumber(ctx, "credibility_sources_weight"),
    votesWeight: await getRuleValueAsNumber(ctx, "credibility_votes_weight"),
    correctionsWeight: await getRuleValueAsNumber(ctx, "credibility_corrections_weight"),
    expertiseWeight: await getRuleValueAsNumber(ctx, "credibility_expertise_weight"),
    behaviorWeight: await getRuleValueAsNumber(ctx, "credibility_behavior_weight"),
    articlesPerPoints: await getRuleValueAsNumber(ctx, "credibility_articles_per_points"),
    sourcesPerPoints: await getRuleValueAsNumber(ctx, "credibility_sources_per_points"),
    correctionsPerPoints: await getRuleValueAsNumber(ctx, "credibility_corrections_per_points"),
    expertVerificationPoints: await getRuleValueAsNumber(ctx, "credibility_expert_verification_points"),
    regularVerificationPoints: await getRuleValueAsNumber(ctx, "credibility_regular_verification_points"),
    expertiseDomainBonus: await getRuleValueAsNumber(ctx, "credibility_expertise_domain_bonus"),
    highQualityThreshold: await getRuleValueAsNumber(ctx, "high_quality_source_threshold"),
  };
}

/**
 * Récupère les paramètres de vote par défaut pour la gouvernance
 */
export async function getGovernanceVoteParameters(ctx: any): Promise<{
  defaultQuorum: number;
  defaultMajority: number;
  defaultDurationDays: number;
  editorialRulesQuorum: number;
  editorialRulesMajority: number;
  ethicalCharterQuorum: number;
  ethicalCharterMajority: number;
  ethicalCharterExtraDays: number;
  expertNominationQuorum: number;
  categoryAdditionQuorum: number;
  productEvolutionQuorum: number;
  productEvolutionMajority: number;
}> {
  return {
    defaultQuorum: await getRuleValueAsNumber(ctx, "governance_default_quorum"),
    defaultMajority: await getRuleValueAsNumber(ctx, "governance_default_majority"),
    defaultDurationDays: await getRuleValueAsNumber(ctx, "governance_default_duration_days"),
    editorialRulesQuorum: await getRuleValueAsNumber(ctx, "governance_editorial_rules_quorum"),
    editorialRulesMajority: await getRuleValueAsNumber(ctx, "governance_editorial_rules_majority"),
    ethicalCharterQuorum: await getRuleValueAsNumber(ctx, "governance_ethical_charter_quorum"),
    ethicalCharterMajority: await getRuleValueAsNumber(ctx, "governance_ethical_charter_majority"),
    ethicalCharterExtraDays: await getRuleValueAsNumber(ctx, "governance_ethical_charter_extra_days"),
    expertNominationQuorum: await getRuleValueAsNumber(ctx, "governance_expert_nomination_quorum"),
    categoryAdditionQuorum: await getRuleValueAsNumber(ctx, "governance_category_addition_quorum"),
    productEvolutionQuorum: await getRuleValueAsNumber(ctx, "governance_product_evolution_quorum"),
    productEvolutionMajority: await getRuleValueAsNumber(ctx, "governance_product_evolution_majority"),
  };
}

