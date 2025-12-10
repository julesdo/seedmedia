"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { LatestArticleHero } from "@/components/home/LatestArticleHero";
import { Button } from "@/components/ui/button";
import { Link } from "next-view-transitions";
import { SolarIcon } from "@/components/icons/SolarIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { Id } from "../../../convex/_generated/dataModel";
import { useMemo } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Author } from "@/components/articles/Author";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { HeroWidget } from "@/components/home/HeroWidget";
import { PlatformStats } from "@/components/home/PlatformStats";
import { TrendingTopics } from "@/components/home/TrendingTopics";
import { ActiveActions } from "@/components/home/ActiveActions";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { SeedManifest } from "@/components/home/SeedManifest";

export default function PublicHomePage() {
  // Récupérer les articles
  const latestArticles = useQuery(api.content.getLatestArticles, { limit: 1 });
  const allArticles = useQuery(api.content.getLatestArticles, { limit: 12 });
  const dossiers = useQuery(api.dossiers.getDossiers, { limit: 3, featured: true });
  const projects = useQuery(api.projects.getProjects, { limit: 6 });
  const topExperts = useQuery(api.credibility.getTopExperts, { limit: 5 });
  const openProposals = useQuery(api.governance.getOpenProposals, { limit: 3 });

  // Dernier article pour le hero
  const latestArticle = useMemo(() => {
    if (!latestArticles || latestArticles.length === 0) return null;
    return latestArticles[0];
  }, [latestArticles]);

  // Articles pour la grille (sans le premier qui est en hero)
  const gridArticles = useMemo(() => {
    if (!allArticles) return [];
    return allArticles.slice(1, 13);
  }, [allArticles]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="w-full">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hero Article */}
            <div className="lg:col-span-2 h-[400px] md:h-[500px]">
              {latestArticle && latestArticle.author ? (
                <LatestArticleHero article={latestArticle} />
              ) : (
                <Skeleton className="h-full w-full rounded-lg" />
              )}
            </div>

            {/* Widget */}
            <div className="h-[400px] md:h-[500px]">
              <HeroWidget />
            </div>
          </div>
        </div>
      </section>

      {/* Contenu principal - Layout média avec sidebar */}
      <section className="container mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-10 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Colonne principale - Articles */}
          <main className="lg:col-span-8 space-y-8">
            {/* Section "What's new" - Grille d'articles */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold">What's new</h2>
                  <p className="text-xs text-muted-foreground mt-1">Découvrez les derniers articles publiés</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/articles">
                    Voir tout
                  </Link>
                </Button>
              </div>

              {/* Grille d'articles - 2 colonnes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {gridArticles.length === 0 ? (
                  <div className="col-span-2 text-center py-12 text-muted-foreground">
                    <p>Aucun article pour le moment.</p>
                  </div>
                ) : (
                  gridArticles.map((article) => (
                    <ArticleCard key={article._id} article={article} />
                  ))
                )}
              </div>

              {/* Bouton "Load More" */}
              {gridArticles.length >= 12 && (
                <div className="mt-8 text-center">
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/articles">
                      Encore {allArticles && allArticles.length > 12 ? allArticles.length - 12 : 0} articles à charger
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Section Dossiers */}
            {dossiers && dossiers.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold">Dossiers thématiques</h2>
                    <p className="text-xs text-muted-foreground mt-1">Explorez nos dossiers approfondis</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dossiers">
                      Tout voir
                      <SolarIcon icon="arrow-right-bold" className="h-3.5 w-3.5 ml-1.5" />
                    </Link>
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {dossiers.map((dossier) => (
                    <Link key={dossier._id} href={`/dossiers/${dossier.slug}`}>
                      <article className="group cursor-pointer">
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-4 bg-muted">
                          {dossier.coverImage ? (
                            <Image
                              src={dossier.coverImage}
                              alt={dossier.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center">
                              <SolarIcon icon="folder-bold" className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="text-lg font-bold group-hover:opacity-80 transition-opacity line-clamp-2">
                            {dossier.title}
                          </h3>
                          {dossier.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {dossier.description}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <SolarIcon icon="document-text-bold" className="h-3.5 w-3.5" />
                            <span>{dossier.articlesCount || 0} articles</span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Section Projets */}
            {projects !== undefined && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold">Derniers projets</h2>
                    <p className="text-xs text-muted-foreground mt-1">Découvrez les projets innovants de la communauté</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/projets">
                      Tout voir
                    </Link>
                  </Button>
                </div>
                {projects.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Aucun projet pour le moment.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                      <Link key={project._id} href={`/projets/${project.slug}`}>
                      <article className="group cursor-pointer">
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-4 bg-muted">
                          {project.images && project.images.length > 0 ? (
                            <Image
                              src={project.images[0]}
                              alt={project.title}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center">
                              <SolarIcon icon="rocket-2-bold" className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="text-lg font-bold group-hover:opacity-80 transition-opacity line-clamp-2">
                            {project.title}
                          </h3>
                          {project.summary && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {project.summary}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <SolarIcon icon="eye-bold" className="h-3.5 w-3.5" />
                            <span>{project.views || 0} vues</span>
                            {project.stage && (
                              <>
                                <span>•</span>
                                <span>
                                  {project.stage === "idea" ? "Idée" : 
                                   project.stage === "prototype" ? "Prototype" :
                                   project.stage === "beta" ? "Bêta" : "Production"}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </article>
                    </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

          </main>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Manifeste Seed - Présentation de la plateforme */}
            <SeedManifest />

            {/* Trending Topics */}
            <TrendingTopics />

            {/* Statistiques de la plateforme */}
            <PlatformStats />

            {/* Actions actives */}
            <ActiveActions />

            {/* Top Experts */}
            {topExperts && topExperts.length > 0 && (
              <div className="border-b border-border/60 pb-6">
                <h3 className="font-bold text-base mb-4">Top experts</h3>
                <div className="space-y-0">
                  {topExperts.map((expert, index) => (
                    <div key={expert._id}>
                      <Link
                        href={`/users/${expert._id}`}
                        className="flex items-center gap-2.5 py-2.5 group"
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={expert.image || undefined} alt={expert.name || "Expert"} />
                          <AvatarFallback className="text-xs">{expert.name?.[0]?.toUpperCase() || "E"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm group-hover:opacity-80 transition-opacity truncate">
                            {expert.name || "Expert"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Score: {expert.credibilityScore || 0}
                          </p>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          #{index + 1}
                        </span>
                      </Link>
                      {index < topExperts.length - 1 && <Separator className="border-border/60" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Newsletter */}
            <div className="border-b border-border/60 pb-6">
              <h3 className="font-bold text-base mb-2">Newsletter</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Recevez les derniers articles directement dans votre boîte mail
              </p>
              <Button className="w-full" size="sm" variant="accent" disabled>
                Coming soon
              </Button>
            </div>

            {/* Gouvernance */}
            <div className="border-b border-border/60 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base">Gouvernance</h3>
                <Link href="/gouvernance" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Voir tout
                </Link>
              </div>
              {openProposals === undefined ? (
                <Skeleton className="h-16 w-full" />
              ) : openProposals && openProposals.length > 0 ? (
                <div className="space-y-0">
                  {openProposals.slice(0, 2).map((proposal, index) => (
                    <div key={proposal._id}>
                      <Link
                        href={`/gouvernance/${proposal.slug}`}
                        className="block py-3 group"
                      >
                        <h4 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-1.5">
                          {proposal.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{proposal.votesFor || 0} pour</span>
                          <span>•</span>
                          <span>{proposal.votesAgainst || 0} contre</span>
                        </div>
                      </Link>
                      {index < Math.min(openProposals.length, 2) - 1 && <Separator className="border-border/60" />}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Aucune proposition en cours
                </p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
