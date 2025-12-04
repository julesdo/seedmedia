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
import { PlateEditorWrapper, extractTextFromPlateValue } from "@/components/articles/PlateEditorWrapper";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { CategoryPicker } from "@/components/articles/CategoryPicker";
import { FormField } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { TElement } from "platejs";

const ACTION_TYPES = [
  { value: "petition", label: "Pétition" },
  { value: "contribution", label: "Contribution" },
  { value: "event", label: "Événement" },
] as const;

interface ActionEditorProps {
  // Données de l'action
  title: string;
  summary: string;
  description: string;
  tags: string[];
  categoryIds: string[];
  categorySlugs: string[];
  actionType: "petition" | "contribution" | "event";
  orgId?: string;
  target: string;
  deadline: string;
  
  // Handlers
  onTitleChange: (value: string) => void;
  onSummaryChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTagsChange: (tags: string[]) => void;
  onCategoryIdsChange: (ids: string[]) => void;
  onCategorySlugsChange: (slugs: string[]) => void;
  onActionTypeChange: (value: "petition" | "contribution" | "event") => void;
  onOrgIdChange: (value: string | undefined) => void;
  onTargetChange: (value: string) => void;
  onDeadlineChange: (value: string) => void;
  
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

export function ActionEditor({
  title,
  summary,
  description,
  tags,
  categoryIds,
  categorySlugs,
  actionType,
  orgId,
  target,
  deadline,
  onTitleChange,
  onSummaryChange,
  onDescriptionChange,
  onTagsChange,
  onCategoryIdsChange,
  onCategorySlugsChange,
  onActionTypeChange,
  onOrgIdChange,
  onTargetChange,
  onDeadlineChange,
  availableCategories = [],
  userOrganizations = [],
  validationErrors,
  canSave,
  onSubmit,
  onSave,
  loading = false,
}: ActionEditorProps) {
  const [newTag, setNewTag] = React.useState("");
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
                  placeholder="Titre de votre action"
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
                      Créer l'action
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
                  placeholder="Décrivez votre action en détail..."
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
                      placeholder="Résumé court de l'action"
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
                      <Label htmlFor="actionType" className="text-xs">Type d'action</Label>
                      <Select
                        value={actionType}
                        onValueChange={(value: any) => {
                          onActionTypeChange(value);
                          // Réinitialiser les champs spécifiques
                          onTargetChange("");
                          onDeadlineChange("");
                        }}
                      >
                        <SelectTrigger id="actionType" className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTION_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value} className="text-xs">
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

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

                    {/* Champs spécifiques selon le type */}
                    {actionType === "petition" && (
                      <FormField
                        label="Cible de la pétition"
                        required
                        error={getFieldError(validationErrors, "cible", showValidationErrors)}
                        description=""
                      >
                        <Input
                          value={target}
                          onChange={(e) => onTargetChange(e.target.value)}
                          placeholder="Qui ou quoi est visé par cette pétition ?"
                          className={cn(
                            "h-8 text-xs",
                            getFieldError(validationErrors, "cible", showValidationErrors) && "border-destructive"
                          )}
                        />
                      </FormField>
                    )}

                    {actionType === "event" && (
                      <>
                        <FormField
                          label="Date et heure"
                          required
                          error={getFieldError(validationErrors, "date", showValidationErrors)}
                          description=""
                        >
                          <Input
                            type="datetime-local"
                            value={deadline}
                            onChange={(e) => onDeadlineChange(e.target.value)}
                            className={cn(
                              "h-8 text-xs",
                              getFieldError(validationErrors, "date", showValidationErrors) && "border-destructive"
                            )}
                          />
                        </FormField>
                        <FormField
                          label="Localisation"
                          required
                          error={getFieldError(validationErrors, "localisation", showValidationErrors)}
                          description=""
                        >
                          <Input
                            placeholder="Adresse ou lieu de l'événement"
                            className={cn(
                              "h-8 text-xs",
                              getFieldError(validationErrors, "localisation", showValidationErrors) && "border-destructive"
                            )}
                          />
                        </FormField>
                      </>
                    )}
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
            </div>
          </aside>
      </div>
    </div>
  );
}

