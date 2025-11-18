"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTransitionRouter } from "next-view-transitions";
import { useQuery, useMutation } from "convex/react";

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
import { Link } from "next-view-transitions";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "../../../../../../../convex/_generated/api";

const ARTICLE_TYPES = [
  { value: "scientific", label: "Scientifique" },
  { value: "expert", label: "Expert" },
  { value: "opinion", label: "Opinion" },
  { value: "news", label: "Actualité" },
  { value: "tutorial", label: "Tutoriel" },
  { value: "other", label: "Autre" },
] as const;

export default function EditArticlePage() {
  const router = useTransitionRouter();
  const params = useParams();
  const slug = params.slug as string;

  const article = useQuery(api.articles.getArticleBySlug, { slug });
  const updateArticle = useMutation(api.articles.updateArticle);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string | undefined>();
  const [articleType, setArticleType] = useState<
    "scientific" | "expert" | "opinion" | "news" | "tutorial" | "other"
  >("other");
  const [status, setStatus] = useState<
    "draft" | "pending" | "published" | "rejected"
  >("draft");
  const [loading, setLoading] = useState(false);

  // Charger les données de l'article
  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setSummary(article.summary);
      setContent(article.content);
      setTags(article.tags);
      setCoverImage(article.coverImage);
      setArticleType(article.articleType);
      setStatus(article.status);
    }
  }, [article]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!article) {
      toast.error("Article introuvable");
      return;
    }

    // Validation
    if (!title.trim()) {
      toast.error("Le titre est requis");
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
      await updateArticle({
        articleId: article._id,
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        tags,
        coverImage,
        articleType,
        status,
      });

      toast.success("Article mis à jour avec succès");

      // Rediriger vers l'article
      router.push(`/discover/articles/${slug}`);
    } catch (error: any) {
      console.error("Erreur mise à jour article:", error);
      toast.error(error.message || "Erreur lors de la mise à jour de l'article");
    } finally {
      setLoading(false);
    }
  };

  if (article === undefined) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (article === null) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Article introuvable</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/discover/articles">Retour aux articles</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="mb-6">
        <Link
          href={`/discover/articles/${slug}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à l'article
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gradient-light">
          Éditer l'article
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Modifiez votre article avec toutes les fonctionnalités du rich editor
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
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre de votre article"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Le slug ne peut pas être modifié après la création
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
                    <SelectItem value="published">Publié</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
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

        {article && (
          <ClaimsManager articleId={article._id} />
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
            ) : (
              "Enregistrer les modifications"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

