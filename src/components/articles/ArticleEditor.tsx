"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CredibilityIndicator } from "@/components/credibility/CredibilityIndicator";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { useCredibilityPoints } from "@/hooks/useCredibilityPoints";
import { CategoryPicker } from "@/components/articles/CategoryPicker";
import { FormField } from "@/components/ui/form-field";
import { Stepper } from "@/components/ui/stepper";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { TElement } from "platejs";

const ARTICLE_TYPES = [
  { value: "scientific", label: "Scientifique" },
  { value: "expert", label: "Expert" },
  { value: "opinion", label: "Opinion" },
  { value: "news", label: "Actualité" },
  { value: "tutorial", label: "Tutoriel" },
  { value: "other", label: "Autre" },
] as const;

interface ArticleEditorProps {
  // Données de l'article
  title: string;
  summary: string;
  coverImage: string | null;
  tags: string[];
  categoryIds: string[];
  categorySlugs: string[];
  articleType: "scientific" | "expert" | "opinion" | "news" | "tutorial" | "other";
  status: "draft" | "pending" | "published";
  these: string;
  content: string;
  counterArguments: string[];
  conclusion: string;
  sources: string[];
  
  // Handlers
  onTitleChange: (value: string) => void;
  onSummaryChange: (value: string) => void;
  onCoverImageChange: (value: string | null) => void;
  onTagsChange: (tags: string[]) => void;
  onCategoryIdsChange: (ids: string[]) => void;
  onCategorySlugsChange: (slugs: string[]) => void;
  onArticleTypeChange: (value: "scientific" | "expert" | "opinion" | "news" | "tutorial" | "other") => void;
  onStatusChange: (value: "draft" | "pending" | "published") => void;
  onTheseChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onCounterArgumentsChange: (args: string[]) => void;
  onConclusionChange: (value: string) => void;
  onSourcesChange: (sources: string[]) => void;
  
  // Autres
  availableCategories?: Array<{ _id?: string; slug: string; name: string; icon?: string }>;
  validationErrors: string[];
  canPublish: boolean;
  isPublished?: boolean;
  onSubmit: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  loading?: boolean;
  articleId?: string;
}

// Helper pour extraire les erreurs de validation par champ
function getFieldError(validationErrors: string[], fieldName: string, showErrors: boolean): string | undefined {
  if (!showErrors) return undefined;
  const error = validationErrors.find((err) => 
    err.toLowerCase().includes(fieldName.toLowerCase())
  );
  return error;
}

