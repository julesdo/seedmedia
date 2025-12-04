"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { toast } from "sonner";
import { normalizeNodeId } from "platejs";
import { ProjectEditor } from "@/components/projects/ProjectEditor";

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

const defaultPlateValue = normalizeNodeId([
  {
    children: [{ text: "" }],
    type: "p",
  },
]);

export default function NewProjectPage() {
  const router = useRouter();
  const createProject = useMutation(api.projects.createProject);
  const userOrganizations = useQuery(api.organizations.getUserOrganizations);

  // Métadonnées de base
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState<string>(JSON.stringify(defaultPlateValue));
  const [tags, setTags] = useState<string[]>([]);
  const [categoryIds, setCategoryIds] = useState<Array<string>>([]);
  const [categorySlugs, setCategorySlugs] = useState<Array<string>>([]);
  const [orgId, setOrgId] = useState<string | undefined>(undefined);
  const [stage, setStage] = useState<"idea" | "prototype" | "beta" | "production">("idea");
  const [openSource, setOpenSource] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [links, setLinks] = useState<Array<{ type: string; url: string }>>([]);
  const [impactMetrics, setImpactMetrics] = useState<Array<{ label: string; value: string }>>([]);
  const [loading, setLoading] = useState(false);

  // Récupérer les catégories disponibles pour les projets
  const availableCategories = useQuery(api.categories.getActiveCategories, {
    appliesTo: "projects",
  });

  // Validation
  const validationErrors = React.useMemo(() => {
    const errors: string[] = [];
    
    if (!title.trim()) errors.push("Le titre est obligatoire");
    if (!summary.trim()) errors.push("Le résumé est obligatoire");
    
    return errors;
  }, [title, summary]);

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
      await createProject({
        title,
        slug: slug || `projet-${Date.now()}`,
        summary,
        description,
        orgId: orgId ? (orgId as any) : undefined,
        tags,
        categoryIds: categoryIds.length > 0 ? (categoryIds as any) : undefined,
        categorySlugs: categorySlugs.length > 0 ? categorySlugs : undefined,
        location: undefined, // TODO: Add location support
        images,
        links,
        stage,
        impactMetrics,
        openSource,
      });

      toast.success("Projet créé avec succès !");
      router.push("/studio/projets");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création du projet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProjectEditor
      title={title}
      summary={summary}
      description={description}
      tags={tags}
      categoryIds={categoryIds}
      categorySlugs={categorySlugs}
      orgId={orgId}
      stage={stage}
      openSource={openSource}
      images={images}
      links={links}
      impactMetrics={impactMetrics}
      onTitleChange={setTitle}
      onSummaryChange={setSummary}
      onDescriptionChange={setDescription}
      onTagsChange={setTags}
      onCategoryIdsChange={setCategoryIds}
      onCategorySlugsChange={setCategorySlugs}
      onOrgIdChange={setOrgId}
      onStageChange={setStage}
      onOpenSourceChange={setOpenSource}
      onImagesChange={setImages}
      onLinksChange={setLinks}
      onImpactMetricsChange={setImpactMetrics}
      availableCategories={availableCategories}
      userOrganizations={userOrganizations || []}
      validationErrors={validationErrors}
      canSave={canSave}
      onSubmit={handleSubmit}
      loading={loading}
    />
  );
}

