/**
 * Schémas d'actions pour les propositions de gouvernance
 * Ces schémas définissent dynamiquement les champs à afficher dans le formulaire
 * sans nécessiter de nouvelles tables en base de données
 */

export type ActionFieldType = "select" | "multiselect" | "input" | "number" | "textarea" | "combobox" | "iconpicker";

export interface ActionFieldOption {
  label: string;
  value: string | number | boolean;
  description?: string;
}

export interface ActionField {
  key: string; // Clé technique dans actionData
  label: string; // Label clair pour l'utilisateur
  description?: string; // Description détaillée
  type: ActionFieldType;
  required?: boolean;
  placeholder?: string;
  // Pour type = "select" ou "combobox"
  options?: ActionFieldOption[];
  // Pour type = "number"
  min?: number;
  max?: number;
  step?: number;
  unit?: string; // Unité affichée (ex: "sources", "jours", "%")
  // Pour type = "combobox" - fonction pour charger les options dynamiquement
  loadOptions?: () => Promise<ActionFieldOption[]>;
}

export interface ActionSchema {
  title: string; // Titre de la section d'action
  description?: string; // Description de la section
  fields: ActionField[];
}

/**
 * Schémas d'actions par type de proposition
 * NOTE: Les schémas pour editorial_rules et product_evolution sont maintenant chargés dynamiquement
 * depuis configurableRules. Ce fichier contient uniquement les schémas statiques.
 */
export const ACTION_SCHEMAS: Record<string, ActionSchema> = {
  // editorial_rules et product_evolution sont maintenant dynamiques - voir getActionSchema

  category_addition: {
    title: "Créer ou activer une catégorie",
    description: "Vous pouvez soit sélectionner une catégorie par défaut à activer, soit créer une nouvelle catégorie",
    fields: [
      {
        key: "actionType",
        label: "Type d'action",
        description: "Choisissez si vous voulez activer une catégorie par défaut ou créer une nouvelle catégorie",
        type: "select",
        required: true,
        options: [
          { value: "activate_default", label: "Activer une catégorie par défaut" },
          { value: "create_new", label: "Créer une nouvelle catégorie" },
        ],
      },
      {
        key: "categorySlug",
        label: "Catégorie par défaut à activer",
        description: "Sélectionnez une catégorie par défaut qui n'est pas encore active",
        type: "combobox",
        required: false, // Requis seulement si actionType === "activate_default"
        // Les options seront chargées dynamiquement depuis les catégories par défaut non actives
      },
      {
        key: "name",
        label: "Nom de la catégorie",
        description: "Nom de la nouvelle catégorie à créer",
        type: "input",
        required: false, // Requis seulement si actionType === "create_new"
        placeholder: "Ex: Biodiversité",
      },
      {
        key: "slug",
        label: "Slug de la catégorie",
        description: "Identifiant unique de la catégorie (sera généré automatiquement si vide)",
        type: "input",
        required: false,
        placeholder: "Ex: biodiversite",
      },
      {
        key: "description",
        label: "Description",
        description: "Description de la catégorie",
        type: "textarea",
        required: false,
        placeholder: "Décrivez cette catégorie...",
      },
      {
        key: "icon",
        label: "Icône",
        description: "Icône représentative de la catégorie (bibliothèque Solar)",
        type: "iconpicker",
        required: false,
        placeholder: "Rechercher une icône...",
      },
      {
        key: "appliesTo",
        label: "Applicable à",
        description: "Types de contenu auxquels cette catégorie s'applique (sélection multiple)",
        type: "multiselect",
        required: true,
        options: [
          { value: "articles", label: "Articles" },
          { value: "dossiers", label: "Dossiers" },
          { value: "debates", label: "Débats" },
          { value: "projects", label: "Projets" },
          { value: "organizations", label: "Organisations" },
        ],
      },
    ],
  },

  expert_nomination: {
    title: "Nommer un expert",
    description: "Sélectionnez un utilisateur et son domaine d'expertise",
    fields: [
      {
        key: "userId",
        label: "Utilisateur",
        description: "Choisissez l'utilisateur à nommer comme expert",
        type: "combobox",
        required: true,
        // Les options seront chargées dynamiquement depuis la liste des utilisateurs
      },
      {
        key: "expertiseDomain",
        label: "Domaine d'expertise",
        description: "Domaine dans lequel cet utilisateur sera reconnu comme expert",
        type: "select",
        required: true,
        placeholder: "Ex: Climat, Santé, Économie...",
        options: [
          { value: "climat", label: "Climat" },
          { value: "sante", label: "Santé" },
          { value: "economie", label: "Économie" },
          { value: "technologie", label: "Technologie" },
          { value: "education", label: "Éducation" },
          { value: "environnement", label: "Environnement" },
          { value: "politique", label: "Politique" },
          { value: "societe", label: "Société" },
          { value: "science", label: "Science" },
          { value: "culture", label: "Culture" },
          { value: "sport", label: "Sport" },
          { value: "autre", label: "Autre" },
        ],
      },
    ],
  },

  product_evolution: {
    title: "Modifier un paramètre produit",
    description: "Sélectionnez le paramètre à modifier et définissez sa nouvelle valeur",
    fields: [
      {
        key: "settingKey",
        label: "Paramètre produit",
        description: "Choisissez le paramètre que vous souhaitez modifier",
        type: "select",
        required: true,
        options: [
          {
            value: "max_article_length",
            label: "Longueur maximum d'un article",
            description: "Nombre maximum de caractères autorisés dans un article",
          },
          {
            value: "max_tags_per_article",
            label: "Nombre maximum de tags par article",
            description: "Nombre maximum de tags qu'un utilisateur peut ajouter à un article",
          },
          {
            value: "min_votes_for_featured",
            label: "Nombre minimum de votes pour mise en vedette",
            description: "Nombre minimum de votes positifs requis pour qu'un article soit mis en vedette automatiquement",
          },
          {
            value: "notification_delay_hours",
            label: "Délai de notification (heures)",
            description: "Délai en heures avant d'envoyer une notification pour un événement",
          },
        ],
      },
      {
        key: "settingValue",
        label: "Nouvelle valeur",
        description: "Définissez la nouvelle valeur pour ce paramètre",
        type: "number",
        required: true,
        min: 0,
        step: 1,
      },
    ],
  },

  ethical_charter: {
    title: "Modifier la charte éthique",
    description: "Définissez les modifications à apporter à la charte éthique",
    fields: [
      {
        key: "charterSection",
        label: "Section de la charte",
        description: "Choisissez la section de la charte à modifier",
        type: "select",
        required: true,
        options: [
          { value: "principles", label: "Principes fondamentaux" },
          { value: "content_guidelines", label: "Lignes directrices de contenu" },
          { value: "moderation_rules", label: "Règles de modération" },
          { value: "transparency", label: "Transparence et divulgation" },
          { value: "conflicts_of_interest", label: "Conflits d'intérêts" },
        ],
      },
      {
        key: "charterContent",
        label: "Nouveau contenu",
        description: "Définissez le nouveau contenu pour cette section",
        type: "textarea",
        required: true,
        placeholder: "Saisissez le nouveau contenu de la charte...",
      },
    ],
  },

  other: {
    title: "Action personnalisée",
    description: "Définissez une action personnalisée",
    fields: [
      {
        key: "actionDescription",
        label: "Description de l'action",
        description: "Décrivez en détail l'action à exécuter si cette proposition est approuvée",
        type: "textarea",
        required: true,
        placeholder: "Décrivez l'action concrète à exécuter...",
      },
    ],
  },
};

