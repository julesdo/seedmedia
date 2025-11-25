"use client";

import * as React from "react";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

interface SolarIconPickerProps {
  value?: string;
  onValueChange: (value: string) => void;
  label?: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

// Charger les icônes depuis le package @iconify-json/solar
let iconsCache: string[] | null = null;

// Fonction pour récupérer toutes les icônes Solar depuis @iconify-json/solar
function getSolarIcons(): string[] {
  // Si on a déjà un cache, le retourner
  if (iconsCache) {
    return iconsCache;
  }

  try {
    // Importer le package @iconify-json/solar
    // Le package expose les icônes dans icons.json
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const solarIcons = require("@iconify-json/solar/icons.json") as {
      icons?: Record<string, unknown>;
    };
    
    // Extraire tous les noms d'icônes depuis l'objet icons
    const icons: string[] = [];
    
    if (solarIcons.icons && typeof solarIcons.icons === "object") {
      // Les icônes sont dans solarIcons.icons avec la structure { "icon-name": {...} }
      Object.keys(solarIcons.icons).forEach((iconName) => {
        if (iconName && !icons.includes(iconName)) {
          icons.push(iconName);
        }
      });
    }
    
    // Trier et dédupliquer (double sécurité)
    const uniqueIcons = Array.from(new Set(icons)).sort();
    
    // Mettre en cache
    iconsCache = uniqueIcons;
    
    return uniqueIcons;
  } catch (error) {
    console.error("Error loading Solar icons from @iconify-json/solar:", error);
    
    // Fallback : liste minimale en cas d'erreur (sans doublons)
    const fallbackIcons = [
      "add-circle-bold",
      "check-circle-bold",
      "close-circle-bold",
      "delete-bold",
      "edit-bold",
      "settings-bold",
      "menu-bold",
      "search-bold",
      "user-bold",
      "heart-bold",
      "star-bold",
      "bookmark-bold",
      "share-bold",
      "document-bold",
      "file-bold",
      "folder-bold",
      "image-bold",
      "video-bold",
      "chat-bold",
      "message-bold",
      "mail-bold",
      "phone-bold",
      "notification-bold",
      "bank-bold",
      "shop-bold",
      "cart-bold",
      "wallet-bold",
      "chart-bold",
      "leaf-bold",
      "tree-bold",
      "sun-bold",
      "moon-bold",
      "cloud-bold",
      "cpu-bold",
      "smartphone-bold",
      "laptop-bold",
      "atom-bold",
      "flask-bold",
      "test-tube-bold",
      "book-bold",
      "pills-bold",
      "stethoscope-bold",
      "hospital-bold",
      "apple-bold",
      "car-bold",
      "building-bold",
      "home-bold",
      "wrench-bold",
      "music-bold",
      "play-bold",
      "shield-bold",
      "lock-bold",
      "key-bold",
      "eye-bold",
      "calendar-bold",
      "clock-bold",
      "light-bulb-bold",
      "fire-bold",
      "flag-bold",
      "hand-stars-bold",
      "vote-bold",
      "document-add-bold",
      "archive-bold",
      "refresh-bold",
      "download-bold",
      "upload-bold",
      "link-bold",
      "palette-bold",
      "newspaper-bold",
      "gavel-bold",
      "spinner-circle",
    ];
    
    iconsCache = fallbackIcons;
    return fallbackIcons;
  }
}

// Fonction pour rechercher des icônes
const searchIcons = (query: string, icons: string[]): string[] => {
  if (!query.trim()) return icons;

  const lowerQuery = query.toLowerCase();
  return icons.filter((icon) => icon.toLowerCase().includes(lowerQuery));
};

const ITEMS_PER_PAGE = 48; // 4 colonnes x 12 lignes

export function SolarIconPicker({
  value,
  onValueChange,
  label,
  description,
  required = false,
  placeholder = "Rechercher une icône...",
  className,
}: SolarIconPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allIcons, setAllIcons] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Charger les icônes au montage du composant
  useEffect(() => {
    // Charger les icônes de manière synchrone depuis le package
    const icons = getSolarIcons();
    setAllIcons(icons);
    setIsLoading(false);
  }, []);

  // Réinitialiser le compteur quand la recherche change
  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [searchQuery]);

  const filteredIcons = useMemo(() => {
    return searchIcons(searchQuery, allIcons);
  }, [searchQuery, allIcons]);

  const displayedIcons = useMemo(() => {
    return filteredIcons.slice(0, displayedCount);
  }, [filteredIcons, displayedCount]);

  const hasMore = displayedCount < filteredIcons.length;

  // Gérer le scroll pour charger plus d'icônes
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    
    // Charger plus d'icônes quand on approche du bas (50px avant la fin)
    if (scrollBottom < 50 && hasMore) {
      setDisplayedCount((prev) => Math.min(prev + ITEMS_PER_PAGE, filteredIcons.length));
    }
  }, [hasMore, filteredIcons.length]);

  const selectedIcon = value || "";

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label className="text-xs font-semibold text-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
      )}
      {description && (
        <p className="text-[10px] text-muted-foreground">{description}</p>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-8 text-xs"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {selectedIcon ? (
                <>
                  <SolarIcon icon={selectedIcon} className="h-4 w-4 shrink-0" />
                  <span className="truncate">{selectedIcon}</span>
                </>
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </div>
            <SolarIcon
              icon="alt-arrow-down-bold"
              className="ml-2 h-4 w-4 shrink-0 opacity-50"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Rechercher une icône..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {isLoading ? (
                <div className="grid grid-cols-4 gap-2 p-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={`skeleton-${i}`} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <CommandEmpty>Aucune icône trouvée.</CommandEmpty>
                  <CommandGroup>
                    <div
                      ref={scrollContainerRef}
                      className="grid grid-cols-4 gap-2 p-2 max-h-[400px] overflow-y-auto"
                      onScroll={handleScroll}
                    >
                      {displayedIcons.map((icon) => (
                        <CommandItem
                          key={icon}
                          value={icon}
                          onSelect={() => {
                            onValueChange(icon);
                            setOpen(false);
                            setSearchQuery("");
                          }}
                          className="flex flex-col items-center justify-center p-3 cursor-pointer hover:bg-accent rounded-md relative"
                        >
                          <SolarIcon
                            icon={icon}
                            className={cn(
                              "h-6 w-6 mb-1",
                              selectedIcon === icon && "opacity-100",
                              selectedIcon !== icon && "opacity-60"
                            )}
                          />
                          <span
                            className={cn(
                              "text-[10px] text-center truncate w-full",
                              selectedIcon === icon && "font-semibold"
                            )}
                          >
                            {icon.replace(/-bold$/, "").replace(/-/g, " ")}
                          </span>
                          {selectedIcon === icon && (
                            <SolarIcon
                              icon="check-circle-bold"
                              className="h-3 w-3 absolute top-1 right-1 text-primary"
                            />
                          )}
                        </CommandItem>
                      ))}
                      {hasMore && (
                        <div className="col-span-4 flex items-center justify-center py-4">
                          <Skeleton className="h-4 w-32" />
                        </div>
                      )}
                    </div>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedIcon && (
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>Icône sélectionnée :</span>
          <SolarIcon icon={selectedIcon} className="h-3 w-3" />
          <code className="text-[9px] bg-muted px-1 py-0.5 rounded">
            {selectedIcon}
          </code>
        </div>
      )}
    </div>
  );
}
