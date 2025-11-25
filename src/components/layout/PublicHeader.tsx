"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { authClient } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { CredibilityBadge } from "@/components/credibility/CredibilityBadge";

// Couleurs fun pour les catégories - style comme CategoriesBar
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

export function PublicHeader() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const user = useQuery(api.auth.getCurrentUser);
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Récupérer les types avec leur contenu associé pour chaque section
  const articleTypesData = useQuery(api.navigation.getArticleTypes);
  const actionTypesData = useQuery(api.navigation.getActionTypes);
  const projectStagesData = useQuery(api.navigation.getProjectStages);

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 w-full transition-all",
      isScrolled 
        ? "bg-background/95 backdrop-blur-sm border-b border-border/50" 
        : "bg-background border-b border-border"
    )}>
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/logo.svg"
              alt="Seed"
              width={120}
              height={48}
              className="h-8 md:h-10 w-auto transition-opacity group-hover:opacity-90"
              priority
            />
          </Link>

          {/* Navigation - Desktop */}
          <NavigationMenu className="hidden md:flex [&_[data-slot=navigation-menu-viewport]]:shadow-none [&_[data-slot=navigation-menu-viewport]]:backdrop-blur-none [&_[data-slot=navigation-menu-viewport]]:border-border">
            <NavigationMenuList>
              {/* Articles */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className={cn(
                  "text-sm font-medium transition-colors backdrop-blur-none border-none shadow-none !bg-transparent hover:!bg-transparent focus:!bg-transparent data-[state=open]:!bg-transparent",
                  pathname?.startsWith("/articles") && "text-primary"
                )}>
                  Articles
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-background border border-border shadow-none">
                  <div className="w-[800px] p-6">
                    <div className="grid grid-cols-[1fr_320px] gap-6">
                      {/* Types à gauche */}
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                          Par type
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {articleTypesData && articleTypesData.length > 0 ? (
                            articleTypesData.map((item, index) => {
                              const colorIndex = index % CATEGORY_COLORS.length;
                              const colors = CATEGORY_COLORS[colorIndex];
                              const colorsDark = CATEGORY_COLORS_DARK[colorIndex];
                              const hasItems = item.articleCount > 0;

                              return (
                                <NavigationMenuLink key={item.type.value} asChild>
                                  <Link
                                    href={`/articles?type=${item.type.value}`}
                                    className={cn(
                                      "group flex items-center justify-between gap-2 px-3 py-2 transition-all rounded-lg",
                                      hasItems
                                        ? "hover:bg-muted/50 border border-transparent hover:border-border"
                                        : "opacity-50 cursor-not-allowed",
                                      colors.shape
                                    )}
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <SolarIcon 
                                        icon={item.type.icon} 
                                        className={cn(
                                          "h-3.5 w-3.5 shrink-0",
                                          hasItems ? "" : "text-muted-foreground"
                                        )}
                                      />
                                      <span className={cn(
                                        "font-semibold text-xs whitespace-nowrap truncate",
                                        hasItems ? "" : "text-muted-foreground"
                                      )}>
                                        {item.type.label}
                                      </span>
                                    </div>
                                    <span className={cn(
                                      "text-xs shrink-0 font-medium",
                                      hasItems ? "text-foreground" : "text-muted-foreground"
                                    )}>
                                      {item.articleCount}
                                    </span>
                                  </Link>
                                </NavigationMenuLink>
                              );
                            })
                          ) : (
                            <div className="text-sm text-muted-foreground col-span-2">Aucun type disponible</div>
                          )}
                        </div>
                      </div>
                      
                      {/* Dernier article à droite */}
                      {articleTypesData && articleTypesData.length > 0 && articleTypesData[0]?.latestArticle && (
                        <div className="border-l border-border pl-6">
                          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Dernier article
                          </h3>
                          <Link href={`/articles/${articleTypesData[0].latestArticle.slug}`} className="group block">
                            <div className="relative aspect-video w-full rounded-lg overflow-hidden mb-3 bg-muted">
                              {articleTypesData[0].latestArticle.coverImage ? (
                                <Image
                                  src={articleTypesData[0].latestArticle.coverImage}
                                  alt={articleTypesData[0].latestArticle.title}
                                  fill
                                  className="object-cover transition-transform group-hover:scale-105"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center">
                                  <SolarIcon icon="document-text-bold" className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="mb-2">
                              <span className={cn(
                                "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold",
                                CATEGORY_COLORS[0].bg,
                                CATEGORY_COLORS[0].text,
                                CATEGORY_COLORS_DARK[0].bg,
                                CATEGORY_COLORS_DARK[0].text
                              )}>
                                <SolarIcon icon={articleTypesData[0].type.icon} className="h-3 w-3" />
                                {articleTypesData[0].type.label}
                              </span>
                            </div>
                            <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-1">
                              {articleTypesData[0].latestArticle.title}
                            </h4>
                            {articleTypesData[0].latestArticle.summary && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {articleTypesData[0].latestArticle.summary}
                              </p>
                            )}
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Actions */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className={cn(
                  "text-sm font-medium transition-colors backdrop-blur-none border-none shadow-none !bg-transparent hover:!bg-transparent focus:!bg-transparent data-[state=open]:!bg-transparent",
                  pathname?.startsWith("/actions") && "text-primary"
                )}>
                  Actions
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-background border border-border shadow-none">
                  <div className="w-[800px] p-6">
                    <div className="grid grid-cols-[1fr_320px] gap-6">
                      {/* Types à gauche */}
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                          Par type
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {actionTypesData && actionTypesData.length > 0 ? (
                            actionTypesData.map((item, index) => {
                              const colorIndex = index % CATEGORY_COLORS.length;
                              const colors = CATEGORY_COLORS[colorIndex];
                              const colorsDark = CATEGORY_COLORS_DARK[colorIndex];
                              const hasItems = item.actionCount > 0;

                              return (
                                <NavigationMenuLink key={item.type.value} asChild>
                                  <Link
                                    href={`/actions?type=${item.type.value}`}
                                    className={cn(
                                      "group flex items-center justify-between gap-2 px-3 py-2 transition-all rounded-lg",
                                      hasItems
                                        ? "hover:bg-muted/50 border border-transparent hover:border-border"
                                        : "opacity-50 cursor-not-allowed",
                                      colors.shape
                                    )}
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <SolarIcon 
                                        icon={item.type.icon} 
                                        className={cn(
                                          "h-3.5 w-3.5 shrink-0",
                                          hasItems ? "" : "text-muted-foreground"
                                        )}
                                      />
                                      <span className={cn(
                                        "font-semibold text-xs whitespace-nowrap truncate",
                                        hasItems ? "" : "text-muted-foreground"
                                      )}>
                                        {item.type.label}
                                      </span>
                                    </div>
                                    <span className={cn(
                                      "text-xs shrink-0 font-medium",
                                      hasItems ? "text-foreground" : "text-muted-foreground"
                                    )}>
                                      {item.actionCount}
                                    </span>
                                  </Link>
                                </NavigationMenuLink>
                              );
                            })
                          ) : (
                            <div className="text-sm text-muted-foreground col-span-2">Aucun type disponible</div>
                          )}
                        </div>
                      </div>
                      
                      {/* Dernière action à droite */}
                      {actionTypesData && actionTypesData.length > 0 && actionTypesData[0]?.latestAction && (
                        <div className="border-l border-border pl-6">
                          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Dernière action
                          </h3>
                          <Link href={`/actions/${actionTypesData[0].latestAction.slug}`} className="group block">
                            <div className="relative aspect-video w-full rounded-lg overflow-hidden mb-3 bg-muted">
                              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center">
                                <SolarIcon icon="hand-stars-bold" className="h-8 w-8 text-muted-foreground" />
                              </div>
                            </div>
                            <div className="mb-2">
                              <span className={cn(
                                "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold",
                                CATEGORY_COLORS[1].bg,
                                CATEGORY_COLORS[1].text,
                                CATEGORY_COLORS_DARK[1].bg,
                                CATEGORY_COLORS_DARK[1].text
                              )}>
                                <SolarIcon icon={actionTypesData[0].type.icon} className="h-3 w-3" />
                                {actionTypesData[0].type.label}
                              </span>
                            </div>
                            <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-1">
                              {actionTypesData[0].latestAction.title}
                            </h4>
                            {actionTypesData[0].latestAction.summary && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {actionTypesData[0].latestAction.summary}
                              </p>
                            )}
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Projets */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className={cn(
                  "text-sm font-medium transition-colors backdrop-blur-none border-none shadow-none !bg-transparent hover:!bg-transparent focus:!bg-transparent data-[state=open]:!bg-transparent",
                  pathname?.startsWith("/projets") && "text-primary"
                )}>
                  Projets
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-background border border-border shadow-none">
                  <div className="w-[800px] p-6">
                    <div className="grid grid-cols-[1fr_320px] gap-6">
                      {/* Stages à gauche */}
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                          Par stage
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {projectStagesData && projectStagesData.length > 0 ? (
                            projectStagesData.map((item, index) => {
                              const colorIndex = index % CATEGORY_COLORS.length;
                              const colors = CATEGORY_COLORS[colorIndex];
                              const colorsDark = CATEGORY_COLORS_DARK[colorIndex];
                              const hasItems = item.projectCount > 0;

                              return (
                                <NavigationMenuLink key={item.stage.value} asChild>
                                  <Link
                                    href={`/projets?stage=${item.stage.value}`}
                                    className={cn(
                                      "group flex items-center justify-between gap-2 px-3 py-2 transition-all rounded-lg",
                                      hasItems
                                        ? "hover:bg-muted/50 border border-transparent hover:border-border"
                                        : "opacity-50 cursor-not-allowed",
                                      colors.shape
                                    )}
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <SolarIcon 
                                        icon={item.stage.icon} 
                                        className={cn(
                                          "h-3.5 w-3.5 shrink-0",
                                          hasItems ? "" : "text-muted-foreground"
                                        )}
                                      />
                                      <span className={cn(
                                        "font-semibold text-xs whitespace-nowrap truncate",
                                        hasItems ? "" : "text-muted-foreground"
                                      )}>
                                        {item.stage.label}
                                      </span>
                                    </div>
                                    <span className={cn(
                                      "text-xs shrink-0 font-medium",
                                      hasItems ? "text-foreground" : "text-muted-foreground"
                                    )}>
                                      {item.projectCount}
                                    </span>
                                  </Link>
                                </NavigationMenuLink>
                              );
                            })
                          ) : (
                            <div className="text-sm text-muted-foreground col-span-2">Aucun stage disponible</div>
                          )}
                        </div>
                      </div>
                      
                      {/* Dernier projet à droite */}
                      {projectStagesData && projectStagesData.length > 0 && projectStagesData[0]?.latestProject && (
                        <div className="border-l border-border pl-6">
                          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Dernier projet
                          </h3>
                          <Link href={`/projets/${projectStagesData[0].latestProject.slug}`} className="group block">
                            <div className="relative aspect-video w-full rounded-lg overflow-hidden mb-3 bg-muted">
                              {projectStagesData[0].latestProject.images && projectStagesData[0].latestProject.images.length > 0 ? (
                                <Image
                                  src={projectStagesData[0].latestProject.images[0]}
                                  alt={projectStagesData[0].latestProject.title}
                                  fill
                                  className="object-cover transition-transform group-hover:scale-105"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center">
                                  <SolarIcon icon="rocket-2-bold" className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="mb-2">
                              <span className={cn(
                                "inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold",
                                CATEGORY_COLORS[2].bg,
                                CATEGORY_COLORS[2].text,
                                CATEGORY_COLORS_DARK[2].bg,
                                CATEGORY_COLORS_DARK[2].text
                              )}>
                                <SolarIcon icon={projectStagesData[0].stage.icon} className="h-3 w-3" />
                                {projectStagesData[0].stage.label}
                              </span>
                            </div>
                            <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-1">
                              {projectStagesData[0].latestProject.title}
                            </h4>
                            {projectStagesData[0].latestProject.summary && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {projectStagesData[0].latestProject.summary}
                              </p>
                            )}
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Actions */}
              <NavigationMenuItem>
                <Link
                  href="/actions"
                  className={cn(
                    "inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors",
                    pathname?.startsWith("/actions")
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Actions
                </Link>
              </NavigationMenuItem>

              {/* Gouvernance */}
              <NavigationMenuItem>
                <Link
                  href="/gouvernance"
                  className={cn(
                    "inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors",
                    pathname?.startsWith("/gouvernance")
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Gouvernance
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated && user && (
              <Button
                variant="default"
                size="sm"
                asChild
                className="hidden md:flex"
              >
                <Link href="/studio/articles/nouveau" className="flex items-center gap-2">
                  <SolarIcon icon="document-add-bold" className="h-4 w-4 icon-gradient-light" />
                  <span>Écrire un article</span>
                </Link>
              </Button>
            )}
            <ThemeToggle variant="ghost" size="icon" />
            
            {isLoading ? (
              <div className="h-9 w-20 bg-muted animate-pulse rounded-lg" />
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <CredibilityBadge compact showLabel={false} className="hidden sm:flex" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.image || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {user.name?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 shadow-none border border-border">
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {user.name?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-0.5 flex-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        {user.email && (
                          <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="px-2 pb-1.5">
                      <CredibilityBadge compact={false} />
                    </div>
                    <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/studio" className="cursor-pointer">
                      <SolarIcon icon="widget-bold" className="mr-2 h-4 w-4" />
                      Studio
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/studio/articles" className="cursor-pointer">
                      <SolarIcon icon="document-text-bold" className="mr-2 h-4 w-4" />
                      Mes articles
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        await authClient.signOut();
                        router.push("/sign-in");
                      } catch (error) {
                        console.error("Erreur lors de la déconnexion:", error);
                      }
                    }}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <SolarIcon icon="logout-3-bold" className="mr-2 h-4 w-4" />
                    Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/sign-in")}
                  className="hidden sm:flex"
                >
                  Se connecter
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.push("/sign-up")}
                >
                  S'inscrire
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
