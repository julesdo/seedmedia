/**
 * Catégories par défaut de la plateforme Seed
 * Ces catégories sont toujours disponibles même si elles ne sont pas encore en base de données
 * Les votes de gouvernance peuvent créer de nouvelles catégories ou modifier/archiver les existantes
 */

export interface DefaultCategory {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  appliesTo: Array<"articles" | "dossiers" | "debates" | "projects" | "organizations" | "actions" | "decisions">;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  // Catégories principales
  {
    name: "Climat",
    slug: "climat",
    description: "Articles, débats et dossiers sur le changement climatique et l'environnement",
    icon: "temperature-bold",
    color: "#10b981", // green-500
    appliesTo: ["articles", "dossiers", "debates", "projects", "organizations", "actions"],
  },
  {
    name: "Santé",
    slug: "sante",
    description: "Santé publique, médecine, bien-être et prévention",
    icon: "heart-pulse-bold",
    color: "#ef4444", // red-500
    appliesTo: ["articles", "dossiers", "debates", "projects", "organizations", "actions"],
  },
  {
    name: "Économie",
    slug: "economie",
    description: "Économie, finance, marché du travail et développement économique",
    icon: "chart-2-bold",
    color: "#f59e0b", // amber-500
    appliesTo: ["articles", "dossiers", "debates", "projects", "organizations", "actions"],
  },
  {
    name: "Technologie",
    slug: "technologie",
    description: "Innovation technologique, numérique, IA et transformation digitale",
    icon: "cpu-bold",
    color: "#3b82f6", // blue-500
    appliesTo: ["articles", "dossiers", "debates", "projects", "organizations", "actions"],
  },
  {
    name: "Éducation",
    slug: "education",
    description: "Éducation, formation, pédagogie et apprentissage",
    icon: "book-bold",
    color: "#8b5cf6", // violet-500
    appliesTo: ["articles", "dossiers", "debates", "projects", "organizations", "actions"],
  },
  {
    name: "Environnement",
    slug: "environnement",
    description: "Protection de l'environnement, biodiversité et développement durable",
    icon: "leaf-bold",
    color: "#22c55e", // green-500
    appliesTo: ["articles", "dossiers", "debates", "projects", "organizations", "actions"],
  },
  {
    name: "Politique",
    slug: "politique",
    description: "Politique, gouvernance, démocratie et institutions",
    icon: "hand-stars-bold",
    color: "#6366f1", // indigo-500
    appliesTo: ["articles", "dossiers", "debates", "organizations", "actions"],
  },
  {
    name: "Société",
    slug: "societe",
    description: "Questions de société, inégalités, justice sociale et solidarité",
    icon: "users-group-two-rounded-bold",
    color: "#ec4899", // pink-500
    appliesTo: ["articles", "dossiers", "debates", "projects", "organizations", "actions"],
  },
  {
    name: "Science",
    slug: "science",
    description: "Recherche scientifique, découvertes et innovation",
    icon: "atom-bold",
    color: "#06b6d4", // cyan-500
    appliesTo: ["articles", "dossiers", "debates", "projects", "organizations", "actions"],
  },
  {
    name: "Culture",
    slug: "culture",
    description: "Culture, arts, patrimoine et créativité",
    icon: "palette-bold",
    color: "#f97316", // orange-500
    appliesTo: ["articles", "dossiers", "debates", "projects", "organizations", "actions"],
  },
  {
    name: "Sport",
    slug: "sport",
    description: "Sport, activité physique et bien-être",
    icon: "basketball-bold",
    color: "#eab308", // yellow-500
    appliesTo: ["articles", "dossiers", "debates", "projects", "organizations", "actions"],
  },
  {
    name: "Alimentation",
    slug: "alimentation",
    description: "Alimentation, agriculture, nutrition et sécurité alimentaire",
    icon: "cup-bold",
    color: "#84cc16", // lime-500
    appliesTo: ["articles", "dossiers", "debates", "projects", "organizations", "actions"],
  },
  {
    name: "Énergie",
    slug: "energie",
    description: "Énergie, transition énergétique et ressources",
    icon: "lightning-bold",
    color: "#fbbf24", // amber-400
    appliesTo: ["articles", "dossiers", "debates", "projects", "organizations", "actions"],
  },
  {
    name: "Mobilité",
    slug: "mobilite",
    description: "Transport, mobilité durable et accessibilité",
    icon: "bus-bold",
    color: "#14b8a6", // teal-500
    appliesTo: ["articles", "dossiers", "debates", "projects", "organizations", "actions"],
  },
  {
    name: "Urbanisme",
    slug: "urbanisme",
    description: "Urbanisme, aménagement du territoire et ville durable",
    icon: "city-bold",
    color: "#64748b", // slate-500
    appliesTo: ["articles", "dossiers", "debates", "projects", "organizations", "actions"],
  },
];

/**
 * Récupère une catégorie par défaut par son slug
 */
export function getDefaultCategory(slug: string): DefaultCategory | undefined {
  return DEFAULT_CATEGORIES.find((cat) => cat.slug === slug);
}

/**
 * Récupère toutes les catégories par défaut applicables à un type de contenu
 */
export function getDefaultCategoriesFor(
  appliesTo: "articles" | "dossiers" | "debates" | "projects" | "organizations" | "actions" | "decisions"
): DefaultCategory[] {
  return DEFAULT_CATEGORIES.filter((cat) => cat.appliesTo.includes(appliesTo));
}

