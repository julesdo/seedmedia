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
import { FormField } from "@/components/ui/form-field";
import { ActionFields } from "@/components/governance/ActionFields";
import { getActionSchema, validateActionData } from "@/lib/governance/actionSchemas";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { TElement } from "platejs";

const PROPOSAL_TYPES = [
  { value: "editorial_rules", label: "Règles éditoriales" },
  { value: "product_evolution", label: "Évolution du produit" },
  { value: "ethical_charter", label: "Charte éthique" },
  { value: "category_addition", label: "Ajout de catégories" },
  { value: "expert_nomination", label: "Process de nomination des experts" },
  { value: "other", label: "Autre" },
] as const;

interface ProposalEditorProps {
  // Données de la proposition
  title: string;
  description: string;
  proposalType: "editorial_rules" | "product_evolution" | "ethical_charter" | "category_addition" | "expert_nomination" | "other";
  voteDurationDays: number;
  actionData: Record<string, any>;
  
  // Handlers
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onProposalTypeChange: (value: "editorial_rules" | "product_evolution" | "ethical_charter" | "category_addition" | "expert_nomination" | "other") => void;
  onVoteDurationDaysChange: (value: number) => void;
  onActionDataChange: (data: Record<string, any>) => void;
  
  // Autres
  availableCategories?: Array<{ _id?: string; slug: string; name: string; icon?: string }>;
  availableUsers?: Array<{ _id: string; email: string; name?: string }>;
  editorialRules?: Array<{
    _id: string;
    key: string;
    label: string;
    description?: string;
    valueType: "number" | "boolean" | "string" | "select";
    currentValue: any;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    options?: Array<{ label: string; value: any }>;
  }>;
  productRules?: Array<{
    _id: string;
    key: string;
    label: string;
    description?: string;
    valueType: "number" | "boolean" | "string" | "select";
    currentValue: any;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    options?: Array<{ label: string; value: any }>;
  }>;
  currentVoteParams?: {
    defaultDurationDays: number;
    minDurationDays: number;
    maxDurationDays: number;
  };
  validationErrors: string[];
  onSubmit: () => void;
  onCancel?: () => void;
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

export function ProposalEditor({
  title,
  description,
  proposalType,
  voteDurationDays,
  actionData,
  onTitleChange,
  onDescriptionChange,
  onProposalTypeChange,
  onVoteDurationDaysChange,
  onActionDataChange,
  availableCategories = [],
  availableUsers = [],
  editorialRules = [],
  productRules = [],
  currentVoteParams,
  validationErrors,
  onSubmit,
  onCancel,
  loading = false,
}: ProposalEditorProps) {
  const [showValidationErrors, setShowValidationErrors] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Fonction pour vérifier si un champ est complété
  const isFieldCompleted = (value: string, minLength: number = 1): boolean => {
    return value.trim().length >= minLength;
  };

  // Validation complète : TOUS les champs obligatoires doivent être remplis
  const canSave = React.useMemo(() => {
    if (!title.trim()) return false;
    
    // Extraire le texte brut de la description
    let descriptionText = "";
    if (description) {
      try {
        const parsed = JSON.parse(description);
        descriptionText = extractTextFromPlateValue(parsed as TElement[]);
      } catch {
        descriptionText = description;
      }
    }
    if (!descriptionText.trim()) return false;
    
    // Valider la durée du vote
    const minDuration = currentVoteParams?.minDurationDays || 1;
    const maxDuration = currentVoteParams?.maxDurationDays || 90;
    if (voteDurationDays < minDuration || voteDurationDays > maxDuration) return false;
    
    // Validation selon le schéma d'action
    const actionValidation = validateActionData(proposalType, actionData);
    if (!actionValidation.valid) return false;
    
    return true;
  }, [title, description, voteDurationDays, proposalType, actionData, currentVoteParams]);

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

    setIsSubmitting(true);
    setShowValidationErrors(true);
    
    // Appeler onSubmit et réinitialiser l'état après
    try {
      await Promise.resolve(onSubmit());
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
    } finally {
      // Petit délai pour que l'utilisateur voie le feedback
      setTimeout(() => {
        setIsSubmitting(false);
      }, 500);
    }
  };

