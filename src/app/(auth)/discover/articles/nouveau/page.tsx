"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/articles/ImageUpload";
import { TagsInput } from "@/components/articles/TagsInput";
import { RichTextEditor } from "@/components/articles/RichTextEditor";
import { ClaimsManager } from "@/components/articles/ClaimsManager";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Id } from "../../../../../../convex/_generated/dataModel";

const ARTICLE_TYPES = [
  { value: "scientific", label: "Scientifique" },
  { value: "expert", label: "Expert" },
  { value: "opinion", label: "Opinion" },
  { value: "news", label: "Actualité" },
  { value: "tutorial", label: "Tutoriel" },
  { value: "other", label: "Autre" },
] as const;

export default function NewArticlePage() {
  const router = useRouter();
  const createArticle = useMutation(api.articles.createArticle);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string | undefined>();
  const [articleType, setArticleType] = useState<
    "scientific" | "expert" | "opinion" | "news" | "tutorial" | "other"
  >("other");
  const [status, setStatus] = useState<"draft" | "pending" | "published">(
    "draft"
  );
  const [loading, setLoading] = useState(false);
  const [createdArticleId, setCreatedArticleId] = useState<
    Id<"articles"> | null
  >(null);

  // Auto-générer le slug à partir du titre
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(newTitle));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    if (!slug.trim()) {
      toast.error("Le slug est requis");
      return;
    }

    if (!summary.trim()) {
      toast.error("Le résumé est requis");
      return;
    }

    if (!content.trim()) {
      toast.error("Le contenu est requis");
      return;
    }

    if (tags.length === 0) {
      toast.error("Ajoutez au moins un tag");
      return;
    }

    setLoading(true);

    try {
      const result = await createArticle({
        title: title.trim(),
        slug: slug.trim(),
        summary: summary.trim(),
        content: content.trim(),
        tags,
        coverImage,
        articleType,
        status,
      });

      toast.success(
        status === "published"
          ? "Article publié avec succès"
          : "Article sauvegardé en brouillon"
      );

      // Stocker l'ID de l'article créé pour afficher le ClaimsManager
      setCreatedArticleId(result.articleId);

      // Si publié, rediriger vers l'article, sinon rester sur la page pour ajouter des claims
      if (status === "published") {
        router.push(`/discover/articles/${slug}`);
      }
    } catch (error: any) {
      console.error("Erreur création article:", error);
      toast.error(error.message || "Erreur lors de la création de l'article");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="mb-6">
        <Link
          href="/discover/articles"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux articles
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gradient-light">
          Nouvel article
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Créez un nouvel article avec toutes les fonctionnalités du rich editor
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations de base</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Titre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Titre de votre article"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">
                Slug <span className="text-destructive">*</span>
              </Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="url-de-votre-article"
                required
              />
              <p className="text-xs text-muted-foreground">
                L'URL de votre article sera : /articles/{slug || "..."}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">
                Résumé <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Résumé court de votre article (1-2 phrases)"
                rows={3}
                required
              />
              <p className="text-xs text-muted-foreground">
                {summary.length}/200 caractères
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="articleType">
                  Type d'article <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={articleType}
                  onValueChange={(value: any) => setArticleType(value)}
                >
                  <SelectTrigger id="articleType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ARTICLE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">
                  Statut <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={status}
                  onValueChange={(value: any) => setStatus(value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="pending">
                      En attente de modération
                    </SelectItem>
                    <SelectItem value="published">Publier maintenant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contenu</CardTitle>
          </CardHeader>
          <CardContent>
            <RichTextEditor
              value={content}
              onChange={setContent}
              label="Contenu de l'article"
              description="Utilisez l'éditeur pour formater votre contenu"
              placeholder="Commencez à écrire votre article..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métadonnées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImageUpload
              value={coverImage}
              onChange={setCoverImage}
              label="Image de couverture"
              description="Image principale de votre article (optionnel)"
            />

            <TagsInput
              value={tags}
              onChange={setTags}
              label="Tags"
              description="Ajoutez des tags pour catégoriser votre article"
              placeholder="Appuyez sur Entrée pour ajouter un tag"
            />
          </CardContent>
        </Card>

        {createdArticleId && (
          <ClaimsManager articleId={createdArticleId} />
        )}

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : status === "published" ? (
              "Publier l'article"
            ) : (
              "Enregistrer en brouillon"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

