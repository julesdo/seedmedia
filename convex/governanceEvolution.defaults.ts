/**
 * Valeurs par défaut pour les évolutions de gouvernance
 * Ces valeurs sont toujours disponibles même si elles ne sont pas encore en base de données
 * Les votes de gouvernance peuvent modifier ces valeurs
 */

export interface DefaultVoteParameters {
  defaultQuorum: number;
  defaultMajority: number; // En pourcentage (ex: 50 pour 50%)
  defaultDurationDays: number;
  minQuorum: number;
  maxQuorum: number;
  minMajority: number; // En pourcentage
  maxMajority: number; // En pourcentage
  minDurationDays: number;
  maxDurationDays: number;
  // Paramètres spécifiques par type de proposition
  editorialRulesQuorum: number;
  editorialRulesMajority: number;
  ethicalCharterQuorum: number;
  ethicalCharterMajority: number;
  ethicalCharterExtraDays: number;
  expertNominationQuorum: number;
  categoryAdditionQuorum: number;
  productEvolutionQuorum: number;
  productEvolutionMajority: number;
}

export interface DefaultCredibilityRules {
  publicationWeight: number;
  sourcesWeight: number;
  votesWeight: number;
  correctionsWeight: number;
  expertiseWeight: number;
  behaviorWeight: number;
  // Seuils
  highQualityArticleThreshold: number;
  highQualitySourceThreshold: number;
}

export interface DefaultRolePermissions {
  explorateur: {
    canVote: boolean;
    canComment: boolean;
    canProposeSources: boolean;
    voteWeight: number;
  };
  contributeur: {
    canWriteArticles: boolean;
    canVoteGovernance: boolean;
    canFactCheck: boolean;
    voteWeight: number;
  };
  editeur: {
    canValidateArticles: boolean;
    canArbitrateDebates: boolean;
    voteWeight: number;
  };
}

/**
 * Paramètres de vote par défaut
 */
export const DEFAULT_VOTE_PARAMETERS: DefaultVoteParameters = {
  defaultQuorum: 10,
  defaultMajority: 50,
  defaultDurationDays: 7,
  minQuorum: 1,
  maxQuorum: 1000,
  minMajority: 1,
  maxMajority: 100,
  minDurationDays: 1,
  maxDurationDays: 90,
  // Paramètres spécifiques par type de proposition
  editorialRulesQuorum: 20,
  editorialRulesMajority: 60,
  ethicalCharterQuorum: 50,
  ethicalCharterMajority: 75,
  ethicalCharterExtraDays: 7,
  expertNominationQuorum: 15,
  categoryAdditionQuorum: 15,
  productEvolutionQuorum: 20,
  productEvolutionMajority: 60,
};

/**
 * Règles de crédibilité par défaut
 */
export const DEFAULT_CREDIBILITY_RULES: DefaultCredibilityRules = {
  publicationWeight: 30,
  sourcesWeight: 20,
  votesWeight: 20,
  correctionsWeight: 15,
  expertiseWeight: 10,
  behaviorWeight: 5,
  // Seuils
  highQualityArticleThreshold: 80,
  highQualitySourceThreshold: 70,
};

/**
 * Permissions de rôle par défaut
 */
export const DEFAULT_ROLE_PERMISSIONS: DefaultRolePermissions = {
  explorateur: {
    canVote: true,
    canComment: true,
    canProposeSources: true,
    voteWeight: 1,
  },
  contributeur: {
    canWriteArticles: true,
    canVoteGovernance: true,
    canFactCheck: true,
    voteWeight: 1,
  },
  editeur: {
    canValidateArticles: true,
    canArbitrateDebates: true,
    voteWeight: 4,
  },
};

