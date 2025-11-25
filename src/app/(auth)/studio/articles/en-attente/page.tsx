"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "next-view-transitions";
import { Badge } from "@/components/ui/badge";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale/fr";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Author } from "@/components/articles/Author";
import { Id } from "../../../../../../convex/_generated/dataModel";

export default function PendingArticlesPage() {
  const pendingArticles = useQuery(api.articles.getPendingArticles, {
    limit: 50,
  });
  const approveArticle = useMutation(api.articles.approveArticle);
  const rejectArticle = useMutation(api.articles.rejectArticle);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<Id<"articles"> | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleApprove = async (articleId: Id<"articles">) => {
    try {
      await approveArticle({ articleId });
      toast.success("Article approuvé et publié");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'approbation");
    }
  };

  const handleReject = async () => {
    if (!selectedArticleId) return;

    try {
      await rejectArticle({
        articleId: selectedArticleId,
        reason: rejectReason || undefined,
      });
      toast.success("Article rejeté");
      setRejectDialogOpen(false);
      setSelectedArticleId(null);
      setRejectReason("");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du rejet");
    }
  };

  if (pendingArticles === undefined) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Articles en attente</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les articles soumis par les contributeurs pour relecture et publication.
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

  const articles = pendingArticles || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Articles en attente</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les articles soumis par les contributeurs pour relecture et publication.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <SolarIcon icon="document-bold" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{articles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <SolarIcon icon="clock-circle-bold" className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{articles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score moyen</CardTitle>
            <SolarIcon icon="star-bold" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {articles.length > 0
                ? Math.round(
                    articles.reduce((sum: number, a: any) => sum + (a.qualityScore || 0), 0) /
                      articles.length
                  )
                : 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sources moyennes</CardTitle>
            <SolarIcon icon="document-text-bold" className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {articles.length > 0
                ? Math.round(
                    articles.reduce((sum: number, a: any) => sum + (a.sourcesCount || 0), 0) /
                      articles.length
                  )
                : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des articles */}
      <Card>
        <CardHeader>
          <CardTitle>Articles à valider ({articles.length})</CardTitle>
          <CardDescription>
            Liste des articles en attente de votre approbation ou rejet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {articles.length === 0 ? (
            <div className="text-center py-12">
              <SolarIcon icon="check-circle-bold" className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun article en attente</h3>
              <p className="text-sm text-muted-foreground">
                Tous les articles ont été traités.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="max-w-xs">Titre</TableHead>
                  <TableHead>Auteur</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Sources</TableHead>
                  <TableHead>Vues</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article: any) => {
                  const submittedDate = new Date(article.createdAt);

                  return (
                    <TableRow key={article._id}>
                      <TableCell className="font-medium max-w-xs">
                        <Link
                          href={`/studio/articles/${article.slug || article._id}`}
                          className="hover:text-primary transition-colors line-clamp-2"
                        >
                          {article.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {article.author ? (
                          <Author
                            author={article.author}
                            variant="compact"
                            size="sm"
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">Inconnu</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {article.articleType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <SolarIcon icon="star-bold" className="h-3 w-3" />
                          <span className="text-sm">{article.qualityScore || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <SolarIcon icon="document-text-bold" className="h-3 w-3" />
                          <span className="text-sm">{article.sourcesCount || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <SolarIcon icon="eye-bold" className="h-3 w-3" />
                          <span className="text-sm">{article.views || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(submittedDate, {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(article._id)}
                        >
                          <SolarIcon icon="check-circle-bold" className="h-4 w-4 mr-2" />
                          Approuver
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedArticleId(article._id);
                            setRejectDialogOpen(true);
                          }}
                        >
                          <SolarIcon icon="close-circle-bold" className="h-4 w-4 mr-2" />
                          Rejeter
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de rejet */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter l'article</DialogTitle>
            <DialogDescription>
              Veuillez fournir une raison pour le rejet de cet article. Cette raison sera communiquée à l'auteur.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleReject(); }} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Raison du rejet (optionnel)</Label>
              <Textarea
                id="rejectionReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex: Manque de sources, arguments non étayés, hors sujet..."
                rows={5}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" variant="destructive">
                <SolarIcon icon="close-circle-bold" className="h-4 w-4 mr-2" />
                Confirmer le rejet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

