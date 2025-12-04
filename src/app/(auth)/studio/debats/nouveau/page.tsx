"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { DebateEditor } from "@/components/debates/DebateEditor";

export default function NewDebatePage() {
  const router = useRouter();
  const createDebate = useMutation(api.debates.createDebate);
  const [loading, setLoading] = useState(false);

  // Récupérer les articles de l'utilisateur pour l'associer au débat
  const myArticles = useQuery(api.articles.getMyArticles, {
    limit: 100,
  });

  // Récupérer les catégories disponibles pour les débats
  const availableCategories = useQuery(api.categories.getActiveCategories, {
    appliesTo: "debates",
  });

  // État du formulaire
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState<string>("");
  const [articleId, setArticleId] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [categoryIds, setCategoryIds] = useState<Array<string>>([]);
  const [categorySlugs, setCategorySlugs] = useState<Array<string>>([]);

  // Générer le slug automatiquement depuis la question
  React.useEffect(() => {
    if (question.trim()) {
      const generatedSlug = question
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Supprimer les accents
        .replace(/[^a-z0-9]+/g, "-") // Remplacer les caractères non alphanumériques par des tirets
        .replace(/^-+|-+$/g, ""); // Supprimer les tirets en début et fin
      setSlug(generatedSlug);
    }
  }, [question]);

  // Validation
  const validationErrors = React.useMemo(() => {
    const errors: string[] = [];

    if (!question.trim()) errors.push("La question du débat est obligatoire");
    if (question.trim().length < 10)
      errors.push("La question doit contenir au moins 10 caractères");
    if (!slug.trim()) errors.push("Le slug est obligatoire");
    if (slug.trim().length < 3) errors.push("Le slug doit contenir au moins 3 caractères");
    // La description est optionnelle, donc pas d'erreur si vide

    return errors;
  }, [question, slug]);

  const canSave = validationErrors.length === 0;

  const handleSubmit = async () => {
    if (!canSave) {
      toast.error("Veuillez corriger les erreurs du formulaire");
      return;
    }

    setLoading(true);

    try {
      const result = await createDebate({
        question: question.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        articleId: articleId ? (articleId as any) : undefined,
      });

      toast.success("Débat créé avec succès !");
      router.push(`/debats/${slug.trim()}`);
    } catch (error: any) {
      console.error("Erreur lors de la création du débat:", error);
      toast.error(error.message || "Erreur lors de la création du débat");
    } finally {
      setLoading(false);
    }
  };

  if (myArticles === undefined) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Créer un nouveau débat</h1>
          <p className="text-muted-foreground mt-2">
            Lancez une discussion structurée autour d'une question clé
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const publishedArticles = myArticles?.filter((a: any) => a.status === "published") || [];

  return (
    <DebateEditor
      question={question}
      slug={slug}
      description={description}
      articleId={articleId}
      categoryIds={categoryIds}
      categorySlugs={categorySlugs}
      onQuestionChange={setQuestion}
      onSlugChange={setSlug}
      onDescriptionChange={setDescription}
      onArticleIdChange={setArticleId}
      onCategoryIdsChange={setCategoryIds}
      onCategorySlugsChange={setCategorySlugs}
      availableArticles={myArticles || []}
      availableCategories={availableCategories}
      validationErrors={validationErrors}
      canSave={canSave}
      onSubmit={handleSubmit}
      loading={loading}
      isNewDebate={true}
    />
  );
}

