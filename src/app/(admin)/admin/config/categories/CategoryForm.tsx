"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImagePicker } from "@/components/ui/image-picker";
import { SolarIconPicker } from "@/components/ui/solar-icon-picker";

interface CategoryFormProps {
  categoryId?: Id<"categories">;
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CategoryForm({
  categoryId,
  initialData,
  onSuccess,
  onCancel,
}: CategoryFormProps) {
  const createCategory = useMutation(api.admin.createCategoryForDecisions);
  const updateCategory = useMutation(api.admin.updateCategoryForDecisions);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    description: initialData?.description || "",
    shortDescription: initialData?.shortDescription || "",
    icon: initialData?.icon || "",
    color: initialData?.color || "#246BFD",
    featured: initialData?.featured ?? false,
    priority: initialData?.priority?.toString() || "0",
    coverImage: initialData?.coverImage || "",
    coverImageAlt: initialData?.coverImageAlt || "",
    tags: initialData?.tags?.join(", ") || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  // Auto-générer le slug à partir du nom
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const tags = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      if (categoryId && updateCategory) {
        await updateCategory({
          categoryId,
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
          shortDescription: formData.shortDescription || undefined,
          icon: formData.icon || undefined,
          color: formData.color || undefined,
          featured: formData.featured,
          priority: parseInt(formData.priority) || 0,
          coverImage: formData.coverImage || undefined,
          coverImageAlt: formData.coverImageAlt || undefined,
          tags: tags.length > 0 ? tags : undefined,
        });
        toast.success("Catégorie mise à jour avec succès");
      } else if (createCategory) {
        await createCategory({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
          shortDescription: formData.shortDescription || undefined,
          icon: formData.icon || undefined,
          color: formData.color || undefined,
          featured: formData.featured,
          priority: parseInt(formData.priority) || 0,
          coverImage: formData.coverImage || undefined,
          coverImageAlt: formData.coverImageAlt || undefined,
          tags: tags.length > 0 ? tags : undefined,
        });
        toast.success("Catégorie créée avec succès");
      }

      onSuccess();
    } catch (error: any) {
      toast.error(`Erreur : ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{categoryId ? "Modifier la catégorie" : "Nouvelle catégorie"}</CardTitle>
        <CardDescription>
          {categoryId
            ? "Modifiez les informations de la catégorie"
            : "Remplissez le formulaire pour créer une nouvelle catégorie"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informations de base */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Informations de base</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      name,
                      slug: generateSlug(name),
                    }));
                  }}
                  placeholder="Ex: Géopolitique"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  disabled
                  className="bg-muted cursor-not-allowed"
                  title="Le slug est généré automatiquement à partir du nom"
                />
                <p className="text-xs text-muted-foreground">
                  Généré automatiquement à partir du nom
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shortDescription">Description courte</Label>
                <Input
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="Pour affichage dans le hero"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description complète</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Description détaillée de la catégorie"
                />
              </div>
            </div>
          </div>

          {/* Apparence et style */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Apparence et style</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <SolarIconPicker
                  value={formData.icon}
                  onValueChange={(value) => setFormData({ ...formData, icon: value })}
                  label="Icône"
                  description="Sélectionnez une icône Solar"
                  placeholder="Rechercher une icône..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Couleur</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1"
                    placeholder="#246BFD"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Image de couverture */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Image de couverture</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="coverImage">Image</Label>
                <div className="flex gap-2">
                  <Input
                    id="coverImage"
                    type="url"
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    placeholder="URL de l'image ou utilisez le sélecteur"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsImagePickerOpen(true)}
                  >
                    <SolarIcon icon="gallery-bold" className="size-4 mr-2" />
                    Sélectionner
                  </Button>
                </div>
                {formData.coverImage && (
                  <div className="mt-2">
                    <img
                      src={formData.coverImage}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded border"
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="coverImageAlt">Texte alternatif</Label>
                <Input
                  id="coverImageAlt"
                  value={formData.coverImageAlt}
                  onChange={(e) => setFormData({ ...formData, coverImageAlt: e.target.value })}
                  placeholder="Description de l'image pour l'accessibilité"
                />
              </div>
            </div>
          </div>

          {/* Paramètres d'affichage */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Paramètres d'affichage</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="priority">Priorité (0 = plus haute)</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Plus le nombre est élevé, plus la catégorie apparaîtra en premier
                </p>
              </div>
              <div className="space-y-2 flex items-end">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="featured" className="cursor-pointer">
                    Mise en avant sur la page d'accueil
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Tags</h3>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="politique, france, élections"
              />
              <p className="text-xs text-muted-foreground">
                Utilisez des tags pour faciliter la recherche et le filtrage
              </p>
            </div>
          </div>


          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <SolarIcon icon="loading" className="size-4 mr-2 animate-spin" />
                  {categoryId ? "Mise à jour..." : "Création..."}
                </>
              ) : (
                <>
                  <SolarIcon icon="check-circle-bold" className="size-4 mr-2" />
                  {categoryId ? "Enregistrer" : "Créer"}
                </>
              )}
            </Button>
          </div>
        </form>

        <ImagePicker
          value={formData.coverImage}
          onChange={(url) => setFormData({ ...formData, coverImage: url })}
          open={isImagePickerOpen}
          onOpenChange={setIsImagePickerOpen}
          title="Sélectionner une image de couverture"
          description="Recherchez sur Pexels ou uploadez votre propre image"
        />
      </CardContent>
    </Card>
  );
}
