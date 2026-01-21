"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Page de gestion des catégories pour décisions
 */
export function CategoriesClient() {
  const router = useRouter();
  const categories = useQuery(api.admin.getAllCategoriesForDecisions, {});
  const deleteCategory = useMutation(api.admin.deleteCategoryForDecisions);
  const setFeatured = useMutation(api.admin.setCategoryFeatured);
  const setPriority = useMutation(api.admin.setCategoryPriority);
  const runMigration = useAction(api.admin.runMigrationDecisionsToCategories);

  const [isMigrating, setIsMigrating] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Id<"categories"> | null>(null);

  const handleSetFeatured = async (categoryId: Id<"categories">, featured: boolean) => {
    try {
      await setFeatured({ categoryId, featured });
      toast.success(featured ? "Catégorie mise en avant" : "Catégorie retirée de la mise en avant");
    } catch (error: any) {
      toast.error(`Erreur : ${error.message}`);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCategory({ categoryId: categoryToDelete });
      toast.success("Catégorie archivée");
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error: any) {
      toast.error(`Erreur : ${error.message}`);
    }
  };

  const handleMigration = async () => {
    if (!confirm("Lancer la migration des décisions vers les catégories ? Cette opération peut prendre du temps.")) {
      return;
    }

    setIsMigrating(true);
    try {
      const result = await runMigration({});
      if (result.success) {
        toast.success(
          `Migration terminée ! ${result.stats?.categoriesCreated} catégories créées, ${result.stats?.decisionsProcessed} décisions traitées.`
        );
        if (result.stats?.errors && result.stats.errors.length > 0) {
          console.warn("Erreurs lors de la migration:", result.stats.errors);
        }
      } else {
        toast.error(`Erreur lors de la migration : ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`Erreur : ${error.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  if (categories === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Catégories pour décisions</h2>
          <p className="text-muted-foreground">
            Gérez les catégories utilisées pour classer les décisions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleMigration}
            disabled={isMigrating}
          >
            {isMigrating ? (
              <>
                <SolarIcon icon="loading" className="size-4 mr-2 animate-spin" />
                Migration...
              </>
            ) : (
              <>
                <SolarIcon icon="refresh-bold" className="size-4 mr-2" />
                Migrer les décisions
              </>
            )}
          </Button>
          <Button onClick={() => router.push("/admin/config/categories/new")}>
            <SolarIcon icon="add-circle-bold" className="size-4 mr-2" />
            Créer une catégorie
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des catégories</CardTitle>
          <CardDescription>
            {categories.length} catégorie{categories.length > 1 ? "s" : ""} active{categories.length > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Nom</TableHead>
                  <TableHead className="min-w-[150px]">Slug</TableHead>
                  <TableHead className="min-w-[100px]">Priorité</TableHead>
                  <TableHead className="min-w-[100px]">Mise en avant</TableHead>
                  <TableHead className="min-w-[150px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Aucune catégorie
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category._id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <code className="text-xs">{category.slug}</code>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={category.priority ?? 0}
                          onChange={(e) => {
                            const priority = parseInt(e.target.value) || 0;
                            setPriority({ categoryId: category._id, priority });
                          }}
                          className="w-20 h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant={category.featured ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleSetFeatured(category._id, !category.featured)}
                        >
                          {category.featured ? "Oui" : "Non"}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/admin/config/categories/${category._id}`)}
                          >
                            <SolarIcon icon="pen-bold" className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCategoryToDelete(category._id);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <SolarIcon icon="trash-bin-trash-bold" className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de suppression */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archiver la catégorie</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir archiver cette catégorie ? Elle ne sera plus utilisable mais
              les décisions existantes conserveront leur association.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Archiver
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
