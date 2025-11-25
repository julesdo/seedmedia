/**
 * Missions par défaut de la plateforme
 * Ces missions sont initialisées automatiquement pour chaque nouvel utilisateur
 */

export interface DefaultMission {
  type: string;
  category: "habit" | "discovery" | "contribution" | "engagement";
  title: string;
  description: string;
  target: number;
}

/**
 * Toutes les missions par défaut de la plateforme
 */
export const DEFAULT_MISSIONS: DefaultMission[] = [
  {
    type: "login_3_days",
    category: "habit",
    title: "Se connecter 3 jours différents dans la même semaine",
    description: "Connecte-toi 3 jours différents cette semaine pour débloquer cette mission",
    target: 3,
  },
  {
    type: "login_7_days",
    category: "habit",
    title: "Se connecter 7 jours d'affilée",
    description: "Connecte-toi 7 jours consécutifs",
    target: 7,
  },
  {
    type: "view_10_projects",
    category: "discovery",
    title: "Consulter 10 projets",
    description: "Découvre 10 projets sur la plateforme",
    target: 10,
  },
  {
    type: "open_5_orgs",
    category: "discovery",
    title: "Ouvrir 5 profils d'organisations différentes",
    description: "Explore 5 organisations différentes",
    target: 5,
  },
  {
    type: "save_5_favorites",
    category: "discovery",
    title: "Enregistrer 5 contenus dans tes favoris",
    description: "Sauvegarde 5 articles ou projets",
    target: 5,
  },
  {
    type: "follow_5_tags",
    category: "discovery",
    title: "Suivre 5 sujets (tags) différents",
    description: "Suis 5 tags différents pour personnaliser ton feed",
    target: 5,
  },
  {
    type: "complete_profile",
    category: "discovery",
    title: "Compléter 100% de ton profil",
    description: "Complete ta bio, localisation, tags et liens",
    target: 100,
  },
];

/**
 * Récupère une mission par défaut par son type
 */
export function getDefaultMission(type: string): DefaultMission | undefined {
  return DEFAULT_MISSIONS.find((m) => m.type === type);
}

/**
 * Récupère toutes les missions par défaut d'une catégorie
 */
export function getDefaultMissionsByCategory(
  category: "habit" | "discovery" | "contribution" | "engagement"
): DefaultMission[] {
  return DEFAULT_MISSIONS.filter((m) => m.category === category);
}

