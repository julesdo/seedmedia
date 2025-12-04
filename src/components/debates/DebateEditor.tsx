"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { CategoryPicker } from "@/components/articles/CategoryPicker";
import { FormField } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

interface DebateEditorProps {
  // Données du débat
  question: string;
  slug: string;
  description: string; // String simple pour la description
  articleId: string | null;
  categoryIds: string[];
  categorySlugs: string[];
  
  // Handlers
  onQuestionChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onArticleIdChange: (value: string | null) => void;
  onCategoryIdsChange: (ids: string[]) => void;
  onCategorySlugsChange: (slugs: string[]) => void;
  
  // Autres
  availableArticles?: Array<{ _id: string; title: string; status: string }>;
  availableCategories?: Array<{ _id?: string; slug: string; name: string; icon?: string }>;
  validationErrors: string[];
  canSave: boolean;
  onSubmit: () => void;
  onSave?: () => void;
  loading?: boolean;
  isNewDebate?: boolean;
}

// Helper pour extraire les erreurs de validation par champ
function getFieldError(validationErrors: string[], fieldName: string, showErrors: boolean): string | undefined {
  if (!showErrors) return undefined;
  const error = validationErrors.find((err) => 
    err.toLowerCase().includes(fieldName.toLowerCase())
  );
  return error;
}

