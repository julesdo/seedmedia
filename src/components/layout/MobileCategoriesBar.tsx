"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SolarIcon } from "@/components/icons/SolarIcon";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Barre de catégories mobile - Scroll horizontal épuré
 * Affiche les catégories les plus populaires avec scroll horizontal
 */
export function MobileCategoriesBar() {
  const searchParams = useSearchParams();
  const activeCategory = searchParams?.get("category");

  // Récupérer les catégories avec liquidité
  const categoriesWithLiquidity = useQuery(api.categories.getCategoriesWithLiquidity, {
    limit: 10, // Top 10 catégories par liquidité
  });

  // Ne pas afficher si pas de catégories
  if (!categoriesWithLiquidity || categoriesWithLiquidity.length === 0) {
    return null;
  }

  return (
    <div className="lg:hidden border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-[calc(var(--header-height,56px)+var(--breaking-news-height,0px))] z-30">
      <div className="px-4 py-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {/* Bouton "Tous" */}
          <Link
            href="/"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0",
              !activeCategory
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <SolarIcon icon="widget-4-bold" className="size-3" />
            <span>Tous</span>
          </Link>

          {/* Catégories */}
          {categoriesWithLiquidity.map((category) => {
            const isActive = activeCategory === category.slug;

            return (
              <Link
                key={category._id || category.slug}
                href={`/?category=${category.slug}`}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {category.icon && (
                  <SolarIcon
                    icon={category.icon}
                    className="size-3"
                    style={category.color && !isActive ? { color: category.color } : undefined}
                  />
                )}
                <span>{category.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