/**
 * Récupère le schéma d'action pour un type de proposition donné
 * Pour editorial_rules et product_evolution, le schéma est généré dynamiquement
 * à partir des règles configurables disponibles
 */
export function getActionSchema(
  proposalType: string,
  availableRules?: Array<{
    _id: string;
    key: string;
    label: string;
    description?: string;
    valueType: "number" | "boolean" | "string" | "select";
    currentValue: any;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    options?: Array<{ label: string; value: any }>;
  }>
): ActionSchema | undefined {
  // Pour editorial_rules et product_evolution, générer le schéma dynamiquement
  if (proposalType === "editorial_rules" || proposalType === "product_evolution") {
    if (!availableRules || availableRules.length === 0) {
      return undefined;
    }

    const fieldKey = proposalType === "editorial_rules" ? "ruleKey" : "settingKey";
    const valueKey = proposalType === "editorial_rules" ? "ruleValue" : "settingValue";
    const title =
      proposalType === "editorial_rules"
        ? "Modifier une règle éditoriale"
        : "Modifier un paramètre produit";
    const description =
      proposalType === "editorial_rules"
        ? "Sélectionnez la règle à modifier et définissez sa nouvelle valeur"
        : "Sélectionnez le paramètre à modifier et définissez sa nouvelle valeur";

    // Le type de champ de valeur sera déterminé dynamiquement selon la règle sélectionnée
    // On crée un champ générique qui s'adaptera selon la règle choisie

    return {
      title,
      description,
      fields: [
        {
          key: fieldKey,
          label: proposalType === "editorial_rules" ? "Règle éditoriale" : "Paramètre produit",
          description: "Choisissez la règle que vous souhaitez modifier",
          type: "select",
          required: true,
          options: availableRules.map((rule) => ({
            value: rule.key,
            label: rule.label,
            description: rule.description,
          })),
        },
        {
          key: valueKey,
          label: "Nouvelle valeur",
          description: "Définissez la nouvelle valeur pour cette règle",
          type: "input" as ActionFieldType, // Type par défaut, sera adapté dynamiquement dans ActionFields
          required: true,
        },
      ],
    };
  }

  // Pour les autres types, utiliser les schémas statiques
  return ACTION_SCHEMAS[proposalType];
}

/**
 * Valide les données d'action selon le schéma
 */
export function validateActionData(
  proposalType: string,
  actionData: Record<string, any>,
  availableRules?: Array<{
    _id: string;
    key: string;
    label: string;
    description?: string;
    valueType: "number" | "boolean" | "string" | "select";
    currentValue: any;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    options?: Array<{ label: string; value: any }>;
  }>
): { valid: boolean; errors: Record<string, string> } {
  const schema = getActionSchema(proposalType, availableRules);
  if (!schema) {
    return { valid: true, errors: {} }; // Pas de validation si pas de schéma
  }

  const errors: Record<string, string> = {};

  for (const field of schema.fields) {
    if (field.required && (actionData[field.key] === undefined || actionData[field.key] === null || actionData[field.key] === "")) {
      errors[field.key] = `${field.label} est requis`;
    }

    if (field.type === "number" && actionData[field.key] !== undefined) {
      const value = Number(actionData[field.key]);
      if (isNaN(value)) {
        errors[field.key] = `${field.label} doit être un nombre`;
      } else {
        if (field.min !== undefined && value < field.min) {
          errors[field.key] = `${field.label} doit être supérieur ou égal à ${field.min}`;
        }
        if (field.max !== undefined && value > field.max) {
          errors[field.key] = `${field.label} doit être inférieur ou égal à ${field.max}`;
        }
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

