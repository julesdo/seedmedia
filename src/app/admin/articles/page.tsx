"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminArticlesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const allArticles = useQuery(api.admin.getAllArticles, {
    limit: 100,
    search: searchQuery || undefined,
    status: statusFilter || undefined,
  });
  const updateArticle = useMutation(api.admin.updateArticleAdmin);
  const deleteArticle = useMutation(api.admin.deleteArticleAdmin);

  const selectedArticle = useMemo(() => {
    if (!selectedArticleId || !allArticles) return null;
    return allArticles.find((a) => a._id === selectedArticleId);
  }, [selectedArticleId, allArticles]);

  const handleArticleClick = (articleId: string) => {
    setSelectedArticleId(articleId);
    setIsDialogOpen(true);
  };

  const handleDelete = async (articleId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.")) {
      return;
    }

    try {
      await deleteArticle({ articleId });
      toast.success("Article supprimé avec succès");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
    }
  };

  if (allArticles === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 max-w-7xl">
          <div className="space-y-6">
            <Skeleton className="h-12 w-1/3" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-8 space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold">Gestion des articles</h1>
          <p className="text-lg text-muted-foreground">
            Modifier tous les articles, bypasser les validations, changer les statuts (super admin)
          </p>
          <Badge variant="destructive">⚠️ Modifications sans validation</Badge>
        </div>

        {/* Filtres */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <SolarIcon
              icon="magnifer-bold"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
            />
            <Input
              type="text"
              placeholder="Rechercher un article (titre, résumé, slug)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="published">Publié</SelectItem>
              <SelectItem value="rejected">Rejeté</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Liste des articles */}
        <div className="space-y-4">
          {allArticles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Aucun article trouvé</p>
              </CardContent>
            </Card>
          ) : (
            allArticles.map((article) => (
              <Card key={article._id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold line-clamp-2">{article.title}</h3>
                        <Badge
                          variant={
                            article.status === "published"
                              ? "default"
                              : article.status === "pending"
                              ? "secondary"
                              : article.status === "rejected"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {article.status}
                        </Badge>
                        {article.featured && (
                          <Badge variant="outline">
                            <SolarIcon icon="star-bold" className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{article.summary}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Slug: {article.slug}</span>
                        <span>Vues: {article.views || 0}</span>
                        <span>Score: {article.qualityScore || 0}</span>
                        <span>Type: {article.articleType}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={() => handleArticleClick(article._id)} variant="outline" size="sm">
                        Modifier
                      </Button>
                      <Button
                        onClick={() => handleDelete(article._id)}
                        variant="destructive"
                        size="sm"
                      >
                        <SolarIcon icon="trash-bin-trash-bold" className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Dialog de modification */}
        {selectedArticle && (
          <ArticleEditDialog
            article={selectedArticle}
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onUpdate={updateArticle}
          />
        )}
      </div>
    </div>
  );
}

function ArticleEditDialog({
  article,
  open,
  onOpenChange,
  onUpdate,
}: {
  article: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: any;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: article.title || "",
    slug: article.slug || "",
    summary: article.summary || "",
    status: article.status || "draft",
    articleType: article.articleType || "scientific",
    featured: article.featured || false,
    qualityScore: article.qualityScore || 0,
    views: article.views || 0,
    reactions: article.reactions || 0,
    comments: article.comments || 0,
    sourcesCount: article.sourcesCount || 0,
    verifiedClaimsCount: article.verifiedClaimsCount || 0,
    totalClaimsCount: article.totalClaimsCount || 0,
    expertReviewCount: article.expertReviewCount || 0,
    communityVerificationScore: article.communityVerificationScore || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onUpdate({
        articleId: article._id,
        updates: {
          title: formData.title || undefined,
          slug: formData.slug || undefined,
          summary: formData.summary || undefined,
          status: formData.status as any,
          articleType: formData.articleType as any,
          featured: formData.featured,
          qualityScore: formData.qualityScore,
          views: formData.views,
          reactions: formData.reactions,
          comments: formData.comments,
          sourcesCount: formData.sourcesCount,
          verifiedClaimsCount: formData.verifiedClaimsCount,
          totalClaimsCount: formData.totalClaimsCount,
          expertReviewCount: formData.expertReviewCount,
          communityVerificationScore: formData.communityVerificationScore,
        },
      });

      toast.success("Article mis à jour avec succès");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'article</DialogTitle>
          <DialogDescription>
            ⚠️ Super admin : Toutes les modifications sont possibles sans validation
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="articleType">Type d'article</Label>
              <Select
                value={formData.articleType}
                onValueChange={(value: any) => setFormData({ ...formData, articleType: value })}
              >
                <SelectTrigger id="articleType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scientific">Scientifique</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                  <SelectItem value="opinion">Opinion</SelectItem>
                  <SelectItem value="news">Actualité</SelectItem>
                  <SelectItem value="tutorial">Tutoriel</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Résumé</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="published">Publié</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qualityScore">Score qualité</Label>
              <Input
                id="qualityScore"
                type="number"
                min="0"
                max="100"
                value={formData.qualityScore}
                onChange={(e) => setFormData({ ...formData, qualityScore: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="views">Vues</Label>
              <Input
                id="views"
                type="number"
                min="0"
                value={formData.views}
                onChange={(e) => setFormData({ ...formData, views: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reactions">Réactions</Label>
              <Input
                id="reactions"
                type="number"
                min="0"
                value={formData.reactions}
                onChange={(e) => setFormData({ ...formData, reactions: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comments">Commentaires</Label>
              <Input
                id="comments"
                type="number"
                min="0"
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sourcesCount">Sources</Label>
              <Input
                id="sourcesCount"
                type="number"
                min="0"
                value={formData.sourcesCount}
                onChange={(e) => setFormData({ ...formData, sourcesCount: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="verifiedClaimsCount">Claims vérifiés</Label>
              <Input
                id="verifiedClaimsCount"
                type="number"
                min="0"
                value={formData.verifiedClaimsCount}
                onChange={(e) =>
                  setFormData({ ...formData, verifiedClaimsCount: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalClaimsCount">Total claims</Label>
              <Input
                id="totalClaimsCount"
                type="number"
                min="0"
                value={formData.totalClaimsCount}
                onChange={(e) => setFormData({ ...formData, totalClaimsCount: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="featured"
              checked={formData.featured}
              onCheckedChange={(checked) => setFormData({ ...formData, featured: !!checked })}
            />
            <Label htmlFor="featured" className="cursor-pointer">
              Article en vedette
            </Label>
          </div>

          <Alert variant="destructive">
            <SolarIcon icon="danger-triangle-bold" className="h-4 w-4" />
            <AlertDescription>
              Toutes les modifications sont appliquées immédiatement sans validation. Vous pouvez bypasser toutes les règles.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading} variant="destructive">
              {loading ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