  // Générer le slug depuis le titre
  const slug = React.useMemo(() => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }, [title]);

  // Récupérer les règles disponibles selon le type
  const availableRules = React.useMemo(() => {
    if (proposalType === "editorial_rules") return editorialRules;
    if (proposalType === "product_evolution") return productRules;
    return undefined;
  }, [proposalType, editorialRules, productRules]);

  // Récupérer le schéma d'action
  const actionSchema = React.useMemo(() => {
    return getActionSchema(proposalType, availableRules);
  }, [proposalType, availableRules]);

  return (
    <>
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
                    placeholder="Titre de votre proposition"
                    className={cn(
                      "pr-8 text-base font-semibold h-9",
                      getFieldError(validationErrors, "titre", showValidationErrors) && "border-destructive",
                      isFieldCompleted(title) && !getFieldError(validationErrors, "titre", showValidationErrors) && "border-primary/50"
                    )}
                  />
                  {isFieldCompleted(title) && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <SolarIcon icon="check-circle-bold" className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  {onCancel && (
                    <Button
                      variant="ghost"
                      onClick={onCancel}
                      disabled={loading || isSubmitting}
                      size="sm"
                      type="button"
                    >
                      Annuler
                    </Button>
                  )}
                  <Button
                    onClick={handleSubmitAttempt}
                    disabled={loading || isSubmitting || !canSave}
                    size="sm"
                    type="button"
                  >
                    {loading || isSubmitting ? (
                      <>
                        <SolarIcon icon="spinner-circle" className="h-4 w-4 mr-2 animate-spin" />
                        Création...
                      </>
                    ) : (
                      <>
                        <SolarIcon icon="check-circle-bold" className="h-4 w-4 mr-2" />
                        Créer
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Éditeur de contenu */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 min-h-0 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg shadow-md overflow-hidden">
                  <PlateEditorWrapper
                    value={description}
                    onChange={onDescriptionChange}
                    placeholder="Décrivez en détail votre proposition, ses objectifs, ses implications et les raisons pour lesquelles elle devrait être adoptée..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite : Panneau sticky avec paramètres */}
          <div className="w-80 border-l bg-background shrink-0 overflow-hidden flex flex-col">
            <div className="h-full overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* Section Type */}
                <Card className="border border-border/60 bg-card">
                  <CardHeader className="pb-1.5 pt-2">
                    <CardTitle className="text-xs font-semibold">Type de proposition</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pb-2">
                    <Select
                      value={proposalType}
                      onValueChange={(value: any) => onProposalTypeChange(value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPOSAL_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Section Durée du vote */}
                <Card className="border border-border/60 bg-card">
                  <CardHeader className="pb-1.5 pt-2">
                    <CardTitle className="text-xs font-semibold">Durée du vote</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pb-2">
                    <FormField
                      label="Durée (jours)"
                      required
                      error={getFieldError(validationErrors, "durée", showValidationErrors)}
                      description=""
                    >
                      <div className="relative">
                        <Input
                          type="number"
                          min={currentVoteParams?.minDurationDays || 1}
                          max={currentVoteParams?.maxDurationDays || 90}
                          value={voteDurationDays}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || (currentVoteParams?.defaultDurationDays || 7);
                            const min = currentVoteParams?.minDurationDays || 1;
                            const max = currentVoteParams?.maxDurationDays || 90;
                            onVoteDurationDaysChange(Math.max(min, Math.min(max, value)));
                          }}
                          className={cn(
                            "pr-8 h-8 text-xs",
                            getFieldError(validationErrors, "durée", showValidationErrors) && "border-destructive",
                            voteDurationDays >= (currentVoteParams?.minDurationDays || 1) && 
                            voteDurationDays <= (currentVoteParams?.maxDurationDays || 90) &&
                            !getFieldError(validationErrors, "durée", showValidationErrors) && "border-primary/50"
                          )}
                          required
                        />
                        {voteDurationDays >= (currentVoteParams?.minDurationDays || 1) && 
                         voteDurationDays <= (currentVoteParams?.maxDurationDays || 90) && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <SolarIcon icon="check-circle-bold" className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </div>
                    </FormField>
                    {currentVoteParams && (
                      <p className="text-[10px] text-muted-foreground">
                        Minimum: {currentVoteParams.minDurationDays} jour{currentVoteParams.minDurationDays > 1 ? "s" : ""}, 
                        Maximum: {currentVoteParams.maxDurationDays} jours
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Section Paramètres automatiques */}
                <Card className="border border-border/60 bg-card">
                  <CardHeader className="pb-1.5 pt-2">
                    <CardTitle className="text-xs font-semibold">Paramètres automatiques</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 pb-2">
                    <Alert className="py-2">
                      <SolarIcon icon="info-circle-bold" className="h-3 w-3" />
                      <AlertDescription className="text-[10px] mt-0.5">
                        <strong>Paramètres automatiques :</strong>
                        <ul className="list-disc list-inside mt-1 space-y-0.5 text-[10px]">
                          {proposalType === "editorial_rules" && (
                            <>
                              <li>Quorum : 15+ votes</li>
                              <li>Majorité : 60%+</li>
                            </>
                          )}
                          {proposalType === "ethical_charter" && (
                            <>
                              <li>Quorum : 20+ votes</li>
                              <li>Majorité : 66%+</li>
                            </>
                          )}
                          {proposalType === "expert_nomination" && (
                            <>
                              <li>Quorum : 12+ votes</li>
                              <li>Majorité : 50%+</li>
                            </>
                          )}
                          {proposalType === "category_addition" && (
                            <>
                              <li>Quorum : 10+ votes</li>
                              <li>Majorité : 50%+</li>
                            </>
                          )}
                          {proposalType === "product_evolution" && (
                            <>
                              <li>Quorum : 12+ votes</li>
                              <li>Majorité : 55%+</li>
                            </>
                          )}
                          {proposalType === "other" && (
                            <>
                              <li>Quorum : 10+ votes</li>
                              <li>Majorité : 50%+</li>
                            </>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>

                {/* Section Champs spécifiques selon le type */}
                {actionSchema && (
                  <Card className="border border-border/60 bg-card">
                    <CardHeader className="pb-1.5 pt-2">
                      <CardTitle className="text-xs font-semibold">{actionSchema.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pb-2">
                      <ActionFields
                        schema={actionSchema}
                        actionData={actionData}
                        onActionDataChange={onActionDataChange}
                        categoryOptions={availableCategories}
                        userOptions={availableUsers}
                        availableRules={availableRules}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Slug généré */}
                {slug && (
                  <Card className="border border-border/60 bg-card">
                    <CardHeader className="pb-1.5 pt-2">
                      <CardTitle className="text-xs font-semibold">URL générée</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pb-2">
                      <code className="block bg-muted px-2 py-1 rounded text-[10px] font-mono break-all">
                        {slug}
                      </code>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

