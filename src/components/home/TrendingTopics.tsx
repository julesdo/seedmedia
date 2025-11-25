"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Link } from "next-view-transitions";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export function TrendingTopics() {
  const categories = useQuery(api.categories.getActiveCategories);
  const articles = useQuery(api.content.getLatestArticles, { limit: 50 });

  // Calculer les catégories les plus utilisées
  const trendingCategories = categories
    ? categories
        .map((cat) => {
          const usageCount =
            articles?.filter((article) =>
              article.categoryIds?.includes(cat._id)
            ).length || cat.usageCount || 0;
          return { ...cat, usageCount };
        })
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 5)
    : [];

  if (!categories || !articles) {
    return (
      <div className="border-b border-border pb-8">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-border pb-8">
      <div className="flex items-center gap-2 mb-6">
        <img 
          src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Fire.png" 
          alt="Fire" 
          width="20" 
          height="20" 
          className="shrink-0"
        />
        <h3 className="font-bold text-lg">Sujets tendances</h3>
      </div>
      <div className="space-y-0">
        {trendingCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun sujet tendance pour le moment
          </p>
        ) : (
          trendingCategories.map((category, index) => (
            <div key={category._id || category.slug}>
              <Link
                href={`/articles?category=${category.slug}`}
                className="flex items-center justify-between py-3 group"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-medium text-muted-foreground w-6 shrink-0">
                    {index + 1}
                  </span>
                  {category.icon && (
                    <SolarIcon
                      icon={category.icon as any}
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                    />
                  )}
                  <span className="font-medium text-sm truncate group-hover:opacity-80 transition-opacity">
                    {category.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                  {category.usageCount}
                </span>
              </Link>
              {index < trendingCategories.length - 1 && <Separator />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

