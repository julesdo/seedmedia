"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { toast } from "sonner";
import { normalizeNodeId } from "platejs";
import { ActionEditor } from "@/components/actions/ActionEditor";

const ACTION_TYPES = [
  { value: "petition", label: "Pétition" },
  { value: "contribution", label: "Contribution" },
  { value: "event", label: "Événement" },
] as const;

const defaultPlateValue = normalizeNodeId([
  {
    children: [{ text: "" }],
    type: "p",
  },
]);

export default function NewActionPage() {
  const router = useRouter();
  const createAction = useMutation(api.actions.createAction);
  const userOrganizations = useQuery(api.organizations.getUserOrganizations);

  // Métadonnées de base
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState<string>(JSON.stringify(defaultPlateValue));
  const [tags, setTags] = useState<string[]>([]);
  const [categoryIds, setCategoryIds] = useState<Array<string>>([]);
  const [categorySlugs, setCategorySlugs] = useState<Array<string>>([]);
  const [actionType, setActionType] = useState<"petition" | "contribution" | "event">("petition");
  const [orgId, setOrgId] = useState<string | undefined>(undefined);
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);

  // Récupérer les catégories disponibles pour les actions
  const availableCategories = useQuery(api.categories.getActiveCategories, {
    appliesTo: "actions",
  });

  // Validation dynamique selon le type d'action
  const validationErrors = React.useMemo(() => {
    const errors: string[] = [];
    
    if (!title.trim()) errors.push("Le titre est obligatoire");
    if (!summary.trim()) errors.push("Le résumé est obligatoire");
    
    // Validation spécifique selon le type
    if (actionType === "petition" && !target.trim()) {
      errors.push("La cible de la pétition est obligatoire");
    }
    
    if (actionType === "event") {
      if (!deadline) {
        errors.push("La date et heure de l'événement sont obligatoires");
      }
    }
    
    return errors;
  }, [title, summary, actionType, target, deadline]);

  const canSave = validationErrors.length === 0;

  // Générer le slug depuis le titre
  const slug = React.useMemo(() => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }, [title]);

  const handleSubmit = async () => {
    if (!canSave) {
      toast.error("Veuillez compléter tous les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      await createAction({
        title,
        slug: slug || `action-${Date.now()}`,
        summary,
        description,
        type: actionType,
        orgId: orgId ? (orgId as any) : undefined,
        tags,
        categoryIds: categoryIds.length > 0 ? (categoryIds as any) : undefined,
        categorySlugs: categorySlugs.length > 0 ? categorySlugs : undefined,
        target: actionType === "petition" ? (target || undefined) : undefined,
        deadline: deadline ? new Date(deadline).getTime() : undefined,
        location: undefined, // TODO: Add location support
      });

      toast.success("Action créée avec succès !");
      router.push("/studio/actions");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création de l'action");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ActionEditor
      title={title}
      summary={summary}
      description={description}
      tags={tags}
      categoryIds={categoryIds}
      categorySlugs={categorySlugs}
      actionType={actionType}
      orgId={orgId}
      target={target}
      deadline={deadline}
      onTitleChange={setTitle}
      onSummaryChange={setSummary}
      onDescriptionChange={setDescription}
      onTagsChange={setTags}
      onCategoryIdsChange={setCategoryIds}
      onCategorySlugsChange={setCategorySlugs}
      onActionTypeChange={(value) => {
        setActionType(value);
        setTarget("");
        setDeadline("");
      }}
      onOrgIdChange={setOrgId}
      onTargetChange={setTarget}
      onDeadlineChange={setDeadline}
      availableCategories={availableCategories}
      userOrganizations={userOrganizations || []}
      validationErrors={validationErrors}
      canSave={canSave}
      onSubmit={handleSubmit}
      loading={loading}
    />
  );
}

