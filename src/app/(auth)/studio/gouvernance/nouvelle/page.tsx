"use client";

import * as React from "react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { ProposalEditor } from "@/components/governance/ProposalEditor";
import { extractTextFromPlateValue } from "@/components/articles/PlateEditorWrapper";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { toast } from "sonner";
import { validateActionData } from "@/lib/governance/actionSchemas";
import type { TElement } from "platejs";

function NewProposalPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createProposal = useMutation(api.governance.createProposal);
  const allCategories = useQuery(api.categories.getActiveCategories, {});
  const allUsers = useQuery(api.users.getAllUsers, {});
  
  // Pré-remplir depuis les query params si on vient de la page des règles
  const initialProposalType = (searchParams?.get("proposalType") as any) || "editorial_rules";
  const initialRuleKey = searchParams?.get("ruleKey") || "";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState<string>("");
  const [proposalType, setProposalType] = useState<
    "editorial_rules" | "product_evolution" | "ethical_charter" | "category_addition" | "expert_nomination" | "other"
  >(initialProposalType);
  
  // Charger les règles configurables pour editorial_rules et product_evolution
  const editorialRules = useQuery(
    api.configurableRules.getActiveRules,
    proposalType === "editorial_rules" ? { proposalType: "editorial_rules" } : "skip"
  );
  const productRules = useQuery(
    api.configurableRules.getActiveRules,
    proposalType === "product_evolution" ? { proposalType: "product_evolution" } : "skip"
  );

  // Récupérer les paramètres de vote actuels pour valider les minimums
  const currentVoteParams = useQuery(api.governanceEvolution.getCurrentVoteParameters);
  
  // Initialiser la durée du vote avec la valeur par défaut du backend
  const [voteDurationDays, setVoteDurationDays] = useState<number>(
    currentVoteParams?.defaultDurationDays || 7
  );
  
  // Mettre à jour la durée si les paramètres changent
  useEffect(() => {
    if (currentVoteParams?.defaultDurationDays) {
      setVoteDurationDays(currentVoteParams.defaultDurationDays);
    }
  }, [currentVoteParams?.defaultDurationDays]);
  
  const [loading, setLoading] = useState(false);
  
  // Champs spécifiques par type - Structure flexible basée sur les schémas
  const [actionData, setActionData] = useState<Record<string, any>>({});

  // Pré-remplir actionData si on vient de la page des règles
  useEffect(() => {
    if (initialRuleKey && (proposalType === "editorial_rules" || proposalType === "product_evolution")) {
      const fieldKey = proposalType === "editorial_rules" ? "ruleKey" : "settingKey";
      setActionData({ [fieldKey]: initialRuleKey });
    }
  }, [initialRuleKey, proposalType]);

  // Réinitialiser actionData quand le type change (sauf si on vient de la page des règles)
  React.useEffect(() => {
    if (!initialRuleKey) {
      setActionData({});
    }
  }, [proposalType, initialRuleKey]);

  // Générer le slug depuis le titre
  const slug = React.useMemo(() => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }, [title]);

  // Validation
  const validationErrors = React.useMemo(() => {
    const errors: string[] = [];
    
    if (!title.trim()) errors.push("Le titre est obligatoire");
    
    // Extraire le texte brut de la description (qui est en JSON Plate.js)
    let descriptionText = "";
    if (description) {
      try {
        const parsed = JSON.parse(description);
        descriptionText = extractTextFromPlateValue(parsed as TElement[]);
      } catch {
        // Si ce n'est pas du JSON, utiliser directement la chaîne (pour compatibilité)
        descriptionText = description;
      }
    }
    if (!descriptionText.trim()) errors.push("La description est obligatoire");
    
    // Valider la durée du vote selon les minimums définis dans les évolutions
    const minDuration = currentVoteParams?.minDurationDays || 1;
    const maxDuration = currentVoteParams?.maxDurationDays || 90;
    if (voteDurationDays < minDuration) {
      errors.push(`La durée du vote doit être d'au moins ${minDuration} jour${minDuration > 1 ? "s" : ""}`);
    }
    if (voteDurationDays > maxDuration) {
      errors.push(`La durée du vote ne peut pas dépasser ${maxDuration} jours`);
    }
    
    // Validation selon le schéma d'action
    const actionValidation = validateActionData(proposalType, actionData);
    if (!actionValidation.valid) {
      Object.values(actionValidation.errors).forEach((error) => {
        errors.push(error);
      });
    }
    
    return errors;
  }, [title, description, voteDurationDays, proposalType, actionData, currentVoteParams]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await createProposal({
        title,
        slug: slug || `proposition-${Date.now()}`,
        description,
        proposalType,
        voteDurationDays,
        actionData: Object.keys(actionData).length > 0 ? actionData : undefined,
      });

      toast.success("Proposition créée avec succès !");
      router.push(`/studio/gouvernance`);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création de la proposition");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <ProposalEditor
      title={title}
      description={description}
      proposalType={proposalType}
      voteDurationDays={voteDurationDays}
      actionData={actionData}
      onTitleChange={setTitle}
      onDescriptionChange={setDescription}
      onProposalTypeChange={setProposalType}
      onVoteDurationDaysChange={setVoteDurationDays}
      onActionDataChange={setActionData}
      availableCategories={allCategories}
      availableUsers={allUsers}
      editorialRules={editorialRules}
      productRules={productRules}
      currentVoteParams={currentVoteParams}
      validationErrors={validationErrors}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={loading}
    />
  );
}

export default function NewProposalPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center">
        <div className="text-center">
          <SolarIcon icon="spinner-circle" className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    }>
      <NewProposalPageContent />
    </Suspense>
  );
}