export function ArticleEditor({
  title,
  summary,
  coverImage,
  tags,
  categoryIds,
  categorySlugs,
  articleType,
  status,
  these,
  content,
  counterArguments,
  conclusion,
  sources,
  onTitleChange,
  onSummaryChange,
  onCoverImageChange,
  onTagsChange,
  onCategoryIdsChange,
  onCategorySlugsChange,
  onArticleTypeChange,
  onStatusChange,
  onTheseChange,
  onContentChange,
  onCounterArgumentsChange,
  onConclusionChange,
  onSourcesChange,
  availableCategories = [],
  validationErrors,
  canPublish,
  isPublished = false,
  onSubmit,
  onSave,
  onDelete,
  loading = false,
  articleId,
}: ArticleEditorProps) {
  const credibilityPoints = useCredibilityPoints();
  
  const [newTag, setNewTag] = React.useState("");
  const [newSource, setNewSource] = React.useState("");
  const [newCounterArgument, setNewCounterArgument] = React.useState("");
  const [showValidationErrors, setShowValidationErrors] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("content");
  const [autoAdvance, setAutoAdvance] = React.useState(true); // Auto-avancement intelligent
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false); // État de soumission en cours

  // Calculer la progression par étape - logique séquentielle (DOIT être défini AVANT les useEffect qui l'utilisent)
  const stepProgress = React.useMemo(() => {
    const contentText = extractTextFromPlateValue(JSON.parse(content || "[]") as TElement[]);
    
    // Étape 1: Contenu (titre, résumé, développement)
    const contentStepCompleted = title.trim() && summary.trim() && contentText.trim();
    
    // Étape 2: Métadonnées - complétée seulement si l'étape 1 est complétée
    // (Les métadonnées sont optionnelles, donc si l'étape 1 est faite, on peut considérer l'étape 2 comme accessible)
    const metadataStepCompleted = contentStepCompleted;
    
    // Étape 3: Structure - complétée seulement si les étapes 1 et 2 sont complétées
    const structureStepCompleted = 
      contentStepCompleted && 
      metadataStepCompleted &&
      these.trim() && 
      sources.length >= 2 && 
      counterArguments.length >= 1 && 
      conclusion.trim();
    
    return {
      content: contentStepCompleted,
      metadata: metadataStepCompleted,
      structure: structureStepCompleted,
    };
  }, [title, summary, content, these, sources.length, counterArguments.length, conclusion]);

  // Auto-avancement intelligent : passer à l'étape suivante quand l'étape actuelle est complétée
  React.useEffect(() => {
    if (!autoAdvance) return;
    
    if (activeTab === "content" && stepProgress.content && !stepProgress.metadata) {
      // Si le contenu est complété, on peut suggérer de passer aux métadonnées
      // Mais on ne force pas, on laisse l'utilisateur décider
    } else if (activeTab === "metadata" && stepProgress.metadata && !stepProgress.structure) {
      // Même chose pour les métadonnées
    }
  }, [activeTab, stepProgress, autoAdvance]);

  // Gérer le changement d'étape avec validation
  const handleStepChange = (stepId: string) => {
    const steps = [
      { id: "content", completed: stepProgress.content, label: "Contenu" },
      { id: "metadata", completed: stepProgress.metadata, label: "Métadonnées" },
      { id: "structure", completed: stepProgress.structure, label: "Structure" },
    ];
    
    const currentIndex = steps.findIndex((s) => s.id === activeTab);
    const targetIndex = steps.findIndex((s) => s.id === stepId);
    
    // On peut toujours revenir en arrière
    if (targetIndex < currentIndex) {
      setActiveTab(stepId);
      return;
    }
    
    // On peut rester sur l'étape actuelle
    if (targetIndex === currentIndex) {
      return;
    }
    
    // Pour avancer, toutes les étapes précédentes doivent être complétées
    for (let i = 0; i < targetIndex; i++) {
      if (!steps[i].completed) {
        setShowValidationErrors(true);
        toast.error(`Veuillez compléter l'étape "${steps[i].label}" avant de continuer`);
        return;
      }
    }
    
    setActiveTab(stepId);
  };

  // Fonction pour vérifier si un champ est complété (avec feedback visuel)
  const isFieldCompleted = (value: string | string[], minLength: number = 1): boolean => {
    if (Array.isArray(value)) {
      return value.length >= minLength;
    }
    return value.trim().length >= minLength;
  };

  // Validation complète : TOUS les champs obligatoires doivent être remplis pour sauvegarder
  const canSave = React.useMemo(() => {
    if (!title.trim()) return false;
    if (!summary.trim()) return false;
    const contentText = extractTextFromPlateValue(JSON.parse(content || "[]") as TElement[]);
    if (!contentText.trim()) return false;
    if (!these.trim()) return false;
    if (sources.length < 2) return false;
    if (counterArguments.length < 1) return false;
    if (!conclusion.trim()) return false;
    return true;
  }, [title, summary, content, these, sources.length, counterArguments.length, conclusion]);

  // Afficher les erreurs uniquement après tentative de soumission
  const handleSubmitAttempt = async () => {
    // Empêcher les soumissions multiples
    if (isSubmitting || loading) {
      return;
    }

    if (!canSave) {
      setShowValidationErrors(true);
      toast.error("Veuillez compléter tous les champs obligatoires avant de soumettre", {
        description: `${validationErrors.length} champ(s) manquant(s)`,
      });
      return;
    }

    // Si le statut est "pending", on soumet pour validation
    if (status === "pending") {
      if (!canPublish) {
        setShowValidationErrors(true);
        toast.error("Veuillez compléter tous les champs obligatoires avant de soumettre", {
          description: `${validationErrors.length} champ(s) manquant(s)`,
        });
        return;
      }
    }

    setIsSubmitting(true);
    setShowValidationErrors(true);
    
    // Appeler onSubmit et réinitialiser l'état après
    try {
      await Promise.resolve(onSubmit());
    } catch (error) {
      // L'erreur est déjà gérée par onSubmit
      console.error("Erreur lors de la soumission:", error);
    } finally {
      // Petit délai pour que l'utilisateur voie le feedback
      setTimeout(() => {
        setIsSubmitting(false);
      }, 500);
    }
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

  const addSource = () => {
    if (newSource.trim()) {
      onSourcesChange([...sources, newSource.trim()]);
      setNewSource("");
    }
  };

  const removeSource = (index: number) => {
    onSourcesChange(sources.filter((_, i) => i !== index));
  };

  const addCounterArgument = () => {
    if (newCounterArgument.trim()) {
      onCounterArgumentsChange([...counterArguments, newCounterArgument.trim()]);
      setNewCounterArgument("");
    }
  };

  const removeCounterArgument = (index: number) => {
    onCounterArgumentsChange(counterArguments.filter((_, i) => i !== index));
  };


  return (
    <>
      <div className="h-[calc(100vh-4rem-3rem)] flex flex-col overflow-hidden -m-6">
      {/* Alerts de validation - uniquement après tentative */}
      {showValidationErrors && validationErrors.length > 0 && status === "pending" && (
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
                  placeholder="Titre de votre article"
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
                {/* Badge d'état */}
                <Badge 
                  variant={
                    status === "published" ? "default" :
                    status === "pending" ? "secondary" :
                    "outline"
                  }
                  className="h-7 px-2.5 text-xs font-medium"
                >
                  {status === "published" && (
                    <>
                      <SolarIcon icon="check-circle-bold" className="h-3 w-3 mr-1" />
                      Publié
                    </>
                  )}
                  {status === "pending" && (
                    <>
                      <SolarIcon icon="clock-circle-bold" className="h-3 w-3 mr-1" />
                      En attente
                    </>
                  )}
                  {status === "draft" && (
                    <>
                      <SolarIcon icon="file-bold" className="h-3 w-3 mr-1" />
                      Brouillon
                    </>
                  )}
                </Badge>

                {onDelete && articleId && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteDialogOpen(true);
                    }}
                    disabled={loading || deleteLoading || isSubmitting}
                    className="h-8 px-3"
                  >
                    <SolarIcon icon="trash-bin-trash-bold" className="h-3.5 w-3.5 mr-2" />
                    Supprimer
                  </Button>
                )}
                
                {/* Bouton principal selon le statut */}
                <Button
                  onClick={handleSubmitAttempt}
                  disabled={loading || isSubmitting || !canSave || (status === "pending" && !canPublish)}
                  variant={status === "pending" ? "default" : status === "published" ? "default" : "outline"}
                  size="default"
                  className="min-w-[140px]"
                >
                  {loading || isSubmitting ? (
                    <>
                      <SolarIcon icon="spinner-circle" className="h-4 w-4 mr-2 animate-spin" />
                      {status === "pending" ? "Soumission..." : status === "published" ? "Mise à jour..." : "Sauvegarde..."}
                    </>
                  ) : status === "pending" ? (
                    <>
                      <SolarIcon icon="check-circle-bold" className="h-4 w-4 mr-2" />
                      Soumettre
                      {!canPublish && showValidationErrors && (
                        <Badge variant="destructive" className="ml-2">
                          {validationErrors.length} erreur{validationErrors.length > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </>
                  ) : status === "published" ? (
                    <>
                      <SolarIcon icon="check-circle-bold" className="h-4 w-4 mr-2" />
                      Mettre à jour
                    </>
                  ) : (
                    <>
                      <SolarIcon icon="file-bold" className="h-4 w-4 mr-2" />
                      Sauvegarder
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
                getFieldError(validationErrors, "développement", showValidationErrors) && "border-destructive",
                (() => {
                  const contentText = extractTextFromPlateValue(JSON.parse(content || "[]") as TElement[]);
                  return isFieldCompleted(contentText, 100) && !getFieldError(validationErrors, "développement", showValidationErrors) && "border-primary/50";
                })()
              )}>
                <PlateEditorWrapper
                  value={content}
                  onChange={onContentChange}
                  placeholder="Commencez à rédiger votre article..."
                />
              </div>
              {(() => {
                const contentText = extractTextFromPlateValue(JSON.parse(content || "[]") as TElement[]);
                return isFieldCompleted(contentText, 100) && (
                  <div className="absolute right-2 top-2 z-10">
                    <SolarIcon icon="check-circle-bold" className="h-4 w-4 text-primary bg-background rounded-full" />
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Colonne droite : Panneau sticky avec métadonnées et structure */}
        <aside className="hidden lg:flex w-[400px] border-l bg-background shrink-0 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
              {/* Résumé */}
              <Card className="border border-border/60 bg-card">
                <CardHeader className="pb-1.5 pt-2">
                  <CardTitle className="text-xs font-semibold">Résumé (TL;DR)</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="relative">
                    <Textarea
                      value={summary}
                      onChange={(e) => onSummaryChange(e.target.value)}
                      placeholder="Résumé court (150-300 mots)"
                      rows={2}
                      className={cn(
                        "pr-8 text-xs resize-none h-auto",
                        getFieldError(validationErrors, "résumé", showValidationErrors) && "border-destructive",
                        isFieldCompleted(summary, 50) && !getFieldError(validationErrors, "résumé", showValidationErrors) && "border-primary/50"
                      )}
                    />
                    {isFieldCompleted(summary, 50) && (
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
                    <Label htmlFor="articleType" className="text-xs">Type d'article</Label>
                    <Select
                      value={articleType}
                      onValueChange={(value: any) => onArticleTypeChange(value)}
                    >
                      <SelectTrigger id="articleType" className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ARTICLE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="status" className="text-xs">Statut</Label>
                    <Select
                      value={status}
                      onValueChange={(value: any) => onStatusChange(value)}
                      disabled={isPublished}
                    >
                      <SelectTrigger id="status" className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="pending" disabled={!canPublish}>
                          Soumettre
                          {!canPublish && " (incomplet)"}
                        </SelectItem>
                        {isPublished && (
                          <SelectItem value="published">Publié</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {status === "pending" && canPublish && (
                      <CredibilityIndicator 
                        points={credibilityPoints.articlePublished} 
                        action="Gagnez" 
                        variant="compact"
                        className="mt-1"
                      />
                    )}
                  </div>
                </div>

                <Separator className="my-2" />

                <div className="space-y-1">
                  <Label className="text-xs">Image de couverture</Label>
                  <ImageUpload
                    value={coverImage}
                    onChange={onCoverImageChange}
                    variant="cover"
                    aspectRatio={16 / 9}
                    label=""
                    description=""
                  />
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

              {/* Section Structure */}
              <Card className="border border-border/60 bg-card">
                <CardHeader className="pb-1.5 pt-2">
                  <CardTitle className="text-xs font-semibold">Structure obligatoire</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pb-2">
                <FormField
                  label="Thèse / Problème"
                  required
                  error={getFieldError(validationErrors, "thèse", showValidationErrors)}
                  description=""
                >
                  <div className="relative">
                    <Textarea
                      value={these}
                      onChange={(e) => onTheseChange(e.target.value)}
                      placeholder="Formulez la thèse centrale..."
                      rows={2}
                      className={cn(
                        "pr-8 text-xs h-auto",
                        getFieldError(validationErrors, "thèse", showValidationErrors) && "border-destructive",
                        isFieldCompleted(these, 20) && !getFieldError(validationErrors, "thèse", showValidationErrors) && "border-primary/50"
                      )}
                    />
                    {isFieldCompleted(these, 20) && (
                      <div className="absolute right-2 top-2">
                        <SolarIcon icon="check-circle-bold" className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </div>
                </FormField>

                <Separator className="my-2" />

                <FormField
                  label="Sources"
                  required
                  error={getFieldError(validationErrors, "source", showValidationErrors)}
                  description=""
                >
                  <div className="space-y-1.5">
                    {sources.length > 0 && (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto border rounded-lg p-1.5 bg-muted/30">
                        {sources.map((source, index) => (
                          <div key={index} className="flex items-center gap-1.5">
                            <Input value={source} readOnly className="flex-1 bg-background h-7 text-xs" />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSource(index)}
                              className="shrink-0 h-7 w-7"
                            >
                              <SolarIcon icon="trash-bin-trash-bold" className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-1.5">
                      <Input
                        value={newSource}
                        onChange={(e) => setNewSource(e.target.value)}
                        placeholder="URL ou référence"
                        className="h-8 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSource();
                          }
                        }}
                      />
                      <Button type="button" onClick={addSource} variant="outline" size="sm" className="shrink-0 h-8 px-2">
                        <SolarIcon icon="add-circle-bold" className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {sources.length < 2 && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <SolarIcon icon="info-circle-bold" className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {2 - sources.length} source(s) requise(s)
                        </span>
                      </div>
                    )}
                  </div>
                </FormField>

                <Separator className="my-2" />

                <FormField
                  label="Contre-arguments"
                  required
                  error={getFieldError(validationErrors, "contre-argument", showValidationErrors)}
                  description=""
                >
                  <div className="space-y-1.5">
                    {counterArguments.length > 0 && (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto border rounded-lg p-1.5 bg-muted/30">
                        {counterArguments.map((arg, index) => (
                          <div key={index} className="flex items-start gap-1.5">
                            <Textarea value={arg} readOnly rows={2} className="flex-1 bg-background text-xs h-auto" />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeCounterArgument(index)}
                              className="shrink-0 h-7 w-7 mt-0.5"
                            >
                              <SolarIcon icon="trash-bin-trash-bold" className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-1.5">
                      <Textarea
                        value={newCounterArgument}
                        onChange={(e) => setNewCounterArgument(e.target.value)}
                        placeholder="Contre-argument..."
                        rows={2}
                        className="text-xs h-auto"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                            addCounterArgument();
                          }
                        }}
                      />
                      <Button type="button" onClick={addCounterArgument} variant="outline" size="sm" className="shrink-0 h-8 px-2">
                        <SolarIcon icon="add-circle-bold" className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {counterArguments.length < 1 && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <SolarIcon icon="info-circle-bold" className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          1 contre-argument requis
                        </span>
                      </div>
                    )}
                  </div>
                </FormField>

                <Separator className="my-2" />

                <FormField
                  label="Conclusion"
                  required
                  error={getFieldError(validationErrors, "conclusion", showValidationErrors)}
                  description=""
                >
                  <div className="relative">
                    <Textarea
                      value={conclusion}
                      onChange={(e) => onConclusionChange(e.target.value)}
                      placeholder="Résumez les points clés..."
                      rows={2}
                      className={cn(
                        "pr-8 text-xs h-auto",
                        getFieldError(validationErrors, "conclusion", showValidationErrors) && "border-destructive",
                        isFieldCompleted(conclusion, 20) && !getFieldError(validationErrors, "conclusion", showValidationErrors) && "border-primary/50"
                      )}
                    />
                    {isFieldCompleted(conclusion, 20) && (
                      <div className="absolute right-2 top-2">
                        <SolarIcon icon="check-circle-bold" className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </div>
                </FormField>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>

      {/* Modale de confirmation de suppression - en dehors de la div principale pour éviter les problèmes d'overflow */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l'article</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.
              {status === "published" && (
                <span className="block mt-2 text-destructive font-medium">
                  ⚠️ Cet article est publié. Sa suppression le retirera définitivement de la plateforme.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteLoading}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!onDelete) return;
                setDeleteLoading(true);
                try {
                  await onDelete();
                  setDeleteDialogOpen(false);
                } catch (error: any) {
                  toast.error(error.message || "Erreur lors de la suppression de l'article");
                } finally {
                  setDeleteLoading(false);
                }
              }}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <SolarIcon icon="spinner-circle" className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <SolarIcon icon="trash-bin-trash-bold" className="h-4 w-4 mr-2" />
                  Supprimer définitivement
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

