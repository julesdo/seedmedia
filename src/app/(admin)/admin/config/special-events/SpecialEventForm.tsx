"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImagePicker } from "@/components/ui/image-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/useDebounce";

interface SpecialEventFormProps {
  eventId?: Id<"specialEvents">;
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SpecialEventForm({
  eventId,
  initialData,
  onSuccess,
  onCancel,
}: SpecialEventFormProps) {
  const createEvent = useMutation(api.admin.createSpecialEvent);
  const updateEvent = useMutation(api.admin.updateSpecialEvent);
  const previewDecisions = useQuery(api.specialEvents.previewMatchingDecisions);
  const categories = useQuery(api.admin.getAllCategoriesForDecisions, {});

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    description: initialData?.description || "",
    shortDescription: initialData?.shortDescription || "",
    coverImage: initialData?.coverImage || "",
    coverImageAlt: initialData?.coverImageAlt || "",
    startDate: initialData?.startDate
      ? new Date(initialData.startDate).toISOString().split("T")[0]
      : "",
    endDate: initialData?.endDate
      ? new Date(initialData.endDate).toISOString().split("T")[0]
      : "",
    region: initialData?.region || "",
    city: initialData?.city || "",
    eventCategory: (initialData?.eventCategory || "") as
      | "blockbuster"
      | "tendance"
      | "insolite"
      | "",
    featured: initialData?.featured ?? false,
    priority: initialData?.priority?.toString() || "0",
    // Règles de cohorte
    categoryIds: initialData?.cohortRules?.categoryIds || [],
    titleKeywords: initialData?.cohortRules?.titleKeywords?.join(", ") || "",
    titleContains: initialData?.cohortRules?.titleContains || "",
    descriptionKeywords: initialData?.cohortRules?.descriptionKeywords?.join(", ") || "",
    descriptionContains: initialData?.cohortRules?.descriptionContains || "",
    decisionType: initialData?.cohortRules?.decisionType || [],
    decider: initialData?.cohortRules?.decider || "",
    sentiment: initialData?.cohortRules?.sentiment || [],
    impactedDomains: initialData?.cohortRules?.impactedDomains?.join(", ") || "",
    decisionCreatedAfter: initialData?.cohortRules?.decisionCreatedAfter
      ? new Date(initialData.cohortRules.decisionCreatedAfter).toISOString().split("T")[0]
      : "",
    decisionCreatedBefore: initialData?.cohortRules?.decisionCreatedBefore
      ? new Date(initialData.cohortRules.decisionCreatedBefore).toISOString().split("T")[0]
      : "",
    operator: (initialData?.cohortRules?.operator || "AND") as "AND" | "OR",
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

  // Construire les règles de cohorte pour la prévisualisation
  const cohortRulesForPreview = useMemo(() => {
    const rules: any = {
      operator: formData.operator,
    };

    if (formData.categoryIds.length > 0) {
      rules.categoryIds = formData.categoryIds;
    }

    if (formData.titleKeywords.trim()) {
      rules.titleKeywords = formData.titleKeywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
    }

    if (formData.titleContains.trim()) {
      rules.titleContains = formData.titleContains.trim();
    }

    if (formData.descriptionKeywords.trim()) {
      rules.descriptionKeywords = formData.descriptionKeywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
    }

    if (formData.descriptionContains.trim()) {
      rules.descriptionContains = formData.descriptionContains.trim();
    }

    if (formData.decisionType.length > 0) {
      rules.decisionType = formData.decisionType;
    }

    if (formData.decider.trim()) {
      rules.decider = formData.decider.trim();
    }

    if (formData.sentiment.length > 0) {
      rules.sentiment = formData.sentiment;
    }

    if (formData.impactedDomains.trim()) {
      rules.impactedDomains = formData.impactedDomains
        .split(",")
        .map((d) => d.trim())
        .filter((d) => d.length > 0);
    }

    if (formData.decisionCreatedAfter) {
      rules.decisionCreatedAfter = new Date(formData.decisionCreatedAfter).getTime();
    }

    if (formData.decisionCreatedBefore) {
      rules.decisionCreatedBefore = new Date(formData.decisionCreatedBefore).getTime();
    }

    return rules;
  }, [formData]);

  // Débouncer la prévisualisation pour éviter trop de requêtes
  const debouncedRules = useDebounce(cohortRulesForPreview, 500);

  // Vérifier si au moins une règle est définie
  const hasRules = useMemo(() => {
    return !!(
      (cohortRulesForPreview.categoryIds && cohortRulesForPreview.categoryIds.length > 0) ||
      (cohortRulesForPreview.titleKeywords && cohortRulesForPreview.titleKeywords.length > 0) ||
      cohortRulesForPreview.titleContains ||
      (cohortRulesForPreview.descriptionKeywords &&
        cohortRulesForPreview.descriptionKeywords.length > 0) ||
      cohortRulesForPreview.descriptionContains ||
      (cohortRulesForPreview.decisionType && cohortRulesForPreview.decisionType.length > 0) ||
      cohortRulesForPreview.decider ||
      (cohortRulesForPreview.sentiment && cohortRulesForPreview.sentiment.length > 0) ||
      (cohortRulesForPreview.impactedDomains &&
        cohortRulesForPreview.impactedDomains.length > 0) ||
      cohortRulesForPreview.decisionCreatedAfter ||
      cohortRulesForPreview.decisionCreatedBefore
    );
  }, [cohortRulesForPreview]);

  // Prévisualiser les décisions correspondantes
  const matchingDecisions = useQuery(
    api.specialEvents.previewMatchingDecisions,
    hasRules ? { cohortRules: debouncedRules, limit: 10 } : "skip"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasRules) {
      toast.error("Au moins une règle de cohorte doit être définie");
      return;
    }

    setIsSubmitting(true);

    try {
      const cohortRules: any = {
        operator: formData.operator,
      };

      if (formData.categoryIds.length > 0) {
        cohortRules.categoryIds = formData.categoryIds;
      }

      if (formData.titleKeywords.trim()) {
        cohortRules.titleKeywords = formData.titleKeywords
          .split(",")
          .map((k) => k.trim())
          .filter((k) => k.length > 0);
      }

      if (formData.titleContains.trim()) {
        cohortRules.titleContains = formData.titleContains.trim();
      }

      if (formData.descriptionKeywords.trim()) {
        cohortRules.descriptionKeywords = formData.descriptionKeywords
          .split(",")
          .map((k) => k.trim())
          .filter((k) => k.length > 0);
      }

      if (formData.descriptionContains.trim()) {
        cohortRules.descriptionContains = formData.descriptionContains.trim();
      }

      if (formData.decisionType.length > 0) {
        cohortRules.decisionType = formData.decisionType;
      }

      if (formData.decider.trim()) {
        cohortRules.decider = formData.decider.trim();
      }

      if (formData.sentiment.length > 0) {
        cohortRules.sentiment = formData.sentiment;
      }

      if (formData.impactedDomains.trim()) {
        cohortRules.impactedDomains = formData.impactedDomains
          .split(",")
          .map((d) => d.trim())
          .filter((d) => d.length > 0);
      }

      if (formData.decisionCreatedAfter) {
        cohortRules.decisionCreatedAfter = new Date(formData.decisionCreatedAfter).getTime();
      }

      if (formData.decisionCreatedBefore) {
        cohortRules.decisionCreatedBefore = new Date(formData.decisionCreatedBefore).getTime();
      }

      if (eventId && updateEvent) {
        await updateEvent({
          eventId,
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
          shortDescription: formData.shortDescription || undefined,
          coverImage: formData.coverImage || undefined,
          coverImageAlt: formData.coverImageAlt || undefined,
          startDate: formData.startDate ? new Date(formData.startDate).getTime() : undefined,
          endDate: formData.endDate ? new Date(formData.endDate).getTime() : undefined,
          region: formData.region || undefined,
          city: formData.city || undefined,
          eventCategory: formData.eventCategory || undefined,
          cohortRules,
          featured: formData.featured,
          priority: parseInt(formData.priority) || 0,
        });
        toast.success("Événement spécial mis à jour avec succès");
      } else if (createEvent) {
        await createEvent({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
          shortDescription: formData.shortDescription || undefined,
          coverImage: formData.coverImage || undefined,
          coverImageAlt: formData.coverImageAlt || undefined,
          startDate: formData.startDate ? new Date(formData.startDate).getTime() : undefined,
          endDate: formData.endDate ? new Date(formData.endDate).getTime() : undefined,
          region: formData.region || undefined,
          city: formData.city || undefined,
          eventCategory: formData.eventCategory || undefined,
          cohortRules,
          featured: formData.featured,
          priority: parseInt(formData.priority) || 0,
        });
        toast.success("Événement spécial créé avec succès");
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
        <CardTitle>
          {eventId ? "Modifier l'événement spécial" : "Nouvel événement spécial"}
        </CardTitle>
        <CardDescription>
          {eventId
            ? "Modifiez les informations de l'événement spécial"
            : "Remplissez le formulaire pour créer un nouvel événement spécial"}
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
                  placeholder="Ex: Municipales 2026"
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
                  placeholder="Description détaillée de l'événement"
                />
              </div>
            </div>
          </div>

          {/* Dates et localisation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Dates et localisation</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="region">Région</Label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="Ex: Île-de-France"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Ex: Paris"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventCategory">Catégorie d'événement</Label>
                <Select
                  value={formData.eventCategory}
                  onValueChange={(value) =>
                    setFormData({ ...formData, eventCategory: value as any })
                  }
                >
                  <SelectTrigger id="eventCategory">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucune</SelectItem>
                    <SelectItem value="blockbuster">Blockbuster</SelectItem>
                    <SelectItem value="tendance">Tendance</SelectItem>
                    <SelectItem value="insolite">Insolite</SelectItem>
                  </SelectContent>
                </Select>
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

          {/* Règles de cohorte */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              Règles de cohorte *
              {!hasRules && (
                <span className="text-destructive text-sm ml-2">
                  (Au moins une règle requise)
                </span>
              )}
            </h3>

            {/* Opérateur logique */}
            <div className="space-y-2">
              <Label htmlFor="operator">Opérateur logique</Label>
              <Select
                value={formData.operator}
                onValueChange={(value) =>
                  setFormData({ ...formData, operator: value as "AND" | "OR" })
                }
              >
                <SelectTrigger id="operator">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">ET (toutes les conditions)</SelectItem>
                  <SelectItem value="OR">OU (au moins une condition)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Catégories */}
            <div className="space-y-2">
              <Label htmlFor="categoryIds">Catégories (optionnel)</Label>
              {categories === undefined ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category._id}
                      type="button"
                      onClick={() => {
                        const isSelected = formData.categoryIds.includes(category._id);
                        setFormData({
                          ...formData,
                          categoryIds: isSelected
                            ? formData.categoryIds.filter((id) => id !== category._id)
                            : [...formData.categoryIds, category._id],
                        });
                      }}
                      className={`
                        px-3 py-1.5 rounded-md text-sm border transition-colors
                        ${
                          formData.categoryIds.includes(category._id)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:bg-muted"
                        }
                      `}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mots-clés dans le titre */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="titleKeywords">Mots-clés dans le titre (séparés par des virgules)</Label>
                <Input
                  id="titleKeywords"
                  value={formData.titleKeywords}
                  onChange={(e) => setFormData({ ...formData, titleKeywords: e.target.value })}
                  placeholder="Ex: élection, municipales, vote"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="titleContains">Texte exact dans le titre</Label>
                <Input
                  id="titleContains"
                  value={formData.titleContains}
                  onChange={(e) => setFormData({ ...formData, titleContains: e.target.value })}
                  placeholder="Ex: Municipales 2026"
                />
              </div>
            </div>

            {/* Mots-clés dans la description */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="descriptionKeywords">
                  Mots-clés dans la description (séparés par des virgules)
                </Label>
                <Input
                  id="descriptionKeywords"
                  value={formData.descriptionKeywords}
                  onChange={(e) =>
                    setFormData({ ...formData, descriptionKeywords: e.target.value })
                  }
                  placeholder="Ex: élection, municipales, vote"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descriptionContains">Texte exact dans la description</Label>
                <Input
                  id="descriptionContains"
                  value={formData.descriptionContains}
                  onChange={(e) =>
                    setFormData({ ...formData, descriptionContains: e.target.value })
                  }
                  placeholder="Ex: Municipales 2026"
                />
              </div>
            </div>

            {/* Type de décision */}
            <div className="space-y-2">
              <Label htmlFor="decisionType">Type de décision (optionnel)</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  "law",
                  "sanction",
                  "tax",
                  "agreement",
                  "policy",
                  "regulation",
                  "crisis",
                  "disaster",
                  "conflict",
                  "discovery",
                  "election",
                  "economic_event",
                  "other",
                ].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      const isSelected = formData.decisionType.includes(type as any);
                      setFormData({
                        ...formData,
                        decisionType: isSelected
                          ? formData.decisionType.filter((t) => t !== type)
                          : [...formData.decisionType, type as any],
                      });
                    }}
                    className={`
                      px-3 py-1.5 rounded-md text-sm border transition-colors
                      ${
                        formData.decisionType.includes(type as any)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:bg-muted"
                      }
                    `}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Décideur */}
            <div className="space-y-2">
              <Label htmlFor="decider">Décideur (optionnel)</Label>
              <Input
                id="decider"
                value={formData.decider}
                onChange={(e) => setFormData({ ...formData, decider: e.target.value })}
                placeholder="Ex: France, Emmanuel Macron"
              />
            </div>

