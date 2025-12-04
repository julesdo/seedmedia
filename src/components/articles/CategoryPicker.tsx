"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { cn } from "@/lib/utils";

interface Category {
  _id?: string;
  slug: string;
  name: string;
  icon?: string;
}

interface CategoryPickerProps {
  availableCategories: Category[];
  selectedCategoryIds: string[];
  selectedCategorySlugs: string[];
  onCategoryIdsChange: (ids: string[]) => void;
  onCategorySlugsChange: (slugs: string[]) => void;
  label?: string;
  description?: string;
}

export function CategoryPicker({
  availableCategories = [],
  selectedCategoryIds,
  selectedCategorySlugs,
  onCategoryIdsChange,
  onCategorySlugsChange,
  label = "Catégories",
  description,
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Catégories disponibles (non sélectionnées)
  const availableCategoriesFiltered = availableCategories.filter((cat) => {
    if (cat._id) {
      return !selectedCategoryIds.includes(cat._id);
    } else {
      return !selectedCategorySlugs.includes(cat.slug);
    }
  });

  // Catégories sélectionnées
  const selectedCategories = React.useMemo(() => {
    return [
      ...selectedCategoryIds.map((id) => {
        const cat = availableCategories.find((c) => c._id === id);
        return cat ? { ...cat, id, type: "id" as const } : null;
      }),
      ...selectedCategorySlugs.map((slug) => {
        const cat = availableCategories.find((c) => !c._id && c.slug === slug);
        return cat ? { ...cat, id: `slug:${slug}`, type: "slug" as const } : null;
      }),
    ].filter(Boolean) as Array<Category & { id: string; type: "id" | "slug" }>;
  }, [selectedCategoryIds, selectedCategorySlugs, availableCategories]);

  // Filtrer les catégories disponibles selon la recherche
  const filteredCategories = React.useMemo(() => {
    if (!search.trim()) return availableCategoriesFiltered;
    
    const searchLower = search.toLowerCase();
    return availableCategoriesFiltered.filter(
      (cat) =>
        cat.name.toLowerCase().includes(searchLower) ||
        cat.slug.toLowerCase().includes(searchLower)
    );
  }, [availableCategoriesFiltered, search]);

  const addCategory = (value: string) => {
    if (!value) return;
    
    if (value.startsWith("slug:")) {
      const slug = value.replace("slug:", "");
      if (!selectedCategorySlugs.includes(slug)) {
        onCategorySlugsChange([...selectedCategorySlugs, slug]);
      }
    } else {
      if (!selectedCategoryIds.includes(value)) {
        onCategoryIdsChange([...selectedCategoryIds, value]);
      }
    }
    setSearch("");
  };

  const removeCategory = (id: string) => {
    if (id.startsWith("slug:")) {
      const slug = id.replace("slug:", "");
      onCategorySlugsChange(selectedCategorySlugs.filter((s) => s !== slug));
    } else {
      onCategoryIdsChange(selectedCategoryIds.filter((cid) => cid !== id));
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>{label}</Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      {/* Catégories sélectionnées */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCategories.map((category) => (
            <Badge
              key={category.id}
              variant="secondary"
              className="gap-1.5 px-3 py-1.5 text-sm"
            >
              {category.icon && (
                <SolarIcon icon={category.icon as any} className="h-3.5 w-3.5" />
              )}
              <span>{category.name}</span>
              {category.type === "slug" && (
                <Badge variant="outline" className="text-xs ml-1 px-1.5 py-0">
                  Par défaut
                </Badge>
              )}
              <button
                type="button"
                onClick={() => removeCategory(category.id)}
                className="ml-1 hover:text-destructive transition-colors"
                aria-label={`Retirer ${category.name}`}
              >
                <SolarIcon icon="close-circle-bold" className="h-3.5 w-3.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Popover de sélection */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start"
            onClick={() => setOpen(!open)}
          >
            <SolarIcon icon="add-circle-bold" className="h-4 w-4 mr-2" />
            Ajouter une catégorie
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Rechercher une catégorie..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                <div className="py-6 text-center text-sm">
                  <SolarIcon icon="search-bold" className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Aucune catégorie trouvée
                  </p>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {filteredCategories.length > 0 ? (
                  <div className="p-2">
                    <div className="grid grid-cols-1 gap-1.5">
                      {filteredCategories.map((category) => {
                        const value = category._id || `slug:${category.slug}`;
                        const key = category._id || `default-${category.slug}`;
                        
                        return (
                          <CommandItem
                            key={key}
                            value={value}
                            onSelect={() => {
                              addCategory(value);
                              if (filteredCategories.length === 1) {
                                setOpen(false);
                              }
                            }}
                            className="flex items-center gap-3 px-3 py-3 cursor-pointer rounded-lg border border-border/50 hover:border-primary/50 hover:bg-accent/50 transition-all"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {category.icon && (
                                <div className="flex-shrink-0 p-1.5 rounded-md bg-primary/10">
                                  <SolarIcon
                                    icon={category.icon as any}
                                    className="h-4 w-4 text-primary"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">{category.name}</div>
                                {!category._id && (
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    Catégorie par défaut
                                  </div>
                                )}
                              </div>
                              {!category._id && (
                                <Badge variant="outline" className="text-xs shrink-0">
                                  Par défaut
                                </Badge>
                              )}
                              <SolarIcon
                                icon="add-circle-bold"
                                className="h-4 w-4 text-muted-foreground shrink-0"
                              />
                            </div>
                          </CommandItem>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center">
                    <SolarIcon icon="check-circle-bold" className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Toutes les catégories sont déjà sélectionnées
                    </p>
                  </div>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedCategories.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Aucune catégorie sélectionnée. Cliquez sur "Ajouter une catégorie" pour en ajouter.
        </p>
      )}
    </div>
  );
}

