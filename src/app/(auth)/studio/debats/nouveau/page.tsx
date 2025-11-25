"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function NewDebatePage() {
  const router = useRouter();
  const createDebate = useMutation(api.debates.createDebate);
  const [loading, setLoading] = useState(false);

  // Récupérer les articles de l'utilisateur pour l'associer au débat
  const myArticles = useQuery(api.articles.getMyArticles, {
    limit: 100,
  });

  // État du formulaire
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [articleId, setArticleId] = useState<string | null>(null);
  const [slug, setSlug] = useState("");

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

    return errors;
  }, [question, slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validationErrors.length > 0) {
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

  const publishedArticles = myArticles.filter((a: any) => a.status === "published");

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Créer un nouveau débat</h1>
        <p className="text-muted-foreground mt-2">
          Lancez une discussion structurée autour d'une question clé
        </p>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question */}
        <div className="space-y-2">
          <Label htmlFor="question">
            Question du débat <span className="text-destructive">*</span>
          </Label>
          <Input
            id="question"
            placeholder="Ex: Faut-il privilégier l'open source pour la résilience technologique ?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
            className="text-lg"
          />
          <p className="text-sm text-muted-foreground">
            Formulez une question claire qui permettra des arguments POUR et CONTRE
          </p>
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <Label htmlFor="slug">
            Slug (URL) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="slug"
            placeholder="faut-il-privilegier-open-source"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
          <p className="text-sm text-muted-foreground">
            Identifiant unique pour l'URL du débat (généré automatiquement depuis la question)
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description (optionnel)</Label>
          <Textarea
            id="description"
            placeholder="Ajoutez une description pour contextualiser le débat..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
          <p className="text-sm text-muted-foreground">
            Fournissez un contexte supplémentaire pour aider les participants à comprendre le débat
          </p>
        </div>

        {/* Article associé */}
        <div className="space-y-2">
          <Label htmlFor="articleId">Article associé (optionnel)</Label>
          <Select
            value={articleId || "none"}
            onValueChange={(value) => setArticleId(value === "none" ? null : value)}
          >
            <SelectTrigger id="articleId">
              <SelectValue placeholder="Sélectionner un article publié" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucun article</SelectItem>
              {publishedArticles.length === 0 ? (
                <SelectItem value="no-articles" disabled>
                  Aucun article publié disponible
                </SelectItem>
              ) : (
                publishedArticles.map((article: any) => (
                  <SelectItem key={article._id} value={article._id}>
                    {article.title}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Vous pouvez associer ce débat à un de vos articles publiés pour le contextualiser
          </p>
          {publishedArticles.length === 0 && (
            <Alert>
              <SolarIcon icon="info-circle-bold" className="h-4 w-4" />
              <AlertDescription>
                Vous n'avez pas encore d'articles publiés.{" "}
                <Link href="/studio/articles/nouveau" className="underline">
                  Créez-en un
                </Link>{" "}
                pour pouvoir l'associer à un débat.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Erreurs de validation */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <SolarIcon icon="danger-bold" className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4">
          <Button type="submit" disabled={loading || validationErrors.length > 0}>
            {loading ? (
              <>
                <SolarIcon icon="loading-bold" className="h-4 w-4 mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <SolarIcon icon="add-circle-bold" className="h-4 w-4 mr-2" />
                Créer le débat
              </>
            )}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/studio/debats">Annuler</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}