            {/* Sentiment */}
            <div className="space-y-2">
              <Label htmlFor="sentiment">Sentiment (optionnel)</Label>
              <div className="flex flex-wrap gap-2">
                {(["positive", "negative", "neutral"] as const).map((sentiment) => (
                  <button
                    key={sentiment}
                    type="button"
                    onClick={() => {
                      const isSelected = formData.sentiment.includes(sentiment);
                      setFormData({
                        ...formData,
                        sentiment: isSelected
                          ? formData.sentiment.filter((s) => s !== sentiment)
                          : [...formData.sentiment, sentiment],
                      });
                    }}
                    className={`
                      px-3 py-1.5 rounded-md text-sm border transition-colors
                      ${
                        formData.sentiment.includes(sentiment)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:bg-muted"
                      }
                    `}
                  >
                    {sentiment}
                  </button>
                ))}
              </div>
            </div>

            {/* Domaines impactés (déprécié) */}
            <div className="space-y-2">
              <Label htmlFor="impactedDomains">
                Domaines impactés (séparés par des virgules) ⚠️ Déprécié
              </Label>
              <Input
                id="impactedDomains"
                value={formData.impactedDomains}
                onChange={(e) => setFormData({ ...formData, impactedDomains: e.target.value })}
                placeholder="Ex: économie, politique, énergie"
              />
            </div>

