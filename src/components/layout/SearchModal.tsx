"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
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
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

// Composant pour le chargement progressif avec Intersection Observer
function InfiniteScrollTrigger({
  onLoadMore,
  hasMore,
  isLoading,
}: {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const triggerRef = useCallback(
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

  if (!hasMore) return null;

  return (
    <div ref={triggerRef} className="h-2 w-full" />
  );
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const router = useRouter();
  
  // États de pagination unifiés
  const [limit, setLimit] = useState(8);

  // Debounce de la recherche (plus court pour une recherche plus réactive)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      if (search.trim().length > 0) {
        setLimit(8); // Réinitialiser la pagination
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  // Réinitialiser quand la modale s'ouvre
  useEffect(() => {
    if (open) {
      setSearch("");
      setLimit(8);
    }
  }, [open]);

  // Recherche globale avec pagination unifiée (recherche dès 1 caractère)
  const searchResults = useQuery(
    api.content.globalSearch,
    debouncedSearch.length > 0
      ? {
          query: debouncedSearch,
          limits: {
            articles: limit,
            projects: limit,
            actions: limit,
            debates: limit,
            categories: limit,
          },
        }
      : "skip"
  );

  // Récupérer les derniers éléments quand la recherche est vide
  const latestItems = useQuery(
    api.content.getLatestItems,
    debouncedSearch.length === 0 ? { limit: 5 } : "skip"
  );


  // Charger plus de résultats
  const loadMore = useCallback(() => {
    setLimit((prev) => prev + 8);
  }, []);

  // Vérifier s'il y a plus de résultats
  const hasMore = searchResults
    ? searchResults.articles.length >= limit ||
      searchResults.projects.length >= limit ||
      searchResults.actions.length >= limit ||
      searchResults.debates.length >= limit ||
      searchResults.categories.length >= limit
    : false;

  // Combiner tous les résultats en une seule liste unifiée
  const allResults = searchResults
    ? [
        ...searchResults.articles.map((item) => ({ ...item, type: "article" as const })),
        ...searchResults.projects.map((item) => ({ ...item, type: "project" as const })),
        ...searchResults.actions.map((item) => ({ ...item, type: "action" as const })),
        ...searchResults.debates.map((item) => ({ ...item, type: "debate" as const })),
        ...searchResults.categories.map((item) => ({ ...item, type: "category" as const })),
      ]
    : latestItems
    ? [
        ...latestItems.articles.map((item) => ({ ...item, type: "article" as const })),
        ...latestItems.projects.map((item) => ({ ...item, type: "project" as const })),
        ...latestItems.actions.map((item) => ({ ...item, type: "action" as const })),
        ...latestItems.debates.map((item) => ({ ...item, type: "debate" as const })),
      ]
    : [];

  // Navigation vers une page
  const handleSelect = (type: string, slug: string | undefined) => {
    if (!slug) {
      console.error("No slug provided for type:", type);
      return;
    }
    onOpenChange(false);
    if (type === "article") {
      router.push(`/articles/${slug}`);
    } else if (type === "category") {
      router.push(`/categories/${slug}`);
    } else if (type === "project") {
      router.push(`/projets/${slug}`);
    } else if (type === "action") {
      router.push(`/actions/${slug}`);
    } else if (type === "debate") {
      router.push(`/debats/${slug}`);
    }
  };

  // Rendu d'un résultat
  const renderResult = (item: any) => {
    const getIcon = () => {
      switch (item.type) {
        case "article":
          return "document-text-bold";
        case "project":
          return "rocket-2-bold";
        case "action":
          return "hand-stars-bold";
        case "debate":
          return "chat-round-bold";
        case "category":
          return item.icon || "folder-bold";
        default:
          return "file-bold";
      }
    };

    const getTitle = () => {
      switch (item.type) {
        case "article":
          return item.title;
        case "project":
          return item.title;
        case "action":
          return item.title;
        case "debate":
          return item.question;
        case "category":
          return item.name;
        default:
          return "";
      }
    };

    const getSubtitle = () => {
      switch (item.type) {
        case "article":
          return item.summary;
        case "project":
          return item.summary;
        case "action":
          return item.summary || item.description;
        case "debate":
          return item.description;
        case "category":
          return item.description;
        default:
          return "";
      }
    };

    const getImage = () => {
      if (item.type === "article" && item.coverImage) {
        return item.coverImage;
      }
      if (item.type === "project" && item.images?.[0]) {
        return item.images[0];
      }
      return null;
    };

    const getBadge = () => {
      if (item.type === "article" && item.qualityScore !== undefined) {
        return (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            <SolarIcon icon="star-bold" className="h-3 w-3 mr-0.5" />
            {item.qualityScore}
          </Badge>
        );
      }
      if (item.type === "project" && item.stage) {
        return (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {item.stage}
          </Badge>
        );
      }
      if (item.type === "action" && item.status) {
        return (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {item.status}
          </Badge>
        );
      }
      return null;
    };

    const image = getImage();
    const title = getTitle();
    const subtitle = getSubtitle();
    const badge = getBadge();

    if (!item.slug) {
      console.warn("Item missing slug:", item);
      return null;
    }

    return (
      <CommandItem
        key={`${item.type}-${item._id}`}
        value={`${item.type}-${item._id}`}
        onSelect={() => handleSelect(item.type, item.slug)}
        className="flex items-start gap-3 py-3 px-3 cursor-pointer rounded-md"
      >
        {image ? (
          <div className="relative h-10 w-14 rounded-md overflow-hidden shrink-0 border border-border/60">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="h-10 w-10 rounded-md bg-muted/50 border border-border/60 flex items-center justify-center shrink-0">
            <SolarIcon icon={getIcon()} className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold line-clamp-1">
              {highlightText(title, debouncedSearch)}
            </h4>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {highlightText(subtitle, debouncedSearch)}
            </p>
          )}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="capitalize">{item.type === "article" ? "Article" : item.type === "project" ? "Projet" : item.type === "action" ? "Action" : item.type === "debate" ? "Débat" : "Catégorie"}</span>
            {item.type === "article" && item.author && (
              <>
                <span>•</span>
                <span>{item.author.name}</span>
              </>
            )}
          </div>
        </div>
      </CommandItem>
    );
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      className="max-w-2xl"
    >
      <CommandInput
        placeholder="Rechercher..."
        value={search}
        onValueChange={setSearch}
        className="h-12 text-sm border-0 focus:ring-0"
      />
      
      <CommandList className="max-h-[500px]">
        {debouncedSearch.length === 0 && latestItems === undefined ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : debouncedSearch.length === 0 && latestItems ? (
          <>
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border/60">
              Derniers éléments
            </div>
            <CommandGroup>
              {allResults.map((item) => renderResult(item)).filter(Boolean)}
            </CommandGroup>
          </>
        ) : searchResults === undefined ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : searchResults === null ? (
          <CommandEmpty>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <SolarIcon icon="danger-triangle-bold" className="h-10 w-10 text-destructive/50 mb-3" />
              <p className="text-sm font-medium mb-1">Erreur de recherche</p>
              <p className="text-xs text-muted-foreground">
                Une erreur s'est produite lors de la recherche
              </p>
            </div>
          </CommandEmpty>
        ) : allResults.length === 0 ? (
          <CommandEmpty>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <SolarIcon icon="magnifer-bold" className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium mb-1">Aucun résultat</p>
              <p className="text-xs text-muted-foreground">
                Essayez avec d'autres mots-clés
              </p>
            </div>
          </CommandEmpty>
        ) : (
          <>
            <CommandGroup>
              {allResults.map((item) => renderResult(item)).filter(Boolean)}
            </CommandGroup>
            <InfiniteScrollTrigger
              onLoadMore={loadMore}
              hasMore={hasMore}
              isLoading={searchResults === undefined}
            />
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
