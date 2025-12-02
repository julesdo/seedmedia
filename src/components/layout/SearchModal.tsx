"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { PlateEditorWrapper } from "@/components/articles/PlateEditorWrapper";
import { Author } from "@/components/articles/Author";

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ViewType = 
  | { type: "search" }
  | { type: "article-detail"; slug: string }
  | { type: "category-list"; categorySlug: string }
  | { type: "project-detail"; slug: string }
  | { type: "action-detail"; slug: string }
  | { type: "debate-detail"; slug: string }
  | { type: "articles-list"; filter?: string }
  | { type: "projects-list"; filter?: string }
  | { type: "actions-list"; filter?: string }
  | { type: "debates-list" };

// Fonction pour mettre en évidence les termes recherchés
function highlightText(text: string, query: string) {
  if (!query.trim()) return text;
  
  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-primary/20 text-primary font-medium px-0.5 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

// Composant pour le virtual scroll avec Intersection Observer
function VirtualScrollList<T>({
  items,
  renderItem,
  itemHeight = 80,
  onLoadMore,
  hasMore,
  isLoading,
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && onLoadMore) {
          onLoadMore();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isLoading, hasMore, onLoadMore]
  );

  return (
    <div className="space-y-1">
      {items.map((item, index) => (
        <div key={index}>{renderItem(item, index)}</div>
      ))}
      {hasMore && (
        <div ref={loadMoreRef} className="h-4 flex items-center justify-center">
          {isLoading && <Skeleton className="h-4 w-full" />}
        </div>
      )}
    </div>
  );
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentView, setCurrentView] = useState<ViewType>({ type: "search" });
  const [history, setHistory] = useState<ViewType[]>([{ type: "search" }]);
  
  // États de pagination pour chaque type
  const [pagination, setPagination] = useState({
    articles: { limit: 4, hasMore: true },
    projects: { limit: 4, hasMore: true },
    actions: { limit: 4, hasMore: true },
    debates: { limit: 4, hasMore: true },
    categories: { limit: 4, hasMore: true },
  });

  // Debounce de la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      // Réinitialiser la pagination quand la recherche change
      if (search.length >= 2) {
        setPagination({
          articles: { limit: 4, hasMore: true },
          projects: { limit: 4, hasMore: true },
          actions: { limit: 4, hasMore: true },
          debates: { limit: 4, hasMore: true },
          categories: { limit: 4, hasMore: true },
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Réinitialiser la vue quand la modale s'ouvre
  useEffect(() => {
    if (open) {
      setCurrentView({ type: "search" });
      setHistory([{ type: "search" }]);
      setSearch("");
      setPagination({
        articles: { limit: 4, hasMore: true },
        projects: { limit: 4, hasMore: true },
        actions: { limit: 4, hasMore: true },
        debates: { limit: 4, hasMore: true },
        categories: { limit: 4, hasMore: true },
      });
    }
  }, [open]);

  // Navigation interne
  const navigateTo = (view: ViewType) => {
    setCurrentView(view);
    setHistory((prev) => [...prev, view]);
  };

  const goBack = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      const previousView = newHistory[newHistory.length - 1];
      setCurrentView(previousView);
      setHistory(newHistory);
    } else {
      setCurrentView({ type: "search" });
      setHistory([{ type: "search" }]);
    }
  };

  // Recherche globale avec pagination
  const searchResults = useQuery(
    api.content.globalSearch,
    debouncedSearch.length >= 2
      ? {
          query: debouncedSearch,
          limits: {
            articles: pagination.articles.limit,
            projects: pagination.projects.limit,
            actions: pagination.actions.limit,
            debates: pagination.debates.limit,
            categories: pagination.categories.limit,
          },
        }
      : "skip"
  );

  // Mettre à jour hasMore basé sur les résultats
  // Si on reçoit exactement le nombre demandé, il y a probablement plus
  useEffect(() => {
    if (searchResults) {
      setPagination((prev) => ({
        articles: {
          ...prev.articles,
          hasMore: searchResults.articles.length >= prev.articles.limit,
        },
        projects: {
          ...prev.projects,
          hasMore: searchResults.projects.length >= prev.projects.limit,
        },
        actions: {
          ...prev.actions,
          hasMore: searchResults.actions.length >= prev.actions.limit,
        },
        debates: {
          ...prev.debates,
          hasMore: searchResults.debates.length >= prev.debates.limit,
        },
        categories: {
          ...prev.categories,
          hasMore: searchResults.categories.length >= prev.categories.limit,
        },
      }));
    }
  }, [searchResults]);

  // Fonctions pour charger plus d'items
  const loadMoreArticles = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      articles: { ...prev.articles, limit: prev.articles.limit + 4 },
    }));
  }, []);

  const loadMoreProjects = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      projects: { ...prev.projects, limit: prev.projects.limit + 4 },
    }));
  }, []);

  const loadMoreActions = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      actions: { ...prev.actions, limit: prev.actions.limit + 4 },
    }));
  }, []);

  const loadMoreDebates = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      debates: { ...prev.debates, limit: prev.debates.limit + 4 },
    }));
  }, []);

  const loadMoreCategories = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      categories: { ...prev.categories, limit: prev.categories.limit + 4 },
    }));
  }, []);

  // Navigation rapide (quand pas de recherche)
  const quickNav = useMemo(() => {
    return [
      { id: "articles", label: "Articles", icon: "document-bold", view: { type: "articles-list" } as ViewType },
      { id: "actions", label: "Actions", icon: "hand-stars-bold", view: { type: "actions-list" } as ViewType },
      { id: "projets", label: "Projets", icon: "rocket-2-bold", view: { type: "projects-list" } as ViewType },
      { id: "debats", label: "Débats", icon: "chat-round-bold", view: { type: "debates-list" } as ViewType },
    ];
  }, []);

  // Récupérer la catégorie pour filtrer les articles
  const category = useQuery(
    api.categories.getCategoryBySlug,
    currentView.type === "category-list" ? { slug: currentView.categorySlug } : "skip"
  );

  // Récupérer les données selon la vue actuelle
  const article = useQuery(
    api.articles.getArticleBySlug,
    currentView.type === "article-detail" ? { slug: currentView.slug } : "skip"
  );

  const allArticles = useQuery(
    api.content.getLatestArticles,
    (currentView.type === "articles-list" || currentView.type === "category-list") ? { limit: 50 } : "skip"
  );

  // Filtrer les articles par catégorie si nécessaire
  const categoryArticles = useMemo(() => {
    if (currentView.type !== "category-list" || !allArticles || !category) return [];
    return allArticles.filter((article) => 
      article.categories?.some((cat) => cat._id === category._id)
    );
  }, [allArticles, category, currentView.type]);

  const hasResults = searchResults && (
    searchResults.articles.length > 0 ||
    searchResults.projects.length > 0 ||
    searchResults.actions.length > 0 ||
    searchResults.debates.length > 0 ||
    searchResults.categories.length > 0
  );

  const totalResults = searchResults
    ? searchResults.articles.length +
      searchResults.projects.length +
      searchResults.actions.length +
      searchResults.debates.length +
      searchResults.categories.length
    : 0;

  // Rendu du breadcrumb
  const renderBreadcrumb = () => {
    if (currentView.type === "search") return null;
    
    return (
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/60 bg-muted/20">
        <Button
          variant="ghost"
          size="sm"
          onClick={goBack}
          className="h-7 px-2 text-xs"
        >
          <SolarIcon icon="alt-arrow-left-bold" className="h-3.5 w-3.5 mr-1" />
          Retour
        </Button>
        <SolarIcon icon="alt-arrow-right-bold" className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          {currentView.type === "article-detail" && "Détail de l'article"}
          {currentView.type === "category-list" && "Catégorie"}
          {currentView.type === "articles-list" && "Tous les articles"}
          {currentView.type === "projects-list" && "Tous les projets"}
          {currentView.type === "actions-list" && "Toutes les actions"}
          {currentView.type === "debates-list" && "Tous les débats"}
        </span>
      </div>
    );
  };

  // Rendu de la vue de recherche
  const renderSearchView = () => {
    return (
      <>
        {!debouncedSearch || debouncedSearch.length < 2 ? (
          <>
            <CommandGroup heading="Navigation rapide">
              {quickNav.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  onSelect={() => navigateTo(item.view)}
                  className="group/item relative flex items-center gap-2.5 py-2.5 rounded-md pr-10"
                >
                  <SolarIcon icon={item.icon} className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm flex-1">{item.label}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateTo(item.view);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-100 transition-opacity p-1.5 rounded-md hover:bg-muted/50 z-50 pointer-events-auto"
                    title={`Naviguer vers ${item.label}`}
                  >
                    <SolarIcon icon="alt-arrow-right-bold" className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Explorer">
              <CommandItem
                value="recent-articles"
                onSelect={() => navigateTo({ type: "articles-list", filter: "recent" })}
                className="group/item relative flex items-center gap-2.5 py-2.5 rounded-md pr-10"
              >
                <SolarIcon icon="clock-circle-bold" className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm flex-1">Articles récents</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateTo({ type: "articles-list", filter: "recent" });
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-100 transition-opacity p-1.5 rounded-md hover:bg-muted/50 z-50 pointer-events-auto"
                  title="Naviguer vers les articles récents"
                >
                  <SolarIcon icon="alt-arrow-right-bold" className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </CommandItem>
              <CommandItem
                value="popular-articles"
                onSelect={() => navigateTo({ type: "articles-list", filter: "popular" })}
                className="group/item relative flex items-center gap-2.5 py-2.5 rounded-md pr-10"
              >
                <SolarIcon icon="fire-bold" className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm flex-1">Articles populaires</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateTo({ type: "articles-list", filter: "popular" });
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-100 transition-opacity p-1.5 rounded-md hover:bg-muted/50 z-50 pointer-events-auto"
                  title="Naviguer vers les articles populaires"
                >
                  <SolarIcon icon="alt-arrow-right-bold" className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </CommandItem>
            </CommandGroup>
          </>
        ) : searchResults === undefined ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !hasResults ? (
          <CommandEmpty>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <SolarIcon icon="magnifer-bold" className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium mb-1">Aucun résultat trouvé</p>
              <p className="text-xs text-muted-foreground">
                Essayez avec d'autres mots-clés
              </p>
            </div>
          </CommandEmpty>
        ) : (
          <>
            {/* Articles avec virtual scroll */}
            {searchResults.articles.length > 0 && (
              <CommandGroup heading={`Articles (${searchResults.articles.length})`}>
                <VirtualScrollList
                  items={searchResults.articles}
                  renderItem={(article, index) => (
                    <CommandItem
                      key={article._id}
                      value={`article-${article._id}`}
                      onSelect={() => navigateTo({ type: "article-detail", slug: article.slug })}
                      className="group/item relative flex items-start gap-3 py-3 px-3 cursor-pointer rounded-md pr-10"
                    >
                      {article.coverImage ? (
                        <div className="relative h-12 w-16 rounded-md overflow-hidden shrink-0 border border-border/60">
                          <Image
                            src={article.coverImage}
                            alt={article.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-16 rounded-md bg-muted/50 border border-border/60 flex items-center justify-center shrink-0">
                          <SolarIcon icon="document-text-bold" className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold line-clamp-1">
                            {highlightText(article.title, debouncedSearch)}
                          </h4>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {article.qualityScore !== undefined && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                <SolarIcon icon="star-bold" className="h-3 w-3 mr-0.5" />
                                {article.qualityScore}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {article.summary && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {highlightText(article.summary, debouncedSearch)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateTo({ type: "article-detail", slug: article.slug });
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-muted/50 z-50 pointer-events-auto bg-background/80 backdrop-blur-sm"
                        title="Voir les détails"
                      >
                        <SolarIcon icon="alt-arrow-right-bold" className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </CommandItem>
                  )}
                  onLoadMore={loadMoreArticles}
                  hasMore={pagination.articles.hasMore}
                  isLoading={searchResults === undefined}
                />
              </CommandGroup>
            )}

            {/* Catégories avec virtual scroll */}
            {searchResults.categories.length > 0 && (
              <CommandGroup heading={`Catégories (${searchResults.categories.length})`}>
                <VirtualScrollList
                  items={searchResults.categories}
                  renderItem={(category) => (
                    <CommandItem
                      key={category._id}
                      value={`category-${category._id}`}
                      onSelect={() => navigateTo({ type: "category-list", categorySlug: category.slug })}
                      className="group/item relative flex items-center gap-2.5 py-2.5 px-3 cursor-pointer rounded-md pr-10"
                    >
                      {category.icon && (
                        <SolarIcon icon={category.icon} className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">
                          {highlightText(category.name, debouncedSearch)}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateTo({ type: "category-list", categorySlug: category.slug });
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-muted/50 z-50 pointer-events-auto bg-background/80 backdrop-blur-sm"
                        title={`Explorer la catégorie ${category.name}`}
                      >
                        <SolarIcon icon="alt-arrow-right-bold" className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </CommandItem>
                  )}
                  onLoadMore={loadMoreCategories}
                  hasMore={pagination.categories.hasMore}
                  isLoading={searchResults === undefined}
                />
              </CommandGroup>
            )}
          </>
        )}
      </>
    );
  };

  // Rendu de la vue détail article
  const renderArticleDetail = () => {
    if (!article) {
      return (
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      );
    }

    return (
      <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
        {article.coverImage && (
          <div className="relative w-full h-48 rounded-md overflow-hidden border border-border/60">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover"
            />
          </div>
        )}

        <h2 className="text-xl font-bold">{article.title}</h2>

        {article.author && (
          <Author
            author={article.author}
            variant="detailed"
            size="sm"
            showDate
            date={article.publishedAt}
            linkToProfile={false}
          />
        )}

        {article.summary && (
          <div className="border-l-2 border-primary/40 pl-3 py-2 bg-muted/20 rounded-r">
            <p className="text-sm leading-relaxed">{article.summary}</p>
          </div>
        )}

        {article.content && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <PlateEditorWrapper
              value={article.content}
              readOnly={true}
              placeholder=""
            />
          </div>
        )}

        {article.categories && article.categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {article.categories.map((cat) => (
              <Button
                key={cat._id}
                variant="outline"
                size="sm"
                onClick={() => navigateTo({ type: "category-list", categorySlug: cat.slug })}
                className="text-xs"
              >
                {cat.icon && <SolarIcon icon={cat.icon} className="h-3 w-3 mr-1" />}
                {cat.name}
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Rendu de la liste d'articles
  const renderArticlesList = () => {
    const articles = allArticles || [];
    
    return (
      <div className="max-h-[500px] overflow-y-auto">
        <CommandGroup heading={`Articles (${articles.length})`}>
          {articles.map((article) => (
            <CommandItem
              key={article._id}
              value={`article-${article._id}`}
              onSelect={() => navigateTo({ type: "article-detail", slug: article.slug })}
              className="group/item relative flex items-start gap-3 py-3 px-3 cursor-pointer rounded-md pr-10"
            >
              {article.coverImage ? (
                <div className="relative h-12 w-16 rounded-md overflow-hidden shrink-0 border border-border/60">
                  <Image
                    src={article.coverImage}
                    alt={article.title}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-12 w-16 rounded-md bg-muted/50 border border-border/60 flex items-center justify-center shrink-0">
                  <SolarIcon icon="document-text-bold" className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <h4 className="text-sm font-semibold line-clamp-1">{article.title}</h4>
                {article.summary && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{article.summary}</p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateTo({ type: "article-detail", slug: article.slug });
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-muted/50 z-50 pointer-events-auto bg-background/80 backdrop-blur-sm"
                title="Voir les détails"
              >
                <SolarIcon icon="alt-arrow-right-bold" className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </CommandItem>
          ))}
        </CommandGroup>
      </div>
    );
  };

  // Rendu de la liste de catégories
  const renderCategoryList = () => {
    const articles = categoryArticles || [];
    
    return (
      <div className="max-h-[500px] overflow-y-auto">
        <CommandGroup heading={`Articles de la catégorie (${articles.length})`}>
          {articles.map((article) => (
            <CommandItem
              key={article._id}
              value={`article-${article._id}`}
              onSelect={() => navigateTo({ type: "article-detail", slug: article.slug })}
              className="group/item relative flex items-start gap-3 py-3 px-3 cursor-pointer rounded-md pr-10"
            >
              {article.coverImage ? (
                <div className="relative h-12 w-16 rounded-md overflow-hidden shrink-0 border border-border/60">
                  <Image
                    src={article.coverImage}
                    alt={article.title}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-12 w-16 rounded-md bg-muted/50 border border-border/60 flex items-center justify-center shrink-0">
                  <SolarIcon icon="document-text-bold" className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0 space-y-1">
                <h4 className="text-sm font-semibold line-clamp-1">{article.title}</h4>
                {article.summary && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{article.summary}</p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateTo({ type: "article-detail", slug: article.slug });
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-muted/50 z-50 pointer-events-auto bg-background/80 backdrop-blur-sm"
                title="Voir les détails"
              >
                <SolarIcon icon="alt-arrow-right-bold" className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </CommandItem>
          ))}
        </CommandGroup>
      </div>
    );
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Recherche globale"
      description="Recherchez dans tous les contenus de Seed"
      className="max-w-4xl"
    >
      <CommandInput
        placeholder="Rechercher des articles, projets, actions, débats..."
        value={search}
        onValueChange={(value) => {
          setSearch(value);
          if (value.length < 2) {
            setCurrentView({ type: "search" });
          }
        }}
        className="h-12 text-sm"
      />
      
      {renderBreadcrumb()}
      
      <CommandList className="max-h-[500px]">
        {currentView.type === "search" && renderSearchView()}
        {currentView.type === "article-detail" && renderArticleDetail()}
        {currentView.type === "articles-list" && renderArticlesList()}
        {currentView.type === "category-list" && renderCategoryList()}
        {(currentView.type === "projects-list" || 
          currentView.type === "actions-list" || 
          currentView.type === "debates-list") && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Cette fonctionnalité sera bientôt disponible
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}
