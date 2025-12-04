"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
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

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  // Essayer de récupérer par slug d'abord, sinon par ID si slug est en fait un ID
  const isIdFormat = slug.match(/^[a-z0-9]{32}$/i);
  const articleBySlug = useQuery(
    api.articles.getArticleBySlug,
    !isIdFormat ? { slug } : "skip"
  );
  const articleById = useQuery(
    api.articles.getArticleById,
    isIdFormat ? { articleId: slug as any } : "skip"
  );
  const article = articleBySlug || articleById;
  const updateArticle = useMutation(api.articles.updateArticle);
  const updateArticleCategories = useMutation(api.categories.updateArticleCategories);
  const deleteArticle = useMutation(api.articles.deleteArticle);

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
  const [status, setStatus] = useState<"draft" | "pending" | "published">("draft");

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
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialiser les valeurs depuis l'article
  useEffect(() => {
    if (article && !isInitialized) {
      setTitle(article.title || "");
      setSummary(article.summary || "");
      setCoverImage(article.coverImage || null);
      setTags(article.tags || []);
      setCategoryIds(article.categoryIds ? article.categoryIds.map(id => id as string) : []);
      setArticleType(article.articleType || "scientific");
      setStatus(article.status || "draft");
      setThese(article.these || "");
      setContent(article.content || JSON.stringify(defaultPlateValue));
      setCounterArguments(article.counterArguments || []);
      setConclusion(article.conclusion || "");
      // Pour les sources, on simule depuis sourcesCount (à améliorer si on ajoute un champ sources)
      setSources(Array(article.sourcesCount || 0).fill("").map((_, i) => `Source ${i + 1}`));
      setIsInitialized(true);
    }
  }, [article, isInitialized]);

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

  const handleSubmit = async () => {
    if (!article) {
      toast.error("Article introuvable");
      return;
    }

    if (!canPublish && status === "pending") {
      toast.error("Veuillez compléter tous les champs obligatoires avant de soumettre");
      return;
    }

    setLoading(true);
    try {
      await updateArticle({
        articleId: article._id,
        title,
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
      });

      // Mettre à jour les catégories si nécessaire
      if (categoryIds.length > 0) {
        await updateArticleCategories({
          articleId: article._id,
          categoryIds: categoryIds as any,
        });
      }

      toast.success(
        status === "pending"
          ? "Article soumis pour validation !"
          : status === "published"
          ? "Article publié avec succès !"
          : "Article sauvegardé comme brouillon"
      );
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour de l'article");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!article) {
      toast.error("Article introuvable");
      return;
    }

    setLoading(true);
    try {
      await updateArticle({
        articleId: article._id,
        title,
        summary,
        coverImage: coverImage || undefined,
        content,
        tags,
        categoryIds: categoryIds.length > 0 ? (categoryIds as any) : undefined,
        categorySlugs: categorySlugs.length > 0 ? categorySlugs : undefined,
        articleType,
        status: "draft",
        these,
        counterArguments,
        conclusion,
        sourcesCount: sources.length,
      });

      toast.success("Article sauvegardé comme brouillon");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la sauvegarde de l'article");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!article) {
      toast.error("Article introuvable");
      return;
    }

    try {
      await deleteArticle({ articleId: article._id });
      toast.success("Article supprimé avec succès");
      router.push("/studio/articles");
    } catch (error: any) {
      throw error; // L'erreur sera gérée par la modale
    }
  };

  if (article === undefined) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-10 max-w-7xl">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Chargement...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-10 max-w-7xl">
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Article introuvable</h1>
            <p className="text-sm text-muted-foreground">
              L'article que vous recherchez n'existe pas ou a été supprimé.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
      isPublished={status === "published"}
      onSubmit={handleSubmit}
      onSave={handleSave}
      onDelete={handleDelete}
      loading={loading}
      articleId={article._id}
    />
  );
}
