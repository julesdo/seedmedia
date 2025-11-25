"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { PlateEditorWrapper } from "@/components/articles/PlateEditorWrapper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Author } from "@/components/articles/Author";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { ArticleVotes } from "@/components/articles/ArticleVotes";
import { ContributionNudge } from "@/components/articles/ContributionNudge";
import { ArticleSources } from "@/components/articles/ArticleSources";
import { CommentsSection } from "@/components/comments/CommentsSection";
import Image from "next/image";
import { useEffect, useRef } from "react";

export default function PublicArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { isAuthenticated } = useConvexAuth();
  const hasIncrementedViews = useRef(false);

  // Récupérer l'article par slug
  const article = useQuery(api.articles.getArticleBySlug, { slug });
  
  // Mutation pour incrémenter les vues
  const incrementViews = useMutation(api.content.incrementViews);

  // Incrémenter les vues une seule fois quand l'article est chargé
  useEffect(() => {
    if (article?._id && article.status === "published" && !hasIncrementedViews.current) {
      hasIncrementedViews.current = true;
      
      // Récupérer l'IP du client
      fetch("/api/get-ip")
        .then((res) => res.json())
        .then((data) => {
          incrementViews({ 
            targetType: "article",
            targetId: article._id,
            viewerIp: data.ip || undefined
          }).catch((error) => {
            console.error("Erreur lors de l'incrémentation des vues:", error);
          });
        })
        .catch((error) => {
          console.error("Erreur lors de la récupération de l'IP:", error);
          // Essayer quand même sans IP
          incrementViews({ 
            targetType: "article",
            targetId: article._id
          }).catch((err) => {
            console.error("Erreur lors de l'incrémentation des vues:", err);
          });
        });
    }
  }, [article?._id, article?.status, incrementViews]);

  // Charger les données associées
  const author = useQuery(
    api.users.getUserPublic,
    article?.authorId ? { userId: article.authorId } : "skip"
  );

  // Charger le débat associé si présent (on récupère via l'article qui a un debatId)
  // Note: Pour l'instant, on affiche juste un lien si debatId existe
  // Le débat sera récupéré sur la page débat dédiée

  // États de chargement
  if (article === undefined) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Article non trouvé
  if (article === null) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive">
          <SolarIcon icon="danger-triangle-bold" className="h-4 w-4" />
          <AlertDescription>
            Article non trouvé. Il a peut-être été supprimé ou n'existe pas encore.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Article non publié
  if (article.status !== "published") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert>
          <SolarIcon icon="info-circle-bold" className="h-4 w-4" />
          <AlertDescription>
            Cet article n'est pas encore publié.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const ARTICLE_TYPE_LABELS: Record<string, string> = {
    scientific: "Scientifique",
    expert: "Expert",
    opinion: "Opinion",
    news: "Actualité",
    tutorial: "Tutoriel",
    other: "Autre",
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-12 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <article className="space-y-8 min-w-0">
        {/* Header avec meta */}
        <header className="space-y-6">
          {/* Type et métriques */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs font-semibold">
                {ARTICLE_TYPE_LABELS[article.articleType] || article.articleType}
              </Badge>
              {article.categories && article.categories.length > 0 && (
                <>
                  {article.categories.map((category) => (
                    <span key={category._id} className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                      {category.icon && (
                        <SolarIcon icon={category.icon} className="h-3.5 w-3.5 shrink-0" />
                      )}
                      {category.name}
                    </span>
                  ))}
                </>
              )}
            </div>
            
            {/* Métriques gamifiées */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <SolarIcon icon="eye-bold" className="h-3.5 w-3.5" />
                <span className="font-medium">{article.views || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <SolarIcon icon="star-bold" className="h-3.5 w-3.5 text-yellow-500" />
                <span className="font-bold text-foreground">{article.qualityScore || 0}</span>
              </div>
            </div>
          </div>

          {/* Titre */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
            {article.title}
          </h1>
              
          {/* Meta auteur et date */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {author && (
              <Author
                author={author}
                variant="detailed"
                showCredibility
                size="md"
              />
            )}
            
            <span className="text-muted-foreground">•</span>
            
            <span className="text-muted-foreground">
              {formatDistanceToNow(new Date(article.publishedAt || article.createdAt), {
                addSuffix: true,
                locale: fr,
              })}
            </span>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span key={tag} className="text-xs text-muted-foreground">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Image de couverture */}
        {article.coverImage && (
          <div className="relative w-full aspect-video overflow-hidden rounded-lg border border-border">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <Separator />

        {/* Résumé (TL;DR) */}
        {article.summary && (
          <div className="border-l-4 border-primary/30 pl-4 py-2 bg-muted/30 rounded-r">
            <div className="flex items-center gap-2 mb-2">
              <SolarIcon icon="document-text-bold" className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">TL;DR</span>
            </div>
            <p className="text-base leading-relaxed text-foreground">{article.summary}</p>
          </div>
        )}

        {/* Structure obligatoire */}
        <div className="space-y-10">
          {/* Thèse / Problème */}
          {article.these && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <SolarIcon icon="lightbulb-bold" className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Thèse / Problème</h2>
              </div>
              <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground">{article.these}</p>
            </section>
          )}

          {/* Développement */}
          {article.content && (
            <section className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
              <PlateEditorWrapper
                value={article.content}
                readOnly={true}
                placeholder=""
              />
            </section>
          )}

          {/* Contre-arguments */}
          {article.counterArguments && article.counterArguments.length > 0 && (
            <section className="space-y-3 border-l-4 border-destructive/30 pl-4 py-2 bg-destructive/5 rounded-r">
              <div className="flex items-center gap-2 pb-2">
                <SolarIcon icon="danger-triangle-bold" className="h-5 w-5 text-destructive" />
                <h2 className="text-xl font-bold">
                  Contre-arguments
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({article.counterArguments.length})
                  </span>
                </h2>
              </div>
              <ul className="space-y-3 list-none pl-0">
                {article.counterArguments.map((arg, index) => (
                  <li key={index} className="flex gap-3 text-base leading-relaxed">
                    <span className="text-destructive shrink-0 mt-1">•</span>
                    <span>{arg}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Conclusion */}
          {article.conclusion && (
            <section className="space-y-3 border-l-4 border-primary/30 pl-4 py-2 bg-primary/5 rounded-r">
              <div className="flex items-center gap-2 pb-2">
                <SolarIcon icon="check-circle-bold" className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Conclusion</h2>
                <span className="text-xs text-muted-foreground font-normal">(orientée solutions)</span>
              </div>
              <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground">{article.conclusion}</p>
            </section>
          )}

          {/* Sources */}
          {article._id && (
            <section>
              <ArticleSources articleId={article._id} />
            </section>
          )}
        </div>

        {/* Débat associé */}
        {article.debatId && (
          <>
            <Separator />
            <div className="border-l-4 border-primary/30 pl-4 py-3 bg-primary/5 rounded-r">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <SolarIcon icon="chat-round-bold" className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold">Débat associé</h3>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/debats?articleId=${article._id}`}>
                    Voir le débat
                    <SolarIcon icon="alt-arrow-right-bold" className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Cet article est associé à un débat. Consultez les arguments pour et contre.
              </p>
            </div>
          </>
        )}

        {/* Mobile: Votes et Contribution */}
        {article._id && (
          <>
            <Separator className="lg:hidden" />
            <div className="space-y-6 lg:hidden">
              <ArticleVotes articleId={article._id} />
              <ContributionNudge
                articleId={article._id}
                articleTitle={article.title}
                sourcesCount={article.sourcesCount || 0}
                counterArgumentsCount={article.counterArguments?.length || 0}
              />
            </div>
          </>
        )}
        </article>

        {/* Sidebar sticky avec contribution et votes */}
        {article._id && (
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Votes */}
              <ArticleVotes articleId={article._id} />

              {/* Nudge de contribution */}
              <ContributionNudge
                articleId={article._id}
                articleTitle={article.title}
                sourcesCount={article.sourcesCount || 0}
                counterArgumentsCount={article.counterArguments?.length || 0}
              />
            </div>
          </aside>
        )}
      </div>

      {/* Section commentaires */}
      {article._id && article.status === "published" && (
        <div className="mt-12">
          <CommentsSection targetType="article" targetId={article._id} />
        </div>
      )}
    </div>
  );
}

