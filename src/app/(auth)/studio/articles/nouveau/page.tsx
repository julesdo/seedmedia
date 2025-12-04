"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { toast } from "sonner";
import { normalizeNodeId } from "platejs";
import { ArticleEditor } from "@/components/articles/ArticleEditor";
import { extractTextFromPlateValue } from "@/components/articles/PlateEditorWrapper";
import type { TElement } from "platejs";

const defaultPlateValue = normalizeNodeId([
  {
    children: [{ text: "" }],
    type: "p",
  },
]);

export default function NewArticlePage() {
  const router = useRouter();
  const createArticle = useMutation(api.articles.createArticle);

  // Métadonnées de base
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [categoryIds, setCategoryIds] = useState<Array<string>>([]);
  const [categorySlugs, setCategorySlugs] = useState<Array<string>>([]);
  const [articleType, setArticleType] = useState<
    "scientific" | "expert" | "opinion" | "news" | "tutorial" | "other"
  >("scientific");
  const [status, setStatus] = useState<"draft" | "pending">("draft");
  
  // Récupérer les catégories disponibles pour les articles
  const availableCategories = useQuery(api.categories.getActiveCategories, {
    appliesTo: "articles",
  });

  // Structure obligatoire selon NEW_SEED.md
  const [these, setThese] = useState<string>("");
  const [content, setContent] = useState<string>(JSON.stringify(defaultPlateValue));
  const [counterArguments, setCounterArguments] = useState<string[]>([]);
  const [conclusion, setConclusion] = useState<string>("");
  const [sources, setSources] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);

  // Validation de la structure obligatoire
  const validationErrors = React.useMemo(() => {
    const errors: string[] = [];
    
    if (!title.trim()) errors.push("Le titre est obligatoire");
    if (!summary.trim()) errors.push("Le résumé (TL;DR) est obligatoire");
    if (!these.trim()) errors.push("La thèse / problème est obligatoire");
    
    const contentText = extractTextFromPlateValue(JSON.parse(content || JSON.stringify(defaultPlateValue)) as TElement[]);
    if (!contentText.trim()) errors.push("Le développement est obligatoire");
    
    if (sources.length < 2) errors.push("Au moins 2 sources sont obligatoires");
    if (counterArguments.length < 1) errors.push("Au moins 1 contre-argument est obligatoire");
    if (!conclusion.trim()) errors.push("La conclusion est obligatoire");
    
    return errors;
  }, [title, summary, these, content, sources.length, counterArguments.length, conclusion]);

  const canPublish = validationErrors.length === 0;

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
    // Validation stricte avant soumission
    if (status === "pending") {
      if (!canPublish) {
        toast.error("Veuillez compléter tous les champs obligatoires avant de soumettre", {
          description: `${validationErrors.length} champ(s) manquant(s)`,
        });
        return;
      }
    }

    setLoading(true);
    try {
      const articleId = await createArticle({
        title,
        slug: slug || `article-${Date.now()}`,
        summary,
        coverImage: coverImage || undefined,
        content,
        tags,
        categoryIds: categoryIds.length > 0 ? (categoryIds as any) : undefined,
        categorySlugs: categorySlugs.length > 0 ? categorySlugs : undefined,
        articleType,
        status,
        these,
        counterArguments,
        conclusion,
        sourcesCount: sources.length,
        sources, // Passer les sources réelles
      });

      toast.success(
        status === "pending"
          ? "Article soumis pour validation !"
          : "Article sauvegardé comme brouillon"
      );
      
      router.push(`/studio/articles/${articleId}`);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création de l'article");
    } finally {
      setLoading(false);
    }
  };

  // Raccourci clavier Cmd/Ctrl + S pour sauvegarder
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [title, summary, content, these, sources, counterArguments, conclusion, status, articleType, tags]);

  return (
    <ArticleEditor
      title={title}
      summary={summary}
      coverImage={coverImage}
      tags={tags}
      categoryIds={categoryIds}
      categorySlugs={categorySlugs}
      articleType={articleType}
      status={status}
      these={these}
      content={content}
      counterArguments={counterArguments}
      conclusion={conclusion}
      sources={sources}
      onTitleChange={setTitle}
      onSummaryChange={setSummary}
      onCoverImageChange={setCoverImage}
      onTagsChange={setTags}
      onCategoryIdsChange={setCategoryIds}
      onCategorySlugsChange={setCategorySlugs}
      onArticleTypeChange={setArticleType}
      onStatusChange={setStatus}
      onTheseChange={setThese}
      onContentChange={setContent}
      onCounterArgumentsChange={setCounterArguments}
      onConclusionChange={setConclusion}
      onSourcesChange={setSources}
      availableCategories={availableCategories}
      validationErrors={validationErrors}
      canPublish={canPublish}
      onSubmit={handleSubmit}
      loading={loading}
    />
  );
}
