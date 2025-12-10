/**
 * Utilitaires pour générer les données structurées JSON-LD et optimiser le SEO
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://seed.media";

export interface ArticleData {
  title: string;
  description?: string;
  content?: string;
  slug: string;
  coverImage?: string | null;
  publishedAt?: number | null;
  updatedAt?: number | null;
  author?: {
    name?: string;
    email?: string;
    image?: string | null;
  } | null;
  tags?: string[];
  category?: string;
}

export interface ProjectData {
  title: string;
  description?: string;
  slug: string;
  coverImage?: string | null;
  createdAt?: number;
  updatedAt?: number;
  author?: {
    name?: string;
    email?: string;
    image?: string | null;
  } | null;
  stage?: string;
  openSource?: boolean;
}

export interface ActionData {
  title: string;
  description?: string;
  slug: string;
  coverImage?: string | null;
  createdAt?: number;
  updatedAt?: number;
  author?: {
    name?: string;
    email?: string;
    image?: string | null;
  } | null;
  type?: string;
  target?: string;
  status?: string;
}

/**
 * Génère les données structurées JSON-LD pour un article (Article Schema.org)
 */
export function generateArticleStructuredData(article: ArticleData) {
  const url = `${BASE_URL}/articles/${article.slug}`;
  const image = article.coverImage
    ? article.coverImage.startsWith("http")
      ? article.coverImage
      : `${BASE_URL}${article.coverImage}`
    : `${BASE_URL}/og-image.png`;

  const publishedTime = article.publishedAt
    ? new Date(article.publishedAt).toISOString()
    : undefined;
  const modifiedTime = article.updatedAt
    ? new Date(article.updatedAt).toISOString()
    : publishedTime;

  const structuredData: any = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description || article.title,
    image: {
      "@type": "ImageObject",
      url: image,
      width: 1200,
      height: 630,
    },
    datePublished: publishedTime,
    dateModified: modifiedTime,
    author: article.author
      ? {
          "@type": "Person",
          name: article.author.name || article.author.email?.split("@")[0] || "Auteur",
          ...(article.author.image && { image: article.author.image }),
        }
      : {
          "@type": "Organization",
          name: "Seed Community",
        },
    publisher: {
      "@type": "Organization",
      name: "Seed",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    ...(article.tags && article.tags.length > 0 && { keywords: article.tags.join(", ") }),
  };

  // Ajouter le contenu pour l'AEO (Answer Engine Optimization)
  // Les moteurs de recherche IA utilisent le contenu complet pour générer des réponses
  if (article.content) {
    // Extraire le texte brut du contenu (sans HTML) pour l'AEO
    const textContent = article.content
      .replace(/<[^>]*>/g, " ") // Supprimer les balises HTML
      .replace(/\s+/g, " ") // Normaliser les espaces
      .trim()
      .substring(0, 5000); // Limiter à 5000 caractères
    
    structuredData.articleBody = textContent;
    
    // Ajouter aussi le texte pour les extraits de réponse
    structuredData.text = textContent;
  }

  // Ajouter des mots-clés pour améliorer la découvrabilité
  if (article.tags && article.tags.length > 0) {
    structuredData.keywords = article.tags.join(", ");
  }

  return structuredData;
}

/**
 * Génère les données structurées JSON-LD pour un projet (SoftwareApplication Schema.org)
 */
