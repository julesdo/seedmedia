"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { WelcomeCard } from "./WelcomeCard";
import { cn } from "@/lib/utils";

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

export function PublicSidebar() {
  const pathname = usePathname();
  const articleTypesData = useQuery(api.navigation.getArticleTypes);
  const actionTypesData = useQuery(api.navigation.getActionTypes);
  const projectStagesData = useQuery(api.navigation.getProjectStages);
  const categories = useQuery(api.categories.getActiveCategories, {});
  const openDebates = useQuery(api.debates.getOpenDebates, { limit: 100 });

  const navSections = useMemo(() => {
    return [
      {
        title: "Explorer",
        items: [
          {
            label: "Articles",
            href: "/articles",
            icon: "document-bold",
            count: articleTypesData?.reduce((acc, item) => acc + item.articleCount, 0),
          },
          {
            label: "Actions",
            href: "/actions",
            icon: "hand-stars-bold",
            count: actionTypesData?.reduce((acc, item) => acc + item.actionCount, 0),
          },
          {
            label: "Projets",
            href: "/projets",
            icon: "rocket-2-bold",
            count: projectStagesData?.reduce((acc, item) => acc + item.projectCount, 0),
          },
          {
            label: "Débats",
            href: "/debats",
            icon: "chat-round-bold",
            count: openDebates?.length,
          },
          {
            label: "Gouvernance",
            href: "/gouvernance",
            icon: "shield-star-bold",
          },
        ],
      },
    ];
  }, [actionTypesData, articleTypesData, projectStagesData, openDebates]);


  const categoryPills = useMemo(() => {
    if (!categories || categories.length === 0) {
      return [];
    }

    return categories.slice(0, 12).map((category, index) => {
      const colors = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
      const colorsDark = CATEGORY_COLORS_DARK[index % CATEGORY_COLORS_DARK.length];

      return {
        key: category._id || category.slug || category.name,
        label: `#${category.name}`,
        href: `/articles?category=${category.slug ?? category.name}`,
        colors,
        colorsDark,
        icon: category.icon as string | undefined,
      };
    });
  }, [categories]);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[280px] flex-col border-r border-border/60 bg-background/95 px-0 pb-4 pt-4 shadow-none backdrop-blur lg:flex">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/40 bg-background/95 px-5 pb-3 pt-1 backdrop-blur">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Seed" width={110} height={40} className="h-8 w-auto" priority />
        </Link>
        <ThemeToggle variant="ghost" size="icon" />
      </div>


      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4 pt-6 pb-5 scrollbar-thin">
          <nav className="space-y-6">
            {navSections.map((section) => {
              const hasItems = section.items.length > 0;

              return (
                <div key={section.title}>
                  <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    {section.title}
                  </p>
                  {!hasItems ? (
                    <div className="mt-2 rounded-xl border border-dashed border-border/60 px-3 py-3 text-center text-xs text-muted-foreground">
                      Aucun résultat
                    </div>
                  ) : (
                    <ul className="mt-3 space-y-1">
                      {section.items.map((item) => {
                        const isActive = pathname?.startsWith(item.href);

                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              className={cn(
                                "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <div className="flex flex-1 items-center gap-2">
                                <SolarIcon
                                  icon={item.icon}
                                  className={cn(
                                    "h-4 w-4 shrink-0 transition-colors",
                                    isActive ? "text-primary" : "text-muted-foreground"
                                  )}
                                />
                                <span className="flex-1 truncate font-medium">{item.label}</span>
                              </div>
                              {typeof item.count === "number" && item.count > 0 && (
                                <span
                                  className={cn(
                                    "min-w-[2rem] text-right text-[11px] font-semibold",
                                    isActive ? "text-primary" : "text-muted-foreground/80"
                                  )}
                                >
                                  {item.count}
                                </span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="mt-6 space-y-4 border-t border-border/60 px-1 pt-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-muted-foreground">Catégories</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {categoryPills.length === 0 ? (
                  <p className="col-span-2 text-xs text-muted-foreground">Chargement des catégories...</p>
                ) : (
                  categoryPills.map((category, index) => (
                    <Link
                      key={category.key}
                      href={category.href}
                      className={cn(
                        "flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition-opacity hover:opacity-85",
                        category.colors.bg,
                        category.colors.text,
                        category.colorsDark.bg,
                        category.colorsDark.text,
                        category.colors.shape
                      )}
                    >
                      <span>{index + 1}.</span>
                      {category.icon && <SolarIcon icon={category.icon} className="h-3.5 w-3.5" />}
                      <span className="truncate">{category.label}</span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <WelcomeCard />
      </div>
    </aside>
  );
}

