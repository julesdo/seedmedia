"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Link } from "next-view-transitions";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Hero section avec bento grid de catégories et événements spéciaux style Polymarket
 * Design premium avec cards de différentes tailles pour hiérarchie visuelle
 */
export function MarketHero() {
  // Récupérer les événements spéciaux featured et actifs
  const specialEvents = useQuery(api.specialEvents.getSpecialEvents, {
    featured: true,
    activeOnly: true,
  });

  // Récupérer les catégories featured
  const featuredCategories = useQuery(api.categories.getFeaturedCategoriesForDecisions, {
    limit: 6, // Plus de catégories pour le bento grid
  });

  // Ne bloquer que si les données essentielles ne sont pas chargées
  const isLoading = featuredCategories === undefined && specialEvents === undefined;

  if (isLoading) {
    return (
      <div className="w-full max-w-full px-4 md:px-6 lg:px-8 py-8 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "rounded-xl bg-muted/50 animate-pulse",
                i === 0 && "md:col-span-2 md:row-span-2 h-64",
                i === 1 && "md:col-span-2 h-48",
                i === 2 && "h-48",
                i === 3 && "h-48",
                i === 4 && "md:col-span-2 h-48",
                i === 5 && "h-48"
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  // Fonction pour obtenir le statut d'un événement
  const getEventStatus = (event: any) => {
    const now = Date.now();
    if (event.startDate && event.startDate > now) {
      return { label: "À venir", variant: "secondary" as const };
    }
    if (event.endDate && event.endDate < now) {
      return { label: "Terminé", variant: "outline" as const };
    }
    return { label: "En cours", variant: "default" as const };
  };

  // Combiner événements et catégories pour les cards
  const cards: Array<{
    id: string;
    type: "event" | "category";
    title: string;
    description: string;
    shortDescription?: string;
    coverImage?: string;
    coverImageAlt?: string;
    color?: string;
    icon?: string;
    href: string;
    status?: { label: string; variant: "default" | "secondary" | "outline" };
    dates?: string;
    size: "large" | "medium" | "small"; // Taille de la card dans le bento grid
  }> = [];

  // Fonction pour obtenir la couleur d'un événement selon son eventCategory
  const getEventColor = (event: any): string | undefined => {
    if (event.eventCategory === "blockbuster") {
      return "#FF6B6B"; // Rouge vif pour événements majeurs
    } else if (event.eventCategory === "tendance") {
      return "#4ECDC4"; // Turquoise pour tendances
    } else if (event.eventCategory === "insolite") {
      return "#FFE66D"; // Jaune pour insolite
    }
    return "#246BFD"; // Bleu par défaut
  };

  // GARANTIR LA DISPOSITION POLYMARKET : 1 grande card (2x2) + autres en small (1x1)
  // Priorité : Premier événement spécial = large, puis catégories/autres événements = small
  
  // 1. Premier événement spécial = LARGE (2x2) - TOUJOURS en premier
  if (specialEvents && specialEvents.length > 0) {
    const firstEvent = specialEvents[0];
    const status = getEventStatus(firstEvent);
    const eventColor = getEventColor(firstEvent);
    let dates = "";
    if (firstEvent.startDate) {
      dates = new Date(firstEvent.startDate).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      });
      if (firstEvent.endDate) {
        dates += ` - ${new Date(firstEvent.endDate).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        })}`;
      }
    }
    cards.push({
      id: firstEvent._id,
      type: "event",
      title: firstEvent.name,
      description: firstEvent.description || firstEvent.shortDescription || "",
      shortDescription: firstEvent.shortDescription,
      coverImage: firstEvent.coverImage,
      coverImageAlt: firstEvent.coverImageAlt,
      color: eventColor,
      href: `/?specialEvent=${firstEvent.slug}`,
      status,
      dates,
      size: "large", // TOUJOURS large (2x2) - première position
    });
  } else if (featuredCategories && featuredCategories.length > 0) {
    // Si pas d'événement, la première catégorie devient large
    const firstCategory = featuredCategories[0];
    if (firstCategory._id && firstCategory._id !== "") {
      cards.push({
        id: firstCategory._id,
        type: "category",
        title: firstCategory.name,
        description: firstCategory.description || firstCategory.shortDescription || "",
        shortDescription: firstCategory.shortDescription,
        coverImage: firstCategory.coverImage,
        coverImageAlt: firstCategory.coverImageAlt,
        color: firstCategory.color,
        icon: firstCategory.icon,
        href: `/?category=${firstCategory.slug}`,
        size: "large", // TOUJOURS large (2x2) - première position
      });
    }
  }

  // 2. Autres événements spéciaux = SMALL (1x1)
  if (specialEvents && specialEvents.length > 1) {
    specialEvents.slice(1).forEach((event) => {
      const status = getEventStatus(event);
      const eventColor = getEventColor(event);
      let dates = "";
      if (event.startDate) {
        dates = new Date(event.startDate).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        });
        if (event.endDate) {
          dates += ` - ${new Date(event.endDate).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
          })}`;
        }
      }
      cards.push({
        id: event._id,
        type: "event",
        title: event.name,
        description: event.description || event.shortDescription || "",
        shortDescription: event.shortDescription,
        coverImage: event.coverImage,
        coverImageAlt: event.coverImageAlt,
        color: eventColor,
        href: `/?specialEvent=${event.slug}`,
        status,
        dates,
        size: "small", // TOUJOURS small (1x1)
      });
    });
  }

  // 3. Catégories featured = SMALL (1x1) - sauf la première si déjà utilisée comme large
  if (featuredCategories && featuredCategories.length > 0) {
    const startIndex = specialEvents && specialEvents.length > 0 ? 0 : 1; // Skip première si déjà utilisée
    featuredCategories.slice(startIndex).forEach((category) => {
      if (category._id && category._id !== "") {
        cards.push({
          id: category._id,
          type: "category",
          title: category.name,
          description: category.description || category.shortDescription || "",
          shortDescription: category.shortDescription,
          coverImage: category.coverImage,
          coverImageAlt: category.coverImageAlt,
          color: category.color,
          icon: category.icon,
          href: `/?category=${category.slug}`,
          size: "small", // TOUJOURS small (1x1)
        });
      }
    });
  }

  // Si aucune card, ne rien afficher
  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-full px-4 md:px-6 lg:px-8 py-8 overflow-hidden">
      {/* Vue Desktop - Bento Grid */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card, index) => {
          // Déterminer les classes de taille pour le bento grid style Polymarket
          // Large = 2x2 (première card), les autres = 1x1
          const sizeClasses = {
            large: "md:col-span-2 md:row-span-2 h-64 md:h-[400px]",
            medium: "h-48 md:h-48",
            small: "h-48 md:h-48",
          };

          return (
            <Link
              key={card.id}
              href={card.href}
              className={cn(
                "group relative overflow-hidden",
                "rounded-xl bg-background/50 backdrop-blur-sm",
                "flex flex-col",
                sizeClasses[card.size]
              )}
            >
              {/* Image de fond avec scale au hover uniquement */}
              {card.coverImage && (
                <div 
                  className="absolute inset-0 overflow-hidden" 
                  style={{ 
                    aspectRatio: '16/9',
                    minHeight: card.size === 'large' ? '400px' : '192px', // Hauteur minimale fixe selon la taille
                  }}
                >
                  <Image
                    src={card.coverImage}
                    alt={card.coverImageAlt || card.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-40"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    loading="lazy"
                    decoding="async"
                    quality={75}
                  />
                  {/* Overlay gradient avec la couleur du thème */}
                  <div
                    className="absolute inset-0"
                    style={
                      card.color
                        ? {
                            background: `linear-gradient(135deg, ${card.color}20 0%, ${card.color}10 50%, transparent 100%)`,
                          }
                        : {
                            background: "linear-gradient(135deg, rgba(36, 107, 253, 0.1) 0%, rgba(36, 107, 253, 0.05) 50%, transparent 100%)",
                          }
                    }
                  />
                  {/* Overlay pour la lisibilité du texte */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                </div>
              )}

              {/* Overlay gradient en fond même sans image */}
              {!card.coverImage && (
                <div
                  className="absolute inset-0"
                  style={
                    card.color
                      ? {
                          background: `linear-gradient(135deg, ${card.color}20 0%, ${card.color}10 50%, transparent 100%)`,
                        }
                      : {
                          background: "linear-gradient(135deg, rgba(36, 107, 253, 0.1) 0%, rgba(36, 107, 253, 0.05) 50%, transparent 100%)",
                        }
                  }
                />
              )}

              {/* Contenu */}
              <div className="relative h-full flex flex-col justify-between p-6 z-10">
                <div className="space-y-3 flex-1">
                  {/* Badge de statut pour les événements */}
                  {card.status && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={card.status.variant}
                        className="text-xs font-semibold px-2.5 py-1"
                      >
                        {card.status.label}
                      </Badge>
                      {card.dates && (
                        <span className="text-xs text-muted-foreground font-medium">
                          {card.dates}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Icône pour les catégories */}
                  {card.icon && card.type === "category" && (
                    <div className="flex items-center gap-2">
                      <div className="p-2.5 rounded-xl bg-muted/50">
                        <SolarIcon
                          icon={card.icon}
                          className="size-5 text-foreground/60"
                        />
                      </div>
                    </div>
                  )}

                  {/* Titre blanc en dégradé */}
                  <h3
                    className={cn(
                      "font-semibold line-clamp-2",
                      card.size === "large" ? "text-xl" : card.size === "medium" ? "text-lg" : "text-base"
                    )}
                    style={{
                      background: "linear-gradient(135deg, #FFFFFF 0%, rgba(255, 255, 255, 0.85) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      color: "#FFFFFF", // Fallback
                    }}
                  >
                    {card.title}
                  </h3>

                  {/* Description */}
                  {card.description && (
                    <p
                      className={cn(
                        "text-muted-foreground line-clamp-2 group-hover:text-foreground/80 transition-colors",
                        card.size === "large" ? "text-base" : "text-sm"
                      )}
                    >
                      {card.description}
                    </p>
                  )}
                </div>

                {/* Bouton avec style de l'app et gradient de couleur */}
                <div className="mt-4 flex justify-start">
                  <Button
                    variant="default"
                    size="default"
                    className="w-fit"
                    style={
                      card.color
                        ? {
                            background: `linear-gradient(135deg, ${card.color}, ${card.color}dd)`,
                          }
                        : undefined
                    }
                  >
                    Marché
                  </Button>
                </div>
              </div>

            </Link>
          );
        })}
      </div>

      {/* Vue Mobile - Scroll horizontal limité avec hiérarchie */}
      <div className="md:hidden">
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
          {cards.slice(0, 4).map((card, index) => {
            // Hiérarchie : première card plus large, les autres standard
            const isFirst = index === 0;
            
            return (
              <Link
                key={card.id}
                href={card.href}
                className={cn(
                  "group relative overflow-hidden flex-shrink-0",
                  "rounded-xl bg-background/50 backdrop-blur-sm",
                  "flex flex-col",
                  isFirst ? "w-[280px]" : "w-[240px]", // Première card plus large
                  "h-48" // Hauteur fixe pour toutes
                )}
              >
                {/* Image de fond avec scale au hover uniquement */}
                {card.coverImage && (
                  <div className="absolute inset-0 overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    <Image
                      src={card.coverImage}
                      alt={card.coverImageAlt || card.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-40"
                      sizes="(max-width: 768px) 280px, 240px"
                      loading="lazy"
                      decoding="async"
                      quality={75}
                    />
                    {/* Overlay gradient avec la couleur du thème */}
                    <div
                      className="absolute inset-0"
                      style={
                        card.color
                          ? {
                              background: `linear-gradient(135deg, ${card.color}20 0%, ${card.color}10 50%, transparent 100%)`,
                            }
                          : {
                              background: "linear-gradient(135deg, rgba(36, 107, 253, 0.1) 0%, rgba(36, 107, 253, 0.05) 50%, transparent 100%)",
                            }
                      }
                    />
                    {/* Overlay pour la lisibilité du texte */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                  </div>
                )}

                {/* Overlay gradient en fond même sans image */}
                {!card.coverImage && (
                  <div
                    className="absolute inset-0"
                    style={
                      card.color
                        ? {
                            background: `linear-gradient(135deg, ${card.color}20 0%, ${card.color}10 50%, transparent 100%)`,
                          }
                        : {
                            background: "linear-gradient(135deg, rgba(36, 107, 253, 0.1) 0%, rgba(36, 107, 253, 0.05) 50%, transparent 100%)",
                          }
                    }
                  />
                )}

                {/* Contenu */}
                <div className="relative h-full flex flex-col justify-between p-4 z-10">
                  <div className="space-y-2 flex-1">
                    {/* Badge de statut pour les événements */}
                    {card.status && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={card.status.variant}
                          className="text-xs font-semibold px-2 py-0.5"
                        >
                          {card.status.label}
                        </Badge>
                        {card.dates && (
                          <span className="text-xs text-muted-foreground font-medium">
                            {card.dates}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Icône pour les catégories */}
                    {card.icon && card.type === "category" && (
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-muted/50">
                          <SolarIcon
                            icon={card.icon}
                            className="size-4 text-foreground/60"
                          />
                        </div>
                      </div>
                    )}

                    {/* Titre blanc en dégradé */}
                    <h3
                      className={cn(
                        "font-semibold line-clamp-2",
                        isFirst ? "text-lg" : "text-base" // Première card = titre plus grand
                      )}
                      style={{
                        background: "linear-gradient(135deg, #FFFFFF 0%, rgba(255, 255, 255, 0.85) 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        color: "#FFFFFF",
                      }}
                    >
                      {card.title}
                    </h3>

                    {/* Description - seulement pour la première card */}
                    {isFirst && card.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {card.description}
                      </p>
                    )}
                  </div>

                  {/* Pas de bouton sur mobile */}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
