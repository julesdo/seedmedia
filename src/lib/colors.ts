/**
 * 🎨 Système de couleurs pour OUI/NON
 * OUI : Bleu primary avec dégradé
 * NON : Argenté métallique avec reflets
 */

// Couleurs OUI (Bleu primary dégradé)
export const YES_COLORS = {
  // Couleurs principales
  primary: "hsl(var(--primary))", // #246BFD
  primaryLight: "hsl(var(--primary) / 0.8)",
  primaryDark: "hsl(var(--primary) / 1.2)",
  
  // Pour les graphiques ECharts
  chart: {
    light: "#246BFD",
    dark: "#4A8AFF",
    gradient: {
      start: "rgba(36, 107, 253, 0.4)",
      end: "rgba(36, 107, 253, 0.05)",
    },
  },
  
  // Pour les backgrounds
  bg: {
    light: "bg-primary/10",
    medium: "bg-primary/15",
    dark: "bg-primary/20",
  },
  
  // Pour les textes
  text: {
    light: "text-primary",
    medium: "text-primary/80",
    dark: "text-primary/60",
  },
  
  // Pour les bordures
  border: {
    light: "border-primary/20",
    medium: "border-primary/30",
    dark: "border-primary/40",
  },
  
  // Dégradés Tailwind
  gradient: {
    from: "from-primary",
    via: "via-primary/80",
    to: "to-primary/60",
  },
};

// Couleurs NON (Argenté métallique foncé et moderne)
export const NO_COLORS = {
  // Couleurs principales (argenté métallique foncé et moderne)
  primary: "#71717A", // Zinc-500 - Base moderne
  primaryLight: "#A1A1AA", // Zinc-400 - Clair
  primaryDark: "#52525B", // Zinc-600 - Foncé
  
  // Pour les graphiques ECharts avec effet métallique
  chart: {
    light: "#71717A", // Zinc-500
    dark: "#52525B", // Zinc-600
    // Dégradé métallique foncé avec reflets subtils
    gradient: {
      start: "rgba(113, 113, 122, 0.5)", // Zinc-500 avec opacité
      middle: "rgba(82, 82, 91, 0.4)", // Zinc-600 avec opacité
      end: "rgba(63, 63, 70, 0.1)", // Zinc-700 avec opacité
    },
    // Effet métallique moderne avec reflets
    metallic: {
      base: "linear-gradient(135deg, #A1A1AA 0%, #71717A 50%, #52525B 100%)",
      shimmer: "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 50%, transparent 100%)",
    },
  },
  
  // Pour les backgrounds avec effet métallique foncé et moderne
  bg: {
    light: "bg-gradient-to-br from-zinc-500/10 via-zinc-600/8 to-zinc-700/5",
    medium: "bg-gradient-to-br from-zinc-500/15 via-zinc-600/12 to-zinc-700/8",
    dark: "bg-gradient-to-br from-zinc-500/20 via-zinc-600/18 to-zinc-700/12",
  },
  
  // Pour les textes (plus foncé et moderne)
  text: {
    light: "text-zinc-400 dark:text-zinc-300",
    medium: "text-zinc-500 dark:text-zinc-400",
    dark: "text-zinc-600 dark:text-zinc-500",
  },
  
  // Pour les bordures avec effet métallique foncé
  border: {
    light: "border-zinc-400/25 dark:border-zinc-500/25",
    medium: "border-zinc-400/35 dark:border-zinc-500/35",
    dark: "border-zinc-400/45 dark:border-zinc-500/45",
  },
  
  // Dégradés Tailwind métalliques foncés et modernes
  gradient: {
    from: "from-zinc-500",
    via: "via-zinc-600",
    to: "to-zinc-700",
  },
};

// Helper pour obtenir les couleurs selon la position
export function getPositionColors(position: "yes" | "no") {
  return position === "yes" ? YES_COLORS : NO_COLORS;
}

// Helper pour obtenir les classes Tailwind selon la position
export function getPositionClasses(position: "yes" | "no", type: "bg" | "text" | "border" = "bg") {
  const colors = getPositionColors(position);
  return colors[type].light || colors[type].medium || "";
}

