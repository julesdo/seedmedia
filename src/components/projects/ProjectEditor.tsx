"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { PlateEditorWrapper, extractTextFromPlateValue } from "@/components/articles/PlateEditorWrapper";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { CategoryPicker } from "@/components/articles/CategoryPicker";
import { FormField } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { TElement } from "platejs";

const STAGE_OPTIONS = [
  { value: "idea", label: "Idée" },
  { value: "prototype", label: "Prototype" },
  { value: "beta", label: "Bêta" },
  { value: "production", label: "Production" },
] as const;

const LINK_TYPES = [
  { value: "website", label: "Site web" },
  { value: "github", label: "GitHub" },
  { value: "demo", label: "Démo" },
  { value: "documentation", label: "Documentation" },
  { value: "other", label: "Autre" },
] as const;

interface ProjectEditorProps {
  // Données du projet
  title: string;
  summary: string;
  description: string;
  tags: string[];
  categoryIds: string[];
  categorySlugs: string[];
  orgId?: string;
  stage: "idea" | "prototype" | "beta" | "production";
  openSource: boolean;
  images: string[];
  links: Array<{ type: string; url: string }>;
  impactMetrics: Array<{ label: string; value: string }>;
  
  // Handlers
  onTitleChange: (value: string) => void;
  onSummaryChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTagsChange: (tags: string[]) => void;
  onCategoryIdsChange: (ids: string[]) => void;
  onCategorySlugsChange: (slugs: string[]) => void;
  onOrgIdChange: (value: string | undefined) => void;
  onStageChange: (value: "idea" | "prototype" | "beta" | "production") => void;
  onOpenSourceChange: (value: boolean) => void;
  onImagesChange: (images: string[]) => void;
  onLinksChange: (links: Array<{ type: string; url: string }>) => void;
  onImpactMetricsChange: (metrics: Array<{ label: string; value: string }>) => void;
  
  // Autres
  availableCategories?: Array<{ _id?: string; slug: string; name: string; icon?: string }>;
  userOrganizations?: Array<{ _id: string; name: string }>;
  validationErrors: string[];
  canSave: boolean;
  onSubmit: () => void;
  onSave?: () => void;
  loading?: boolean;
}

// Helper pour extraire les erreurs de validation par champ
function getFieldError(validationErrors: string[], fieldName: string, showErrors: boolean): string | undefined {
  if (!showErrors) return undefined;
  const error = validationErrors.find((err) => 
    err.toLowerCase().includes(fieldName.toLowerCase())
  );
  return error;
}

