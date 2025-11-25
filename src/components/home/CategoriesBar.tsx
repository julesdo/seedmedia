"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Link } from "next-view-transitions";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";

// Couleurs fun pour les catégories - style comme sur l'image
const CATEGORY_COLORS = [
  { bg: "bg-gradient-to-r from-orange-200 to-pink-200", text: "text-gray-900", shape: "rounded-lg" },
  { bg: "bg-lime-300", text: "text-gray-900", shape: "rounded-full" },
  { bg: "bg-gradient-to-r from-yellow-200 to-amber-100", text: "text-gray-900", shape: "rounded-lg" },
  { bg: "bg-gradient-to-r from-pink-300 to-purple-300", text: "text-white", shape: "rounded-lg" },
  { bg: "bg-gradient-to-r from-green-200 to-teal-300", text: "text-white", shape: "rounded-lg" },
  { bg: "bg-gradient-to-r from-amber-100 to-orange-200", text: "text-gray-900", shape: "rounded-lg" },
  { bg: "bg-gradient-to-r from-blue-400 to-indigo-500", text: "text-white", shape: "rounded-full" },
  { bg: "bg-gradient-to-r from-purple-200 to-pink-200", text: "text-gray-900", shape: "rounded-lg" },
  { bg: "bg-gradient-to-r from-beige-200 to-orange-200", text: "text-gray-900", shape: "rounded-lg" },
  { bg: "bg-blue-500", text: "text-white", shape: "rounded-full" },
  { bg: "bg-amber-100", text: "text-gray-900", shape: "rounded-full" },
  { bg: "bg-gradient-to-r from-blue-200 to-pink-200", text: "text-gray-900", shape: "rounded-lg" },
  { bg: "bg-green-300", text: "text-gray-900", shape: "rounded-full" },
];

// Dark mode colors
const CATEGORY_COLORS_DARK = [
  { bg: "dark:from-orange-900/40 dark:to-pink-900/40", text: "dark:text-orange-100", shape: "rounded-lg" },
  { bg: "dark:bg-lime-900/40", text: "dark:text-lime-100", shape: "rounded-full" },
  { bg: "dark:from-yellow-900/40 dark:to-amber-900/40", text: "dark:text-yellow-100", shape: "rounded-lg" },
  { bg: "dark:from-pink-900/40 dark:to-purple-900/40", text: "dark:text-pink-100", shape: "rounded-lg" },
  { bg: "dark:from-green-900/40 dark:to-teal-900/40", text: "dark:text-green-100", shape: "rounded-lg" },
  { bg: "dark:from-amber-900/40 dark:to-orange-900/40", text: "dark:text-amber-100", shape: "rounded-lg" },
  { bg: "dark:from-blue-900/40 dark:to-indigo-900/40", text: "dark:text-blue-100", shape: "rounded-full" },
  { bg: "dark:from-purple-900/40 dark:to-pink-900/40", text: "dark:text-purple-100", shape: "rounded-lg" },
  { bg: "dark:from-amber-900/40 dark:to-orange-900/40", text: "dark:text-amber-100", shape: "rounded-lg" },
  { bg: "dark:bg-blue-900/40", text: "dark:text-blue-100", shape: "rounded-full" },
  { bg: "dark:bg-amber-900/40", text: "dark:text-amber-100", shape: "rounded-full" },
  { bg: "dark:from-blue-900/40 dark:to-pink-900/40", text: "dark:text-blue-100", shape: "rounded-lg" },
  { bg: "dark:bg-green-900/40", text: "dark:text-green-100", shape: "rounded-full" },
];

export function CategoriesBar() {
  const allCategories = useQuery(api.categories.getActiveCategories);

  if (!allCategories || allCategories.length === 0) {
    return null;
  }

  return (
    <section className="w-full border-b border-border bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="flex flex-wrap items-center gap-3 py-4">
          {allCategories.map((category, index) => {
            const colorIndex = index % CATEGORY_COLORS.length;
            const colors = CATEGORY_COLORS[colorIndex];
            const colorsDark = CATEGORY_COLORS_DARK[colorIndex];
            const icon = category.icon as string | undefined;

            return (
              <Link
                key={category._id || category.slug}
                href={`/articles?category=${category.slug}`}
                className={cn(
                  "group flex items-center gap-2 px-4 py-2.5 transition-all shrink-0",
                  "hover:scale-105 active:scale-95 hover:shadow-sm",
                  colors.bg,
                  colors.text,
                  colors.shape,
                  colorsDark.bg,
                  colorsDark.text
                )}
              >
                {icon && (
                  <SolarIcon 
                    icon={icon} 
                    className="h-4 w-4 shrink-0"
                  />
                )}
                <span className="font-semibold text-sm whitespace-nowrap">
                  #{category.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

