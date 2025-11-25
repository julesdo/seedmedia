"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { LatestArticleHero } from "@/components/home/LatestArticleHero";
import { Button } from "@/components/ui/button";
import { Link } from "next-view-transitions";
import { Card, CardContent } from "@/components/ui/card";
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
import { CategoriesBar } from "@/components/home/CategoriesBar";
import { HeroWidget } from "@/components/home/HeroWidget";
import { PlatformStats } from "@/components/home/PlatformStats";
import { TrendingTopics } from "@/components/home/TrendingTopics";
import { ActiveActions } from "@/components/home/ActiveActions";

export default function PublicHomePage() {
  // Récupérer les articles
  const latestArticles = useQuery(api.content.getLatestArticles, { limit: 1 });
  const allArticles = useQuery(api.content.getLatestArticles, { limit: 12 });
  const dossiers = useQuery(api.dossiers.getDossiers, { limit: 3, featured: true });
  const debats = useQuery(api.debates.getOpenDebates, { limit: 3 });
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

      {/* Barre de catégories */}
      <CategoriesBar />

      {/* Contenu principal - Layout média avec sidebar */}
      <section className="container mx-auto px-4 md:px-6 lg:px-8 py-12 md:py-16 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Colonne principale - Articles */}
          <main className="lg:col-span-8 space-y-12">
            {/* Section "What's new" - Grille d'articles */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold">What's new</h2>
                  <p className="text-sm text-muted-foreground mt-1">Découvrez les derniers articles publiés</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/articles">
                    Voir tout
                    <SolarIcon icon="arrow-right-bold" className="h-4 w-4 ml-2" />
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
                  gridArticles.map((article) => {
                    const publishedDate = article.publishedAt
                      ? new Date(article.publishedAt)
                      : new Date(article.createdAt);

                    return (
                      <Link key={article._id} href={`/articles/${article.slug}`}>
                        <article className="group cursor-pointer">
                          {/* Image */}
                          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg mb-4 bg-muted">
                            {article.coverImage ? (
                              <Image
                                src={article.coverImage}
                                alt={article.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center">
                                <SolarIcon icon="document-text-bold" className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Contenu */}
                          <div className="space-y-3">
                            {/* Métadonnées */}
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              {article.author && (
                                <Author
                                  author={article.author}
                                  variant="default"
                                  size="sm"
                                  showDate
                                  date={publishedDate}
                                />
                              )}
                            </div>

                            {/* Titre */}
                            <h3 className="text-xl font-bold leading-tight group-hover:opacity-80 transition-opacity line-clamp-2">
                              {article.title}
                            </h3>

                            {/* Résumé */}
                            {article.summary && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {article.summary}
                              </p>
                            )}

                            {/* Catégories et Tags */}
                            <div className="flex flex-wrap gap-2 items-center">
                              {article.categories && article.categories.length > 0 && (
                                <>
                                  {article.categories.slice(0, 2).map((category) => (
                                    <span key={category?._id} className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                                      {category?.icon && (
                                        <SolarIcon icon={category?.icon} className="h-3 w-3 shrink-0" />
                                      )}
                                      {category?.name}
                                    </span>
                                  ))}
                                </>
                              )}
                              {article.tags && article.tags.length > 0 && (
                                <>
                                  {article.categories && article.categories.length > 0 && <span className="text-xs text-muted-foreground">•</span>}
                                  {article.tags.slice(0, 2).map((tag) => (
                                    <span key={tag} className="text-xs text-muted-foreground">
                                      #{tag}
                                    </span>
                                  ))}
                                </>
                              )}
                            </div>
                          </div>
                        </article>
                      </Link>
                    );
                  })
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
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold">Dossiers thématiques</h2>
                    <p className="text-sm text-muted-foreground mt-1">Explorez nos dossiers approfondis</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dossiers">
                      Tout voir
                      <SolarIcon icon="arrow-right-bold" className="h-4 w-4 ml-2" />
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
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold group-hover:opacity-80 transition-opacity line-clamp-2">
                            {dossier.title}
                          </h3>
                          {dossier.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {dossier.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <SolarIcon icon="document-text-bold" className="h-4 w-4" />
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
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold">Derniers projets</h2>
                    <p className="text-sm text-muted-foreground mt-1">Découvrez les projets innovants de la communauté</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/projets">
                      Tout voir
                      <SolarIcon icon="arrow-right-bold" className="h-4 w-4 ml-2" />
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
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold group-hover:opacity-80 transition-opacity line-clamp-2">
                            {project.title}
                          </h3>
                          {project.summary && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {project.summary}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <SolarIcon icon="eye-bold" className="h-4 w-4" />
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

            {/* Section Débats */}
            {debats && debats.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold">Débats ouverts</h2>
                    <p className="text-sm text-muted-foreground mt-1">Participez aux discussions en cours</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/debats">
                      Tout voir
                      <SolarIcon icon="arrow-right-bold" className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
                <div className="space-y-4">
                  {debats.map((debat) => (
                    <Link key={debat._id} href={`/debats/${debat.slug}`}>
                      <article className="group border-l-4 border-transparent hover:border-primary transition-colors cursor-pointer p-6">
                        <div className="space-y-3">
                          <h3 className="text-xl font-bold group-hover:opacity-80 transition-opacity">
                            {debat.question}
                          </h3>
                          {debat.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {debat.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <SolarIcon icon="check-circle-bold" className="h-4 w-4 text-green-500" />
                              {debat.argumentsForCount || 0} pour
                            </span>
                            <span className="flex items-center gap-1">
                              <SolarIcon icon="close-circle-bold" className="h-4 w-4 text-red-500" />
                              {debat.argumentsAgainstCount || 0} contre
                            </span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </main>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            {/* Trending Topics */}
            <TrendingTopics />

            {/* Statistiques de la plateforme */}
            <PlatformStats />

            {/* Actions actives */}
            <ActiveActions />

            {/* Top Experts */}
            {topExperts && topExperts.length > 0 && (
              <div className="border-b border-border pb-8">
                <h3 className="font-bold text-lg mb-6">Top experts</h3>
                <div className="space-y-0">
                  {topExperts.map((expert, index) => (
                    <div key={expert._id}>
                      <Link
                        href={`/users/${expert._id}`}
                        className="flex items-center gap-3 py-3 group"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={undefined} />
                          <AvatarFallback className="text-xs">{expert.name?.[0]?.toUpperCase() || "E"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm group-hover:opacity-80 transition-opacity truncate">
                            {expert.name || "Expert"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Score: {expert.credibilityScore || 0}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          #{index + 1}
                        </span>
                      </Link>
                      {index < topExperts.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Newsletter */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">Newsletter</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Recevez les derniers articles directement dans votre boîte mail
                </p>
                <Button className="w-full" size="sm">
                  S'abonner
                </Button>
              </CardContent>
            </Card>

            {/* Gouvernance */}
            <div className="border-b border-border pb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg">Gouvernance</h3>
                <Link href="/gouvernance" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Voir tout
                </Link>
              </div>
              {openProposals === undefined ? (
                <Skeleton className="h-20 w-full" />
              ) : openProposals && openProposals.length > 0 ? (
                <div className="space-y-0">
                  {openProposals.slice(0, 2).map((proposal, index) => (
                    <div key={proposal._id}>
                      <Link
                        href={`/gouvernance/${proposal.slug}`}
                        className="block py-3 group"
                      >
                        <h4 className="font-semibold text-sm line-clamp-2 group-hover:opacity-80 transition-opacity mb-2">
                          {proposal.title}
                        </h4>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <SolarIcon icon="check-circle-bold" className="h-3 w-3" />
                            {proposal.votesFor || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <SolarIcon icon="close-circle-bold" className="h-3 w-3" />
                            {proposal.votesAgainst || 0}
                          </span>
                        </div>
                      </Link>
                      {index < Math.min(openProposals.length, 2) - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
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