export function ProjectEditor({
  title,
  summary,
  description,
  tags,
  categoryIds,
  categorySlugs,
  orgId,
  stage,
  openSource,
  images,
  links,
  impactMetrics,
  onTitleChange,
  onSummaryChange,
  onDescriptionChange,
  onTagsChange,
  onCategoryIdsChange,
  onCategorySlugsChange,
  onOrgIdChange,
  onStageChange,
  onOpenSourceChange,
  onImagesChange,
  onLinksChange,
  onImpactMetricsChange,
  availableCategories = [],
  userOrganizations = [],
  validationErrors,
  canSave,
  onSubmit,
  onSave,
  loading = false,
}: ProjectEditorProps) {
  const [newTag, setNewTag] = React.useState("");
  const [newLinkType, setNewLinkType] = React.useState("website");
  const [newLinkUrl, setNewLinkUrl] = React.useState("");
  const [newMetricLabel, setNewMetricLabel] = React.useState("");
  const [newMetricValue, setNewMetricValue] = React.useState("");
  const [showValidationErrors, setShowValidationErrors] = React.useState(false);

  // Fonction pour vérifier si un champ est complété
  const isFieldCompleted = (value: string | string[], minLength: number = 1): boolean => {
    if (Array.isArray(value)) {
      return value.length >= minLength;
    }
    return value.trim().length >= minLength;
  };

  // Afficher les erreurs uniquement après tentative de soumission
  const handleSubmitAttempt = () => {
    if (!canSave) {
      setShowValidationErrors(true);
      toast.error("Veuillez compléter tous les champs obligatoires avant de soumettre", {
        description: `${validationErrors.length} champ(s) manquant(s)`,
      });
      return;
    }
    setShowValidationErrors(true);
    onSubmit();
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onTagsChange([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    onTagsChange(tags.filter((t) => t !== tag));
  };

  const addLink = () => {
    if (newLinkUrl.trim()) {
      onLinksChange([...links, { type: newLinkType, url: newLinkUrl.trim() }]);
      setNewLinkUrl("");
    }
  };

  const removeLink = (index: number) => {
    onLinksChange(links.filter((_, i) => i !== index));
  };

  const addMetric = () => {
    if (newMetricLabel.trim() && newMetricValue.trim()) {
      onImpactMetricsChange([
        ...impactMetrics,
        { label: newMetricLabel.trim(), value: newMetricValue.trim() },
      ]);
      setNewMetricLabel("");
      setNewMetricValue("");
    }
  };

  const removeMetric = (index: number) => {
    onImpactMetricsChange(impactMetrics.filter((_, i) => i !== index));
  };

  const addImage = (url: string | null) => {
    if (url && !images.includes(url)) {
      onImagesChange([...images, url]);
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="h-[calc(100vh-4rem-3rem)] flex flex-col overflow-hidden -m-6">
      {/* Alerts de validation - uniquement après tentative */}
      {showValidationErrors && validationErrors.length > 0 && (
        <div className="px-4 md:px-6 lg:px-8 pt-4 pb-2 shrink-0">
          <Alert variant="destructive">
            <SolarIcon icon="danger-triangle-bold" className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-1">Veuillez compléter les champs suivants :</div>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Layout en 2 colonnes : Éditeur à gauche, Panneau sticky à droite */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Colonne gauche : Éditeur */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 flex flex-col space-y-3 min-h-0 overflow-hidden px-4 md:px-6 lg:px-8 pt-4">
            {/* Titre et boutons d'action */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative flex-1">
                <Input
                  value={title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  placeholder="Titre de votre projet"
                  className={cn(
                    "pr-8 text-base font-semibold h-9",
                    getFieldError(validationErrors, "titre", showValidationErrors) && "border-destructive",
                    isFieldCompleted(title) && !getFieldError(validationErrors, "titre", showValidationErrors) && "border-primary/50"
                  )}
                />
                {isFieldCompleted(title) && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <SolarIcon icon="check-circle-bold" className="h-4 w-4 text-primary" />
                  </div>
                )}
              </div>
              
              {/* Boutons d'action */}
              <div className="flex items-center gap-2 shrink-0">
                {onSave && (
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => {
                      if (!canSave) {
                        setShowValidationErrors(true);
                        toast.error("Veuillez compléter tous les champs obligatoires avant de sauvegarder.");
                        return;
                      }
                      onSave();
                    }}
                    disabled={loading || !canSave}
                  >
                    <SolarIcon icon="file-bold" className="h-4 w-4 mr-2" />
                    Enregistrer
                  </Button>
                )}
                <Button
                  onClick={handleSubmitAttempt}
                  disabled={loading || !canSave}
                  variant="default"
                  size="default"
                >
                  {loading ? (
                    <>
                      <SolarIcon icon="spinner-circle" className="h-4 w-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <SolarIcon icon="check-circle-bold" className="h-4 w-4 mr-2" />
                      Créer le projet
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Éditeur de contenu - sans label, prend tout l'espace disponible */}
            <div className="relative flex-1 min-h-0 overflow-hidden pb-4">
              <div className={cn(
                "border rounded-lg overflow-hidden transition-colors h-full flex flex-col",
                "bg-neutral-50 dark:bg-neutral-900/50",
                "shadow-md",
                getFieldError(validationErrors, "description", showValidationErrors) && "border-destructive",
                (() => {
                  const contentText = extractTextFromPlateValue(JSON.parse(description || "[]") as TElement[]);
                  return isFieldCompleted(contentText, 50) && !getFieldError(validationErrors, "description", showValidationErrors) && "border-primary/50";
                })()
              )}>
                <PlateEditorWrapper
                  value={description}
                  onChange={onDescriptionChange}
                  placeholder="Décrivez votre projet en détail..."
                />
              </div>
              {(() => {
                const contentText = extractTextFromPlateValue(JSON.parse(description || "[]") as TElement[]);
                return isFieldCompleted(contentText, 50) && (
                  <div className="absolute right-2 top-2 z-10">
                    <SolarIcon icon="check-circle-bold" className="h-4 w-4 text-primary bg-background rounded-full" />
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Colonne droite : Panneau sticky avec métadonnées */}
        <aside className="hidden lg:flex w-[400px] border-l bg-background shrink-0 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
              {/* Résumé */}
              <Card className="border border-border/60 bg-card">
                <CardHeader className="pb-1.5 pt-2">
                  <CardTitle className="text-xs font-semibold">Résumé</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="relative">
                    <Textarea
                      value={summary}
                      onChange={(e) => onSummaryChange(e.target.value)}
                      placeholder="Résumé court du projet"
                      rows={2}
                      className={cn(
                        "pr-8 text-xs resize-none h-auto",
                        getFieldError(validationErrors, "résumé", showValidationErrors) && "border-destructive",
                        isFieldCompleted(summary, 20) && !getFieldError(validationErrors, "résumé", showValidationErrors) && "border-primary/50"
                      )}
                    />
                    {isFieldCompleted(summary, 20) && (
                      <div className="absolute right-2 top-2">
                        <SolarIcon icon="check-circle-bold" className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Section Métadonnées */}
              <Card className="border border-border/60 bg-card">
                <CardHeader className="pb-1.5 pt-2">
                  <CardTitle className="text-xs font-semibold">Métadonnées</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pb-2">
                  <div className="grid grid-cols-1 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="orgId" className="text-xs">Organisation</Label>
                      <Select
                        value={orgId || "__none__"}
                        onValueChange={(value) => onOrgIdChange(value === "__none__" ? undefined : value)}
                      >
                        <SelectTrigger id="orgId" className="h-8 text-xs">
                          <SelectValue placeholder="Aucune" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__" className="text-xs">Aucune</SelectItem>
                          {userOrganizations.map((org) => (
                            <SelectItem key={org._id} value={org._id} className="text-xs">
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="stage" className="text-xs">Stade du projet</Label>
                      <Select
                        value={stage}
                        onValueChange={(value: any) => onStageChange(value)}
                      >
                        <SelectTrigger id="stage" className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STAGE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value} className="text-xs">
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="openSource"
                        checked={openSource}
                        onChange={(e) => onOpenSourceChange(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="openSource" className="text-xs cursor-pointer">
                        Projet open source
                      </Label>
                    </div>
                  </div>

                  <Separator className="my-2" />

                  <CategoryPicker
                    availableCategories={availableCategories}
                    selectedCategoryIds={categoryIds}
                    selectedCategorySlugs={categorySlugs}
                    onCategoryIdsChange={onCategoryIdsChange}
                    onCategorySlugsChange={onCategorySlugsChange}
                    label="Catégories"
                    description=""
                  />

                  <Separator className="my-2" />

                  <div className="space-y-1.5">
                    <Label htmlFor="tags" className="text-xs">Tags</Label>
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-0.5 text-xs py-0.5 px-1.5">
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-0.5 hover:text-destructive"
                          >
                            <SolarIcon icon="close-circle-bold" className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <Input
                        id="tags"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Ajouter un tag"
                        className="h-8 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                      />
                      <Button type="button" onClick={addTag} variant="outline" size="sm" className="h-8 px-2">
                        <SolarIcon icon="add-circle-bold" className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section Images */}
              <Card className="border border-border/60 bg-card">
                <CardHeader className="pb-1.5 pt-2">
                  <CardTitle className="text-xs font-semibold">Images</CardTitle>
                </CardHeader>
                <CardContent className="pb-2 space-y-1.5">
                  {images.length > 0 && (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Image ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeImage(index)}
                          >
                            <SolarIcon icon="trash-bin-trash-bold" className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <ImageUpload
                    value={null}
                    onChange={addImage}
                    label=""
                    description=""
                    variant="default"
                  />
                </CardContent>
              </Card>

              {/* Section Liens */}
              <Card className="border border-border/60 bg-card">
                <CardHeader className="pb-1.5 pt-2">
                  <CardTitle className="text-xs font-semibold">Liens externes</CardTitle>
                </CardHeader>
                <CardContent className="pb-2 space-y-1.5">
                  {links.length > 0 && (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto border rounded-lg p-1.5 bg-muted/30">
                      {links.map((link, index) => (
                        <div key={index} className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                            {LINK_TYPES.find((t) => t.value === link.type)?.label || link.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground truncate flex-1">
                            {link.url}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={() => removeLink(index)}
                          >
                            <SolarIcon icon="trash-bin-trash-bold" className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-1.5">
                    <Select value={newLinkType} onValueChange={setNewLinkType}>
                      <SelectTrigger className="h-8 text-xs w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LINK_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value} className="text-xs">
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      placeholder="URL"
                      className="h-8 text-xs flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addLink();
                        }
                      }}
                    />
                    <Button type="button" onClick={addLink} variant="outline" size="sm" className="h-8 px-2">
                      <SolarIcon icon="add-circle-bold" className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Section Métriques */}
              <Card className="border border-border/60 bg-card">
                <CardHeader className="pb-1.5 pt-2">
                  <CardTitle className="text-xs font-semibold">Métriques d'impact</CardTitle>
                </CardHeader>
                <CardContent className="pb-2 space-y-1.5">
                  {impactMetrics.length > 0 && (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto border rounded-lg p-1.5 bg-muted/30">
                      {impactMetrics.map((metric, index) => (
                        <div key={index} className="flex items-center gap-1.5">
                          <span className="text-xs font-medium">{metric.label}:</span>
                          <span className="text-xs text-muted-foreground">{metric.value}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 ml-auto shrink-0"
                            onClick={() => removeMetric(index)}
                          >
                            <SolarIcon icon="trash-bin-trash-bold" className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-1.5">
                    <Input
                      value={newMetricLabel}
                      onChange={(e) => setNewMetricLabel(e.target.value)}
                      placeholder="Label"
                      className="h-8 text-xs"
                    />
                    <Input
                      value={newMetricValue}
                      onChange={(e) => setNewMetricValue(e.target.value)}
                      placeholder="Valeur"
                      className="h-8 text-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addMetric();
                        }
                      }}
                    />
                    <Button type="button" onClick={addMetric} variant="outline" size="sm" className="h-8 px-2">
                      <SolarIcon icon="add-circle-bold" className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </aside>
      </div>
    </div>
  );
}