export function DebateEditor({
  question,
  slug,
  description,
  articleId,
  categoryIds,
  categorySlugs,
  onQuestionChange,
  onSlugChange,
  onDescriptionChange,
  onArticleIdChange,
  onCategoryIdsChange,
  onCategorySlugsChange,
  availableArticles = [],
  availableCategories = [],
  validationErrors,
  canSave,
  onSubmit,
  onSave,
  loading = false,
  isNewDebate = true,
}: DebateEditorProps) {
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

  const publishedArticles = availableArticles.filter((a) => a.status === "published");

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

      {/* Layout en 2 colonnes : Question à gauche, Panneau sticky à droite */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Colonne gauche : Question principale */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 flex flex-col space-y-3 min-h-0 overflow-hidden px-4 md:px-6 lg:px-8 pt-4">
            {/* Question et boutons d'action */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative flex-1">
                <Input
                  value={question}
                  onChange={(e) => onQuestionChange(e.target.value)}
                  placeholder="Ex: Faut-il privilégier l'open source pour la résilience technologique ?"
                  className={cn(
                    "pr-8 text-base font-semibold h-9",
                    getFieldError(validationErrors, "question", showValidationErrors) && "border-destructive",
                    isFieldCompleted(question, 10) && !getFieldError(validationErrors, "question", showValidationErrors) && "border-primary/50"
                  )}
                />
                {isFieldCompleted(question, 10) && (
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
                    size="sm"
                    onClick={() => {
                      if (!canSave) {
                        setShowValidationErrors(true);
                        toast.error("Veuillez compléter tous les champs obligatoires avant de sauvegarder.");
                        return;
                      }
                      onSave();
                    }}
                    disabled={loading || !canSave}
                    className="h-8 px-3"
                  >
                    <SolarIcon icon="file-bold" className="h-3.5 w-3.5 mr-2" />
                    Enregistrer
                  </Button>
                )}
                <Button
                  onClick={handleSubmitAttempt}
                  disabled={loading || !canSave}
                  variant="default"
                  size="sm"
                  className="h-8 px-3"
                >
                  {loading ? (
                    <>
                      <SolarIcon icon="spinner-circle" className="h-3.5 w-3.5 mr-2 animate-spin" />
                      {isNewDebate ? "Création..." : "Sauvegarde..."}
                    </>
                  ) : (
                    <>
                      <SolarIcon icon="check-circle-bold" className="h-3.5 w-3.5 mr-2" />
                      {isNewDebate ? "Créer le débat" : "Sauvegarder"}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Description - Textarea simple, prend tout l'espace disponible */}
            <div className="relative flex-1 min-h-0 overflow-hidden px-4 md:px-6 lg:px-8 pb-4">
              <div className={cn(
                "border rounded-lg overflow-hidden transition-colors h-full flex flex-col",
                "bg-neutral-50 dark:bg-neutral-900/50",
                "shadow-md",
                getFieldError(validationErrors, "description", showValidationErrors) && "border-destructive",
                isFieldCompleted(description, 50) && !getFieldError(validationErrors, "description", showValidationErrors) && "border-primary/50"
              )}>
                <Textarea
                  value={description}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  placeholder="Ajoutez une description pour contextualiser le débat..."
                  className={cn(
                    "flex-1 resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                    "bg-transparent text-sm",
                    "px-4 py-4 min-h-[200px]"
                  )}
                />
              </div>
              {isFieldCompleted(description, 50) && (
                <div className="absolute right-2 top-2 z-10">
                  <SolarIcon icon="check-circle-bold" className="h-4 w-4 text-primary bg-background rounded-full" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Colonne droite : Panneau sticky avec métadonnées */}
        <aside className="hidden lg:flex w-[400px] border-l bg-background shrink-0 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
              {/* Slug */}
              <Card className="border border-border/60 bg-card">
                <CardHeader className="pb-1.5 pt-2">
                  <CardTitle className="text-xs font-semibold">Slug (URL)</CardTitle>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="relative">
                    <Input
                      value={slug}
                      onChange={(e) => onSlugChange(e.target.value)}
                      placeholder="faut-il-privilegier-open-source"
                      className={cn(
                        "pr-8 h-8 text-xs",
                        getFieldError(validationErrors, "slug", showValidationErrors) && "border-destructive",
                        isFieldCompleted(slug, 3) && !getFieldError(validationErrors, "slug", showValidationErrors) && "border-primary/50"
                      )}
                    />
                    {isFieldCompleted(slug, 3) && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <SolarIcon icon="check-circle-bold" className="h-4 w-4 text-primary" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Identifiant unique pour l'URL du débat (généré automatiquement depuis la question)
                  </p>
                </CardContent>
              </Card>

              {/* Article associé */}
              <Card className="border border-border/60 bg-card">
                <CardHeader className="pb-1.5 pt-2">
                  <CardTitle className="text-xs font-semibold">Article associé</CardTitle>
                </CardHeader>
                <CardContent className="pb-2 space-y-2">
                  <Select
                    value={articleId || "none"}
                    onValueChange={(value) => onArticleIdChange(value === "none" ? null : value)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Aucun article" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-xs">Aucun article</SelectItem>
                      {publishedArticles.length === 0 ? (
                        <SelectItem value="no-articles" disabled className="text-xs">
                          Aucun article publié disponible
                        </SelectItem>
                      ) : (
                        publishedArticles.map((article) => (
                          <SelectItem key={article._id} value={article._id} className="text-xs">
                            {article.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {publishedArticles.length === 0 && (
                    <Alert className="py-2">
                      <SolarIcon icon="info-circle-bold" className="h-3.5 w-3.5" />
                      <AlertDescription className="text-xs">
                        Vous n'avez pas encore d'articles publiés.{" "}
                        <Link href="/studio/articles/nouveau" className="underline">
                          Créez-en un
                        </Link>{" "}
                        pour pouvoir l'associer à un débat.
                      </AlertDescription>
                    </Alert>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Vous pouvez associer ce débat à un de vos articles publiés pour le contextualiser
                  </p>
                </CardContent>
              </Card>

              <Separator />

              {/* Catégories */}
              <Card className="border border-border/60 bg-card">
                <CardHeader className="pb-1.5 pt-2">
                  <CardTitle className="text-xs font-semibold">Catégories</CardTitle>
                </CardHeader>
                <CardContent className="pb-2 space-y-2">
                  <CategoryPicker
                    availableCategories={availableCategories}
                    selectedCategoryIds={categoryIds}
                    selectedCategorySlugs={categorySlugs}
                    onCategoryIdsChange={onCategoryIdsChange}
                    onCategorySlugsChange={onCategorySlugsChange}
                    label=""
                    description=""
                  />
                </CardContent>
              </Card>
            </div>
          </aside>
      </div>
    </div>
  );
}

