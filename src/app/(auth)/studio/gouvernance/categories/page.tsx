"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Id } from "../../../../../../convex/_generated/dataModel";

const APPLIES_TO_LABELS = {
  articles: "Articles",
  dossiers: "Dossiers",
  debates: "Débats",
  projects: "Projets",
  organizations: "Organisations",
} as const;

export default function CategoriesPage() {
  const activeCategories = useQuery(api.categories.getActiveCategories);
  const archiveCategory = useMutation(api.categories.archiveCategory);
  const user = useQuery(api.auth.getCurrentUser);

  const handleArchive = async (categoryId: Id<"categories">) => {
    if (!confirm("Êtes-vous sûr de vouloir archiver cette catégorie ?")) return;
    try {
      await archiveCategory({ categoryId });
    } catch (error: any) {
      console.error(error);
    }
  };

  const isEditor = user?.role === "editeur";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Catégories</h1>
          <p className="text-muted-foreground mt-2">
            Consultation des catégories disponibles pour classer les contenus. Les nouvelles catégories sont créées via des propositions de gouvernance.
          </p>
        </div>
        <Button
          onClick={() => {
            window.location.href = "/studio/gouvernance/nouvelle?proposalType=category_addition";
          }}
        >
          <SolarIcon icon="add-circle-bold" className="h-4 w-4 mr-2" />
          Créer une proposition pour une nouvelle catégorie
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catégories actives</CardTitle>
          <CardDescription>
            Catégories disponibles pour classer les contenus (articles, dossiers, débats, projets, organisations)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeCategories === undefined ? (
            <Skeleton className="h-64 w-full" />
          ) : activeCategories.length === 0 ? (
            <div className="text-center py-12">
              <SolarIcon
                icon="tag-bold"
                className="h-12 w-12 mx-auto text-muted-foreground mb-4"
              />
              <h3 className="text-lg font-semibold mb-2">Aucune catégorie active</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Créez une proposition de gouvernance pour ajouter une nouvelle catégorie
              </p>
              <Button
                onClick={() => {
                  window.location.href = "/studio/gouvernance/nouvelle?proposalType=category_addition";
                }}
              >
                <SolarIcon icon="add-circle-bold" className="h-4 w-4 mr-2" />
                Créer une proposition
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Applicable à</TableHead>
                  <TableHead className="text-right">Utilisations</TableHead>
                  {isEditor && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeCategories.map((category) => (
                  <TableRow key={category._id || category.slug}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {category.icon && (
                          <SolarIcon
                            icon={category.icon}
                            className="h-4 w-4"
                            style={category.color ? { color: category.color } : undefined}
                          />
                        )}
                        <span className="font-medium">{category.name}</span>
                        {!category._id && (
                          <Badge variant="outline" className="text-xs ml-2">
                            Par défaut
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <span className="text-sm text-muted-foreground line-clamp-2 block">
                        {category.description || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {category.appliesTo.map((type) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {APPLIES_TO_LABELS[type]}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm">{category.usageCount || 0}</span>
                    </TableCell>
                    {isEditor && category._id && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchive(category._id)}
                        >
                          <SolarIcon icon="archive-bold" className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