export function generateProjectStructuredData(
  project: ProjectData,
  location?: { city?: string; region?: string; country?: string }
) {
  const url = `${BASE_URL}/projets/${project.slug}`;
  const image = project.coverImage
    ? project.coverImage.startsWith("http")
      ? project.coverImage
      : `${BASE_URL}${project.coverImage}`
    : `${BASE_URL}/og-image.png`;

  const structuredData: any = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: project.title,
    description: project.description || project.title,
    image: {
      "@type": "ImageObject",
      url: image,
      width: 1200,
      height: 630,
    },
    url: url,
    applicationCategory: "WebApplication",
    operatingSystem: "Web",
    ...(project.openSource && { license: "Open Source" }),
    author: project.author
      ? {
          "@type": "Person",
          name: project.author.name || project.author.email?.split("@")[0] || "Auteur",
        }
      : {
          "@type": "Organization",
          name: "Seed Community",
        },
    publisher: {
      "@type": "Organization",
      name: "Seed",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logo.png`,
      },
    },
    dateCreated: project.createdAt ? new Date(project.createdAt).toISOString() : undefined,
    dateModified: project.updatedAt ? new Date(project.updatedAt).toISOString() : undefined,
  };

  // Ajouter le stade du projet
  if (project.stage) {
    structuredData.softwareVersion = project.stage;
  }

  // Ajouter les données géographiques (GEO) si disponibles
  if (location && (location.city || location.region || location.country)) {
    structuredData.areaServed = {
      "@type": "Place",
      ...(location.city && { name: location.city }),
      ...(location.region && { addressRegion: location.region }),
      ...(location.country && { addressCountry: location.country }),
    };
  }

  return structuredData;
}

/**
 * Génère les données structurées JSON-LD pour une action (Event ou Action Schema.org)
 */
export function generateActionStructuredData(
  action: ActionData,
  location?: { city?: string; region?: string; country?: string },
  startDate?: string,
  endDate?: string
) {
  const url = `${BASE_URL}/actions/${action.slug}`;
  const image = action.coverImage
    ? action.coverImage.startsWith("http")
      ? action.coverImage
      : `${BASE_URL}${action.coverImage}`
    : `${BASE_URL}/og-image.png`;

  const structuredData: any = {
    "@context": "https://schema.org",
    "@type": action.type === "event" ? "Event" : "Action",
    name: action.title,
    description: action.description || action.title,
    image: {
      "@type": "ImageObject",
      url: image,
      width: 1200,
      height: 630,
    },
    url: url,
    ...(action.type === "event" && {
      eventStatus: action.status === "active" ? "https://schema.org/EventScheduled" : "https://schema.org/EventCancelled",
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    }),
    organizer: {
      "@type": "Organization",
      name: "Seed Community",
    },
    ...(action.author && {
      author: {
        "@type": "Person",
        name: action.author.name || action.author.email?.split("@")[0] || "Auteur",
      },
    }),
  };

  // Ajouter les données géographiques (GEO) si disponibles
  if (location && (location.city || location.region || location.country)) {
    structuredData.location = {
      "@type": "Place",
      ...(location.city && { name: location.city }),
      ...(location.region && { addressRegion: location.region }),
      ...(location.country && { addressCountry: location.country }),
    };
  }

  return structuredData;
}

/**
 * Génère les données structurées JSON-LD pour l'organisation (Organization Schema.org)
 */
export function generateOrganizationStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Seed",
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description:
      "Plateforme d'information et d'utilité publique où la communauté publie, organise, vérifie et fait évoluer les contenus sur les technologies résilientes et l'IA éthique.",
    sameAs: [
      // Ajouter les réseaux sociaux si disponibles
      // "https://twitter.com/seedmedia",
      // "https://github.com/seedmedia",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Support",
      email: "contact@seed.media",
    },
  };
}

/**
 * Génère les données structurées JSON-LD pour le site web (WebSite Schema.org)
 */
export function generateWebsiteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Seed",
    url: BASE_URL,
    description:
      "Plateforme d'information et d'utilité publique où la communauté publie, organise, vérifie et fait évoluer les contenus sur les technologies résilientes et l'IA éthique.",
    publisher: {
      "@type": "Organization",
      name: "Seed",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Génère les données structurées JSON-LD pour le breadcrumb (BreadcrumbList Schema.org)
 */
export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${BASE_URL}${item.url}`,
    })),
  };
}

/**
 * Génère les métadonnées SEO pour une page
 */
export function generateSEOMetadata({
  title,
  description,
  image,
  url,
  type = "website",
  publishedTime,
  modifiedTime,
  author,
  tags,
}: {
  title: string;
  description?: string;
  image?: string | null;
  url: string;
  type?: "article" | "website" | "profile";
  publishedTime?: number | null;
  modifiedTime?: number | null;
  author?: { name?: string; email?: string } | null;
  tags?: string[];
}) {
  const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;
  const ogImage = image
    ? image.startsWith("http")
      ? image
      : `${BASE_URL}${image}`
    : `${BASE_URL}/og-image.png`;

  return {
    title: `${title} | Seed`,
    description: description || title,
    openGraph: {
      title,
      description: description || title,
      url: fullUrl,
      siteName: "Seed",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: "fr_FR",
      type,
      ...(publishedTime && { publishedTime: new Date(publishedTime).toISOString() }),
      ...(modifiedTime && { modifiedTime: new Date(modifiedTime).toISOString() }),
      ...(author && { authors: [author.name || author.email || "Auteur"] }),
      ...(tags && tags.length > 0 && { tags }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: description || title,
      images: [ogImage],
    },
    alternates: {
      canonical: fullUrl,
    },
  };
}