            {/* Dates de création */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="decisionCreatedAfter">Décisions créées après</Label>
                <Input
                  id="decisionCreatedAfter"
                  type="date"
                  value={formData.decisionCreatedAfter}
                  onChange={(e) =>
                    setFormData({ ...formData, decisionCreatedAfter: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="decisionCreatedBefore">Décisions créées avant</Label>
                <Input
                  id="decisionCreatedBefore"
                  type="date"
                  value={formData.decisionCreatedBefore}
                  onChange={(e) =>
                    setFormData({ ...formData, decisionCreatedBefore: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Prévisualisation des décisions correspondantes */}
          {hasRules && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Prévisualisation des décisions correspondantes
              </h3>
              {matchingDecisions === undefined ? (
                <div className="space-y-2">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : matchingDecisions.length === 0 ? (
                <div className="p-4 border rounded-lg text-center text-muted-foreground">
                  Aucune décision ne correspond aux règles définies
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {matchingDecisions.length} décision{matchingDecisions.length > 1 ? "s" : ""}{" "}
                    correspond{matchingDecisions.length > 1 ? "ent" : ""} aux règles
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {matchingDecisions.map((decision) => (
                      <div
                        key={decision._id}
                        className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="font-medium text-sm">{decision.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {decision.description}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {decision.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {decision.decider}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || !hasRules}>
              {isSubmitting ? (
                <>
                  <SolarIcon icon="loading" className="size-4 mr-2 animate-spin" />
                  {eventId ? "Mise à jour..." : "Création..."}
                </>
              ) : (
                <>
                  <SolarIcon icon="check-circle-bold" className="size-4 mr-2" />
                  {eventId ? "Enregistrer" : "Créer"}
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

