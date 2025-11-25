"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
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
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const APPLIES_TO_LABELS = {
  articles: "Articles",
  dossiers: "Dossiers",
  debates: "Débats",
  projects: "Projets",
  organizations: "Organisations",
  actions: "Actions",
} as const;

const STATUS_LABELS = {
  pending: "En attente",
  active: "Active",
  archived: "Archivée",
} as const;

const STATUS_VARIANTS = {
  pending: "secondary",
  active: "default",
  archived: "outline",
} as const;

export default function CategoriesPage() {
  const [categoryToArchive, setCategoryToArchive] = useState<Id<"categories"> | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");

  const activeCategories = useQuery(api.categories.getActiveCategories);
  const myCategories = useQuery(api.categories.getMyCategories);
  const archiveCategory = useMutation(api.categories.archiveCategory);
  const isSuperAdmin = useQuery(api.admin.isSuperAdmin);

  const handleArchive = async () => {
    if (!categoryToArchive) return;

    try {
      await archiveCategory({ categoryId: categoryToArchive });
      toast.success("Catégorie archivée avec succès");
      setCategoryToArchive(null);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'archivage de la catégorie");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Catégories</h1>
          <p className="text-muted-foreground mt-2">
            Gestion des catégories pour classer les contenus. Les nouvelles catégories sont créées via des propositions de gouvernance.
          </p>
        </div>
        <Button
          onClick={() => {
            window.location.href = "/studio/gouvernance/nouvelle?proposalType=category_addition";
          }}
          icon="add-circle-bold"
        >
          Créer une proposition
        </Button>
      </div>

      {isSuperAdmin === false && (
        <div className="bg-muted/50 border border-border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <SolarIcon icon="info-circle-bold" className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-1">Information</p>
              <p className="text-sm text-muted-foreground">
                Seuls les super admins peuvent archiver des catégories. Vous pouvez consulter toutes les catégories et proposer de nouvelles catégories via des propositions de gouvernance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "my")}>
        <TabsList>
          <TabsTrigger value="all">Toutes les catégories</TabsTrigger>
          <TabsTrigger value="my">Mes catégories</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
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
                icon="add-circle-bold"
              >
                Créer une proposition
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Applicable à</TableHead>
                  <TableHead className="text-right">Utilisations</TableHead>
                  {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
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
                      <Badge
                        variant={
                          STATUS_VARIANTS[category.status as keyof typeof STATUS_VARIANTS] as any
                        }
                      >
                        {STATUS_LABELS[category.status as keyof typeof STATUS_LABELS]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {category.appliesTo.map((type: string) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {APPLIES_TO_LABELS[type as keyof typeof APPLIES_TO_LABELS]}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm">{category.usageCount || 0}</span>
                    </TableCell>
                    {isSuperAdmin && category._id && category.status === "active" && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          onClick={() => setCategoryToArchive(category._id)}
                          icon="archive-bold"
                        >
                          Archiver
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="my" className="space-y-4">
          {myCategories === undefined ? (
            <Skeleton className="h-64 w-full" />
          ) : myCategories.length === 0 ? (
            <div className="text-center py-12">
              <SolarIcon
                icon="tag-bold"
                className="h-12 w-12 mx-auto text-muted-foreground mb-4"
              />
              <h3 className="text-lg font-semibold mb-2">Aucune catégorie proposée</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Vous n'avez pas encore proposé de catégories. Créez une proposition de gouvernance pour en proposer une.
              </p>
              <Button
                onClick={() => {
                  window.location.href = "/studio/gouvernance/nouvelle?proposalType=category_addition";
                }}
                icon="add-circle-bold"
              >
                Créer une proposition
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Applicable à</TableHead>
                  <TableHead className="text-right">Utilisations</TableHead>
                  <TableHead className="text-right">Date de création</TableHead>
                  {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {myCategories.map((category) => (
                  <TableRow key={category._id}>
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
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <span className="text-sm text-muted-foreground line-clamp-2 block">
                        {category.description || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          STATUS_VARIANTS[category.status as keyof typeof STATUS_VARIANTS] as any
                        }
                      >
                        {STATUS_LABELS[category.status as keyof typeof STATUS_LABELS]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {category.appliesTo.map((type: string) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {APPLIES_TO_LABELS[type as keyof typeof APPLIES_TO_LABELS]}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm">{category.usageCount || 0}</span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(category.createdAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </TableCell>
                    {isSuperAdmin && category.status === "active" && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCategoryToArchive(category._id)}
                          icon="archive-bold"
                        >
                          Archiver
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de confirmation d'archivage */}
      <AlertDialog
        open={categoryToArchive !== null}
        onOpenChange={(open) => !open && setCategoryToArchive(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archiver cette catégorie ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action marquera la catégorie comme archivée. Elle ne sera plus disponible pour
              de nouveaux contenus, mais les contenus existants conservent leur catégorie. Cette
              action peut être annulée plus tard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>Archiver</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
